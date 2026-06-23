"use client";

// 2 — Perceptron: three weighted inputs x1,x2,x3 converge on one σ unit that
// fires an output. Loop: signal packets march along each edge into σ (staggered
// so it reads as accumulation), then σ breathes/blinks and the output pulses.
// Interactive: hover an input to light THAT edge + show its weight tag (w1/w2/w3);
// the other two dim. Reset on pointer leave.

import { useState } from "react";
import { Frame, useLoopFlow, S, D, PANEL, type EraVizProps } from "./_shared";

type In = { x: number; y: number; xl: string; wl: string };
const SUM = { x: 166, y: 60 };
const OUT_X = 214;
const INPUTS: In[] = [
  { x: 40, y: 34, xl: "x1", wl: "w1" },
  { x: 40, y: 60, xl: "x2", wl: "w2" },
  { x: 40, y: 86, xl: "x3", wl: "w3" },
];

export function PerceptronViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // null = nothing hovered; otherwise the focused input index (0..2).
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Frame
      label="Perceptron — weighted inputs summed into one sigma unit"
      flowRef={flowRef}
      onPointerLeave={() => setHover(null)}
    >
      {/* edges: each input -> sigma. Packets march along when running. */}
      {INPUTS.map((p, i) => {
        const focused = hover === i;
        const dim = hover !== null && !focused;
        const stroke = focused ? a : dim ? S : D;
        const w = focused ? 2.4 : 1.4;
        const dx = SUM.x - p.x;
        const dy = SUM.y - p.y;
        return (
          <g key={`e${i}`} opacity={dim ? 0.4 : 1}>
            <line
              x1={p.x}
              y1={p.y}
              x2={SUM.x}
              y2={SUM.y}
              stroke={stroke}
              strokeWidth={w}
              className={run && !dim ? "evo-dash" : undefined}
              style={
                focused
                  ? ({ filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` } as React.CSSProperties)
                  : undefined
              }
            />
            {/* small packet riding the edge into sigma (gated on run) */}
            {run && !dim && (
              <circle
                cx={p.x}
                cy={p.y}
                r="2.4"
                fill={focused ? a : D}
                className="evo-packet"
                style={
                  {
                    ["--evo-dx" as string]: `${dx}px`,
                    ["--evo-dy" as string]: `${dy}px`,
                    animationDelay: `${i * 220}ms`,
                  } as React.CSSProperties
                }
              />
            )}
          </g>
        );
      })}

      {/* input nodes */}
      {INPUTS.map((p, i) => {
        const focused = hover === i;
        const dim = hover !== null && !focused;
        return (
          <g
            key={`n${i}`}
            onPointerEnter={() => setHover(i)}
            style={{ cursor: "pointer" }}
            opacity={dim ? 0.45 : 1}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r="11"
              fill={PANEL}
              stroke={focused ? a : D}
              strokeWidth={focused ? 2 : 1.3}
              style={
                focused
                  ? ({ filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` } as React.CSSProperties)
                  : undefined
              }
            />
            <text
              x={p.x}
              y={p.y + 3.5}
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fill={focused ? a : D}
            >
              {p.xl}
            </text>
            {/* weight tag — only on the focused input, sits above its edge */}
            {focused && (
              <text
                x={p.x + 26}
                y={p.y + (p.y < SUM.y ? -3 : p.y > SUM.y ? 13 : -6)}
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fill={a}
              >
                {p.wl}
              </text>
            )}
          </g>
        );
      })}

      {/* sigma unit — breathes + blinks when running (fires on accumulation) */}
      <g
        className={run ? "evo-breathe" : undefined}
        style={
          run
            ? ({ filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` } as React.CSSProperties)
            : undefined
        }
      >
        <circle
          cx={SUM.x}
          cy={SUM.y}
          r="15"
          fill={PANEL}
          stroke={a}
          strokeWidth="2"
          className={run ? "evo-blink" : undefined}
        />
        <text
          x={SUM.x}
          y={SUM.y + 5}
          textAnchor="middle"
          fontSize="14"
          fontFamily="monospace"
          fill={a}
        >
          σ
        </text>
      </g>

      {/* output arrow to the right — lights/pulses when running */}
      <g className={run ? "evo-pulse" : undefined}>
        <line
          x1={SUM.x + 15}
          y1={SUM.y}
          x2={OUT_X}
          y2={SUM.y}
          stroke={a}
          strokeWidth="2"
        />
        <path
          d={`M ${OUT_X - 6} ${SUM.y - 4} L ${OUT_X + 2} ${SUM.y} L ${OUT_X - 6} ${SUM.y + 4} Z`}
          fill={a}
        />
      </g>
      <text
        x={OUT_X + 6}
        y={SUM.y - 6}
        textAnchor="start"
        fontSize="9"
        fontFamily="monospace"
        fill={D}
      >
        y
      </text>
    </Frame>
  );
}
