"use client";

import type { ReactNode, Ref } from "react";

// Looping-flow gating (mounted + on-screen + motion allowed) and motion guards,
// shared with the training visuals so the whole app paces the same way.
export { useLoopFlow, useMounted, useInView, usePrefersReducedMotion } from "@/components/training/hooks";

// Every era schematic is drawn in ONE 240×120 viewBox so they swap cleanly in
// the EraDetailPanel. Keep all coordinates inside this box.
export const VB_W = 240;
export const VB_H = 120;

// Structural strokes (axes, faint edges, frames) vs dim (inactive nodes, labels).
// Anything "active"/"alive" should use the era accent passed in as `a`.
export const S = "var(--border2)";
export const D = "var(--dim)";
export const PANEL = "var(--panel2)";

/**
 * Every era visual takes the era's accent as a CSS-var string, e.g. "var(--acc2)".
 * (Themed by EraDetailPanel from the era's accentToken.)
 */
export type EraVizProps = { a: string };

/**
 * The shared bordered SVG frame. Attach `flowRef` (from useLoopFlow) to gate the
 * looping animation on visibility, and wire pointer handlers for interaction.
 */
export function Frame({
  label,
  flowRef,
  children,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
}: {
  label: string;
  flowRef?: Ref<HTMLDivElement>;
  children: ReactNode;
  onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLDivElement>;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      ref={flowRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      className="rounded-lg border border-border bg-bg2 p-3"
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-40 w-full touch-none select-none"
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  );
}

/**
 * Map a pointer event on the Frame to a fraction [0,1] across the SVG's drawn
 * area (clamped). Lets interactive diagrams convert cursor position to viewBox
 * coordinates regardless of the element's rendered size.
 */
export function pointerFraction(
  e: { clientX: number; clientY: number; currentTarget: Element },
): { fx: number; fy: number } {
  const r = e.currentTarget.getBoundingClientRect();
  const fx = r.width ? (e.clientX - r.left) / r.width : 0.5;
  const fy = r.height ? (e.clientY - r.top) / r.height : 0.5;
  return { fx: Math.max(0, Math.min(1, fx)), fy: Math.max(0, Math.min(1, fy)) };
}
