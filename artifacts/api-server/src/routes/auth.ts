import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, charactersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { baseStats, xpToNextLevel } from "../lib/xp.js";
import {
  RegisterBody,
  LoginBody,
} from "@workspace/api-zod";

const router = Router();

function formatCharacter(char: typeof charactersTable.$inferSelect) {
  return {
    id: char.id,
    userId: char.userId,
    name: char.name,
    class: char.class,
    level: char.level,
    xp: char.xp,
    xpToNextLevel: xpToNextLevel(char.level),
    hp: char.hp,
    maxHp: char.maxHp,
    mp: char.mp,
    maxMp: char.maxMp,
    attack: char.attack,
    defense: char.defense,
    speed: char.speed,
    posX: char.posX,
    posY: char.posY,
    mapId: char.mapId,
    gold: char.gold,
    kills: char.kills,
    deaths: char.deaths,
    createdAt: char.createdAt.toISOString(),
  };
}

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password, characterName, characterClass } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, email: `${username}@game.local`, passwordHash }).returning();
  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  const stats = baseStats(characterClass, 1);
  const [character] = await db
    .insert(charactersTable)
    .values({
      userId: user.id,
      name: characterName,
      class: characterClass,
      level: 1,
      xp: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mp: stats.maxMp,
      maxMp: stats.maxMp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      posX: 400 + Math.random() * 200 - 100,
      posY: 300 + Math.random() * 200 - 100,
      mapId: "world",
      gold: 50,
    })
    .returning();

  if (!character) {
    res.status(500).json({ error: "Failed to create character" });
    return;
  }

  const token = signToken({ userId: user.id, characterId: character.id, username: user.username });
  res.status(201).json({ token, character: formatCharacter(character) });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.userId, user.id))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const token = signToken({ userId: user.id, characterId: character.id, username: user.username });
  res.json({ token, character: formatCharacter(character) });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);

  let payload: { userId: number; characterId: number; username: string };
  try {
    const { verifyToken } = await import("../lib/jwt.js");
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, payload.characterId))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  res.json({ token, character: formatCharacter(character) });
});

export { formatCharacter };
export default router;
