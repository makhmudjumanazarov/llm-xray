"use client";

import { useMemo } from "react";
import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { BENCHMARK_METRICS, type BenchmarkCategory } from "@/core/benchmark/catalog";

// Reuse the same family palette as the ranking scatter for visual consistency.
const FAMILY_COLORS = ["#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#3b82f6", "#fb7185", "#38bdf8"];

const CAT_ORDER: BenchmarkCategory[] = [
  "knowledge", "math", "code", "reasoning", "commonsense", "truthfulness", "instruction",
];

// Fixed coordinate space; the SVG scales responsively via viewBox.
const SIZE = 460;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 150; // radius for the 100 ring
const RINGS = [25, 50, 75, 100];

/** Per-category mean of a model's reported metrics (same idea as aggregateScore). */
function categoryMean(model: Model, cat: BenchmarkCategory): number | null {
  const b = model.stats.benchmarks;
  if (!b) return null;
  const vals = BENCHMARK_METRICS.filter((mt) => mt.category === cat)
    .map((mt) => b[mt.id])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, c) => a + c, 0) / vals.length;
}

/** Angle (radians) for axis i, starting at top (12 o'clock) and going clockwise. */
function angleFor(i: number, count: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / count;
}

function point(angle: number, radius: number): { x: number; y: number } {
  return { x: CX + Math.cos(angle) * radius, y: CY + Math.sin(angle) * radius };
}

export function BenchmarkRadar({ models, dict }: { models: Model[]; dict: Dictionary }) {
  const cats = dict.compare.categories as Record<string, string>;
  const families = useMemo(() => Array.from(new Set(models.map((m) => m.family))).sort(), [models]);
  const familyColor = (f: string) => FAMILY_COLORS[families.indexOf(f) % FAMILY_COLORS.length];

  const n = CAT_ORDER.length;

  const series = useMemo(
    () =>
      models.map((m) => ({
        model: m,
        color: familyColor(m.family),
        values: CAT_ORDER.map((cat) => categoryMean(m, cat)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [models, families],
  );

  return (
    <div className="rounded-card border border-border bg-panel p-4">
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full max-w-[460px]"
          role="img"
          aria-label={dict.compare.benchmarks}
        >
          {/* Concentric rings */}
          {RINGS.map((ring) => {
            const rr = (ring / 100) * R;
            const pts = CAT_ORDER.map((_, i) => {
              const p = point(angleFor(i, n), rr);
              return `${p.x},${p.y}`;
            }).join(" ");
            return (
              <polygon
                key={ring}
                points={pts}
                fill="none"
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />
            );
          })}

          {/* Spokes + axis labels */}
          {CAT_ORDER.map((cat, i) => {
            const angle = angleFor(i, n);
            const edge = point(angle, R);
            const label = point(angle, R + 22);
            const anchor = Math.abs(label.x - CX) < 8 ? "middle" : label.x > CX ? "start" : "end";
            return (
              <g key={cat}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={1}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className="fill-dim font-mono text-[10px] uppercase tracking-wide"
                >
                  {cats[cat]}
                </text>
              </g>
            );
          })}

          {/* One polygon per model. Missing categories collapse to center (0). */}
          {series.map((s) => {
            const pts = s.values
              .map((v, i) => {
                const rr = ((v ?? 0) / 100) * R;
                const p = point(angleFor(i, n), rr);
                return `${p.x},${p.y}`;
              })
              .join(" ");
            return (
              <g key={s.model.slug}>
                <polygon points={pts} fill={s.color} fillOpacity={0.18} stroke={s.color} strokeWidth={2} />
                {s.values.map((v, i) => {
                  if (v == null) return null;
                  const p = point(angleFor(i, n), (v / 100) * R);
                  return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={s.color} />;
                })}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <ul className="flex w-full flex-wrap gap-x-4 gap-y-2 lg:w-auto lg:flex-col">
          {series.map((s) => (
            <li key={s.model.slug} className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="text-xs font-semibold text-text">{s.model.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
