"use client";

// LLMs — a tall decoder-only stack that scales up. Loop: an activation packet
// rises from the embedding bar through ~6 decoder layers (lit bottom-to-top),
// the logits box blinks when it arrives, and a thin "scale" bar grows to convey
// bigger models. Interactive: hover a layer to lift/brighten it and reveal a
// "xN" tag (one of N repeated blocks); the others dim. Resets on pointer leave.

import { useState } from "react";
import { Frame, useLoopFlow, S, D, PANEL, type EraVizProps } from "./_shared";

const N_LAYERS = 6;
const BAR_X = 70;
const BAR_W = 96;
const BAR_H = 10;
const GAP = 2.5;
const STACK_TOP = 28; // y of the topmost layer bar
// Layers laid out bottom→top; index 0 is the bottom layer (just above embedding).
const LAYER_Y = (i: number) => STACK_TOP + (N_LAYERS - 1 - i) * (BAR_H + GAP);

const EMB_Y = STACK_TOP + N_LAYERS * (BAR_H + GAP) + 3; // embedding bar below stack
const LOGITS_Y = 12; // logits box at the very top

export function LlmsViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // Which layer the cursor is over (null = none).
  const [hover, setHover] = useState<number | null>(null);

  const litGlow = { filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` };

  return (
    <Frame
      label="LLMs — tall decoder stack that scales up"
      flowRef={flowRef}
      onPointerLeave={() => setHover(null)}
    >
      {/* embedding bar */}
      <rect
        x={BAR_X}
        y={EMB_Y}
        width={BAR_W}
        height={BAR_H}
        rx="2"
        fill={PANEL}
        stroke={S}
        strokeWidth="1"
      />
      <text
        x={BAR_X + BAR_W / 2}
        y={EMB_Y + BAR_H - 2.5}
        textAnchor="middle"
        fontSize="6.5"
        fontFamily="monospace"
        fill={D}
      >
        embedding
      </text>

      {/* decoder layer bars: opacity increases going up; lit in turn bottom→top */}
      {Array.from({ length: N_LAYERS }, (_, i) => {
        const y = LAYER_Y(i);
        const isHover = hover === i;
        const dimmed = hover !== null && !isHover;
        // Base opacity rises with height in the stack.
        const baseOpacity = 0.38 + (i / (N_LAYERS - 1)) * 0.5;
        const opacity = isHover ? 1 : dimmed ? baseOpacity * 0.45 : baseOpacity;
        return (
          <g
            key={i}
            onPointerEnter={() => setHover(i)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={isHover ? BAR_X - 3 : BAR_X}
              y={isHover ? y - 1 : y}
              width={isHover ? BAR_W + 6 : BAR_W}
              height={BAR_H}
              rx="2"
              fill={a}
              opacity={opacity}
              className={run && hover === null ? "evo-pulse" : undefined}
              style={
                isHover
                  ? litGlow
                  : run && hover === null
                    ? ({ animationDelay: `${i * 380}ms` } as React.CSSProperties)
                    : undefined
              }
            />
          </g>
        );
      })}

      {/* hover hint: "xN" tag lifting the hovered block */}
      {hover !== null && (
        <text
          x={BAR_X + BAR_W + 8}
          y={LAYER_Y(hover) + BAR_H - 2}
          fontSize="8"
          fontFamily="monospace"
          fill={a}
          style={litGlow}
        >
          {`x${N_LAYERS}`}
        </text>
      )}

      {/* activation packet rising from embedding to logits */}
      {run && hover === null && (
        <circle
          cx={BAR_X + BAR_W / 2}
          cy={EMB_Y}
          r="2.6"
          fill={a}
          className="evo-packet"
          style={
            {
              ["--evo-dx" as string]: "0px",
              ["--evo-dy" as string]: `${LOGITS_Y + 9 - EMB_Y}px`,
              ...litGlow,
            } as React.CSSProperties
          }
        />
      )}

      {/* logits box at the very top */}
      <rect
        x={BAR_X}
        y={LOGITS_Y}
        width={BAR_W}
        height={BAR_H + 1}
        rx="2"
        fill="none"
        stroke={a}
        strokeWidth="1.4"
        className={run && hover === null ? "evo-blink" : undefined}
        style={run && hover === null ? { animationDelay: `${N_LAYERS * 380}ms` } : undefined}
      />
      <text
        x={BAR_X + BAR_W / 2}
        y={LOGITS_Y + BAR_H - 2}
        textAnchor="middle"
        fontSize="7"
        fontFamily="monospace"
        fill={a}
      >
        logits
      </text>

      {/* scaling arrow on the right with rotated "params ↑" label */}
      <line x1="200" y1={EMB_Y + BAR_H} x2="200" y2={LOGITS_Y} stroke={S} strokeWidth="1" />
      <path d="M196 18 L200 11 L204 18 Z" fill={S} />
      {/* thin "scale" bar that grows to convey bigger models */}
      <rect
        x="208"
        y={LOGITS_Y}
        width="6"
        height={EMB_Y + BAR_H - LOGITS_Y}
        rx="1.5"
        fill={a}
        opacity="0.7"
        className={run && hover === null ? "evo-grow" : undefined}
        style={run && hover === null ? litGlow : undefined}
      />
      <text
        x="200"
        y="70"
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="monospace"
        fill={D}
        transform="rotate(-90 200 70)"
      >
        params ↑
      </text>
    </Frame>
  );
}
