"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Model } from "@/core/model/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { compactNumber, params as fmtParams, contextLen, mmlu as fmtMmlu } from "@/core/shared/format";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "@/components/ui/icons";

type SortKey = "downloads" | "likes" | "paramsB" | "context" | "layers" | "mmlu";

const MODALITY_COLOR: Record<string, string> = {
  text: "text-acc border-acc/40",
  image: "text-vis border-vis/40",
  audio: "text-aud border-aud/40",
  video: "text-proj border-proj/40",
};

function sortValue(m: Model, key: SortKey): number {
  switch (key) {
    case "downloads": return m.stats.downloads ?? 0;
    case "likes": return m.stats.likes ?? 0;
    case "paramsB": return m.paramsB ?? 0;
    case "context": return m.text.contextLen ?? 0;
    case "layers": return m.text.numLayers ?? 0;
    case "mmlu": return m.stats.benchmarks?.mmlu ?? -1;
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
  const [sortKey, setSortKey] = useState<SortKey>("downloads");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const families = useMemo(
    () => Array.from(new Set(models.map((m) => m.family))).sort(),
    [models],
  );

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
    return filtered.sort((a, b) => (sortValue(a, sortKey) - sortValue(b, sortKey)) * dir);
  }, [models, q, family, modality, attention, moeOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

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
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.home.searchPlaceholder}
            className={`${selectCls} w-full pl-9`}
          />
        </div>
        <select value={family} onChange={(e) => setFamily(e.target.value)} className={selectCls}>
          <option value="">{dict.filters.family}: {dict.filters.all}</option>
          {families.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={modality} onChange={(e) => setModality(e.target.value)} className={selectCls}>
          <option value="">{dict.filters.modality}: {dict.filters.all}</option>
          {(["text", "image", "audio", "video"] as const).map((m) => (
            <option key={m} value={m}>{dict.modality[m]}</option>
          ))}
        </select>
        <select value={attention} onChange={(e) => setAttention(e.target.value)} className={selectCls}>
          <option value="">{dict.filters.attention}: {dict.filters.all}</option>
          {(["mha", "gqa", "mqa", "mla"] as const).map((a) => (
            <option key={a} value={a}>{dict.attentionType[a]}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-muted">
          <input type="checkbox" checked={moeOnly} onChange={(e) => setMoeOnly(e.target.checked)} />
          {dict.filters.moeOnly}
        </label>
      </div>

      <p className="mb-2 font-mono text-xs text-dim">
        {dict.home.resultsCount.replace("{count}", String(rows.length))}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[860px] border-collapse text-sm">
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
              <th className="px-3 py-2.5">{sortable("mmlu", dict.columns.benchmark)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr
                key={m.slug}
                className="group border-b border-border/60 transition-colors last:border-0 hover:bg-panel"
              >
                <td className="px-3 py-3 font-mono text-xs text-dim">{i + 1}</td>
                <td className="px-3 py-3">
                  <Link href={`/${locale}/models/${m.slug}`} className="no-underline">
                    <div className="font-semibold text-text group-hover:text-acc">{m.name}</div>
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
                <td className="px-3 py-3 font-mono text-muted">{fmtMmlu(m.stats.benchmarks?.mmlu)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-dim">{dict.home.empty}</p>
        )}
      </div>
    </div>
  );
}
