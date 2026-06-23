"use client";

import { Play } from "@/components/ui/icons";

export function PromptBar({
  value,
  onChange,
  onRun,
  label,
  placeholder,
  runLabel,
  presets,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  label: string;
  placeholder: string;
  runLabel: string;
  presets: { p1: string; p2: string; p3: string };
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-dim">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          maxLength={120}
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg2 px-3 py-2 font-mono text-sm text-text placeholder:text-dim focus:border-acc focus:outline-none"
        />
        <button
          onClick={onRun}
          className="flex items-center gap-1.5 rounded-lg bg-acc-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-acc-600"
        >
          <Play size={12} />
          {runLabel}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[presets.p1, presets.p2, presets.p3].map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="rounded-full border border-border bg-panel px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-text"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
