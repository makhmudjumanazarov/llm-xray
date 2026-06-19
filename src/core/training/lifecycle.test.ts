import { describe, it, expect } from "vitest";
import {
  LIFECYCLE_STAGES,
  STAGE_COUNT,
  clampStageIndex,
  nextStage,
  prevStage,
  capabilityAt,
  stageById,
  isMonotonic,
  type StageId,
} from "./lifecycle";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

const CANONICAL_ORDER: StageId[] = ["pretraining", "sft", "preference", "eval"];

describe("lifecycle stages", () => {
  it("has exactly the four canonical stages in training order", () => {
    expect(STAGE_COUNT).toBe(4);
    expect(LIFECYCLE_STAGES.map((s) => s.id)).toEqual(CANONICAL_ORDER);
  });

  it("capability rises strictly and tops out at 100 (zero → hero)", () => {
    const caps = LIFECYCLE_STAGES.map((s) => s.capabilityPct);
    for (let i = 1; i < caps.length; i++) expect(caps[i]).toBeGreaterThan(caps[i - 1]);
    expect(caps[caps.length - 1]).toBe(100);
    expect(isMonotonic()).toBe(true);
  });

  it("every stage carries a non-empty KaTeX objective and a known accent/icon", () => {
    for (const s of LIFECYCLE_STAGES) {
      expect(s.formulaKatex.trim().length).toBeGreaterThan(0);
      expect(["--slide", "--aud", "--full", "--vis"]).toContain(s.accentToken);
      expect(["Database", "Target", "Scale", "Trophy"]).toContain(s.iconName);
    }
  });

  it("stageById resolves each id and nothing else", () => {
    for (const id of CANONICAL_ORDER) expect(stageById(id)?.id).toBe(id);
    // @ts-expect-error — guard against unknown ids at runtime too
    expect(stageById("nope")).toBeUndefined();
  });
});

describe("navigation helpers clamp at both ends", () => {
  it("clampStageIndex bounds and sanitizes", () => {
    expect(clampStageIndex(-5)).toBe(0);
    expect(clampStageIndex(99)).toBe(STAGE_COUNT - 1);
    expect(clampStageIndex(2.9)).toBe(2);
    expect(clampStageIndex(NaN)).toBe(0);
  });

  it("next/prev never escape the range", () => {
    expect(prevStage(0)).toBe(0);
    expect(nextStage(STAGE_COUNT - 1)).toBe(STAGE_COUNT - 1);
    expect(nextStage(0)).toBe(1);
    expect(prevStage(2)).toBe(1);
  });

  it("capabilityAt matches the stage table and clamps", () => {
    expect(capabilityAt(0)).toBe(LIFECYCLE_STAGES[0].capabilityPct);
    expect(capabilityAt(-1)).toBe(LIFECYCLE_STAGES[0].capabilityPct);
    expect(capabilityAt(100)).toBe(100);
  });
});

// ---- i18n contract: the dictionary must cover every stage, in both locales ----

/** Recursively collect dotted key paths of a plain object (leaves included). */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("journey dictionary", () => {
  it("defines copy for every stage in the canonical English dictionary", () => {
    const stages = (en as { journey: { stages: Record<string, { title: string; beginner: string; expert: string }> } })
      .journey.stages;
    expect(stages).toBeTruthy();
    for (const id of CANONICAL_ORDER) {
      expect(stages[id], `en.journey.stages.${id}`).toBeTruthy();
      expect(typeof stages[id].title).toBe("string");
      expect(typeof stages[id].beginner).toBe("string");
      expect(typeof stages[id].expert).toBe("string");
    }
  });

  it("en and ru journey subtrees have identical key sets (no i18n drift)", () => {
    const enKeys = keyPaths((en as Record<string, unknown>).journey).sort();
    const ruKeys = keyPaths((ru as Record<string, unknown>).journey).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
