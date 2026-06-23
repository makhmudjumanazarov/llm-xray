"use client";

// 4 — Deep learning: a multi-layer perceptron (3→4→4→2) where stacked layers
// let depth build abstraction. Loop: an activation wavefront sweeps left→right,
// lighting each column in turn and flowing the edges feeding it. Interactive:
// hover any neuron to light it and its incoming + outgoing edges; everything not
// connected to it dims. Reset on pointer leave.

import { useState } from "react";
import { Frame, useLoopFlow, S, D, type EraVizProps } from "./_shared";

const COLS_X = [36, 96, 156, 210];
const COL_SIZES = [3, 4, 4, 2];

// Vertically center each column around y=60 with even spacing.
function nodeY(rows: number, row: number): number {
  const gap = 22;
  const top = 60 - ((rows - 1) * gap) / 2;
  return top + row * gap;
}

type Hover = { col: number; row: number } | null;

export function DeepLearningViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  const [hover, setHover] = useState<Hover>(null);

  // Edges between every adjacent pair (col c -> col c+1).
  const edges: { c: number; r0: number; r1: number }[] = [];
  for (let c = 0; c < COL_SIZES.length - 1; c++) {
    for (let r0 = 0; r0 < COL_SIZES[c]; r0++) {
      for (let r1 = 0; r1 < COL_SIZES[c + 1]; r1++) {
        edges.push({ c, r0, r1 });
      }
    }
  }

  // Is this edge connected to the hovered node (incoming or outgoing)?
  const edgeTouchesHover = (e: { c: number; r0: number; r1: number }): boolean => {
    if (!hover) return false;
    return (e.c === hover.col && e.r0 === hover.row) || (e.c + 1 === hover.col && e.r1 === hover.row);
  };

  // Is this node connected to the hovered node by a single edge (or is itself)?
  const nodeTouchesHover = (col: number, row: number): boolean => {
    if (!hover) return false;
    if (col === hover.col && row === hover.row) return true;
    if (col === hover.col - 1 || col === hover.col + 1) return true; // adjacent column
    return false;
  };

  return (
    <Frame
      label="Deep learning — multi-layer perceptron with an activation wavefront"
      flowRef={flowRef}
      onPointerLeave={() => setHover(null)}
    >
      {/* faint fully-connected edges between adjacent columns */}
      {edges.map((e, i) => {
        const x1 = COLS_X[e.c];
        const y1 = nodeY(COL_SIZES[e.c], e.r0);
        const x2 = COLS_X[e.c + 1];
        const y2 = nodeY(COL_SIZES[e.c + 1], e.r1);

        const lit = edgeTouchesHover(e);
        // While hovering, non-touching edges dim out.
        const dimmed = hover !== null && !lit;
        // Loop: edges feeding column c+1 flow when no hover is active.
        const flow = run && hover === null;

        return (
          <line
            key={`e${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={lit ? a : S}
            strokeWidth={lit ? 1.4 : 0.8}
            opacity={dimmed ? 0.12 : lit ? 0.95 : 0.32}
            className={flow ? "evo-dash" : undefined}
            style={
              flow
                ? ({ animationDelay: `${(e.c + 1) * 350}ms` } as React.CSSProperties)
                : undefined
            }
          />
        );
      })}

      {/* neuron columns; final (output) column tinted in the accent */}
      {COL_SIZES.map((rows, col) =>
        Array.from({ length: rows }, (_, row) => {
          const cx = COLS_X[col];
          const cy = nodeY(rows, row);
          const isOutput = col === COL_SIZES.length - 1;

          const isHovered = hover?.col === col && hover?.row === row;
          const connected = nodeTouchesHover(col, row);
          const dimmed = hover !== null && !connected;

          // Resting fill: output column lit in accent, others dim.
          const restFill = isOutput ? a : D;
          const fill = isHovered || (connected && !isHovered) ? a : restFill;

          // Loop wavefront: each column pulses in turn (no hover active).
          const wave = run && hover === null;

          return (
            <circle
              key={`n${col}-${row}`}
              cx={cx}
              cy={cy}
              r={isHovered ? 6 : 5}
              fill={fill}
              opacity={dimmed ? 0.18 : isOutput || isHovered || connected ? 0.95 : 0.6}
              stroke={isHovered ? a : "none"}
              strokeWidth={isHovered ? 1.2 : 0}
              className={wave ? "evo-pulse" : undefined}
              style={{
                cursor: "pointer",
                ...(wave ? { animationDelay: `${col * 350}ms` } : {}),
                ...(isHovered || (connected && hover)
                  ? { filter: `drop-shadow(0 0 4px color-mix(in oklab, ${a} 60%, transparent))` }
                  : {}),
              }}
              onPointerEnter={() => setHover({ col, row })}
            />
          );
        }),
      )}

      {/* layer tokens */}
      <text x={COLS_X[0]} y="108" textAnchor="middle" fontSize="8" fontFamily="monospace" fill={D}>
        x
      </text>
      <text x={COLS_X[1]} y="108" textAnchor="middle" fontSize="8" fontFamily="monospace" fill={D}>
        h1
      </text>
      <text x={COLS_X[2]} y="108" textAnchor="middle" fontSize="8" fontFamily="monospace" fill={D}>
        h2
      </text>
      <text x={COLS_X[3]} y="108" textAnchor="middle" fontSize="8" fontFamily="monospace" fill={a}>
        ŷ
      </text>
    </Frame>
  );
}
