// NOTE: no "server-only" — this module is shared by Next server components AND the
// standalone node workers (seed/ingest), and "server-only" throws outside react-server.
// Client-bundle safety here rests on (1) node-only deps (node:path/pglite/postgres) that
// crash in a browser build, and (2) the server-only marker on the catalog service.ts that
// pages import. The dep-cruiser (app|components)->src/infra rule only blocks DIRECT infra
// imports, not transitive ones, so it is a guard against direct reach, not the whole chain.
import path from "node:path";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { env } from "@/infra/config/env";
import * as schema from "./schema";

// Both drivers expose the same query-builder surface we use; type against PGlite
// and cast the postgres-js instance to it.
export type AppDb = PgliteDatabase<typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "src", "infra", "db", "migrations");

let _db: AppDb | null = null;
let _init: Promise<AppDb> | null = null;

// Stable key so concurrent app replicas serialize their first-run migration.
const MIGRATE_LOCK = 727274;

async function create(): Promise<AppDb> {
  if (env.DATABASE_URL) {
    // Production self-host: real Postgres.
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const sql = postgres(env.DATABASE_URL, { max: 5 });
    const db = drizzle(sql, { schema });
    // Advisory lock prevents "relation already exists" when >1 replica migrates at once.
    await sql`select pg_advisory_lock(${MIGRATE_LOCK})`;
    try {
      await migrate(db, { migrationsFolder: MIGRATIONS });
    } finally {
      await sql`select pg_advisory_unlock(${MIGRATE_LOCK})`;
    }
    return db as unknown as AppDb;
  }
  // Local/dev/CI: embedded Postgres (WASM), persisted to PGLITE_DIR.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(env.PGLITE_DIR);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db;
}

/** Lazily create + migrate the DB once per process. */
export function getDb(): Promise<AppDb> {
  if (_db) return Promise.resolve(_db);
  // Reset the cache on failure so a transient cold-start error can be retried
  // (otherwise a rejected promise would wedge the worker until restart).
  if (!_init) {
    _init = create()
      .then((db) => ((_db = db), db))
      .catch((e) => {
        _init = null;
        throw e;
      });
  }
  return _init;
}
