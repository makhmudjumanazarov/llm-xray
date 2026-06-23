import { getAllModels } from "@/modules/catalog";
import { buildLlmsTxt } from "@/core/llmstxt";

// /llms-full.txt — the full map, listing every tracked model. Prerendered.
export const dynamic = "force-static";

export async function GET() {
  const models = await getAllModels();
  return new Response(buildLlmsTxt(models, { full: true }), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
