"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SubOp } from "@/core/model/blocks";
import type { Dictionary } from "@/i18n/dictionaries";
import { compactNumber } from "@/core/shared/format";
import { lessonForOpKind } from "@/core/learn/links";
import { localePath } from "@/core/seo";
import { isLocale } from "@/i18n/config";

const KIND_COLOR: Record<string, string> = {
  norm: "var(--dim)",
  qkv: "var(--acc)",
  sdpa: "var(--proj)",
  out: "var(--acc2)",
  gate: "var(--slide)",
  up: "var(--slide)",
  down: "var(--slide)",
  router: "var(--aud)",
  expert: "var(--aud)",
};

export function DetailPanel({ op, dict }: { op: SubOp | null; dict: Dictionary }) {
  const ops = dict.ops as Record<string, string>;
  const segment = usePathname()?.split("/")[1] ?? "";
  const locale = isLocale(segment) ? segment : "en";
  if (!op) {
    return (
      <div className="rounded-card border border-border bg-panel p-4 text-sm text-dim">
        {dict.explorer.selectHint}
      </div>
    );
  }
  const params = op.shape ? op.shape.reduce((a, b) => a * b, 1) : 0;
  const color = KIND_COLOR[op.kind] ?? "var(--acc)";
  const lessonId = lessonForOpKind(op.kind);
  return (
    <div className="rounded-card border border-border bg-panel p-4" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="font-mono text-sm font-bold text-text">{op.label}</div>
      {op.shape && (
        <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-muted">
          <span>
            <span className="text-dim">{ops.shape}: </span>[{op.shape.join(" × ")}]
          </span>
          <span>
            <span className="text-dim">{ops.params}: </span>
            {compactNumber(params)}
          </span>
        </div>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted">{ops[op.descKey] ?? ""}</p>
      {lessonId && (
        <Link
          href={`${localePath(locale, "/learn")}#${lessonId}`}
          className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-acc hover:underline"
        >
          {dict.cta.learnThis} →
        </Link>
      )}
    </div>
  );
}
