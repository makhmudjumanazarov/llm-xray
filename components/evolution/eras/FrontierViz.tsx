"use client";

// Frontier — three modalities (text, image, audio) feed one LLM core that routes
// each step to a sparse top-2 of four experts. Loop: input lines flow packets in,
// the core breathes, and the lit expert pair drifts via staggered pulse phases so
// it reads as dynamic top-2 routing. Hover a modality to spotlight its line and
// pulse the core; the other inputs dim.

import { useState } from "react";
import { Frame, useLoopFlow, S, D, PANEL, type EraVizProps } from "./_shared";

type Modality = { id: string; glyph: string; y: number };
const INPUTS: Modality[] = [
  { id: "text", glyph: "Aa", y: 26 },
  { id: "image", glyph: "▦", y: 60 },
  { id: "audio", glyph: ")))", y: 94 },
];

const CORE = { x: 84, y: 36, w: 40, h: 48 }; // center ≈ (104, 60)
const CORE_CX = CORE.x + CORE.w / 2;
const CORE_CY = CORE.y + CORE.h / 2;

// Four expert bars on the right; pre-staggered pulse phases keep ~2 lit at once.
const EXPERTS = [
  { x: 156, delay: "0ms" },
  { x: 172, delay: "650ms" },
  { x: 188, delay: "1300ms" },
  { x: 204, delay: "1950ms" },
];
const BAR_BASE = 100;
const BAR_TOP = 32;

export function FrontierViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // null = no hover; otherwise the focused modality id.
  const [hover, setHover] = useState<string | null>(null);

  const glow = { filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` };

  // When a modality is hovered, bias the lit experts toward a fixed pair so the
  // routing visibly reacts (works under reduced motion — it is pure state).
  const biasIdx = hover === null ? null : INPUTS.findIndex((m) => m.id === hover);
  const litByHover = (i: number) =>
    biasIdx === null ? false : i === biasIdx || i === (biasIdx + 1) % EXPERTS.length;

  return (
    <Frame
      label="Frontier multimodal model routing inputs to a sparse top-2 of four experts"
      flowRef={flowRef}
      onPointerLeave={() => setHover(null)}
    >
      {/* input chips */}
      {INPUTS.map((m) => {
        const focused = hover === m.id;
        const dim = hover !== null && !focused;
        const lit = focused;
        return (
          <g
            key={m.id}
            onPointerEnter={() => setHover(m.id)}
            onPointerDown={() => setHover(m.id)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x="14"
              y={m.y - 11}
              width="30"
              height="22"
              rx="5"
              fill={PANEL}
              stroke={lit ? a : S}
              strokeWidth={lit ? 1.6 : 1}
              opacity={dim ? 0.4 : 1}
              style={lit ? glow : undefined}
            />
            <text
              x="29"
              y={m.y + 4}
              textAnchor="middle"
              fontSize="11"
              fontFamily="monospace"
              fill={lit ? a : D}
              opacity={dim ? 0.5 : 1}
            >
              {m.glyph}
            </text>
          </g>
        );
      })}

      {/* input lines into the core */}
      {INPUTS.map((m, i) => {
        const focused = hover === m.id;
        const dim = hover !== null && !focused;
        const active = focused || hover === null;
        return (
          <g key={`line-${m.id}`}>
            <line
              x1="44"
              y1={m.y}
              x2={CORE.x}
              y2={CORE_CY}
              stroke={active ? a : S}
              strokeWidth={focused ? 2 : 1.2}
              opacity={dim ? 0.3 : focused ? 1 : 0.6}
              className={run ? "evo-dash" : undefined}
              style={{ animationDelay: `${i * 200}ms` }}
            />
            {/* traveling packet along each feed */}
            {run && (
              <circle
                cx="44"
                cy={m.y}
                r="2.2"
                fill={a}
                opacity={dim ? 0.25 : 0.95}
                className="evo-packet"
                style={
                  {
                    ["--evo-dx" as string]: `${CORE.x - 44}px`,
                    ["--evo-dy" as string]: `${CORE_CY - m.y}px`,
                    animationDelay: `${i * 280}ms`,
                  } as React.CSSProperties
                }
              />
            )}
          </g>
        );
      })}

      {/* LLM core — breathes as the live unit; pulses harder when a modality is held */}
      <g
        className={run ? (hover ? "evo-pulse" : "evo-breathe") : undefined}
        style={hover ? glow : undefined}
      >
        <rect
          x={CORE.x}
          y={CORE.y}
          width={CORE.w}
          height={CORE.h}
          rx="8"
          fill={PANEL}
          stroke={a}
          strokeWidth="1.6"
        />
        <text
          x={CORE_CX}
          y={CORE_CY + 4}
          textAnchor="middle"
          fontSize="12"
          fontFamily="monospace"
          fill={a}
        >
          LLM
        </text>
      </g>

      {/* router arrow from core to the expert pool */}
      <line
        x1={CORE.x + CORE.w}
        y1={CORE_CY}
        x2="150"
        y2={CORE_CY}
        stroke={a}
        strokeWidth="1.4"
        className={run ? "evo-dash" : undefined}
      />
      <path d="M150 56 L150 64 L156 60 Z" fill={a} />

      {/* four expert bars; lit pair shifts via staggered pulse, or via hover bias */}
      {EXPERTS.map((e, i) => {
        const forced = litByHover(i);
        // Resting static top-2 (run=false, no hover): experts 0 and 1 read as lit.
        const staticLit = i === 0 || i === 1;
        // Hover biases a fixed pair; while autonomously pulsing the fill is accent
        // and the pulse opacity carries the "drifting top-2" read.
        const lit = hover !== null ? forced : run ? true : staticLit;
        const opacity =
          hover !== null ? (forced ? 1 : 0.25) : run ? 0.5 : staticLit ? 1 : 0.3;
        return (
          <g key={`exp-${i}`}>
            {/* track */}
            <rect x={e.x} y={BAR_TOP} width="9" height={BAR_BASE - BAR_TOP} rx="2" fill={PANEL} stroke={S} strokeWidth="0.8" />
            {/* active fill */}
            <rect
              x={e.x}
              y={BAR_TOP}
              width="9"
              height={BAR_BASE - BAR_TOP}
              rx="2"
              fill={lit ? a : D}
              opacity={opacity}
              className={run && hover === null ? "evo-pulse" : undefined}
              style={
                run && hover === null
                  ? ({ animationDelay: e.delay } as React.CSSProperties)
                  : forced || (!run && staticLit)
                    ? glow
                    : undefined
              }
            />
          </g>
        );
      })}

      {/* labels */}
      <text x="180" y="114" textAnchor="middle" fontSize="9" fontFamily="monospace" fill={D}>
        experts · top-2
      </text>
    </Frame>
  );
}
