"use client";

import type { StageId } from "@/core/training/lifecycle";

type CellKind = "on" | "frozen" | "quant";

const COLS = 8;
const ROWS = 5;
const N = COLS * ROWS;

function cellKinds(stage: StageId, lora: boolean): CellKind[] {
  return Array.from({ length: N }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    switch (stage) {
      case "pretraining":
        return "on";
      case "sft":
        if (!lora) return "on";
        // LoRA: only a thin adapter stripe (two columns) trains; base is frozen.
        return col === 3 || col === 4 ? "on" : "frozen";
      case "preference":
        return "on";
      case "eval":
        // Frozen, then re-encoded into chunky int4 blocks (2×2 checker).
        return (Math.floor(col / 2) + Math.floor(row / 2)) % 2 === 0 ? "quant" : "frozen";
    }
  });
}

function kindStyle(kind: CellKind, accentVar: string): { background: string; opacity: number } {
  switch (kind) {
    case "on":
      return { background: accentVar, opacity: 1 };
    case "frozen":
      return { background: "var(--dim)", opacity: 0.32 };
    case "quant":
      return { background: "var(--vis)", opacity: 0.9 };
  }
}

export function WeightGrid({
  stage,
  accentVar,
  lora,
  labels,
}: {
  stage: StageId;
  accentVar: string;
  lora: boolean;
  labels: { allTrainable: string; frozenBase: string; adapter: string; policy: string; reference: string; quantized: string };
}) {
  const kinds = cellKinds(stage, lora);

  const caption =
    stage === "pretraining"
      ? labels.allTrainable
      : stage === "sft"
        ? lora
          ? `${labels.frozenBase} + ${labels.adapter}`
          : labels.allTrainable
        : stage === "preference"
          ? `${labels.policy} · ${labels.reference}`
          : `${labels.frozenBase} · ${labels.quantized}`;

  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, maxWidth: 168 }}
        aria-hidden="true"
      >
        {kinds.map((kind, i) => {
          const s = kindStyle(kind, accentVar);
          return (
            <span
              key={i}
              className="aspect-square rounded-[2px] transition-[background-color,opacity] duration-300 ease-out"
              style={{
                background: s.background,
                opacity: s.opacity,
                transitionDelay: `${(i % COLS) * 12 + Math.floor(i / COLS) * 6}ms`,
                boxShadow: kind === "on" ? `0 0 6px color-mix(in oklab, ${accentVar} 55%, transparent)` : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 font-mono text-[10px] text-dim">{caption}</div>
    </div>
  );
}
