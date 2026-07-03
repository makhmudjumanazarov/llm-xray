"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { questionsForSection, type QuizSectionId } from "@/core/quiz/bank";
import { scoreAnswers } from "@/core/quiz/progress";
import { useMounted } from "@/components/training/hooks";
import { Trophy } from "@/components/ui/icons";
import { useQuizProgress, useHydrateProgress } from "./progressStore";
import { QuizCard, type QuestionCopy } from "./QuizCard";
import { QuizResult } from "./QuizResult";

type Phase = "intro" | "quiz" | "result";

function tpl(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);
}

/**
 * "Test yourself" card dropped after a journey section: collapsed CTA →
 * one-question-at-a-time flow with instant feedback → result + best score
 * persisted to localStorage.
 */
export function SectionQuiz({
  sectionId,
  accentToken,
  dict,
}: {
  sectionId: QuizSectionId;
  accentToken: string;
  dict: Dictionary;
}) {
  const qz = dict.quiz;
  const questions = useMemo(() => questionsForSection(sectionId), [sectionId]);
  const copies = qz.questions as Record<string, QuestionCopy>;
  const sectionTitle = (qz.sections as Record<QuizSectionId, string>)[sectionId];
  const accentVar = `var(${accentToken})`;

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  useHydrateProgress();
  const mounted = useMounted();
  const best = useQuizProgress((s) => s.progress.sections[sectionId]?.best);
  const record = useQuizProgress((s) => s.record);

  const start = () => {
    setAnswers(Array(questions.length).fill(null));
    setCurrent(0);
    setPhase("quiz");
  };

  const select = (optionIndex: number) => {
    setAnswers((prev) => {
      if (prev[current] != null) return prev;
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  };

  const advance = () => {
    if (current + 1 < questions.length) {
      setCurrent((i) => i + 1);
      return;
    }
    const { correct, total } = scoreAnswers(questions, answers);
    record(sectionId, correct, total);
    setPhase("result");
  };

  const { correct, total } = scoreAnswers(questions, answers);
  const question = questions[current];
  const answered = answers[current] != null;

  return (
    <section
      aria-label={`${qz.testYourself} — ${sectionTitle}`}
      className="rounded-card border border-border bg-panel/40 p-5"
      style={{ borderTop: `2px solid ${accentVar}` }}
    >
      {phase === "intro" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-text">
              {qz.testYourself} — {sectionTitle}
            </h3>
            <p className="mt-0.5 text-[13px] text-muted">{qz.questionsHint}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {mounted && best != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg2 px-2.5 py-1 font-mono text-[11px] text-muted">
                <span className="inline-flex" style={{ color: accentVar }}>
                  <Trophy size={12} />
                </span>
                {tpl(qz.bestScore, { score: best, total: questions.length })}
              </span>
            )}
            <button
              onClick={start}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: accentVar }}
            >
              {qz.start}
            </button>
          </div>
        </div>
      )}

      {phase === "quiz" && (
        <div>
          <QuizCard
            key={question.id}
            question={question}
            copy={copies[question.id]}
            index={current}
            count={questions.length}
            selected={answers[current]}
            accentVar={accentVar}
            onSelect={select}
            dict={dict}
          />
          {answered && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={advance}
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: accentVar }}
              >
                {current + 1 < questions.length ? qz.next : qz.seeResults}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "result" && (
        <QuizResult
          correct={correct}
          total={total}
          sectionTitle={sectionTitle}
          accentVar={accentVar}
          onRetry={start}
          dict={dict}
        />
      )}
    </section>
  );
}
