"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { LIFECYCLE_STAGES, STAGE_COUNT, type StageId } from "@/core/training/lifecycle";
import type { AlignmentMethod } from "@/core/training/loop";
import { ExpertToggle } from "@/components/learn/ExpertToggle";
import { CapabilityMeter } from "./CapabilityMeter";
import { StageStepper } from "./StageStepper";
import { StageDetailPanel } from "./StageDetailPanel";
import { useInView, usePrefersReducedMotion } from "./hooks";

const AUTOPLAY_MS = 3200;

export function TrainingLifecycle({ dict }: { dict: Dictionary }) {
  const j = dict.journey;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false); // hover / focus within
  // SFT Full-FT ↔ LoRA toggle — held here so it survives the panel's keyed remount.
  // Defaults to full fine-tuning (the simplest "every weight moves" view); the
  // ungated toggle reveals the LoRA adapter decomposition on demand.
  const [lora, setLora] = useState(false);
  // Preference RLHF ↔ DPO method — likewise lifted so it survives the remount.
  const [method, setMethod] = useState<AlignmentMethod>("dpo");
  const [sectionRef, inView] = useInView("-10% 0px -10% 0px");
  const reduced = usePrefersReducedMotion();

  // Manual navigation always pauses autoplay so it never fights the user.
  const select = useCallback((i: number) => {
    setActiveIndex(i);
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (reduced) return; // nothing to animate
    setPlaying((p) => !p);
  }, [reduced]);

  const autoActive = playing && inView && !paused && !reduced;
  useEffect(() => {
    if (!autoActive) return;
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % STAGE_COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoActive]);

  const active = LIFECYCLE_STAGES[activeIndex];
  const titles = LIFECYCLE_STAGES.map((s) => (j.stages as Record<StageId, { title: string }>)[s.id].title);

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
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-text md:text-2xl">{j.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{j.subtitle}</p>
          <p
            className="mt-2 max-w-2xl border-l-2 pl-2.5 text-[13px] leading-relaxed text-dim"
            style={{ borderColor: "var(--acc2)" }}
          >
            {j.loop.intro}
          </p>
        </div>
        <ExpertToggle dict={dict} />
      </div>

      <CapabilityMeter
        activeIndex={activeIndex}
        label={j.capabilityLabel}
        nowLabel={j.capabilityNowLabel}
        captions={j.capabilityCaptions}
        bridgeCta={j.bridgeCta}
      />

      <div className="mt-7">
        <StageStepper
          activeIndex={activeIndex}
          onSelect={select}
          playing={playing}
          onTogglePlay={togglePlay}
          titles={titles}
          labels={{ prev: j.prev, next: j.next, play: j.autoplayPlay, stop: j.autoplayStop, group: j.stagesGroupLabel }}
        />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <StageDetailPanel
          key={active.id}
          dict={dict}
          stage={active}
          lora={lora}
          setLora={setLora}
          method={method}
          setMethod={setMethod}
        />
      </div>

      {/* announce stage changes (esp. during autoplay) to assistive tech */}
      <div className="sr-only" role="status" aria-live="polite">
        {`${titles[activeIndex]} — ${j.capabilityCaptions[active.id]}`}
      </div>
    </section>
  );
}
