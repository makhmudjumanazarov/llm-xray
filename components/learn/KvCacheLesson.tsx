"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCountUp } from "@/components/ui/useCountUp";
import { cacheBytes, windowKept } from "@/core/learn/kvcache";
import { Play, Square } from "@/components/ui/icons";
import { LessonCard } from "./LessonCard";

const FORMULA = "\\text{cache} \\approx 2 \\cdot L \\cdot n_{kv} \\cdot d_h \\cdot \\text{seq} \\cdot \\text{bytes}";
const LAYERS = 8;
const PROMPT = 4;
const MAX_STEP = 12;
const WINDOW = 6;
const KV_HEADS = 8;
const HEAD_DIM = 64;

function fmtBytes(b: number): string {
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

export function KvCacheLesson({ dict }: { dict: Dictionary }) {
  const expert = useExpertMode((s) => s.expert);
  const L = dict.learn.kvcache;
  const [step, setStep] = useState(0);
  const [sliding, setSliding] = useState(false);

  const total = PROMPT + step;
  const { active, evicted } = windowKept(total, sliding ? WINDOW : undefined);
  const bytes = cacheBytes(active.length, LAYERS, KV_HEADS, HEAD_DIM);
  const sizeKB = useCountUp(Math.round(bytes / 1024), 500);

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText} formula={FORMULA}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStep((s) => Math.min(MAX_STEP, s + 1))}
          disabled={step >= MAX_STEP}
          className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-2.5 py-1.5 font-mono text-[11px] font-semibold text-muted transition-colors hover:text-text disabled:opacity-40"
        >
          <Play size={12} />
          {L.generate}
        </button>
        <button
          onClick={() => setStep(0)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:text-text"
        >
          <Square size={11} />
          {L.reset}
        </button>
        <SegmentedControl
          ariaLabel={L.sliding}
          value={sliding ? "on" : "off"}
          onChange={(v) => setSliding(v === "on")}
          options={[
            { value: "off", label: L.full },
            { value: "on", label: L.window },
          ]}
        />
        <span className="ml-auto font-mono text-[11px] text-dim">
          {L.step} {step} · {L.cacheSize} <span style={{ color: "var(--acc)" }}>{fmtBytes(sizeKB * 1024)}</span>
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="inline-flex flex-col gap-[2px]">
          {Array.from({ length: LAYERS }, (_, l) => (
            <div key={l} className="flex items-center gap-[2px]">
              {sliding && evicted.length > 0 && (
                <span className="mr-0.5 font-mono text-[10px] text-dim" aria-hidden="true">
                  ⋯
                </span>
              )}
              {active.map((p) => {
                const isNew = p === total - 1 && step > 0;
                return (
                  <span
                    key={p}
                    className="h-3.5 w-3.5 rounded-sm transition-all duration-300"
                    style={{
                      background: "var(--acc2)",
                      opacity: p < PROMPT ? 0.6 : 0.95,
                      boxShadow: isNew ? "0 0 6px color-mix(in oklab, var(--acc2) 60%, transparent)" : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[9px] text-dim">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--acc2)" }} aria-hidden="true" />
          {L.cached}
        </span>
        <span>← {LAYERS} {L.layers}</span>
        <span>
          {active.length} {L.positions}
          {sliding && evicted.length > 0 ? ` · ${L.evicted} ${evicted.length}` : ""}
        </span>
      </div>
    </LessonCard>
  );
}
