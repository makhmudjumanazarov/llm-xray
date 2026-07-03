import { describe, it, expect } from "vitest";
import { QUIZ_BANK, QUIZ_SECTION_IDS, QUESTIONS_PER_SECTION, questionsForSection } from "./bank";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

type QuestionCopy = { prompt: string; options: string[]; explain?: string };
const quizEn = (en as unknown as { quiz: { questions: Record<string, QuestionCopy>; sections: Record<string, unknown> } }).quiz;

describe("quiz bank", () => {
  it("has exactly QUESTIONS_PER_SECTION questions per section, unique ids", () => {
    for (const sectionId of QUIZ_SECTION_IDS) {
      expect(questionsForSection(sectionId).length, sectionId).toBe(QUESTIONS_PER_SECTION);
    }
    const ids = QUIZ_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(QUIZ_BANK.length).toBe(QUIZ_SECTION_IDS.length * QUESTIONS_PER_SECTION);
  });

  it("correctIndex is always inside the option range", () => {
    for (const q of QUIZ_BANK) {
      expect(q.correctIndex, q.id).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, q.id).toBeLessThan(q.optionCount);
    }
  });

  it("en copy exists for every question: prompt + exactly optionCount options", () => {
    for (const q of QUIZ_BANK) {
      const copy = quizEn.questions[q.id];
      expect(copy, `en.quiz.questions.${q.id}`).toBeTruthy();
      expect(typeof copy.prompt, `${q.id}.prompt`).toBe("string");
      expect(Array.isArray(copy.options), `${q.id}.options`).toBe(true);
      expect(copy.options.length, `${q.id}.options length`).toBe(q.optionCount);
      for (const opt of copy.options) expect(typeof opt).toBe("string");
    }
  });

  it("en has a title for every section", () => {
    for (const sectionId of QUIZ_SECTION_IDS) {
      expect(quizEn.sections[sectionId], `quiz.sections.${sectionId}`).toBeTruthy();
    }
  });

  it("en and ru quiz subtrees have identical key sets (no i18n drift)", () => {
    const enKeys = keyPaths((en as Record<string, unknown>).quiz).sort();
    const ruKeys = keyPaths((ru as Record<string, unknown>).quiz).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
