import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/core/seo";
import { EVOLUTION_ERAS, type EraIconName, type EraId } from "@/core/evolution/timeline";
import { Function, Network, Layers, Eye, Type, Grid, Bot, Globe } from "@/components/ui/icons";

const ICONS: Record<EraIconName, typeof Layers> = { Function, Network, Layers, Eye, Type, Grid, Bot, Globe };

type EraCopy = { title: string; yearLabel: string };

function shortYear(yearLabel: string): string {
  return yearLabel.match(/\d{4}/)?.[0] ?? yearLabel;
}

/** Compact home-page band that links to the full /evolution timeline. */
export function EvolutionTeaser({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const ev = dict.evolution;
  const eras = ev.eras as Record<EraId, EraCopy>;

  return (
    <Link
      href={localePath(locale, "/evolution")}
      aria-label={ev.title}
      className="group block rounded-card border border-border bg-panel/50 p-5 no-underline elev elev-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-text md:text-2xl">{ev.homeTeaserTitle}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{ev.homeTeaserSubtitle}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-acc2 px-3.5 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-acc-500">
          {ev.homeTeaserCta} →
        </span>
      </div>

      {/* mini era rail — icons on a gradient timeline */}
      <div className="relative mt-6 mb-1">
        <div
          className="absolute inset-x-2 top-4 h-0.5 -translate-y-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--dim), var(--slide), var(--proj), var(--vis), var(--aud), var(--acc2), var(--full), var(--cyan))",
          }}
        />
        <div className="relative flex items-start justify-between">
          {EVOLUTION_ERAS.map((era) => {
            const Icon = ICONS[era.iconName];
            const accentVar = `var(${era.accentToken})`;
            return (
              <div key={era.id} className="flex flex-col items-center gap-1" title={eras[era.id].title}>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-bg transition-transform duration-200 group-hover:scale-110"
                  style={{ borderColor: accentVar, color: accentVar }}
                >
                  <Icon size={15} />
                </span>
                <span className="font-mono text-[9px] text-dim">{shortYear(eras[era.id].yearLabel)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
