"use client";

// 6 — Vision CNN: a kernel slides over a 5×5 image in row-major order while three
// feature maps shrink and deepen with each conv stage. Loop: the window auto-sweeps
// cell by cell and the maps pulse alive. Interactive: hover the grid to snap the
// kernel to that cell, light its 3×3 receptive field, and brighten the lead map.

import { useEffect, useRef, useState } from "react";
import { Frame, pointerFraction, useLoopFlow, S, D, PANEL, type EraVizProps } from "./_shared";

const N = 5; // grid is 5×5
const CELL = 13;
const GX = 26; // grid origin x
const GY = 32; // grid origin y
const CELLS = N * N;

// Three feature maps: shrinking squares, deepening accent opacity.
const MAPS = [
  { x: 150, y: 40, s: 40, op: 0.32 },
  { x: 168, y: 49, s: 26, op: 0.55 },
  { x: 182, y: 56, s: 14, op: 0.9 },
];

export function VisionCnnViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // Auto-sweep index over the grid (row-major). Hover overrides it.
  const [auto, setAuto] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!run) return;
    timer.current = setInterval(() => setAuto((i) => (i + 1) % CELLS), 360);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [run]);

  const active = hover ?? (run ? auto : 12); // static frame rests at center cell
  const ar = Math.floor(active / N);
  const ac = active % N;
  // Keep the 3×3 window inside the grid.
  const wc = Math.max(0, Math.min(N - 3, ac - 1));
  const wr = Math.max(0, Math.min(N - 3, ar - 1));
  const winX = GX + wc * CELL;
  const winY = GY + wr * CELL;

  const inField = (r: number, c: number) =>
    r >= wr && r < wr + 3 && c >= wc && c < wc + 3;

  // The lead feature-map cell that "lights" tracks horizontal sweep position.
  const litMap = ac >= 3 ? 2 : ac >= 1 ? 1 : 0;

  return (
    <Frame
      label="Vision CNN — sliding kernel builds shrinking feature maps"
      flowRef={flowRef}
      onPointerMove={(e) => {
        const { fx, fy } = pointerFraction(e);
        const c = Math.floor(((fx * 240 - GX) / (N * CELL)) * N);
        const r = Math.floor(((fy * 120 - GY) / (N * CELL)) * N);
        if (c >= 0 && c < N && r >= 0 && r < N) setHover(r * N + c);
        else setHover(null);
      }}
      onPointerLeave={() => setHover(null)}
    >
      {/* image grid */}
      {Array.from({ length: CELLS }, (_, i) => {
        const r = Math.floor(i / N);
        const c = i % N;
        const lit = inField(r, c);
        return (
          <rect
            key={i}
            x={GX + c * CELL}
            y={GY + r * CELL}
            width={CELL - 1.5}
            height={CELL - 1.5}
            rx="1.5"
            fill={lit ? a : PANEL}
            opacity={lit ? 0.32 : 1}
            stroke={S}
            strokeWidth="0.75"
          />
        );
      })}

      {/* kernel window — square outline that snaps over the active receptive field */}
      <rect
        x={winX}
        y={winY}
        width={CELL * 3 - 1.5}
        height={CELL * 3 - 1.5}
        rx="2"
        fill="none"
        stroke={a}
        strokeWidth="2"
        className={run && hover === null ? "evo-pulse" : undefined}
        style={{ filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` }}
      />
      <text x={GX} y={26} fontSize="8" fontFamily="monospace" fill={D}>
        3×3
      </text>

      {/* convolution arrow */}
      <line x1="98" y1="60" x2="138" y2="60" stroke={S} strokeWidth="1" />
      <path d="M138 60 l-6 -3 l0 6 z" fill={S} />
      <text x="103" y="54" fontSize="7" fontFamily="monospace" fill={D}>
        conv
      </text>

      {/* feature maps — shrink + deepen; grow in once, pulse the lit one alive */}
      {MAPS.map((m, i) => (
        <rect
          key={i}
          x={m.x}
          y={m.y}
          width={m.s}
          height={m.s}
          rx="2"
          fill={a}
          opacity={litMap === i ? Math.min(1, m.op + 0.1) : m.op}
          stroke={a}
          strokeWidth="1"
          className={run ? (litMap === i ? "evo-pulse" : "evo-grow") : undefined}
          style={{
            animationDelay: `${i * 120}ms`,
            ...(litMap === i
              ? { filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` }
              : {}),
          }}
        />
      ))}

      <text x="150" y="100" fontSize="8" fontFamily="monospace" fill={D}>
        40²→26²→14²
      </text>
    </Frame>
  );
}
