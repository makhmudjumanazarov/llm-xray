import { describe, it, expect } from "vitest";
import {
  PROCESS_DEFINITIONS,
  PROCESS_COUNT,
  clampProcessIndex,
  nextProcess,
  prevProcess,
  processById,
  processAxisPct,
  type ProcessId,
} from "./definitions";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

const CANONICAL_ORDER: ProcessId[] = [
  "quantization",
  "distillation",
  "adaptation",
  "rag",
  "agents",
  "reasoning",
  "serving",
  "safety",
];

const ACCENTS = ["--slide", "--proj", "--aud", "--vis", "--acc2", "--full", "--cyan", "--acc"];
const ICONS = ["Gauge", "Scale", "Sparkles", "Database", "Wrench", "Brain", "Cpu", "Shield"];

describe("LLM processes", () => {
  it("has exactly the eight canonical processes in order", () => {
    expect(PROCESS_COUNT).toBe(8);
    expect(PROCESS_DEFINITIONS.map((p) => p.id)).toEqual(CANONICAL_ORDER);
  });

  it("processAxisPct is evenly spaced + centered (icons land on the axis)", () => {
    const xs = PROCESS_DEFINITIONS.map((_, i) => processAxisPct(i));
    expect(xs).toEqual([6.25, 18.75, 31.25, 43.75, 56.25, 68.75, 81.25, 93.75]);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(12.5);
    expect(xs[0] + xs[xs.length - 1]).toBeCloseTo(100);
    expect(processAxisPct(-5)).toBe(6.25); // clamps
    expect(processAxisPct(99)).toBe(93.75);
  });

  it("every process carries non-empty KaTeX and a known accent/icon", () => {
    for (const p of PROCESS_DEFINITIONS) {
      expect(p.formulaKatex.trim().length).toBeGreaterThan(0);
      expect(ACCENTS).toContain(p.accentToken);
      expect(ICONS).toContain(p.iconName);
    }
  });

  it("ids and accent tokens are unique", () => {
    expect(new Set(PROCESS_DEFINITIONS.map((p) => p.id)).size).toBe(PROCESS_COUNT);
    expect(new Set(PROCESS_DEFINITIONS.map((p) => p.accentToken)).size).toBe(PROCESS_COUNT);
  });

  it("processById resolves each id and nothing else", () => {
    for (const id of CANONICAL_ORDER) expect(processById(id)?.id).toBe(id);
    // @ts-expect-error — guard against unknown ids at runtime too
    expect(processById("nope")).toBeUndefined();
  });
});

describe("navigation helpers clamp at both ends", () => {
  it("clampProcessIndex bounds and sanitizes", () => {
    expect(clampProcessIndex(-5)).toBe(0);
    expect(clampProcessIndex(99)).toBe(PROCESS_COUNT - 1);
    expect(clampProcessIndex(2.9)).toBe(2);
    expect(clampProcessIndex(NaN)).toBe(0);
  });

  it("next/prev never escape the range", () => {
    expect(prevProcess(0)).toBe(0);
    expect(nextProcess(PROCESS_COUNT - 1)).toBe(PROCESS_COUNT - 1);
    expect(nextProcess(0)).toBe(1);
    expect(prevProcess(2)).toBe(1);
  });
});

// ---- i18n contract: the dictionary must cover every process, in both locales ----

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("processes dictionary", () => {
  it("defines copy for every process in the canonical English dictionary", () => {
    const steps = (
      en as { processes: { steps: Record<string, { title: string; beginner: string; expert: string }> } }
    ).processes.steps;
    expect(steps).toBeTruthy();
    for (const id of CANONICAL_ORDER) {
      expect(steps[id], `en.processes.steps.${id}`).toBeTruthy();
      expect(typeof steps[id].title).toBe("string");
      expect(typeof steps[id].beginner).toBe("string");
      expect(typeof steps[id].expert).toBe("string");
    }
  });

  it("en and ru processes subtrees have identical key sets (no i18n drift)", () => {
    const enKeys = keyPaths((en as Record<string, unknown>).processes).sort();
    const ruKeys = keyPaths((ru as Record<string, unknown>).processes).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
