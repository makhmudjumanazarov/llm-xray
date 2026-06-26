"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { PROCESS_DEFINITIONS, PROCESS_COUNT, type ProcessId } from "@/core/processes/definitions";
import { ProcessStepper } from "./ProcessStepper";
import { ProcessDetailPanel } from "./ProcessDetailPanel";
import { useInView, usePrefersReducedMotion } from "@/components/training/hooks";

const AUTOPLAY_MS = 4200;

type StepCopy = { title: string };

export function ProcessJourney({ dict }: { dict: Dictionary }) {
  const pr = dict.processes;
  const steps = pr.steps as Record<ProcessId, StepCopy>;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false); // hover / focus within
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
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % PROCESS_COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoActive]);

  const active = PROCESS_DEFINITIONS[activeIndex];
  const titles = PROCESS_DEFINITIONS.map((p) => steps[p.id].title);

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      aria-label={pr.title}
      className="rounded-card border border-border bg-panel/50 p-5 elev"
    >
      <div className="mb-5 min-w-0">
        <h2 className="font-display text-xl font-bold tracking-tight text-text md:text-2xl">{pr.title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{pr.subtitle}</p>
        <p
          className="mt-2 max-w-2xl border-l-2 pl-2.5 text-[13px] leading-relaxed text-dim"
          style={{ borderColor: "var(--acc2)" }}
        >
          {pr.intro}
        </p>
      </div>

      <div className="mt-2">
        <ProcessStepper
          activeIndex={activeIndex}
          onSelect={select}
          playing={playing}
          onTogglePlay={togglePlay}
          titles={titles}
          labels={{ prev: pr.prev, next: pr.next, play: pr.autoplayPlay, stop: pr.autoplayStop, group: pr.stepsGroupLabel }}
        />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <ProcessDetailPanel key={active.id} dict={dict} process={active} />
      </div>

      {/* announce step changes (esp. during autoplay) to assistive tech */}
      <div className="sr-only" role="status" aria-live="polite">
        {titles[activeIndex]}
      </div>
    </section>
  );
}
