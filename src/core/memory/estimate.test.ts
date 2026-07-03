import { describe, it, expect } from "vitest";
import {
  estimateMemory,
  kvCacheBytes,
  layerMix,
  isCacheFree,
  memoryInputFrom,
  MLA_LATENT_ELEMS,
  OVERHEAD_FLAT_BYTES,
  OVERHEAD_FRAC,
  type MemoryTextInput,
  type AssumptionId,
} from "./estimate";
import { QUANT_PRESETS, DEFAULT_QUANT, quantById, weightsBytes } from "./quant";
import { GPU_PRESETS, DEFAULT_GPU_ID, gpuById, usableBytes, type GpuVendor } from "./gpus";
import { cacheBytes } from "@/core/learn/kvcache";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

const GIB = 1024 ** 3;

/** Llama-3-8B-shaped text config: 32 layers, GQA 8 KV heads, headDim 128. */
const llama8b: MemoryTextInput = {
  numLayers: 32,
  numKVHeads: 8,
  headDim: 128,
  contextLen: 8192,
  attentionType: "gqa",
};

/** Gemma-shaped mix: 30 sliding + 6 full layers, window 512. */
const gemmaish: MemoryTextInput = {
  numLayers: 36,
  numKVHeads: 8,
  headDim: 128,
  contextLen: 32768,
  attentionType: "gqa",
  slidingWindow: 512,
  layerTypes: [
    ...Array.from({ length: 30 }, () => "sliding_attention"),
    ...Array.from({ length: 6 }, () => "full_attention"),
  ],
};

/** DeepSeek-V3-shaped MLA config. */
const deepseekish: MemoryTextInput = {
  numLayers: 61,
  numKVHeads: 128,
  headDim: 56,
  contextLen: 163840,
  attentionType: "mla",
};

/** Falcon-Mamba-shaped SSM config (no KV cache at all). */
const mambaish: MemoryTextInput = {
  numLayers: 64,
  numKVHeads: 0,
  headDim: 0,
  contextLen: 0,
  attentionType: "mqa",
};

describe("quant presets", () => {
  it("ids are unique and ordered highest → lowest precision", () => {
    const ids = QUANT_PRESETS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < QUANT_PRESETS.length; i++) {
      expect(QUANT_PRESETS[i].bitsPerWeight).toBeLessThan(QUANT_PRESETS[i - 1].bitsPerWeight);
    }
    expect(quantById(DEFAULT_QUANT)).toBeTruthy();
  });

  it("weightsBytes: 7B fp16 = 14 GB decimal; 70B q4_k_m ≈ 42.4 GB decimal", () => {
    expect(weightsBytes(7, "fp16")).toBe(14e9);
    expect(weightsBytes(70, "q4_k_m")).toBeCloseTo(42.4375e9, -6);
    expect(weightsBytes(0, "fp16")).toBe(0);
  });
});

describe("gpu presets", () => {
  it("ids unique, sizes positive, default exists", () => {
    const ids = GPU_PRESETS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GPU_PRESETS) {
      expect(g.vramGB).toBeGreaterThan(0);
      expect(g.usableFraction).toBeGreaterThan(0);
      expect(g.usableFraction).toBeLessThanOrEqual(1);
    }
    expect(gpuById(DEFAULT_GPU_ID)).toBeTruthy();
  });

  it("usableBytes applies the addressable fraction", () => {
    expect(usableBytes(24)).toBe(24 * GIB);
    expect(usableBytes(16, 0.75)).toBe(12 * GIB);
  });
});

