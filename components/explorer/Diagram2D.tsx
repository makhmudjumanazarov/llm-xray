"use client";

import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  decoderBlock,
  macroPipeline,
  layerColorKind,
  type SubOp,
  type BlockGroup,
  type MacroStage,
} from "@/core/model/blocks";
import { compactNumber } from "@/core/shared/format";

// Color a group/op maps onto — kept in sync with Scene3D + DetailPanel so 2D/3D
// read as one design language.
const GROUP_ACCENT: Record<BlockGroup["kind"], string> = {
  norm: "var(--dim)",
  attention: "var(--acc)",
  mlp: "var(--slide)",
  moe: "var(--aud)",
};

const OP_ACCENT: Record<SubOp["kind"], string> = {
  norm: "var(--dim)",
  qkv: "var(--acc)",
  sdpa: "var(--proj)",
  out: "var(--acc2)",
  gate: "var(--slide)",
  up: "var(--slide)",
  down: "var(--slide)",
  router: "var(--aud)",
  expert: "var(--aud)",
};

const STAGE_ACCENT: Partial<Record<MacroStage["kind"], string>> = {
  embed: "var(--acc2)",
  encoder: "var(--vis)",
  projector: "var(--proj)",
  norm: "var(--dim)",
  logits: "var(--proj)",
  sample: "var(--acc2)",
};

function numel(shape?: number[]): number {
  return shape ? shape.reduce((a, b) => a * b, 1) : 0;
}

/** A norm paired with the sublayer it precedes — the unit a residual wraps. */
type ResidualUnit = { norm: BlockGroup | null; sublayer: BlockGroup };

function toResidualUnits(groups: BlockGroup[]): ResidualUnit[] {
  const units: ResidualUnit[] = [];
  let pendingNorm: BlockGroup | null = null;
  for (const g of groups) {
    if (g.kind === "norm") pendingNorm = g;
    else {
      units.push({ norm: pendingNorm, sublayer: g });
      pendingNorm = null;
    }
  }
  return units;
}

/** Per-layer attention color, mirroring Scene3D's layerColor in CSS-var terms. */
function layerCssColor(model: Model, i: number): string {
  const k = layerColorKind(model, i);
  if (k === "full") return "var(--full)";
  if (k === "sliding") return "var(--slide)";
  switch (model.text.attentionType) {
    case "mla":
      return "var(--proj)";
    case "mqa":
      return "var(--slide)";
    default:
      return "var(--acc2)";
  }
}

/* ------------------------------------------------------------------ */
/* Macro forward pass — a polished "subway" of the whole token path.    */
/* ------------------------------------------------------------------ */

