import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { db } from "@workspace/db";
import { charactersTable, inventoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/jwt.js";
import { calcLevel, baseStats, xpToNextLevel } from "../lib/xp.js";
import { setOnlinePlayers } from "../routes/world.js";
import { logger } from "../lib/logger.js";

interface PlayerState {
  socketId: string;
  characterId: number;
  userId: number;
  name: string;
  level: number;
  class: string;
  mapId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  gold: number;
  kills: number;
  deaths: number;
}

interface EnemyState {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  loot: Array<{ itemKey: string; name: string; type: string; rarity: string; attackBonus: number; defenseBonus: number; hpBonus: number; description: string }>;
  lastMoveTime: number;
  targetX: number;
  targetY: number;
}

const ENEMY_TYPES = [
  { name: "Goblin", type: "goblin", hp: 40, attack: 6, defense: 2, xpReward: 15, goldReward: 5, loot: [{ itemKey: "goblin_dagger", name: "Rusty Dagger", type: "weapon", rarity: "common", attackBonus: 2, defenseBonus: 0, hpBonus: 0, description: "A crude dagger dropped by a goblin." }] },
  { name: "Skeleton", type: "skeleton", hp: 60, attack: 10, defense: 5, xpReward: 30, goldReward: 8, loot: [{ itemKey: "bone_shield", name: "Bone Shield", type: "armor", rarity: "common", attackBonus: 0, defenseBonus: 3, hpBonus: 0, description: "Made from bones of the fallen." }] },
  { name: "Dark Wolf", type: "wolf", hp: 50, attack: 14, defense: 3, xpReward: 25, goldReward: 6, loot: [{ itemKey: "wolf_fang", name: "Wolf Fang", type: "material", rarity: "uncommon", attackBonus: 0, defenseBonus: 0, hpBonus: 0, description: "A sharp fang from a dark wolf." }] },
  { name: "Orc Warrior", type: "orc", hp: 120, attack: 18, defense: 10, xpReward: 60, goldReward: 15, loot: [{ itemKey: "orc_axe", name: "Orc Battle Axe", type: "weapon", rarity: "uncommon", attackBonus: 6, defenseBonus: 0, hpBonus: 0, description: "A heavy axe wielded by orc warriors." }] },
  { name: "Shadow Mage", type: "mage", hp: 80, attack: 22, defense: 4, xpReward: 80, goldReward: 20, loot: [{ itemKey: "shadow_staff", name: "Shadow Staff", type: "weapon", rarity: "rare", attackBonus: 10, defenseBonus: 0, hpBonus: 0, description: "Pulsing with dark energy." }] },
  { name: "Dragon Whelp", type: "dragon", hp: 200, attack: 28, defense: 15, xpReward: 150, goldReward: 40, loot: [{ itemKey: "dragon_scale", name: "Dragon Scale", type: "armor", rarity: "epic", attackBonus: 0, defenseBonus: 12, hpBonus: 20, description: "Extremely durable scale." }] },
];

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;
const MAX_ENEMIES = 40;
const ENEMY_MOVE_INTERVAL = 2500;
const RESPAWN_DELAY = 5000;

const players = new Map<string, PlayerState>();
const enemies = new Map<string, EnemyState>();
let enemyIdCounter = 1;

function spawnEnemy(): EnemyState {
  const template = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]!;
  const id = `enemy_${enemyIdCounter++}`;
  return {
    id,
    name: template.name,
    type: template.type,
    x: 200 + Math.random() * (WORLD_WIDTH - 400),
    y: 200 + Math.random() * (WORLD_HEIGHT - 400),
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    defense: template.defense,
    xpReward: template.xpReward,
    goldReward: template.goldReward,
    loot: template.loot,
    lastMoveTime: Date.now(),
    targetX: 200 + Math.random() * (WORLD_WIDTH - 400),
    targetY: 200 + Math.random() * (WORLD_HEIGHT - 400),
  };
}

function fillEnemies() {
  while (enemies.size < MAX_ENEMIES) {
    const e = spawnEnemy();
    enemies.set(e.id, e);
  }
}

fillEnemies();

function moveEnemies(io: SocketIOServer) {
  const now = Date.now();
  for (const [id, enemy] of enemies) {
    if (now - enemy.lastMoveTime < ENEMY_MOVE_INTERVAL) continue;
    enemy.lastMoveTime = now;
    const dx = enemy.targetX - enemy.x;
    const dy = enemy.targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) {
      enemy.targetX = 200 + Math.random() * (WORLD_WIDTH - 400);
      enemy.targetY = 200 + Math.random() * (WORLD_HEIGHT - 400);
    } else {
      const speed = 40;
      enemy.x += (dx / dist) * speed;
      enemy.y += (dy / dist) * speed;
    }
    io.emit("enemy_moved", { id: enemy.id, x: enemy.x, y: enemy.y });
  }
}

