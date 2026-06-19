"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { AlignmentMethod } from "@/core/training/loop";
import { PrefPairCard } from "./PrefPairCard";
import { useMounted, useLoopFlow } from "./hooks";

type RlhfLabels = Dictionary["journey"]["rlhf"];
type DpoLabels = Dictionary["journey"]["dpo"];
type Legend = Dictionary["journey"]["legend"];

export type PairLabels = {
  chosen: string;
  rejected: string;
  chosenExample: string;
  rejectedExample: string;
};

const FULL = "var(--full)";

function NumBadge({ n }: { n: number }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-bg"
      style={{ background: FULL }}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function StepCard({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex-1 rounded-card border px-2 py-2" style={{ borderColor: "color-mix(in oklab, var(--full) 40%, var(--border))" }}>
      <div className="mb-1.5 flex items-start gap-1.5">
        <NumBadge n={n} />
        <span className="font-mono text-[10px] leading-snug text-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

function RewardBar({ label, value, on }: { label: string; value: number; on: boolean }) {
  const mounted = useMounted();
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 shrink-0 text-center font-mono text-[10px]" style={{ color: on ? FULL : "var(--dim)" }} aria-hidden="true">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-bg2">
        <div
          className="h-full rounded transition-[width] duration-1000 ease-out"
          style={{ width: mounted ? `${value}%` : "0%", background: on ? FULL : "var(--dim)" }}
        />
      </div>
    </div>
  );
}

/** The frozen SFT reference πθ is leashed to, with a β·KL tether. Shared by both methods. */
function LeashedPolicy({
  policyLabel,
  refLabel,
  leashLabel,
  frozenIcon,
  animate,
}: {
  policyLabel: string;
  refLabel: string;
  leashLabel: string;
  frozenIcon: string;
  animate: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="rounded border px-2 py-1 text-center font-mono text-[10px]" style={{ borderColor: FULL, color: FULL }}>
        {policyLabel}
      </div>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 80 14" className="h-3.5 w-full" preserveAspectRatio="none" aria-hidden="true">
          <line
            x1="40"
            y1="0"
            x2="40"
            y2="14"
            stroke={FULL}
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className={animate ? "animate-leash" : undefined}
          />
        </svg>
        <span className="absolute bg-panel px-1 font-mono text-[8px]" style={{ color: FULL }}>
          β · {leashLabel}
        </span>
      </div>
      <div className="rounded border border-border bg-bg2 px-2 py-1 text-center font-mono text-[10px] text-dim">
        <span aria-hidden="true">{frozenIcon} </span>
        {refLabel}
      </div>
    </div>
  );
}

export function RlhfPipeline({
  method,
  expert,
  rlhf,
  dpo,
  pair,
  legend,
}: {
  method: AlignmentMethod;
  expert: boolean;
  rlhf: RlhfLabels;
  dpo: DpoLabels;
  pair: PairLabels;
  legend: Legend;
}) {
  const [ref, animate] = useLoopFlow();

  const pairCard = (
    <PrefPairCard
      accentVar={FULL}
      chosenLabel={pair.chosen}
      rejectedLabel={pair.rejected}
      chosenExample={pair.chosenExample}
      rejectedExample={pair.rejectedExample}
    />
  );

  if (method === "rlhf") {
    return (
      <div ref={ref}>
        <div className="mb-2 font-mono text-[11px] font-semibold" style={{ color: FULL }}>
          {rlhf.title}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <StepCard n={1} title={rlhf.step1}>
            {pairCard}
            {expert && <div className="mt-1 font-mono text-[9px] text-dim">{rlhf.step1Tag}</div>}
          </StepCard>
          <span className="self-center text-dim" aria-hidden="true">
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">→</span>
          </span>
          <StepCard n={2} title={rlhf.step2}>
            <div className="rounded border border-border bg-bg2 p-1.5">
              <div className="font-mono text-[9px] text-dim">rφ(x,y)</div>
              <div className="mt-1 space-y-1">
                <RewardBar label="✓" value={84} on />
                <RewardBar label="✕" value={32} on={false} />
              </div>
            </div>
            {expert && <div className="mt-1 font-mono text-[9px] text-dim">{rlhf.step2Expert}</div>}
          </StepCard>
          <span className="self-center text-dim" aria-hidden="true">
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">→</span>
          </span>
          <StepCard n={3} title={rlhf.step3}>
            <LeashedPolicy
              policyLabel={rlhf.policy}
              refLabel={rlhf.reference}
              leashLabel={rlhf.leash}
              frozenIcon={legend.frozenIcon}
              animate={animate}
            />
          </StepCard>
        </div>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-dim">{rlhf.objective}</p>
      </div>
    );
  }

  // DPO — the shortcut: pairs update the policy directly, no reward model.
  return (
    <div ref={ref}>
      <div className="mb-2 font-mono text-[11px] font-semibold" style={{ color: FULL }}>
        {dpo.title}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">{pairCard}</div>
        <div className="flex flex-col items-center" aria-hidden="true">
          <span className="font-mono text-[9px]" style={{ color: FULL }}>
            {dpo.direct}
          </span>
          <span className="text-dim">
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">→</span>
          </span>
        </div>
        <div className="flex-1">
          <LeashedPolicy
            policyLabel={rlhf.policy}
            refLabel={rlhf.reference}
            leashLabel={rlhf.leash}
            frozenIcon={legend.frozenIcon}
            animate={animate}
          />
        </div>
      </div>
      {/* the removed reward-model step, shown as a ghost to make the contrast explicit */}
      <div className="mt-2 inline-flex items-center gap-1.5 rounded border border-dashed border-border bg-bg2/40 px-2 py-1 opacity-60">
        <span className="font-mono text-[10px] text-dim line-through">rφ</span>
        <span className="font-mono text-[9px] text-dim">{dpo.noRewardModel}</span>
      </div>
      <p className="mt-2 font-mono text-[10px] leading-relaxed text-dim">{dpo.caption}</p>
      {expert && <p className="mt-1 font-mono text-[9px] leading-relaxed text-dim">{dpo.notClosedForm}</p>}
    </div>
  );
}
