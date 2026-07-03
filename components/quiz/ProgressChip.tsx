"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { QUIZ_SECTION_IDS } from "@/core/quiz/bank";
import { countDone } from "@/core/quiz/progress";
import { useMounted } from "@/components/training/hooks";
import { Trophy } from "@/components/ui/icons";
import { useQuizProgress, useHydrateProgress } from "./progressStore";

function tpl(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);
}

/** Small "N/5 quizzes done" pill; renders nothing until hydrated. */
export function ProgressChip({ dict }: { dict: Dictionary }) {
  useHydrateProgress();
  const mounted = useMounted();
  const progress = useQuizProgress((s) => s.progress);
  if (!mounted) return null;
  const done = countDone(progress);
  if (done === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 font-mono text-[11px] text-muted">
      <Trophy size={12} className="text-aud" />
      {tpl(dict.quiz.progressChip, { done, total: QUIZ_SECTION_IDS.length })}
    </span>
  );
}
