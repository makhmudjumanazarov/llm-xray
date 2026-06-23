"use client";

import { useRef } from "react";
import { EVOLUTION_ERAS, nextEra, prevEra, eraAxisPct, type EraIconName } from "@/core/evolution/timeline";
import { Function, Network, Layers, Eye, Type, Grid, Bot, Globe, Play, Square, ChevronRight } from "@/components/ui/icons";

const ICONS: Record<EraIconName, typeof Layers> = { Function, Network, Layers, Eye, Type, Grid, Bot, Globe };

/** Horizontal timeline selector — one node per era on a shared, even axis. */
export function EraStepper({
  activeIndex,
  onSelect,
  playing,
  onTogglePlay,
  titles,
  years,
  labels,
}: {
  activeIndex: number;
  onSelect: (i: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  titles: string[];
  years: string[];
  labels: { prev: string; next: string; play: string; stop: string; group: string };
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTo(i: number) {
    onSelect(i);
    btnRefs.current[i]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusTo(nextEra(activeIndex));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusTo(prevEra(activeIndex));
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTo(EVOLUTION_ERAS.length - 1);
    }
  }

  return (
    <div>
      <div role="group" aria-label={labels.group} onKeyDown={onKeyDown} className="relative h-[4.25rem]">
        {/* shared axis track — same coordinate space as the rail above */}
        <div className="absolute inset-x-0 top-4 h-0.5 -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute left-0 top-4 h-0.5 -translate-y-1/2 rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${eraAxisPct(activeIndex)}%`,
            background: `var(${EVOLUTION_ERAS[activeIndex].accentToken})`,
          }}
        />
        {EVOLUTION_ERAS.map((era, i) => {
          const Icon = ICONS[era.iconName];
          const active = i === activeIndex;
          const visited = i <= activeIndex;
          const accentVar = `var(${era.accentToken})`;
          return (
            <button
              key={era.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => onSelect(i)}
              tabIndex={active ? 0 : -1}
              aria-current={active ? "step" : undefined}
              aria-label={titles[i]}
              title={titles[i]}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1 focus-visible:outline-none"
              style={{ left: `${eraAxisPct(i)}%` }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300"
                style={{
                  borderColor: visited ? accentVar : "var(--border2)",
                  background: active ? accentVar : "var(--bg)",
                  color: active ? "var(--bg)" : visited ? accentVar : "var(--dim)",
                  boxShadow: active ? `0 0 12px color-mix(in oklab, ${accentVar} 55%, transparent)` : undefined,
                }}
              >
                <Icon size={15} />
              </span>
              <span
                className="font-mono text-[9px] leading-none transition-colors duration-300"
                style={{ color: active ? "var(--text)" : "var(--dim)" }}
              >
                {years[i]}
              </span>
            </button>
          );
        })}
      </div>

      {/* active era title (instead of cramming 8 labels onto the axis) */}
      <div className="mt-1 text-center">
        <span
          className="font-mono text-[11px] font-semibold"
          style={{ color: `var(${EVOLUTION_ERAS[activeIndex].accentToken})` }}
        >
          {titles[activeIndex]}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-2">
        <button
          onClick={() => onSelect(prevEra(activeIndex))}
          disabled={activeIndex === 0}
          aria-label={labels.prev}
          className="rounded-md border border-border bg-panel p-1.5 text-muted transition-colors hover:text-text disabled:opacity-40"
        >
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <button
          onClick={onTogglePlay}
          aria-label={playing ? labels.stop : labels.play}
          className="flex items-center gap-1.5 rounded-md border border-border bg-panel px-2.5 py-1.5 font-mono text-[11px] font-semibold text-muted transition-colors hover:text-text"
        >
          {playing ? <Square size={12} /> : <Play size={12} />}
          {playing ? labels.stop : labels.play}
        </button>
        <button
          onClick={() => onSelect(nextEra(activeIndex))}
          disabled={activeIndex === EVOLUTION_ERAS.length - 1}
          aria-label={labels.next}
          className="rounded-md border border-border bg-panel p-1.5 text-muted transition-colors hover:text-text disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
