// RSS 2.0 feed of the most recently updated models. One English feed
// (/feed.xml): model names and architecture facts are language-neutral, and a
// single feed beats maintaining three. Pure — the route handler passes the
// model list in, following the llms.txt precedent.

import { SITE_URL, SITE_NAME, localePath } from "@/core/seo";
import { defaultLocale } from "@/i18n/config";
import type { Model } from "@/core/model/schema";
import { modelFacts } from "@/core/llmstxt";

export const RSS_MAX_ITEMS = 50;

const FEED_DESCRIPTION =
  "New and recently updated open-source LLMs tracked by llm-xray — architecture, params, attention type, and interactive 2D/3D x-rays.";

const abs = (path: string) => `${SITE_URL}${localePath(defaultLocale, path)}`;

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemDate(m: Model): number {
  const raw = m.stats.lastModified ?? m.generatedAt;
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

export function buildRssFeed(models: Model[]): string {
  const items = [...models].sort((a, b) => itemDate(b) - itemDate(a)).slice(0, RSS_MAX_ITEMS);
  const newest = items.length ? itemDate(items[0]) : 0;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`);
  lines.push(`<channel>`);
  lines.push(`<title>${escapeXml(SITE_NAME)} — new open-source LLMs</title>`);
  lines.push(`<link>${SITE_URL}</link>`);
  lines.push(`<description>${escapeXml(FEED_DESCRIPTION)}</description>`);
  lines.push(`<language>en</language>`);
  if (newest > 0) lines.push(`<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>`);
  lines.push(`<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>`);

  for (const m of items) {
    const url = abs(`/models/${m.slug}`);
    const when = itemDate(m);
    lines.push(`<item>`);
    lines.push(`<title>${escapeXml(`${m.name} — ${m.paramsB}B ${m.text.attentionType.toUpperCase()}`)}</title>`);
    lines.push(`<link>${escapeXml(url)}</link>`);
    lines.push(`<guid isPermaLink="true">${escapeXml(url)}</guid>`);
    if (when > 0) lines.push(`<pubDate>${new Date(when).toUTCString()}</pubDate>`);
    lines.push(`<description>${escapeXml(modelFacts(m))}</description>`);
    lines.push(`</item>`);
  }

  lines.push(`</channel>`);
  lines.push(`</rss>`);
  return lines.join("\n");
}
