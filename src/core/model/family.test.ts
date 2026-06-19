import { describe, it, expect } from "vitest";
import { familyOf, modelVersion, buildModelTree } from "./family";
import type { Model } from "./schema";

/* eslint-disable @typescript-eslint/no-explicit-any */
function m(id: string, downloads = 0): Model {
  return {
    id, slug: id.replace(/\//g, "__").toLowerCase(), name: id.split("/")[1] ?? id,
    family: "x", architecture: "T", license: "mit", modalities: ["text"], paramsB: 1,
    stats: { downloads, likes: 0 },
    text: {} as any, source: {},
  } as Model;
}

describe("familyOf", () => {
  it("uses the HF org", () => {
    expect(familyOf(m("Qwen/Qwen2.5-7B-Instruct"))).toBe("Qwen");
    expect(familyOf(m("deepseek-ai/DeepSeek-R1"))).toBe("deepseek-ai");
  });
});

describe("modelVersion", () => {
  const cases: [string, string][] = [
    ["Qwen/Qwen2.5-7B-Instruct", "Qwen2.5"],
    ["Qwen/Qwen3-4B-Instruct-2507", "Qwen3"],
    ["meta-llama/Llama-3.1-8B-Instruct", "Llama-3.1"],
    ["deepseek-ai/DeepSeek-V2-Lite", "DeepSeek-V2"],
    ["deepseek-ai/DeepSeek-R1-0528", "DeepSeek-R1"],
    ["microsoft/phi-4", "phi-4"],
    ["microsoft/Phi-3-mini-4k-instruct", "Phi-3"],
    ["mistralai/Mixtral-8x7B-Instruct-v0.1", "Mixtral"],
    ["mistralai/Mistral-7B-Instruct-v0.3", "Mistral"],
    ["tiiuae/falcon-mamba-7b-instruct", "falcon-mamba"],
    ["tiiuae/Falcon-H1-0.5B-Instruct", "Falcon-H1"],
    ["HuggingFaceTB/SmolLM2-1.7B-Instruct", "SmolLM2"],
    ["ibm-granite/granite-3.1-8b-instruct", "granite-3.1"],
  ];
  it.each(cases)("%s → %s", (id, expected) => {
    expect(modelVersion(m(id))).toBe(expected);
  });
});

describe("buildModelTree", () => {
  it("groups family → version → model and sorts by downloads", () => {
    const tree = buildModelTree([
      m("Qwen/Qwen2.5-7B-Instruct", 100),
      m("Qwen/Qwen3-8B", 300),
      m("Qwen/Qwen3-4B", 50),
      m("deepseek-ai/DeepSeek-R1", 500),
    ]);
    expect(tree[0].family).toBe("deepseek-ai"); // highest single download
    const qwen = tree.find((f) => f.family === "Qwen")!;
    expect(qwen.versions.map((v) => v.version)).toEqual(["Qwen3", "Qwen2.5"]); // Qwen3 more popular
    expect(qwen.versions[0].models.map((x) => x.name)).toEqual(["Qwen3-8B", "Qwen3-4B"]);
  });
});
