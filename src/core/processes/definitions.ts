// Pure, React-free model of "things you do with an already-trained LLM" — the
// post-training / application processes the home page's "Working with LLMs"
// section walks through. Mirrors src/core/training/lifecycle.ts: language-neutral
// facts only (accent, icon, the KaTeX objective). Every display string lives in
// messages/*.json under `processes`, keyed by the process id — so this module is
// testable and the UI stays translatable.

export type ProcessId =
  | "quantization"
  | "distillation"
  | "adaptation"
  | "rag"
  | "agents"
  | "reasoning"
  | "serving"
  | "safety";

/** Design-system color token that themes each process (see app/globals.css). */
export type ProcessAccent =
  | "--slide"
  | "--proj"
  | "--aud"
  | "--vis"
  | "--acc2"
  | "--full"
  | "--cyan"
  | "--acc";

/** Icon component name from components/ui/icons.tsx. */
export type ProcessIconName = "Gauge" | "Scale" | "Sparkles" | "Database" | "Wrench" | "Brain" | "Cpu" | "Shield";

export type ProcessMeta = {
  id: ProcessId;
  accentToken: ProcessAccent;
  iconName: ProcessIconName;
  /** KaTeX string for the process's defining idea (shown in expert mode). */
  formulaKatex: string;
};

/**
 * The eight processes, ordered as a practical lifecycle of working with an open
 * model: shrink it → adapt it → augment it → make it reason → serve it → guard it.
 */
export const PROCESS_DEFINITIONS: readonly ProcessMeta[] = [
  {
    id: "quantization",
    accentToken: "--slide",
    iconName: "Gauge",
    formulaKatex: "w_q = s \\cdot \\operatorname{round}\\!\\left(\\tfrac{w}{s}\\right), \\quad s = \\tfrac{\\max|w|}{2^{b-1}-1}",
  },
  {
    id: "distillation",
    accentToken: "--proj",
    iconName: "Scale",
    formulaKatex:
      "\\mathcal{L} = (1-\\alpha)\\,\\mathrm{CE}(y, p_s) + \\alpha\\,T^2\\,\\mathrm{KL}\\!\\left(p_t^{T} \\,\\|\\, p_s^{T}\\right)",
  },
  {
    id: "adaptation",
    accentToken: "--aud",
    iconName: "Sparkles",
    formulaKatex: "W = W_0 + \\tfrac{\\alpha}{r} B A \\quad (\\text{LoRA on your data})",
  },
  {
    id: "rag",
    accentToken: "--vis",
    iconName: "Database",
    formulaKatex: "p(y \\mid q) = \\sum_{d \\in \\text{top-}k} p(y \\mid q, d)\\, p(d \\mid q)",
  },
  {
    id: "agents",
    accentToken: "--acc2",
    iconName: "Wrench",
    formulaKatex: "a_t = \\pi_\\theta(\\,\\cdot \\mid s_t,\\ \\mathcal{T}\\,), \\quad s_{t+1} = \\mathrm{env}(s_t, a_t)",
  },
  {
    id: "reasoning",
    accentToken: "--full",
    iconName: "Brain",
    formulaKatex: "y = \\arg\\max_y \\sum_{z} p_\\theta(z \\mid x)\\, p_\\theta(y \\mid x, z) \\quad (z = \\text{chain of thought})",
  },
  {
    id: "serving",
    accentToken: "--cyan",
    iconName: "Cpu",
    formulaKatex: "\\text{accept draft } x \\text{ if } \\tfrac{p(x)}{q(x)} \\ge u \\sim U(0,1) \\quad (\\text{speculative})",
  },
  {
    id: "safety",
    accentToken: "--acc",
    iconName: "Shield",
    formulaKatex: "\\text{return } y \\text{ iff } P_\\phi(\\text{unsafe} \\mid x, y) < \\tau",
  },
] as const;

export const PROCESS_COUNT = PROCESS_DEFINITIONS.length;

/** Clamp an arbitrary number to a valid process index [0, PROCESS_COUNT-1]. */
export function clampProcessIndex(i: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(PROCESS_COUNT - 1, Math.trunc(i)));
}

/** Next process index, clamped at the last process. */
export function nextProcess(i: number): number {
  return clampProcessIndex(i + 1);
}

/** Previous process index, clamped at the first process. */
export function prevProcess(i: number): number {
  return clampProcessIndex(i - 1);
}

/**
 * Even horizontal position (%) for a process on the shared stepper axis —
 * centered in its equal segment. 8 processes → 6.25 / 18.75 / … / 93.75.
 */
export function processAxisPct(index: number): number {
  return ((clampProcessIndex(index) + 0.5) / PROCESS_COUNT) * 100;
}

/** Look up a process by id (undefined if unknown). */
export function processById(id: ProcessId): ProcessMeta | undefined {
  return PROCESS_DEFINITIONS.find((p) => p.id === id);
}
