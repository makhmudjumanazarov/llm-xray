"use client";

import { BlockMath } from "./Katex";

/** Shared lesson shell (mirrors the SoftmaxPlayground chrome): title + blurb, an
 *  interactive viz slot, beginner/expert prose, and an expert-only KaTeX box. */
export function LessonCard({
  title,
  blurb,
  expert,
  beginner,
  expertText,
  formula,
  children,
}: {
  title: string;
  blurb: string;
  expert: boolean;
  beginner?: string;
  expertText?: string;
  formula?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-panel/50 p-5 elev">
      <h3 className="font-display text-lg font-bold text-text">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">{blurb}</p>

      <div className="mt-5">{children}</div>

      {(beginner || expertText) && (
        <p className="mt-4 text-sm leading-relaxed text-muted">{expert ? expertText : beginner}</p>
      )}
      {expert && formula && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-bg2 p-3 text-text">
          <BlockMath math={formula} />
        </div>
      )}
    </div>
  );
}
