"use client";

import { useEffect, useRef, useState } from "react";

/** True when the user asked for reduced motion. Re-evaluates on change. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * Tracks whether the referenced element is on screen so animations can pause
 * when scrolled away (saves battery; keeps the section from competing with the
 * 3D explorer / scatter). Defaults to visible until the observer reports.
 */
export function useInView(rootMargin = "0px"): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
      threshold: 0.01,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}

/**
 * Flips to `true` one frame after mount — lets a component render its initial
 * (pre-animation) state on first paint, then transition to the target so CSS
 * transitions actually run. Snaps immediately under reduced motion.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/**
 * Single guard for the looping training-flow animations: returns a ref to attach
 * to the animated container plus whether its `.animate-*` classes should run
 * (mounted, on-screen, and motion allowed). Lets components drop the classes when
 * offscreen or under reduced motion and render a static final frame instead.
 */
export function useLoopFlow(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [ref, inView] = useInView("0px");
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();
  return [ref, mounted && inView && !reduced];
}
