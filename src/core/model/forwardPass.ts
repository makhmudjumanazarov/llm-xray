// Illustrative forward-pass choreography — pure, data-driven from the Model.
// Produces the ordered frames the 3D scene animates: tokenize → embed →
// each decoder layer → logits → sample. No 3D/React here (testable).

import type { Model } from "./schema";
import { layerColorKind } from "./blocks";

export type FpRegion = "embed" | "layer" | "logits";

export type FpFrame = {
  stage: "tokenize" | "embed" | "layer" | "logits" | "sample" | "done";
  region: FpRegion;
  /** Layers lit up to this index: -1 none, i = current layer, N = all (logits). */
  litIndex: number;
  layer?: number;
  attn?: "sliding" | "full" | "uniform";
  genToken?: number;
  durationMs: number;
};

/** Naive subword-ish tokenizer for the visual (NOT real BPE). */
export function tokenizeIllustrative(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const raw = q.match(/[^\s]+/g) ?? [];
  const toks: string[] = [];
  for (const w of raw) {
    if (w.length > 6) {
      const mid = Math.ceil(w.length / 2);
      toks.push(w.slice(0, mid), w.slice(mid));
    } else {
      toks.push(w);
    }
  }
  return toks.slice(0, 18);
}

export function buildForwardPass(
  model: Model,
  opts: { genTokens?: number; sweepMs?: number } = {},
): FpFrame[] {
  const N = Math.max(1, model.text.numLayers);
  const gen = opts.genTokens ?? 4;
  const sweepMs = opts.sweepMs ?? 3200;
  const layerMs = Math.max(45, Math.round(sweepMs / N));

  const frames: FpFrame[] = [
    { stage: "tokenize", region: "embed", litIndex: -1, durationMs: 900 },
    { stage: "embed", region: "embed", litIndex: -1, durationMs: 900 },
  ];
  for (let i = 0; i < N; i++) {
    frames.push({
      stage: "layer",
      region: "layer",
      litIndex: i,
      layer: i,
      attn: layerColorKind(model, i),
      durationMs: layerMs,
    });
  }
  frames.push({ stage: "logits", region: "logits", litIndex: N, durationMs: 1000 });
  for (let g = 0; g < gen; g++) {
    frames.push({ stage: "sample", region: "logits", litIndex: N, genToken: g + 1, durationMs: 500 });
  }
  frames.push({ stage: "done", region: "logits", litIndex: N, durationMs: 1600 });
  return frames;
}
