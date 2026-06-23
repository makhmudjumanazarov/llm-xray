"use client";

import { useMounted } from "@/components/training/hooks";

export type Bar = { label: string; prob: number; logit?: number };

/** Shared next-token probability bars — used by the /learn softmax + sampling
 *  lessons and the inference "logits/sampling" stages. `keepMask` dims the
 *  candidates a top-k/top-p cut removed; the picked token gets the solid accent. */
export function LogitsBars({
  bars,
  keepMask,
  pickedIndex,
  accentVar = "var(--acc2)",
  showLogit = false,
}: {
  bars: Bar[];
  keepMask?: boolean[];
  pickedIndex?: number;
  accentVar?: string;
  showLogit?: boolean;
}) {
  const mounted = useMounted();
  const picked =
    pickedIndex ?? bars.reduce((best, b, i, arr) => (b.prob > arr[best].prob ? i : best), 0);

  return (
    <div className="space-y-1.5">
      {bars.map((b, i) => {
        const kept = !keepMask || keepMask[i];
        const isPicked = i === picked && kept;
        const fill = !kept
          ? "var(--acc-soft)"
          : isPicked
            ? accentVar
            : `color-mix(in oklab, ${accentVar} 50%, transparent)`;
        return (
          <div key={b.label + i} className="flex items-center gap-3">
            <span
              className="w-16 shrink-0 truncate text-right font-mono text-xs"
              style={{ color: isPicked ? "var(--text)" : "var(--muted)" }}
            >
              {b.label}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-bg2">
              <div
                className="h-full rounded transition-[width] duration-500 ease-out"
                style={{
                  width: mounted ? `${Math.round(b.prob * 100)}%` : "0%",
                  background: fill,
                  boxShadow: isPicked ? `0 0 8px color-mix(in oklab, ${accentVar} 55%, transparent)` : undefined,
                }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-text">
                {(b.prob * 100).toFixed(1)}%
              </span>
            </div>
            {showLogit && b.logit !== undefined && (
              <span className="w-12 shrink-0 font-mono text-[11px] text-dim">z={b.logit}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
