// Pure, React-free model of the AI-architecture evolution — the "from classical
// ML to LLMs" arc the /evolution section animates. Mirrors src/core/training/
// lifecycle.ts: language-neutral facts only (accent, icon, illustrative
// capability, the KaTeX idea, and representative catalog slugs). Every display
// string lives in messages/*.json under `evolution`, keyed by the era id — so
// this module is testable and the UI stays translatable.

export type EraId =
  | "classical_ml"
  | "perceptron"
  | "deep_learning"
  | "vision_cnn"
  | "nlp_seq"
  | "transformers"
  | "llms"
  | "frontier";

/** Design-system color token that themes each era (see app/globals.css). */
export type EraAccent = "--dim" | "--slide" | "--proj" | "--vis" | "--aud" | "--acc2" | "--full" | "--cyan";

/** Icon component name from components/ui/icons.tsx. */
export type EraIconName = "Function" | "Network" | "Layers" | "Eye" | "Type" | "Grid" | "Bot" | "Globe";

export type EraMeta = {
  id: EraId;
  accentToken: EraAccent;
  iconName: EraIconName;
  /**
   * Illustrative cumulative "what AI could do" level AFTER this era, 0–100.
   * A teaching device for the rising rail — explicitly NOT a benchmark score.
   */
  capabilityPct: number;
  /** KaTeX string for the era's defining idea (shown in expert mode). */
  formulaKatex: string;
  /** Representative model slugs that exist in data/models (deep-linked). */
  modelSlugs?: string[];
};

/** The eight eras, in chronological order (years climb left → right). */
export const EVOLUTION_ERAS: readonly EraMeta[] = [
  {
    id: "classical_ml",
    accentToken: "--dim",
    iconName: "Function",
    capabilityPct: 12,
    formulaKatex: "\\hat{y} = \\operatorname{sign}\\!\\left(\\mathbf{w}^\\top \\mathbf{x} + b\\right)",
  },
  {
    id: "perceptron",
    accentToken: "--slide",
    iconName: "Network",
    capabilityPct: 24,
    formulaKatex: "\\mathbf{a} = \\sigma\\!\\left(W\\mathbf{x} + \\mathbf{b}\\right), \\quad \\Delta w_i = \\eta\\,(y - \\hat{y})\\,x_i",
  },
  {
    id: "deep_learning",
    accentToken: "--proj",
    iconName: "Layers",
    capabilityPct: 38,
    formulaKatex: "\\mathbf{h}^{(l)} = \\sigma\\!\\left(W^{(l)}\\mathbf{h}^{(l-1)} + \\mathbf{b}^{(l)}\\right)",
  },
  {
    id: "vision_cnn",
    accentToken: "--vis",
    iconName: "Eye",
    capabilityPct: 52,
    formulaKatex: "(I * K)(i,j) = \\sum_{m}\\sum_{n} I(i+m,\\, j+n)\\,K(m,n)",
  },
  {
    id: "nlp_seq",
    accentToken: "--aud",
    iconName: "Type",
    capabilityPct: 64,
    formulaKatex: "\\mathbf{h}_t = \\tanh\\!\\left(W_x \\mathbf{x}_t + W_h \\mathbf{h}_{t-1} + \\mathbf{b}\\right)",
  },
  {
    id: "transformers",
    accentToken: "--acc2",
    iconName: "Grid",
    capabilityPct: 78,
    formulaKatex: "\\mathrm{Attention}(Q,K,V) = \\mathrm{softmax}\\!\\left(\\tfrac{QK^\\top}{\\sqrt{d_k}}\\right)V",
    modelSlugs: ["mistralai__mistral-7b-v0.1"],
  },
  {
    id: "llms",
    accentToken: "--full",
    iconName: "Bot",
    capabilityPct: 90,
    formulaKatex: "L(N) \\approx \\left(\\dfrac{N_c}{N}\\right)^{\\alpha_N}",
    modelSlugs: ["distilbert__distilgpt2", "meta-llama__llama-3.1-8b-instruct"],
  },
  {
    id: "frontier",
    accentToken: "--cyan",
    iconName: "Globe",
    capabilityPct: 100,
    formulaKatex: "\\mathbf{y} = \\sum_{i \\in \\mathrm{top\\text{-}}k} g_i(\\mathbf{x})\\, E_i(\\mathbf{x})",
    modelSlugs: [
      "deepseek-ai__deepseek-v3",
      "qwen__qwen3-8b",
      "mistralai__mixtral-8x7b-instruct-v0.1",
      "google__gemma-4-e4b-it",
    ],
  },
] as const;

export const ERA_COUNT = EVOLUTION_ERAS.length;

/** Clamp an arbitrary number to a valid era index [0, ERA_COUNT-1]. */
export function clampEraIndex(i: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(ERA_COUNT - 1, Math.trunc(i)));
}

/** Next era index, clamped at the last era. */
export function nextEra(i: number): number {
  return clampEraIndex(i + 1);
}

/** Previous era index, clamped at the first era. */
export function prevEra(i: number): number {
  return clampEraIndex(i - 1);
}

/** Illustrative capability after the era at `index` (clamped). */
export function capabilityAt(index: number): number {
  return EVOLUTION_ERAS[clampEraIndex(index)].capabilityPct;
}

/**
 * Even horizontal position (%) for an era on the shared timeline axis — centered
 * in its equal segment. The rising rail AND the stepper icons both use this, so
 * they line up vertically. 8 eras → 6.25 / 18.75 / … / 93.75.
 */
export function eraAxisPct(index: number): number {
  return ((clampEraIndex(index) + 0.5) / ERA_COUNT) * 100;
}

/** Look up an era by id (undefined if unknown). */
export function eraById(id: EraId): EraMeta | undefined {
  return EVOLUTION_ERAS.find((e) => e.id === id);
}

/**
 * The "rising capability" invariant: the illustrative level strictly increases
 * era to era and tops out at 100. Used as a guard and asserted in tests.
 */
export function isMonotonic(eras: readonly EraMeta[] = EVOLUTION_ERAS): boolean {
  if (eras.length === 0) return false;
  for (let i = 1; i < eras.length; i++) {
    if (eras[i].capabilityPct <= eras[i - 1].capabilityPct) return false;
  }
  return eras[eras.length - 1].capabilityPct === 100;
}
