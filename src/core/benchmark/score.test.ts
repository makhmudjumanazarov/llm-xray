import { describe, it, expect } from "vitest";
import type { Model } from "@/core/model/schema";
import { aggregateScore, reportedBenchmarkCount } from "./score";

const mk = (benchmarks?: Record<string, number>): Model =>
  ({ stats: { downloads: 0, likes: 0, benchmarks } }) as unknown as Model;

describe("aggregateScore", () => {
  it("returns null when no benchmarks", () => {
    expect(aggregateScore(mk())).toBeNull();
    expect(aggregateScore(mk({}))).toBeNull();
  });

  it("averages within category first, then across categories", () => {
    // two code metrics (50, 90 → cat mean 70) + one knowledge metric (80).
    // category-balanced mean = (70 + 80) / 2 = 75, NOT the raw mean 73.3.
    const s = aggregateScore(mk({ humaneval: 50, mbpp: 90, mmlu: 80 }));
    expect(s).toBe(75);
  });

  it("single metric scores itself", () => {
    expect(aggregateScore(mk({ mmlu: 64.2 }))).toBe(64.2);
  });

  it("counts reported benchmarks", () => {
    expect(reportedBenchmarkCount(mk({ mmlu: 70, gsm8k: 50 }))).toBe(2);
    expect(reportedBenchmarkCount(mk())).toBe(0);
  });
});
