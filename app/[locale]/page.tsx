import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/core/seo";
import { getAllModels } from "@/modules/catalog";
import { ModelTable } from "@/components/ranking/ModelTable";
import { ModelScatter } from "@/components/ranking/ModelScatter";
import { TrainingLifecycle } from "@/components/training/TrainingLifecycle";

// ISR: rebuild the ranking at most hourly (picks up fresh ingests).
export const revalidate = 3600;

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
  const models = await getAllModels();

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <section className="mb-10 max-w-3xl">
        <h1 className="animate-rise font-display text-4xl font-bold leading-[1.05] tracking-tight text-text md:text-5xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{dict.home.heroSubtitle}</p>
      </section>

      <div className="mb-10">
        <TrainingLifecycle dict={dict} />
      </div>

      <div id="ranking" className="mb-8 scroll-mt-24">
        <ModelScatter models={models} locale={locale} dict={dict} />
      </div>

      <ModelTable models={models} locale={locale} dict={dict} />
    </div>
  );
}
