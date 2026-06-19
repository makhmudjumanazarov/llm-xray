import type { Model } from "@/core/model/schema";

/**
 * Read port for the catalog of models. The presentation layer depends only on
 * this interface, never on a concrete data source — so Phase B can swap the
 * file-backed implementation for a Postgres one without touching pages.
 * Async by design to match the eventual DB-backed implementation.
 */
export interface CatalogRepository {
  all(): Promise<Model[]>;
  bySlug(slug: string): Promise<Model | undefined>;
  slugs(): Promise<string[]>;
}
