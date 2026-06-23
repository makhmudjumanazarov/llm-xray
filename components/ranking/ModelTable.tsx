"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Model } from "@/core/model/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { compactNumber, params as fmtParams, contextLen, mmlu as fmtMmlu } from "@/core/shared/format";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { BENCHMARK_METRICS } from "@/core/benchmark/catalog";
import { aggregateScore } from "@/core/benchmark/score";

type SortKey = "downloads" | "likes" | "paramsB" | "context" | "layers" | "score" | "benchmark";

// Show this many rows up front; "load more" reveals another batch.
const PAGE_SIZE = 10;

const MODALITY_COLOR: Record<string, string> = {
  text: "text-acc border-acc/40",
  image: "text-vis border-vis/40",
  audio: "text-aud border-aud/40",
  video: "text-proj border-proj/40",
};

function sortValue(m: Model, key: SortKey, benchmarkId: string): number {
  switch (key) {
    case "downloads": return m.stats.downloads ?? 0;
    case "likes": return m.stats.likes ?? 0;
    case "paramsB": return m.paramsB ?? 0;
    case "context": return m.text.contextLen ?? 0;
    case "layers": return m.text.numLayers ?? 0;
    case "score": return aggregateScore(m) ?? -1;
    case "benchmark": return m.stats.benchmarks?.[benchmarkId] ?? -1;
  }
}

