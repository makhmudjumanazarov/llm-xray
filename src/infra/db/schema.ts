import { pgTable, text, integer, real, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";
// Relative type-only import so drizzle-kit's loader needn't resolve path aliases.
import type { Model } from "../../core/model/schema";

/**
 * One row per model. Indexed scalar columns drive ranking/filtering at scale;
 * the full normalized Model lives in `data` (jsonb) for detail pages.
 */
export const models = pgTable(
  "models",
  {
    slug: text("slug").primaryKey(),
    id: text("id").notNull(),
    name: text("name").notNull(),
    family: text("family").notNull(),
    license: text("license").notNull(),
    paramsB: real("params_b").notNull().default(0),
    contextLen: integer("context_len").notNull().default(0),
    numLayers: integer("num_layers").notNull().default(0),
    attentionType: text("attention_type").notNull(),
    isMoe: boolean("is_moe").notNull().default(false),
    modalities: text("modalities").array().notNull(),
    downloads: integer("downloads").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    mmlu: real("mmlu"),
    lastModified: text("last_modified"),
    data: jsonb("data").$type<Model>().notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("models_downloads_idx").on(t.downloads),
    index("models_family_idx").on(t.family),
    index("models_attention_idx").on(t.attentionType),
  ],
);

export type ModelRow = typeof models.$inferSelect;
