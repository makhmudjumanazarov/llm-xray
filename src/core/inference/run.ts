// Pure, testable inference helpers — the runtime narrative the Inference Journey
// animates. Illustrative (no real weights), deterministic (no RNG, so tests and
// SSR are stable). softmaxTemp is the single source of truth shared with the
// /learn softmax + sampling lessons.

import { tokenizeIllustrative } from "../model/forwardPass";
import { kvCacheSize } from "./stages";

export type Candidate = { token: string; logit: number };

/** Temperature-scaled softmax. T→0 sharpens toward argmax, T→∞ flattens. */
export function softmaxTemp(logits: number[], T: number): number[] {
  const t = Math.max(1e-6, T);
  const scaled = logits.map((z) => z / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Keep-mask for the k highest-probability candidates (aligned to input order). */
export function topKMask(probs: number[], k: number): boolean[] {
  const kk = Math.max(1, Math.min(Math.trunc(k), probs.length));
  const keep = new Set(
    probs
      .map((p, i) => [p, i] as const)
      .sort((a, b) => b[0] - a[0])
      .slice(0, kk)
      .map(([, i]) => i),
  );
  return probs.map((_, i) => keep.has(i));
}

/** Nucleus keep-mask: smallest descending set whose cumulative probability ≥ p. */
export function topPMask(probs: number[], p: number): boolean[] {
  const target = Math.max(0, Math.min(1, p));
  const order = probs.map((pr, i) => [pr, i] as const).sort((a, b) => b[0] - a[0]);
  const keep = new Set<number>();
  let cum = 0;
  for (const [pr, i] of order) {
    keep.add(i);
    cum += pr;
    if (cum >= target) break;
  }
  return probs.map((_, i) => keep.has(i));
}

export type SamplingMethod = "greedy" | "topk" | "topp";
export type SamplingState = { temp: number; method: SamplingMethod; k: number; p: number };

/** Resolve a sampling configuration over raw logits into the probabilities, the
 *  kept-candidate mask (greedy keeps all), and the (illustrative) picked index. */
export function resolveSampling(logits: number[], s: SamplingState): {
  probs: number[];
  keepMask: boolean[];
  picked: number;
} {
  const probs = softmaxTemp(logits, s.temp);
  const keepMask =
    s.method === "topk" ? topKMask(probs, s.k) : s.method === "topp" ? topPMask(probs, s.p) : probs.map(() => true);
  return { probs, keepMask, picked: pickIndex(probs, keepMask) };
}

/** Deterministic argmax within an optional keep-mask (illustrative "sample"). */
export function pickIndex(probs: number[], mask?: boolean[]): number {
  let best = 0;
  let bestP = -Infinity;
  for (let i = 0; i < probs.length; i++) {
    if (mask && !mask[i]) continue;
    if (probs[i] > bestP) {
      bestP = probs[i];
      best = i;
    }
  }
  return best;
}

// Illustrative next-token candidate banks, rotated per generation step so the
// stream reads sensibly ("Paris is a city …"). NOT real model output.
const STEP_BANKS: Candidate[][] = [
  [
    { token: "Paris", logit: 3.2 },
    { token: "London", logit: 1.9 },
    { token: "Rome", logit: 1.3 },
    { token: "Lyon", logit: 0.7 },
    { token: "Berlin", logit: 0.2 },
  ],
  [
    { token: "is", logit: 2.8 },
    { token: "was", logit: 1.6 },
    { token: "sits", logit: 1.0 },
    { token: "lies", logit: 0.6 },
    { token: "remains", logit: 0.1 },
  ],
  [
    { token: "a", logit: 2.5 },
    { token: "the", logit: 2.1 },
    { token: "one", logit: 1.0 },
    { token: "its", logit: 0.5 },
    { token: "known", logit: 0.2 },
  ],
  [
    { token: "city", logit: 3.0 },
    { token: "capital", logit: 2.2 },
    { token: "place", logit: 1.1 },
    { token: "hub", logit: 0.6 },
    { token: "center", logit: 0.3 },
  ],
];

export function candidatesForStep(step: number): Candidate[] {
  const n = STEP_BANKS.length;
  return STEP_BANKS[((step % n) + n) % n];
}

// Prompt-coherent illustrative continuations for the loop stage, so a visible
// prompt produces a sensible "answer" (not "Paris is a city" for "2 + 2 ="). The
// generic fallback is intentionally a vague ellipsis — honest about being made up.
const CONTINUATIONS: { match: RegExp; tokens: string[] }[] = [
  { match: /capital of france|столиц.* франц/i, tokens: ["Paris", ".", "It", "is"] },
  { match: /water is made|вода состоит/i, tokens: ["hydrogen", "and", "oxygen", "."] },
  { match: /2\s*\+\s*2/i, tokens: ["4", ".", "Two", "plus"] },
];
const GENERIC_CONTINUATION = ["…", "the", "next", "token"];

/** Deterministic illustrative continuation tokens for a prompt (NOT real output). */
export function continuationTokens(prompt: string): string[] {
  for (const c of CONTINUATIONS) if (c.match.test(prompt)) return c.tokens;
  return GENERIC_CONTINUATION;
}

export type GenStep = { candidates: Candidate[]; chosenIndex: number; chosenToken: string; kvSize: number };
export type GenerationScript = { promptTokens: string[]; steps: GenStep[] };

/** Tokenize the prompt and script a few illustrative generated tokens: each step
 *  carries a candidate distribution (for the bars), the greedy pick, the actual
 *  prompt-coherent token shown, and the (growing) KV-cache size. */
export function buildGenerationScript(prompt: string, steps = 4): GenerationScript {
  const promptTokens = tokenizeIllustrative(prompt);
  const cont = continuationTokens(prompt);
  const out: GenStep[] = [];
  const n = Math.min(Math.max(1, steps), cont.length);
  for (let s = 0; s < n; s++) {
    const candidates = candidatesForStep(s);
    const probs = softmaxTemp(
      candidates.map((c) => c.logit),
      1,
    );
    out.push({
      candidates,
      chosenIndex: pickIndex(probs),
      chosenToken: cont[s],
      kvSize: kvCacheSize(s + 1, promptTokens.length),
    });
  }
  return { promptTokens, steps: out };
}
