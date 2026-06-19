// Model-agnostic normalizer: HF config.json (+ HF model-info) -> normalized Model.
// Generalizes arch-viewer/generate_data.py to every family (Llama, Qwen, Mistral,
// Mixtral/MoE, DeepSeek/MLA, Gemma/multimodal, Phi, GPT-2…). No weights needed.

import { idToSlug } from "./schema";
import type {
  Model,
  TextConfig,
  AttentionType,
  NormType,
  Modality,
  EncoderInfo,
  BlockOp,
  MoEInfo,
  RopeInfo,
} from "./schema";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

export type ModelInfo = {
  downloads?: number;
  likes?: number;
  lastModified?: string;
  gated?: boolean | string;
  tags?: string[];
  safetensors?: { total?: number; parameters?: Record<string, number> };
  cardData?: Raw;
};

const num = (...vals: any[]): number | undefined => {
  for (const v of vals) if (typeof v === "number" && !Number.isNaN(v)) return v;
  return undefined;
};

/** GPT-2-style and modern configs use different key names; resolve aliases. */
function resolveTextConfig(config: Raw): Raw {
  // Multimodal models (Gemma, etc.) nest the decoder under text_config.
  return config.text_config ?? config;
}

function detectAttention(tc: Raw, heads: number, kvHeads: number): AttentionType {
  // DeepSeek-style Multi-head Latent Attention.
  if (tc.kv_lora_rank != null || tc.q_lora_rank != null || tc.multi_latent_attention) {
    return "mla";
  }
  if (kvHeads <= 1) return "mqa";
  if (kvHeads < heads) return "gqa";
  return "mha";
}

function detectMoE(tc: Raw): MoEInfo | undefined {
  const numExperts = num(tc.num_local_experts, tc.n_routed_experts, tc.num_experts);
  if (!numExperts || numExperts <= 1) return undefined;
  const topK = num(tc.num_experts_per_tok, tc.moe_topk, tc.num_experts_per_token, tc.top_k) ?? 2;
  const numSharedExperts = num(tc.n_shared_experts, tc.num_shared_experts);
  return { numExperts, topK, ...(numSharedExperts ? { numSharedExperts } : {}) };
}

function detectRope(tc: Raw): RopeInfo | undefined {
  const theta = num(tc.rope_theta);
  const partial = num(tc.partial_rotary_factor);
  const scaling = tc.rope_scaling ?? undefined;
  const ropeParams = tc.rope_parameters; // Gemma nests differently
  if (theta == null && partial == null && !scaling && !ropeParams) return undefined;
  return {
    type: scaling?.rope_type ?? scaling?.type,
    theta,
    partialRotaryFactor: partial,
    scaling: scaling ?? undefined,
  };
}

function detectModalities(config: Raw): Modality[] {
  const mods: Modality[] = ["text"];
  if (config.vision_config) mods.push("image");
  if (config.audio_config) mods.push("audio");
  if (config.video_config || config.video_token_id != null) mods.push("video");
  return mods;
}

function buildEncoders(config: Raw): EncoderInfo[] | undefined {
  const out: EncoderInfo[] = [];
  const vc = config.vision_config;
  if (vc) {
    out.push({
      kind: "vision",
      hiddenSize: num(vc.hidden_size) ?? 0,
      numLayers: num(vc.num_hidden_layers) ?? 0,
      numHeads: num(vc.num_attention_heads),
      patchSize: num(vc.patch_size),
    });
  }
  const ac = config.audio_config;
  if (ac) {
    out.push({
      kind: "audio",
      hiddenSize: num(ac.hidden_size) ?? 0,
      numLayers: num(ac.num_hidden_layers) ?? 0,
      numHeads: num(ac.num_attention_heads),
    });
  }
  return out.length ? out : undefined;
}

/** Canonical decoder-block op order, derived from config (enriched later from tensors). */
function buildBlockOps(text: TextConfig): BlockOp[] {
  const ops: BlockOp[] = [
    { kind: "norm", id: "input_norm" },
    { kind: "attention", id: "self_attn" },
    { kind: "norm", id: "post_attn_norm" },
  ];
  if (text.moe) ops.push({ kind: "moe", id: "moe" });
  else ops.push({ kind: "mlp", id: "mlp" });
  ops.push({ kind: "residual", id: "residual" });
  return ops;
}

function familyOf(id: string, config: Raw): string {
  const org = id.includes("/") ? id.split("/")[0] : "";
  return (config.model_type as string) || org || "unknown";
}

export function normalizeModel(id: string, config: Raw, info: ModelInfo = {}): Model {
  const tc = resolveTextConfig(config);

  const hiddenSize = num(tc.hidden_size, tc.n_embd, tc.d_model) ?? 0;
  const numLayers = num(tc.num_hidden_layers, tc.n_layer, tc.num_layers) ?? 0;
  const numHeads = num(tc.num_attention_heads, tc.n_head) ?? 0;
  // Legacy Falcon uses `multi_query: true` instead of num_key_value_heads (=> 1 KV head).
  const falconMQA = tc.multi_query === true && !tc.new_decoder_architecture;
  const numKVHeads =
    num(tc.num_key_value_heads, tc.num_kv_heads) ?? (falconMQA ? 1 : numHeads);
  const headDim = num(tc.head_dim) ?? (numHeads ? Math.round(hiddenSize / numHeads) : 0);
  const intermediateSize =
    num(tc.intermediate_size, tc.n_inner, tc.ffn_dim) ?? hiddenSize * 4;
  const vocabSize = num(tc.vocab_size, config.vocab_size) ?? 0;
  const contextLen = num(tc.max_position_embeddings, tc.n_positions, tc.n_ctx) ?? 0;
  const activation =
    tc.hidden_act ?? tc.hidden_activation ?? tc.activation_function ?? "silu";
  const normType: NormType = tc.rms_norm_eps != null ? "rmsnorm" : "layernorm";

  const text: TextConfig = {
    hiddenSize,
    numLayers,
    numHeads,
    numKVHeads,
    headDim,
    intermediateSize,
    vocabSize,
    contextLen,
    activation,
    normType,
    attentionType: detectAttention(tc, numHeads, numKVHeads),
    rope: detectRope(tc),
    slidingWindow: num(tc.sliding_window) || undefined,
    moe: detectMoE(tc),
    layerTypes: Array.isArray(tc.layer_types) ? tc.layer_types : undefined,
  };

  const totalParams = num(info.safetensors?.total);
  const paramsB = totalParams ? +(totalParams / 1e9).toFixed(2) : 0;

  const gated = info.gated === true || (typeof info.gated === "string" && info.gated !== "false");

  return {
    id,
    slug: idToSlug(id),
    name: id.includes("/") ? id.split("/")[1] : id,
    family: familyOf(id, config),
    architecture: config.architectures?.[0] ?? config.model_type ?? "unknown",
    license: (info.cardData?.license as string) ?? "unknown",
    modalities: detectModalities(config),
    paramsB,
    dtype: config.torch_dtype ?? config.dtype,
    stats: {
      downloads: info.downloads ?? 0,
      likes: info.likes ?? 0,
      lastModified: info.lastModified,
      benchmarks: {},
    },
    text,
    encoders: buildEncoders(config),
    blockOps: buildBlockOps(text),
    source: {
      configUrl: `https://huggingface.co/${id}/blob/main/config.json`,
      gated,
    },
    generatedAt: new Date().toISOString(),
  };
}
