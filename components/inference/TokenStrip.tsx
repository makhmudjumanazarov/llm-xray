"use client";

import { useMounted } from "@/components/training/hooks";

/** The running token sequence: prompt tokens (muted) + generated tokens (accent),
 *  with a blinking caret. Shared by the tokenize and loop stages. */
export function TokenStrip({
  tokens,
  generated = [],
  promptLabel,
  generatedLabel,
  accentVar,
  caret = true,
}: {
  tokens: string[];
  generated?: string[];
  promptLabel: string;
  generatedLabel: string;
  accentVar: string;
  caret?: boolean;
}) {
  const mounted = useMounted();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        {tokens.map((t, i) => (
          <span
            key={`p${i}`}
            className="rounded bg-bg2 px-1.5 py-0.5 font-mono text-[11px] text-muted transition-opacity duration-300"
            style={{ opacity: mounted ? 1 : 0, transitionDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            {t}
          </span>
        ))}
        {generated.map((t, i) => (
          <span
            key={`g${i}`}
            className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-bg"
            style={{ background: accentVar }}
          >
            {t}
          </span>
        ))}
        {caret && (
          <span className="animate-pulse font-mono text-[11px]" style={{ color: accentVar }} aria-hidden="true">
            ▌
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[9px] text-dim">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-bg2" aria-hidden="true" />
          {promptLabel} · {tokens.length}
        </span>
        {generated.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: accentVar }} aria-hidden="true" />
            {generatedLabel} · {generated.length}
          </span>
        )}
      </div>
    </div>
  );
}
