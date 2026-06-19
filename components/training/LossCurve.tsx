"use client";

import type { StageId } from "@/core/training/lifecycle";
import { usePrefersReducedMotion, useMounted } from "./hooks";

// Synthetic, explicitly-illustrative loss trajectories per stage (eval has no
// training loss, so StageDiagram renders benchmark bars instead of this curve).
const PATHS: Partial<Record<StageId, string>> = {
  pretraining: "M4 12 C 50 16, 80 30, 110 38 S 170 50, 196 52",
  sft: "M4 14 C 20 40, 44 48, 70 50 S 150 52, 196 52",
  preference: "M4 20 C 60 28, 104 40, 140 46 S 182 50, 196 50",
};

export function LossCurve({
  stage,
  accentVar,
  axisLabel,
  stepsLabel,
}: {
  stage: StageId;
  accentVar: string;
  axisLabel: string;
  stepsLabel: string;
}) {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const d = PATHS[stage] ?? PATHS.pretraining!;
  // Draw-on reveal via stroke-dashoffset (no path measuring needed: dasharray
  // is a safe over-estimate of the path length). Reduced motion shows it drawn.
  const drawn = mounted || reduced;

  return (
    <div className="rounded-lg border border-border bg-bg2 p-2">
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-dim">
        <span>{axisLabel}</span>
        <span>{stepsLabel} →</span>
      </div>
      <svg viewBox="0 0 200 64" className="h-16 w-full" preserveAspectRatio="none" role="img" aria-label={axisLabel}>
        <line x1="4" y1="58" x2="196" y2="58" stroke="var(--border2)" strokeWidth="0.75" />
        <path
          d={d}
          fill="none"
          stroke={accentVar}
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            strokeDasharray: 600,
            strokeDashoffset: drawn ? 0 : 600,
            transition: "stroke-dashoffset 1100ms var(--ease-out)",
            filter: `drop-shadow(0 0 3px color-mix(in oklab, ${accentVar} 50%, transparent))`,
          }}
        />
      </svg>
    </div>
  );
}
