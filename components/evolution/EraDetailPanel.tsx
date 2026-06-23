"use client";

import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/core/seo";
import { lessonForEra } from "@/core/learn/links";
import type { EraMeta } from "@/core/evolution/timeline";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { BlockMath } from "@/components/learn/Katex";
import { EraDiagram } from "./EraDiagram";
import { EraMilestones } from "./EraMilestones";
import { ArchitectureGallery } from "./ArchitectureGallery";

type EraCopy = {
  title: string;
  yearLabel: string;
  tagline: string;
  beginner: string;
  expert: string;
  keyIdea: string;
  breakthrough: string;
};

function Fact({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg2 p-2.5" style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}>
      <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{label}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
    </div>
  );
}

/** A readable label from a catalog slug, e.g. "mistralai__mistral-7b-v0.1" → "mistral-7b-v0.1". */
function slugLabel(slug: string): string {
  return slug.split("__")[1] ?? slug;
}

export function EraDetailPanel({ dict, locale, era }: { dict: Dictionary; locale: Locale; era: EraMeta }) {
  const expert = useExpertMode((s) => s.expert);
  const ev = dict.evolution;
  const copy = (ev.eras as Record<string, EraCopy>)[era.id];
  const accentVar = `var(${era.accentToken})`;
  const mathLesson = lessonForEra(era.id);

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-display text-lg font-bold" style={{ color: accentVar }}>
          {copy.title}
        </h3>
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
          style={{ background: `color-mix(in oklab, ${accentVar} 16%, transparent)`, color: accentVar }}
        >
          {copy.yearLabel}
        </span>
        <span className="font-mono text-xs text-dim">{copy.tagline}</span>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start">
        <EraDiagram id={era.id} accentVar={accentVar} />

        <div>
          {!expert ? (
            <p className="text-sm leading-relaxed text-muted">{copy.beginner}</p>
          ) : (
            <p className="text-sm leading-relaxed text-muted">{copy.expert}</p>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Fact label={ev.keyIdeaLabel} accent={accentVar}>
              {copy.keyIdea}
            </Fact>
            <Fact label={ev.breakthroughLabel}>{copy.breakthrough}</Fact>
          </div>
        </div>
      </div>

      {era.modelSlugs && era.modelSlugs.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{ev.modelsLabel}:</span>
          {era.modelSlugs.map((slug) => (
            <Link
              key={slug}
              href={localePath(locale, `/models/${slug}`)}
              className="rounded-md border border-border bg-bg2 px-2 py-0.5 font-mono text-[11px] text-muted no-underline transition-colors hover:border-border2 hover:text-text"
            >
              {slugLabel(slug)} →
            </Link>
          ))}
        </div>
      )}

      {expert && (
        <div className="mt-3 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wide text-dim">{ev.objectiveLabel}</div>
          <div className="overflow-x-auto rounded-lg border border-border bg-bg2 p-3 text-text">
            <BlockMath math={era.formulaKatex} />
          </div>
          {mathLesson && (
            <Link
              href={`${localePath(locale, "/learn")}#${mathLesson}`}
              className="inline-flex items-center font-mono text-[11px] text-dim no-underline transition-colors hover:text-text"
            >
              {dict.cta.learnMath} →
            </Link>
          )}
        </div>
      )}

      {/* Deep dive: the era's timeline of milestones + the architectures it
          produced, each with an explorable layer stack. */}
      <div className="mt-5 border-t border-border pt-5">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <EraMilestones eraId={era.id} dict={dict} />
          <ArchitectureGallery eraId={era.id} dict={dict} accentVar={accentVar} />
        </div>
      </div>
    </div>
  );
}
