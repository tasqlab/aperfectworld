import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, shopItemsTable, npcsTable, townsTable, dungeonsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/shops", async (req, res) => {
  const shops = await db.select().from(shopsTable);
  res.json(shops);
});

router.get("/shops/:id", async (req, res) => {
  const shopId = parseInt(req.params["id"] as string);
  const shop = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId)).limit(1);
  
  if (!shop[0]) {
    return res.status(404).json({ error: "Shop not found" });
  }
  
  const items = await db.select().from(shopItemsTable).where(
    and(eq(shopItemsTable.shopId, shopId), eq(shopItemsTable.inStock, true))
  );
  
  res.json({ ...shop[0], items });
});

router.get("/npcs", async (req, res) => {
  const mapId = req.query["mapId"] as string | undefined;
  const townId = req.query["townId"] as string | undefined;
  
  let query = db.select().from(npcsTable);
  
  if (mapId) {
    query = query.where(eq(npcsTable.mapId, mapId)) as typeof query;
  }
  
  const npcs = await query;
  
  const filtered = townId 
    ? npcs.filter(n => n.townId === parseInt(townId))
    : npcs;
    
  res.json(filtered);
});

router.get("/npcs/:id", async (req, res) => {
  const npcId = parseInt(req.params["id"] as string);
  const npc = await db.select().from(npcsTable).where(eq(npcsTable.id, npcId)).limit(1);
  
  if (!npc[0]) {
    return res.status(404).json({ error: "NPC not found" });
  }
  
  res.json(npc[0]);
});

router.get("/towns", async (req, res) => {
  const towns = await db.select().from(townsTable);
  res.json(towns);
});

router.get("/towns/:id", async (req, res) => {
  const townId = parseInt(req.params["id"] as string);
  const town = await db.select().from(townsTable).where(eq(townsTable.id, townId)).limit(1);
  
  if (!town[0]) {
    return res.status(404).json({ error: "Town not found" });
  }
  
  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.townId, townId));
  
  res.json({ ...town[0], npcs });
});

router.get("/dungeons", async (req, res) => {
  const dungeons = await db.select().from(dungeonsTable);
  res.json(dungeons);
});

router.get("/dungeons/:id", async (req, res) => {
  const dungeonId = parseInt(req.params["id"] as string);
  const dungeon = await db.select().from(dungeonsTable).where(eq(dungeonsTable.id, dungeonId)).limit(1);
  
  if (!dungeon[0]) {
    return res.status(404).json({ error: "Dungeon not found" });
  }
  
  res.json(dungeon[0]);
});

export default router;
