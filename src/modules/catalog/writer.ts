import type { Model } from "@/core/model/schema";

/** Write port for the catalog (used by ingestion + seed). */
export interface CatalogWriter {
  upsert(model: Model): Promise<void>;
  upsertMany(models: Model[]): Promise<void>;
}
