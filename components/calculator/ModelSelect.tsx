"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { buildModelTree } from "@/core/model/family";
import { params as fmtParams } from "@/core/shared/format";
import { ChevronDown, Search } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Single-select model dropdown: search + the same family/version folders as
 * the compare ModelPicker, but picking a leaf selects it and closes.
 */
export function ModelSelect({
  models,
  value,
  onSelect,
  dict,
}: {
  models: Model[];
  value: string;
  onSelect: (slug: string) => void;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const current = models.find((m) => m.slug === value);
  const term = query.trim().toLowerCase();
  const searching = term.length > 0;
  const filtered = useMemo(
    () =>
      searching
        ? models.filter((m) => `${m.name} ${m.family} ${m.id}`.toLowerCase().includes(term))
        : models,
    [models, searching, term],
  );
  const tree = useMemo(() => buildModelTree(filtered), [filtered]);

  // Close when clicking anywhere outside the widget.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const pick = (slug: string) => {
    onSelect(slug);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-left text-sm text-text transition-colors hover:border-border2"
      >
        <span className="truncate font-semibold">{current?.name ?? "—"}</span>
        {current && <span className="shrink-0 font-mono text-[11px] text-dim">{fmtParams(current.paramsB)}</span>}
        <ChevronDown size={14} className="ml-auto shrink-0 text-dim" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-card border border-border bg-bg2 p-2 shadow-[var(--shadow-1)]">
          <div className="relative mb-2">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.home.searchPlaceholder}
              aria-label={dict.home.searchPlaceholder}
              className="w-full rounded-lg border border-border bg-panel py-1.5 pl-8 pr-3 text-sm text-text outline-none placeholder:text-dim focus:border-border2"
            />
          </div>
          <div role="listbox" aria-label={dict.calculator.controls.model} className="max-h-72 overflow-y-auto">
            {tree.length === 0 ? (
              <EmptyState icon={<Search size={18} />} title={dict.home.empty} className="py-6" />
            ) : (
              tree.map((fam) => (
                <div key={fam.family}>
                  <div className="px-2 pb-0.5 pt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-dim">
                    {fam.family}
                  </div>
                  {fam.models.map((m) => {
                    const active = m.slug === value;
                    return (
                      <button
                        key={m.slug}
                        role="option"
                        aria-selected={active}
                        onClick={() => pick(m.slug)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                          active ? "bg-acc2/15 text-text" : "text-muted hover:bg-panel hover:text-text"
                        }`}
                      >
                        <span className="truncate">{m.name}</span>
                        <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">{fmtParams(m.paramsB)}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
