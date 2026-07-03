import { describe, it, expect } from "vitest";
import { buildRssFeed, escapeXml, RSS_MAX_ITEMS } from "./rss";
import type { Model } from "./model/schema";

function makeModel(i: number, over: Partial<Model> = {}): Model {
  return {
    id: `Org/Model-${i}`,
    slug: `org__model-${i}`,
    name: `Model ${i}`,
    family: "Org",
    architecture: "OrgForCausalLM",
    license: "apache-2.0",
    modalities: ["text"],
    paramsB: 8,
    stats: { downloads: 1, likes: 1, lastModified: `2026-06-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z` },
    text: {
      hiddenSize: 4096,
      numLayers: 32,
      numHeads: 32,
      numKVHeads: 8,
      headDim: 128,
      intermediateSize: 12288,
      vocabSize: 151936,
      contextLen: 8192,
      activation: "silu",
      normType: "rmsnorm",
      attentionType: "gqa",
    },
    source: {},
    ...over,
  };
}

describe("rss feed", () => {
  it("escapes XML-significant characters", () => {
    expect(escapeXml(`a & <b> "c" 'd'`)).toBe("a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;");
  });

  it("sorts newest-first and caps the item count", () => {
    const models = Array.from({ length: 60 }, (_, i) => makeModel(i));
    const xml = buildRssFeed(models);
    expect((xml.match(/<item>/g) ?? []).length).toBe(RSS_MAX_ITEMS);
    // Newest item (day 28) leads the feed and matches lastBuildDate.
    const lastBuild = xml.match(/<lastBuildDate>(.*?)<\/lastBuildDate>/)?.[1];
    const firstPub = xml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    expect(firstPub).toContain("28 Jun 2026");
    expect(lastBuild).toBe(firstPub);
  });

  it("items carry permalink guids, titles with params + attention, and fact descriptions", () => {
    const xml = buildRssFeed([makeModel(1, { name: "Qwen3-8B", slug: "qwen__qwen3-8b" })]);
    expect(xml).toContain(`<guid isPermaLink="true">https://llm-xray.com/en/models/qwen__qwen3-8b</guid>`);
    expect(xml).toContain("<title>Qwen3-8B — 8B GQA</title>");
    expect(xml).toContain("8B params · GQA · 32 layers");
    expect(xml).toContain(`<atom:link href="https://llm-xray.com/feed.xml" rel="self"`);
  });

  it("handles an empty catalog and missing dates without crashing", () => {
    expect(buildRssFeed([])).toContain("<channel>");
    const noDate = makeModel(1);
    noDate.stats.lastModified = undefined;
    noDate.generatedAt = undefined;
    const xml = buildRssFeed([noDate]);
    expect(xml).toContain("<item>");
    expect(xml).not.toContain("<pubDate>");
  });

  it("escapes hostile model names", () => {
    const xml = buildRssFeed([makeModel(1, { name: `<script>alert("x")</script>` })]);
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
  });
});
