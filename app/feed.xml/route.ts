import { getAllModels } from "@/modules/catalog";
import { buildRssFeed } from "@/core/rss";

// /feed.xml — RSS 2.0 of recently updated models. Prerendered at build; the
// 6-hourly ingest cron commits fresh snapshots, so each deploy refreshes it.
// (proxy.ts never sees it: its matcher excludes any path containing a dot.)
export const dynamic = "force-static";

export async function GET() {
  const models = await getAllModels();
  return new Response(buildRssFeed(models), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
