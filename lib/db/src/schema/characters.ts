import { pgTable, uuid, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const charactersTable = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  class: text("class").notNull().default("warrior"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  hp: integer("hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  mp: integer("mp").notNull().default(50),
  maxMp: integer("max_mp").notNull().default(50),
  attack: integer("attack").notNull().default(10),
  defense: integer("defense").notNull().default(5),
  speed: integer("speed").notNull().default(5),
  posX: real("pos_x").notNull().default(400),
  posY: real("pos_y").notNull().default(300),
  mapId: text("map_id").notNull().default("world"),
  gold: integer("gold").notNull().default(0),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCharacterSchema = createInsertSchema(charactersTable).omit({ id: true, createdAt: true });
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
