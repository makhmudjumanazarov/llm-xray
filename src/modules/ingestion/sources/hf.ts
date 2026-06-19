import fs from "node:fs";
import path from "node:path";
import type { ModelInfo } from "@/core/model/extract";
import { env } from "@/infra/config/env";

const UA = "llm-xray-ingest/0.1 (+https://llm-xray.com)";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": UA };
  if (env.HF_TOKEN) h.Authorization = `Bearer ${env.HF_TOKEN}`;
  return h;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: authHeaders(), redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Architecture config — no weights downloaded. */
export async function fetchConfig(id: string): Promise<Record<string, unknown>> {
  return fetchJson(`https://huggingface.co/${id}/resolve/main/config.json`) as Promise<
    Record<string, unknown>
  >;
}

/** HF model-info: downloads, likes, gated, total params (via safetensors expand). */
export async function fetchInfo(id: string): Promise<ModelInfo> {
  const fields = ["downloads", "likes", "lastModified", "gated", "safetensors", "cardData", "tags"];
  const qs = fields.map((f) => `expand[]=${f}`).join("&");
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const j = (await fetchJson(`https://huggingface.co/api/models/${id}?${qs}`)) as any;
  return {
    downloads: j.downloads,
    likes: j.likes,
    lastModified: j.lastModified,
    gated: j.gated,
    tags: j.tags,
    safetensors: j.safetensors,
    cardData: j.cardData,
  };
}

export type HfListModel = {
  id: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  pipeline_tag?: string;
  gated?: boolean | string;
  tags?: string[];
};

// Quantized / derivative repos — not distinct architectures, skip in discovery.
const DERIVATIVE = /(gguf|gptq|awq|-bnb|-4bit|-8bit|-int4|-int8|-fp8|-mlx|onnx)/i;

/** A real, ingestible open LLM (text-generation, not a quantized derivative). */
export function isLlmCandidate(m: HfListModel): boolean {
  if (DERIVATIVE.test(m.id)) return false;
  // Some list responses omit pipeline_tag — fall back to the tags array.
  if (m.pipeline_tag) return m.pipeline_tag === "text-generation";
  return (m.tags ?? []).includes("text-generation");
}

/**
 * Discover models published by an official HF org account (most-downloaded first).
 * This is the live link to official accounts: meta-llama, Qwen, mistralai, google…
 */
export async function fetchOrgModels(org: string, limit = 30): Promise<HfListModel[]> {
  const params = new URLSearchParams({ author: org, sort: "downloads", direction: "-1", limit: String(limit) });
  for (const f of ["downloads", "likes", "lastModified", "pipeline_tag", "gated", "tags"]) {
    params.append("expand[]", f);
  }
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const list = (await fetchJson(`https://huggingface.co/api/models?${params.toString()}`)) as any[];
  return (Array.isArray(list) ? list : []).map((m) => ({
    id: m.id ?? m.modelId,
    downloads: m.downloads,
    likes: m.likes,
    lastModified: m.lastModified,
    pipeline_tag: m.pipeline_tag,
    gated: m.gated,
    tags: m.tags,
  }));
}

/** Total param count from a local safetensors file header (no torch). */
export function localParamCount(dir: string): number | undefined {
  const single = path.join(dir, "model.safetensors");
  const indexPath = path.join(dir, "model.safetensors.index.json");
  const numel = (shape: number[]) => shape.reduce((a, b) => a * b, 1);
  const headerParams = (file: string): number => {
    const fd = fs.openSync(file, "r");
    try {
      const lenBuf = Buffer.alloc(8);
      fs.readSync(fd, lenBuf, 0, 8, 0);
      const headerLen = Number(lenBuf.readBigUInt64LE(0));
      const hdrBuf = Buffer.alloc(headerLen);
      fs.readSync(fd, hdrBuf, 0, headerLen, 8);
      const hdr = JSON.parse(hdrBuf.toString("utf8"));
      let total = 0;
      for (const [k, v] of Object.entries<{ shape?: number[] }>(hdr)) {
        if (k === "__metadata__") continue;
        if (v?.shape) total += numel(v.shape);
      }
      return total;
    } finally {
      fs.closeSync(fd);
    }
  };
  try {
    if (fs.existsSync(indexPath)) {
      const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      const total = idx?.metadata?.total_size;
      if (typeof total === "number") return Math.round(total / 2); // bf16/fp16 = 2 bytes
      const files = new Set(Object.values<string>(idx.weight_map));
      let sum = 0;
      for (const f of files) sum += headerParams(path.join(dir, f));
      return sum;
    }
    if (fs.existsSync(single)) return headerParams(single);
  } catch (e) {
    console.warn(`  ! local param count failed: ${(e as Error).message}`);
  }
  return undefined;
}
