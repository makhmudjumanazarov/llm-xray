import { describe, it, expect } from "vitest";
import { MOE_PRESETS, routerScores, topKIndices, activeFraction } from "./moe";
import { ROPE_PRESETS, ropeFreqs, rotate } from "./rope";
import { cacheBytes, windowKept } from "./kvcache";
import { mean, rms, rmsnorm, layernorm } from "./norm";

describe("moe router", () => {
  it("routerScores is a distribution and deterministic", () => {
    const a = routerScores(3, 8);
    const b = routerScores(3, 8);
    expect(a).toEqual(b);
    expect(a.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 6);
    expect(a.length).toBe(8);
  });
  it("topKIndices returns exactly k highest experts", () => {
    const s = routerScores(1, 8);
    const k = topKIndices(s, 2);
    expect(k.length).toBe(2);
    const sorted = [...s].sort((x, y) => y - x);
    expect(s[k[0]]).toBeCloseTo(sorted[0], 6);
  });
  it("activeFraction reflects sparsity", () => {
    expect(activeFraction(2, 8)).toBeCloseTo(0.25, 6);
    for (const p of MOE_PRESETS) expect(activeFraction(p.topK, p.numExperts)).toBeLessThan(1);
  });
});

describe("rope", () => {
  it("frequencies decay from 1 toward 0 across dim-pairs", () => {
    const f = ropeFreqs(8, 10000);
    expect(f.length).toBe(4);
    expect(f[0]).toBeCloseTo(1, 6);
    for (let i = 1; i < f.length; i++) expect(f[i]).toBeLessThan(f[i - 1]);
  });
  it("larger base makes high dims turn slower", () => {
    const small = ropeFreqs(8, 10000)[3];
    const big = ropeFreqs(8, 1000000)[3];
    expect(big).toBeLessThan(small);
    expect(ROPE_PRESETS.length).toBeGreaterThan(1);
  });
  it("rotate is a unit vector (cos²+sin²=1) and position 0 is identity", () => {
    const r = rotate(5, 0.3);
    expect(r.cos ** 2 + r.sin ** 2).toBeCloseTo(1, 6);
    expect(rotate(0, 0.3)).toEqual({ cos: 1, sin: 0 });
  });
});

describe("kv cache", () => {
  it("cacheBytes grows linearly with sequence length", () => {
    const a = cacheBytes(10, 12, 8, 64);
    const b = cacheBytes(20, 12, 8, 64);
    expect(b).toBeCloseTo(a * 2, 6);
    expect(cacheBytes(0, 12, 8, 64)).toBe(0);
  });
  it("windowKept evicts the oldest positions beyond the window", () => {
    const all = windowKept(10);
    expect(all.evicted).toEqual([]);
    expect(all.active.length).toBe(10);
    const win = windowKept(10, 4);
    expect(win.active).toEqual([6, 7, 8, 9]);
    expect(win.evicted).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("normalization", () => {
  it("rmsnorm rescales to unit RMS and does not subtract the mean", () => {
    const x = [3, 1, -1, 5];
    const y = rmsnorm(x);
    expect(rms(y)).toBeCloseTo(1, 4);
    // mean is NOT forced to zero (offset preserved up to scale)
    expect(Math.abs(mean(y))).toBeGreaterThan(1e-3);
  });
  it("layernorm centers (mean≈0) and unit variance", () => {
    const y = layernorm([3, 1, -1, 5]);
    expect(mean(y)).toBeCloseTo(0, 4);
    expect(rms(y)).toBeCloseTo(1, 3); // mean 0 → rms ≈ std ≈ 1
  });
});
