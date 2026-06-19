import { describe, it, expect } from "vitest";
import { buildForwardPass, tokenizeIllustrative } from "./forwardPass";
import type { Model } from "./schema";

/* eslint-disable @typescript-eslint/no-explicit-any */
function model(overrides: any): Model {
  return {
    id: "x/y", slug: "x__y", name: "y", family: "llama", architecture: "T", license: "mit",
    modalities: ["text"], paramsB: 7, stats: { downloads: 0, likes: 0 },
    text: {
      hiddenSize: 4096, numLayers: 6, numHeads: 32, numKVHeads: 8, headDim: 128,
      intermediateSize: 14336, vocabSize: 32000, contextLen: 8192, activation: "silu",
      normType: "rmsnorm", attentionType: "gqa", ...overrides.text,
    },
    source: {},
  } as Model;
}

describe("tokenizeIllustrative", () => {
  it("splits words and breaks long ones into subword-ish pieces", () => {
    expect(tokenizeIllustrative("hi there")).toEqual(["hi", "there"]);
    expect(tokenizeIllustrative("internationalization")).toHaveLength(2);
    expect(tokenizeIllustrative("   ")).toEqual([]);
  });
  it("caps token count", () => {
    expect(tokenizeIllustrative(Array(40).fill("a").join(" ")).length).toBeLessThanOrEqual(18);
  });
});

describe("buildForwardPass", () => {
  it("orders tokenize → embed → N layers → logits → gen → done", () => {
    const f = buildForwardPass(model({}), { genTokens: 4 });
    expect(f[0].stage).toBe("tokenize");
    expect(f[1].stage).toBe("embed");
    const layers = f.filter((x) => x.stage === "layer");
    expect(layers.map((x) => x.layer)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(f.filter((x) => x.stage === "sample")).toHaveLength(4);
    expect(f[f.length - 1].stage).toBe("done");
  });

  it("tags per-layer attention from layerTypes", () => {
    const f = buildForwardPass(model({ text: { numLayers: 2, layerTypes: ["sliding_attention", "full_attention"] } }));
    const layers = f.filter((x) => x.stage === "layer");
    expect(layers[0].attn).toBe("sliding");
    expect(layers[1].attn).toBe("full");
  });

  it("keeps the layer sweep bounded for deep models", () => {
    const f = buildForwardPass(model({ text: { numLayers: 80 } }), { sweepMs: 3200 });
    const layerMs = f.find((x) => x.stage === "layer")!.durationMs;
    expect(layerMs).toBeGreaterThanOrEqual(45);
    expect(layerMs).toBeLessThanOrEqual(80);
  });
});
