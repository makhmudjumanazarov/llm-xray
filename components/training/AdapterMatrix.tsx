"use client";

import type { Dictionary } from "@/i18n/dictionaries";

type LoraLabels = Dictionary["journey"]["lora"];
type Legend = Dictionary["journey"]["legend"];

const FROZEN_HATCH =
  "repeating-linear-gradient(45deg, color-mix(in oklab, var(--dim) 50%, transparent) 0 1.5px, transparent 1.5px 5px)";

function Tile({
  label,
  w,
  h,
  variant,
  icon,
}: {
  label: string;
  w: number;
  h: number;
  variant: "frozen" | "trainable";
  icon: string;
}) {
  const frozen = variant === "frozen";
  return (
    <span
      className="relative flex items-center justify-center rounded font-mono text-[10px] font-semibold"
      style={{
        width: w,
        height: h,
        color: frozen ? "var(--dim)" : "var(--bg)",
        background: frozen ? FROZEN_HATCH : "var(--aud)",
        border: `1px solid ${frozen ? "var(--border2)" : "var(--aud)"}`,
        boxShadow: frozen ? undefined : "0 0 8px color-mix(in oklab, var(--aud) 55%, transparent)",
      }}
    >
      {label}
      <span className="absolute -right-1 -top-1.5 text-[9px]" aria-hidden="true">
        {icon}
      </span>
    </span>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return <span className="self-center font-mono text-xs text-dim">{children}</span>;
}

/** Structural view of LoRA vs full fine-tuning: a big frozen base W₀ plus a
 *  deliberately tiny trainable B·A adapter (area contrast = "~1% trains"). */
export function AdapterMatrix({
  lora,
  expert,
  labels,
  legend,
}: {
  lora: boolean;
  expert: boolean;
  labels: LoraLabels;
  legend: Legend;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg2 p-2.5">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-dim">
          <span aria-hidden="true">{legend.frozenIcon}</span>
          {legend.frozen}
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]" style={{ color: "var(--aud)" }}>
          <span aria-hidden="true">{legend.trainIcon}</span>
          {legend.trainable}
        </span>
      </div>

      {lora ? (
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <div className="flex flex-col items-center gap-1">
            <Tile label="W₀" w={46} h={46} variant="frozen" icon={legend.frozenIcon} />
            <span className="font-mono text-[9px] text-dim">{labels.frozenBase}</span>
          </div>
          <Op>+</Op>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-1">
              <Tile label="B" w={12} h={34} variant="trainable" icon={legend.trainIcon} />
              <Tile label="A" w={34} h={12} variant="trainable" icon={legend.trainIcon} />
            </div>
            <span className="font-mono text-[9px]" style={{ color: "var(--aud)" }}>
              {labels.adapter} · {labels.rankLabel}
            </span>
          </div>
          <Op>= W</Op>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <Tile label="W" w={46} h={46} variant="trainable" icon={legend.trainIcon} />
          <span className="font-mono text-[9px]" style={{ color: "var(--aud)" }}>
            {labels.title}
          </span>
        </div>
      )}

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-dim">{lora ? labels.plainLora : labels.plainFull}</p>

      {expert && lora && (
        <div className="mt-1.5 space-y-0.5 font-mono text-[9px] text-dim">
          <div>{labels.mergeable}</div>
          <div>{labels.qlora}</div>
        </div>
      )}
    </div>
  );
}
