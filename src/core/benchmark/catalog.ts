// Benchmark metric catalog — defines display order, short labels, full names and
// category for the compare page. All metrics are higher-is-better, 0–100 scale.

export type BenchmarkCategory =
  | "knowledge"
  | "math"
  | "code"
  | "reasoning"
  | "commonsense"
  | "truthfulness"
  | "instruction";

export type BenchmarkMetric = {
  id: string;
  label: string; // short, proper-noun (not translated)
  name: string; // full name
  category: BenchmarkCategory;
};

export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  { id: "mmlu", label: "MMLU", name: "Massive Multitask Language Understanding (5-shot)", category: "knowledge" },
  { id: "gpqa", label: "GPQA", name: "Graduate-level Google-Proof Q&A", category: "knowledge" },
  { id: "gsm8k", label: "GSM8K", name: "Grade-School Math 8K", category: "math" },
  { id: "math", label: "MATH", name: "Competition Mathematics", category: "math" },
  { id: "humaneval", label: "HumanEval", name: "Python code generation (pass@1)", category: "code" },
  { id: "mbpp", label: "MBPP", name: "Mostly Basic Python Problems", category: "code" },
  { id: "arc_c", label: "ARC-C", name: "AI2 Reasoning Challenge (Challenge set)", category: "reasoning" },
  { id: "bbh", label: "BBH", name: "BIG-Bench Hard", category: "reasoning" },
  { id: "hellaswag", label: "HellaSwag", name: "Commonsense sentence completion", category: "commonsense" },
  { id: "winogrande", label: "Winogrande", name: "Commonsense coreference", category: "commonsense" },
  { id: "truthfulqa", label: "TruthfulQA", name: "Truthfulness (MC2)", category: "truthfulness" },
  { id: "ifeval", label: "IFEval", name: "Instruction-following evaluation", category: "instruction" },
];

/** Architecture rows for the compare page (exact values from config). */
export type ArchRow = {
  id: string;
  /** dictionary key under `model` (reused) or `compare.arch`. */
  labelKey: string;
};

export const ARCH_ROWS: ArchRow[] = [
  { id: "paramsB", labelKey: "params" },
  { id: "numLayers", labelKey: "layers" },
  { id: "hiddenSize", labelKey: "hidden" },
  { id: "numHeads", labelKey: "heads" },
  { id: "numKVHeads", labelKey: "kvHeads" },
  { id: "headDim", labelKey: "headDim" },
  { id: "contextLen", labelKey: "context" },
  { id: "intermediateSize", labelKey: "intermediate" },
  { id: "vocabSize", labelKey: "vocab" },
  { id: "attentionType", labelKey: "attention" },
  { id: "normType", labelKey: "norm" },
  { id: "activation", labelKey: "activation" },
  { id: "moe", labelKey: "experts" },
];