function MacroPipeline({ model, dict }: { model: Model; dict: Dictionary }) {
  const macro = macroPipeline(model);
  const stages = dict.explorer.stages as Record<string, string>;

  return (
    <div className="mb-7">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wide text-dim">
        {dict.explorer.pipelineTitle}
      </div>
      <div className="flex flex-wrap items-stretch gap-1.5">
        {macro.map((s, i) => {
          const isBlock = s.kind === "block";
          const accent = isBlock ? "var(--acc2)" : STAGE_ACCENT[s.kind] ?? "var(--border2)";
          return (
            <div key={s.id} className="flex items-stretch gap-1.5">
              <div
                className={`group relative flex flex-col justify-center rounded-xl border px-3 py-2 transition-all duration-200 ${
                  isBlock
                    ? "border-acc2/60 bg-acc2/10 shadow-[0_0_0_1px_var(--acc-ring),0_8px_24px_-12px_var(--acc2)]"
                    : "border-border bg-panel/70 hover:border-border2 hover:bg-panel"
                }`}
                style={{ borderTop: `2px solid ${accent}` }}
              >
                <span
                  className={`text-xs font-semibold leading-tight ${isBlock ? "text-acc" : "text-text"}`}
                >
                  {stages[s.labelKey]}
                </span>
                {s.repeat ? (
                  <span className="mt-0.5 font-mono text-[10px] text-dim">
                    {dict.explorer.repeated.replace("{n}", String(s.repeat))}
                  </span>
                ) : null}
              </div>
              {i < macro.length - 1 && (
                <span aria-hidden className="flex items-center text-border2">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <path d="M0 5h12" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 1.5 14.5 5 10 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layer map — every layer as a segment, colored by attention kind.     */
/* ------------------------------------------------------------------ */

function LayerMap({ model, dict }: { model: Model; dict: Dictionary }) {
  const n = model.text.numLayers;
  const hasTypes = !!model.text.layerTypes?.length;
  if (!n) return null;
  const segs = Array.from({ length: n }, (_, i) => i);

  return (
    <div className="mb-6 rounded-card border border-border bg-panel/40 p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-dim">
          {dict.explorer.layerMap}
          <span className="ml-2 text-muted">{dict.explorer.repeated.replace("{n}", String(n))}</span>
        </span>
        {hasTypes && (
          <div className="flex items-center gap-3 font-mono text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--slide)" }} />
              {dict.explorer.sliding}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--full)" }} />
              {dict.explorer.full}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-[2px]">
        {segs.map((i) => {
          const kind = layerColorKind(model, i);
          const full = kind === "full";
          return (
            <span
              key={i}
              title={`L${i}${hasTypes ? ` · ${full ? dict.explorer.full : dict.explorer.sliding}` : ""}`}
              className="group relative flex-1 rounded-sm transition-all duration-150 hover:scale-y-110"
              style={{
                height: full ? 26 : 18,
                minWidth: 3,
                background: layerCssColor(model, i),
                opacity: full ? 1 : 0.78,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Op tile — label + proportional param bar.                            */
/* ------------------------------------------------------------------ */

function OpTile({
  op,
  selected,
  onSelect,
  maxParams,
  paramsLabel,
}: {
  op: SubOp;
  selected: boolean;
  onSelect: (id: string) => void;
  maxParams: number;
  paramsLabel: string;
}) {
  const p = numel(op.shape);
  const accent = OP_ACCENT[op.kind];
  // Log-scaled so the embedding-sized projections don't dwarf the rest.
  const barPct = p > 0 && maxParams > 0 ? Math.max(8, (100 * Math.log(p + 1)) / Math.log(maxParams + 1)) : 0;

  return (
    <button
      onClick={() => onSelect(op.id)}
      aria-pressed={selected}
      className={`group relative min-w-[112px] flex-1 overflow-hidden rounded-lg border px-2.5 py-2 text-left transition-all duration-200 ${
        selected
          ? "border-acc2 bg-acc2/15 shadow-[0_0_0_1px_var(--acc-ring)]"
          : "border-border bg-bg2 hover:-translate-y-0.5 hover:border-border2"
      }`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className={`font-mono text-[11px] leading-tight ${selected ? "text-text" : "text-muted group-hover:text-text"}`}>
        {op.label}
      </div>
      {op.shape ? (
        <>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${barPct}%`, background: accent, opacity: selected ? 1 : 0.7 }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[9.5px] text-dim">
            <span>[{op.shape.join("×")}]</span>
            <span>
              {compactNumber(p)} {paramsLabel}
            </span>
          </div>
        </>
      ) : (
        <div className="mt-1 font-mono text-[9.5px] italic text-dim">softmax · 0 params</div>
      )}
    </button>
  );
}

/** GQA/MQA/MHA head grouping: query heads bucketed under shared KV heads. */
function HeadGrouping({ model }: { model: Model }) {
  const { numHeads, numKVHeads } = model.text;
  if (!numHeads) return null;
  const groupSize = Math.max(1, Math.round(numHeads / Math.max(1, numKVHeads)));
  const bars = Array.from({ length: numHeads }, (_, i) => i);
  return (
    <div className="mt-2.5 flex flex-wrap items-end gap-[3px] rounded-md bg-bg/40 px-2 py-1.5">
      {bars.map((i) => {
        const newGroup = i > 0 && i % groupSize === 0;
        const isKvLead = i % groupSize === 0;
        return (
          <span
            key={i}
            className="inline-block w-1.5 rounded-sm bg-acc transition-all"
            style={{
              height: isKvLead ? 18 : 13,
              marginLeft: newGroup ? 9 : 0,
              opacity: isKvLead ? 1 : 0.55,
            }}
          />
        );
      })}
      <span className="ml-2 font-mono text-[10px] text-dim">
        {numHeads} Q · {numKVHeads} KV
      </span>
    </div>
  );
}

/** Expert pool fan-out: numExperts cells, the top-k routed ones lit. */
function ExpertFanout({ model }: { model: Model }) {
  const moe = model.text.moe;
  if (!moe) return null;
  const cap = 32;
  const shown = Math.min(moe.numExperts, cap);
  const cells = Array.from({ length: shown }, (_, i) => i);
  return (
    <div className="mt-2.5 rounded-md bg-bg/40 px-2 py-1.5">
      <div className="flex flex-wrap gap-[3px]">
        {cells.map((i) => {
          const routed = i < moe.topK;
          return (
            <span
              key={i}
              className="h-3 w-3 rounded-[3px] transition-all"
              style={{
                background: routed ? "var(--aud)" : "var(--border2)",
                opacity: routed ? 1 : 0.5,
                boxShadow: routed ? "0 0 6px var(--aud)" : "none",
              }}
            />
          );
        })}
        {moe.numExperts > cap && (
          <span className="ml-1 font-mono text-[10px] text-dim">+{moe.numExperts - cap}</span>
        )}
      </div>
      <div className="mt-1 font-mono text-[10px] text-dim">
        {moe.numExperts} experts · top-{moe.topK}
      </div>
    </div>
  );
}

function SublayerCard({
  group,
  model,
  dict,
  selected,
  onSelect,
  maxParams,
}: {
  group: BlockGroup;
  model: Model;
  dict: Dictionary;
  selected: string | null;
  onSelect: (id: string) => void;
  maxParams: number;
}) {
  const groupTitles = dict.explorer.groups as Record<string, string>;
  const ops = dict.ops as Record<string, string>;
  return (
    <div
      className="rounded-card border border-border bg-bg2/70 p-3"
      style={{ borderLeft: `3px solid ${GROUP_ACCENT[group.kind]}` }}
    >
      <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted">
        {groupTitles[group.titleKey]}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {group.ops.map((op) => (
          <OpTile
            key={op.id}
            op={op}
            selected={selected === op.id}
            onSelect={onSelect}
            maxParams={maxParams}
            paramsLabel={ops.params}
          />
        ))}
      </div>
      {group.kind === "attention" && <HeadGrouping model={model} />}
      {group.kind === "moe" && <ExpertFanout model={model} />}
    </div>
  );
}

/** A norm → sublayer pair, wrapped by a residual that merges at a ⊕ node. */
function ResidualUnitView({
  unit,
  model,
  dict,
  selected,
  onSelect,
  maxParams,
}: {
  unit: ResidualUnit;
  model: Model;
  dict: Dictionary;
  selected: string | null;
  onSelect: (id: string) => void;
  maxParams: number;
}) {
  const groupTitles = dict.explorer.groups as Record<string, string>;
  return (
    <div className="relative pl-16">
      {/* tap off the residual stream (enters the sublayer branch) */}
      <span aria-hidden className="pointer-events-none absolute left-7 top-6 h-px w-9 bg-border2" />
      <span
        aria-hidden
        className="pointer-events-none absolute left-7 top-6 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border2"
      />

      <div className="space-y-1.5">
        {unit.norm && (
          <div
            className="rounded-card border border-border bg-bg2/70 px-3 py-2"
            style={{ borderLeft: `3px solid ${GROUP_ACCENT.norm}` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted">
                {groupTitles[unit.norm.titleKey]}
              </span>
              <button
                onClick={() => onSelect(unit.norm!.ops[0].id)}
                aria-pressed={selected === unit.norm.ops[0].id}
                className={`rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                  selected === unit.norm.ops[0].id
                    ? "border-acc2 bg-acc2/15 text-text"
                    : "border-border bg-bg2 text-dim hover:border-border2 hover:text-text"
                }`}
              >
                {unit.norm.ops[0].label}
                {unit.norm.ops[0].shape ? ` · [${unit.norm.ops[0].shape.join("×")}]` : ""}
              </button>
            </div>
          </div>
        )}

        <div aria-hidden className="flex justify-center text-dim">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 0v9M2.5 6 6 10 9.5 6" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </div>

        <SublayerCard
          group={unit.sublayer}
          model={model}
          dict={dict}
          selected={selected}
          onSelect={onSelect}
          maxParams={maxParams}
        />
      </div>

      {/* merge back into the residual stream */}
      <span aria-hidden className="pointer-events-none absolute bottom-6 left-7 h-px w-9 bg-acc2/70" />
      <span
        aria-hidden
        title={dict.explorer.residual}
        className="absolute bottom-6 left-7 flex h-5 w-5 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-acc2/70 bg-bg font-mono text-[11px] leading-none text-acc"
      >
        +
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The residual-stream view of one decoder block.                       */
/* ------------------------------------------------------------------ */

function DecoderBlock({
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
  const units = toResidualUnits(groups);
  // Cheap to recompute; the block has a handful of ops.
  const maxParams = Math.max(1, ...groups.flatMap((g) => g.ops.map((o) => numel(o.shape))));

  return (
    <div className="rounded-card border border-border bg-panel/40 p-4 md:p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-mono text-sm font-bold text-text">{dict.explorer.blockTitle}</span>
        <span className="font-mono text-[11px] text-dim">
          {dict.explorer.repeated.replace("{n}", String(model.text.numLayers))}
        </span>
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* the residual stream itself — a living spine the sublayers branch off */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-7 top-0 w-[3px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in oklab, var(--acc2) 35%, transparent), var(--acc2) 22%, var(--proj) 78%, color-mix(in oklab, var(--proj) 35%, transparent))",
          }}
        />
        {/* a packet of activation falling down the stream */}
        <div
          aria-hidden
          className="animate-flow-down pointer-events-none absolute left-7 h-7 w-[7px] -translate-x-1/2 rounded-full"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--cyan), transparent)",
            boxShadow: "0 0 12px 2px color-mix(in oklab, var(--cyan) 70%, transparent)",
          }}
        />
        <span className="sr-only">{dict.explorer.residualStream}</span>

        <div className="relative z-10 space-y-2">
          {/* input endpoint */}
          <div className="relative flex items-center gap-3 pl-16">
            <span className="animate-node-pulse absolute left-7 top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-acc2 bg-bg">
              <span className="h-1.5 w-1.5 rounded-full bg-acc2" />
            </span>
            <span className="font-mono text-[11px] text-dim">
              <span className="text-muted">{dict.explorer.residualStream}</span> · h⁽⁰⁾ ∈ ℝ^
              {model.text.hiddenSize}
            </span>
          </div>

          {units.map((unit) => (
            <ResidualUnitView
              key={unit.sublayer.id}
              unit={unit}
              model={model}
              dict={dict}
              selected={selected}
              onSelect={onSelect}
              maxParams={maxParams}
            />
          ))}

          {/* output endpoint */}
          <div className="relative flex items-center gap-3 pl-16">
            <span className="absolute left-7 top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-proj bg-bg">
              <span className="h-1.5 w-1.5 rounded-full bg-proj" />
            </span>
            <span className="font-mono text-[11px] text-dim">
              h⁽¹⁾ → <span className="text-muted">{dict.explorer.stages.decoderBlock}</span> +1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

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
  return (
    <div>
      <MacroPipeline model={model} dict={dict} />
      <LayerMap model={model} dict={dict} />
      <DecoderBlock model={model} dict={dict} selected={selected} onSelect={onSelect} />
    </div>
  );
}
