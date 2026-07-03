"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { MemoryInput } from "@/core/memory/estimate";
import type { Verdict } from "@/core/memory/verdict";
import { maxContextThatFits, bestQuantThatFits } from "@/core/memory/verdict";
import { quantById, type QuantId } from "@/core/memory/quant";
import { gib, contextLen as fmtCtx } from "@/core/shared/format";

const STATUS_CLASS = {
  fits: "text-success",
  tight: "text-warn",
  no: "text-danger",
} as const;

function tpl(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);
}

/** The big answer card: status, used/total, and one contextual hint line. */
export function VerdictCard({
  verdict,
  totalBytes,
  usable,
  input,
  quant,
  batch,
  gpuName,
  dict,
}: {
  verdict: Verdict;
  totalBytes: number;
  usable: number;
  input: MemoryInput;
  quant: QuantId;
  batch: number;
  gpuName: string;
  dict: Dictionary;
}) {
  const v = dict.calculator.verdict;

  // One actionable hint: headroom when it fits; otherwise the closest way in.
  let hint: string | null = null;
  if (verdict.status === "fits") {
    hint = tpl(v.headroom, { gb: gib(verdict.headroomBytes) });
  } else if (verdict.status === "no") {
    const smallerQuant = bestQuantThatFits(input, input.text.contextLen > 0 ? Math.min(8192, input.text.contextLen) : 0, batch, usable);
    const maxCtx = maxContextThatFits(input, quant, batch, usable);
    if (smallerQuant && smallerQuant !== quant) {
      hint = tpl(v.tryQuant, { quant: quantById(smallerQuant)?.label ?? smallerQuant });
    } else if (maxCtx) {
      hint = tpl(v.maxContext, { ctx: fmtCtx(maxCtx) });
    } else if (Number.isFinite(verdict.gpusNeeded)) {
      hint = tpl(v.multiGpu, { n: verdict.gpusNeeded, gpu: gpuName });
    }
  }

  return (
    <div className="rounded-card border border-border bg-panel p-5 elev">
      <div className={`font-display text-2xl font-bold ${STATUS_CLASS[verdict.status]}`}>
        {v[verdict.status]}
      </div>
      <div className="mt-1 font-mono text-sm text-muted">
        {tpl(v.usage, { used: gib(totalBytes), total: gib(usable) })}
      </div>
      {hint && <div className="mt-2 text-sm leading-relaxed text-text">{hint}</div>}
    </div>
  );
}