export function ModelTable({
  models,
  locale,
  dict,
}: {
  models: Model[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("");
  const [modality, setModality] = useState("");
  const [attention, setAttention] = useState("");
  const [moeOnly, setMoeOnly] = useState(false);
  const [benchmarkId, setBenchmarkId] = useState("mmlu");
  const [sortKey, setSortKey] = useState<SortKey>("downloads");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Seed filters from the URL so shared links, the WebSite SearchAction
  // (/models?q={term}) and the quick-filter preset cards land pre-filtered.
  // Reactive to the query string: clicking a preset chip while already on the
  // page is a soft navigation that does NOT remount this component, so we must
  // re-seed whenever the params change (not just on mount). Requires a
  // <Suspense> boundary in the parent for the prerendered route.
  const searchParams = useSearchParams();
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- URL-driven filter seed */
    setQ(searchParams.get("q") ?? "");
    setFamily(searchParams.get("family") ?? "");
    setModality(searchParams.get("modality") ?? "");
    setAttention(searchParams.get("attention") ?? "");
    setMoeOnly(searchParams.has("moe"));
    setVisible(PAGE_SIZE);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  const families = useMemo(
    () => Array.from(new Set(models.map((m) => m.family))).sort(),
    [models],
  );

  const benchmarkLabel =
    BENCHMARK_METRICS.find((b) => b.id === benchmarkId)?.label ?? benchmarkId;

  const rows = useMemo(() => {
    const filtered = models.filter((m) => {
      if (q && !`${m.name} ${m.id} ${m.family}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (family && m.family !== family) return false;
      if (modality && !m.modalities.includes(modality as Model["modalities"][number])) return false;
      if (attention && m.text.attentionType !== attention) return false;
      if (moeOnly && !m.text.moe) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => (sortValue(a, sortKey, benchmarkId) - sortValue(b, sortKey, benchmarkId)) * dir);
  }, [models, q, family, modality, attention, moeOnly, sortKey, sortDir, benchmarkId]);

  const shown = rows.slice(0, visible);

  function toggleSort(key: SortKey) {
    setVisible(PAGE_SIZE);
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const hasFilters = !!(q || family || modality || attention || moeOnly);
  function clearFilters() {
    setQ(""); setFamily(""); setModality(""); setAttention(""); setMoeOnly(false);
    setVisible(PAGE_SIZE);
  }
  // Any filter change collapses the list back to the first page.
  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setVisible(PAGE_SIZE);
  };

  const sortable = (key: SortKey, label: string, extra = "") => (
    <button
      onClick={() => toggleSort(key)}
      className={`flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-dim transition-colors hover:text-text ${extra}`}
    >
      {label}
      {sortKey === key ? (
        sortDir === "asc" ? (
          <ChevronUp size={12} className="text-acc" />
        ) : (
          <ChevronDown size={12} className="text-acc" />
        )
      ) : (
        <ChevronsUpDown size={12} className="text-dim/50" />
      )}
    </button>
  );

  const selectCls =
    "rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-text outline-none focus:border-border2";

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={q}
            onChange={(e) => onFilter(setQ)(e.target.value)}
            placeholder={dict.home.searchPlaceholder}
            className={`${selectCls} w-full pl-9`}
          />
        </div>
        <select value={family} onChange={(e) => onFilter(setFamily)(e.target.value)} className={selectCls}>
          <option value="">{dict.filters.family}: {dict.filters.all}</option>
          {families.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={modality} onChange={(e) => onFilter(setModality)(e.target.value)} className={selectCls}>
          <option value="">{dict.filters.modality}: {dict.filters.all}</option>
          {(["text", "image", "audio", "video"] as const).map((m) => (
            <option key={m} value={m}>{dict.modality[m]}</option>
          ))}
        </select>
        <select value={attention} onChange={(e) => onFilter(setAttention)(e.target.value)} className={selectCls}>
          <option value="">{dict.filters.attention}: {dict.filters.all}</option>
          {(["mha", "gqa", "mqa", "mla"] as const).map((a) => (
            <option key={a} value={a}>{dict.attentionType[a]}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-muted">
          <input type="checkbox" checked={moeOnly} onChange={(e) => onFilter(setMoeOnly)(e.target.checked)} />
          {dict.filters.moeOnly}
        </label>
        <select
          value={benchmarkId}
          onChange={(e) => {
            setBenchmarkId(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          className={selectCls}
          aria-label={dict.columns.benchmark}
        >
          {BENCHMARK_METRICS.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
      </div>

      <p className="mb-2 font-mono text-xs text-dim">
        {dict.home.resultsCount.replace("{count}", String(rows.length))}
      </p>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-card border border-border">
          <EmptyState
            icon={<Search size={22} />}
            title={dict.home.empty}
            action={
              hasFilters ? (
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border2 hover:text-text"
                >
                  {dict.filters.clear}
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-x-auto rounded-card border border-border">
            <table aria-label={dict.columns.model} className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
            <tr className="border-b border-border bg-panel2 text-left">
              <th className="px-3 py-2.5 font-mono text-[11px] uppercase text-dim">{dict.columns.rank}</th>
              <th className="px-3 py-2.5 font-mono text-[11px] uppercase text-dim">{dict.columns.model}</th>
              <th className="px-3 py-2.5">{sortable("paramsB", dict.columns.params)}</th>
              <th className="px-3 py-2.5">{sortable("context", dict.columns.context)}</th>
              <th className="px-3 py-2.5 font-mono text-[11px] uppercase text-dim">{dict.columns.attention}</th>
              <th className="px-3 py-2.5">{sortable("layers", dict.columns.layers)}</th>
              <th className="px-3 py-2.5">{sortable("downloads", dict.columns.downloads)}</th>
              <th className="px-3 py-2.5">{sortable("likes", dict.columns.likes)}</th>
              <th className="px-3 py-2.5">{sortable("score", dict.columns.score)}</th>
              <th className="px-3 py-2.5">{sortable("benchmark", benchmarkLabel)}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m, i) => (
              <tr
                key={m.slug}
                className="group border-b border-border/60 transition-colors last:border-0 hover:bg-panel"
              >
                <td className="px-3 py-3 font-mono text-xs text-dim">{i + 1}</td>
                <td className="px-3 py-3">
                  <Link href={`/${locale}/models/${m.slug}`} className="no-underline">
                    <div className="flex items-center gap-1.5 font-semibold text-text group-hover:text-acc">
                      {m.name}
                      {m.source.gated && (
                        <span
                          title={dict.model.gated}
                          aria-label={dict.model.gated}
                          className="inline-block h-2 w-2 shrink-0 rounded-full bg-aud"
                        />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] text-dim">{m.family}</span>
                      {m.modalities.map((mod) => (
                        <span
                          key={mod}
                          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${MODALITY_COLOR[mod] ?? "text-muted border-border"}`}
                        >
                          {dict.modality[mod]}
                        </span>
                      ))}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 font-mono text-muted">{fmtParams(m.paramsB)}</td>
                <td className="px-3 py-3 font-mono text-muted">{contextLen(m.text.contextLen)}</td>
                <td className="px-3 py-3">
                  <span className="rounded bg-acc2/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-acc">
                    {dict.attentionType[m.text.attentionType]}
                  </span>
                  {m.text.moe && (
                    <span className="ml-1 rounded bg-aud/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-aud">
                      MoE
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-muted">{m.text.numLayers}</td>
                <td className="px-3 py-3 font-mono text-muted">{compactNumber(m.stats.downloads)}</td>
                <td className="px-3 py-3 font-mono text-muted">{compactNumber(m.stats.likes)}</td>
                <td className="px-3 py-3 font-mono text-muted">{fmtMmlu(aggregateScore(m) ?? undefined)}</td>
                <td className="px-3 py-3 font-mono text-muted">{fmtMmlu(m.stats.benchmarks?.[benchmarkId])}</td>
              </tr>
            ))}
              </tbody>
            </table>
          </div>
          {/* Mobile affordance: right-edge fade hinting the table scrolls sideways. */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-card bg-gradient-to-l from-bg to-transparent sm:hidden"
            aria-hidden="true"
          />
        </div>
      )}

      {visible < rows.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-border2 hover:text-text"
          >
            {dict.home.loadMore.replace("{count}", String(rows.length - visible))}
          </button>
        </div>
      )}
    </div>
  );
}
