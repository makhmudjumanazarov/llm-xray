// Seed the catalog DB from the JSON snapshot (data/models/*.json).
// Run: CATALOG_SOURCE=db npm run db:seed   (PGlite by default, Postgres if DATABASE_URL set)
import fs from "node:fs";
import path from "node:path";
import type { Model } from "@/core/model/schema";
import { DbCatalogWriter } from "@/modules/catalog/writer.db";

const DIR = path.join(process.cwd(), "data", "models");

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const list = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Model);
  await new DbCatalogWriter().upsertMany(list);
  console.log(`Seeded ${list.length} models into ${process.env.DATABASE_URL ? "Postgres" : "PGlite"}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
