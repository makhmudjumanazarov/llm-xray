import type { Model } from "./schema";

// Tokens that are NOT part of a version/series (variants, formats, fine-tunes).
const NOISE = new Set([
  "instruct", "chat", "base", "it", "sft", "dpo", "rlhf", "preview", "dev", "hf",
  "mini", "tiny", "small", "medium", "large", "nano", "super", "flash", "pro", "lite", "micro", "moe",
  "bf16", "fp8", "nvfp4", "gguf", "awq", "gptq", "mlx", "int4", "int8", "4bit", "8bit",
]);

/** Family = the HuggingFace org account (the "folder"): "Qwen/Qwen2.5-7B" → "Qwen". */
export function familyOf(model: Model): string {
  return model.id.includes("/") ? model.id.split("/")[0] : model.family;
}

/**
 * Version/series = the model name with size, dates, precision, context and
 * variant tokens stripped: "Qwen2.5-7B-Instruct" → "Qwen2.5",
 * "DeepSeek-V2-Lite" → "DeepSeek-V2", "Llama-3.1-8B-Instruct" → "Llama-3.1".
 */
export function modelVersion(model: Model): string {
  const name = model.id.includes("/") ? model.id.split("/")[1] : model.name;
  const tokens = name.split(/[-_]/);
  const kept = tokens.filter((tok, i) => {
    if (i === 0) return true; // series root always kept (Qwen2.5, SmolLM2, phi…)
    if (/\d(\.\d+)?[bm]$/i.test(tok)) return false; // size: 7B, 1.5B, 8x7B, 270m, A12B, E4B
    if (/^\d{4}$/.test(tok)) return false; // date stamp: 2507, 0425, 0528
    if (/^v\d+\.\d+$/i.test(tok)) return false; // minor: v0.1, v0.3
    if (/^\d+k$/i.test(tok)) return false; // context: 4k, 128k
    return !NOISE.has(tok.toLowerCase());
  });
  return kept.join("-") || tokens[0] || name;
}

export type VersionGroup = { version: string; models: Model[] };
export type FamilyGroup = { family: string; models: Model[]; versions: VersionGroup[] };

const topDownloads = (arr: Model[]) => Math.max(0, ...arr.map((m) => m.stats.downloads ?? 0));

/** Group models into family → version → model, sorted by popularity at each level. */
export function buildModelTree(models: Model[]): FamilyGroup[] {
  const byFamily = new Map<string, Model[]>();
  for (const m of models) {
    const f = familyOf(m);
    const list = byFamily.get(f);
    if (list) list.push(m);
    else byFamily.set(f, [m]);
  }

  const families: FamilyGroup[] = [];
  for (const [family, fmodels] of byFamily) {
    const byVer = new Map<string, Model[]>();
    for (const m of fmodels) {
      const v = modelVersion(m);
      const list = byVer.get(v);
      if (list) list.push(m);
      else byVer.set(v, [m]);
    }
    const versions: VersionGroup[] = [...byVer.entries()]
      .map(([version, vmodels]) => ({
        version,
        models: [...vmodels].sort((a, b) => (b.stats.downloads ?? 0) - (a.stats.downloads ?? 0)),
      }))
      .sort((a, b) => topDownloads(b.models) - topDownloads(a.models));
    families.push({ family, models: fmodels, versions });
  }
  return families.sort((a, b) => topDownloads(b.models) - topDownloads(a.models));
}