function updateOnlinePlayers() {
  const map = new Map<number, { characterId: number; name: string; level: number; class: string; mapId: string }>();
  for (const p of players.values()) {
    map.set(p.characterId, { characterId: p.characterId, name: p.name, level: p.level, class: p.class, mapId: p.mapId });
  }
  setOnlinePlayers(map);
}

export function initSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  setInterval(() => moveEnemies(io), 500);

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("join", async ({ token }: { token: string }) => {
      let payload: { userId: number; characterId: number; username: string };
      try {
        payload = verifyToken(token);
      } catch {
        socket.emit("error", { message: "Invalid token" });
        socket.disconnect();
        return;
      }

      const [char] = await db
        .select()
        .from(charactersTable)
        .where(eq(charactersTable.id, payload.characterId))
        .limit(1);

      if (!char) {
        socket.emit("error", { message: "Character not found" });
        return;
      }

      const player: PlayerState = {
        socketId: socket.id,
        characterId: char.id,
        userId: char.userId,
        name: char.name,
        level: char.level,
        class: char.class,
        mapId: char.mapId,
        x: char.posX,
        y: char.posY,
        hp: char.hp,
        maxHp: char.maxHp,
        mp: char.mp,
        maxMp: char.maxMp,
        attack: char.attack,
        defense: char.defense,
        gold: char.gold,
        kills: char.kills,
        deaths: char.deaths,
      };

      players.set(socket.id, player);
      updateOnlinePlayers();

      const otherPlayers = Array.from(players.values())
        .filter((p) => p.socketId !== socket.id)
        .map((p) => ({
          characterId: p.characterId,
          name: p.name,
          level: p.level,
          class: p.class,
          x: p.x,
          y: p.y,
          hp: p.hp,
          maxHp: p.maxHp,
        }));

      const enemyList = Array.from(enemies.values()).map((e) => ({
        id: e.id,
        name: e.name,
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxHp: e.maxHp,
        type: e.type,
      }));

      socket.emit("world_state", { players: otherPlayers, enemies: enemyList });

      socket.broadcast.emit("player_joined", {
        characterId: char.id,
        name: char.name,
        level: char.level,
        class: char.class,
        x: char.posX,
        y: char.posY,
      });

      logger.info({ characterId: char.id, name: char.name }, "Player joined");
    });

    socket.on("move", ({ x, y }: { x: number; y: number }) => {
      const player = players.get(socket.id);
      if (!player) return;
      player.x = Math.max(0, Math.min(WORLD_WIDTH, x));
      player.y = Math.max(0, Math.min(WORLD_HEIGHT, y));
      socket.broadcast.emit("player_moved", { characterId: player.characterId, x: player.x, y: player.y });
    });

    socket.on("attack", async ({ targetId, targetType }: { targetId: string | number; targetType: "enemy" | "player" }) => {
      const attacker = players.get(socket.id);
      if (!attacker || attacker.hp <= 0) return;

      if (targetType === "enemy") {
        const enemy = enemies.get(String(targetId));
        if (!enemy) return;

        const damage = Math.max(1, attacker.attack - enemy.defense + Math.floor(Math.random() * 6) - 2);
        enemy.hp -= damage;

        io.emit("combat_result", {
          attackerId: attacker.characterId,
          targetId: enemy.id,
          damage,
          targetType: "enemy",
          targetDied: enemy.hp <= 0,
        });

        if (enemy.hp <= 0) {
          enemies.delete(enemy.id);
          io.emit("enemy_died", { id: enemy.id });

          const xpGained = enemy.xpReward;
          const [dbChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, attacker.characterId)).limit(1);
          if (!dbChar) return;

          const totalXpNow = dbChar.xp + xpGained;
          const { level: newLevel, xp: newXp } = calcLevel(totalXpNow);
          const leveledUp = newLevel > dbChar.level;
          const goldGained = enemy.goldReward;

          const newStats = leveledUp ? baseStats(attacker.class, newLevel) : null;

          await db.update(charactersTable).set({
            xp: newXp,
            level: newLevel,
            gold: dbChar.gold + goldGained,
            kills: dbChar.kills + 1,
            ...(newStats ? {
              maxHp: newStats.maxHp,
              hp: newStats.maxHp,
              maxMp: newStats.maxMp,
              mp: newStats.maxMp,
              attack: newStats.attack,
              defense: newStats.defense,
            } : {}),
          }).where(eq(charactersTable.id, attacker.characterId));

          attacker.kills += 1;
          attacker.gold += goldGained;

          if (newStats) {
            attacker.maxHp = newStats.maxHp;
            attacker.hp = newStats.maxHp;
            attacker.maxMp = newStats.maxMp;
            attacker.mp = newStats.maxMp;
            attacker.attack = newStats.attack;
            attacker.defense = newStats.defense;
          }

          socket.emit("xp_gained", {
            amount: xpGained,
            newXp,
            newLevel,
            leveledUp,
            goldGained,
          });

          if (leveledUp) {
            attacker.level = newLevel;
            socket.emit("level_up", {
              newLevel,
              statBoosts: newStats ?? {},
            });
            io.emit("chat_message", {
              from: "System",
              message: `${attacker.name} leveled up to ${newLevel}!`,
              type: "system",
            });
          }

          if (enemy.loot.length > 0 && Math.random() < 0.4) {
            const lootItem = enemy.loot[Math.floor(Math.random() * enemy.loot.length)]!;
            await db.insert(inventoryTable).values({
              characterId: attacker.characterId,
              itemKey: lootItem.itemKey,
              name: lootItem.name,
              type: lootItem.type,
              rarity: lootItem.rarity,
              quantity: 1,
              attackBonus: lootItem.attackBonus,
              defenseBonus: lootItem.defenseBonus,
              hpBonus: lootItem.hpBonus,
              description: lootItem.description,
              equipped: false,
            });
            socket.emit("inventory_updated");
            socket.emit("loot_received", { item: lootItem });
          }

          setTimeout(() => {
            const newEnemy = spawnEnemy();
            enemies.set(newEnemy.id, newEnemy);
            io.emit("enemy_spawned", {
              id: newEnemy.id,
              name: newEnemy.name,
              x: newEnemy.x,
              y: newEnemy.y,
              hp: newEnemy.hp,
              maxHp: newEnemy.maxHp,
              type: newEnemy.type,
            });
          }, RESPAWN_DELAY);
        }
      } else if (targetType === "player") {
        const target = Array.from(players.values()).find((p) => p.characterId === Number(targetId));
        if (!target || target.hp <= 0) return;

        const damage = Math.max(1, attacker.attack - target.defense + Math.floor(Math.random() * 6) - 2);
        target.hp -= damage;

        io.emit("combat_result", {
          attackerId: attacker.characterId,
          targetId: target.characterId,
          damage,
          targetType: "player",
          targetDied: target.hp <= 0,
        });

        if (target.hp <= 0) {
          target.deaths += 1;
          await db.update(charactersTable).set({ deaths: target.deaths }).where(eq(charactersTable.id, target.characterId));

          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) {
            const respawnX = 400 + Math.random() * 200 - 100;
            const respawnY = 300 + Math.random() * 200 - 100;
            const [dbChar] = await db.select().from(charactersTable).where(eq(charactersTable.id, target.characterId)).limit(1);
            if (dbChar) {
              const fullHp = dbChar.maxHp;
              await db.update(charactersTable).set({ hp: fullHp, posX: respawnX, posY: respawnY }).where(eq(charactersTable.id, target.characterId));
              target.hp = fullHp;
              target.x = respawnX;
              target.y = respawnY;
              targetSocket.emit("respawn", { x: respawnX, y: respawnY, hp: fullHp, mp: target.maxMp });
            }
          }

          io.emit("player_died", { characterId: target.characterId });
          io.emit("chat_message", {
            from: "System",
            message: `${target.name} was slain by ${attacker.name}!`,
            type: "system",
          });
        }
      }
    });

    socket.on("chat", ({ message }: { message: string }) => {
      const player = players.get(socket.id);
      if (!player || !message?.trim()) return;
      const trimmed = message.trim().slice(0, 200);
      io.emit("chat_message", {
        from: player.name,
        message: trimmed,
        type: "player",
      });
    });

    socket.on("save_position", async ({ x, y }: { x: number; y: number }) => {
      const player = players.get(socket.id);
      if (!player) return;
      await db.update(charactersTable).set({ posX: x, posY: y, hp: player.hp }).where(eq(charactersTable.id, player.characterId));
    });

    socket.on("disconnect", async () => {
      const player = players.get(socket.id);
      if (player) {
        await db.update(charactersTable).set({ posX: player.x, posY: player.y, hp: player.hp }).where(eq(charactersTable.id, player.characterId));
        socket.broadcast.emit("player_left", { characterId: player.characterId });
        players.delete(socket.id);
        updateOnlinePlayers();
        logger.info({ characterId: player.characterId }, "Player disconnected");
      }
    });
  });

  return io;
}
