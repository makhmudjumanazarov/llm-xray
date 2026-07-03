import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { graph, webPageNode, faqNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { TrainingLifecycle } from "@/components/training/TrainingLifecycle";
import { InferenceJourney } from "@/components/inference/InferenceJourney";
import { ProcessJourney } from "@/components/processes/ProcessJourney";
import { EvolutionTeaser } from "@/components/evolution/EvolutionTeaser";
import { SectionQuiz } from "@/components/quiz/SectionQuiz";

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
    path: "",
    title: dict.home.heroTitle,
    description: dict.site.description,
    ogTitle: `${dict.site.name} — ${dict.site.tagline}`,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <section className="mb-10 max-w-3xl">
        <h1 className="animate-rise font-display text-4xl font-bold leading-[1.05] tracking-tight text-text md:text-5xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{dict.home.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/models`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-acc2 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-acc-500"
          >
            {dict.journey.bridgeCta} →
          </Link>
          <Link
            href={`/${locale}/learn`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-text no-underline transition-colors hover:border-border2"
          >
            {dict.nav.learn}
          </Link>
        </div>
      </section>

      <div className="mb-4">
        <TrainingLifecycle dict={dict} locale={locale} />
      </div>
      <div className="mb-10">
        <SectionQuiz sectionId="training" accentToken="--acc2" dict={dict} />
      </div>

      <div className="mb-4">
        <InferenceJourney dict={dict} />
      </div>
      <div className="mb-10">
        <SectionQuiz sectionId="inference" accentToken="--cyan" dict={dict} />
      </div>

      <div className="mb-4">
        <ProcessJourney dict={dict} />
      </div>
      <div className="mb-10">
        <SectionQuiz sectionId="processes" accentToken="--full" dict={dict} />
      </div>

      <div className="mb-10">
        <EvolutionTeaser dict={dict} locale={locale} />
      </div>

      <FaqSection dict={dict} />

      <JsonLd
        data={graph(
          webPageNode({
            locale,
            path: localePath(locale, ""),
            name: dict.home.heroTitle,
            description: dict.site.description,
          }),
          faqNode(dict.faq.items),
        )}
      />
    </div>
  );
}
