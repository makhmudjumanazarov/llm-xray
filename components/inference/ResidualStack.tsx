"use client";

import { useEffect, useState } from "react";
import { useLoopFlow } from "@/components/training/hooks";

/** A vertical residual stream: a token of information sweeps top→down through the
 *  N decoder layers (attention + MLP each). A KV-cache counter sits alongside. */
export function ResidualStack({
  numLayers,
  accentVar,
  kvSize,
  kvLabel,
  kvNote,
}: {
  numLayers: number;
  accentVar: string;
  kvSize: number;
  kvLabel: string;
  kvNote: string;
}) {
  const rows = Math.max(3, Math.min(numLayers || 8, 10));
  const [ref, animate] = useLoopFlow();
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setLit((l) => (l + 1) % rows), 280);
    return () => clearInterval(id);
  }, [animate, rows]);

  const active = animate ? lit : rows - 1;

  return (
    <div ref={ref} className="flex items-stretch gap-3">
      <div className="flex flex-1 flex-col gap-1">
        {Array.from({ length: rows }, (_, i) => {
          const state = i === active ? "on" : i < active ? "past" : "future";
          const opacity = state === "on" ? 1 : state === "past" ? 0.5 : 0.18;
          return (
            <div
              key={i}
              className="flex items-center gap-1 rounded border px-1.5 py-0.5 transition-[opacity,border-color,box-shadow] duration-300"
              style={{
                borderColor: state === "on" ? accentVar : "var(--border)",
                opacity,
                boxShadow: state === "on" ? `0 0 8px color-mix(in oklab, ${accentVar} 45%, transparent)` : undefined,
              }}
            >
              <span className="h-2 flex-1 rounded-sm" style={{ background: accentVar }} />
              <span className="font-mono text-[8px] text-dim">attn</span>
              <span className="font-mono text-[8px]" style={{ color: accentVar }}>
                +
              </span>
              <span className="font-mono text-[8px] text-dim">mlp</span>
            </div>
          );
        })}
        {numLayers > rows && <div className="text-center font-mono text-[9px] text-dim">×{numLayers}</div>}
      </div>
      <div className="flex w-24 shrink-0 flex-col justify-center rounded border border-border bg-bg2 p-2 text-center">
        <div className="font-mono text-[9px] uppercase tracking-wide text-dim">{kvLabel}</div>
        <div className="font-mono text-lg font-bold" style={{ color: accentVar }}>
          {kvSize}
        </div>
        <div className="mt-1 font-mono text-[8px] leading-tight text-dim">{kvNote}</div>
      </div>
    </div>
  );
}
