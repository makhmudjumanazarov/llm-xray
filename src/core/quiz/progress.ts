// Pure quiz scoring + the persisted-progress shape. The zustand store in
// components/quiz wraps these; keeping the logic here makes it unit-testable
// and keeps localStorage parsing defensive in one place.

import type { QuizQuestion, QuizSectionId } from "./bank";
import { QUIZ_SECTION_IDS } from "./bank";

export type SectionProgress = { best: number; done: boolean };

export type QuizProgressV1 = {
  version: 1;
  sections: Partial<Record<QuizSectionId, SectionProgress>>;
};

export function emptyProgress(): QuizProgressV1 {
  return { version: 1, sections: {} };
}

/** Score answers by position; null/undefined/out-of-range answers count wrong. */
export function scoreAnswers(
  questions: QuizQuestion[],
  answers: (number | null | undefined)[],
): { correct: number; total: number } {
  let correct = 0;
  questions.forEach((question, i) => {
    if (answers[i] === question.correctIndex) correct++;
  });
  return { correct, total: questions.length };
}

/** Merge an attempt in: best never regresses, done latches on. */
export function recordAttempt(
  prev: QuizProgressV1,
  sectionId: QuizSectionId,
  correct: number,
  total: number,
): QuizProgressV1 {
  const existing = prev.sections[sectionId];
  const best = Math.max(existing?.best ?? 0, Math.max(0, Math.min(correct, total)));
  return {
    version: 1,
    sections: { ...prev.sections, [sectionId]: { best, done: true } },
  };
}

export function countDone(progress: QuizProgressV1): number {
  return QUIZ_SECTION_IDS.filter((id) => progress.sections[id]?.done).length;
}

/** Validate whatever came out of storage; anything malformed → fresh state. */
export function parseProgress(raw: unknown): QuizProgressV1 {
  if (!raw || typeof raw !== "object") return emptyProgress();
  const candidate = raw as { version?: unknown; sections?: unknown };
  if (candidate.version !== 1 || !candidate.sections || typeof candidate.sections !== "object") {
    return emptyProgress();
  }
  const sections: QuizProgressV1["sections"] = {};
  for (const id of QUIZ_SECTION_IDS) {
    const entry = (candidate.sections as Record<string, unknown>)[id];
    if (!entry || typeof entry !== "object") continue;
    const { best, done } = entry as { best?: unknown; done?: unknown };
    if (typeof best === "number" && Number.isFinite(best) && best >= 0 && typeof done === "boolean") {
      sections[id] = { best: Math.floor(best), done };
    }
  }
  return { version: 1, sections };
}
