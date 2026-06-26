import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { graph, learningResourceNode, itemListNode, breadcrumbNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { LESSON_REGISTRY } from "@/components/learn/registry";
import { LessonNav } from "@/components/learn/LessonNav";
import { LessonExamples } from "@/components/learn/LessonExamples";
import { RealInference } from "@/components/learn/RealInference";
import { getAllModels } from "@/modules/catalog";

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
  const models = await getAllModels();
  const live = LESSON_REGISTRY.filter((l) => l.status === "live" && l.Component);
  const soon = LESSON_REGISTRY.filter((l) => l.status === "soon");
  const concepts = dict.learn.concepts as Record<string, string>;
  const lessonTitles = dict.learn as unknown as Record<string, { title: string }>;
  const navItems = live.map((l) => ({ id: l.id, label: lessonTitles[l.id].title, iconName: l.iconName }));

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="animate-rise font-display text-4xl font-bold tracking-tight text-text">
            {dict.learn.title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">{dict.learn.subtitle}</p>
        </div>
      </div>

      {/* Flagship: a REAL small model running in-browser (opt-in, lazy-loaded). */}
      <div className="mb-8">
        <RealInference dict={dict} />
      </div>

      <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-8">
        <LessonNav items={navItems} label={dict.learn.title} />

        <div>
          <div className="space-y-6">
            {live.map((l) => {
              const Lesson = l.Component!;
              return (
                <section key={l.id} id={l.id} className="scroll-mt-[112px] lg:scroll-mt-24">
                  <Lesson dict={dict} />
                  <LessonExamples lessonId={l.id} models={models} locale={locale} dict={dict} />
                </section>
              );
            })}
          </div>

          {soon.length > 0 && (
            <>
              <h2 className="mb-3 mt-10 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                {dict.learn.comingSoon}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {soon.map((l) => {
                  const Icon = l.Icon;
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 rounded-card border border-dashed border-border bg-panel/30 p-4 text-sm text-dim"
                    >
                      <Icon size={15} className="shrink-0" />
                      {concepts[l.id]}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <JsonLd
        data={graph(
          learningResourceNode({
            locale,
            path: localePath(locale, "/learn"),
            name: dict.learn.title,
            description: dict.learn.subtitle,
            teaches: navItems.map((n) => n.label),
          }),
          itemListNode(
            navItems.map((n) => ({ name: n.label, path: `${localePath(locale, "/learn")}#${n.id}` })),
            dict.learn.title,
          ),
          breadcrumbNode([
            { name: dict.site.name, path: localePath(locale, "") },
            { name: dict.nav.learn, path: localePath(locale, "/learn") },
          ]),
        )}
      />
    </div>
  );
}
