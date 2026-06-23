"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { EraId } from "@/core/evolution/timeline";
import { deepDive, type MilestoneKind } from "@/core/evolution/deepdive";
import { Sparkles, Type, Trophy, Bot, Grid } from "@/components/ui/icons";

const KIND_META: Record<MilestoneKind, { Icon: typeof Sparkles; color: string }> = {
  origin: { Icon: Sparkles, color: "var(--acc2)" },
  paper: { Icon: Type, color: "var(--proj)" },
  award: { Icon: Trophy, color: "var(--aud)" },
  model: { Icon: Bot, color: "var(--slide)" },
  event: { Icon: Grid, color: "var(--dim)" },
};

/** Vertical timeline of an era's milestones (origin, papers, awards, models). */
export function EraMilestones({ eraId, dict }: { eraId: EraId; dict: Dictionary }) {
  const { milestones } = deepDive(eraId);
  const ev = dict.evolution;
  const eraCopy = (ev.eras as Record<string, { milestones?: Record<string, string> }>)[eraId];
  const labels = eraCopy.milestones ?? {};
  const kindNames = ev.milestoneKinds as Record<MilestoneKind, string>;

  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-dim">{ev.milestonesLabel}</div>
      <ol className="relative ml-1 border-l border-border">
        {milestones.map((m, i) => {
          const { Icon, color } = KIND_META[m.kind];
          return (
            <li key={m.id} className="relative mb-3 pl-5 last:mb-0">
              {/* node on the rail */}
              <span
                className="absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border bg-bg"
                style={{ borderColor: color, color }}
              >
                <Icon size={9} />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-[12px] font-bold text-text">{m.year}</span>
                <span className="font-mono text-[9px] uppercase tracking-wide" style={{ color }}>
                  {kindNames[m.kind]}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{labels[m.id] ?? m.id}</p>
              {/* hairline gap is provided by mb on <li>; index keeps key stable */}
              <span className="sr-only">{i + 1}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
