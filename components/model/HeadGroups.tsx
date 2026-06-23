"use client";

import { useState } from "react";
import type { AttentionType } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";

// Interactive SVG showing how query heads share key/value heads.
//   MHA  numKVHeads === numHeads   (one KV head per query head)
//   GQA  1 < numKVHeads < numHeads (query heads grouped onto fewer KV heads)
//   MQA  numKVHeads === 1          (all query heads share a single KV head)
//   MLA  latent KV — note shown when attentionType === "mla"
// Hovering a group highlights its query heads. Tokens: --acc2 active, --dim idle.

type Props = {
  numHeads: number;
  numKVHeads: number;
  attentionType: AttentionType;
  dict: Dictionary;
};

const TICK_W = 14;
const TICK_GAP = 4;
const TICK_H = 26;

export function HeadGroups({ numHeads, numKVHeads, attentionType, dict }: Props) {
  const [active, setActive] = useState<number | null>(null);

  // Guard against malformed data: at least one KV head, never more than queries.
  const kv = Math.max(1, Math.min(numKVHeads, numHeads));
  const perGroup = numHeads / kv;
  // Map each query head index -> the KV group it shares.
  const groupOf = (q: number) => Math.min(kv - 1, Math.floor(q / perGroup));

  const isMLA = attentionType === "mla";
  const width = numHeads * (TICK_W + TICK_GAP) - TICK_GAP;

  return (
    <div>
      <h2 className="mt-8 mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
        {dict.model.headGroupsTitle}
      </h2>
      <p className="mb-3 max-w-prose text-sm text-dim">{dict.model.headGroupsHint}</p>

      <div className="rounded-card border border-border bg-panel p-4">
        <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-dim">
          {dict.model.queryHeads} · {numHeads}
        </div>
        <svg
          viewBox={`0 0 ${Math.max(width, 1)} ${TICK_H}`}
          width="100%"
          height={TICK_H}
          role="img"
          aria-label={`${numHeads} ${dict.model.queryHeads}, ${kv} ${dict.model.kvHeadsShort}`}
          className="block"
        >
          {Array.from({ length: numHeads }, (_, q) => {
            const g = groupOf(q);
            const on = active === g;
            return (
              <rect
                key={q}
                x={q * (TICK_W + TICK_GAP)}
                y={0}
                width={TICK_W}
                height={TICK_H}
                rx={2}
                fill={on ? "var(--acc2)" : "var(--dim)"}
                opacity={active === null ? 0.55 : on ? 1 : 0.2}
                style={{ transition: "opacity 120ms, fill 120ms" }}
              />
            );
          })}
        </svg>

        <div className="mt-4 mb-1.5 font-mono text-[11px] uppercase tracking-wide text-dim">
          {dict.model.kvHeadsShort} · {kv}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: kv }, (_, g) => {
            const on = active === g;
            const count = Array.from({ length: numHeads }, (_, q) => groupOf(q)).filter(
              (x) => x === g,
            ).length;
            return (
              <button
                key={g}
                type="button"
                onMouseEnter={() => setActive(g)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(g)}
                onBlur={() => setActive(null)}
                className="rounded border px-2 py-1 font-mono text-[11px] transition-colors"
                style={{
                  borderColor: on ? "var(--acc2)" : "var(--border)",
                  color: on ? "var(--acc2)" : "var(--dim)",
                }}
              >
                {dict.model.group} {g + 1} · {count}×
              </button>
            );
          })}
        </div>

        {isMLA && (
          <p className="mt-3 font-mono text-[11px] text-dim">
            {dict.attentionType.mla}
          </p>
        )}
      </div>
    </div>
  );
}
