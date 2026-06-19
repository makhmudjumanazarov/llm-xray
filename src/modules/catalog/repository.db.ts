import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Model } from "@/core/model/schema";
import { getDb } from "@/infra/db/client";
import { models } from "@/infra/db/schema";
import type { CatalogRepository } from "./repository";

/** Postgres/PGlite-backed catalog. Drop-in for FileCatalogRepository. */
export class DbCatalogRepository implements CatalogRepository {
  async all(): Promise<Model[]> {
    const db = await getDb();
    const rows = await db.select({ data: models.data }).from(models).orderBy(desc(models.downloads));
    return rows.map((r) => r.data);
  }

  async bySlug(slug: string): Promise<Model | undefined> {
    const db = await getDb();
    const rows = await db.select({ data: models.data }).from(models).where(eq(models.slug, slug)).limit(1);
    return rows[0]?.data;
  }

  async slugs(): Promise<string[]> {
    const db = await getDb();
    const rows = await db.select({ slug: models.slug }).from(models);
    return rows.map((r) => r.slug);
  }
}
