// Inference-memory estimator: weights + KV cache + runtime overhead.
// Everything is a documented approximation (±10%); each simplification is
// surfaced as an AssumptionId so the UI can render an honest notes list.
// The KV formula generalizes src/core/learn/kvcache.ts cacheBytes() — the two
// must agree for the plain full-attention case.

import type { TextConfig } from "@/core/model/schema";
import { weightsBytes, type QuantId } from "./quant";

/** The subset of TextConfig the estimator needs (tests build these directly). */
export type MemoryTextInput = Pick<
  TextConfig,
  "numLayers" | "numKVHeads" | "headDim" | "contextLen" | "attentionType" | "slidingWindow" | "layerTypes"
>;

export type MemoryInput = {
  paramsB: number;
  text: MemoryTextInput;
  /** MoE expert count when present — all experts sit in VRAM (topK is compute-only). */
  moeExperts?: number;
};

export type MemoryOptions = {
  quant: QuantId;
  contextLen: number;
  batch?: number;
  /** KV-cache element size; 2 = fp16 cache (the common default). */
  kvBytesPerElem?: number;
};

export type AssumptionId =
  | "moe-all-experts"
  | "mla-compressed"
  | "ssm-no-kv"
  | "sliding-window"
  | "overhead-model";

export type MemoryEstimate = {
  weightsBytes: number;
  kvBytes: number;
  overheadBytes: number;
  totalBytes: number;
  assumptions: AssumptionId[];
};

/**
 * MLA caches a compressed latent per token per layer instead of full K/V heads.
 * DeepSeek V3/R1: kv_lora_rank 512 + rope head 64 = 576 elements. The schema
 * doesn't carry kv_lora_rank, so this is a documented family constant.
 */
export const MLA_LATENT_ELEMS = 576;

// Runtime overhead: CUDA context + compute buffers + fragmentation, modeled
// linearly (flat + fraction) so maxContextThatFits can invert it in closed form.
export const OVERHEAD_FLAT_BYTES = 0.75 * 1024 ** 3;
export const OVERHEAD_FRAC = 0.05;

/** Sliding vs full attention layer counts, honoring an explicit per-layer mix. */
export function layerMix(text: MemoryTextInput): { fullLayers: number; slidingLayers: number } {
  if (!text.slidingWindow || text.slidingWindow <= 0) {
    return { fullLayers: text.numLayers, slidingLayers: 0 };
  }
  if (text.layerTypes && text.layerTypes.length > 0) {
    const sliding = text.layerTypes.filter((t) => t.includes("sliding")).length;
    return { fullLayers: text.layerTypes.length - sliding, slidingLayers: sliding };
  }
  // A window with no per-layer map applies everywhere (Mistral-style configs).
  return { fullLayers: 0, slidingLayers: text.numLayers };
}

/** True when the model keeps no KV cache at all (SSM/Mamba blocks). */
export function isCacheFree(text: MemoryTextInput): boolean {
  return !text.numKVHeads || !text.headDim;
}

/** KV-cache bytes at a given context length. */
export function kvCacheBytes(
  text: MemoryTextInput,
  contextLen: number,
  batch = 1,
  bytesPerElem = 2,
): number {
  const ctx = Math.max(0, contextLen);
  if (ctx === 0 || isCacheFree(text)) return 0;
  if (text.attentionType === "mla") {
    return text.numLayers * MLA_LATENT_ELEMS * ctx * bytesPerElem * batch;
  }
  const { fullLayers, slidingLayers } = layerMix(text);
  const slidingTokens = Math.min(ctx, text.slidingWindow ?? ctx);
  // 2 = keys + values, per token per layer.
  const perTokenLayer = 2 * text.numKVHeads * text.headDim * bytesPerElem;
  return (fullLayers * ctx + slidingLayers * slidingTokens) * perTokenLayer * batch;
}

/** Build a MemoryInput straight from a catalog model. */
export function memoryInputFrom(m: { paramsB: number; text: TextConfig }): MemoryInput {
  return { paramsB: m.paramsB, text: m.text, moeExperts: m.text.moe?.numExperts };
}

export function estimateMemory(input: MemoryInput, opts: MemoryOptions): MemoryEstimate {
  const batch = opts.batch ?? 1;
  const kvBytesPerElem = opts.kvBytesPerElem ?? 2;
  const weights = weightsBytes(input.paramsB, opts.quant);
  const kv = kvCacheBytes(input.text, opts.contextLen, batch, kvBytesPerElem);
  const overhead = OVERHEAD_FLAT_BYTES + OVERHEAD_FRAC * (weights + kv);

  const assumptions: AssumptionId[] = [];
  if (input.moeExperts && input.moeExperts > 1) assumptions.push("moe-all-experts");
  if (isCacheFree(input.text)) {
    assumptions.push("ssm-no-kv");
  } else if (input.text.attentionType === "mla") {
    assumptions.push("mla-compressed");
  } else if (
    input.text.slidingWindow &&
    input.text.slidingWindow > 0 &&
    opts.contextLen > input.text.slidingWindow
  ) {
    assumptions.push("sliding-window");
  }
  assumptions.push("overhead-model");

  return {
    weightsBytes: weights,
    kvBytes: kv,
    overheadBytes: overhead,
    totalBytes: weights + kv + overhead,
    assumptions,
  };
}
