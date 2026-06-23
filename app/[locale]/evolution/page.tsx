import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { graph, learningResourceNode, breadcrumbNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { ExpertToggle } from "@/components/learn/ExpertToggle";
import { EvolutionTimeline } from "@/components/evolution/EvolutionTimeline";

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
  return pageMetadata({ locale, path: "/evolution", title: dict.evolution.title, description: dict.evolution.subtitle });
}

export default async function EvolutionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="animate-rise font-display text-4xl font-bold tracking-tight text-text">{dict.evolution.title}</h1>
          <p className="mt-2 text-base text-muted">{dict.evolution.subtitle}</p>
        </div>
        <ExpertToggle dict={dict} />
      </div>
      <EvolutionTimeline dict={dict} locale={locale} />

      <JsonLd
        data={graph(
          learningResourceNode({
            locale,
            path: localePath(locale, "/evolution"),
            name: dict.evolution.title,
            description: dict.evolution.subtitle,
            teaches: [
              "classical machine learning",
              "perceptron",
              "deep learning",
              "convolutional neural network",
              "recurrent neural network",
              "transformer",
              "large language model",
              "mixture-of-experts",
            ],
          }),
          breadcrumbNode([
            { name: dict.site.name, path: localePath(locale, "") },
            { name: dict.nav.evolution, path: localePath(locale, "/evolution") },
          ]),
        )}
      />
    </div>
  );
}
