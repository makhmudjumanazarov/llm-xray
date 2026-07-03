"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { QuizQuestion } from "@/core/quiz/bank";
import { Check, X } from "@/components/ui/icons";

export type QuestionCopy = { prompt: string; options: string[]; explain?: string };

function tpl(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);
}

/**
 * One question with instant feedback: picking an option locks the card,
 * colors the picked/correct answers, and reveals the short explanation.
 */
export function QuizCard({
  question,
  copy,
  index,
  count,
  selected,
  accentVar,
  onSelect,
  dict,
}: {
  question: QuizQuestion;
  copy: QuestionCopy;
  index: number;
  count: number;
  selected: number | null;
  accentVar: string;
  onSelect: (optionIndex: number) => void;
  dict: Dictionary;
}) {
  const qz = dict.quiz;
  const answered = selected != null;

  return (
    <div className="animate-rise" key={question.id}>
      <div className="font-mono text-[11px] uppercase tracking-wide text-dim">
        {tpl(qz.questionOf, { i: index + 1, n: count })}
      </div>
      <p className="mt-1.5 text-[15px] font-semibold leading-snug text-text">{copy.prompt}</p>

      <div role="radiogroup" aria-label={copy.prompt} className="mt-3 grid gap-2 sm:grid-cols-2">
        {copy.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === selected;
          let cls = "border-border bg-panel text-muted hover:border-border2 hover:text-text";
          if (answered && isCorrect) cls = "border-success/60 bg-success/10 text-text";
          else if (answered && isPicked) cls = "border-danger/60 bg-danger/10 text-text";
          else if (answered) cls = "border-border bg-panel text-dim";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={isPicked}
              disabled={answered}
              onClick={() => onSelect(i)}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm leading-snug transition-colors disabled:cursor-default ${cls}`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] font-bold ${
                  answered && isCorrect ? "border-success text-success" : "border-border2 opacity-80"
                }`}
              >
                {answered && isCorrect ? <Check size={10} /> : answered && isPicked ? <X size={10} /> : String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {answered && copy.explain && (
        <p
          className="animate-rise mt-3 border-l-2 pl-2.5 text-[13px] leading-relaxed text-muted"
          style={{ borderColor: accentVar }}
        >
          <span className="font-mono text-[10px] uppercase tracking-wide text-dim">{qz.explainLabel}: </span>
          {copy.explain}
        </p>
      )}
    </div>
  );
}
