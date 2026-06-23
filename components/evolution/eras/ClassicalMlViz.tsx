"use client";

import { useState } from "react";
import { Frame, pointerFraction, useLoopFlow, S, D, type EraVizProps } from "./_shared";

// 1 — Classical ML: two labeled clusters split by a learned linear boundary.
// Loop: points reveal in turn; the max-margin guides breathe. Interactive: move
// the cursor left↔right to tilt the boundary — points recolor by predicted side
// and any the cut now gets wrong are flagged.

type Pt = { x: number; y: number };
const CLASS_A: Pt[] = [
  { x: 55, y: 38 }, { x: 78, y: 30 }, { x: 70, y: 55 }, { x: 48, y: 60 }, { x: 92, y: 46 },
];
const CLASS_B: Pt[] = [
  { x: 150, y: 78 }, { x: 172, y: 90 }, { x: 186, y: 66 }, { x: 160, y: 96 }, { x: 196, y: 84 },
];
const PIVOT = { x: 122, y: 64 };
const WRONG = "var(--full)"; // pink reads as "misclassified"

export function ClassicalMlViz({ a }: EraVizProps) {
  const [flowRef, run] = useLoopFlow();
  // null = resting boundary; a fraction tilts it as the cursor moves across.
  const [fx, setFx] = useState<number | null>(null);

  const deg = fx === null ? -38 : -62 + fx * 48;
  const t = (deg * Math.PI) / 180;
  const dx = Math.cos(t);
  const dy = Math.sin(t);
  const nx = -dy; // unit normal
  const ny = dx;
  const ext = 175;

  const line = (ox: number, oy: number) => ({
    x1: PIVOT.x + ox - ext * dx,
    y1: PIVOT.y + oy - ext * dy,
    x2: PIVOT.x + ox + ext * dx,
    y2: PIVOT.y + oy + ext * dy,
  });
  const boundary = line(0, 0);
  const mPlus = line(13 * nx, 13 * ny);
  const mMinus = line(-13 * nx, -13 * ny);

  // Predict "class A" on the negative side of the cut's normal.
  const predA = (p: Pt) => dx * (p.y - PIVOT.y) - dy * (p.x - PIVOT.x) < 0;
  const correctCount =
    CLASS_A.filter((p) => predA(p)).length + CLASS_B.filter((p) => !predA(p)).length;
  const total = CLASS_A.length + CLASS_B.length;

  return (
    <Frame
      label="Classical ML — learned decision boundary"
      flowRef={flowRef}
      onPointerMove={(e) => setFx(pointerFraction(e).fx)}
      onPointerLeave={() => setFx(null)}
    >
      {/* axes */}
      <line x1="20" y1="105" x2="225" y2="105" stroke={S} strokeWidth="1" />
      <line x1="22" y1="14" x2="22" y2="108" stroke={S} strokeWidth="1" />

      {/* max-margin guides — breathe to suggest the "widest gap" objective */}
      {[mPlus, mMinus].map((m, i) => (
        <line
          key={i}
          x1={m.x1}
          y1={m.y1}
          x2={m.x2}
          y2={m.y2}
          stroke={a}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.4"
          className={run ? "evo-pulse" : undefined}
        />
      ))}

      {/* the decision boundary — draws in once, then tracks the cursor */}
      <line
        key={run ? "drawn" : "static"}
        x1={boundary.x1}
        y1={boundary.y1}
        x2={boundary.x2}
        y2={boundary.y2}
        stroke={a}
        strokeWidth="2.5"
        className={run ? "evo-draw" : undefined}
        style={run ? ({ ["--evo-len" as string]: "360" } as React.CSSProperties) : undefined}
      />

      {/* class A — circles */}
      {CLASS_A.map((p, i) => {
        const ok = predA(p);
        return (
          <g key={`a${i}`} className={run ? "evo-reveal" : undefined} style={{ animationDelay: `${i * 60}ms` }}>
            {!ok && <circle cx={p.x} cy={p.y} r="8" fill="none" stroke={WRONG} strokeWidth="1.6" />}
            <circle cx={p.x} cy={p.y} r="5" fill={a} opacity="0.9" />
          </g>
        );
      })}

      {/* class B — squares */}
      {CLASS_B.map((p, i) => {
        const ok = !predA(p);
        return (
          <g
            key={`b${i}`}
            className={run ? "evo-reveal" : undefined}
            style={{ animationDelay: `${(i + CLASS_A.length) * 60}ms` }}
          >
            {!ok && <rect x={p.x - 7} y={p.y - 7} width="14" height="14" rx="2" fill="none" stroke={WRONG} strokeWidth="1.6" />}
            <rect x={p.x - 4} y={p.y - 4} width="8" height="8" rx="1.5" fill={D} opacity="0.85" />
          </g>
        );
      })}

      {/* live accuracy readout */}
      <text x="224" y="15" textAnchor="end" fontSize="10" fontFamily="monospace" fill={correctCount === total ? a : WRONG}>
        {correctCount}/{total} ✓
      </text>
    </Frame>
  );
}
