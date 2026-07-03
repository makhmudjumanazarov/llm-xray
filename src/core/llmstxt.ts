// Builds the /llms.txt (and /llms-full.txt) document — a curated, markdown map
// of the site for large language models (see llmstxt.org). This is the GEO/LLMO
// counterpart to sitemap.xml: instead of every URL, it gives an answer-engine a
// concise, structured view of what the site is and its most important pages, so
// it can ground and cite answers accurately. Pure: the route handler passes the
// model list in, keeping core free of infra/module imports.

import { SITE_URL, SITE_NAME, localePath } from "@/core/seo";
import { defaultLocale } from "@/i18n/config";
import type { Model } from "@/core/model/schema";

const abs = (path: string) => `${SITE_URL}${localePath(defaultLocale, path)}`;

const SUMMARY =
  "llm-xray ranks the latest open-source large language models by downloads and benchmarks, then lets anyone x-ray a model's internal architecture — attention (MHA/GQA/MQA/MLA), normalization, MLP/SwiGLU, Mixture-of-Experts, RoPE — layer by layer in interactive 2D and 3D. It is a free educational product for learning how LLMs actually work.";

const CONCEPTS: { name: string; note: string }[] = [
  { name: "Attention", note: "scaled dot-product attention, softmax(QKᵀ/√d)·V, and causal masking" },
  { name: "Softmax & Temperature", note: "how logits become probabilities and how temperature reshapes them" },
  { name: "GQA / MQA / MLA", note: "key/value head sharing variants that shrink the KV cache" },
  { name: "Mixture-of-Experts", note: "sparse top-k expert routing (e.g. Mixtral, DeepSeek)" },
  { name: "RoPE", note: "rotary positional embeddings" },
  { name: "Normalization", note: "RMSNorm vs LayerNorm" },
];

/** Quotable architecture facts for one model (shared with the RSS feed). */
export function modelFacts(m: Model): string {
  return [
    m.family,
    `${m.paramsB}B params`,
    m.text.attentionType.toUpperCase(),
    `${m.text.numLayers} layers`,
    m.text.moe ? `MoE ${m.text.moe.numExperts}×top-${m.text.moe.topK}` : null,
    m.modalities.length > 1 ? m.modalities.join("+") : null,
    m.license,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** One model bullet: name → architecture facts the engine can quote. */
function modelLine(m: Model): string {
  return `- [${m.name}](${abs(`/models/${m.slug}`)}): ${modelFacts(m)}`;
}

export function buildLlmsTxt(models: Model[], opts: { full?: boolean } = {}): string {
  const ranked = [...models].sort((a, b) => (b.stats.downloads ?? 0) - (a.stats.downloads ?? 0));
  const topN = opts.full ? ranked : ranked.slice(0, 40);

  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SUMMARY}`);
  lines.push("");
  lines.push(
    "Content is available in English (en), Russian (ru), and Uzbek (uz) under locale-prefixed paths (e.g. /en, /ru, /uz). All pages are free and require no login.",
  );
  lines.push("");

  lines.push("## Core pages");
  lines.push(`- [Home](${abs("")}): what llm-xray is — learn how an LLM is trained and runs, end to end`);
  lines.push(`- [Model rankings](${abs("/models")}): every tracked open-source LLM, filterable/sortable by downloads, params, attention type, MoE, benchmarks`);
  lines.push(`- [Compare](${abs("/compare")}): compare models side by side across 12+ architecture and benchmark metrics`);
  lines.push(`- [Learn](${abs("/learn")}): interactive lessons on the mechanics of transformers and LLMs`);
  lines.push(`- [Evolution](${abs("/evolution")}): the path from classical ML to perceptrons, deep learning, CNNs, RNNs, transformers, and modern LLMs`);
  lines.push(
    `- [VRAM calculator](${abs("/calculator")}): estimate the GPU memory any tracked model needs — weights by quantization (FP16…Q3_K_M), KV cache by context length — and whether it fits a given GPU`,
  );
  lines.push("");

  lines.push("## Concepts explained (Learn)");
  for (const c of CONCEPTS) lines.push(`- ${c.name}: ${c.note}`);
  lines.push("");

  lines.push(opts.full ? `## All models (${topN.length})` : `## Most-downloaded models`);
  for (const m of topN) lines.push(modelLine(m));
  lines.push("");

  if (!opts.full) {
    lines.push("## Optional");
    lines.push(`- [llms-full.txt](${SITE_URL}/llms-full.txt): the same map with every tracked model listed`);
    lines.push(`- [sitemap.xml](${SITE_URL}/sitemap.xml): all URLs with hreflang alternates`);
    lines.push(`- [feed.xml](${SITE_URL}/feed.xml): RSS 2.0 feed of new and recently updated models`);
    lines.push("");
  }

  return lines.join("\n");
}
