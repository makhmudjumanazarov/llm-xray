import "server-only";
import { env } from "@/infra/config/env";
import type { CatalogRepository } from "./repository";
import { FileCatalogRepository } from "./repository.file";
import { DbCatalogRepository } from "./repository.db";

// Single composition point. CATALOG_SOURCE=db → Postgres/PGlite; otherwise the
// build-time JSON snapshot. Call sites (pages, sitemap) are unchanged — they
// depend only on the CatalogRepository port.
const repo: CatalogRepository =
  env.CATALOG_SOURCE === "db" ? new DbCatalogRepository() : new FileCatalogRepository();

export const getAllModels = () => repo.all();
export const getModelBySlug = (slug: string) => repo.bySlug(slug);
export const getAllSlugs = () => repo.slugs();
