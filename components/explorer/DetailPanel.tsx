"use client";

import type { SubOp } from "@/core/model/blocks";
import type { Dictionary } from "@/i18n/dictionaries";
import { compactNumber } from "@/core/shared/format";

const KIND_COLOR: Record<string, string> = {
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

export function DetailPanel({ op, dict }: { op: SubOp | null; dict: Dictionary }) {
  const ops = dict.ops as Record<string, string>;
  if (!op) {
    return (
      <div className="rounded-card border border-border bg-panel p-4 text-sm text-dim">
        {dict.explorer.selectHint}
      </div>
    );
  }
  const params = op.shape ? op.shape.reduce((a, b) => a * b, 1) : 0;
  const color = KIND_COLOR[op.kind] ?? "var(--acc)";
  return (
    <div className="rounded-card border border-border bg-panel p-4" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="font-mono text-sm font-bold text-text">{op.label}</div>
      {op.shape && (
        <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-muted">
          <span>
            <span className="text-dim">{ops.shape}: </span>[{op.shape.join(" × ")}]
          </span>
          <span>
            <span className="text-dim">{ops.params}: </span>
            {compactNumber(params)}
          </span>
        </div>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted">{ops[op.descKey] ?? ""}</p>
    </div>
  );
}
