import { pgTable, uuid, integer, text, real, timestamp, pgArray } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const townsTable = pgTable("towns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  posX: real("pos_x").notNull(),
  posY: real("pos_y").notNull(),
  mapId: text("map_id").notNull().default("world"),
  shopId: uuid("shop_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const npcsTable = pgTable("npcs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull().default("merchant"),
  description: text("description"),
  posX: real("pos_x").notNull(),
  posY: real("pos_y").notNull(),
  mapId: text("map_id").notNull().default("world"),
  questId: uuid("quest_id"),
  shopId: uuid("shop_id"),
  greeting: text("greeting"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dungeonsTable = pgTable("dungeons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("dungeon"),
  posX: real("pos_x").notNull(),
  posY: real("pos_y").notNull(),
  mapId: text("map_id").notNull().default("world"),
  minLevel: integer("min_level").notNull().default(1),
  enemyTypes: pgArray(text("enemy_types")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
