"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCountUp } from "@/components/ui/useCountUp";
import { MOE_PRESETS, routerScores, topKIndices, activeFraction } from "@/core/learn/moe";
import { LessonCard } from "./LessonCard";

const FORMULA =
  "g = \\mathrm{top\\text{-}}k\\big(\\mathrm{softmax}(x W_r)\\big), \\qquad y = \\sum_{i \\in \\mathrm{top\\text{-}}k} g_i\\, E_i(x)";

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];

export function MoeLesson({ dict }: { dict: Dictionary }) {
  const expert = useExpertMode((s) => s.expert);
  const L = dict.learn.moe;
  const [presetId, setPresetId] = useState(MOE_PRESETS[0].id);
  const [hover, setHover] = useState<number | null>(null);
  const preset = MOE_PRESETS.find((p) => p.id === presetId) ?? MOE_PRESETS[0];

  const rows = TOKENS.map((t, ti) => {
    const scores = routerScores(ti, preset.numExperts);
    return { t, top: new Set(topKIndices(scores, preset.topK)) };
  });

  const activePct = Math.round(activeFraction(preset.topK, preset.numExperts) * 100);
  const animated = useCountUp(activePct, 600);

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText} formula={FORMULA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{L.preset}</span>
          <SegmentedControl
            ariaLabel={L.preset}
            value={presetId}
            onChange={setPresetId}
            options={MOE_PRESETS.map((p) => ({ value: p.id, label: p.id === "mixtral" ? p.label : `${p.numExperts} ${L.experts}` }))}
          />
        </div>
        <div className="font-mono text-[11px] text-dim">
          <span style={{ color: "var(--aud)" }}>{preset.topK}</span> / {preset.numExperts} {L.experts} ·{" "}
          <span style={{ color: "var(--aud)" }}>{Math.round(animated)}%</span> {L.active}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="inline-flex min-w-full flex-col gap-1">
          <div className="flex items-center gap-1 pl-12 font-mono text-[9px] text-dim">{L.router} →</div>
          {rows.map((row, ti) => (
            <div
              key={ti}
              tabIndex={0}
              aria-label={row.t}
              className="flex items-center gap-1 rounded transition-colors focus-visible:outline-none"
              style={{ background: hover === ti ? "color-mix(in oklab, var(--aud) 8%, transparent)" : "transparent" }}
              onMouseEnter={() => setHover(ti)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(ti)}
              onBlur={() => setHover(null)}
            >
              <span className="w-11 shrink-0 truncate text-right font-mono text-[10px] text-muted">{row.t}</span>
              <div className="flex gap-[2px]">
                {Array.from({ length: preset.numExperts }, (_, e) => {
                  const lit = row.top.has(e);
                  return (
                    <span
                      key={e}
                      className="h-3 w-3 rounded-sm transition-all duration-200"
                      style={{
                        background: lit ? "var(--aud)" : "var(--bg2)",
                        opacity: lit ? 1 : hover === ti ? 0.35 : 0.18,
                        boxShadow: lit ? "0 0 5px color-mix(in oklab, var(--aud) 55%, transparent)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[9px] text-dim">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--aud)" }} aria-hidden="true" />
          {L.topk}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--bg2)", opacity: 0.5 }} aria-hidden="true" />
          {L.skipped}
        </span>
      </div>
    </LessonCard>
  );
}
