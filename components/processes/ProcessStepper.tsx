"use client";

import { useRef } from "react";
import {
  PROCESS_DEFINITIONS,
  nextProcess,
  prevProcess,
  processAxisPct,
  type ProcessIconName,
} from "@/core/processes/definitions";
import {
  Gauge,
  Scale,
  Sparkles,
  Database,
  Wrench,
  Brain,
  Cpu,
  Shield,
  Play,
  Square,
  ChevronRight,
} from "@/components/ui/icons";

const ICONS: Record<ProcessIconName, typeof Scale> = { Gauge, Scale, Sparkles, Database, Wrench, Brain, Cpu, Shield };

/** Horizontal selector — one node per process on a shared, even axis. */
export function ProcessStepper({
  activeIndex,
  onSelect,
  playing,
  onTogglePlay,
  titles,
  labels,
}: {
  activeIndex: number;
  onSelect: (i: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  titles: string[];
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
      focusTo(nextProcess(activeIndex));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusTo(prevProcess(activeIndex));
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTo(PROCESS_DEFINITIONS.length - 1);
    }
  }

  return (
    <div>
      <div role="group" aria-label={labels.group} onKeyDown={onKeyDown} className="relative h-12">
        {/* shared axis track */}
        <div className="absolute inset-x-0 top-4 h-0.5 -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute left-0 top-4 h-0.5 -translate-y-1/2 rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${processAxisPct(activeIndex)}%`,
            background: `var(${PROCESS_DEFINITIONS[activeIndex].accentToken})`,
          }}
        />
        {PROCESS_DEFINITIONS.map((p, i) => {
          const Icon = ICONS[p.iconName];
          const active = i === activeIndex;
          const visited = i <= activeIndex;
          const accentVar = `var(${p.accentToken})`;
          return (
            <button
              key={p.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => onSelect(i)}
              tabIndex={active ? 0 : -1}
              aria-current={active ? "step" : undefined}
              aria-label={titles[i]}
              title={titles[i]}
              className="absolute top-0 -translate-x-1/2 focus-visible:outline-none"
              style={{ left: `${processAxisPct(i)}%` }}
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
            </button>
          );
        })}
      </div>

      {/* active process title (instead of cramming 8 labels onto the axis) */}
      <div className="mt-1 text-center">
        <span
          className="font-mono text-[11px] font-semibold"
          style={{ color: `var(${PROCESS_DEFINITIONS[activeIndex].accentToken})` }}
        >
          {titles[activeIndex]}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-2">
        <button
          onClick={() => onSelect(prevProcess(activeIndex))}
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
          onClick={() => onSelect(nextProcess(activeIndex))}
          disabled={activeIndex === PROCESS_DEFINITIONS.length - 1}
          aria-label={labels.next}
          className="rounded-md border border-border bg-panel p-1.5 text-muted transition-colors hover:text-text disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
