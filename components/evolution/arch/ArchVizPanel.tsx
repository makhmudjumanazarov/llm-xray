"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Architecture } from "@/core/evolution/deepdive";
import type { Dictionary } from "@/i18n/dictionaries";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { CanvasErrorBoundary } from "@/components/explorer/CanvasErrorBoundary";
import { ArchDiagram2D } from "./ArchDiagram2D";

// 3D scene is client-only (WebGL) — load without SSR, mirroring ModelExplorer.
const ArchScene3D = dynamic(() => import("./ArchScene3D").then((m) => m.ArchScene3D), {
  ssr: false,
  loading: () => <Skeleton className="h-[440px] w-full" />,
});

/**
 * Interactive 2D / 3D explorer for one historical architecture. Rendered beneath
 * the kept LayerStack list; the [2D | 3D] views share one selected-layer state.
 * Mount this with key={arch.id} so switching architectures resets the selection.
 */
export function ArchVizPanel({ arch, dict }: { arch: Architecture; dict: Dictionary }) {
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{dict.explorer.title}</span>
        <SegmentedControl
          value={view}
          onChange={setView}
          ariaLabel={dict.explorer.title}
          options={[
            { value: "2d", label: dict.explorer.view2d },
            { value: "3d", label: dict.explorer.view3d },
          ]}
        />
      </div>

      {view === "2d" ? (
        <ArchDiagram2D arch={arch} dict={dict} selected={selected} onSelect={setSelected} />
      ) : (
        <CanvasErrorBoundary
          fallback={
            <div className="flex h-[440px] w-full items-center justify-center rounded-card border border-border bg-bg2 px-6 text-center text-sm text-dim">
              {dict.explorer.noWebgl}
            </div>
          }
        >
          <ArchScene3D arch={arch} dict={dict} selected={selected} onSelect={setSelected} />
        </CanvasErrorBoundary>
      )}
    </div>
  );
}
