import { describe, it, expect } from "vitest";
import { normalizeModel } from "./extract";

describe("normalizeModel — attention detection", () => {
  it("GQA when kv heads < heads", () => {
    const m = normalizeModel(
      "Qwen/Qwen2.5-7B-Instruct",
      {
        model_type: "qwen2",
        num_attention_heads: 28,
        num_key_value_heads: 4,
        hidden_size: 3584,
        num_hidden_layers: 28,
        intermediate_size: 18944,
        vocab_size: 152064,
        max_position_embeddings: 32768,
        hidden_act: "silu",
        rms_norm_eps: 1e-6,
      },
      { safetensors: { total: 7_600_000_000 }, downloads: 100 },
    );
    expect(m.text.attentionType).toBe("gqa");
    expect(m.text.normType).toBe("rmsnorm");
    expect(m.paramsB).toBeCloseTo(7.6, 1);
    expect(m.slug).toBe("qwen__qwen2.5-7b-instruct");
  });

  it("MQA via legacy Falcon multi_query flag", () => {
    const m = normalizeModel(
      "tiiuae/falcon-7b",
      { model_type: "falcon", num_attention_heads: 71, multi_query: true, hidden_size: 4544, num_hidden_layers: 32, vocab_size: 65024 },
      {},
    );
    expect(m.text.attentionType).toBe("mqa");
    expect(m.text.numKVHeads).toBe(1);
  });

  it("MHA when kv == heads", () => {
    const m = normalizeModel(
      "microsoft/Phi-3-mini-4k-instruct",
      { model_type: "phi3", num_attention_heads: 32, num_key_value_heads: 32, hidden_size: 3072, num_hidden_layers: 32, vocab_size: 32064, rms_norm_eps: 1e-5 },
      {},
    );
    expect(m.text.attentionType).toBe("mha");
  });

  it("MLA + MoE via kv_lora_rank and routed experts", () => {
    const m = normalizeModel(
      "deepseek-ai/DeepSeek-V2-Lite",
      {
        model_type: "deepseek_v2",
        num_attention_heads: 16,
        num_key_value_heads: 16,
        kv_lora_rank: 512,
        hidden_size: 2048,
        num_hidden_layers: 27,
        vocab_size: 102400,
        n_routed_experts: 64,
        num_experts_per_tok: 6,
        n_shared_experts: 2,
        rms_norm_eps: 1e-6,
      },
      {},
    );
    expect(m.text.attentionType).toBe("mla");
    expect(m.text.moe).toEqual({ numExperts: 64, topK: 6, numSharedExperts: 2 });
  });
});

describe("normalizeModel — structure", () => {
  it("MoE detection (Mixtral local experts)", () => {
    const m = normalizeModel(
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      { model_type: "mixtral", num_attention_heads: 32, num_key_value_heads: 8, hidden_size: 4096, num_hidden_layers: 32, vocab_size: 32000, num_local_experts: 8, num_experts_per_tok: 2, rms_norm_eps: 1e-5 },
      {},
    );
    expect(m.text.moe).toEqual({ numExperts: 8, topK: 2 });
    expect(m.text.attentionType).toBe("gqa");
  });

  it("GPT-2 aliases (n_embd/n_layer/n_head) + layernorm", () => {
    const m = normalizeModel(
      "distilbert/distilgpt2",
      { model_type: "gpt2", n_head: 12, n_embd: 768, n_layer: 6, n_positions: 1024, vocab_size: 50257, activation_function: "gelu_new" },
      {},
    );
    expect(m.text.hiddenSize).toBe(768);
    expect(m.text.numLayers).toBe(6);
    expect(m.text.contextLen).toBe(1024);
    expect(m.text.normType).toBe("layernorm");
    expect(m.text.attentionType).toBe("mha");
  });

  it("multimodal modalities + encoders + sliding window + layer types", () => {
    const m = normalizeModel(
      "google/gemma-4-E4B-it",
      {
        model_type: "gemma4",
        text_config: {
          num_attention_heads: 8,
          num_key_value_heads: 2,
          head_dim: 256,
          hidden_size: 2560,
          num_hidden_layers: 42,
          vocab_size: 262144,
          sliding_window: 512,
          rms_norm_eps: 1e-6,
          hidden_activation: "gelu_pytorch_tanh",
          layer_types: ["sliding_attention", "full_attention"],
        },
        vision_config: { hidden_size: 768, num_hidden_layers: 16, num_attention_heads: 12, patch_size: 16 },
        audio_config: { hidden_size: 1024, num_hidden_layers: 12 },
        video_token_id: 5,
      },
      {},
    );
    expect(m.modalities).toEqual(["text", "image", "audio", "video"]);
    expect(m.encoders?.map((e) => e.kind)).toEqual(["vision", "audio"]);
    expect(m.text.slidingWindow).toBe(512);
    expect(m.text.headDim).toBe(256);
    expect(m.text.layerTypes?.length).toBe(2);
  });
});

