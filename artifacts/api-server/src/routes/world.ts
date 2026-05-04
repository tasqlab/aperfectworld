import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "20")), 100);

  const rows = await db
    .select({
      id: charactersTable.id,
      name: charactersTable.name,
      class: charactersTable.class,
      level: charactersTable.level,
      xp: charactersTable.xp,
      kills: charactersTable.kills,
      gold: charactersTable.gold,
    })
    .from(charactersTable)
    .orderBy(desc(charactersTable.level), desc(charactersTable.xp))
    .limit(limit);

  const leaderboard = rows.map((row, i) => ({
    rank: i + 1,
    characterId: row.id,
    name: row.name,
    class: row.class,
    level: row.level,
    xp: row.xp,
    kills: row.kills,
    gold: row.gold,
  }));

  res.json(leaderboard);
});

// onlinePlayers is managed via the game socket module — we expose a getter
let _onlinePlayers: Map<number, { characterId: number; name: string; level: number; class: string; mapId: string }> = new Map();

export function setOnlinePlayers(
  players: Map<number, { characterId: number; name: string; level: number; class: string; mapId: string }>
) {
  _onlinePlayers = players;
}

router.get("/online", requireAuth, (req, res) => {
  const players = Array.from(_onlinePlayers.values());
  res.json({ count: players.length, players });
});

export default router;
