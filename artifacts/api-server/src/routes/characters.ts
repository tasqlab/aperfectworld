import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable, inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { formatCharacter } from "./auth.js";
import { xpToNextLevel } from "../lib/xp.js";

const router = Router();

router.get("/:characterId", requireAuth, async (req, res) => {
  const characterId = parseInt(String(req.params["characterId"]));
  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid character ID" });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);

  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  res.json(formatCharacter(character));
});

router.put("/:characterId", requireAuth, async (req, res) => {
  const characterId = parseInt(String(req.params["characterId"]));
  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid character ID" });
    return;
  }

  if (req.user?.characterId !== characterId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { equippedWeaponId, equippedArmorId } = req.body as {
    equippedWeaponId?: number | null;
    equippedArmorId?: number | null;
  };

  const updates: Partial<typeof charactersTable.$inferInsert> = {};

  if (equippedWeaponId !== undefined) {
    updates.equippedWeaponId = equippedWeaponId;
    if (equippedWeaponId !== null) {
      await db
        .update(inventoryTable)
        .set({ equipped: true })
        .where(
          and(
            eq(inventoryTable.id, equippedWeaponId),
            eq(inventoryTable.characterId, characterId)
          )
        );
    }
  }

  if (equippedArmorId !== undefined) {
    updates.equippedArmorId = equippedArmorId;
    if (equippedArmorId !== null) {
      await db
        .update(inventoryTable)
        .set({ equipped: true })
        .where(
          and(
            eq(inventoryTable.id, equippedArmorId),
            eq(inventoryTable.characterId, characterId)
          )
        );
    }
  }

  if (Object.keys(updates).length === 0) {
    const [character] = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.id, characterId))
      .limit(1);
    res.json(formatCharacter(character!));
    return;
  }

  const [updated] = await db
    .update(charactersTable)
    .set(updates)
    .where(eq(charactersTable.id, characterId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  res.json(formatCharacter(updated));
});

export { xpToNextLevel };
export default router;
