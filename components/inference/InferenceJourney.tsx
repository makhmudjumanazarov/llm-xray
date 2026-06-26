"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { INFER_STAGES, INFER_STAGE_COUNT, type InferStageId } from "@/core/inference/stages";
import { tokenizeIllustrative } from "@/core/model/forwardPass";
import type { SamplingState } from "@/core/inference/run";
import { useInView, usePrefersReducedMotion } from "@/components/training/hooks";
import { PromptBar } from "./PromptBar";
import { InferStepper } from "./InferStepper";
import { InferDetailPanel } from "./InferDetailPanel";

const AUTOPLAY_MS = 2800;

export function InferenceJourney({ dict }: { dict: Dictionary }) {
  const j = dict.inference;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [prompt, setPrompt] = useState(j.presets.p1);
  // Sampling controls — held here so they survive the keyed panel remount.
  const [sampling, setSampling] = useState<SamplingState>({ temp: 1, method: "greedy", k: 3, p: 0.9 });
  const [sectionRef, inView] = useInView("-10% 0px -10% 0px");
  const reduced = usePrefersReducedMotion();

  const tokens = useMemo(() => tokenizeIllustrative(prompt), [prompt]);

  const select = useCallback((i: number) => {
    setActiveIndex(i);
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (reduced) return;
    setPlaying((p) => !p);
  }, [reduced]);

  const run = useCallback(() => {
    setActiveIndex(0);
    if (!reduced) setPlaying(true);
  }, [reduced]);

  const autoActive = playing && inView && !paused && !reduced;
  useEffect(() => {
    if (!autoActive) return;
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % INFER_STAGE_COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoActive]);

  const active = INFER_STAGES[activeIndex];
  const titles = INFER_STAGES.map((s) => (j.stages as Record<InferStageId, { title: string }>)[s.id].title);
  const caption = (j.captions as Record<InferStageId, string>)[active.id];

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      aria-label={j.title}
      className="rounded-card border border-border bg-panel/50 p-5 elev"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-text md:text-2xl">{j.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{j.subtitle}</p>
          <p className="mt-2 max-w-2xl border-l-2 pl-2.5 text-[13px] leading-relaxed text-dim" style={{ borderColor: "var(--acc2)" }}>
            {j.bridgeFromTraining}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <PromptBar
          value={prompt}
          onChange={setPrompt}
          onRun={run}
          label={j.promptLabel}
          placeholder={j.promptPlaceholder}
          runLabel={j.run}
          presets={j.presets}
        />
      </div>

      <InferStepper
        activeIndex={activeIndex}
        onSelect={select}
        playing={playing}
        onTogglePlay={togglePlay}
        titles={titles}
        labels={{ prev: j.prev, next: j.next, play: j.autoplayPlay, stop: j.autoplayStop, group: j.stepsGroupLabel }}
      />
      <div className="mt-2 text-center font-mono text-[11px] text-dim">{caption}</div>

      <div className="mt-4 border-t border-border pt-4">
        <InferDetailPanel
          key={active.id}
          dict={dict}
          stage={active}
          prompt={prompt}
          tokens={tokens}
          sampling={sampling}
          setSampling={setSampling}
        />
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {`${titles[activeIndex]} — ${caption}`}
      </div>
    </section>
  );
}
