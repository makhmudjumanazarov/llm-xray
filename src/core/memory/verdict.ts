// Fits / tight / no verdicts plus the two inverse questions the calculator
// answers: "how much context still fits?" and "which quant would fit?".

import {
  estimateMemory,
  layerMix,
  isCacheFree,
  MLA_LATENT_ELEMS,
  OVERHEAD_FLAT_BYTES,
  OVERHEAD_FRAC,
  type MemoryInput,
} from "./estimate";
import { weightsBytes, QUANT_PRESETS, type QuantId } from "./quant";

export type VerdictStatus = "fits" | "tight" | "no";

/** Totals at or below this share of usable VRAM are a comfortable fit. */
export const FITS_THRESHOLD = 0.9;

/** Context lengths are reported in steps of this many tokens. */
export const CONTEXT_STEP = 512;

export type Verdict = {
  status: VerdictStatus;
  /** Usable VRAM minus the estimate (negative when it doesn't fit). */
  headroomBytes: number;
  /** How many of this device the total would need (1 when it fits). */
  gpusNeeded: number;
};

export function verdictFor(totalBytes: number, gpuUsableBytes: number): Verdict {
  const headroomBytes = gpuUsableBytes - totalBytes;
  const status: VerdictStatus =
    gpuUsableBytes > 0 && totalBytes <= gpuUsableBytes * FITS_THRESHOLD
      ? "fits"
      : totalBytes <= gpuUsableBytes
        ? "tight"
        : "no";
  const gpusNeeded = gpuUsableBytes > 0 ? Math.max(1, Math.ceil(totalBytes / gpuUsableBytes)) : Infinity;
  return { status, headroomBytes, gpusNeeded };
}

/**
 * Largest context (multiple of CONTEXT_STEP, capped at the model's own limit)
 * whose total still fits in `gpuUsableBytes`. Inverts the linear overhead
 * model and the piecewise-linear KV curve in closed form. Returns null when
 * even CONTEXT_STEP tokens don't fit, or for cache-free (SSM) models where
 * context doesn't affect memory.
 */
export function maxContextThatFits(
  input: MemoryInput,
  quant: QuantId,
  batch: number,
  gpuUsableBytes: number,
): number | null {
  const text = input.text;
  if (isCacheFree(text)) return null;
  const weights = weightsBytes(input.paramsB, quant);
  // total = (1 + FRAC) * (weights + kv) + FLAT  =>  kv budget:
  const kvBudget = (gpuUsableBytes - OVERHEAD_FLAT_BYTES) / (1 + OVERHEAD_FRAC) - weights;
  if (kvBudget <= 0) return null;

  const bytesPerElem = 2;
  let ctx: number;
  if (text.attentionType === "mla") {
    ctx = kvBudget / (text.numLayers * MLA_LATENT_ELEMS * bytesPerElem * batch);
  } else {
    const { fullLayers, slidingLayers } = layerMix(text);
    const perTokenLayer = 2 * text.numKVHeads * text.headDim * bytesPerElem * batch;
    const window = text.slidingWindow ?? 0;
    const kvAtWindow = window > 0 ? (fullLayers + slidingLayers) * window * perTokenLayer : 0;
    if (window > 0 && kvBudget >= kvAtWindow) {
      // Past the window only full-attention layers keep growing.
      ctx =
        fullLayers > 0
          ? window + (kvBudget - kvAtWindow) / (fullLayers * perTokenLayer)
          : Infinity; // all layers windowed: KV stops growing entirely
    } else {
      // Below the window every layer stores every token.
      ctx = kvBudget / ((fullLayers + slidingLayers) * perTokenLayer);
    }
  }

  const modelMax = text.contextLen > 0 ? text.contextLen : Infinity;
  const stepped = Math.floor(Math.min(ctx, modelMax) / CONTEXT_STEP) * CONTEXT_STEP;
  if (!Number.isFinite(stepped)) return text.contextLen > 0 ? text.contextLen : null;
  if (stepped < CONTEXT_STEP) return null;
  // Guard against float drift right at the boundary.
  const check = estimateMemory(input, { quant, contextLen: stepped, batch });
  return check.totalBytes <= gpuUsableBytes ? stepped : Math.max(0, stepped - CONTEXT_STEP) || null;
}

/** Highest-precision quant whose total fits (fits or tight); null when none does. */
export function bestQuantThatFits(
  input: MemoryInput,
  contextLen: number,
  batch: number,
  gpuUsableBytes: number,
): QuantId | null {
  for (const preset of QUANT_PRESETS) {
    const est = estimateMemory(input, { quant: preset.id, contextLen, batch });
    if (verdictFor(est.totalBytes, gpuUsableBytes).status !== "no") return preset.id;
  }
  return null;
}
