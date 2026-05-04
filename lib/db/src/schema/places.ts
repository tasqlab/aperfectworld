import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const townsTable = pgTable("towns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  posX: real("pos_x").notNull(),
  posY: real("pos_y").notNull(),
  mapId: text("map_id").notNull().default("world"),
  shopId: integer("shop_id"),
  questId: integer("quest_id"),
  levelRequired: integer("level_required").notNull().default(1),
});

export const npcsTable = pgTable("npcs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title"),
  description: text("description").notNull(),
  type: text("type").notNull().default("merchant"),
  posX: real("pos_x").notNull(),
  posY: real("pos_y").notNull(),
  mapId: text("map_id").notNull().default("world"),
  townId: integer("town_id"),
  shopId: integer("shop_id"),
  questId: integer("quest_id"),
  dialogue: text("dialogue"),
});

export const dungeonsTable = pgTable("dungeons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("dungeon"),
  posX: real("pos_x").notNull(),
  posY: real("pos_y").notNull(),
  mapId: text("map_id").notNull().default("world"),
  levelRequired: integer("level_required").notNull().default(1),
  enemyTypes: text("enemy_types").notNull(),
  spawnRate: integer("spawn_rate").notNull().default(30),
});

export const insertTownSchema = createInsertSchema(townsTable).omit({ id: true });
export type InsertTown = z.infer<typeof insertTownSchema>;
export type Town = typeof townsTable.$inferSelect;

export const insertNpcSchema = createInsertSchema(npcsTable).omit({ id: true });
export type InsertNpc = z.infer<typeof insertNpcSchema>;
export type Npc = typeof npcsTable.$inferSelect;

export const insertDungeonSchema = createInsertSchema(dungeonsTable).omit({ id: true });
export type InsertDungeon = z.infer<typeof insertDungeonSchema>;
export type Dungeon = typeof dungeonsTable.$inferSelect;
