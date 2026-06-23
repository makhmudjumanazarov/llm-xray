"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { rmsnorm, layernorm, mean, rms } from "@/core/learn/norm";
import { LessonCard } from "./LessonCard";

const FORMULA =
  "\\mathrm{RMSNorm}(x)=\\dfrac{x}{\\sqrt{\\tfrac{1}{d}\\sum_i x_i^2+\\epsilon}}\\,\\gamma, \\qquad \\mathrm{LayerNorm}(x)=\\dfrac{x-\\mu}{\\sqrt{\\sigma^2+\\epsilon}}\\,\\gamma+\\beta";

/** Deterministic illustrative vector in roughly [-3, 3] (no RNG → stable). */
function genVector(seed: number): number[] {
  return Array.from({ length: 8 }, (_, i) => {
    const x = Math.sin((seed + 1) * 53.13 + (i + 1) * 12.71) * 1000;
    return +((x - Math.floor(x)) * 6 - 3).toFixed(2);
  });
}

function SignedBars({
  values,
  label,
  accentVar,
  meanLabel,
  rmsLabel,
  maxAbs,
}: {
  values: number[];
  label: string;
  accentVar: string;
  meanLabel: string;
  rmsLabel: string;
  maxAbs: number;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-dim">{label}</div>
      <div className="space-y-1">
        {values.map((v, i) => {
          const w = (Math.abs(v) / maxAbs) * 50;
          return (
            <div key={i} className="relative h-3 overflow-hidden rounded bg-bg2">
              <span className="absolute inset-y-0 left-1/2 w-px bg-border2" aria-hidden="true" />
              <div
                className="absolute top-0 h-full rounded transition-[width,left] duration-300 ease-out"
                style={{ background: accentVar, left: v >= 0 ? "50%" : `${50 - w}%`, width: `${w}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-3 font-mono text-[10px] text-dim">
        <span>
          {meanLabel} {mean(values).toFixed(2)}
        </span>
        <span>
          {rmsLabel} {rms(values).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export function NormLesson({ dict }: { dict: Dictionary }) {
  const expert = useExpertMode((s) => s.expert);
  const L = dict.learn.norm;
  const [seed, setSeed] = useState(0);
  const [method, setMethod] = useState<"rms" | "layer">("rms");
  const x = useMemo(() => genVector(seed), [seed]);
  const y = method === "rms" ? rmsnorm(x) : layernorm(x);
  // Shared scale so the "after" panel visibly shrinks relative to "before".
  const maxAbs = Math.max(0.5, ...x.map(Math.abs), ...y.map(Math.abs));

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText} formula={FORMULA}>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={L.title}
          value={method}
          onChange={(m) => setMethod(m as "rms" | "layer")}
          options={[
            { value: "rms", label: L.rmsnorm },
            { value: "layer", label: L.layernorm },
          ]}
        />
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-md border border-border bg-panel px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:text-text"
        >
          {L.randomize}
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SignedBars values={x} label={L.before} accentVar="var(--dim)" meanLabel={L.meanLabel} rmsLabel={L.rmsLabel} maxAbs={maxAbs} />
        <SignedBars values={y} label={L.after} accentVar="var(--acc2)" meanLabel={L.meanLabel} rmsLabel={L.rmsLabel} maxAbs={maxAbs} />
      </div>
    </LessonCard>
  );
}
