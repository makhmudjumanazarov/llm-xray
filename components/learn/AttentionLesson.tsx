"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ATTENTION } from "@/core/learn/attention/data";
import { LessonCard } from "./LessonCard";

const FORMULA = "\\mathrm{Attention}(Q,K,V) = \\mathrm{softmax}\\!\\left(\\tfrac{QK^\\top}{\\sqrt{d_k}}\\right)V";

const disp = (t: string) => t.replace(/ /g, "·");
const short = (t: string) => {
  const d = disp(t);
  return d.length > 5 ? d.slice(0, 5) : d;
};

// Heatmap ramp: dark slate → cyan (--proj), power-law for perceptual spread.
const RAMP_LOW = [15, 23, 42];
const RAMP_HIGH = [34, 211, 238];
function heatColor(w: number): string {
  const t = Math.min(1, Math.pow(Math.max(0, w), 0.55) * 1.15);
  return `rgb(${RAMP_LOW.map((v, k) => Math.round(v + (RAMP_HIGH[k] - v) * t)).join(",")})`;
}

function avgHeads(layer: number[][][]): number[][] {
  const H = layer.length;
  const S = layer[0].length;
  const m = Array.from({ length: S }, () => new Array<number>(S).fill(0));
  for (let h = 0; h < H; h++) for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) m[i][j] += layer[h][i][j] / H;
  return m;
}

