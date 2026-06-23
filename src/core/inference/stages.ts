// Pure, React-free model of the inference process — how a trained LLM turns a
// prompt into an answer, one token at a time. Mirrors src/core/training/lifecycle.ts:
// language-neutral facts only (accent, icon, KaTeX). All copy lives under
// messages/*.json `inference.*`, keyed by stage id.

/** The six stages of autoregressive inference, in order. */
export type InferStageId = "tokenize" | "embed" | "layers" | "logits" | "sampling" | "loop";

/** Design-system accent token themed per stage (see app/globals.css). */
export type InferAccent = "--slide" | "--aud" | "--full" | "--vis" | "--acc2";

/** Icon component name from components/ui/icons.tsx. */
export type InferIconName = "Type" | "Grid" | "Layers" | "BarChart" | "Dice" | "Repeat";

export type InferStageMeta = {
  id: InferStageId;
  accentToken: InferAccent;
  iconName: InferIconName;
  /** KaTeX shown in expert mode. */
  formulaKatex: string;
};

export const INFER_STAGES: readonly InferStageMeta[] = [
  {
    id: "tokenize",
    accentToken: "--slide",
    iconName: "Type",
    formulaKatex: "x = [\\,t_1, t_2, \\ldots, t_n\\,] \\in \\mathbb{Z}^{n}",
  },
  {
    id: "embed",
    accentToken: "--aud",
    iconName: "Grid",
    formulaKatex: "h^{(0)}_i = E[\\,t_i\\,] \\in \\mathbb{R}^{d}",
  },
  {
    id: "layers",
    accentToken: "--full",
    iconName: "Layers",
    formulaKatex:
      "\\mathrm{Attn}(Q,K,V)=\\mathrm{softmax}\\!\\left(\\tfrac{QK^\\top}{\\sqrt{d_k}}+M\\right)V,\\quad a = h^{(\\ell)} + \\mathrm{Attn}\\big(\\mathrm{norm}\\,h^{(\\ell)}\\big),\\quad h^{(\\ell+1)} = a + \\mathrm{MLP}\\big(\\mathrm{norm}\\,a\\big)",
  },
  {
    id: "logits",
    accentToken: "--vis",
    iconName: "BarChart",
    formulaKatex: "z = W_U\\,\\mathrm{norm}\\big(h^{(L)}_n\\big),\\quad p = \\mathrm{softmax}(z) \\in \\mathbb{R}^{|V|}",
  },
  {
    id: "sampling",
    accentToken: "--acc2",
    iconName: "Dice",
    formulaKatex: "p_i = \\dfrac{e^{z_i / T}}{\\sum_j e^{z_j / T}},\\quad t_{n+1} \\sim p",
  },
  {
    id: "loop",
    accentToken: "--slide",
    iconName: "Repeat",
    formulaKatex: "x \\leftarrow x \\,\\Vert\\, t_{n+1},\\quad \\text{repeat until } t_{n+1}=\\langle\\text{eos}\\rangle",
  },
] as const;

export const INFER_STAGE_COUNT = INFER_STAGES.length;

export function clampStageIndex(i: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(INFER_STAGE_COUNT - 1, Math.trunc(i)));
}
export function nextStage(i: number): number {
  return clampStageIndex(i + 1);
}
export function prevStage(i: number): number {
  return clampStageIndex(i - 1);
}
export function stageById(id: InferStageId): InferStageMeta | undefined {
  return INFER_STAGES.find((s) => s.id === id);
}

/** Illustrative KV-cache size after generating `stepIndex` tokens past the prompt. */
export function kvCacheSize(stepIndex: number, promptLen: number): number {
  return Math.max(0, promptLen) + Math.max(0, stepIndex);
}
