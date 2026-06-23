"use client";

import { useState } from "react";
import { Frame, useLoopFlow, S, D, PANEL, type EraVizProps } from "./_shared";

// 5 — Transformers: one query token attends to every token at once. Curved arcs
// fan from the query up-and-over to all tokens; each weight pulses with strength
// set by distance (nearer = stronger). Interactive: click any token to make IT
// the query — arcs re-originate and re-weight instantly. The query token breathes.

const XS = [40, 90, 140, 190];
const TOK_Y = 92;
const N = XS.length;

// Arc from the query token over to a target token: up-and-over quadratic curve.
function arcPath(qx: number, tx: number): { d: string; len: number } {
  const span = Math.abs(tx - qx);
  const ctrlY = TOK_Y - 28 - span * 0.16; // higher peak for longer reach
  const cx = (qx + tx) / 2;
  const d = `M ${qx} ${TOK_Y - 9} Q ${cx} ${ctrlY} ${tx} ${TOK_Y - 9}`;
  const len = Math.max(30, span * 1.3 + (TOK_Y - 9 - ctrlY) * 1.7);
  return { d, len };
}

export function TransformersViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // which token is the query (click to set); starts at the first token.
  const [query, setQuery] = useState(0);
  // hover preview overrides the query non-destructively; clears on leave.
  const [hover, setHover] = useState<number | null>(null);

  const qi = hover ?? query;
  const qx = XS[qi];
  const glow = `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))`;

  // attention weight: nearer tokens (by index distance) attend more strongly.
  const weight = (i: number) => 1 - Math.abs(i - qi) / N; // 1.0 at self → falls off

  return (
    <Frame
      label="Transformer self-attention — one query attends to every token"
      flowRef={flowRef}
    >
      {/* top label */}
      <text x="120" y="20" textAnchor="middle" fontSize="10" fontFamily="monospace" fill={a}>
        softmax(QKᵀ)·V
      </text>

      {/* sequence baseline */}
      <line x1="24" y1={TOK_Y + 14} x2="216" y2={TOK_Y + 14} stroke={S} strokeWidth="1" />

      {/* attention arcs from the query to every token */}
      {XS.map((tx, i) => {
        const { d, len } = arcPath(qx, tx);
        const w = weight(i);
        if (i === qi) return null; // self-arc would be degenerate; query breathes instead
        return (
          <path
            key={`arc-${qi}-${i}`}
            d={d}
            fill="none"
            stroke={a}
            strokeWidth={0.8 + w * 2.4}
            opacity={0.35 + w * 0.55}
            strokeLinecap="round"
            className={run ? "evo-dash" : undefined}
            style={
              run
                ? ({ animationDelay: `${i * 90}ms`, filter: glow } as React.CSSProperties)
                : ({ filter: glow } as React.CSSProperties)
            }
          />
        );
      })}

      {/* per-token attention-weight pips above each token, strength by width/opacity */}
      {XS.map((tx, i) => {
        const w = weight(i);
        if (i === qi) return null;
        return (
          <rect
            key={`w-${qi}-${i}`}
            x={tx - (2 + w * 6)}
            y={TOK_Y - 22}
            width={4 + w * 12}
            height="3"
            rx="1.5"
            fill={a}
            opacity={0.4 + w * 0.6}
            className={run ? "evo-pulse" : undefined}
            style={run ? ({ animationDelay: `${i * 120}ms` } as React.CSSProperties) : undefined}
          />
        );
      })}

      {/* tokens t1..t4 — clickable; the query is filled in the accent and breathes */}
      {XS.map((tx, i) => {
        const isQuery = i === qi;
        const isPinned = i === query;
        return (
          <g
            key={`tok-${i}`}
            style={{ cursor: "pointer" }}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onPointerDown={() => setQuery(i)}
          >
            {/* generous transparent hit target */}
            <rect x={tx - 14} y={TOK_Y - 16} width="28" height="32" fill="transparent" />
            <rect
              x={tx - 11}
              y={TOK_Y - 9}
              width="22"
              height="18"
              rx="4"
              fill={isQuery ? a : PANEL}
              stroke={isQuery ? a : isPinned ? a : S}
              strokeWidth={isQuery ? 1.5 : 1}
              opacity={isQuery ? 1 : 0.9}
              className={isQuery && run ? "evo-breathe" : undefined}
              style={isQuery ? ({ filter: glow } as React.CSSProperties) : undefined}
            />
            <text
              x={tx}
              y={TOK_Y + 4}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill={isQuery ? "var(--bg2)" : D}
            >
              t{i + 1}
            </text>
          </g>
        );
      })}

      {/* query marker token glyph */}
      <text x="216" y="20" textAnchor="end" fontSize="9" fontFamily="monospace" fill={a}>
        q=t{qi + 1}
      </text>
    </Frame>
  );
}
