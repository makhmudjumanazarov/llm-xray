"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { tokenize } from "@/core/learn/tokenize";
import { LessonCard } from "./LessonCard";

type View = "tokens" | "ids" | "merges";

export function TokenizationLesson({ dict }: { dict: Dictionary }) {
  const expert = true;
  const L = dict.learn.tokenization;
  const [text, setText] = useState(L.sample);
  const [view, setView] = useState<View>("tokens");
  const result = useMemo(() => tokenize(text, true), [text]);
  const tokenCount = result.tokens.filter((t) => !t.special).length;

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={L.placeholder}
        aria-label={L.title}
        maxLength={80}
        className="w-full rounded-lg border border-border bg-bg2 px-3 py-2 font-mono text-sm text-text placeholder:text-dim focus:border-acc focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          ariaLabel={L.title}
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            { value: "tokens", label: L.viewTokens },
            { value: "ids", label: L.viewIds },
            { value: "merges", label: L.viewMerges },
          ]}
        />
        <span className="font-mono text-[11px] text-dim">
          {tokenCount} {L.tokens} · {result.charCount} {L.chars}
        </span>
      </div>

      {view !== "merges" ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.tokens.map((t, i) => (
            <span
              key={i}
              className="flex flex-col items-center rounded border px-1.5 py-0.5"
              style={{
                borderColor: t.special ? "var(--acc)" : "var(--border)",
                background: t.special ? "color-mix(in oklab, var(--acc2) 14%, transparent)" : i % 2 ? "var(--bg2)" : "var(--panel)",
              }}
            >
              <span className="font-mono text-[12px]" style={{ color: t.special ? "var(--acc)" : "var(--text)" }}>
                {t.text}
              </span>
              {view === "ids" && !t.special && <span className="font-mono text-[9px] text-dim">{t.id}</span>}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          {result.merges.length ? (
            result.merges.map((m, i) => (
              <div key={i} className="font-mono text-[12px] text-muted">
                {m}
              </div>
            ))
          ) : (
            <div className="font-mono text-[12px] text-dim">—</div>
          )}
        </div>
      )}
    </LessonCard>
  );
}
