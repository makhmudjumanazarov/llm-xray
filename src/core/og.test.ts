import { describe, it, expect } from "vitest";
import { modelOgStats, archStripSegments, modelOgBadges, OG_STRIP_MAX, OG_THEME } from "./og";
import type { Model } from "./model/schema";

function makeModel(over: Partial<Model["text"]> = {}, paramsB = 8.19): Model {
  return {
    id: "Qwen/Qwen3-8B",
    slug: "qwen__qwen3-8b",
    name: "Qwen3-8B",
    family: "Qwen",
    architecture: "Qwen3ForCausalLM",
    license: "apache-2.0",
    modalities: ["text"],
    paramsB,
    stats: { downloads: 1, likes: 1 },
    text: {
      hiddenSize: 4096,
      numLayers: 36,
      numHeads: 32,
      numKVHeads: 8,
      headDim: 128,
      intermediateSize: 12288,
      vocabSize: 151936,
      contextLen: 40960,
      activation: "silu",
      normType: "rmsnorm",
      attentionType: "gqa",
      ...over,
    },
    source: {},
  };
}

describe("og helpers", () => {
  it("modelOgStats formats params/layers/context", () => {
    const stats = modelOgStats(makeModel());
    expect(stats.map((s) => s.label)).toEqual(["params", "layers", "context"]);
    expect(stats[0].value).toBe("8.19B");
    expect(stats[1].value).toBe("36");
    expect(stats[2].value).toBe("40K");
  });

  it("archStripSegments starts with embed, ends with head, caps its length", () => {
    const strip = archStripSegments(makeModel({ numLayers: 200 }));
    expect(strip[0].kind).toBe("embed");
    expect(strip[strip.length - 1].kind).toBe("head");
    expect(strip.length).toBeLessThanOrEqual(OG_STRIP_MAX);
  });

  it("MoE models get cyan moe ticks; dense get mlp ticks", () => {
    const moe = archStripSegments(makeModel({ moe: { numExperts: 8, topK: 2 } }));
    expect(moe.some((s) => s.kind === "moe" && s.color === OG_THEME.cyan)).toBe(true);
    const dense = archStripSegments(makeModel());
    expect(dense.some((s) => s.kind === "moe")).toBe(false);
    expect(dense.some((s) => s.kind === "mlp")).toBe(true);
  });

  it("badges carry family, attention, and MoE shape", () => {
    expect(modelOgBadges(makeModel())).toEqual(["Qwen", "GQA"]);
    expect(modelOgBadges(makeModel({ moe: { numExperts: 128, topK: 8 } }))).toEqual([
      "Qwen",
      "GQA",
      "MoE 128×top-8",
    ]);
  });
});
