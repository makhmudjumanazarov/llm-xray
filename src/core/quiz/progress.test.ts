import { describe, it, expect } from "vitest";
import { questionsForSection } from "./bank";
import { scoreAnswers, recordAttempt, countDone, parseProgress, emptyProgress } from "./progress";

describe("scoreAnswers", () => {
  const questions = questionsForSection("training");

  it("counts only exact correct indices; nulls and out-of-range are wrong", () => {
    const perfect = questions.map((q) => q.correctIndex);
    expect(scoreAnswers(questions, perfect)).toEqual({ correct: 5, total: 5 });
    expect(scoreAnswers(questions, [null, undefined, 99, -1, questions[4].correctIndex])).toEqual({
      correct: 1,
      total: 5,
    });
    expect(scoreAnswers(questions, [])).toEqual({ correct: 0, total: 5 });
  });
});

describe("recordAttempt", () => {
  it("best never regresses and done latches on", () => {
    let p = emptyProgress();
    p = recordAttempt(p, "training", 4, 5);
    expect(p.sections.training).toEqual({ best: 4, done: true });
    p = recordAttempt(p, "training", 2, 5);
    expect(p.sections.training).toEqual({ best: 4, done: true });
    p = recordAttempt(p, "training", 5, 5);
    expect(p.sections.training).toEqual({ best: 5, done: true });
  });

  it("clamps nonsense scores into range and counts sections", () => {
    let p = recordAttempt(emptyProgress(), "learn", 99, 5);
    expect(p.sections.learn!.best).toBe(5);
    p = recordAttempt(p, "inference", -3, 5);
    expect(p.sections.inference!.best).toBe(0);
    expect(countDone(p)).toBe(2);
  });
});

describe("parseProgress", () => {
  it("round-trips valid state", () => {
    const p = recordAttempt(emptyProgress(), "evolution", 3, 5);
    expect(parseProgress(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it("rejects garbage, wrong versions, and malformed sections", () => {
    for (const bad of [null, undefined, 42, "x", [], { version: 2, sections: {} }, { sections: {} }]) {
      expect(parseProgress(bad)).toEqual(emptyProgress());
    }
    const mixed = parseProgress({
      version: 1,
      sections: {
        training: { best: 4, done: true },
        inference: { best: "high", done: true }, // malformed → dropped
        bogus: { best: 5, done: true }, // unknown section → dropped
      },
    });
    expect(mixed.sections).toEqual({ training: { best: 4, done: true } });
  });
});
