"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { MemoryEstimate } from "@/core/memory/estimate";
import { gib } from "@/core/shared/format";

const PARTS = [
  { key: "weightsBytes", label: "weights", color: "var(--acc2)" },
  { key: "kvBytes", label: "kv", color: "var(--cyan)" },
  { key: "overheadBytes", label: "overhead", color: "var(--border2)" },
] as const;

/** Stacked weights / KV / overhead bar with a legend. */
export function MemoryBar({ estimate, dict }: { estimate: MemoryEstimate; dict: Dictionary }) {
  const br = dict.calculator.breakdown;
  const total = estimate.totalBytes || 1;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wide text-dim">{br.title}</div>
        <div className="font-mono text-xs font-semibold text-text">
          {br.total}: {gib(estimate.totalBytes)}
        </div>
      </div>
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full border border-border bg-bg2">
        {PARTS.map((p) =>
          estimate[p.key] > 0 ? (
            <div
              key={p.key}
              style={{ width: `${(estimate[p.key] / total) * 100}%`, background: p.color }}
              className="h-full"
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {PARTS.map((p) => (
          <div key={p.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-[12px] text-muted">{br[p.label]}</span>
            <span className="font-mono text-[12px] text-text">{gib(estimate[p.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
