import Link from "next/link";
import type { Model } from "@/core/model/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localePath } from "@/core/seo";
import { estimateMemory, memoryInputFrom, isCacheFree } from "@/core/memory/estimate";
import { quantById, type QuantId } from "@/core/memory/quant";
import { gpuById, usableBytes } from "@/core/memory/gpus";
import { verdictFor, type VerdictStatus } from "@/core/memory/verdict";
import { gib, contextLen as fmtCtx } from "@/core/shared/format";

// Three representative quants × three representative GPUs — enough to answer
// "can I run it?" at a glance, rendered server-side so the numbers are
// indexable HTML on every model page.
const QUANTS: QuantId[] = ["fp16", "q8_0", "q4_k_m"];
const GPU_IDS = ["rtx-3060", "rtx-4090", "a100-80"];

const CHIP: Record<VerdictStatus, string> = {
  fits: "bg-success/15 text-success",
  tight: "bg-warn/15 text-warn",
  no: "bg-danger/15 text-danger",
};
const MARK: Record<VerdictStatus, string> = { fits: "✓", tight: "~", no: "✕" };

/** Compact "will it run?" panel for a model page, linking to the full calculator. */
export function WillItRun({ model, locale, dict }: { model: Model; locale: Locale; dict: Dictionary }) {
  const c = dict.calculator;
  const input = memoryInputFrom(model);
  const ctx = isCacheFree(model.text) || model.text.contextLen <= 0 ? 0 : Math.min(8192, model.text.contextLen);
  const gpus = GPU_IDS.map((id) => gpuById(id)!);

  return (
    <div className="rounded-card border border-border bg-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-bold text-text">{c.embed.title}</h3>
        {ctx > 0 && <span className="font-mono text-[11px] text-dim">{c.embed.atContext.replace("{ctx}", fmtCtx(ctx))}</span>}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-dim">{c.embed.quant}</th>
              <th className="pb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-dim">{c.embed.memory}</th>
              {gpus.map((g) => (
                <th key={g.id} className="pb-2 text-center font-mono text-[11px] font-semibold uppercase tracking-wide text-dim">
                  {g.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUANTS.map((q) => {
              const est = estimateMemory(input, { quant: q, contextLen: ctx });
              return (
                <tr key={q} className="border-b border-border/50 last:border-0">
                  <td className="py-2 font-mono text-xs font-semibold text-text">{quantById(q)!.label}</td>
                  <td className="py-2 font-mono text-xs text-muted">{gib(est.totalBytes)}</td>
                  {gpus.map((g) => {
                    const status = verdictFor(est.totalBytes, usableBytes(g.vramGB, g.usableFraction)).status;
                    return (
                      <td key={g.id} className="py-2 text-center">
                        <span
                          title={c.verdict[status]}
                          className={`inline-block min-w-6 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${CHIP[status]}`}
                        >
                          {MARK[status]}
                          <span className="sr-only"> {c.verdict[status]}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Link
        href={`${localePath(locale, "/calculator")}?model=${model.slug}`}
        className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-acc no-underline transition-colors hover:text-acc-500"
      >
        {c.embed.cta} →
      </Link>
    </div>
  );
}
