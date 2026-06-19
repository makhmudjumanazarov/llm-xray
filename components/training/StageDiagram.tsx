"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { StageMeta } from "@/core/training/lifecycle";
import type { AlignmentMethod } from "@/core/training/loop";
import { useCountUp } from "@/components/ui/useCountUp";
import { WeightGrid } from "./WeightGrid";
import { LossCurve } from "./LossCurve";
import { AdapterMatrix } from "./AdapterMatrix";
import { RlhfPipeline } from "./RlhfPipeline";
import { TrainingLoopStrip } from "./TrainingLoopStrip";
import { useMounted } from "./hooks";

export type DiagramLabels = {
  allTrainable: string;
  frozenBase: string;
  adapter: string;
  policy: string;
  reference: string;
  klTether: string;
  quantized: string;
  prompt: string;
  response: string;
  lossOnResponse: string;
  chosen: string;
  rejected: string;
  margin: string;
  predict: string;
  steps: string;
  sftPromptExample: string;
  sftResponseExample: string;
  prefChosenExample: string;
  prefRejectedExample: string;
};

const v = (token: string) => `var(${token})`;

/* ----------------------------- stage motifs ------------------------------ */

function PretrainMotif({ accentVar, dia }: { accentVar: string; dia: DiagramLabels }) {
  const mounted = useMounted();
  const context = ["The", "Eiffel", "Tower", "is", "in"];
  const cands = [
    { t: "Paris", p: 72 },
    { t: "Lyon", p: 18 },
    { t: "Rome", p: 10 },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        {context.map((tok) => (
          <span key={tok} className="rounded bg-bg2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
            {tok}
          </span>
        ))}
        <span className="px-0.5 text-dim">→</span>
        <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-bg" style={{ background: accentVar }}>
          ?
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {cands.map((c, i) => (
          <div key={c.t} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right font-mono text-[10px] text-dim">{c.t}</span>
            <div className="relative h-3 flex-1 overflow-hidden rounded bg-bg2">
              <div
                className="h-full rounded transition-[width] duration-700 ease-out"
                style={{ width: mounted ? `${c.p}%` : "0%", background: i === 0 ? accentVar : "var(--acc-soft)", transitionDelay: `${i * 90}ms` }}
              />
            </div>
            <span className="w-8 shrink-0 font-mono text-[10px] text-dim">{c.p}%</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 font-mono text-[10px] text-dim">{dia.predict}</div>
    </div>
  );
}

function SftMotif({ accentVar, dia }: { accentVar: string; dia: DiagramLabels }) {
  const mounted = useMounted();
  return (
    <div className="space-y-1.5">
      <div className="rounded-md border border-border bg-bg2 px-2 py-1.5">
        <div className="font-mono text-[9px] uppercase tracking-wide text-dim">{dia.prompt}</div>
        <div className="font-mono text-[11px] text-dim">{dia.sftPromptExample}</div>
      </div>
      <div
        className="relative overflow-hidden rounded-md border px-2 py-1.5"
        style={{ borderColor: accentVar, background: "color-mix(in oklab, var(--aud) 12%, transparent)" }}
      >
        <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: accentVar }}>
          {dia.response}
        </div>
        <div className="font-mono text-[11px] text-text">{dia.sftResponseExample}</div>
        <span
          className="pointer-events-none absolute inset-y-0 w-1/3 transition-[left] duration-1000 ease-out"
          style={{
            left: mounted ? "100%" : "-33%",
            background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--aud) 38%, transparent), transparent)",
          }}
        />
      </div>
      <div className="font-mono text-[10px]" style={{ color: accentVar }}>
        ↑ {dia.lossOnResponse}
      </div>
    </div>
  );
}

const BENCHES = [
  { label: "MMLU", v: 74 },
  { label: "GSM8K", v: 85 },
  { label: "HumanEval", v: 73 },
  { label: "IFEval", v: 80 },
];

function BenchBar({ label, value, accentVar }: { label: string; value: number; accentVar: string }) {
  const mounted = useMounted();
  const n = useCountUp(value, 1100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-right font-mono text-[10px] text-dim">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded bg-bg2">
        <div className="h-full rounded transition-[width] duration-1000 ease-out" style={{ width: mounted ? `${value}%` : "0%", background: accentVar }} />
      </div>
      <span className="w-8 shrink-0 font-mono text-[10px] text-dim">{Math.round(n)}</span>
    </div>
  );
}

function EvalMotif({ accentVar }: { accentVar: string }) {
  return (
    <div className="space-y-1">
      {BENCHES.map((b) => (
        <BenchBar key={b.label} label={b.label} value={b.v} accentVar={accentVar} />
      ))}
    </div>
  );
}

function WeightLegend({ legend }: { legend: Dictionary["journey"]["legend"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-dim">
        <span aria-hidden="true">{legend.frozenIcon}</span>
        {legend.frozen}
      </span>
      <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]" style={{ color: "var(--aud)" }}>
        <span aria-hidden="true">{legend.trainIcon}</span>
        {legend.trainable}
      </span>
    </div>
  );
}

/* ------------------------------ composition ------------------------------ */

export function StageDiagram({
  stage,
  expert,
  lora,
  method,
  j,
}: {
  stage: StageMeta;
  expert: boolean;
  lora: boolean;
  method: AlignmentMethod;
  j: Dictionary["journey"];
}) {
  const accentVar = v(stage.accentToken);
  const dia = j.diagram as DiagramLabels;
  const lossAxisLabel = (j.lossAxis as Record<string, string>)[stage.id];
  const isSft = stage.id === "sft";

  const motif =
    stage.id === "pretraining" ? (
      <PretrainMotif accentVar={accentVar} dia={dia} />
    ) : stage.id === "sft" ? (
      <SftMotif accentVar={accentVar} dia={dia} />
    ) : stage.id === "preference" ? (
      <RlhfPipeline
        method={method}
        expert={expert}
        rlhf={j.rlhf}
        dpo={j.dpo}
        legend={j.legend}
        pair={{ chosen: dia.chosen, rejected: dia.rejected, chosenExample: dia.prefChosenExample, rejectedExample: dia.prefRejectedExample }}
      />
    ) : (
      <EvalMotif accentVar={accentVar} />
    );

  const weightLabels = {
    allTrainable: dia.allTrainable,
    frozenBase: dia.frozenBase,
    adapter: dia.adapter,
    policy: dia.policy,
    reference: dia.reference,
    quantized: dia.quantized,
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-panel/40 p-3">
      <TrainingLoopStrip stage={stage} expert={expert} lora={lora} labels={j.loop} legend={j.legend} />

      {expert ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-3">
            {motif}
            {isSft && <AdapterMatrix lora={lora} expert labels={j.lora} legend={j.legend} />}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="space-y-2">
              <WeightLegend legend={j.legend} />
              <WeightGrid stage={stage.id} accentVar={accentVar} lora={lora} labels={weightLabels} />
            </div>
            {stage.id !== "eval" && (
              <LossCurve stage={stage.id} accentVar={accentVar} axisLabel={lossAxisLabel} stepsLabel={dia.steps} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {motif}
          {isSft && <AdapterMatrix lora={lora} expert={false} labels={j.lora} legend={j.legend} />}
        </div>
      )}
    </div>
  );
}
