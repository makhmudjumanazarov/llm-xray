"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { resolveSampling, type Candidate, type SamplingState, type SamplingMethod } from "@/core/inference/run";
import { LogitsBars } from "./LogitsBars";

type SamplingLabels = {
  temperature: string;
  tempLow: string;
  tempHigh: string;
  method: string;
  greedy: string;
  topk: string;
  topp: string;
  kept: string;
  picked: string;
};

/** Interactive sampling: temperature + greedy/top-k/top-p re-shape the same
 *  distribution; dimmed bars are cut, the solid accent bar is the pick. */
export function SamplingDials({
  candidates,
  sampling,
  setSampling,
  labels,
  accentVar,
}: {
  candidates: Candidate[];
  sampling: SamplingState;
  setSampling: (s: SamplingState) => void;
  labels: SamplingLabels;
  accentVar: string;
}) {
  const logits = candidates.map((c) => c.logit);
  const { probs, keepMask, picked } = resolveSampling(logits, sampling);
  const keptCount = keepMask.filter(Boolean).length;

  return (
    <div className="space-y-3">
      <LogitsBars
        bars={candidates.map((c, i) => ({ label: c.token, prob: probs[i] }))}
        keepMask={sampling.method === "greedy" ? undefined : keepMask}
        pickedIndex={picked}
        accentVar={accentVar}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{labels.method}</span>
        <SegmentedControl
          ariaLabel={labels.method}
          value={sampling.method}
          onChange={(m) => setSampling({ ...sampling, method: m as SamplingMethod })}
          options={[
            { value: "greedy", label: labels.greedy },
            { value: "topk", label: labels.topk },
            { value: "topp", label: labels.topp },
          ]}
        />
        <span className="font-mono text-[10px] text-dim">
          {keptCount} {labels.kept}
        </span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between font-mono text-xs">
          <span className="text-muted">{labels.temperature}</span>
          <span className="text-acc">T = {sampling.temp.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={sampling.temp}
          onChange={(e) => setSampling({ ...sampling, temp: parseFloat(e.target.value) })}
          aria-label={labels.temperature}
          className="w-full accent-[var(--acc2)]"
        />
        <div className="mt-0.5 flex justify-between font-mono text-[10px] text-dim">
          <span>0.1 · {labels.tempLow}</span>
          <span>2.0 · {labels.tempHigh}</span>
        </div>
      </div>

      {sampling.method === "topk" && (
        <label className="block">
          <div className="mb-1 flex items-center justify-between font-mono text-xs">
            <span className="text-muted">k</span>
            <span className="text-acc">k = {sampling.k}</span>
          </div>
          <input
            type="range"
            min={1}
            max={candidates.length}
            step={1}
            value={sampling.k}
            onChange={(e) => setSampling({ ...sampling, k: parseInt(e.target.value, 10) })}
            aria-label="top-k"
            className="w-full accent-[var(--acc2)]"
          />
        </label>
      )}
      {sampling.method === "topp" && (
        <label className="block">
          <div className="mb-1 flex items-center justify-between font-mono text-xs">
            <span className="text-muted">p</span>
            <span className="text-acc">p = {sampling.p.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={sampling.p}
            onChange={(e) => setSampling({ ...sampling, p: parseFloat(e.target.value) })}
            aria-label="top-p"
            className="w-full accent-[var(--acc2)]"
          />
        </label>
      )}
    </div>
  );
}
