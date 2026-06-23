"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Model } from "@/core/model/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BENCHMARK_METRICS } from "@/core/benchmark/catalog";
import { params as fmtParams, compactNumber } from "@/core/shared/format";

const FAMILY_COLORS = ["#a78bfa", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#3b82f6", "#fb7185", "#38bdf8"];

// Plot geometry (fixed coordinate space; SVG scales responsively).
const W = 920;
const H = 460;
const M = { top: 24, right: 24, bottom: 44, left: 48 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const log10 = (x: number) => Math.log(x) / Math.LN10;

type XKey = "paramsB" | "contextLen" | "numLayers";
type SizeKey = "downloads" | "likes";

export function ModelScatter({
  models,
  locale,
  dict,
}: {
  models: Model[];
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [metric, setMetric] = useState("mmlu");
  const [xKey, setXKey] = useState<XKey>("paramsB");
  const [sizeKey, setSizeKey] = useState<SizeKey>("downloads");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [hover, setHover] = useState<string | null>(null);

  const families = useMemo(() => Array.from(new Set(models.map((m) => m.family))).sort(), [models]);
  const familyColor = (f: string) => FAMILY_COLORS[families.indexOf(f) % FAMILY_COLORS.length];

  const isLogX = xKey === "paramsB";
  const xValue = (m: Model): number =>
    xKey === "paramsB" ? m.paramsB : xKey === "contextLen" ? m.text.contextLen : m.text.numLayers;
  const sizeValue = (m: Model): number => (sizeKey === "downloads" ? m.stats.downloads : m.stats.likes);

  // Metrics that at least 2 models report (so the axis is meaningful).
  const metricOptions = useMemo(
    () =>
      BENCHMARK_METRICS.filter(
        (mt) => models.filter((m) => m.stats.benchmarks?.[mt.id] != null).length >= 2,
      ),
    [models],
  );

  const points = useMemo(() => {
    const rows = models
      .filter((m) => xValue(m) > 0 && m.stats.benchmarks?.[metric] != null)
      .map((m) => ({
        m,
        x: xValue(m),
        y: m.stats.benchmarks![metric] as number,
        dl: sizeValue(m),
        match: familyFilter === "all" || m.family === familyFilter,
      }));
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, metric, xKey, sizeKey, familyFilter]);

  const scales = useMemo(() => {
    if (!points.length) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const dls = points.map((p) => p.dl);
    const xMin = isLogX ? Math.min(...xs) * 0.8 : Math.min(...xs);
    const xMax = isLogX ? Math.max(...xs) * 1.25 : Math.max(...xs);
    const yMin = Math.max(0, Math.min(...ys) - 8);
    const yMax = Math.min(100, Math.max(...ys) + 6);
    const dlMax = Math.max(...dls, 1);
    const xScale = isLogX
      ? (v: number) => M.left + ((log10(v) - log10(xMin)) / (log10(xMax) - log10(xMin) || 1)) * PW
      : (v: number) => M.left + ((v - xMin) / (xMax - xMin || 1)) * PW;
    const yScale = (v: number) => M.top + PH - ((v - yMin) / (yMax - yMin || 1)) * PH;
    const rScale = (v: number) => 5 + Math.sqrt(v / dlMax) * 18;
    return { xScale, yScale, rScale, xMin, xMax, yMin, yMax };
  }, [points, isLogX]);

  // Efficient frontier: maximize benchmark while minimizing params (upper-left staircase).
  const frontier = useMemo(() => {
    if (!scales) return [];
    const sorted = points.filter((p) => p.match).sort((a, b) => a.x - b.x);
    let best = -Infinity;
    const f: typeof sorted = [];
    for (const p of sorted) {
      if (p.y > best) {
        best = p.y;
        f.push(p);
      }
    }
    return f;
  }, [points, scales]);

  if (!scales) return null;
  const { xScale, yScale, rScale, yMin, yMax } = scales;

  const xTicks = isLogX
    ? [0.1, 0.3, 1, 3, 10, 30, 100].filter((t) => t >= scales.xMin && t <= scales.xMax)
    : Array.from({ length: 5 }, (_, i) => Math.round(scales.xMin + ((scales.xMax - scales.xMin) / 4) * i));
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(yMin + ((yMax - yMin) / 4) * i));
  const hovered = hover ? points.find((p) => p.m.slug === hover) : null;

  return (
    <div className="elev animate-rise rounded-card border border-border bg-panel/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-text">{dict.scatter.title}</h2>
          <p className="mt-0.5 text-xs text-dim">{dict.scatter.hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            {dict.scatter.xBy}
            <select
              value={xKey}
              onChange={(e) => setXKey(e.target.value as XKey)}
              className="rounded-lg border border-border bg-panel px-2 py-1.5 text-sm text-text outline-none focus:border-border2"
            >
              <option value="paramsB">{dict.columns.params}</option>
              <option value="contextLen">{dict.columns.context}</option>
              <option value="numLayers">{dict.columns.layers}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            {dict.scatter.yAxis}
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="rounded-lg border border-border bg-panel px-2 py-1.5 text-sm text-text outline-none focus:border-border2"
            >
              {metricOptions.map((mt) => (
                <option key={mt.id} value={mt.id}>{mt.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            {dict.scatter.sizeBy}
            <select
              value={sizeKey}
              onChange={(e) => setSizeKey(e.target.value as SizeKey)}
              className="rounded-lg border border-border bg-panel px-2 py-1.5 text-sm text-text outline-none focus:border-border2"
            >
              <option value="downloads">{dict.columns.downloads}</option>
              <option value="likes">{dict.columns.likes}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            {dict.scatter.family}
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="rounded-lg border border-border bg-panel px-2 py-1.5 text-sm text-text outline-none focus:border-border2"
            >
              <option value="all">{dict.filters.all}</option>
              {families.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ aspectRatio: `${W} / ${H}` }} role="img">
        {/* grid + y ticks */}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={W - M.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--border)" strokeWidth={1} opacity={0.5} />
            <text x={M.left - 8} y={yScale(t) + 4} textAnchor="end" className="fill-dim font-mono" fontSize={11}>{t}</text>
          </g>
        ))}
        {/* x ticks (log) */}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={xScale(t)} y={H - M.bottom + 20} textAnchor="middle" className="fill-dim font-mono" fontSize={11}>
            {isLogX ? (t < 1 ? t : `${t}B`) : compactNumber(t)}
          </text>
        ))}
        <text x={M.left + PW / 2} y={H - 6} textAnchor="middle" className="fill-muted font-mono" fontSize={11}>
          {xKey === "paramsB"
            ? dict.scatter.xAxis
            : xKey === "contextLen"
              ? dict.columns.context
              : dict.columns.layers}
        </text>

        {/* efficient frontier */}
        {frontier.length > 1 && (
          <polyline
            points={frontier.map((p) => `${xScale(p.x)},${yScale(p.y)}`).join(" ")}
            fill="none"
            stroke="var(--acc)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.6}
          />
        )}

        {/* points */}
        {points.map((p) => {
          const active = hover === p.m.slug;
          return (
            <circle
              key={p.m.slug}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={rScale(p.dl)}
              fill={familyColor(p.m.family)}
              fillOpacity={p.match ? (active ? 0.85 : 0.5) : 0.08}
              stroke={familyColor(p.m.family)}
              strokeWidth={active ? 2 : 1}
              strokeOpacity={p.match ? 1 : 0.2}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHover(p.m.slug)}
              onMouseLeave={() => setHover((h) => (h === p.m.slug ? null : h))}
              onClick={() => router.push(`/${locale}/models/${p.m.slug}`)}
            />
          );
        })}

        {/* hover label */}
        {hovered && (
          <g pointerEvents="none">
            <text
              x={Math.min(W - M.right - 4, xScale(hovered.x) + 12)}
              y={yScale(hovered.y) - 10}
              textAnchor={xScale(hovered.x) > W - 160 ? "end" : "start"}
              className="fill-text font-display"
              fontSize={14}
              fontWeight={700}
            >
              {hovered.m.name}
            </text>
            <text
              x={Math.min(W - M.right - 4, xScale(hovered.x) + 12)}
              y={yScale(hovered.y) + 6}
              textAnchor={xScale(hovered.x) > W - 160 ? "end" : "start"}
              className="fill-muted font-mono"
              fontSize={11}
            >
              {xKey === "paramsB" ? fmtParams(hovered.m.paramsB) : compactNumber(hovered.x)} · {hovered.y.toFixed(1)} · {compactNumber(hovered.dl)} {sizeKey === "downloads" ? "↓" : "♥"}
            </text>
          </g>
        )}
      </svg>

      {/* family legend */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {families.map((f) => (
          <span key={f} className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: familyColor(f) }} />
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
