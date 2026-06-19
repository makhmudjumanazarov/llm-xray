// Data-driven decoder-block builder. Synthesizes each block's internal ops and
// tensor shapes from the normalized config (no weights needed), so the 2D and 3D
// explorers work for every family. Shared by Diagram2D, Scene3D and the detail panel.

import type { Model } from "./schema";

export type OpKind = "norm" | "qkv" | "sdpa" | "out" | "gate" | "up" | "down" | "router" | "expert";

export type SubOp = {
  /** Stable id, links 2D ↔ 3D selection and the (future) formula registry. */
  id: string;
  kind: OpKind;
  /** Technical tensor/operation label shown verbatim (mono). */
  label: string;
  shape?: number[]; // undefined for parameter-free ops (e.g. softmax attention)
  /** dictionary key under `ops` for the human explanation. */
  descKey: string;
};

export type BlockGroup = {
  id: string;
  /** color family for the group */
  kind: "norm" | "attention" | "mlp" | "moe";
  /** dictionary key under `explorer.groups` */
  titleKey: string;
  ops: SubOp[];
};

export type MacroStage = {
  id: string;
  /** dictionary key under `explorer.stages` */
  labelKey: string;
  kind: "embed" | "encoder" | "projector" | "block" | "norm" | "logits" | "sample";
  /** repeat count (e.g. number of decoder layers) */
  repeat?: number;
};

export function attentionOps(model: Model): SubOp[] {
  const t = model.text;
  const qDim = t.numHeads * t.headDim;
  const kvDim = t.numKVHeads * t.headDim;
  const H = t.hiddenSize;

  if (t.attentionType === "mla") {
    // Multi-head Latent Attention: KV is compressed to a low-rank latent then expanded.
    return [
      { id: "q_proj", kind: "qkv", label: "q_proj", shape: [qDim, H], descKey: "q_proj" },
      { id: "kv_a_proj", kind: "qkv", label: "kv_a_proj (compress)", shape: [kvDim, H], descKey: "kv_a_proj" },
      { id: "kv_b_proj", kind: "qkv", label: "kv_b_proj (expand)", shape: [qDim, kvDim], descKey: "kv_b_proj" },
      { id: "sdpa", kind: "sdpa", label: "softmax(QKᵀ/√d)·V", descKey: "sdpa" },
      { id: "o_proj", kind: "out", label: "o_proj", shape: [H, qDim], descKey: "o_proj" },
    ];
  }
  return [
    { id: "q_proj", kind: "qkv", label: "q_proj", shape: [qDim, H], descKey: "q_proj" },
    { id: "k_proj", kind: "qkv", label: "k_proj", shape: [kvDim, H], descKey: "k_proj" },
    { id: "v_proj", kind: "qkv", label: "v_proj", shape: [kvDim, H], descKey: "v_proj" },
    { id: "sdpa", kind: "sdpa", label: "softmax(QKᵀ/√d)·V", descKey: "sdpa" },
    { id: "o_proj", kind: "out", label: "o_proj", shape: [H, qDim], descKey: "o_proj" },
  ];
}

const DENSE_MLP_FAMILIES = ["gpt2", "falcon", "gptj", "gpt_neox", "bloom"];

function mlpGated(model: Model): boolean {
  return !DENSE_MLP_FAMILIES.includes(model.family);
}

function mlpOps(model: Model): SubOp[] {
  const t = model.text;
  const H = t.hiddenSize;
  const I = t.intermediateSize;
  if (mlpGated(model)) {
    return [
      { id: "gate_proj", kind: "gate", label: "gate_proj", shape: [I, H], descKey: "gate_proj" },
      { id: "up_proj", kind: "up", label: "up_proj", shape: [I, H], descKey: "up_proj" },
      { id: "down_proj", kind: "down", label: "down_proj", shape: [H, I], descKey: "down_proj" },
    ];
  }
  return [
    { id: "up_proj", kind: "up", label: "fc / up", shape: [I, H], descKey: "up_proj" },
    { id: "down_proj", kind: "down", label: "proj / down", shape: [H, I], descKey: "down_proj" },
  ];
}

function moeOps(model: Model): SubOp[] {
  const t = model.text;
  const H = t.hiddenSize;
  const I = t.intermediateSize;
  const moe = t.moe!;
  return [
    { id: "router", kind: "router", label: `router → top-${moe.topK}`, shape: [moe.numExperts, H], descKey: "router" },
    { id: "expert_gate", kind: "gate", label: "expert.gate_proj", shape: [I, H], descKey: "expert_gate" },
    { id: "expert_up", kind: "up", label: "expert.up_proj", shape: [I, H], descKey: "expert_up" },
    { id: "expert_down", kind: "down", label: "expert.down_proj", shape: [H, I], descKey: "expert_down" },
  ];
}

/** The decoder block, grouped — drives the 2D diagram and 3D drill-down. */
export function decoderBlock(model: Model): BlockGroup[] {
  const H = model.text.hiddenSize;
  const groups: BlockGroup[] = [
    {
      id: "in_norm",
      kind: "norm",
      titleKey: "inputNorm",
      ops: [{ id: "input_norm", kind: "norm", label: model.text.normType, shape: [H], descKey: "input_norm" }],
    },
    { id: "attn", kind: "attention", titleKey: "attention", ops: attentionOps(model) },
    {
      id: "post_attn_norm",
      kind: "norm",
      titleKey: "postAttnNorm",
      ops: [{ id: "post_attn_norm", kind: "norm", label: model.text.normType, shape: [H], descKey: "post_attn_norm" }],
    },
    model.text.moe
      ? { id: "moe", kind: "moe", titleKey: "moe", ops: moeOps(model) }
      : { id: "mlp", kind: "mlp", titleKey: "mlp", ops: mlpOps(model) },
  ];
  return groups;
}

/** Macro forward-pass pipeline (token in → token out), modality-aware. */
export function macroPipeline(model: Model): MacroStage[] {
  const stages: MacroStage[] = [];
  for (const enc of model.encoders ?? []) {
    stages.push({ id: `enc_${enc.kind}`, kind: "encoder", labelKey: enc.kind === "vision" ? "visionEncoder" : "audioEncoder" });
    stages.push({ id: `proj_${enc.kind}`, kind: "projector", labelKey: "projector" });
  }
  stages.push({ id: "embed", kind: "embed", labelKey: "embedding" });
  stages.push({ id: "blocks", kind: "block", labelKey: "decoderBlock", repeat: model.text.numLayers });
  stages.push({ id: "final_norm", kind: "norm", labelKey: "finalNorm" });
  stages.push({ id: "logits", kind: "logits", labelKey: "logits" });
  stages.push({ id: "sample", kind: "sample", labelKey: "sampling" });
  return stages;
}

/** Per-layer color hint: Gemma-style sliding/full alternation when known. */
export function layerColorKind(model: Model, i: number): "sliding" | "full" | "uniform" {
  const types = model.text.layerTypes;
  if (!types || !types[i]) return "uniform";
  return types[i].includes("full") ? "full" : "sliding";
}
