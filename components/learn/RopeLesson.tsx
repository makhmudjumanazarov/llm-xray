"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ROPE_PRESETS, ropeFreqs, rotate } from "@/core/learn/rope";
import { LessonCard } from "./LessonCard";

const FORMULA = "\\theta_i = \\mathrm{base}^{-2i/d}, \\qquad q'_i = R(m\\,\\theta_i)\\, q_i";
const HEAD_DIM = 12; // → 6 dimension-pairs

export function RopeLesson({ dict }: { dict: Dictionary }) {
  const expert = true;
  const L = dict.learn.rope;
  const [pos, setPos] = useState(8);
  const [presetId, setPresetId] = useState(ROPE_PRESETS[0].id);
  const base = (ROPE_PRESETS.find((p) => p.id === presetId) ?? ROPE_PRESETS[0]).base;
  const freqs = ropeFreqs(HEAD_DIM, base);

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText} formula={FORMULA}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{L.base}</span>
        <SegmentedControl
          ariaLabel={L.base}
          value={presetId}
          onChange={setPresetId}
          options={ROPE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-center gap-3">
        {freqs.map((f, i) => {
          const { cos, sin } = rotate(pos, f);
          const r = 18;
          const cx = 22;
          const cy = 22;
          const ex = cx + r * cos;
          const ey = cy - r * sin;
          const tag = i === 0 ? L.fast : i === freqs.length - 1 ? L.slow : `${L.dimPair} ${i}`;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 44 44" className="h-12 w-12" role="img" aria-label={tag}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="1" />
                <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="var(--border2)" strokeWidth="0.75" strokeDasharray="2 2" />
                <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--acc2)" strokeWidth="1.5" style={{ transition: "all 0.3s var(--ease-out)" }} />
                <circle cx={ex} cy={ey} r="2.2" fill="var(--acc2)" style={{ transition: "all 0.3s var(--ease-out)" }} />
              </svg>
              <span className="font-mono text-[8px] text-dim">{tag}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between font-mono text-xs">
          <span className="text-muted">{L.position}</span>
          <span className="text-acc">m = {pos}</span>
        </div>
        <input
          type="range"
          min={0}
          max={64}
          step={1}
          value={pos}
          onChange={(e) => setPos(+e.target.value)}
          aria-label={L.position}
          className="w-full accent-[var(--acc2)]"
        />
      </div>
    </LessonCard>
  );
}
