"use client";

import { useEffect, useState } from "react";
import type { Architecture } from "@/core/evolution/deepdive";
import type { Dictionary } from "@/i18n/dictionaries";
import { KIND_VAR } from "./palette";

// Interactive 2D pipeline of any historical architecture: its layers as a flow
// of selectable nodes (input → output), themed by kind. Hover/click a node to
// inspect it in the detail strip; press Run to cascade activation through the
// pipeline. Complements (does not replace) the kept LayerStack list; selection
// is shared with the 3D view.

export function ArchDiagram2D({
  arch,
  dict,
  selected,
  onSelect,
}: {
  arch: Architecture;
  dict: Dictionary;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  const layers = arch.layers;
  const [hover, setHover] = useState<number | null>(null);
  const [play, setPlay] = useState<number | null>(null);
  const playing = play !== null;

  // Run: light each node in turn, then clear.
  useEffect(() => {
    if (play === null) return;
    if (play >= layers.length) {
      const done = setTimeout(() => setPlay(null), 480);
      return () => clearTimeout(done);
    }
    const next = setTimeout(() => setPlay((p) => (p === null ? null : p + 1)), 560);
    return () => clearTimeout(next);
  }, [play, layers.length]);

  const active = hover ?? selected;
  const detail = active !== null ? layers[active] : null;

  return (
    <div className="rounded-card border border-border bg-bg2 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{dict.explorer.pipelineTitle}</span>
        <button
          onClick={() => setPlay(playing ? null : 0)}
          className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors ${
            playing ? "bg-panel text-muted hover:text-text" : "bg-acc2 text-white"
          }`}
        >
          {playing ? dict.forward.stop : dict.forward.run}
        </button>
      </div>

      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {layers.map((l, i) => {
          const c = KIND_VAR[l.kind];
          const on = selected === i;
          const hot = hover === i;
          const litNow = playing && i === play;
          const litPast = playing && play !== null && i < play;
          const dim = playing && !litNow && !litPast;
          return (
            <div key={i} className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onSelect(on ? null : i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                aria-pressed={on}
                aria-label={`${l.label} — ${l.kind}`}
                className="flex min-w-[112px] flex-col items-start rounded-lg border bg-panel px-3 py-2 text-left transition-all duration-200"
                style={{
                  borderColor: on || hot || litNow ? c : "var(--border)",
                  background: on || litNow ? `color-mix(in oklab, ${c} 16%, transparent)` : undefined,
                  boxShadow: litNow ? `0 0 0 1px ${c}, 0 0 14px color-mix(in oklab, ${c} 55%, transparent)` : undefined,
                  opacity: dim ? 0.45 : 1,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} aria-hidden />
                  <span className="whitespace-nowrap font-mono text-[12px] text-text">{l.label}</span>
                </span>
                {l.note && <span className="mt-0.5 whitespace-nowrap font-mono text-[10px] text-dim">{l.note}</span>}
              </button>
              {i < layers.length - 1 && (
                <span
                  className="font-mono text-sm transition-colors"
                  style={{ color: litPast || litNow ? c : "var(--dim)" }}
                  aria-hidden
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* detail strip — selected/hovered node */}
      <div className="mt-2 min-h-[2.5rem] rounded-lg border border-border bg-panel px-3 py-2">
        {detail ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-[13px] font-bold" style={{ color: KIND_VAR[detail.kind] }}>
              {detail.label}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{detail.kind}</span>
            {detail.note && <span className="font-mono text-[11px] text-muted">· {detail.note}</span>}
            <span className="ml-auto font-mono text-[10px] text-dim">
              {(active ?? 0) + 1}/{layers.length}
            </span>
          </div>
        ) : (
          <span className="font-mono text-[11px] text-dim">{dict.explorer.selectHint}</span>
        )}
      </div>
    </div>
  );
}
