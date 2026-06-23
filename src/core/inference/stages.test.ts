import { describe, it, expect } from "vitest";
import {
  INFER_STAGES,
  INFER_STAGE_COUNT,
  clampStageIndex,
  nextStage,
  prevStage,
  stageById,
  kvCacheSize,
  type InferStageId,
} from "./stages";
import { softmaxTemp, topKMask, topPMask, pickIndex, buildGenerationScript } from "./run";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

const ORDER: InferStageId[] = ["tokenize", "embed", "layers", "logits", "sampling", "loop"];

describe("inference stages", () => {
  it("has the six canonical stages in order, each with KaTeX + known accent/icon", () => {
    expect(INFER_STAGE_COUNT).toBe(6);
    expect(INFER_STAGES.map((s) => s.id)).toEqual(ORDER);
    for (const s of INFER_STAGES) {
      expect(s.formulaKatex.trim().length).toBeGreaterThan(0);
      expect(["--slide", "--aud", "--full", "--vis", "--acc2"]).toContain(s.accentToken);
      expect(["Type", "Grid", "Layers", "BarChart", "Dice", "Repeat"]).toContain(s.iconName);
    }
  });

  it("nav helpers clamp at both ends", () => {
    expect(clampStageIndex(-3)).toBe(0);
    expect(clampStageIndex(99)).toBe(INFER_STAGE_COUNT - 1);
    expect(clampStageIndex(NaN)).toBe(0);
    expect(prevStage(0)).toBe(0);
    expect(nextStage(INFER_STAGE_COUNT - 1)).toBe(INFER_STAGE_COUNT - 1);
    expect(stageById("sampling")?.id).toBe("sampling");
  });

  it("kvCacheSize grows by one per generated token", () => {
    expect(kvCacheSize(0, 5)).toBe(5);
    expect(kvCacheSize(3, 5)).toBe(8);
    expect(kvCacheSize(-1, -2)).toBe(0);
  });
});

describe("inference math helpers", () => {
  const logits = [3.2, 1.9, 1.3, 0.7, 0.2];

  it("softmaxTemp sums to 1 and sharpens as T drops", () => {
    for (const T of [0.3, 1, 2]) {
      const p = softmaxTemp(logits, T);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    }
    const sharp = Math.max(...softmaxTemp(logits, 0.3));
    const flat = Math.max(...softmaxTemp(logits, 2));
    expect(sharp).toBeGreaterThan(flat);
  });

  it("topKMask keeps exactly k and includes the argmax", () => {
    const probs = softmaxTemp(logits, 1);
    const mask = topKMask(probs, 2);
    expect(mask.filter(Boolean).length).toBe(2);
    expect(mask[0]).toBe(true); // logits[0] is the largest
  });

  it("topPMask keeps a prefix covering ≥ p and never the whole tail at low p", () => {
    const probs = softmaxTemp(logits, 1);
    const mask = topPMask(probs, 0.9);
    const kept = mask.filter(Boolean).length;
    expect(kept).toBeGreaterThanOrEqual(1);
    expect(kept).toBeLessThanOrEqual(probs.length);
    expect(topPMask(probs, 0).filter(Boolean).length).toBe(1); // smallest set
  });

  it("pickIndex respects the mask", () => {
    const probs = softmaxTemp(logits, 1);
    expect(pickIndex(probs)).toBe(0);
    const mask = probs.map((_, i) => i !== 0); // exclude the top
    expect(pickIndex(probs, mask)).toBe(1);
  });

  it("buildGenerationScript tokenizes the prompt and grows the KV cache", () => {
    const script = buildGenerationScript("The capital of France is", 4);
    expect(script.promptTokens.length).toBeGreaterThan(0);
    expect(script.steps.length).toBe(4);
    for (let i = 1; i < script.steps.length; i++) {
      expect(script.steps[i].kvSize).toBeGreaterThan(script.steps[i - 1].kvSize);
      expect(script.steps[i].chosenIndex).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---- i18n contract: the dictionary must cover every stage, in both locales ----

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("inference dictionary", () => {
  it("defines copy for every stage in the canonical English dictionary", () => {
    const stages = (en as { inference: { stages: Record<string, { title: string; beginner: string; expert: string }> } })
      .inference.stages;
    expect(stages).toBeTruthy();
    for (const id of ORDER) {
      expect(stages[id], `en.inference.stages.${id}`).toBeTruthy();
      expect(typeof stages[id].title).toBe("string");
      expect(typeof stages[id].beginner).toBe("string");
      expect(typeof stages[id].expert).toBe("string");
    }
  });

  it("en and ru inference subtrees have identical key sets (no i18n drift)", () => {
    const enKeys = keyPaths((en as Record<string, unknown>).inference).sort();
    const ruKeys = keyPaths((ru as Record<string, unknown>).inference).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
