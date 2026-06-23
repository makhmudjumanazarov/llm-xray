"use client";

import type { Architecture, LayerKind } from "@/core/evolution/deepdive";

// Layer category → design-system accent, kept in step with the model explorer's
// palette (components/explorer/Diagram2D.tsx) so the whole app reads as one.
const KIND_ACCENT: Record<LayerKind, string> = {
  input: "var(--dim)",
  embed: "var(--acc2)",
  conv: "var(--slide)",
  pool: "var(--proj)",
  norm: "var(--dim)",
  act: "var(--aud)",
  fc: "var(--acc)",
  recurrent: "var(--aud)",
  attention: "var(--acc2)",
  residual: "var(--full)",
  moe: "var(--aud)",
  op: "var(--proj)",
  output: "var(--cyan)",
};

/** Vertical, top-to-bottom layer stack for one historical architecture. */
export function LayerStack({ arch }: { arch: Architecture }) {
  return (
    <div className="rounded-card border border-border bg-bg2/50 p-3">
      <ol className="mx-auto flex max-w-sm flex-col items-stretch">
        {arch.layers.map((layer, i) => {
          const accent = KIND_ACCENT[layer.kind];
          const last = i === arch.layers.length - 1;
          return (
            <li key={`${layer.kind}-${i}-${layer.label}`} className="flex flex-col items-stretch">
              <div
                className="animate-rise flex items-center justify-between gap-2 rounded-lg border border-border bg-bg2 px-3 py-2"
                style={{ borderLeft: `3px solid ${accent}`, animationDelay: `${i * 45}ms` }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden />
                  <span className="truncate font-mono text-[12px] text-text">{layer.label}</span>
                </span>
                {layer.note && <span className="shrink-0 font-mono text-[10px] text-dim">{layer.note}</span>}
              </div>
              {!last && (
                <span aria-hidden className="flex h-3 items-center justify-center text-dim">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M5 0v8M2 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
