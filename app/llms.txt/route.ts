import { getAllModels } from "@/modules/catalog";
import { buildLlmsTxt } from "@/core/llmstxt";

// /llms.txt — a curated markdown map of the site for LLM / answer engines.
// Prerendered at build (reads the build-time model snapshot).
export const dynamic = "force-static";

export async function GET() {
  const models = await getAllModels();
  return new Response(buildLlmsTxt(models, { full: false }), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
