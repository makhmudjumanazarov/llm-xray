"use client";

// 4 — Sequence models: an unrolled RNN reads tokens x1..x3 bottom-up while a
// single hidden STATE marches left→right along the recurrent arrows (h1→h2→h3),
// each cell pulsing as the state arrives and firing its output up top.
// Interactive: hover a timestep to spotlight that cell, its token, output, and
// the recurrent arrow feeding it — the others dim. Resets on pointer leave.

import { useState } from "react";
import { Frame, pointerFraction, useLoopFlow, S, D, PANEL, type EraVizProps } from "./_shared";

type Step = { x: number; xt: string; ht: string };
const STEPS: Step[] = [
  { x: 56, xt: "x1", ht: "h1" },
  { x: 120, xt: "x2", ht: "h2" },
  { x: 184, xt: "x3", ht: "h3" },
];

const CELL_W = 36;
const CELL_H = 26;
const CELL_CY = 59; // rounded-rect center (spans y≈46..72)
const TOK_CY = 98; // input token row
const OUT_Y = 18; // output arrow head row

export function NlpSeqViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // Hovered timestep index (0..2), or null = resting / looping spotlight.
  const [hot, setHot] = useState<number | null>(null);

  const onMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const { fx } = pointerFraction(e);
    setHot(fx < 1 / 3 ? 0 : fx < 2 / 3 ? 1 : 2);
  };

  // An element is "lit" when hovered (only its step) or, with no hover, always
  // structurally present (the loop drives the alive feel via CSS).
  const lit = (i: number) => hot === null || hot === i;

  return (
    <Frame
      label="Sequence model — unrolled RNN carrying a hidden state across timesteps"
      flowRef={flowRef}
      onPointerMove={onMove}
      onPointerLeave={() => setHot(null)}
    >
      {/* baseline under the token row */}
      <line x1="20" y1="110" x2="220" y2="110" stroke={S} strokeWidth="1" />

      {/* recurrent arrows h_t -> h_{t+1} (drawn under the cells) */}
      {STEPS.slice(0, -1).map((s, i) => {
        const x1 = s.x + CELL_W / 2;
        const x2 = STEPS[i + 1].x - CELL_W / 2;
        // The arrow flowing INTO step i+1 is lit when that step is hovered.
        const on = lit(i + 1);
        return (
          <g key={`rec${i}`} opacity={on ? 1 : 0.25}>
            <line
              x1={x1}
              y1={CELL_CY}
              x2={x2 - 4}
              y2={CELL_CY}
              stroke={on ? a : D}
              strokeWidth="1.6"
              className={run && hot === null ? "evo-dash" : undefined}
            />
            <path
              d={`M ${x2 - 4} ${CELL_CY - 3} L ${x2 + 1} ${CELL_CY} L ${x2 - 4} ${CELL_CY + 3} Z`}
              fill={on ? a : D}
            />
            {/* traveling state packet riding the recurrent arrow */}
            {run && hot === null && (
              <circle
                cx={x1}
                cy={CELL_CY}
                r="2.6"
                fill={a}
                className="evo-packet"
                style={
                  {
                    ["--evo-dx" as string]: `${x2 - 4 - x1}px`,
                    animationDelay: `${i * 800}ms`,
                  } as React.CSSProperties
                }
              />
            )}
          </g>
        );
      })}

      {STEPS.map((s, i) => {
        const on = lit(i);
        const glow = on
          ? { filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` }
          : undefined;
        return (
          <g key={s.ht}>
            {/* input token x_t -> cell (bottom-up arrow) */}
            <line
              x1={s.x}
              y1={TOK_CY - 7}
              x2={s.x}
              y2={CELL_CY + CELL_H / 2 + 2}
              stroke={on ? a : D}
              strokeWidth="1.4"
              opacity={on ? 1 : 0.3}
            />
            <circle
              cx={s.x}
              cy={TOK_CY}
              r="7"
              fill={PANEL}
              stroke={on ? a : D}
              strokeWidth="1.4"
              opacity={on ? 1 : 0.4}
            />
            <text
              x={s.x}
              y={TOK_CY + 3}
              textAnchor="middle"
              fontSize="7"
              fontFamily="monospace"
              fill={on ? a : D}
            >
              {s.xt}
            </text>

            {/* output arrow up top, blinks as the cell fires */}
            <line
              x1={s.x}
              y1={CELL_CY - CELL_H / 2 - 2}
              x2={s.x}
              y2={OUT_Y + 5}
              stroke={on ? a : D}
              strokeWidth="1.4"
              opacity={on ? 1 : 0.3}
            />
            <path
              d={`M ${s.x - 3} ${OUT_Y + 5} L ${s.x} ${OUT_Y} L ${s.x + 3} ${OUT_Y + 5} Z`}
              fill={on ? a : D}
              opacity={on ? 1 : 0.4}
              className={run && on ? "evo-blink" : undefined}
              style={run && on ? ({ animationDelay: `${i * 300}ms` } as React.CSSProperties) : undefined}
            />

            {/* hidden cell h_t */}
            <rect
              x={s.x - CELL_W / 2}
              y={CELL_CY - CELL_H / 2}
              width={CELL_W}
              height={CELL_H}
              rx="6"
              fill={PANEL}
              stroke={on ? a : D}
              strokeWidth={on ? 2 : 1.4}
              opacity={on ? 1 : 0.45}
              className={run && on ? "evo-pulse" : undefined}
              style={
                run && on
                  ? ({ animationDelay: `${i * 300}ms`, ...glow } as React.CSSProperties)
                  : glow
              }
            />
            <text
              x={s.x}
              y={CELL_CY + 3}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill={on ? a : D}
              opacity={on ? 1 : 0.6}
            >
              {s.ht}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}
