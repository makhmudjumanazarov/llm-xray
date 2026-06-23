// Pure RoPE (rotary position embedding) math. Each dimension-pair i rotates by
// an angle m·θ_i that grows with position m; the base θ controls how slowly the
// lowest frequencies turn (larger base → longer effective context).

export type RopePreset = { id: string; label: string; base: number };

export const ROPE_PRESETS: readonly RopePreset[] = [
  { id: "llama", label: "θ = 10 000 (Llama)", base: 10000 },
  { id: "qwen", label: "θ = 1 000 000 (Qwen3)", base: 1000000 },
];

/** Per-dimension-pair frequencies θ_i = base^(-2i/d), i = 0 … d/2-1. */
export function ropeFreqs(headDim: number, base: number): number[] {
  const half = Math.max(1, Math.floor(headDim / 2));
  const freqs: number[] = [];
  for (let i = 0; i < half; i++) freqs.push(Math.pow(base, (-2 * i) / headDim));
  return freqs;
}

/** Rotation (cos, sin) applied to a dim-pair at position `pos` with frequency `freq`. */
export function rotate(pos: number, freq: number): { cos: number; sin: number } {
  const angle = pos * freq;
  return { cos: Math.cos(angle), sin: Math.sin(angle) };
}
