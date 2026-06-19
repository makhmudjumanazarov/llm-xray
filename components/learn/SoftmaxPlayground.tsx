"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { BlockMath } from "./Katex";

// Illustrative next-token candidates with raw scores (logits).
const TOKENS = [
  { t: "Paris", z: 3.2 },
  { t: "London", z: 2.3 },
  { t: "Berlin", z: 1.9 },
  { t: "Madrid", z: 1.1 },
  { t: "Rome", z: 0.7 },
  { t: "Cairo", z: -0.4 },
];

function softmax(zs: number[], T: number): number[] {
  const scaled = zs.map((z) => z / T);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function SoftmaxPlayground({ dict }: { dict: Dictionary }) {
  const [temp, setTemp] = useState(1);
  const expert = useExpertMode((s) => s.expert);
  const L = dict.learn.softmax;

  const probs = useMemo(() => softmax(TOKENS.map((t) => t.z), temp), [temp]);
  const maxP = Math.max(...probs);

  return (
    <div className="rounded-card border border-border bg-panel/50 p-5 elev">
      <h3 className="font-display text-lg font-bold text-text">{L.title}</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">{L.blurb}</p>

      {/* bars */}
      <div className="mt-5 space-y-2">
        {TOKENS.map((tok, i) => {
          const p = probs[i];
          const isMax = p === maxP;
          return (
            <div key={tok.t} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right font-mono text-xs text-muted">{tok.t}</span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-bg2">
                <div
                  className="h-full rounded transition-[width] duration-300 ease-out"
                  style={{ width: `${p * 100}%`, background: isMax ? "var(--acc2)" : "var(--acc-soft)" }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-text">
                  {(p * 100).toFixed(1)}%
                </span>
              </div>
              {expert && <span className="w-12 shrink-0 font-mono text-[11px] text-dim">z={tok.z}</span>}
            </div>
          );
        })}
      </div>

      {/* temperature slider */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
          <span className="text-muted">{L.temperature}</span>
          <span className="text-acc">T = {temp.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={temp}
          onChange={(e) => setTemp(parseFloat(e.target.value))}
          className="w-full accent-[var(--acc2)]"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
          <span>0.1 · sharp / greedy</span>
          <span>2.0 · flat / random</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">{expert ? L.expertText : L.beginnerText}</p>

      {expert && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-bg2 p-3 text-text">
          <BlockMath math={"p_i = \\dfrac{e^{z_i / T}}{\\sum_j e^{z_j / T}}"} />
        </div>
      )}
    </div>
  );
}
