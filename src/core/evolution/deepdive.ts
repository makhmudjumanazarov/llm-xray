// Deep-dive content for each evolution era: a milestone timeline and the key
// architectures invented in that era, each broken into an ordered layer stack.
// Mirrors timeline.ts conventions — only LANGUAGE-NEUTRAL structural facts live
// here (layer kinds, technical layer labels, architecture names, years, milestone
// kinds). Translatable prose (milestone descriptions, architecture blurbs) lives
// in messages/*.json under `evolution.eras.<id>.{milestones,architectures}`,
// keyed by the ids below.

import type { EraId } from "./timeline";

/** Coarse layer category → drives the LayerStack color (see LayerStack.tsx). */
export type LayerKind =
  | "input"
  | "embed"
  | "conv"
  | "pool"
  | "norm"
  | "act"
  | "fc"
  | "recurrent"
  | "attention"
  | "residual"
  | "moe"
  | "op"
  | "output";

export const LAYER_KINDS: readonly LayerKind[] = [
  "input", "embed", "conv", "pool", "norm", "act", "fc", "recurrent", "attention", "residual", "moe", "op", "output",
] as const;

/** One stage in an architecture's forward path. Label/note are shown verbatim. */
export type ArchLayer = {
  kind: LayerKind;
  /** Technical, language-neutral label, e.g. "Conv 11×11, 96". */
  label: string;
  /** Optional shape / count hint, e.g. "224×224×3". */
  note?: string;
};

export type Architecture = {
  /** Stable id (i18n blurb key), e.g. "alexnet". */
  id: string;
  /** Language-neutral proper noun, e.g. "AlexNet". */
  name: string;
  year: number;
  /** Ordered input → output. */
  layers: ArchLayer[];
};

export type MilestoneKind = "origin" | "paper" | "award" | "model" | "event";

export const MILESTONE_KINDS: readonly MilestoneKind[] = ["origin", "paper", "award", "model", "event"] as const;

export type Milestone = {
  /** Stable id (i18n label key), e.g. "imagenet2012". */
  id: string;
  year: number;
  kind: MilestoneKind;
};

export type EraDeepDive = {
  milestones: Milestone[]; // chronological
  architectures: Architecture[]; // chronological
};

// Short layer constructors keep the data dense and readable.
const L = (kind: LayerKind, label: string, note?: string): ArchLayer => ({ kind, label, note });

