"use client";

import { EVOLUTION_ERAS, eraAxisPct } from "@/core/evolution/timeline";
import { useCountUp } from "@/components/ui/useCountUp";
import { ChevronDown } from "@/components/ui/icons";

// Warm sweep across the eight era accents, in order.
const RAIL_GRADIENT =
  "linear-gradient(90deg, var(--dim), var(--slide), var(--proj), var(--vis), var(--aud), var(--acc2), var(--full), var(--cyan))";

/** Rising "what AI could do" rail — illustrative, NOT a benchmark. */
export function EraProgressRail({
  activeIndex,
  label,
  nowLabel,
  activeTitle,
  bridgeCta,
  bridgeHref,
}: {
  activeIndex: number;
  label: string;
  nowLabel: string;
  activeTitle: string;
  bridgeCta: string;
  bridgeHref: string;
}) {
  const active = EVOLUTION_ERAS[activeIndex];
  const pct = active.capabilityPct;
  const accentVar = `var(${active.accentToken})`;
  const count = useCountUp(pct, 700);
  const isLast = activeIndex === EVOLUTION_ERAS.length - 1;

  // Bar/ticks ride the SHARED even era axis (aligned with the stepper); the big
  // number shows the illustrative capability (12 → 100).
  const fillPct = eraAxisPct(activeIndex);
  // Size the gradient to the whole track so colors stay positional as it grows.
  const gradientSize = `${fillPct > 0 ? (100 / fillPct) * 100 : 100}% 100%`;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-text tabular-nums">{Math.round(count)}</span>
          <span className="font-mono text-xs text-dim">/ 100</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-dim">{label}</span>
        </div>
        <div className="min-w-0 text-right">
          <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{nowLabel}</div>
          <div className="truncate font-mono text-sm font-semibold transition-colors duration-300" style={{ color: accentVar }}>
            {activeTitle}
          </div>
        </div>
      </div>

      <div className="relative mt-3 h-2.5 rounded-full bg-bg2">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${fillPct}%`,
            backgroundImage: RAIL_GRADIENT,
            backgroundSize: gradientSize,
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* era milestone nodes — sit exactly above the stepper icons below */}
        {EVOLUTION_ERAS.map((e, i) => (
          <span
            key={e.id}
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg transition-colors duration-300"
            style={{ left: `${eraAxisPct(i)}%`, background: i <= activeIndex ? `var(${e.accentToken})` : "var(--border2)" }}
            aria-hidden="true"
          />
        ))}
        {/* the "present" marker, riding the leading edge */}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg transition-[left] duration-500 ease-out"
          style={{ left: `${fillPct}%`, background: accentVar, boxShadow: `0 0 10px color-mix(in oklab, ${accentVar} 70%, transparent)` }}
          aria-hidden="true"
        />
      </div>

      {/* last era hands off to the live catalog */}
      {isLast && (
        <div className="mt-2 text-right">
          <a
            href={bridgeHref}
            aria-label={bridgeCta}
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-cyan no-underline hover:underline"
          >
            {bridgeCta}
            <ChevronDown size={14} className="animate-bounce" />
          </a>
        </div>
      )}
    </div>
  );
}
