import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Model } from "@/core/model/schema";
import type { CatalogRepository } from "./repository";

const DATA_DIR = path.join(process.cwd(), "data", "models");

/**
 * Build-time snapshot implementation: reads data/models/*.json.
 * In-process cache is fine because the snapshot is immutable per deploy.
 */
export class FileCatalogRepository implements CatalogRepository {
  private cache: Model[] | null = null;

  private load(): Model[] {
    if (this.cache) return this.cache;
    let files: string[] = [];
    try {
      files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    } catch {
      return (this.cache = []);
    }
    const models = files.map(
      (f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8")) as Model,
    );
    // Default ordering: most-downloaded first.
    models.sort((a, b) => (b.stats.downloads ?? 0) - (a.stats.downloads ?? 0));
    return (this.cache = models);
  }

  async all(): Promise<Model[]> {
    return this.load();
  }

  async bySlug(slug: string): Promise<Model | undefined> {
    return this.load().find((m) => m.slug === slug);
  }

  async slugs(): Promise<string[]> {
    return this.load().map((m) => m.slug);
  }
}
