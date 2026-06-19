import { describe, it, expect } from "vitest";
import { BENCHMARK_METRICS, ARCH_ROWS } from "./catalog";

const CATEGORIES = new Set([
  "knowledge", "math", "code", "reasoning", "commonsense", "truthfulness", "instruction",
]);

describe("benchmark catalog", () => {
  it("exposes at least 10 metrics with unique ids", () => {
    expect(BENCHMARK_METRICS.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(BENCHMARK_METRICS.map((m) => m.id));
    expect(ids.size).toBe(BENCHMARK_METRICS.length);
  });

  it("every metric has a valid category, label and name", () => {
    for (const m of BENCHMARK_METRICS) {
      expect(CATEGORIES.has(m.category)).toBe(true);
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.name.length).toBeGreaterThan(0);
    }
  });

  it("arch rows cover the key dimensions", () => {
    const ids = ARCH_ROWS.map((r) => r.id);
    for (const key of ["paramsB", "numLayers", "attentionType", "moe", "contextLen"]) {
      expect(ids).toContain(key);
    }
  });
});
