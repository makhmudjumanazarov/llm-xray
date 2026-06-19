import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/core/seo";
import { SoftmaxPlayground } from "@/components/learn/SoftmaxPlayground";
import { ExpertToggle } from "@/components/learn/ExpertToggle";

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
  return pageMetadata({ locale, path: "/learn", title: dict.learn.title, description: dict.learn.subtitle });
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const upcoming = Object.values(dict.learn.concepts);

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="animate-rise font-display text-4xl font-bold tracking-tight text-text">
            {dict.learn.title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">{dict.learn.subtitle}</p>
        </div>
        <ExpertToggle dict={dict} />
      </div>

      <SoftmaxPlayground dict={dict} />

      <h2 className="mb-3 mt-10 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
        {dict.learn.comingSoon}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {upcoming.map((c) => (
          <div
            key={c}
            className="rounded-card border border-dashed border-border bg-panel/30 p-4 text-sm text-dim"
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
