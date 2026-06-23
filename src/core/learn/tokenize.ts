// Illustrative byte-pair encoding for the tokenization lesson: start from
// characters and greedily apply the highest-priority merge rules until none
// apply — the real BPE idea, made visible. NOT a real tokenizer (real ones learn
// thousands of merges from data + byte-level fallback). Pure + deterministic.

export type Tok = { text: string; id: number; special?: boolean };
export type TokenizeResult = { tokens: Tok[]; merges: string[]; charCount: number };

// Ranked merge rules ("left right"); earlier = higher priority (merged first).
const RAW_MERGES = [
  "t h", "th e", "i n", "in g", "e r", "r e", "o n", "a n", "an d", "a t",
  "e n", "i s", "o f", "i t", "t o", "o u", "s t", "l e", "e d", "e s",
  "a r", "a l", "h e", "s e", "v e", "m e", "l l", "o o", "e e", "s s",
  "o r", "a y", "e a", "i o", "io n", "t io", "at io", "w h", "wh a", "c h",
];
const MERGE_RANK: Record<string, number> = Object.fromEntries(RAW_MERGES.map((m, i) => [m, i]));

/** Greedy BPE over one word. Rule matching is case-insensitive but the original
 *  casing is preserved in the pieces, so the chips mirror the typed text. */
function bpeWord(word: string): { pieces: string[]; merges: string[] } {
  let units = word.split("");
  const merges: string[] = [];
  while (units.length > 1) {
    let bestRank = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < units.length - 1; i++) {
      const rank = MERGE_RANK[`${units[i].toLowerCase()} ${units[i + 1].toLowerCase()}`];
      if (rank !== undefined && rank < bestRank) {
        bestRank = rank;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    const merged = units[bestIdx] + units[bestIdx + 1];
    merges.push(`${units[bestIdx]} + ${units[bestIdx + 1]} → ${merged}`);
    units = [...units.slice(0, bestIdx), merged, ...units.slice(bestIdx + 2)];
  }
  return { pieces: units, merges };
}

/** Deterministic pseudo-id into a GPT-2-sized vocabulary (illustrative). */
function pseudoId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 50257;
}

/** Tokenize free text into illustrative BPE tokens. Non-initial words carry a
 *  leading-space marker "·" on their first piece (GPT-2-style). */
export function tokenize(input: string, withSpecials = true): TokenizeResult {
  const words = input.trim().split(/\s+/).filter(Boolean);
  const tokens: Tok[] = [];
  const merges: string[] = [];
  if (withSpecials) tokens.push({ text: "<bos>", id: 1, special: true });
  words.forEach((word, wi) => {
    const { pieces, merges: wm } = bpeWord(word);
    for (const m of wm) merges.push(m);
    pieces.forEach((p, pi) => {
      const text = wi > 0 && pi === 0 ? `·${p}` : p;
      tokens.push({ text, id: pseudoId(text) });
    });
  });
  if (withSpecials) tokens.push({ text: "<eos>", id: 2, special: true });
  return { tokens, merges, charCount: input.replace(/\s/g, "").length };
}
