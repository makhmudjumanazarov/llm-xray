import { describe, it, expect } from "vitest";
import {
  verdictFor,
  maxContextThatFits,
  bestQuantThatFits,
  FITS_THRESHOLD,
  CONTEXT_STEP,
} from "./verdict";
import { estimateMemory, type MemoryInput, type MemoryTextInput } from "./estimate";
import { usableBytes } from "./gpus";

const GIB = 1024 ** 3;

const llama8bText: MemoryTextInput = {
  numLayers: 32,
  numKVHeads: 8,
  headDim: 128,
  contextLen: 8192,
  attentionType: "gqa",
};
const llama8b: MemoryInput = { paramsB: 8, text: llama8bText };
const llama70b: MemoryInput = {
  paramsB: 70,
  text: { ...llama8bText, numLayers: 80, contextLen: 131072 },
};
const deepseekV3: MemoryInput = {
  paramsB: 684.5,
  text: { numLayers: 61, numKVHeads: 128, headDim: 56, contextLen: 163840, attentionType: "mla" },
  moeExperts: 256,
};
const mamba: MemoryInput = {
  paramsB: 7.3,
  text: { numLayers: 64, numKVHeads: 0, headDim: 0, contextLen: 0, attentionType: "mqa" },
};

describe("verdictFor", () => {
  const usable = 24 * GIB;

  it("bands at 0.9 and 1.0 of usable VRAM", () => {
    expect(verdictFor(usable * FITS_THRESHOLD, usable).status).toBe("fits");
    expect(verdictFor(usable * FITS_THRESHOLD + 1, usable).status).toBe("tight");
    expect(verdictFor(usable, usable).status).toBe("tight");
    expect(verdictFor(usable + 1, usable).status).toBe("no");
  });

  it("reports headroom and multi-GPU counts", () => {
    const v = verdictFor(10 * GIB, usable);
    expect(v.headroomBytes).toBe(14 * GIB);
    expect(v.gpusNeeded).toBe(1);
    // DeepSeek-V3 at q4_k_m needs several H100s.
    const est = estimateMemory(deepseekV3, { quant: "q4_k_m", contextLen: 8192 });
    const h100 = verdictFor(est.totalBytes, usableBytes(80));
    expect(h100.status).toBe("no");
    expect(h100.gpusNeeded).toBeGreaterThanOrEqual(5);
  });

  it("8B q4 fits comfortably on 24 GB; 70B q4 does not", () => {
    const small = estimateMemory(llama8b, { quant: "q4_k_m", contextLen: 8192 });
    expect(verdictFor(small.totalBytes, usable).status).toBe("fits");
    const big = estimateMemory(llama70b, { quant: "q4_k_m", contextLen: 8192 });
    expect(verdictFor(big.totalBytes, usable).status).toBe("no");
  });
});

describe("maxContextThatFits", () => {
  it("returns a stepped context that fits, where +1 step would not", () => {
    const usable = 6 * GIB;
    const ctx = maxContextThatFits(llama8b, "q4_k_m", 1, usable);
    expect(ctx).not.toBeNull();
    expect(ctx! % CONTEXT_STEP).toBe(0);
    const at = estimateMemory(llama8b, { quant: "q4_k_m", contextLen: ctx! });
    expect(at.totalBytes).toBeLessThanOrEqual(usable);
    if (ctx! + CONTEXT_STEP <= llama8b.text.contextLen) {
      const beyond = estimateMemory(llama8b, { quant: "q4_k_m", contextLen: ctx! + CONTEXT_STEP });
      expect(beyond.totalBytes).toBeGreaterThan(usable);
    }
  });

  it("clamps to the model's own context limit when VRAM is plentiful", () => {
    expect(maxContextThatFits(llama8b, "q4_k_m", 1, usableBytes(141))).toBe(8192);
  });

  it("null when the weights alone don't fit, or for cache-free models", () => {
    expect(maxContextThatFits(llama70b, "fp16", 1, usableBytes(24))).toBeNull();
    expect(maxContextThatFits(mamba, "q4_k_m", 1, usableBytes(24))).toBeNull();
  });

  it("handles an all-window model by clamping to the model limit", () => {
    const windowed: MemoryInput = {
      paramsB: 7,
      text: { ...llama8bText, slidingWindow: 4096, contextLen: 32768 },
    };
    // Past the window KV stops growing, so everything up to the limit fits.
    expect(maxContextThatFits(windowed, "q4_k_m", 1, usableBytes(24))).toBe(32768);
  });

  it("MLA context stretches far beyond naive K/V math", () => {
    const mlaCtx = maxContextThatFits(deepseekV3, "q4_k_m", 1, usableBytes(80 * 8));
    const naive: MemoryInput = { ...deepseekV3, text: { ...deepseekV3.text, attentionType: "gqa" } };
    const naiveCtx = maxContextThatFits(naive, "q4_k_m", 1, usableBytes(80 * 8));
    expect(mlaCtx ?? 0).toBeGreaterThan(naiveCtx ?? 0);
  });
});

describe("bestQuantThatFits", () => {
  it("70B on 48 GB lands on q4_k_m", () => {
    expect(bestQuantThatFits(llama70b, 8192, 1, usableBytes(48))).toBe("q4_k_m");
  });

  it("8B on 24 GB keeps full fp16; DeepSeek-V3 on 12 GB fits nothing", () => {
    expect(bestQuantThatFits(llama8b, 8192, 1, usableBytes(24))).toBe("fp16");
    expect(bestQuantThatFits(deepseekV3, 8192, 1, usableBytes(12))).toBeNull();
  });
});
