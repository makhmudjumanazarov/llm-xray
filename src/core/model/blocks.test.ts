import { describe, it, expect } from "vitest";
import { decoderBlock, attentionOps, macroPipeline, layerColorKind } from "./blocks";
import type { Model } from "./schema";

/* eslint-disable @typescript-eslint/no-explicit-any */
function model(overrides: any): Model {
  return {
    id: "x/y",
    slug: "x__y",
    name: "y",
    family: overrides.family ?? "llama",
    architecture: "Test",
    license: "mit",
    modalities: ["text"],
    paramsB: 7,
    stats: { downloads: 0, likes: 0 },
    text: {
      hiddenSize: 4096,
      numLayers: 32,
      numHeads: 32,
      numKVHeads: 8,
      headDim: 128,
      intermediateSize: 14336,
      vocabSize: 32000,
      contextLen: 8192,
      activation: "silu",
      normType: "rmsnorm",
      attentionType: "gqa",
      ...overrides.text,
    },
    encoders: overrides.encoders,
    source: {},
  } as Model;
}

describe("decoderBlock", () => {
  it("dense GQA → norm/attn/norm/mlp with gated MLP", () => {
    const groups = decoderBlock(model({}));
    expect(groups.map((g) => g.id)).toEqual(["in_norm", "attn", "post_attn_norm", "mlp"]);
    const mlp = groups.find((g) => g.id === "mlp")!;
    expect(mlp.ops.map((o) => o.id)).toEqual(["gate_proj", "up_proj", "down_proj"]);
  });

  it("MoE model → moe group with router + expert ops", () => {
    const groups = decoderBlock(model({ family: "mixtral", text: { moe: { numExperts: 8, topK: 2 } } }));
    const last = groups[groups.length - 1];
    expect(last.kind).toBe("moe");
    expect(last.ops.map((o) => o.id)).toEqual(["router", "expert_gate", "expert_up", "expert_down"]);
  });

  it("dense GPT-2 family → ungated MLP (no gate_proj)", () => {
    const groups = decoderBlock(model({ family: "gpt2", text: { attentionType: "mha", numKVHeads: 12, numHeads: 12 } }));
    const mlp = groups.find((g) => g.id === "mlp")!;
    expect(mlp.ops.map((o) => o.id)).toEqual(["up_proj", "down_proj"]);
  });
});

describe("attentionOps", () => {
  it("MLA → compressed kv (kv_a/kv_b), no separate k/v", () => {
    const ops = attentionOps(model({ text: { attentionType: "mla" } })).map((o) => o.id);
    expect(ops).toContain("kv_a_proj");
    expect(ops).toContain("kv_b_proj");
    expect(ops).not.toContain("k_proj");
  });

  it("GQA → q/k/v/sdpa/o", () => {
    const ops = attentionOps(model({})).map((o) => o.id);
    expect(ops).toEqual(["q_proj", "k_proj", "v_proj", "sdpa", "o_proj"]);
  });
});

describe("macroPipeline", () => {
  it("text-only → embed → blocks → final_norm → logits → sample", () => {
    const ids = macroPipeline(model({})).map((s) => s.id);
    expect(ids).toEqual(["embed", "blocks", "final_norm", "logits", "sample"]);
  });

  it("multimodal → prepends encoder + projector stages", () => {
    const ids = macroPipeline(
      model({ encoders: [{ kind: "vision", hiddenSize: 768, numLayers: 16 }, { kind: "audio", hiddenSize: 1024, numLayers: 12 }] }),
    ).map((s) => s.id);
    expect(ids.slice(0, 4)).toEqual(["enc_vision", "proj_vision", "enc_audio", "proj_audio"]);
  });
});

describe("layerColorKind", () => {
  it("uses layer types when present", () => {
    const m = model({ text: { layerTypes: ["sliding_attention", "full_attention"] } });
    expect(layerColorKind(m, 0)).toBe("sliding");
    expect(layerColorKind(m, 1)).toBe("full");
  });
  it("uniform when no layer types", () => {
    expect(layerColorKind(model({}), 0)).toBe("uniform");
  });
});

describe("op shapes (the architectural math the diagram renders)", () => {
  it("GQA q/kv dimension split", () => {
    const ops = attentionOps(model({ text: { numHeads: 32, numKVHeads: 8, headDim: 128, hiddenSize: 4096 } }));
    const byId = Object.fromEntries(ops.map((o) => [o.id, o.shape]));
    expect(byId.q_proj).toEqual([4096, 4096]); // numHeads*headDim × hidden
    expect(byId.k_proj).toEqual([1024, 4096]); // numKVHeads*headDim × hidden
    expect(byId.v_proj).toEqual([1024, 4096]);
    expect(byId.o_proj).toEqual([4096, 4096]);
  });

  it("MLA compressed kv shapes (kv_a compress, kv_b expand)", () => {
    const ops = attentionOps(model({ text: { attentionType: "mla", numHeads: 16, numKVHeads: 16, headDim: 128, hiddenSize: 2048 } }));
    const byId = Object.fromEntries(ops.map((o) => [o.id, o.shape]));
    expect(byId.kv_a_proj).toEqual([2048, 2048]); // kvDim × H
    expect(byId.kv_b_proj).toEqual([2048, 2048]); // qDim × kvDim
    expect(byId.o_proj).toEqual([2048, 2048]);
  });

  it("norm ops have shape [hidden]", () => {
    const groups = decoderBlock(model({ text: { hiddenSize: 4096 } }));
    expect(groups.find((g) => g.id === "in_norm")!.ops[0].shape).toEqual([4096]);
    expect(groups.find((g) => g.id === "post_attn_norm")!.ops[0].shape).toEqual([4096]);
  });

  it("MoE router label + expert shapes", () => {
    const groups = decoderBlock(model({ family: "mixtral", text: { moe: { numExperts: 8, topK: 2 }, hiddenSize: 4096, intermediateSize: 14336 } }));
    const moe = groups.find((g) => g.id === "moe")!;
    const router = moe.ops.find((o) => o.id === "router")!;
    expect(router.label).toContain("top-2");
    expect(router.shape).toEqual([8, 4096]); // numExperts × hidden
    expect(moe.ops.find((o) => o.id === "expert_gate")!.shape).toEqual([14336, 4096]);
    expect(moe.ops.find((o) => o.id === "expert_down")!.shape).toEqual([4096, 14336]);
  });
});

describe("macroPipeline single encoder", () => {
  it("audio-only encoder prepends audioEncoder + projector", () => {
    const stages = macroPipeline(model({ encoders: [{ kind: "audio", hiddenSize: 1024, numLayers: 12 }] }));
    expect(stages.slice(0, 2).map((s) => s.id)).toEqual(["enc_audio", "proj_audio"]);
    expect(stages.find((s) => s.id === "enc_audio")!.labelKey).toBe("audioEncoder");
  });
});
