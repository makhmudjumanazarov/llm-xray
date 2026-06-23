"use client";

import { LIFECYCLE_STAGES, stageAxisPct } from "@/core/training/lifecycle";
import { useCountUp } from "@/components/ui/useCountUp";
import { ChevronDown } from "@/components/ui/icons";

type Captions = { init: string; pretraining: string; sft: string; preference: string; eval: string };

export function CapabilityMeter({
  activeIndex,
  label,
  nowLabel,
  captions,
  bridgeCta,
  bridgeHref,
}: {
  activeIndex: number;
  label: string;
  nowLabel: string;
  captions: Captions;
  bridgeCta: string;
  bridgeHref: string;
}) {
  const active = LIFECYCLE_STAGES[activeIndex];
  const pct = active.capabilityPct;
  const accentVar = `var(${active.accentToken})`;
  const count = useCountUp(pct, 700);
  const isLast = activeIndex === LIFECYCLE_STAGES.length - 1;
  const caption = captions[active.id];

  // The bar/ticks ride the SHARED even stage axis (so they line up with the stepper
  // below); the big number still shows the real illustrative capability (30→100).
  const fillPct = stageAxisPct(activeIndex);
  // Gradient warms slide→aud→full→vis; sizing it to the full track (not the fill)
  // keeps colors positional, so the bar visibly heats up as it grows.
  const gradientSize = `${fillPct > 0 ? (100 / fillPct) * 100 : 100}% 100%`;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-text tabular-nums">{Math.round(count)}</span>
          <span className="font-mono text-xs text-dim">/ 100</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-dim">{label}</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{nowLabel}</div>
          <div className="font-mono text-sm font-semibold transition-colors duration-300" style={{ color: accentVar }}>
            {caption}
          </div>
        </div>
      </div>

      <div className="relative mt-3 h-2.5 rounded-full bg-bg2">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${fillPct}%`,
            backgroundImage: "linear-gradient(90deg, var(--slide), var(--aud), var(--full), var(--vis))",
            backgroundSize: gradientSize,
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* stage milestone nodes — sit exactly above the stepper icons below */}
        {LIFECYCLE_STAGES.map((s, i) => (
          <span
            key={s.id}
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg transition-colors duration-300"
            style={{ left: `${stageAxisPct(i)}%`, background: i <= activeIndex ? `var(${s.accentToken})` : "var(--border2)" }}
            aria-hidden="true"
          />
        ))}
        {/* the model itself, riding the leading edge */}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg transition-[left] duration-500 ease-out"
          style={{ left: `${fillPct}%`, background: accentVar, boxShadow: `0 0 10px color-mix(in oklab, ${accentVar} 70%, transparent)` }}
          aria-hidden="true"
        />
      </div>

      {/* origin (random init) + stage number ticks (aligned to the stepper) */}
      <div className="relative mt-1.5 h-4">
        <span className="absolute left-0 font-mono text-[9px] text-dim">{captions.init}</span>
        {LIFECYCLE_STAGES.map((s, i) => (
          <span
            key={s.id}
            className="absolute -translate-x-1/2 font-mono text-[9px] transition-colors duration-300"
            style={{ left: `${stageAxisPct(i)}%`, color: i <= activeIndex ? `var(${s.accentToken})` : "var(--dim)" }}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {/* stage-4 handoff: pours the hero model down into the ranking */}
      {isLast && (
        <div className="mt-1 text-right">
          <a
            href={bridgeHref}
            aria-label={bridgeCta}
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-vis no-underline hover:underline"
          >
            {bridgeCta}
            <ChevronDown size={14} className="animate-bounce" />
          </a>
        </div>
      )}
    </div>
  );
}
