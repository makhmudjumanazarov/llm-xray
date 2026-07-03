"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { GPU_PRESETS, usableBytes, type GpuVendor } from "@/core/memory/gpus";
import { verdictFor, type VerdictStatus } from "@/core/memory/verdict";

const CHIP: Record<VerdictStatus, string> = {
  fits: "bg-success/15 text-success",
  tight: "bg-warn/15 text-warn",
  no: "bg-danger/15 text-danger",
};
// Compact marks keep the GPU names readable inside the tiles.
const MARK: Record<VerdictStatus, string> = { fits: "✓", tight: "~", no: "✕" };

const VENDORS: GpuVendor[] = ["consumer", "datacenter", "apple"];

/** Every preset GPU at the current settings; clicking a tile selects it. */
export function GpuMatrix({
  totalBytes,
  selectedId,
  onSelect,
  dict,
}: {
  totalBytes: number;
  selectedId: string;
  onSelect: (id: string) => void;
  dict: Dictionary;
}) {
  const c = dict.calculator;
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wide text-dim">{c.matrix.title}</div>
      {VENDORS.map((vendor) => (
        <div key={vendor} className="mt-3">
          <div className="mb-1.5 text-[12px] font-semibold text-muted">{c.gpuGroups[vendor]}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GPU_PRESETS.filter((g) => g.vendor === vendor).map((g) => {
              const status = verdictFor(totalBytes, usableBytes(g.vramGB, g.usableFraction)).status;
              const active = g.id === selectedId;
              return (
                <button
                  key={g.id}
                  onClick={() => onSelect(g.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                    active ? "border-acc2 bg-acc2/10" : "border-border bg-panel hover:border-border2"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text">{g.name}</span>
                  <span
                    title={c.verdict[status]}
                    className={`inline-block shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${CHIP[status]}`}
                  >
                    {MARK[status]}
                    <span className="sr-only"> {c.verdict[status]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
