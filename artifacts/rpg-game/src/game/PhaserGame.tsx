import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { Character } from '@workspace/api-client-react';
import { useGameStore } from '../store/gameStore';

interface OtherPlayer {
  characterId: number;
  name: string;
  level: number;
  class: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  sprite?: Phaser.GameObjects.Graphics;
  nameTag?: Phaser.GameObjects.Text;
  hpBar?: Phaser.GameObjects.Graphics;
}

interface Enemy {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  sprite?: Phaser.GameObjects.Graphics;
  nameTag?: Phaser.GameObjects.Text;
  hpBar?: Phaser.GameObjects.Graphics;
}

const CLASS_COLORS: Record<string, number> = {
  warrior: 0xef4444,
  mage: 0x3b82f6,
  archer: 0x22c55e,
  rogue: 0xa855f7,
};

const ENEMY_COLORS: Record<string, number> = {
  goblin: 0x4ade80,
  skeleton: 0xe5e7eb,
  wolf: 0x78716c,
  orc: 0xf97316,
  mage: 0x7c3aed,
  dragon: 0xdc2626,
};

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;
const TILE_SIZE = 64;

function drawWorld(scene: Phaser.Scene) {
  const g = scene.add.graphics();

  for (let tx = 0; tx < WORLD_WIDTH / TILE_SIZE; tx++) {
    for (let ty = 0; ty < WORLD_HEIGHT / TILE_SIZE; ty++) {
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;

      const distCenter = Math.hypot(px - WORLD_WIDTH / 2, py - WORLD_HEIGHT / 2);
      let color: number;

      if (distCenter < 300) {
        color = 0x3b2a1a;
      } else if (tx < 10 || ty < 10 || tx > WORLD_WIDTH / TILE_SIZE - 11 || ty > WORLD_HEIGHT / TILE_SIZE - 11) {
        color = 0x1a1a2e;
      } else if ((tx + ty) % 7 < 2 && distCenter > 600) {
        color = 0x0d2818;
      } else if ((tx * 3 + ty * 2) % 11 < 3 && distCenter > 400) {
        color = 0x1a0d2e;
      } else {
        const v = ((tx * 17 + ty * 31) % 8);
        if (v < 2) color = 0x1c2b1c;
        else if (v < 5) color = 0x1a2a1a;
        else color = 0x1e2d1e;
      }

      g.fillStyle(color, 1);
      g.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      g.lineStyle(1, 0x000000, 0.15);
      g.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  for (let i = 0; i < 80; i++) {
    const tx2 = Math.floor(Math.random() * (WORLD_WIDTH / TILE_SIZE));
    const ty2 = Math.floor(Math.random() * (WORLD_HEIGHT / TILE_SIZE));
    g.fillStyle(0x2d4a1e, 1);
    g.fillRect(tx2 * TILE_SIZE + 8, ty2 * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }

  g.setDepth(0);
}

function createPlayerSprite(scene: Phaser.Scene, x: number, y: number, color: number, name: string, level: number): {
  sprite: Phaser.GameObjects.Graphics;
  nameTag: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
} {
  const sprite = scene.add.graphics();
  sprite.fillStyle(color, 1);
  sprite.fillRect(-12, -16, 24, 28);
  sprite.fillStyle(color + 0x222222, 1);
  sprite.fillCircle(0, -22, 10);
  sprite.lineStyle(2, 0xffd700, 0.8);
  sprite.strokeRect(-12, -16, 24, 28);
  sprite.setPosition(x, y);
  sprite.setDepth(5);

  const nameTag = scene.add.text(x, y - 40, `${name} [${level}]`, {
    fontSize: '11px',
    color: '#ffd700',
    stroke: '#000000',
    strokeThickness: 3,
    fontFamily: 'serif',
  }).setOrigin(0.5, 1).setDepth(10);

  const hpBar = scene.add.graphics();
  hpBar.setPosition(x, y);
  hpBar.setDepth(9);

  return { sprite, nameTag, hpBar };
}

function updateHpBar(hpBar: Phaser.GameObjects.Graphics, hp: number, maxHp: number) {
  hpBar.clear();
  const pct = Math.max(0, hp / maxHp);
  hpBar.fillStyle(0x000000, 0.7);
  hpBar.fillRect(-16, -30, 32, 5);
  hpBar.fillStyle(pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xf59e0b : 0xef4444, 1);
  hpBar.fillRect(-16, -30, Math.floor(32 * pct), 5);
}

interface PhaserGameProps {
  character: Character;
  socket: Socket | null;
}

export default function PhaserGame({ character, socket }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateStatsRef = useRef(useGameStore.getState().updateCharacterStats);
  const socketRef = useRef(socket);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const otherPlayers = new Map<number, OtherPlayer>();
    const enemiesMap = new Map<string, Enemy>();
    const floatingTexts: Array<{ text: Phaser.GameObjects.Text; vy: number; life: number }> = [];

    let playerSprite: Phaser.GameObjects.Graphics;
    let playerNameTag: Phaser.GameObjects.Text;
    let playerHpBar: Phaser.GameObjects.Graphics;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    let wasd: Record<string, Phaser.Input.Keyboard.Key>;
    let currentX = character.posX;
    let currentY = character.posY;
    let currentHp = character.hp;
    let savePositionTimer = 0;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: containerRef.current,
      backgroundColor: '#0a0a12',
      scene: {
        create(this: Phaser.Scene) {
          drawWorld(this);

          const color = CLASS_COLORS[character.class] ?? 0xffffff;
          const created = createPlayerSprite(this, currentX, currentY, color, character.name, character.level);
          playerSprite = created.sprite;
          playerNameTag = created.nameTag;
          playerHpBar = created.hpBar;
          updateHpBar(playerHpBar, currentHp, character.maxHp);

          this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
          this.cameras.main.startFollow(playerSprite, true, 0.08, 0.08);

          cursors = this.input.keyboard!.createCursorKeys();
          wasd = {
            w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          };

          this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
            const wx = ptr.worldX;
            const wy = ptr.worldY;
            for (const [, enemy] of enemiesMap) {
              const dist = Math.hypot(enemy.x - wx, enemy.y - wy);
              if (dist < 30) {
                socketRef.current?.emit('attack', { targetId: enemy.id, targetType: 'enemy' });
                return;
              }
            }
          });

          this.input.keyboard!.on('keydown-SPACE', () => {
            let closest: Enemy | null = null;
            let closestDist = Infinity;
            for (const [, enemy] of enemiesMap) {
              const dist = Math.hypot(enemy.x - currentX, enemy.y - currentY);
              if (dist < 120 && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
              }
            }
            if (closest) {
              socketRef.current?.emit('attack', { targetId: closest.id, targetType: 'enemy' });
            }
          });

          if (socket) {
            socket.on('world_state', ({ players, enemies }: { players: OtherPlayer[]; enemies: Enemy[] }) => {
              for (const p of players) {
                if (p.characterId === character.id) continue;
                const col = CLASS_COLORS[p.class] ?? 0xffffff;
                const created2 = createPlayerSprite(this, p.x, p.y, col, p.name, p.level);
                otherPlayers.set(p.characterId, { ...p, ...created2 });
              }
              for (const e of enemies) {
                const ecol = ENEMY_COLORS[e.type] ?? 0xff4444;
                const es = this.add.graphics();
                es.fillStyle(ecol, 0.9);
                es.fillTriangle(0, -15, -12, 12, 12, 12);
                es.lineStyle(1, 0xff0000, 0.5);
                es.strokeTriangle(0, -15, -12, 12, 12, 12);
                es.setPosition(e.x, e.y).setDepth(4);
                const et = this.add.text(e.x, e.y - 25, e.name, {
                  fontSize: '10px', color: '#ff6666', stroke: '#000', strokeThickness: 2, fontFamily: 'monospace',
                }).setOrigin(0.5, 1).setDepth(9);
                const eh = this.add.graphics().setPosition(e.x, e.y).setDepth(8);
                updateHpBar(eh, e.hp, e.maxHp);
                enemiesMap.set(e.id, { ...e, sprite: es, nameTag: et, hpBar: eh });
              }
            });

            socket.on('player_joined', (p: OtherPlayer) => {
              if (p.characterId === character.id) return;
              const col = CLASS_COLORS[p.class] ?? 0xffffff;
              const created2 = createPlayerSprite(this, p.x, p.y, col, p.name, p.level);
              otherPlayers.set(p.characterId, { ...p, ...created2 });
            });

            socket.on('player_moved', ({ characterId, x, y }: { characterId: number; x: number; y: number }) => {
              const op = otherPlayers.get(characterId);
              if (!op) return;
              op.x = x; op.y = y;
              op.sprite?.setPosition(x, y);
              op.nameTag?.setPosition(x, y - 40);
              op.hpBar?.setPosition(x, y);
            });

            socket.on('player_left', ({ characterId }: { characterId: number }) => {
              const op = otherPlayers.get(characterId);
              if (!op) return;
              op.sprite?.destroy();
              op.nameTag?.destroy();
              op.hpBar?.destroy();
              otherPlayers.delete(characterId);
            });

            socket.on('enemy_moved', ({ id, x, y }: { id: string; x: number; y: number }) => {
              const e = enemiesMap.get(id);
              if (!e) return;
              e.x = x; e.y = y;
              e.sprite?.setPosition(x, y);
              e.nameTag?.setPosition(x, y - 25);
              e.hpBar?.setPosition(x, y);
            });

            socket.on('enemy_died', ({ id }: { id: string }) => {
              const e = enemiesMap.get(id);
              if (!e) return;
              e.sprite?.destroy();
              e.nameTag?.destroy();
              e.hpBar?.destroy();
              enemiesMap.delete(id);
            });

            socket.on('enemy_spawned', (e: Enemy) => {
              const ecol = ENEMY_COLORS[e.type] ?? 0xff4444;
              const es = this.add.graphics();
              es.fillStyle(ecol, 0.9);
              es.fillTriangle(0, -15, -12, 12, 12, 12);
              es.setPosition(e.x, e.y).setDepth(4);
              const et = this.add.text(e.x, e.y - 25, e.name, {
                fontSize: '10px', color: '#ff6666', stroke: '#000', strokeThickness: 2, fontFamily: 'monospace',
              }).setOrigin(0.5, 1).setDepth(9);
              const eh = this.add.graphics().setPosition(e.x, e.y).setDepth(8);
              updateHpBar(eh, e.maxHp, e.maxHp);
              enemiesMap.set(e.id, { ...e, sprite: es, nameTag: et, hpBar: eh });
            });

            socket.on('combat_result', ({ attackerId, targetId, damage, targetType, targetDied }: {
              attackerId: number | string; targetId: number | string; damage: number; targetType: string; targetDied: boolean;
            }) => {
              let tx = currentX, ty = currentY;
              if (targetType === 'enemy') {
                const e = enemiesMap.get(String(targetId));
                if (e) {
                  tx = e.x; ty = e.y;
                  if (!targetDied) {
                    e.hp = Math.max(0, e.hp - damage);
                    updateHpBar(e.hpBar!, e.hp, e.maxHp);
                  }
                }
              } else {
                if (Number(targetId) === character.id) {
                  currentHp = Math.max(0, currentHp - damage);
                  updateHpBar(playerHpBar, currentHp, character.maxHp);
                  updateStatsRef.current({ hp: currentHp });
                }
                const op = otherPlayers.get(Number(targetId));
                if (op) { tx = op.x; ty = op.y; }
              }

              const dmgText = this.add.text(tx + (Math.random() * 20 - 10), ty - 20, `-${damage}`, {
                fontSize: '16px', color: targetType === 'enemy' ? '#fbbf24' : '#ef4444',
                stroke: '#000', strokeThickness: 3, fontFamily: 'bold serif',
              }).setOrigin(0.5, 1).setDepth(20);
              floatingTexts.push({ text: dmgText, vy: -2, life: 60 });
            });

            socket.on('xp_gained', ({ newXp, newLevel }: { amount: number; newXp: number; newLevel: number; leveledUp: boolean }) => {
              updateStatsRef.current({ xp: newXp, level: newLevel });
              if (newLevel > character.level) {
                const lvlText = this.add.text(currentX, currentY - 50, 'LEVEL UP!', {
                  fontSize: '22px', color: '#ffd700', stroke: '#000', strokeThickness: 4, fontFamily: 'bold serif',
                }).setOrigin(0.5, 1).setDepth(20);
                floatingTexts.push({ text: lvlText, vy: -1.5, life: 90 });
                playerNameTag.setText(`${character.name} [${newLevel}]`);
              }
            });

            socket.on('respawn', ({ x, y, hp }: { x: number; y: number; hp: number; mp: number }) => {
              currentX = x; currentY = y; currentHp = hp;
              playerSprite.setPosition(x, y);
              playerNameTag.setPosition(x, y - 40);
              playerHpBar.setPosition(x, y);
              updateHpBar(playerHpBar, hp, character.maxHp);
              this.cameras.main.pan(x, y, 500, 'Power2');
            });

            socket.on('player_died', ({ characterId }: { characterId: number }) => {
              const op = otherPlayers.get(characterId);
              if (op?.sprite) {
                op.sprite.setAlpha(0.3);
                setTimeout(() => op.sprite?.setAlpha(1), 3000);
              }
            });
          }
        },

        update(this: Phaser.Scene, time: number, delta: number) {
          if (currentHp <= 0) return;

          const speed = 3.5;
          let moved = false;
          let dx = 0, dy = 0;

          if (cursors.left.isDown || wasd.a.isDown) { dx -= speed; moved = true; }
          if (cursors.right.isDown || wasd.d.isDown) { dx += speed; moved = true; }
          if (cursors.up.isDown || wasd.w.isDown) { dy -= speed; moved = true; }
          if (cursors.down.isDown || wasd.s.isDown) { dy += speed; moved = true; }

          if (moved) {
            currentX = Math.max(20, Math.min(WORLD_WIDTH - 20, currentX + dx));
            currentY = Math.max(20, Math.min(WORLD_HEIGHT - 20, currentY + dy));
            playerSprite.setPosition(currentX, currentY);
            playerNameTag.setPosition(currentX, currentY - 40);
            playerHpBar.setPosition(currentX, currentY);

            savePositionTimer += delta;
            if (savePositionTimer > 500) {
              socketRef.current?.emit('move', { x: currentX, y: currentY });
              savePositionTimer = 0;
            }
          }

          for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i]!;
            ft.text.y += ft.vy;
            ft.text.setAlpha(ft.life / 60);
            ft.life--;
            if (ft.life <= 0) {
              ft.text.destroy();
              floatingTexts.splice(i, 1);
            }
          }
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    const handleResize = () => {
      gameRef.current?.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