export const EVOLUTION_DETAIL: Record<EraId, EraDeepDive> = {
  classical_ml: {
    milestones: [
      { id: "origin", year: 1957, kind: "origin" },
      { id: "id3", year: 1986, kind: "paper" },
      { id: "svm", year: 1995, kind: "paper" },
      { id: "rf", year: 2001, kind: "paper" },
    ],
    architectures: [
      {
        id: "linreg",
        name: "Logistic Regression",
        year: 1958,
        layers: [
          L("input", "features x", "x ∈ ℝⁿ"),
          L("fc", "linear w·x + b"),
          L("act", "sigmoid σ"),
          L("output", "P(y=1)"),
        ],
      },
      {
        id: "dtree",
        name: "Decision Tree",
        year: 1986,
        layers: [
          L("input", "features x"),
          L("op", "split xᵢ < t"),
          L("op", "split xⱼ < t"),
          L("op", "leaf vote"),
          L("output", "class ŷ"),
        ],
      },
      {
        id: "svm",
        name: "SVM (kernel)",
        year: 1995,
        layers: [
          L("input", "features x"),
          L("op", "kernel φ(x)", "RBF / poly"),
          L("fc", "margin w·φ + b"),
          L("act", "sign"),
          L("output", "class ŷ"),
        ],
      },
    ],
  },

  perceptron: {
    milestones: [
      { id: "perceptron", year: 1958, kind: "origin" },
      { id: "minsky", year: 1969, kind: "event" },
      { id: "backprop", year: 1986, kind: "paper" },
    ],
    architectures: [
      {
        id: "perceptron",
        name: "Perceptron",
        year: 1958,
        layers: [
          L("input", "inputs x"),
          L("fc", "weighted sum w·x + b"),
          L("act", "step"),
          L("output", "0 / 1"),
        ],
      },
      {
        id: "mlp",
        name: "MLP",
        year: 1986,
        layers: [
          L("input", "inputs x"),
          L("fc", "hidden W₁", "n → h"),
          L("act", "sigmoid"),
          L("fc", "output W₂", "h → k"),
          L("act", "softmax"),
          L("output", "classes"),
        ],
      },
      {
        id: "backprop_net",
        name: "Backprop Net",
        year: 1986,
        layers: [
          L("input", "inputs x"),
          L("fc", "FC₁"),
          L("act", "sigmoid"),
          L("fc", "FC₂"),
          L("act", "sigmoid"),
          L("fc", "FC₃"),
          L("output", "ŷ — ∇ flows back"),
        ],
      },
    ],
  },

  deep_learning: {
    milestones: [
      { id: "dbn", year: 2006, kind: "paper" },
      { id: "imagenet_data", year: 2009, kind: "event" },
      { id: "relu", year: 2011, kind: "paper" },
      { id: "dropout", year: 2012, kind: "paper" },
    ],
    architectures: [
      {
        id: "deep_mlp",
        name: "Deep MLP",
        year: 2011,
        layers: [
          L("input", "inputs x"),
          L("fc", "FC 1024"),
          L("act", "ReLU"),
          L("fc", "FC 1024"),
          L("act", "ReLU"),
          L("fc", "FC 512"),
          L("act", "softmax"),
          L("output", "classes"),
        ],
      },
      {
        id: "autoencoder",
        name: "Autoencoder",
        year: 2006,
        layers: [
          L("input", "x"),
          L("fc", "encoder ↓"),
          L("fc", "code z", "bottleneck"),
          L("fc", "decoder ↑"),
          L("output", "x̂ ≈ x"),
        ],
      },
      {
        id: "dbn",
        name: "Deep Belief Net",
        year: 2006,
        layers: [
          L("input", "x"),
          L("op", "RBM 1", "greedy pretrain"),
          L("op", "RBM 2"),
          L("op", "RBM 3"),
          L("fc", "classifier"),
          L("output", "ŷ"),
        ],
      },
    ],
  },

  vision_cnn: {
    milestones: [
      { id: "lenet", year: 1998, kind: "origin" },
      { id: "alexnet", year: 2012, kind: "model" },
      { id: "resnet", year: 2015, kind: "model" },
      { id: "turing", year: 2018, kind: "award" },
    ],
    architectures: [
      {
        id: "lenet",
        name: "LeNet-5",
        year: 1998,
        layers: [
          L("input", "image", "32×32"),
          L("conv", "Conv 5×5", "6"),
          L("pool", "avg-pool 2×2"),
          L("conv", "Conv 5×5", "16"),
          L("pool", "avg-pool 2×2"),
          L("fc", "FC 120"),
          L("fc", "FC 84"),
          L("output", "softmax 10"),
        ],
      },
      {
        id: "alexnet",
        name: "AlexNet",
        year: 2012,
        layers: [
          L("input", "image", "224×224×3"),
          L("conv", "Conv 11×11", "96"),
          L("pool", "max-pool 3×3"),
          L("conv", "Conv 5×5", "256"),
          L("pool", "max-pool 3×3"),
          L("conv", "Conv 3×3 ×3", "384/256"),
          L("pool", "max-pool"),
          L("fc", "FC 4096"),
          L("fc", "FC 4096"),
          L("output", "softmax 1000"),
        ],
      },
      {
        id: "vgg",
        name: "VGG-16",
        year: 2014,
        layers: [
          L("input", "image", "224×224×3"),
          L("conv", "Conv 3×3 ×2", "64"),
          L("pool", "max-pool"),
          L("conv", "Conv 3×3 ×2", "128"),
          L("pool", "max-pool"),
          L("conv", "Conv 3×3 ×3", "256 · ×3 blocks"),
          L("fc", "FC 4096 ×2"),
          L("output", "softmax 1000"),
        ],
      },
      {
        id: "resnet",
        name: "ResNet-50",
        year: 2015,
        layers: [
          L("input", "image", "224×224×3"),
          L("conv", "Conv 7×7", "64"),
          L("pool", "max-pool"),
          L("residual", "residual block ×16", "skip + conv"),
          L("pool", "global avg-pool"),
          L("fc", "FC 1000"),
          L("output", "softmax 1000"),
        ],
      },
    ],
  },

  nlp_seq: {
    milestones: [
      { id: "lstm", year: 1997, kind: "origin" },
      { id: "word2vec", year: 2013, kind: "model" },
      { id: "seq2seq", year: 2014, kind: "paper" },
      { id: "attention", year: 2014, kind: "paper" },
    ],
    architectures: [
      {
        id: "word2vec",
        name: "word2vec",
        year: 2013,
        layers: [
          L("input", "one-hot word"),
          L("embed", "projection E", "→ ℝ³⁰⁰"),
          L("fc", "context W"),
          L("output", "softmax(vocab)"),
        ],
      },
      {
        id: "lstm",
        name: "LSTM",
        year: 1997,
        layers: [
          L("input", "tokens"),
          L("embed", "embedding"),
          L("recurrent", "LSTM cell", "i/f/o gates"),
          L("recurrent", "LSTM cell"),
          L("fc", "projection"),
          L("output", "softmax"),
        ],
      },
      {
        id: "seq2seq",
        name: "Seq2Seq + Attention",
        year: 2014,
        layers: [
          L("input", "source tokens"),
          L("embed", "embedding"),
          L("recurrent", "encoder LSTM"),
          L("attention", "attention align"),
          L("recurrent", "decoder LSTM"),
          L("output", "softmax → target"),
        ],
      },
    ],
  },

  transformers: {
    milestones: [
      { id: "attention_paper", year: 2017, kind: "origin" },
      { id: "bert", year: 2018, kind: "model" },
      { id: "gpt", year: 2018, kind: "model" },
      { id: "gpt2", year: 2019, kind: "model" },
    ],
    architectures: [
      {
        id: "transformer",
        name: "Transformer",
        year: 2017,
        layers: [
          L("input", "tokens"),
          L("embed", "embedding + positional"),
          L("attention", "multi-head attention"),
          L("residual", "add & norm"),
          L("fc", "feed-forward (FFN)"),
          L("residual", "add & norm"),
          L("output", "→ next block ×N"),
        ],
      },
      {
        id: "bert",
        name: "BERT",
        year: 2018,
        layers: [
          L("input", "tokens [+ segment]"),
          L("embed", "embedding + pos + seg"),
          L("attention", "bidirectional MHA ×12"),
          L("norm", "add & norm"),
          L("fc", "FFN ×12"),
          L("output", "MLM head"),
        ],
      },
      {
        id: "gpt",
        name: "GPT",
        year: 2018,
        layers: [
          L("input", "tokens"),
          L("embed", "embedding + positional"),
          L("attention", "masked MHA ×12"),
          L("norm", "add & norm"),
          L("fc", "FFN ×12"),
          L("output", "LM head → next token"),
        ],
      },
    ],
  },

  llms: {
    milestones: [
      { id: "gpt3", year: 2020, kind: "model" },
      { id: "scaling", year: 2020, kind: "paper" },
      { id: "instructgpt", year: 2022, kind: "paper" },
      { id: "chatgpt", year: 2022, kind: "event" },
    ],
    architectures: [
      {
        id: "gpt3",
        name: "GPT-3",
        year: 2020,
        layers: [
          L("input", "tokens"),
          L("embed", "embedding + positional"),
          L("attention", "masked MHA", "×96 layers"),
          L("norm", "add & norm"),
          L("fc", "FFN 4d"),
          L("norm", "add & norm"),
          L("output", "LM head", "175B params"),
        ],
      },
      {
        id: "t5",
        name: "T5",
        year: 2020,
        layers: [
          L("input", "text in"),
          L("embed", "embedding"),
          L("attention", "encoder self-attn ×N"),
          L("attention", "decoder cross-attn ×N"),
          L("fc", "FFN"),
          L("output", "softmax → text out"),
        ],
      },
      {
        id: "llama",
        name: "LLaMA",
        year: 2022,
        layers: [
          L("input", "tokens"),
          L("embed", "embedding"),
          L("norm", "RMSNorm"),
          L("attention", "RoPE attention"),
          L("residual", "+ residual"),
          L("fc", "SwiGLU FFN"),
          L("residual", "+ residual  ×N"),
          L("output", "LM head"),
        ],
      },
    ],
  },

  frontier: {
    milestones: [
      { id: "open_weights", year: 2023, kind: "event" },
      { id: "moe_mm", year: 2024, kind: "model" },
      { id: "reasoning", year: 2025, kind: "model" },
    ],
    architectures: [
      {
        id: "mixtral",
        name: "Mixtral (MoE)",
        year: 2023,
        layers: [
          L("input", "tokens"),
          L("embed", "embedding"),
          L("attention", "GQA attention"),
          L("residual", "+ residual"),
          L("moe", "router → top-2 of 8", "sparse experts"),
          L("residual", "+ residual  ×N"),
          L("output", "LM head"),
        ],
      },
      {
        id: "multimodal",
        name: "Multimodal LLM",
        year: 2024,
        layers: [
          L("input", "text + image + audio"),
          L("conv", "vision / audio encoder"),
          L("op", "projector → text dim"),
          L("embed", "token embedding"),
          L("attention", "decoder blocks ×N"),
          L("output", "LM head"),
        ],
      },
      {
        id: "reasoning",
        name: "Reasoning LLM",
        year: 2025,
        layers: [
          L("input", "prompt"),
          L("embed", "embedding"),
          L("attention", "decoder blocks ×N"),
          L("op", "RL-tuned for chain-of-thought"),
          L("output", "long reasoning → answer"),
        ],
      },
    ],
  },
};

/** Deep-dive content for an era. */
export function deepDive(id: EraId): EraDeepDive {
  return EVOLUTION_DETAIL[id];
}
