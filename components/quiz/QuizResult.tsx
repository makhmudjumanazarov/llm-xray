"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { Trophy, Repeat, Share, Check } from "@/components/ui/icons";

function tpl(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);
}

export function QuizResult({
  correct,
  total,
  sectionTitle,
  accentVar,
  onRetry,
  dict,
}: {
  correct: number;
  total: number;
  sectionTitle: string;
  accentVar: string;
  onRetry: () => void;
  dict: Dictionary;
}) {
  const qz = dict.quiz;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const message = correct === total ? qz.resultPerfect : correct >= Math.ceil(total * 0.6) ? qz.resultGood : qz.resultTryAgain;

  const shareScore = async () => {
    const text = tpl(qz.shareText, {
      score: correct,
      total,
      section: sectionTitle,
      url: window.location.href.split("?")[0],
    });
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // dismissed / blocked
    }
  };

  const btnCls =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 font-mono text-xs font-semibold text-muted transition-colors hover:border-border2 hover:text-text";

  return (
    <div className="animate-rise text-center">
      <div className="mx-auto w-fit" style={{ color: accentVar }}>
        <Trophy size={28} />
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-text">
        {tpl(qz.resultTitle, { score: correct, total })}
      </div>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={onRetry} className={btnCls}>
          <Repeat size={13} />
          {qz.retry}
        </button>
        <button onClick={shareScore} className={btnCls}>
          {copied ? <Check size={13} className="text-success" /> : <Share size={13} />}
          <span aria-live="polite">{copied ? qz.copied : qz.share}</span>
        </button>
      </div>
    </div>
  );
}