export function AttentionLesson({ dict }: { dict: Dictionary }) {
  const expert = true;
  const L = dict.learn.attention;
  const D = ATTENTION;
  const [exIdx, setExIdx] = useState(0);
  const [layer, setLayer] = useState(0);
  const [head, setHead] = useState(-1); // -1 = average over heads
  const [q, setQ] = useState(0);

  const ex = D.examples[exIdx];
  const S = ex.tokens.length;
  const matrix = useMemo(() => {
    const lay = ex.attentions[layer];
    return head >= 0 ? lay[head] : avgHeads(lay);
  }, [ex, layer, head]);
  const qi = Math.min(q, S - 1);

  const cell = 16;
  const padL = 42;
  const padT = 30; // headroom for rotated column labels
  const hmW = padL + S * cell;
  const hmH = padT + S * cell;

  const rowH = 24;
  const bxL = 56;
  const bxR = 244;
  const bW = 300;
  const bH = S * rowH + 24;

  const realData = L.realData
    .replace("{model}", D.model)
    .replace("{layers}", String(D.numLayers))
    .replace("{heads}", String(D.numHeads));

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText} formula={FORMULA}>
      <div className="font-mono text-[11px] text-dim">{realData}</div>

      {/* controls */}
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{L.sentence}</span>
          <SegmentedControl
            ariaLabel={L.sentence}
            value={String(exIdx)}
            onChange={(v) => {
              setExIdx(+v);
              setQ(0);
            }}
            options={D.examples.map((e, i) => ({ value: String(i), label: e.tokens.slice(0, 2).map(disp).join("") + "…" }))}
          />
        </div>
        <label className="block">
          <div className="mb-1 flex items-center justify-between font-mono text-xs">
            <span className="text-muted">{L.layer}</span>
            <span className="text-acc">
              {layer} / {D.numLayers - 1}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={D.numLayers - 1}
            step={1}
            value={layer}
            onChange={(e) => setLayer(+e.target.value)}
            aria-label={L.layer}
            className="w-full accent-[var(--acc2)]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 font-mono text-[11px] uppercase tracking-wide text-dim">{L.head}</span>
          {[-1, ...Array.from({ length: D.numHeads }, (_, h) => h)].map((h) => {
            const on = head === h;
            return (
              <button
                key={h}
                onClick={() => setHead(h)}
                aria-pressed={on}
                className="rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors"
                style={{
                  borderColor: on ? "var(--acc-700)" : "var(--border)",
                  background: on ? "var(--acc-700)" : "transparent",
                  color: on ? "#fff" : "var(--muted)",
                }}
              >
                {h < 0 ? L.headAvg : h}
              </button>
            );
          })}
        </div>
      </div>

      {/* heatmap + flow */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-1 font-mono text-[10px] text-dim">
            {L.rows} · {L.cols}
          </div>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${hmW} ${hmH}`} width="100%" style={{ maxWidth: hmW * 2.2 }} role="img" aria-label={L.title}>
              {ex.tokens.map((t, j) => {
                const cx = padL + j * cell + cell / 2;
                return (
                  <text
                    key={`c${j}`}
                    x={cx}
                    y={padT - 6}
                    textAnchor="end"
                    transform={`rotate(-45 ${cx} ${padT - 6})`}
                    className="fill-dim"
                    style={{ fontSize: 6.5, fontFamily: "var(--font-mono)" }}
                  >
                    {short(t)}
                  </text>
                );
              })}
              {ex.tokens.map((tq, i) => (
                <g
                  key={`r${i}`}
                  role="button"
                  tabIndex={0}
                  aria-label={disp(tq)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setQ(i)}
                  onFocus={() => setQ(i)}
                  onClick={() => setQ(i)}
                >
                  <text x={padL - 4} y={padT + i * cell + cell / 2 + 2} textAnchor="end" style={{ fontSize: 6.5, fontFamily: "var(--font-mono)" }} className={i === qi ? "fill-text" : "fill-dim"}>
                    {short(tq)}
                  </text>
                  {ex.tokens.map((_, j) => {
                    const masked = j > i;
                    return (
                      <rect
                        key={j}
                        x={padL + j * cell + 0.5}
                        y={padT + i * cell + 0.5}
                        width={cell - 1}
                        height={cell - 1}
                        rx={1.5}
                        fill={masked ? "transparent" : heatColor(matrix[i][j])}
                        stroke={i === qi && !masked ? "var(--text)" : masked ? "var(--border)" : "transparent"}
                        strokeOpacity={i === qi && !masked ? 0.5 : masked ? 0.25 : 0}
                        strokeWidth={0.6}
                        strokeDasharray={masked ? "1.5 1.5" : undefined}
                      >
                        {!masked && <title>{`${disp(ex.tokens[i])} → ${disp(ex.tokens[j])}: ${matrix[i][j].toFixed(3)}`}</title>}
                      </rect>
                    );
                  })}
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-dim">
            <span>{L.low}</span>
            <span className="inline-block h-2 w-16 rounded-sm" style={{ background: "linear-gradient(90deg, rgb(15,23,42), rgb(34,211,238))" }} aria-hidden="true" />
            <span>{L.high}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-1 font-mono text-[10px] text-dim">{L.flowHint}</div>
          <svg viewBox={`0 0 ${bW} ${bH}`} width="100%" role="img" aria-label={L.flowHint}>
            {ex.tokens.map((_, j) => {
              if (j > qi) return null;
              const w = matrix[qi][j];
              if (w < 0.02) return null;
              const y1 = 12 + qi * rowH + rowH / 2;
              const y2 = 12 + j * rowH + rowH / 2;
              const op = Math.min(0.95, Math.pow(w, 0.5) * 1.1);
              const sw = 0.6 + w * 7;
              return (
                <path
                  key={j}
                  d={`M ${bxL} ${y1} C ${(bxL + bxR) / 2} ${y1}, ${(bxL + bxR) / 2} ${y2}, ${bxR} ${y2}`}
                  fill="none"
                  stroke="var(--proj)"
                  strokeOpacity={op}
                  strokeWidth={sw}
                />
              );
            })}
            {ex.tokens.map((t, i) => {
              const y = 12 + i * rowH + rowH / 2;
              return (
                <g key={i}>
                  <text
                    x={bxL - 6}
                    y={y + 2}
                    textAnchor="end"
                    style={{ fontSize: 7, fontFamily: "var(--font-mono)", cursor: "pointer" }}
                    className={i === qi ? "fill-text" : i <= qi ? "fill-muted" : "fill-dim"}
                    onMouseEnter={() => setQ(i)}
                    onClick={() => setQ(i)}
                  >
                    {short(t)}
                  </text>
                  <text x={bxR + 6} y={y + 2} textAnchor="start" style={{ fontSize: 7, fontFamily: "var(--font-mono)" }} className={i <= qi ? "fill-muted" : "fill-dim"}>
                    {short(t)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </LessonCard>
  );
}
