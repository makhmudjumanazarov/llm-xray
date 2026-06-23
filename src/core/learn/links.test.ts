import { describe, it, expect } from "vitest";
import { lessonForOpKind, lessonForField, lessonForEra } from "./links";

describe("learn cross-links", () => {
  it("maps explorer op kinds to live lessons", () => {
    expect(lessonForOpKind("norm")).toBe("norm");
    expect(lessonForOpKind("qkv")).toBe("attention");
    expect(lessonForOpKind("sdpa")).toBe("attention");
    expect(lessonForOpKind("router")).toBe("moe");
    expect(lessonForOpKind("expert")).toBe("moe");
    // MLP ops have no dedicated lesson yet
    expect(lessonForOpKind("gate")).toBeNull();
    expect(lessonForOpKind("up")).toBeNull();
  });

  it("maps model stat fields to lessons", () => {
    expect(lessonForField("attentionType")).toBe("attention");
    expect(lessonForField("normType")).toBe("norm");
    expect(lessonForField("rope")).toBe("rope");
    expect(lessonForField("moe")).toBe("moe");
    expect(lessonForField("contextLen")).toBe("kvcache");
    expect(lessonForField("vocabSize")).toBe("tokenization");
    expect(lessonForField("license")).toBeNull();
  });

  it("maps eras to lessons only where one fits", () => {
    expect(lessonForEra("transformers")).toBe("attention");
    expect(lessonForEra("frontier")).toBe("moe");
    expect(lessonForEra("perceptron")).toBeNull();
    expect(lessonForEra("classical_ml")).toBeNull();
  });
});
