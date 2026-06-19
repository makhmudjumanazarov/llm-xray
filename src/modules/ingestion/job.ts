import fs from "node:fs";
import path from "node:path";
import type { Model } from "@/core/model/schema";
import { idToSlug } from "@/core/model/schema";
import { buildModel, type Target, type BenchmarkMatrix } from "./pipeline";
import { fetchOrgModels, isLlmCandidate, type HfListModel } from "./sources/hf";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "models");

// Pinned, curated models — guaranteed diverse coverage (GQA/MQA/MLA/MoE/multimodal),
// some via ungated mirror or local files. Always refreshed.
const PINNED: Target[] = [
  { id: "Qwen/Qwen2.5-7B-Instruct" },
  { id: "mistralai/Mistral-7B-Instruct-v0.3" },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1" },
  { id: "deepseek-ai/DeepSeek-V2-Lite" },
  { id: "microsoft/Phi-3-mini-4k-instruct" },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    mirror: "NousResearch/Meta-Llama-3.1-8B-Instruct",
    note: "gated upstream; metadata via ungated mirror",
  },
  { id: "tiiuae/falcon-7b" },
  { id: "distilbert/distilgpt2" },
  {
    id: "google/gemma-4-E4B-it",
    local: "/home/makhmud/On-Premise/gemma-4-E4B-it",
    note: "multimodal preview; read from local config + safetensors",
  },
];

// Official HF org accounts to watch for new/updated open models.
const WATCHED_ORGS = [
  "meta-llama", "Qwen", "mistralai", "google", "deepseek-ai",
  "microsoft", "tiiuae", "allenai", "HuggingFaceTB", "CohereLabs",
  "nvidia", "ibm-granite",
];
const PER_ORG = 8; // top-N candidates per org

// Phase B: replace with CatalogRepository.upsert(model) writing to Postgres.
function persist(model: Model): void {
  fs.writeFileSync(path.join(OUT_DIR, `${model.slug}.json`), JSON.stringify(model, null, 2) + "\n");
}

/** Existing snapshot keyed by slug — used for change detection (lastModified diff). */
function loadExisting(): Map<string, Model> {
  const map = new Map<string, Model>();
  try {
    for (const f of fs.readdirSync(OUT_DIR)) {
      if (!f.endsWith(".json")) continue;
      const m = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8")) as Model;
      map.set(m.slug, m);
    }
  } catch {
    /* first run — no snapshot yet */
  }
  return map;
}

/** Discover candidate models across the watched official accounts. */
async function discover(pinnedIds: Set<string>): Promise<HfListModel[]> {
  const out: HfListModel[] = [];
  const seen = new Set<string>();
  for (const org of WATCHED_ORGS) {
    try {
      const list = await fetchOrgModels(org, 30);
      const picked = list.filter(isLlmCandidate).slice(0, PER_ORG);
      for (const m of picked) {
        if (!m.id || seen.has(m.id) || pinnedIds.has(m.id)) continue;
        seen.add(m.id);
        out.push(m);
      }
      console.log(`  · ${org}: ${picked.length} candidate(s)`);
    } catch (e) {
      console.warn(`  ! discover ${org}: ${(e as Error).message}`);
    }
  }
  return out;
}

export async function runIngestion(): Promise<{ built: number; refreshed: number; total: number }> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const bench = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "benchmarks.json"), "utf8"));
  const metrics: BenchmarkMatrix = bench.metrics ?? {};
  const existing = loadExisting();
  let built = 0;
  let refreshed = 0;

  // 1) Pinned curated set — always full rebuild.
  console.log(`Pinned: ${PINNED.length} curated models`);
  for (const target of PINNED) {
    try {
      const model = await buildModel(target, metrics);
      persist(model);
      built++;
      console.log(`  ✓ ${target.id}  ${model.paramsB}B  ${model.text.attentionType.toUpperCase()}  ${model.text.numLayers}L`);
    } catch (e) {
      console.error(`  ✗ ${target.id}: ${(e as Error).message}`);
    }
  }

  // 2) Discover from official accounts, then change-detect.
  console.log(`\nDiscovering from ${WATCHED_ORGS.length} official accounts…`);
  const pinnedIds = new Set(PINNED.map((p) => p.id));
  const candidates = await discover(pinnedIds);
  console.log(`\nDiscovered ${candidates.length} models → change-detecting…`);

  for (const cand of candidates) {
    const slug = idToSlug(cand.id);
    const ex = existing.get(slug);
    // Unchanged repo → just refresh live stats (no config fetch — cheap, rate-friendly).
    if (ex && ex.stats.lastModified && cand.lastModified && ex.stats.lastModified === cand.lastModified) {
      ex.stats.downloads = cand.downloads ?? ex.stats.downloads;
      ex.stats.likes = cand.likes ?? ex.stats.likes;
      persist(ex);
      refreshed++;
      continue;
    }
    // New or updated → full extract.
    try {
      const model = await buildModel({ id: cand.id }, metrics);
      persist(model);
      built++;
      console.log(`  ✓ ${cand.id}  ${model.paramsB}B  ${model.text.attentionType.toUpperCase()}  ${model.text.numLayers}L`);
    } catch (e) {
      console.error(`  ✗ ${cand.id}: ${(e as Error).message}`);
    }
  }

  const total = built + refreshed;
  console.log(`\nDone: ${built} built/updated, ${refreshed} stat-refreshed → ${total} models.`);
  return { built, refreshed, total };
}
