// Quantization presets for the VRAM calculator. Bits-per-weight values are
// GGUF *effective* rates (block scales and zero-points included), so
// weightsBytes() matches real checkpoint file sizes, not the naive bit count.
// Labels are proper nouns (Q4_K_M etc.) and stay untranslated.

export type QuantId = "fp16" | "q8_0" | "q6_k" | "q5_k_m" | "q4_k_m" | "q3_k_m";

export type QuantPreset = {
  id: QuantId;
  label: string;
  bitsPerWeight: number;
};

/** Ordered highest-precision → smallest, so "walk down until it fits" is a plain scan. */
export const QUANT_PRESETS: readonly QuantPreset[] = [
  { id: "fp16", label: "FP16", bitsPerWeight: 16 },
  { id: "q8_0", label: "Q8_0", bitsPerWeight: 8.5 },
  { id: "q6_k", label: "Q6_K", bitsPerWeight: 6.6 },
  { id: "q5_k_m", label: "Q5_K_M", bitsPerWeight: 5.7 },
  { id: "q4_k_m", label: "Q4_K_M", bitsPerWeight: 4.85 },
  { id: "q3_k_m", label: "Q3_K_M", bitsPerWeight: 3.9 },
];

export const DEFAULT_QUANT: QuantId = "q4_k_m";

export function quantById(id: string): QuantPreset | undefined {
  return QUANT_PRESETS.find((q) => q.id === id);
}

/** Weight memory in bytes for a model of `paramsB` billion parameters. */
export function weightsBytes(paramsB: number, quant: QuantId): number {
  const preset = quantById(quant);
  if (!preset || !(paramsB > 0)) return 0;
  return (paramsB * 1e9 * preset.bitsPerWeight) / 8;
}