describe("kvCacheBytes", () => {
  it("matches the lesson formula for plain full attention", () => {
    const ours = kvCacheBytes(llama8b, 8192);
    expect(ours).toBe(cacheBytes(8192, 32, 8, 128, 2));
    expect(ours).toBe(2 * 32 * 8 * 128 * 8192 * 2); // = 1 GiB
    expect(ours).toBe(1 * GIB);
  });

  it("scales linearly with batch", () => {
    expect(kvCacheBytes(llama8b, 8192, 4)).toBe(4 * kvCacheBytes(llama8b, 8192, 1));
  });

  it("caps sliding layers at the window", () => {
    const ctx = 32768;
    const perTokenLayer = 2 * 8 * 128 * 2;
    const expected = (6 * ctx + 30 * 512) * perTokenLayer;
    expect(kvCacheBytes(gemmaish, ctx)).toBe(expected);
    // Far below an all-full cache of the same depth.
    expect(kvCacheBytes(gemmaish, ctx)).toBeLessThan(
      kvCacheBytes({ ...gemmaish, slidingWindow: undefined, layerTypes: undefined }, ctx),
    );
  });

  it("window without layerTypes applies to every layer", () => {
    const mix = layerMix({ ...llama8b, slidingWindow: 4096 });
    expect(mix).toEqual({ fullLayers: 0, slidingLayers: 32 });
    const capped = kvCacheBytes({ ...llama8b, slidingWindow: 4096 }, 8192);
    expect(capped).toBe(kvCacheBytes(llama8b, 4096));
  });

  it("MLA caches the compressed latent, far below naive K/V heads", () => {
    const ctx = 8192;
    expect(kvCacheBytes(deepseekish, ctx)).toBe(61 * MLA_LATENT_ELEMS * ctx * 2);
    const naive = 2 * 61 * 128 * 56 * ctx * 2;
    expect(kvCacheBytes(deepseekish, ctx)).toBeLessThan(naive / 20);
  });

  it("SSM models keep no cache", () => {
    expect(isCacheFree(mambaish)).toBe(true);
    expect(kvCacheBytes(mambaish, 100000)).toBe(0);
  });
});

describe("estimateMemory", () => {
  it("composes weights + kv + linear overhead", () => {
    const est = estimateMemory({ paramsB: 8, text: llama8b }, { quant: "fp16", contextLen: 8192 });
    expect(est.weightsBytes).toBe(16e9);
    expect(est.kvBytes).toBe(1 * GIB);
    expect(est.overheadBytes).toBeCloseTo(OVERHEAD_FLAT_BYTES + OVERHEAD_FRAC * (16e9 + GIB), 0);
    expect(est.totalBytes).toBe(est.weightsBytes + est.kvBytes + est.overheadBytes);
  });

  it("emits the right assumptions per architecture", () => {
    const has = (text: MemoryTextInput, moeExperts: number | undefined, ctx: number, ids: AssumptionId[]) => {
      const est = estimateMemory({ paramsB: 10, text, moeExperts }, { quant: DEFAULT_QUANT, contextLen: ctx });
      for (const id of ids) expect(est.assumptions, ids.join()).toContain(id);
      return est.assumptions;
    };
    expect(has(llama8b, undefined, 8192, ["overhead-model"])).not.toContain("sliding-window");
    has(gemmaish, undefined, 32768, ["sliding-window"]);
    // Below the window, no sliding note.
    expect(has(gemmaish, undefined, 256, [])).not.toContain("sliding-window");
    has(deepseekish, 256, 8192, ["mla-compressed", "moe-all-experts"]);
    has(mambaish, undefined, 0, ["ssm-no-kv"]);
  });

  it("memoryInputFrom picks up MoE expert counts", () => {
    const input = memoryInputFrom({
      paramsB: 46.7,
      text: { ...llama8b, moe: { numExperts: 8, topK: 2 } } as never,
    });
    expect(input.moeExperts).toBe(8);
  });
});

describe("calculator i18n contract", () => {
  type Dict = Record<string, unknown>;
  const calcEn = (en as Dict).calculator as Dict;
  const notes = calcEn.notes as Record<string, string>;
  const gpuGroups = calcEn.gpuGroups as Record<string, string>;

  it("en has a note for every assumption id", () => {
    const ids: AssumptionId[] = ["moe-all-experts", "mla-compressed", "ssm-no-kv", "sliding-window", "overhead-model"];
    for (const id of ids) expect(typeof notes[id], `calculator.notes.${id}`).toBe("string");
  });

  it("en has a label for every gpu vendor group", () => {
    const vendors: GpuVendor[] = ["consumer", "datacenter", "apple"];
    for (const v of vendors) expect(typeof gpuGroups[v], `calculator.gpuGroups.${v}`).toBe("string");
  });

  it("en and ru calculator subtrees have identical key sets", () => {
    const keyPaths = (obj: unknown, prefix = ""): string[] => {
      if (obj === null || typeof obj !== "object") return [prefix];
      return Object.entries(obj as Dict).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
    };
    expect(keyPaths((ru as Dict).calculator).sort()).toEqual(keyPaths(calcEn).sort());
  });
});
