import fs from "node:fs";
import path from "node:path";
import { normalizeModel, type ModelInfo } from "@/core/model/extract";
import type { Model } from "@/core/model/schema";
import { fetchConfig, fetchInfo, localParamCount } from "./sources/hf";

export type Target = {
  id: string;
  /** ungated mirror to read config/metadata from when upstream is gated */
  mirror?: string;
  /** local directory (config.json + safetensors) instead of HF */
  local?: string;
  note?: string;
};

export type BenchmarkMatrix = Record<string, Record<string, number | null>>;

/**
 * Fetch (or read local) one model's config + metadata, normalize to the domain
 * Model, and merge curated benchmark metrics. Pure of persistence.
 */
export async function buildModel(target: Target, metrics: BenchmarkMatrix): Promise<Model> {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let config: any;
  let info: ModelInfo = {};

  if (target.local) {
    config = JSON.parse(fs.readFileSync(path.join(target.local, "config.json"), "utf8"));
    const total = localParamCount(target.local);
    info = { safetensors: total ? { total } : undefined, cardData: { license: "gemma" } };
  } else {
    const fetchId = target.mirror ?? target.id;
    [config, info] = await Promise.all([fetchConfig(fetchId), fetchInfo(fetchId)]);
    if (target.mirror) {
      // Prefer upstream stats (downloads/likes) over the mirror's.
      try {
        info = { ...(await fetchInfo(target.id)), safetensors: info.safetensors };
      } catch {
        /* upstream may be gated for the API too — mirror stats are acceptable */
      }
    }
  }

  const model = normalizeModel(target.id, config, info);
  if (target.note) model.source.note = target.note;

  const bm = metrics[target.id];
  if (bm) {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(bm)) if (typeof v === "number") clean[k] = v;
    model.stats.benchmarks = clean;
  }

  return model;
}
