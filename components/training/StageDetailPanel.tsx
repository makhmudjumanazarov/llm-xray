"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { type StageMeta, PPO_OBJECTIVE_KATEX } from "@/core/training/lifecycle";
import type { AlignmentMethod } from "@/core/training/loop";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BlockMath } from "@/components/learn/Katex";
import { StageDiagram } from "./StageDiagram";
import { HyperparamChips } from "./HyperparamChips";

type StageCopy = {
  title: string;
  tagline: string;
  analogy: string;
  beginner: string;
  expert: string;
  whatChanges: string;
  dataExample: string;
  lossLabel: string;
  extraExpertNote: string;
  chips: Record<string, string>;
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg2 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{label}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
    </div>
  );
}

export function StageDetailPanel({
  dict,
  stage,
  lora,
  setLora,
  method,
  setMethod,
}: {
  dict: Dictionary;
  stage: StageMeta;
  lora: boolean;
  setLora: (v: boolean) => void;
  method: AlignmentMethod;
  setMethod: (v: AlignmentMethod) => void;
}) {
  const expert = true;
  const j = dict.journey;
  const copy = j.stages[stage.id] as unknown as StageCopy;
  const accentVar = `var(${stage.accentToken})`;
  // Preference shows the DPO loss by default; switch to the PPO objective when RLHF.
  const formula = stage.id === "preference" && method === "rlhf" ? PPO_OBJECTIVE_KATEX : stage.formulaKatex;

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-display text-lg font-bold" style={{ color: accentVar }}>
          {copy.title}
        </h3>
        <span className="font-mono text-xs text-dim">{copy.tagline}</span>
      </div>

      {stage.id === "sft" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{j.fullFtVsLora.label}</span>
          <SegmentedControl
            ariaLabel={j.fullFtVsLora.label}
            value={lora ? "lora" : "full"}
            onChange={(val) => setLora(val === "lora")}
            options={[
              { value: "full", label: j.fullFtVsLora.full },
              { value: "lora", label: j.fullFtVsLora.lora },
            ]}
          />
        </div>
      )}

      {stage.id === "preference" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{j.method.label}</span>
          <SegmentedControl
            ariaLabel={j.method.label}
            value={method}
            onChange={(val) => setMethod(val as AlignmentMethod)}
            options={[
              { value: "rlhf", label: j.method.rlhf },
              { value: "dpo", label: j.method.dpo },
            ]}
          />
        </div>
      )}

      <div className="mt-3">
        <StageDiagram stage={stage} expert={expert} lora={lora} method={method} j={j} />
      </div>

      {!expert ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm leading-relaxed text-muted">
            <span
              className="mr-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "color-mix(in oklab, var(--acc2) 16%, transparent)", color: "var(--acc)" }}
            >
              {j.analogyLabel}
            </span>
            {copy.analogy}
          </p>
          <p className="text-sm leading-relaxed text-muted">{copy.beginner}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted">{copy.expert}</p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {expert && <Fact label={j.whatChangesLabel}>{copy.whatChanges}</Fact>}
        <Fact label={j.dataExampleLabel}>{copy.dataExample}</Fact>
      </div>

      <div className="mt-2 font-mono text-[11px] text-dim">
        <span className="uppercase tracking-wide">{j.objectiveLabel}:</span>{" "}
        <span className="text-muted">{copy.lossLabel}</span>
      </div>

      {expert && (
        <div className="mt-3 space-y-3">
          <HyperparamChips chips={copy.chips} />
          <p className="text-sm leading-relaxed text-muted">{copy.extraExpertNote}</p>
          <div className="overflow-x-auto rounded-lg border border-border bg-bg2 p-3 text-text">
            <BlockMath math={formula} />
          </div>
        </div>
      )}
    </div>
  );
}
