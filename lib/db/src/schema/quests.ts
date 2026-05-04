import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { charactersTable } from "./characters";

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("story"),
  giverName: text("giver_name").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  targetCount: integer("target_count").notNull().default(1),
  rewardXp: integer("reward_xp").notNull().default(0),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardItemKey: text("reward_item_key"),
  minLevel: integer("min_level").notNull().default(1),
  repeatable: boolean("repeatable").notNull().default(false),
});

export const characterQuestsTable = pgTable("character_quests", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull().references(() => charactersTable.id),
  questId: integer("quest_id").notNull().references(() => questsTable.id),
  status: text("status").notNull().default("available"),
  progress: integer("progress").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertQuestSchema = createInsertSchema(questsTable).omit({ id: true });
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof questsTable.$inferSelect;

export const insertCharacterQuestSchema = createInsertSchema(characterQuestsTable).omit({ id: true, startedAt: true });
export type InsertCharacterQuest = z.infer<typeof insertCharacterQuestSchema>;
export type CharacterQuest = typeof characterQuestsTable.$inferSelect;
