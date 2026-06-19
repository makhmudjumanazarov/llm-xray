"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { StageMeta } from "@/core/training/lifecycle";
import { LOOP_NODES, loopForStage, type LoopNodeId } from "@/core/training/loop";
import { useLoopFlow } from "./hooks";

type LoopLabels = Dictionary["journey"]["loop"];
type Legend = Dictionary["journey"]["legend"];

/**
 * The universal training step, shown for every stage in BOTH modes — the
 * beginner-visible answer to "what is training?". Data → forward → predict-vs-
 * target → loss → backprop+update, with a forward token and a backward gradient
 * token. Stage-aware lit stations; eval breaks the loop (forward only, frozen).
 */
export function TrainingLoopStrip({
  stage,
  expert,
  lora,
  labels,
  legend,
}: {
  stage: StageMeta;
  expert: boolean;
  lora: boolean;
  labels: LoopLabels;
  legend: Legend;
}) {
  const [ref, animate] = useLoopFlow();
  const loop = loopForStage(stage.id);
  const litSet = new Set(loop.lit);
  const accentVar = `var(${stage.accentToken})`;
  const frozen = loop.frozen;

  const primary = (node: LoopNodeId) =>
    frozen && node === "loss" ? labels.evalScore : (expert ? labels.expert : labels.beginner)[node];

  const micro = (node: LoopNodeId): string | null => {
    if (node === "update" && !frozen) {
      if (stage.id === "pretraining") return labels.allWeights;
      if (stage.id === "sft") return lora ? labels.adapterOnly : labels.allWeights;
      if (stage.id === "preference") return labels.rewardKl;
    }
    if (node === "loss" && stage.id === "sft") return labels.responseOnly;
    return null;
  };

  const disabled = (node: LoopNodeId) => frozen && node === "update";

  return (
    <div ref={ref} className="rounded-lg border border-border bg-bg2/60 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: accentVar }} aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold text-muted">{labels.title}</span>
        </div>
        <span
          className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide"
          style={frozen ? { borderColor: "var(--border)", color: "var(--dim)" } : { borderColor: accentVar, color: accentVar }}
        >
          {frozen ? (
            <>
              <span aria-hidden="true">{legend.frozenIcon} </span>
              {labels.engineOff}
            </>
          ) : (
            labels.engineOn
          )}
        </span>
      </div>

      <div className="relative px-1 pt-2">
        {animate && (
          <span
            className="animate-loop-flow pointer-events-none absolute top-0 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
            style={{ background: "var(--acc2)", boxShadow: "0 0 6px var(--acc2)" }}
            aria-hidden="true"
          />
        )}
        <div className="flex flex-wrap items-stretch gap-x-1 gap-y-1.5">
          {LOOP_NODES.map((node, i) => {
            const lit = litSet.has(node) && !disabled(node);
            const dis = disabled(node);
            const m = micro(node);
            return (
              <div key={node} className="flex items-stretch gap-x-1">
                <div
                  className="flex min-w-0 flex-col rounded-md border px-1.5 py-1 transition-[border-color,box-shadow] duration-300"
                  style={{
                    borderColor: lit ? accentVar : "var(--border)",
                    background: "var(--bg2)",
                    boxShadow: lit ? `0 0 8px color-mix(in oklab, ${accentVar} 45%, transparent)` : undefined,
                    opacity: dis ? 0.4 : 1,
                  }}
                >
                  <span
                    className="truncate font-mono text-[10px]"
                    style={{ color: lit ? "var(--text)" : "var(--muted)", textDecoration: dis ? "line-through" : undefined }}
                  >
                    {primary(node)}
                  </span>
                  {m && <span className="mt-0.5 truncate font-mono text-[9px] text-dim">{m}</span>}
                  {dis && <span className="sr-only">{labels.frozenStamp}</span>}
                </div>
                {i < LOOP_NODES.length - 1 && (
                  <span className="self-center text-[10px] text-dim" aria-hidden="true">→</span>
                )}
              </div>
            );
          })}
          {!frozen && (
            <span className="self-center pl-1 font-mono text-[9px]" style={{ color: accentVar }} aria-hidden="true">
              ↺ {labels.repeat}
            </span>
          )}
        </div>

        {!frozen && (
          <div className="relative mt-1.5 h-3">
            <div
              className="absolute inset-x-1 top-1 h-px"
              style={{ background: "color-mix(in oklab, var(--acc2) 35%, transparent)" }}
              aria-hidden="true"
            />
            {animate && (
              <span
                className="animate-loop-flow-rev pointer-events-none absolute top-1 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "var(--acc2)", boxShadow: "0 0 6px var(--acc2)" }}
                aria-hidden="true"
              />
            )}
            {expert && (
              <span className="absolute right-1 -top-0.5 font-mono text-[9px]" style={{ color: "var(--acc)" }}>
                {labels.gradientLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-1 space-y-0.5">
        {frozen && <div className="font-mono text-[10px] text-muted">{labels.evalNote}</div>}
        <div className="font-mono text-[10px] leading-relaxed text-dim">{labels.perStage[stage.id]}</div>
      </div>
    </div>
  );
}
