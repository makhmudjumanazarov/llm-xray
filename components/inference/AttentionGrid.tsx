"use client";

import { useState } from "react";

type AttnLabels = { caption: string; query: string; keys: string; masked: string };

/** Deterministic illustrative causal attention: each query attends to itself, a
 *  recency window, and the first token (an "attention sink"). Row-normalized so
 *  every query row is a real distribution. NOT real model weights. */
function causalWeights(n: number): number[][] {
  const W: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (j > i) {
        row.push(0);
        continue;
      }
      let w = Math.exp(-(i - j) * 0.6);
      if (j === 0) w += 0.5; // sink
      if (j === i) w += 0.4; // self
      row.push(w);
      sum += w;
    }
    W.push(row.map((w, j) => (j > i ? 0 : w / (sum || 1))));
  }
  return W;
}

const short = (t: string) => (t.length > 4 ? t.slice(0, 4) : t);

export function AttentionGrid({
  tokens,
  accentVar,
  labels,
}: {
  tokens: string[];
  accentVar: string;
  labels: AttnLabels;
}) {
  const n = Math.max(2, Math.min(tokens.length || 4, 8));
  const toks = (tokens.length ? tokens : ["The", "cat", "sat", "down"]).slice(0, n);
  const W = causalWeights(n);
  const [q, setQ] = useState(n - 1);
  const qActive = Math.min(q, n - 1); // prompt can shrink without remounting

  const cell = 20;
  const padL = 40;
  const padT = 18;
  const w = padL + n * cell;
  const h = padT + n * cell;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px]" role="img" aria-label={labels.caption}>
        {/* column (key) labels */}
        {toks.map((t, j) => (
          <text key={`c${j}`} x={padL + j * cell + cell / 2} y={padT - 5} textAnchor="middle" className="fill-dim" style={{ fontSize: 7, fontFamily: "var(--font-mono)" }}>
            {short(t)}
          </text>
        ))}
        {/* row (query) labels + cells */}
        {toks.map((tq, i) => (
          <g key={`r${i}`} onMouseEnter={() => setQ(i)}>
            <text
              x={padL - 5}
              y={padT + i * cell + cell / 2 + 2}
              textAnchor="end"
              style={{ fontSize: 7, fontFamily: "var(--font-mono)" }}
              className={i === qActive ? "fill-text" : "fill-dim"}
            >
              {short(tq)}
            </text>
            {toks.map((_, j) => {
              const masked = j > i;
              const weight = W[i][j];
              return (
                <rect
                  key={j}
                  x={padL + j * cell + 1}
                  y={padT + i * cell + 1}
                  width={cell - 2}
                  height={cell - 2}
                  rx={2}
                  fill={masked ? "transparent" : accentVar}
                  fillOpacity={masked ? 0 : 0.12 + weight * 0.88}
                  stroke={masked ? "var(--border)" : i === qActive ? "var(--text)" : "transparent"}
                  strokeOpacity={masked ? 0.4 : i === qActive ? 0.5 : 0}
                  strokeWidth={0.75}
                  strokeDasharray={masked ? "2 2" : undefined}
                />
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mt-1.5 font-mono text-[10px] leading-relaxed text-dim">{labels.caption}</div>
      <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[9px] text-dim">
        <span>↓ {labels.query}</span>
        <span>→ {labels.keys}</span>
        <span>⌧ {labels.masked}</span>
      </div>
    </div>
  );
}
