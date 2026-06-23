// Pure, deterministic illustrative Mixture-of-Experts router. A real router is a
// learned linear layer (softmax(x·W_r)) selecting the top-k experts per token;
// here the per-(token,expert) scores are a fixed hash so the demo is stable.

export type MoePreset = { id: string; label: string; numExperts: number; topK: number };

export const MOE_PRESETS: readonly MoePreset[] = [
  { id: "mixtral", label: "Mixtral · 8", numExperts: 8, topK: 2 },
  { id: "mid", label: "16", numExperts: 16, topK: 4 },
  { id: "big", label: "32", numExperts: 32, topK: 6 },
];

function hash01(a: number, b: number): number {
  let h = (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 1, 40503)) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return (h % 1000) / 1000;
}

/** Deterministic router distribution over experts for a token (sums to 1). */
export function routerScores(tokenIdx: number, numExperts: number): number[] {
  const logits = Array.from({ length: numExperts }, (_, e) => hash01(tokenIdx, e) * 4 - 2);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Indices of the top-k experts (highest score first). */
export function topKIndices(scores: number[], k: number): number[] {
  return scores
    .map((p, i) => [p, i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, Math.max(1, Math.min(k, scores.length)))
    .map(([, i]) => i);
}

/** Fraction of the MLP compute that runs per token (top-k of all experts). */
export function activeFraction(topK: number, numExperts: number): number {
  return numExperts > 0 ? Math.min(1, topK / numExperts) : 0;
}
