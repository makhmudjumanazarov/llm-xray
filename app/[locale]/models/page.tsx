import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { graph, webPageNode, datasetNode, itemListNode, breadcrumbNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllModels } from "@/modules/catalog";
import { ModelTable } from "@/components/ranking/ModelTable";
import { ModelScatter } from "@/components/ranking/ModelScatter";

// ISR: rebuild the ranking at most hourly (picks up fresh ingests).
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/models",
    title: dict.nav.home,
    description: dict.site.description,
  });
}

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const models = await getAllModels();

  const lastModified = models
    .map((m) => m.stats.lastModified)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
  const topModels = [...models]
    .sort((a, b) => b.stats.downloads - a.stats.downloads)
    .slice(0, 20);

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <section className="mb-8 max-w-3xl">
        <h1 className="animate-rise font-display text-3xl font-bold tracking-tight text-text md:text-4xl">
          {dict.nav.home}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{dict.home.heroSubtitle}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-dim">
          {dict.filters.presetsTitle}
        </h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { label: dict.filters.presetAll, query: "" },
              { label: dict.filters.presetMoe, query: "?moe=1" },
              { label: dict.filters.presetMultimodal, query: "?modality=image" },
              { label: dict.filters.presetGqa, query: "?attention=gqa" },
            ] as const
          ).map((preset) => (
            <Link
              key={preset.label}
              href={`${localePath(locale, "/models")}${preset.query}`}
              className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm font-medium text-muted no-underline transition-colors hover:border-border2 hover:text-text"
            >
              {preset.label}
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <ModelTable models={models} locale={locale} dict={dict} />
      </Suspense>

      <div className="mt-10">
        <ModelScatter models={models} locale={locale} dict={dict} />
      </div>

      <JsonLd
        data={graph(
          webPageNode({
            locale,
            path: localePath(locale, "/models"),
            name: dict.nav.home,
            description: dict.site.description,
            type: "CollectionPage",
          }),
          datasetNode({
            locale,
            path: localePath(locale, "/models"),
            name: `${dict.nav.home} — ${dict.site.name}`,
            description: dict.site.description,
            count: models.length,
            ...(lastModified ? { dateModified: lastModified } : {}),
          }),
          itemListNode(
            topModels.map((m) => ({
              name: m.name,
              path: localePath(locale, `/models/${m.slug}`),
            })),
            dict.nav.home,
          ),
          breadcrumbNode([
            { name: dict.site.name, path: localePath(locale, "") },
            { name: dict.nav.home, path: localePath(locale, "/models") },
          ]),
        )}
      />
    </div>
  );
}
