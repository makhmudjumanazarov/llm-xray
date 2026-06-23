// Aggregate benchmark score — one comparable 0–100 number per model for ranking.
// To avoid over-weighting categories that happen to have more metrics (e.g. two
// code benchmarks), it averages WITHIN each reported category first, then across
// categories. Returns null when a model reports no benchmarks. Pure → unit tested.

import type { Model } from "@/core/model/schema";
import { BENCHMARK_METRICS } from "./catalog";

export function aggregateScore(model: Model): number | null {
  const b = model.stats.benchmarks;
  if (!b) return null;

  const byCategory = new Map<string, number[]>();
  for (const metric of BENCHMARK_METRICS) {
    const v = b[metric.id];
    if (typeof v === "number" && Number.isFinite(v)) {
      const arr = byCategory.get(metric.category) ?? [];
      arr.push(v);
      byCategory.set(metric.category, arr);
    }
  }
  if (byCategory.size === 0) return null;

  const mean = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / xs.length;
  const categoryMeans = [...byCategory.values()].map(mean);
  return Math.round(mean(categoryMeans) * 10) / 10;
}

/** How many of the catalog benchmarks this model reports (for "n/12" hints). */
export function reportedBenchmarkCount(model: Model): number {
  const b = model.stats.benchmarks;
  if (!b) return 0;
  return BENCHMARK_METRICS.filter((m) => typeof b[m.id] === "number").length;
}
