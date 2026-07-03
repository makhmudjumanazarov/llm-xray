"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { EVOLUTION_ERAS, ERA_COUNT, type EraId } from "@/core/evolution/timeline";
import { EraProgressRail } from "./EraProgressRail";
import { EraStepper } from "./EraStepper";
import { EraDetailPanel } from "./EraDetailPanel";
import { useInView, usePrefersReducedMotion } from "@/components/training/hooks";

const AUTOPLAY_MS = 3600;

type EraCopy = { title: string; yearLabel: string };

/** A short year for the timeline node — first 4-digit year in the label. */
function shortYear(yearLabel: string): string {
  return yearLabel.match(/\d{4}/)?.[0] ?? yearLabel;
}

export function EvolutionTimeline({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const ev = dict.evolution;
  const eras = ev.eras as Record<EraId, EraCopy>;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false); // hover / focus within
  const [sectionRef, inView] = useInView("-10% 0px -10% 0px");
  const reduced = usePrefersReducedMotion();

  // Deep links: seed the active era from ?era=<EraId> (requires <Suspense> in
  // the parent since this route is prerendered).
  const searchParams = useSearchParams();
  useEffect(() => {
    const era = searchParams.get("era");
    const idx = EVOLUTION_ERAS.findIndex((e) => e.id === era);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL-driven seed
    if (idx >= 0) setActiveIndex(idx);
  }, [searchParams]);

  // Manual navigation always pauses autoplay so it never fights the user.
  // The URL is written ONLY here — never from the autoplay interval, which
  // would rewrite it every few seconds.
  const select = useCallback((i: number) => {
    setActiveIndex(i);
    setPlaying(false);
    const id = EVOLUTION_ERAS[i]?.id;
    if (id) window.history.replaceState(null, "", i === 0 ? window.location.pathname : `?era=${id}`);
  }, []);

  const togglePlay = useCallback(() => {
    if (reduced) return; // nothing to animate
    setPlaying((p) => !p);
  }, [reduced]);

  const autoActive = playing && inView && !paused && !reduced;
  useEffect(() => {
    if (!autoActive) return;
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % ERA_COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoActive]);

  const active = EVOLUTION_ERAS[activeIndex];
  const titles = EVOLUTION_ERAS.map((e) => eras[e.id].title);
  const years = EVOLUTION_ERAS.map((e) => shortYear(eras[e.id].yearLabel));

  return (
    <section
      ref={sectionRef}
      aria-label={ev.title}
      className="rounded-card border border-border bg-panel/50 p-5 elev"
    >
      <EraProgressRail
        activeIndex={activeIndex}
        label={ev.capabilityLabel}
        nowLabel={ev.capabilityNowLabel}
        activeTitle={titles[activeIndex]}
        bridgeCta={ev.modelsLabel}
        bridgeHref={`/${locale}/models`}
      />

      <div className="mt-7">
        <EraStepper
          activeIndex={activeIndex}
          onSelect={select}
          playing={playing}
          onTogglePlay={togglePlay}
          titles={titles}
          years={years}
          labels={{ prev: ev.prev, next: ev.next, play: ev.autoplayPlay, stop: ev.autoplayStop, group: ev.stepsGroupLabel }}
        />
      </div>

      {/* Pause autoplay only while the cursor/focus is on the detail panel, so
          its interactive diagram is never yanked away mid-exploration. The rail,
          the stepper, and the Auto-play control itself sit OUTSIDE this zone — so
          pressing play (with the cursor on the button) starts the tour at once. */}
      <div
        className="mt-5 border-t border-border pt-5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <EraDetailPanel key={active.id} dict={dict} locale={locale} era={active} />
      </div>

      {/* announce era changes (esp. during autoplay) to assistive tech */}
      <div className="sr-only" role="status" aria-live="polite">
        {titles[activeIndex]}
      </div>
    </section>
  );
}
