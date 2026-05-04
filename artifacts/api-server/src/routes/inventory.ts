import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router({ mergeParams: true });

function formatItem(item: typeof inventoryTable.$inferSelect) {
  return {
    id: item.id,
    characterId: item.characterId,
    itemKey: item.itemKey,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    quantity: item.quantity,
    attackBonus: item.attackBonus,
    defenseBonus: item.defenseBonus,
    hpBonus: item.hpBonus,
    description: item.description,
    equipped: item.equipped,
    acquiredAt: item.acquiredAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res) => {
  const characterId = parseInt(String(req.params["characterId"]));
  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid character ID" });
    return;
  }

  const items = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.characterId, characterId));

  res.json(items.map(formatItem));
});

router.post("/", requireAuth, async (req, res) => {
  const characterId = parseInt(String(req.params["characterId"]));
  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid character ID" });
    return;
  }

  if (req.user?.characterId !== characterId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const {
    itemKey,
    name,
    type,
    rarity = "common",
    quantity = 1,
    attackBonus = 0,
    defenseBonus = 0,
    hpBonus = 0,
    description = "",
  } = req.body as {
    itemKey: string;
    name: string;
    type: string;
    rarity?: string;
    quantity?: number;
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;
    description?: string;
  };

  const [item] = await db
    .insert(inventoryTable)
    .values({
      characterId,
      itemKey,
      name,
      type,
      rarity,
      quantity,
      attackBonus,
      defenseBonus,
      hpBonus,
      description,
      equipped: false,
    })
    .returning();

  res.status(201).json(formatItem(item!));
});

router.delete("/:itemId", requireAuth, async (req, res) => {
  const characterId = parseInt(String(req.params["characterId"]));
  const itemId = parseInt(String(req.params["itemId"]));

  if (isNaN(characterId) || isNaN(itemId)) {
    res.status(400).json({ error: "Invalid IDs" });
    return;
  }

  if (req.user?.characterId !== characterId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db
    .delete(inventoryTable)
    .where(and(eq(inventoryTable.id, itemId), eq(inventoryTable.characterId, characterId)));

  res.status(204).send();
});

export { formatItem };
export default router;
