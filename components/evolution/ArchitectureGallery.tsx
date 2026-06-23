"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { EraId } from "@/core/evolution/timeline";
import { deepDive } from "@/core/evolution/deepdive";
import { LayerStack } from "./LayerStack";
import { ArchVizPanel } from "./arch/ArchVizPanel";

/** Architecture picker + the selected architecture's layer stack. */
export function ArchitectureGallery({
  eraId,
  dict,
  accentVar,
}: {
  eraId: EraId;
  dict: Dictionary;
  accentVar: string;
}) {
  const { architectures } = deepDive(eraId);
  const [selected, setSelected] = useState(0);
  const ev = dict.evolution;
  const eraCopy = (ev.eras as Record<string, { architectures?: Record<string, string> }>)[eraId];
  const blurbs = eraCopy.architectures ?? {};
  const active = architectures[selected] ?? architectures[0];

  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-dim">{ev.architecturesLabel}</div>

      {/* architecture chips */}
      <div className="flex flex-wrap gap-1.5">
        {architectures.map((a, i) => {
          const on = i === selected;
          return (
            <button
              key={a.id}
              onClick={() => setSelected(i)}
              aria-pressed={on}
              className={`flex items-baseline gap-1.5 rounded-lg border px-2.5 py-1.5 text-left transition-all duration-200 ${
                on ? "text-text" : "border-border bg-bg2 text-muted hover:border-border2 hover:text-text"
              }`}
              style={
                on
                  ? { borderColor: accentVar, background: `color-mix(in oklab, ${accentVar} 14%, transparent)` }
                  : undefined
              }
            >
              <span className="font-mono text-[12px] font-semibold">{a.name}</span>
              <span className="font-mono text-[10px] text-dim">{a.year}</span>
            </button>
          );
        })}
      </div>

      {/* selected architecture: blurb + layer stack */}
      <div className="mt-3">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[13px] font-bold" style={{ color: accentVar }}>
            {active.name}
          </span>
          <span className="font-mono text-[11px] text-dim">{active.year}</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-dim">· {ev.layersLabel}</span>
        </div>
        {blurbs[active.id] && <p className="mb-2.5 text-[13px] leading-relaxed text-muted">{blurbs[active.id]}</p>}
        <LayerStack arch={active} />
        {/* Interactive 2D / 3D explorer for the selected architecture (the list
            above is kept). Keyed by id so selection resets per architecture. */}
        <ArchVizPanel key={active.id} arch={active} dict={dict} />
      </div>
    </div>
  );
}
