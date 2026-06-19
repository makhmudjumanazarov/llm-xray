"use client";

import { useMemo, useRef, useState } from "react";
import type { Model } from "@/core/model/schema";
import { buildModelTree } from "@/core/model/family";
import { params as fmtParams } from "@/core/shared/format";
import { ChevronRight, ChevronDown } from "@/components/ui/icons";

/** A select-all checkbox that shows the indeterminate (partial) state. */
function TriCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-3.5 w-3.5 shrink-0 accent-[var(--acc2)]"
    />
  );
}

export function ModelPicker({
  models,
  selected,
  onToggle,
}: {
  models: Model[];
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const tree = useMemo(() => buildModelTree(models), [models]);
  const sel = useMemo(() => new Set(selected), [selected]);

  // Auto-open families/versions that already hold a selected model.
  const [openFam, setOpenFam] = useState<Set<string>>(
    () => new Set(tree.filter((f) => f.models.some((mm) => sel.has(mm.slug))).map((f) => f.family)),
  );
  const [openVer, setOpenVer] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const f of tree) for (const v of f.versions) if (v.models.some((mm) => sel.has(mm.slug))) s.add(`${f.family}/${v.version}`);
    return s;
  });

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Select/deselect every model in a group at once.
  const setGroup = (groupModels: Model[], on: boolean) => {
    for (const mm of groupModels) {
      if (sel.has(mm.slug) !== on) onToggle(mm.slug);
    }
  };

  return (
    <div className="max-h-[440px] overflow-y-auto rounded-card border border-border bg-panel/40 p-1.5">
      {tree.map((fam) => {
        const famOpen = openFam.has(fam.family);
        const famSel = fam.models.filter((mm) => sel.has(mm.slug)).length;
        return (
          <div key={fam.family}>
            {/* family / org folder */}
            <button
              onClick={() => toggleSet(setOpenFam, fam.family)}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-panel"
            >
              {famOpen ? <ChevronDown size={13} className="text-dim" /> : <ChevronRight size={13} className="text-dim" />}
              <span className="font-mono text-sm font-semibold text-text">{fam.family}</span>
              <span className="font-mono text-[10px] text-dim">/{fam.models.length}</span>
              {famSel > 0 && (
                <span className="ml-auto rounded bg-acc-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-acc">
                  {famSel}
                </span>
              )}
            </button>

            {famOpen &&
              fam.versions.map((ver) => {
                const key = `${fam.family}/${ver.version}`;
                const verOpen = openVer.has(key);
                const verSelCount = ver.models.filter((mm) => sel.has(mm.slug)).length;
                const allSel = verSelCount === ver.models.length;
                return (
                  <div key={key} className="ml-3 border-l border-border/60 pl-1">
                    {/* version folder */}
                    <div className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-panel">
                      <TriCheckbox
                        checked={allSel}
                        indeterminate={verSelCount > 0}
                        onChange={() => setGroup(ver.models, !allSel)}
                      />
                      <button
                        onClick={() => toggleSet(setOpenVer, key)}
                        className="flex flex-1 items-center gap-1.5 text-left"
                      >
                        {verOpen ? <ChevronDown size={12} className="text-dim" /> : <ChevronRight size={12} className="text-dim" />}
                        <span className="font-mono text-xs font-medium text-muted">{ver.version}</span>
                        <span className="font-mono text-[10px] text-dim">({ver.models.length})</span>
                      </button>
                    </div>

                    {/* leaf models */}
                    {verOpen &&
                      ver.models.map((mm) => {
                        const on = sel.has(mm.slug);
                        return (
                          <label
                            key={mm.slug}
                            className={`ml-5 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors ${
                              on ? "bg-acc2/15 text-text" : "text-muted hover:bg-panel"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => onToggle(mm.slug)}
                              className="h-3.5 w-3.5 shrink-0 accent-[var(--acc2)]"
                            />
                            <span className="truncate">{mm.name}</span>
                            <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">{fmtParams(mm.paramsB)}</span>
                          </label>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
