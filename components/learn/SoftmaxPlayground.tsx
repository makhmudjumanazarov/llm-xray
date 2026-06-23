"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { softmaxTemp } from "@/core/inference/run";
import { LogitsBars } from "@/components/inference/LogitsBars";
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

export function SoftmaxPlayground({ dict }: { dict: Dictionary }) {
  const [temp, setTemp] = useState(1);
  const expert = useExpertMode((s) => s.expert);
  const L = dict.learn.softmax;

  const probs = useMemo(() => softmaxTemp(TOKENS.map((t) => t.z), temp), [temp]);

  return (
    <div className="rounded-card border border-border bg-panel/50 p-5 elev">
      <h3 className="font-display text-lg font-bold text-text">{L.title}</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">{L.blurb}</p>

      {/* bars (shared with the inference logits/sampling stages) */}
      <div className="mt-5">
        <LogitsBars
          bars={TOKENS.map((tok, i) => ({ label: tok.t, prob: probs[i], logit: tok.z }))}
          showLogit={expert}
        />
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
