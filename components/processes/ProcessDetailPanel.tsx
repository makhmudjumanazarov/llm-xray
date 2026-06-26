"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { ProcessMeta } from "@/core/processes/definitions";
import { BlockMath } from "@/components/learn/Katex";
import { ProcessDiagram } from "./ProcessDiagram";

type ProcessCopy = {
  title: string;
  tagline: string;
  beginner: string;
  expert: string;
  useCase: string;
  tradeoff: string;
};

function Fact({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg2 p-2.5" style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}>
      <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{label}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
    </div>
  );
}

export function ProcessDetailPanel({ dict, process }: { dict: Dictionary; process: ProcessMeta }) {
  const expert = true;
  const pr = dict.processes;
  const copy = (pr.steps as Record<string, ProcessCopy>)[process.id];
  const accentVar = `var(${process.accentToken})`;

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-display text-lg font-bold" style={{ color: accentVar }}>
          {copy.title}
        </h3>
        <span className="font-mono text-xs text-dim">{copy.tagline}</span>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-start">
        <ProcessDiagram id={process.id} accentVar={accentVar} />

        <div>
          <p className="text-sm leading-relaxed text-muted">{expert ? copy.expert : copy.beginner}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Fact label={pr.useCaseLabel} accent={accentVar}>
              {copy.useCase}
            </Fact>
            <Fact label={pr.tradeoffLabel}>{copy.tradeoff}</Fact>
          </div>
        </div>
      </div>

      {expert && (
        <div className="mt-3 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{pr.objectiveLabel}</div>
          <div className="overflow-x-auto rounded-lg border border-border bg-bg2 p-3 text-text">
            <BlockMath math={process.formulaKatex} />
          </div>
        </div>
      )}
    </div>
  );
}
