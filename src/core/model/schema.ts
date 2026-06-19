// Normalized, model-agnostic architecture schema for LLM X-ray.
// Generalizes the prototype's window.ARCH so any HF model family fits one shape.
// All numbers are language-neutral; UI strings come from /messages dictionaries.

export type Modality = "text" | "image" | "audio" | "video";
export type AttentionType = "mha" | "gqa" | "mqa" | "mla";
export type NormType = "rmsnorm" | "layernorm";

/** A single tensor as read from the safetensors header/index (no weights). */
export type TensorInfo = {
  name: string;
  shape: number[];
};

/** RoPE / positional config (partial — varies by family). */
export type RopeInfo = {
  type?: string;
  theta?: number;
  partialRotaryFactor?: number;
  scaling?: Record<string, unknown>;
};

export type MoEInfo = {
  numExperts: number;
  topK: number;
  numSharedExperts?: number;
};

/** Non-text encoder tower (vision / audio). */
export type EncoderInfo = {
  kind: "vision" | "audio";
  hiddenSize: number;
  numLayers: number;
  numHeads?: number;
  patchSize?: number;
  /** Dim it projects into the LLM residual stream. */
  projectorTo?: number;
};

/** Text decoder configuration — the heart of the architecture. */
export type TextConfig = {
  hiddenSize: number;
  numLayers: number;
  numHeads: number;
  numKVHeads: number;
  headDim: number;
  intermediateSize: number;
  vocabSize: number;
  contextLen: number;
  activation: string;
  normType: NormType;
  attentionType: AttentionType;
  rope?: RopeInfo;
  slidingWindow?: number;
  moe?: MoEInfo;
  /** Per-layer attention kind when it varies (e.g. Gemma sliding/full). */
  layerTypes?: string[];
};

/** A coarse operation in a decoder block, derived from tensor-name patterns. */
export type BlockOp = {
  kind:
    | "norm"
    | "attention"
    | "qk-norm"
    | "mlp"
    | "moe"
    | "ple"
    | "residual"
    | "embed"
    | "other";
  /** Stable id used to link 2D/3D selection and the formula registry. */
  id: string;
  /** Tensors that belong to this op (for shape display). */
  tensors?: TensorInfo[];
};

export type ModelStats = {
  downloads: number;
  likes: number;
  lastModified?: string;
  benchmarks?: {
    mmlu?: number;
    elo?: number;
    [k: string]: number | undefined;
  };
};

export type Model = {
  /** HF id, e.g. "Qwen/Qwen2.5-7B-Instruct". */
  id: string;
  /** URL-safe slug, e.g. "qwen__qwen2.5-7b-instruct". */
  slug: string;
  name: string;
  family: string;
  architecture: string;
  license: string;
  modalities: Modality[];
  paramsB: number; // billions of parameters
  dtype?: string;
  tensorCount?: number;
  stats: ModelStats;
  text: TextConfig;
  encoders?: EncoderInfo[];
  blockOps?: BlockOp[];
  /** Representative block tensors (layer 0) for deep-dive shape display. */
  blockTensors?: TensorInfo[];
  /** Provenance + freshness. */
  source: {
    configUrl?: string;
    gated?: boolean;
    note?: string;
  };
  generatedAt?: string;
};

/** HF id -> filesystem/URL slug and back. */
export function idToSlug(id: string): string {
  return id.replace(/\//g, "__").toLowerCase();
}
