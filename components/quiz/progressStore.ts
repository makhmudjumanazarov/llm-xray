"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizSectionId } from "@/core/quiz/bank";
import {
  emptyProgress,
  recordAttempt,
  parseProgress,
  type QuizProgressV1,
} from "@/core/quiz/progress";

type QuizProgressState = {
  progress: QuizProgressV1;
  record: (sectionId: QuizSectionId, correct: number, total: number) => void;
};

/**
 * Persisted quiz progress (localStorage). skipHydration keeps server and first
 * client render identical — components gate reads behind useMounted() and
 * useHydrateProgress() pulls the stored state in after mount.
 */
export const useQuizProgress = create<QuizProgressState>()(
  persist(
    (set) => ({
      progress: emptyProgress(),
      record: (sectionId, correct, total) =>
        set((s) => ({ progress: recordAttempt(s.progress, sectionId, correct, total) })),
    }),
    {
      name: "llmxray:progress",
      version: 1,
      skipHydration: true,
      // Never trust storage: corrupt payloads collapse to a fresh state.
      merge: (persisted, current) => ({
        ...current,
        progress: parseProgress((persisted as { progress?: unknown } | undefined)?.progress),
      }),
    },
  ),
);

/** Rehydrate the persisted store once after mount. */
export function useHydrateProgress(): void {
  useEffect(() => {
    void useQuizProgress.persist.rehydrate();
  }, []);
}
