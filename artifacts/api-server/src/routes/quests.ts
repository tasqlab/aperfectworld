import { Router } from "express";
import { db } from "@workspace/db";
import { questsTable, characterQuestsTable, charactersTable, inventoryTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const characterId = (req as any).characterId;
  
  const characterQuests = await db
    .select({
      id: characterQuestsTable.id,
      questId: characterQuestsTable.questId,
      status: characterQuestsTable.status,
      progress: characterQuestsTable.progress,
      startedAt: characterQuestsTable.startedAt,
      completedAt: characterQuestsTable.completedAt,
      title: questsTable.title,
      description: questsTable.description,
      type: questsTable.type,
      giverName: questsTable.giverName,
      targetType: questsTable.targetType,
      targetId: questsTable.targetId,
      targetCount: questsTable.targetCount,
      rewardXp: questsTable.rewardXp,
      rewardGold: questsTable.rewardGold,
      rewardItemKey: questsTable.rewardItemKey,
    })
    .from(characterQuestsTable)
    .innerJoin(questsTable, eq(characterQuestsTable.questId, questsTable.id))
    .where(eq(characterQuestsTable.characterId, characterId));
  
  res.json(characterQuests);
});

router.get("/available", requireAuth, async (req, res) => {
  const characterId = (req as any).characterId;
  
  const character = await db
    .select({ level: charactersTable.level })
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);
  
  if (!character[0]) {
    return res.status(404).json({ error: "Character not found" });
  }
  
  const availableQuests = await db
    .select()
    .from(questsTable)
    .where(
      and(
        sql`${questsTable.minLevel} <= ${character[0].level}`,
        sql`NOT EXISTS (SELECT 1 FROM ${characterQuestsTable} WHERE ${characterQuestsTable.questId} = ${questsTable.id} AND ${characterQuestsTable.characterId} = ${characterId})`
      )
    );
  
  res.json(availableQuests);
});

router.post("/:id/start", requireAuth, async (req, res) => {
  const characterId = (req as any).characterId;
  const questId = parseInt(req.params["id"] as string);
  
  const existing = await db
    .select()
    .from(characterQuestsTable)
    .where(
      and(
        eq(characterQuestsTable.characterId, characterId),
        eq(characterQuestsTable.questId, questId)
      )
    )
    .limit(1);
  
  if (existing[0]) {
    return res.status(400).json({ error: "Quest already started" });
  }
  
  await db.insert(characterQuestsTable).values({
    characterId,
    questId,
    status: "in_progress",
    progress: 0,
  });
  
  res.json({ success: true });
});

router.post("/:id/complete", requireAuth, async (req, res) => {
  const characterId = (req as any).characterId;
  const questId = parseInt(req.params["id"] as string);
  
  const quest = await db
    .select()
    .from(questsTable)
    .where(eq(questsTable.id, questId))
    .limit(1);
  
  if (!quest[0]) {
    return res.status(404).json({ error: "Quest not found" });
  }
  
  const characterQuest = await db
    .select()
    .from(characterQuestsTable)
    .where(
      and(
        eq(characterQuestsTable.characterId, characterId),
        eq(characterQuestsTable.questId, questId)
      )
    )
    .limit(1);
  
  if (!characterQuest[0] || characterQuest[0].status !== "in_progress") {
    return res.status(400).json({ error: "Quest not in progress" });
  }
  
  if (characterQuest[0].progress < quest[0].targetCount) {
    return res.status(400).json({ error: "Quest not complete" });
  }
  
  await db
    .update(characterQuestsTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(characterQuestsTable.id, characterQuest[0].id));
  
  const character = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);
  
  if (character[0]) {
    const newXp = character[0].xp + quest[0].rewardXp;
    const newGold = character[0].gold + quest[0].rewardGold;
    let newLevel = character[0].level;
    let newMaxHp = character[0].maxHp;
    let newMaxMp = character[0].maxMp;
    let newAttack = character[0].attack;
    let newDefense = character[0].defense;
    
    const xpForLevel = (lvl: number) => lvl * 100 + lvl * lvl * 10;
    while (newXp >= xpForLevel(newLevel)) {
      newLevel++;
      newMaxHp += 10;
      newMaxMp += 5;
      newAttack += 2;
      newDefense += 1;
    }
    
    await db
      .update(charactersTable)
      .set({
        xp: newXp,
        gold: newGold,
        level: newLevel,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
        attack: newAttack,
        defense: newDefense,
        hp: newMaxHp,
        mp: newMaxMp,
      })
      .where(eq(charactersTable.id, characterId));
  }
  
  res.json({ success: true, rewards: quest[0] });
});

export default router;
