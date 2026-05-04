import { Router } from "express";
import { db } from "@workspace/db";
import { shopItemsTable, charactersTable, inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/buy", requireAuth, async (req, res) => {
  const characterId = (req as any).characterId;
  const { itemId, quantity = 1 } = req.body;
  
  if (!itemId) {
    return res.status(400).json({ error: "Item ID required" });
  }
  
  const shopItem = await db
    .select()
    .from(shopItemsTable)
    .where(eq(shopItemsTable.id, itemId))
    .limit(1);
  
  if (!shopItem[0]) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  if (!shopItem[0].inStock) {
    return res.status(400).json({ error: "Item out of stock" });
  }
  
  const character = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);
  
  if (!character[0]) {
    return res.status(404).json({ error: "Character not found" });
  }
  
  const totalCost = shopItem[0].price * quantity;
  
  if (character[0].gold < totalCost) {
    return res.status(400).json({ error: "Not enough gold" });
  }
  
  if (character[0].level < shopItem[0].levelRequired) {
    return res.status(400).json({ error: "Level too low" });
  }
  
  await db
    .update(charactersTable)
    .set({ gold: character[0].gold - totalCost })
    .where(eq(charactersTable.id, characterId));
  
  const existingItem = await db
    .select()
    .from(inventoryTable)
    .where(
      and(
        eq(inventoryTable.characterId, characterId),
        eq(inventoryTable.itemKey, shopItem[0].itemKey)
      )
    )
    .limit(1);
  
  if (existingItem[0]) {
    await db
      .update(inventoryTable)
      .set({ quantity: existingItem[0].quantity + quantity })
      .where(eq(inventoryTable.id, existingItem[0].id));
  } else {
    await db.insert(inventoryTable).values({
      characterId,
      itemKey: shopItem[0].itemKey,
      name: shopItem[0].name,
      type: shopItem[0].type,
      rarity: shopItem[0].rarity,
      quantity,
      attackBonus: shopItem[0].attackBonus,
      defenseBonus: shopItem[0].defenseBonus,
      hpBonus: shopItem[0].hpBonus,
      description: shopItem[0].description,
    });
  }
  
  res.json({ success: true, remainingGold: character[0].gold - totalCost });
});

router.post("/sell", requireAuth, async (req, res) => {
  const characterId = (req as any).characterId;
  const { inventoryItemId } = req.body;
  
  if (!inventoryItemId) {
    return res.status(400).json({ error: "Inventory item ID required" });
  }
  
  const item = await db
    .select()
    .from(inventoryTable)
    .where(
      and(
        eq(inventoryTable.id, inventoryItemId),
        eq(inventoryTable.characterId, characterId)
      )
    )
    .limit(1);
  
  if (!item[0]) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  if (item[0].equipped) {
    return res.status(400).json({ error: "Cannot sell equipped items" });
  }
  
  const sellPrice = Math.floor(item[0].quantity * 10);
  
  const character = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1);
  
  if (!character[0]) {
    return res.status(404).json({ error: "Character not found" });
  }
  
  await db
    .update(charactersTable)
    .set({ gold: character[0].gold + sellPrice })
    .where(eq(charactersTable.id, characterId));
  
  if (item[0].quantity > 1) {
    await db
      .update(inventoryTable)
      .set({ quantity: item[0].quantity - 1 })
      .where(eq(inventoryTable.id, item[0].id));
  } else {
    await db
      .delete(inventoryTable)
      .where(eq(inventoryTable.id, item[0].id));
  }
  
  res.json({ success: true, goldEarned: sellPrice });
});

export default router;
