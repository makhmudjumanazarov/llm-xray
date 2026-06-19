"use client";

import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { decoderBlock, macroPipeline, type SubOp, type BlockGroup } from "@/core/model/blocks";

const GROUP_ACCENT: Record<BlockGroup["kind"], string> = {
  norm: "var(--dim)",
  attention: "var(--acc)",
  mlp: "var(--slide)",
  moe: "var(--aud)",
};

function OpPill({
  op,
  selected,
  onSelect,
}: {
  op: SubOp;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(op.id)}
      className={`rounded-lg border px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors ${
        selected
          ? "border-acc bg-acc2/20 text-text"
          : "border-border bg-bg2 text-muted hover:border-border2 hover:text-text"
      }`}
    >
      <div>{op.label}</div>
      {op.shape && <div className="mt-0.5 text-[10px] text-dim">[{op.shape.join("×")}]</div>}
    </button>
  );
}

/** GQA/MQA/MHA head grouping visual: query heads bucketed under shared KV heads. */
function HeadGrouping({ model }: { model: Model }) {
  const { numHeads, numKVHeads } = model.text;
  if (!numHeads) return null;
  const groupSize = Math.max(1, Math.round(numHeads / Math.max(1, numKVHeads)));
  const bars = Array.from({ length: numHeads }, (_, i) => i);
  return (
    <div className="mt-2 flex flex-wrap items-end gap-[3px]">
      {bars.map((i) => {
        const newGroup = i > 0 && i % groupSize === 0;
        return (
          <span
            key={i}
            className="inline-block h-4 w-1.5 rounded-sm bg-acc"
            style={{ marginLeft: newGroup ? 8 : 0, opacity: 0.5 + 0.5 * ((i % groupSize) === 0 ? 1 : 0.6) }}
          />
        );
      })}
      <span className="ml-2 font-mono text-[10px] text-dim">
        {numHeads} Q · {numKVHeads} KV
      </span>
    </div>
  );
}

function Arrow() {
  return <div className="my-1 text-center text-dim">↓</div>;
}

export function Diagram2D({
  model,
  dict,
  selected,
  onSelect,
}: {
  model: Model;
  dict: Dictionary;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = decoderBlock(model);
  const macro = macroPipeline(model);
  const stages = dict.explorer.stages as Record<string, string>;
  const groupTitles = dict.explorer.groups as Record<string, string>;

  return (
    <div>
      {/* Macro forward-pass pipeline */}
      <div className="mb-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-dim">
          {dict.explorer.pipelineTitle}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {macro.map((s, i) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <span
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  s.kind === "block"
                    ? "border-acc bg-acc2/15 font-semibold text-acc"
                    : "border-border bg-panel text-muted"
                }`}
              >
                {stages[s.labelKey]}
                {s.repeat ? <span className="ml-1 font-mono text-[10px] text-dim">×{s.repeat}</span> : null}
              </span>
              {i < macro.length - 1 && <span className="text-dim">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded decoder block */}
      <div className="rounded-card border border-border bg-panel/40 p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold text-text">{dict.explorer.blockTitle}</span>
          <span className="font-mono text-[11px] text-dim">
            {dict.explorer.repeated.replace("{n}", String(model.text.numLayers))}
          </span>
        </div>

        <div className="mx-auto max-w-2xl">
          {groups.map((g, gi) => (
            <div key={g.id}>
              <div
                className="rounded-card border bg-bg2 p-3"
                style={{ borderColor: "var(--border)", borderLeft: `3px solid ${GROUP_ACCENT[g.kind]}` }}
              >
                <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {groupTitles[g.titleKey]}
                  {g.kind === "moe" && model.text.moe && (
                    <span className="ml-2 text-aud">
                      {model.text.moe.numExperts} experts · top-{model.text.moe.topK}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.ops.map((op) => (
                    <OpPill key={op.id} op={op} selected={selected === op.id} onSelect={onSelect} />
                  ))}
                </div>
                {g.kind === "attention" && <HeadGrouping model={model} />}
              </div>
              {gi < groups.length - 1 && <Arrow />}
              {(g.id === "attn" || g.id === "mlp" || g.id === "moe") && (
                <div className="mb-1 text-center font-mono text-[10px] text-dim">{dict.explorer.residual}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
