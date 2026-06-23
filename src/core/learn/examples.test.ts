import { describe, it, expect } from "vitest";
import type { Model } from "@/core/model/schema";
import { modelsForLesson } from "./examples";

const mk = (name: string, downloads: number, text: Partial<Model["text"]>): Model =>
  ({ name, slug: name, stats: { downloads, likes: 0 }, text }) as unknown as Model;

const MODELS: Model[] = [
  mk("mixtral", 500, { moe: { numExperts: 8, topK: 2 }, attentionType: "gqa", numHeads: 32, numKVHeads: 8, normType: "rmsnorm", rope: { theta: 1e6 } }),
  mk("llama", 900, { attentionType: "gqa", numHeads: 32, numKVHeads: 8, normType: "rmsnorm", rope: { theta: 5e5 } }),
  mk("gpt2", 700, { attentionType: "mha", numHeads: 12, numKVHeads: 12, normType: "layernorm" }),
];

describe("modelsForLesson", () => {
  it("moe → only MoE models", () => {
    expect(modelsForLesson("moe", MODELS).map((m) => m.name)).toEqual(["mixtral"]);
  });
  it("attention → GQA/MLA models, most-downloaded first", () => {
    expect(modelsForLesson("attention", MODELS).map((m) => m.name)).toEqual(["llama", "mixtral"]);
  });
  it("kvcache → models with fewer KV heads than query heads", () => {
    expect(modelsForLesson("kvcache", MODELS).map((m) => m.name)).toEqual(["llama", "mixtral"]);
  });
  it("universal lessons return top models by downloads", () => {
    expect(modelsForLesson("softmax", MODELS).map((m) => m.name)).toEqual(["llama", "gpt2", "mixtral"]);
  });
  it("respects the limit", () => {
    expect(modelsForLesson("softmax", MODELS, 2)).toHaveLength(2);
  });
});
