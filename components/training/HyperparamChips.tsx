"use client";

/** Expert-only row of concrete per-stage hyperparameters (mono chips). */
export function HyperparamChips({ chips }: { chips: Record<string, string> }) {
  const items = Object.values(chips);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c, i) => (
        <span
          key={i}
          className="rounded border border-border bg-bg2 px-2 py-0.5 font-mono text-[11px] text-dim"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
