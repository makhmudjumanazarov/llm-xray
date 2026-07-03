"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  estimateMemory,
  memoryInputFrom,
  isCacheFree,
  type AssumptionId,
} from "@/core/memory/estimate";
import { QUANT_PRESETS, DEFAULT_QUANT, quantById, type QuantId } from "@/core/memory/quant";
import { GPU_PRESETS, DEFAULT_GPU_ID, CUSTOM_GPU_ID, gpuById, usableBytes, type GpuVendor } from "@/core/memory/gpus";
import { verdictFor } from "@/core/memory/verdict";
import { contextLen as fmtCtx } from "@/core/shared/format";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ModelSelect } from "./ModelSelect";
import { VerdictCard } from "./VerdictCard";
import { MemoryBar } from "./MemoryBar";
import { GpuMatrix } from "./GpuMatrix";

const DEFAULT_CTX = 8192;
const VENDORS: GpuVendor[] = ["consumer", "datacenter", "apple"];

function tpl(s: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    // min-w-0 keeps wide children (the quant control) from stretching the grid column.
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-dim">{label}</div>
      {children}
    </div>
  );
}

export function CalculatorClient({ models, dict }: { models: Model[]; dict: Dictionary }) {
  const c = dict.calculator;
  const byDownloads = useMemo(
    () => [...models].sort((a, b) => (b.stats.downloads ?? 0) - (a.stats.downloads ?? 0)),
    [models],
  );
  const defaultSlug = byDownloads[0]?.slug ?? "";

  const [slug, setSlug] = useState(defaultSlug);
  const [quant, setQuant] = useState<QuantId>(DEFAULT_QUANT);
  const [ctx, setCtx] = useState(DEFAULT_CTX);
  const [batch, setBatch] = useState(1);
  const [gpuId, setGpuId] = useState(DEFAULT_GPU_ID);
  const [customVram, setCustomVram] = useState(24);

  // Seed from the URL so deep links (?model=&quant=&ctx=&batch=&gpu=&vram=)
  // land pre-configured — same reactive pattern as the ranking ModelTable.
  const searchParams = useSearchParams();
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- URL-driven seed */
    const m = searchParams.get("model");
    if (m && models.some((x) => x.slug === m)) setSlug(m);
    const q = searchParams.get("quant");
    if (q && quantById(q)) setQuant(q as QuantId);
    const cx = Number(searchParams.get("ctx"));
    if (Number.isFinite(cx) && cx >= 512) setCtx(cx);
    const b = Number(searchParams.get("batch"));
    if (Number.isInteger(b) && b >= 1 && b <= 64) setBatch(b);
    const g = searchParams.get("gpu");
    if (g && (gpuById(g) || g === CUSTOM_GPU_ID)) setGpuId(g);
    const vr = Number(searchParams.get("vram"));
    if (Number.isFinite(vr) && vr >= 1 && vr <= 2048) setCustomVram(vr);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, models]);

  // Shareable URL: write non-default settings back without a server round-trip.
  const writeUrl = (next: Partial<Record<"model" | "quant" | "gpu", string> & Record<"ctx" | "batch" | "vram", number>>) => {
    const s = { model: slug, quant, ctx, batch, gpu: gpuId, vram: customVram, ...next };
    const p = new URLSearchParams();
    if (s.model !== defaultSlug) p.set("model", s.model);
    if (s.quant !== DEFAULT_QUANT) p.set("quant", s.quant);
    if (s.ctx !== DEFAULT_CTX) p.set("ctx", String(s.ctx));
    if (s.batch !== 1) p.set("batch", String(s.batch));
    if (s.gpu !== DEFAULT_GPU_ID) p.set("gpu", s.gpu);
    if (s.gpu === CUSTOM_GPU_ID) p.set("vram", String(s.vram));
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const model = models.find((m) => m.slug === slug) ?? byDownloads[0];
  const input = useMemo(() => memoryInputFrom(model), [model]);
  const cacheFree = isCacheFree(model.text);
  const modelCtx = model.text.contextLen;

  // Discrete log2 context steps up to the model's own limit.
  const ctxSteps = useMemo(() => {
    const steps: number[] = [];
    for (let v = 512; v <= modelCtx; v *= 2) steps.push(v);
    if (modelCtx > 0 && steps[steps.length - 1] !== modelCtx) steps.push(modelCtx);
    return steps.length ? steps : [DEFAULT_CTX];
  }, [modelCtx]);
  const effCtx = ctxSteps.reduce((best, s) => (s <= ctx ? s : best), ctxSteps[0]);

  const gpu = gpuById(gpuId);
  const usable = gpu ? usableBytes(gpu.vramGB, gpu.usableFraction) : usableBytes(customVram);
  const gpuName = gpu?.name ?? `${customVram} GB`;

  const estimate = estimateMemory(input, { quant, contextLen: cacheFree ? 0 : effCtx, batch });
  const verdict = verdictFor(estimate.totalBytes, usable);

  const noteVars = { n: input.moeExperts ?? 0, w: model.text.slidingWindow ?? 0 };
  const notes = estimate.assumptions.map((id: AssumptionId) => tpl(c.notes[id], noteVars));

  const selectCls =
    "w-full rounded-lg border border-border bg-panel px-2.5 py-2 text-sm text-text outline-none focus:border-border2";

  return (
    <div>
      {/* Controls */}
      <div className="rounded-card border border-border bg-panel/40 p-4 elev">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label={c.controls.model}>
            <ModelSelect
              models={byDownloads}
              value={model.slug}
              onSelect={(s) => {
                setSlug(s);
                writeUrl({ model: s });
              }}
              dict={dict}
            />
          </Field>

          <Field label={c.controls.gpu}>
            <div className="flex gap-2">
              <select
                value={gpuId}
                onChange={(e) => {
                  setGpuId(e.target.value);
                  writeUrl({ gpu: e.target.value });
                }}
                aria-label={c.controls.gpu}
                className={selectCls}
              >
                {VENDORS.map((v) => (
                  <optgroup key={v} label={c.gpuGroups[v]}>
                    {GPU_PRESETS.filter((g) => g.vendor === v).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value={CUSTOM_GPU_ID}>{c.controls.custom}</option>
              </select>
              {gpuId === CUSTOM_GPU_ID && (
                <input
                  type="number"
                  min={1}
                  max={2048}
                  value={customVram}
                  onChange={(e) => {
                    const v = Math.min(2048, Math.max(1, Number(e.target.value) || 1));
                    setCustomVram(v);
                    writeUrl({ vram: v });
                  }}
                  aria-label={c.controls.customVram}
                  className={`${selectCls} w-24 shrink-0 font-mono`}
                />
              )}
            </div>
          </Field>

          <Field label={c.controls.batch}>
            <input
              type="number"
              min={1}
              max={64}
              value={batch}
              onChange={(e) => {
                const v = Math.min(64, Math.max(1, Math.round(Number(e.target.value) || 1)));
                setBatch(v);
                writeUrl({ batch: v });
              }}
              aria-label={c.controls.batch}
              className={`${selectCls} font-mono`}
            />
          </Field>

          <Field label={c.controls.quantization} className="lg:col-span-2">
            <div className="overflow-x-auto">
              <SegmentedControl
                options={QUANT_PRESETS.map((q) => ({ value: q.id, label: q.label }))}
                value={quant}
                onChange={(v) => {
                  setQuant(v);
                  writeUrl({ quant: v });
                }}
                ariaLabel={c.controls.quantization}
              />
            </div>
          </Field>

          {!cacheFree && (
            <Field label={`${c.controls.context} — ${fmtCtx(effCtx)}`}>
              <input
                type="range"
                min={0}
                max={ctxSteps.length - 1}
                step={1}
                value={ctxSteps.indexOf(effCtx)}
                onChange={(e) => {
                  const v = ctxSteps[Number(e.target.value)] ?? ctxSteps[0];
                  setCtx(v);
                  writeUrl({ ctx: v });
                }}
                aria-label={c.controls.context}
                aria-valuetext={fmtCtx(effCtx)}
                className="w-full accent-[var(--acc2)]"
              />
              <div className="flex justify-between font-mono text-[10px] text-dim">
                <span>{fmtCtx(ctxSteps[0])}</span>
                <span>{fmtCtx(ctxSteps[ctxSteps.length - 1])}</span>
              </div>
            </Field>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <VerdictCard
            verdict={verdict}
            totalBytes={estimate.totalBytes}
            usable={usable}
            input={input}
            quant={quant}
            batch={batch}
            gpuName={gpuName}
            dict={dict}
          />
          <div className="rounded-card border border-border bg-panel/40 p-4">
            <MemoryBar estimate={estimate} dict={dict} />
          </div>
        </div>
        <div className="rounded-card border border-border bg-panel/40 p-4">
          <GpuMatrix
            totalBytes={estimate.totalBytes}
            selectedId={gpuId}
            onSelect={(id) => {
              setGpuId(id);
              writeUrl({ gpu: id });
            }}
            dict={dict}
          />
        </div>
      </div>

      {/* Assumptions */}
      <div className="mt-5 rounded-card border border-border bg-panel/40 p-4">
        <div className="font-mono text-[11px] uppercase tracking-wide text-dim">{c.notes.title}</div>
        <ul className="mt-2 space-y-1.5">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-dim" />
              {n}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-border pt-2.5 text-[12px] leading-relaxed text-dim">{c.notes.disclaimer}</p>
      </div>
    </div>
  );
}
