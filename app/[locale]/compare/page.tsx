import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { getAllModels } from "@/modules/catalog";
import { graph, webPageNode, breadcrumbNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { CompareClient } from "@/components/compare/CompareClient";

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
    path: "/compare",
    title: dict.compare.title,
    description: dict.compare.subtitle,
  });
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const models = await getAllModels();

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-text">{dict.compare.title}</h1>
      <p className="mt-2 mb-8 max-w-2xl text-base text-muted">{dict.compare.subtitle}</p>
      <CompareClient models={models} locale={locale} dict={dict} />
      <JsonLd
        data={graph(
          webPageNode({
            locale,
            path: localePath(locale, "/compare"),
            name: dict.compare.title,
            description: dict.compare.subtitle,
          }),
          breadcrumbNode([
            { name: dict.site.name, path: localePath(locale, "") },
            { name: dict.nav.compare, path: localePath(locale, "/compare") },
          ]),
        )}
      />
    </div>
  );
}
