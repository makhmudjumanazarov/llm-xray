"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { decoderBlock, type SubOp } from "@/core/model/blocks";
import { Diagram2D } from "./Diagram2D";
import { DetailPanel } from "./DetailPanel";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";

// 3D scene is client-only (WebGL) — load it without SSR.
const Scene3D = dynamic(() => import("./Scene3D").then((m) => m.Scene3D), {
  ssr: false,
  loading: () => <Skeleton className="h-[560px] w-full" />,
});

export function ModelExplorer({ model, dict }: { model: Model; dict: Dictionary }) {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [selected, setSelected] = useState<string | null>(null);

  const opIndex = useMemo(() => {
    const map = new Map<string, SubOp>();
    for (const g of decoderBlock(model)) for (const op of g.ops) map.set(op.id, op);
    return map;
  }, [model]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          {dict.explorer.title}
        </h2>
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "2d", label: dict.explorer.view2d },
            { value: "3d", label: dict.explorer.view3d },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {view === "2d" ? (
            <Diagram2D model={model} dict={dict} selected={selected} onSelect={setSelected} />
          ) : (
            <CanvasErrorBoundary
              fallback={
                <div className="flex h-[560px] w-full items-center justify-center rounded-card border border-border bg-bg2 px-6 text-center text-sm text-dim">
                  {dict.explorer.noWebgl}
                </div>
              }
            >
              <Scene3D model={model} dict={dict} selected={selected} onSelect={setSelected} />
            </CanvasErrorBoundary>
          )}
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <DetailPanel op={selected ? opIndex.get(selected) ?? null : null} dict={dict} />
        </div>
      </div>
    </section>
  );
}
