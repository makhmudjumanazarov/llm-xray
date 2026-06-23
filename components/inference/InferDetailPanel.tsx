"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { InferStageMeta } from "@/core/inference/stages";
import type { SamplingState } from "@/core/inference/run";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { BlockMath } from "@/components/learn/Katex";
import { InferDiagram } from "./InferDiagram";

type InferCopy = { title: string; tagline: string; beginner: string; expert: string; shapes: string };

export function InferDetailPanel({
  dict,
  stage,
  prompt,
  tokens,
  sampling,
  setSampling,
}: {
  dict: Dictionary;
  stage: InferStageMeta;
  prompt: string;
  tokens: string[];
  sampling: SamplingState;
  setSampling: (s: SamplingState) => void;
}) {
  const expert = useExpertMode((s) => s.expert);
  const j = dict.inference;
  const copy = j.stages[stage.id] as unknown as InferCopy;
  const accentVar = `var(${stage.accentToken})`;

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-display text-lg font-bold" style={{ color: accentVar }}>
          {copy.title}
        </h3>
        <span className="font-mono text-xs text-dim">{copy.tagline}</span>
      </div>

      <div className="mt-3">
        <InferDiagram
          stage={stage}
          expert={expert}
          prompt={prompt}
          tokens={tokens}
          sampling={sampling}
          setSampling={setSampling}
          j={j}
        />
      </div>

      {!expert ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span
            className="mr-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: "color-mix(in oklab, var(--acc2) 16%, transparent)", color: "var(--acc)" }}
          >
            {j.analogyLabel}
          </span>
          {copy.beginner}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm leading-relaxed text-muted">{copy.expert}</p>
          <div className="font-mono text-[11px] text-dim">
            <span className="uppercase tracking-wide">{j.shapesLabel}:</span> <span className="text-muted">{copy.shapes}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{j.objectiveLabel}</div>
          <div className="overflow-x-auto rounded-lg border border-border bg-bg2 p-3 text-text">
            <BlockMath math={stage.formulaKatex} />
          </div>
        </div>
      )}
    </div>
  );
}
