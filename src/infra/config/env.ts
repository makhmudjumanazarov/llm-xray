import { z } from "zod";

// Validated environment. Phase A has no required vars (public site URL has a
// default, HF token is optional); Phase B adds DATABASE_URL etc. here.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Hugging Face token — only needed to ingest gated models' config files.
  HF_TOKEN: z.string().optional(),
  // Public origin used for canonical/sitemap URLs.
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  // Catalog data source: "file" (build-time JSON snapshot, default) or "db".
  CATALOG_SOURCE: z.enum(["file", "db"]).default("file"),
  // Postgres connection. When set (and CATALOG_SOURCE=db), uses real Postgres;
  // otherwise the db path falls back to embedded PGlite at PGLITE_DIR.
  DATABASE_URL: z.string().optional(),
  PGLITE_DIR: z.string().default(".pglite"),
  // Optional cookieless analytics (Umami). Documented here for completeness;
  // components read process.env.NEXT_PUBLIC_* directly (they can't import infra).
  NEXT_PUBLIC_UMAMI_URL: z.string().url().optional(),
  NEXT_PUBLIC_UMAMI_ID: z.string().optional(),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
