"use client";

/** Shared chosen ✓ / rejected ✕ preference pair — used by the RLHF step 1 and
 *  the DPO shortcut so the two method views never drift. */
export function PrefPairCard({
  accentVar,
  chosenLabel,
  rejectedLabel,
  chosenExample,
  rejectedExample,
}: {
  accentVar: string;
  chosenLabel: string;
  rejectedLabel: string;
  chosenExample: string;
  rejectedExample: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div
        className="rounded-md border px-2 py-1.5"
        style={{
          borderColor: accentVar,
          background: "color-mix(in oklab, var(--full) 12%, transparent)",
          boxShadow: `0 0 10px color-mix(in oklab, ${accentVar} 26%, transparent)`,
        }}
      >
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wide" style={{ color: accentVar }}>
          <span>A</span>
          <span>
            <span aria-hidden="true">✓</span> {chosenLabel}
          </span>
        </div>
        <div className="font-mono text-[10px] text-text">{chosenExample}</div>
      </div>
      <div className="rounded-md border border-border bg-bg2 px-2 py-1.5 opacity-55">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wide text-dim">
          <span>B</span>
          <span>
            <span aria-hidden="true">✕</span> {rejectedLabel}
          </span>
        </div>
        <div className="font-mono text-[10px] text-muted">{rejectedExample}</div>
      </div>
    </div>
  );
}
