import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("general"),
  description: text("description").notNull(),
});

export const shopItemsTable = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  itemKey: text("item_key").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  rarity: text("rarity").notNull().default("common"),
  price: integer("price").notNull(),
  attackBonus: integer("attack_bonus").notNull().default(0),
  defenseBonus: integer("defense_bonus").notNull().default(0),
  hpBonus: integer("hp_bonus").notNull().default(0),
  description: text("description").notNull().default(""),
  levelRequired: integer("level_required").notNull().default(1),
  inStock: boolean("in_stock").notNull().default(true),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;

export const insertShopItemSchema = createInsertSchema(shopItemsTable).omit({ id: true });
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItemsTable.$inferSelect;
