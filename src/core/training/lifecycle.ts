// Pure, React-free model of the LLM training lifecycle — the "zero to hero" arc
// the home-page section animates: pretraining → SFT → preference tuning → eval.
// Language-neutral facts only (accent, icon, illustrative capability, the KaTeX
// objective). Every display string lives in messages/*.json under `journey`, keyed
// by the stage id — so this module is testable and the UI stays translatable.

export type StageId = "pretraining" | "sft" | "preference" | "eval";

/** Design-system color token that themes each stage (see app/globals.css). */
export type AccentToken = "--slide" | "--aud" | "--full" | "--vis";

/** Icon component name from components/ui/icons.tsx. */
export type StageIconName = "Database" | "Target" | "Scale" | "Trophy";

export type StageMeta = {
  id: StageId;
  accentToken: AccentToken;
  iconName: StageIconName;
  /**
   * Illustrative cumulative capability AFTER this stage, 0–100. A teaching device
   * for the "zero → hero" rail — explicitly NOT a benchmark score.
   */
  capabilityPct: number;
  /** KaTeX string for the stage's training objective (shown in expert mode). */
  formulaKatex: string;
};

/** The four canonical stages, in training order. */
export const LIFECYCLE_STAGES: readonly StageMeta[] = [
  {
    id: "pretraining",
    accentToken: "--slide",
    iconName: "Database",
    capabilityPct: 30,
    formulaKatex: "\\mathcal{L}_{\\text{PT}} = -\\sum_{t=1}^{T} \\log p_\\theta\\!\\left(x_t \\mid x_{<t}\\right)",
  },
  {
    id: "sft",
    accentToken: "--aud",
    iconName: "Target",
    capabilityPct: 58,
    formulaKatex:
      "\\mathcal{L}_{\\text{SFT}} = -\\sum_{t \\in \\text{resp}} \\log p_\\theta\\!\\left(y_t \\mid x,\\, y_{<t}\\right), \\quad W = W_0 + \\tfrac{\\alpha}{r} B A",
  },
  {
    id: "preference",
    accentToken: "--full",
    iconName: "Scale",
    capabilityPct: 82,
    formulaKatex:
      "\\mathcal{L}_{\\text{DPO}} = -\\,\\mathbb{E}_{(x,\\,y_w,\\,y_l)}\\!\\left[\\log \\sigma\\!\\left(\\beta \\log \\tfrac{\\pi_\\theta(y_w\\mid x)}{\\pi_{\\text{ref}}(y_w\\mid x)} - \\beta \\log \\tfrac{\\pi_\\theta(y_l\\mid x)}{\\pi_{\\text{ref}}(y_l\\mid x)}\\right)\\right]",
  },
  {
    id: "eval",
    accentToken: "--vis",
    iconName: "Trophy",
    capabilityPct: 100,
    formulaKatex:
      "\\text{Score} = \\frac{1}{N}\\sum_{i=1}^{N} \\mathbf{1}\\!\\left[\\hat{y}_i = y_i\\right]",
  },
] as const;

export const STAGE_COUNT = LIFECYCLE_STAGES.length;

/**
 * RLHF/PPO objective (shown in expert mode when the preference method is RLHF):
 * maximize expected reward minus a β-weighted KL to the frozen SFT reference.
 * The DPO loss is the preference stage's `formulaKatex`; this is the RLHF
 * alternative, kept here (language-neutral) next to it.
 */
export const PPO_OBJECTIVE_KATEX =
  "\\max_{\\pi_\\theta}\\; \\mathbb{E}_{x,\\,y\\sim\\pi_\\theta}\\!\\big[r_\\phi(x,y)\\big] - \\beta\\,\\mathrm{KL}\\!\\big(\\pi_\\theta(\\cdot\\mid x)\\,\\|\\,\\pi_{\\text{ref}}(\\cdot\\mid x)\\big)";

/** Clamp an arbitrary number to a valid stage index [0, STAGE_COUNT-1]. */
export function clampStageIndex(i: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(STAGE_COUNT - 1, Math.trunc(i)));
}

/** Next stage index, clamped at the last stage. */
export function nextStage(i: number): number {
  return clampStageIndex(i + 1);
}

/** Previous stage index, clamped at the first stage. */
export function prevStage(i: number): number {
  return clampStageIndex(i - 1);
}

/** Illustrative capability after the stage at `index` (clamped). */
export function capabilityAt(index: number): number {
  return LIFECYCLE_STAGES[clampStageIndex(index)].capabilityPct;
}

/**
 * Even horizontal position (%) for a stage on the shared timeline axis — centered
 * in its equal segment. The capability bar ticks AND the stepper icons both use
 * this, so they line up vertically. 4 stages → 12.5 / 37.5 / 62.5 / 87.5.
 */
export function stageAxisPct(index: number): number {
  return ((clampStageIndex(index) + 0.5) / STAGE_COUNT) * 100;
}

/** Look up a stage by id (undefined if unknown). */
export function stageById(id: StageId): StageMeta | undefined {
  return LIFECYCLE_STAGES.find((s) => s.id === id);
}

/**
 * The "zero → hero" invariant: capability strictly increases stage to stage and
 * tops out at 100. Used as a guard and asserted in tests.
 */
export function isMonotonic(stages: readonly StageMeta[] = LIFECYCLE_STAGES): boolean {
  if (stages.length === 0) return false;
  for (let i = 1; i < stages.length; i++) {
    if (stages[i].capabilityPct <= stages[i - 1].capabilityPct) return false;
  }
  return stages[stages.length - 1].capabilityPct === 100;
}
