"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Model } from "@/core/model/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BENCHMARK_METRICS, ARCH_ROWS, type BenchmarkCategory } from "@/core/benchmark/catalog";
import { params as fmtParams, contextLen, compactNumber } from "@/core/shared/format";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ShareButton } from "@/components/ui/ShareButton";
import { ModelPicker } from "./ModelPicker";
import { BenchmarkRadar } from "./BenchmarkRadar";

type BenchView = "table" | "radar";

const CAT_ORDER: BenchmarkCategory[] = [
  "knowledge", "math", "code", "reasoning", "commonsense", "truthfulness", "instruction",
];

function archValue(m: Model, id: string, dict: Dictionary): string {
  const t = m.text;
  switch (id) {
    case "paramsB": return fmtParams(m.paramsB);
    case "numLayers": return String(t.numLayers);
    case "hiddenSize": return String(t.hiddenSize);
    case "numHeads": return String(t.numHeads);
    case "numKVHeads": return String(t.numKVHeads);
    case "headDim": return String(t.headDim);
    case "contextLen": return contextLen(t.contextLen);
    case "intermediateSize": return compactNumber(t.intermediateSize);
    case "vocabSize": return compactNumber(t.vocabSize);
    case "attentionType": return dict.attentionType[t.attentionType];
    case "normType": return t.normType;
    case "activation": return t.activation;
    case "moe": return t.moe ? `${t.moe.numExperts} (top-${t.moe.topK})` : "—";
    default: return "—";
  }
}

export function CompareClient({
  models,
  locale,
  dict,
}: {
  models: Model[];
  locale: Locale;
  dict: Dictionary;
}) {
  // Default: first models (by downloads) that actually have benchmark data.
  const defaults = useMemo(() => {
    const withBench = models.filter((m) => m.stats.benchmarks?.mmlu != null).slice(0, 4);
    return (withBench.length >= 2 ? withBench : models.slice(0, 4)).map((m) => m.slug);
  }, [models]);

  const [selected, setSelected] = useState<string[]>(defaults);
  const [benchView, setBenchView] = useState<BenchView>("table");

  // Seed the selection from a shared permalink (?models=a,b,c&view=radar).
  // Same reactive pattern as ModelTable; requires <Suspense> in the parent.
  const searchParams = useSearchParams();
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- URL-driven seed */
    const fromUrl = (searchParams.get("models") ?? "")
      .split(",")
      .filter((s) => models.some((m) => m.slug === s));
    if (fromUrl.length > 0) setSelected(fromUrl);
    const view = searchParams.get("view");
    if (view === "radar" || view === "table") setBenchView(view);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, models]);

  // Written from handlers (never effects) so seeding and writing can't loop.
  function writeUrl(nextSelected: string[], nextView: BenchView) {
    const p = new URLSearchParams();
    if (nextSelected.join(",") !== defaults.join(",")) p.set("models", nextSelected.join(","));
    if (nextView !== "table") p.set("view", nextView);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const chosen = useMemo(
    () => selected.map((s) => models.find((m) => m.slug === s)).filter(Boolean) as Model[],
    [selected, models],
  );

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      writeUrl(next, benchView);
      return next;
    });
  }

  function changeView(view: BenchView) {
    setBenchView(view);
    writeUrl(selected, view);
  }

  const cats = dict.compare.categories as Record<string, string>;
  const modelLabels = dict.model as Record<string, string>;

  return (
    <div>
      {/* Model picker — foldered family → version → model (HF org/model format) */}
      <div className="mb-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-dim">{dict.compare.pick}</div>
        <ModelPicker models={models} selected={selected} onToggle={toggle} dict={dict} />
      </div>

      {chosen.length < 2 ? (
        <p className="rounded-card border border-border bg-panel p-4 text-sm text-dim">{dict.compare.need2}</p>
      ) : (
        <>
          {/* Benchmarks */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              {dict.compare.benchmarks}
            </h2>
            <div className="flex items-center gap-2">
              <SegmentedControl<BenchView>
                value={benchView}
                onChange={changeView}
                ariaLabel={dict.compare.benchmarks}
                options={[
                  { value: "table", label: dict.compare.tableView },
                  { value: "radar", label: dict.compare.radarView },
                ]}
              />
              <ShareButton title={dict.compare.title} dict={dict} />
            </div>
          </div>
          {benchView === "radar" ? (
            <BenchmarkRadar models={chosen} dict={dict} />
          ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-panel2 text-left">
                  <th className="sticky left-0 z-10 bg-panel2 px-3 py-2.5 font-mono text-[11px] uppercase text-dim">
                    {dict.compare.metric}
                  </th>
                  {chosen.map((m) => (
                    <th key={m.slug} className="px-3 py-2.5">
                      <Link href={`/${locale}/models/${m.slug}`} className="text-xs font-semibold text-text no-underline hover:text-acc">
                        {m.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAT_ORDER.map((cat) => {
                  const metrics = BENCHMARK_METRICS.filter((mt) => mt.category === cat);
                  return (
                    <CategoryBlock key={cat} label={cats[cat]} span={chosen.length + 1}>
                      {metrics.map((mt) => {
                        const vals = chosen.map((m) => m.stats.benchmarks?.[mt.id]);
                        const max = Math.max(...vals.map((v) => (typeof v === "number" ? v : 0)), 0);
                        return (
                          <tr key={mt.id} className="border-b border-border/50 last:border-0">
                            <td className="sticky left-0 z-10 bg-bg px-3 py-2.5">
                              <div className="font-mono text-xs font-semibold text-text">{mt.label}</div>
                              <div className="text-[10px] text-dim">{mt.name}</div>
                            </td>
                            {vals.map((v, i) => {
                              const isMax = typeof v === "number" && v === max && max > 0;
                              const pct = typeof v === "number" && max > 0 ? (v / max) * 100 : 0;
                              return (
                                <td key={chosen[i].slug} className="px-3 py-2.5 align-middle">
                                  <div className={`font-mono text-sm ${isMax ? "font-bold text-acc" : "text-muted"}`}>
                                    {typeof v === "number" ? v.toFixed(1) : "—"}
                                  </div>
                                  <div className="mt-1 h-1 w-full max-w-[120px] rounded bg-bg2">
                                    <div
                                      className={`h-1 rounded ${isMax ? "bg-acc" : "bg-acc2/60"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </CategoryBlock>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {/* Architecture */}
          <h2 className="mb-3 mt-8 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            {dict.compare.architecture}
          </h2>
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-panel2 text-left">
                  <th className="sticky left-0 z-10 bg-panel2 px-3 py-2.5 font-mono text-[11px] uppercase text-dim">
                    {dict.compare.metric}
                  </th>
                  {chosen.map((m) => (
                    <th key={m.slug} className="px-3 py-2.5 text-xs font-semibold text-text">{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARCH_ROWS.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="sticky left-0 z-10 bg-bg px-3 py-2.5 font-mono text-xs text-dim">
                      {modelLabels[row.labelKey] ?? row.labelKey}
                    </td>
                    {chosen.map((m) => (
                      <td key={m.slug} className="px-3 py-2.5 font-mono text-sm text-muted">
                        {archValue(m, row.id, dict)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-dim">{dict.compare.disclaimer}</p>
        </>
      )}
    </div>
  );
}

function CategoryBlock({
  label,
  span,
  children,
}: {
  label: string;
  span: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="bg-bg2/60">
        <td colSpan={span} className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dim">
          {label}
        </td>
      </tr>
      {children}
    </>
  );
}