describe("normalizeModel — fallbacks & metadata", () => {
  const cfg = (o: Record<string, unknown>) => ({
    model_type: "test",
    num_attention_heads: 32,
    num_key_value_heads: 32,
    hidden_size: 4096,
    num_hidden_layers: 4,
    vocab_size: 1000,
    ...o,
  });

  it("headDim falls back to round(hidden/heads), 0 when no heads", () => {
    expect(normalizeModel("a/b", cfg({}), {}).text.headDim).toBe(128);
    expect(normalizeModel("a/b", cfg({ hidden_size: 100, num_attention_heads: 3 }), {}).text.headDim).toBe(33);
    expect(normalizeModel("a/b", { model_type: "x", hidden_size: 768, vocab_size: 1 }, {}).text.headDim).toBe(0);
  });

  it("intermediateSize fallback chain: n_inner, ffn_dim, then 4*hidden", () => {
    expect(normalizeModel("a/b", cfg({ n_inner: 3072 }), {}).text.intermediateSize).toBe(3072);
    expect(normalizeModel("a/b", cfg({ ffn_dim: 5000 }), {}).text.intermediateSize).toBe(5000);
    expect(normalizeModel("a/b", cfg({ hidden_size: 768 }), {}).text.intermediateSize).toBe(3072);
  });

  it("rope detection across signals + type precedence", () => {
    const r1 = normalizeModel("a/b", cfg({ rope_theta: 1_000_000, rope_scaling: { rope_type: "yarn", factor: 4 } }), {}).text.rope;
    expect(r1).toMatchObject({ type: "yarn", theta: 1_000_000 });
    expect(normalizeModel("a/b", cfg({ rope_scaling: { type: "linear" } }), {}).text.rope?.type).toBe("linear");
    expect(normalizeModel("a/b", cfg({ partial_rotary_factor: 0.25 }), {}).text.rope?.partialRotaryFactor).toBe(0.25);
    expect(normalizeModel("a/b", cfg({}), {}).text.rope).toBeUndefined();
  });

  it("dtype precedence (torch_dtype over dtype)", () => {
    expect(normalizeModel("a/b", cfg({ torch_dtype: "bfloat16", dtype: "float16" }), {}).dtype).toBe("bfloat16");
    expect(normalizeModel("a/b", cfg({ dtype: "float16" }), {}).dtype).toBe("float16");
    expect(normalizeModel("a/b", cfg({}), {}).dtype).toBeUndefined();
  });

  it("gated flag derivation (bool + string variants)", () => {
    expect(normalizeModel("a/b", cfg({}), { gated: true }).source.gated).toBe(true);
    expect(normalizeModel("a/b", cfg({}), { gated: "manual" }).source.gated).toBe(true);
    expect(normalizeModel("a/b", cfg({}), { gated: "false" }).source.gated).toBe(false);
    expect(normalizeModel("a/b", cfg({}), {}).source.gated).toBe(false);
  });

  it("text-only model: single modality, no encoders, no sliding window", () => {
    const m = normalizeModel("a/b", cfg({}), {});
    expect(m.modalities).toEqual(["text"]);
    expect(m.encoders).toBeUndefined();
    expect(m.text.slidingWindow).toBeUndefined();
  });
});
