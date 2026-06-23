"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { LogitsBars } from "@/components/inference/LogitsBars";

type Top = { token: string; prob: number; logit: number };
type Status = "idle" | "loading" | "running" | "done" | "error" | "unsupported";

type WorkerMsg =
  | { type: "status"; stage: "loading" | "running" }
  | { type: "result"; text: string; top: Top[] }
  | { type: "error"; message: string };

/**
 * The flagship "x-ray a REAL model" panel. Unlike the illustrative lessons, this
 * loads DistilGPT-2 in a module Web Worker (transformers.js from a CDN) ONLY when
 * the user clicks Run, and shows the model's actual next-token distribution.
 * Everything runs on-device; the worker + weights are never part of the bundle.
 */
export function RealInference({ dict }: { dict: Dictionary }) {
  const t = dict.realRun;
  const [prompt, setPrompt] = useState("");
  const [temp, setTemp] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [top, setTop] = useState<Top[] | null>(null);
  const [err, setErr] = useState("");
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  function run() {
    setErr("");
    setTop(null);
    let w = workerRef.current;
    if (!w) {
      try {
        w = new Worker("/infer-worker.js", { type: "module" });
      } catch {
        setStatus("unsupported");
        return;
      }
      w.onmessage = (e: MessageEvent<WorkerMsg>) => {
        const m = e.data;
        if (m.type === "status") setStatus(m.stage);
        else if (m.type === "result") {
          setTop(m.top);
          setStatus("done");
        } else {
          setErr(m.message);
          setStatus("error");
        }
      };
      w.onerror = () => {
        setStatus("error");
        setErr(t.error);
      };
      workerRef.current = w;
    }
    setStatus("loading");
    w.postMessage({ prompt, temperature: temp });
  }

  const busy = status === "loading" || status === "running";
  const runLabel = status === "loading" ? t.loading : status === "running" ? t.running : t.run;

  return (
    <section className="rounded-card border border-border bg-panel/50 p-5 elev">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-bold text-text">{t.title}</h2>
        <span className="rounded bg-vis/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-vis">{t.real}</span>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{t.subtitle}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-dim">{t.prompt}</span>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) run();
            }}
            placeholder={t.placeholder}
            className="w-full rounded-lg border border-border bg-panel px-3 py-1.5 text-sm text-text outline-none focus:border-border2"
          />
        </label>
        <label>
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-dim">
            {t.temperature} · {temp.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.1}
            max={1.5}
            step={0.05}
            value={temp}
            onChange={(e) => setTemp(parseFloat(e.target.value))}
            className="accent-[var(--vis)]"
          />
        </label>
        <button
          onClick={run}
          disabled={busy}
          className="rounded-lg bg-acc2 px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {runLabel}
        </button>
      </div>

      {status === "unsupported" && <p className="mt-3 text-sm text-dim">{t.unsupported}</p>}
      {status === "error" && (
        <p className="mt-3 text-sm text-aud">
          {t.error} {err && <span className="text-dim">({err})</span>}
        </p>
      )}
      {top && status === "done" && (
        <div className="mt-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-dim">{t.nextToken}</div>
          <LogitsBars
            bars={top.map((x) => ({ label: x.token, prob: x.prob, logit: x.logit }))}
            accentVar="var(--vis)"
            showLogit
          />
          <p className="mt-2 text-[11px] text-dim">{t.note}</p>
        </div>
      )}
    </section>
  );
}
