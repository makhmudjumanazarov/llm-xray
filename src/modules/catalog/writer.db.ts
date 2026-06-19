// No "server-only": used by the node seed/ingest workers as well as server code.
import type { Model } from "@/core/model/schema";
import { getDb } from "@/infra/db/client";
import { models } from "@/infra/db/schema";
import type { CatalogWriter } from "./writer";

/** Flatten a Model into the indexed columns + full jsonb payload. */
function toRow(m: Model) {
  return {
    slug: m.slug,
    id: m.id,
    name: m.name,
    family: m.family,
    license: m.license,
    paramsB: m.paramsB,
    contextLen: m.text.contextLen,
    numLayers: m.text.numLayers,
    attentionType: m.text.attentionType,
    isMoe: !!m.text.moe,
    modalities: m.modalities,
    downloads: m.stats.downloads,
    likes: m.stats.likes,
    mmlu: m.stats.benchmarks?.mmlu ?? null,
    lastModified: m.stats.lastModified ?? null,
    data: m,
  };
}

export class DbCatalogWriter implements CatalogWriter {
  async upsert(m: Model): Promise<void> {
    const db = await getDb();
    const row = toRow(m);
    await db
      .insert(models)
      .values(row)
      .onConflictDoUpdate({ target: models.slug, set: { ...row, updatedAt: new Date() } });
  }

  async upsertMany(list: Model[]): Promise<void> {
    for (const m of list) await this.upsert(m);
  }
}
