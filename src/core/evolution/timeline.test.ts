import { describe, it, expect } from "vitest";
import {
  EVOLUTION_ERAS,
  ERA_COUNT,
  clampEraIndex,
  nextEra,
  prevEra,
  capabilityAt,
  eraById,
  eraAxisPct,
  isMonotonic,
  type EraId,
} from "./timeline";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

const CANONICAL_ORDER: EraId[] = [
  "classical_ml",
  "perceptron",
  "deep_learning",
  "vision_cnn",
  "nlp_seq",
  "transformers",
  "llms",
  "frontier",
];

const ACCENTS = ["--dim", "--slide", "--proj", "--vis", "--aud", "--acc2", "--full", "--cyan"];
const ICONS = ["Function", "Network", "Layers", "Eye", "Type", "Grid", "Bot", "Globe"];

describe("evolution eras", () => {
  it("has exactly the eight canonical eras in chronological order", () => {
    expect(ERA_COUNT).toBe(8);
    expect(EVOLUTION_ERAS.map((e) => e.id)).toEqual(CANONICAL_ORDER);
  });

  it("eraAxisPct is evenly spaced + centered (rail ticks align with stepper icons)", () => {
    const xs = EVOLUTION_ERAS.map((_, i) => eraAxisPct(i));
    expect(xs).toEqual([6.25, 18.75, 31.25, 43.75, 56.25, 68.75, 81.25, 93.75]);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(12.5);
    expect(xs[0] + xs[xs.length - 1]).toBeCloseTo(100);
    expect(eraAxisPct(-5)).toBe(6.25); // clamps
    expect(eraAxisPct(99)).toBe(93.75);
  });

  it("capability rises strictly and tops out at 100", () => {
    const caps = EVOLUTION_ERAS.map((e) => e.capabilityPct);
    for (let i = 1; i < caps.length; i++) expect(caps[i]).toBeGreaterThan(caps[i - 1]);
    expect(caps[caps.length - 1]).toBe(100);
    expect(isMonotonic()).toBe(true);
  });

  it("every era carries non-empty KaTeX and a known accent/icon", () => {
    for (const e of EVOLUTION_ERAS) {
      expect(e.formulaKatex.trim().length).toBeGreaterThan(0);
      expect(ACCENTS).toContain(e.accentToken);
      expect(ICONS).toContain(e.iconName);
    }
  });

  it("modelSlugs, when present, are non-empty strings", () => {
    for (const e of EVOLUTION_ERAS) {
      if (!e.modelSlugs) continue;
      expect(e.modelSlugs.length).toBeGreaterThan(0);
      for (const s of e.modelSlugs) expect(typeof s).toBe("string");
    }
  });

  it("eraById resolves each id and nothing else", () => {
    for (const id of CANONICAL_ORDER) expect(eraById(id)?.id).toBe(id);
    // @ts-expect-error — guard against unknown ids at runtime too
    expect(eraById("nope")).toBeUndefined();
  });
});

describe("navigation helpers clamp at both ends", () => {
  it("clampEraIndex bounds and sanitizes", () => {
    expect(clampEraIndex(-5)).toBe(0);
    expect(clampEraIndex(99)).toBe(ERA_COUNT - 1);
    expect(clampEraIndex(2.9)).toBe(2);
    expect(clampEraIndex(NaN)).toBe(0);
  });

  it("next/prev never escape the range", () => {
    expect(prevEra(0)).toBe(0);
    expect(nextEra(ERA_COUNT - 1)).toBe(ERA_COUNT - 1);
    expect(nextEra(0)).toBe(1);
    expect(prevEra(2)).toBe(1);
  });

  it("capabilityAt matches the era table and clamps", () => {
    expect(capabilityAt(0)).toBe(EVOLUTION_ERAS[0].capabilityPct);
    expect(capabilityAt(-1)).toBe(EVOLUTION_ERAS[0].capabilityPct);
    expect(capabilityAt(100)).toBe(100);
  });
});

// ---- i18n contract: the dictionary must cover every era, in both locales ----

/** Recursively collect dotted key paths of a plain object (leaves included). */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("evolution dictionary", () => {
  it("defines copy for every era in the canonical English dictionary", () => {
    const eras = (
      en as { evolution: { eras: Record<string, { title: string; yearLabel: string; beginner: string; expert: string }> } }
    ).evolution.eras;
    expect(eras).toBeTruthy();
    for (const id of CANONICAL_ORDER) {
      expect(eras[id], `en.evolution.eras.${id}`).toBeTruthy();
      expect(typeof eras[id].title).toBe("string");
      expect(typeof eras[id].yearLabel).toBe("string");
      expect(typeof eras[id].beginner).toBe("string");
      expect(typeof eras[id].expert).toBe("string");
    }
  });

  it("en and ru evolution subtrees have identical key sets (no i18n drift)", () => {
    const enKeys = keyPaths((en as Record<string, unknown>).evolution).sort();
    const ruKeys = keyPaths((ru as Record<string, unknown>).evolution).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
