import { describe, it, expect } from "vitest";
import { tokenize } from "./tokenize";

describe("illustrative BPE tokenizer", () => {
  it("merges 'the' into a single token via t+h then th+e", () => {
    const { tokens, merges } = tokenize("the", false);
    const piece = tokens.find((t) => !t.special);
    expect(piece?.text).toBe("the");
    expect(merges.length).toBeGreaterThanOrEqual(2);
  });

  it("never produces more tokens than characters (merging only shrinks)", () => {
    const word = "tokenization";
    const { tokens } = tokenize(word, false);
    expect(tokens.length).toBeLessThanOrEqual(word.length);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("marks non-initial words with a leading-space dot and is deterministic", () => {
    const a = tokenize("the cat", false);
    const b = tokenize("the cat", false);
    expect(a.tokens.map((t) => t.text)).toEqual(b.tokens.map((t) => t.text));
    expect(a.tokens.some((t) => t.text.startsWith("·"))).toBe(true);
    expect(a.tokens[0].text.startsWith("·")).toBe(false); // first word has no space marker
  });

  it("wraps with <bos>/<eos> special tokens when requested, and counts chars", () => {
    const { tokens, charCount } = tokenize("a b", true);
    expect(tokens[0]).toMatchObject({ text: "<bos>", special: true });
    expect(tokens[tokens.length - 1]).toMatchObject({ text: "<eos>", special: true });
    expect(charCount).toBe(2); // whitespace excluded
  });

  it("handles empty input gracefully", () => {
    const { tokens, charCount } = tokenize("   ", true);
    expect(charCount).toBe(0);
    expect(tokens.map((t) => t.text)).toEqual(["<bos>", "<eos>"]);
  });
});
