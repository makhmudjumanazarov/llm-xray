import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/seo";

// AI / generative-engine crawlers we explicitly welcome — this is an open,
// free educational product, so we WANT to be read, attributed, and cited by
// ChatGPT, Perplexity, Gemini, Claude, and the crawlers that feed them. Listing
// them explicitly (rather than relying on the `*` rule) makes the intent clear
// and survives stricter default policies. See also /llms.txt for a curated map.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
