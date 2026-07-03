import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { graph, softwareApplicationNode, techArticleNode, breadcrumbNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllSlugs, getModelBySlug } from "@/modules/catalog";
import { params as fmtParams, contextLen, compactNumber } from "@/core/shared/format";
import { lessonForField } from "@/core/learn/links";
import { ModelExplorer } from "@/components/explorer/ModelExplorer";
import { HeadGroups } from "@/components/model/HeadGroups";
import { WillItRun } from "@/components/model/WillItRun";

// ISR: pre-render known models, render the long tail on-demand, refresh daily.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return locales.flatMap((locale) => slugs.map((id) => ({ locale, id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const model = await getModelBySlug(id);
  if (!model) return {};
  const dict = await getDictionary(locale);
  const desc =
    locale === "ru"
      ? `${model.name}: архитектура — ${model.text.numLayers} слоёв, ${model.text.attentionType.toUpperCase()}, ${fmtParams(model.paramsB)} параметров. ${dict.site.tagline}.`
      : `${model.name} architecture — ${model.text.numLayers} layers, ${model.text.attentionType.toUpperCase()} attention, ${fmtParams(model.paramsB)} parameters. ${dict.site.tagline}.`;
  return pageMetadata({
    locale,
    path: `/models/${model.slug}`,
    title: `${model.name} — ${dict.model.architecture}`,
    description: desc,
  });
}

function Stat({ k, v, to, learnMore }: { k: string; v: React.ReactNode; to?: string; learnMore?: string }) {
  return (
    <div className="rounded-card border border-border bg-panel p-4">
      <div className="font-mono text-[11px] uppercase tracking-wide text-dim">{k}</div>
      <div className="mt-1.5 text-lg font-bold text-text">
        {to ? (
          <Link href={to} className="text-text no-underline transition-colors hover:text-acc">
            {v}
            {learnMore && (
              <span className="ml-1.5 font-mono text-[11px] font-normal text-dim transition-colors hover:text-acc">
                ↗ {learnMore}
              </span>
            )}
          </Link>
        ) : (
          v
        )}
      </div>
    </div>
  );
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const model = await getModelBySlug(id);
  if (!model) notFound();
  const dict = await getDictionary(locale);
  const t = model.text;

  // Deep-link a stat to its /learn lesson (null when no live lesson exists).
  const lessonHref = (field: string): string | undefined => {
    const id = lessonForField(field);
    return id ? `${localePath(locale, "/learn")}#${id}` : undefined;
  };

  const desc = `${model.name} architecture — ${t.numLayers} layers, ${t.attentionType.toUpperCase()} attention, ${fmtParams(model.paramsB)} parameters.`;
  const path = localePath(locale, `/models/${model.slug}`);
  const app = softwareApplicationNode({
    name: model.name,
    path,
    description: desc,
    license: model.license,
    family: model.family,
    keywords: [model.family, t.attentionType.toUpperCase(), model.architecture, "open-source LLM"],
  });

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <Link href={`/${locale}`} className="font-mono text-xs text-dim no-underline hover:text-acc">
        ← {dict.nav.home}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text">{model.name}</h1>
        {lessonHref("attentionType") ? (
          <Link
            href={lessonHref("attentionType")!}
            className="rounded bg-acc2/15 px-2 py-0.5 font-mono text-xs font-semibold text-acc no-underline transition-colors hover:bg-acc2/25"
          >
            {dict.attentionType[t.attentionType]}
          </Link>
        ) : (
          <span className="rounded bg-acc2/15 px-2 py-0.5 font-mono text-xs font-semibold text-acc">
            {dict.attentionType[t.attentionType]}
          </span>
        )}
        {t.moe && (
          <span className="rounded bg-aud/15 px-2 py-0.5 font-mono text-xs font-semibold text-aud">MoE</span>
        )}
      </div>
      <p className="mt-2 font-mono text-sm text-dim">
        {model.id} · {model.architecture} · {model.license}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {model.modalities.map((m) => (
          <span key={m} className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted">
            {dict.modality[m]}
          </span>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
        {dict.model.overview}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat k={dict.model.params} v={fmtParams(model.paramsB)} />
        <Stat k={dict.model.layers} v={t.numLayers} />
        <Stat k={dict.model.hidden} v={t.hiddenSize} />
        <Stat k={dict.model.heads} v={t.numHeads} />
        <Stat k={dict.model.kvHeads} v={t.numKVHeads} />
        <Stat k={dict.model.context} v={contextLen(t.contextLen)} to={lessonHref("contextLen")} learnMore={dict.cta.learnMore} />
        <Stat k={dict.model.vocab} v={compactNumber(t.vocabSize)} to={lessonHref("vocabSize")} learnMore={dict.cta.learnMore} />
        <Stat k={dict.model.activation} v={t.activation} />
        <Stat k={dict.model.norm} v={t.normType} to={lessonHref("normType")} learnMore={dict.cta.learnMore} />
        {t.slidingWindow && <Stat k="Sliding window" v={t.slidingWindow} />}
        {t.moe && <Stat k={dict.model.experts} v={`${t.moe.numExperts} (top-${t.moe.topK})`} to={lessonHref("moe")} learnMore={dict.cta.learnMore} />}
        {t.rope?.theta && <Stat k="RoPE θ" v={compactNumber(t.rope.theta)} to={lessonHref("rope")} learnMore={dict.cta.learnMore} />}
      </div>

      <div className="mt-6">
        <WillItRun model={model} locale={locale} dict={dict} />
      </div>

      {t.numHeads != null && t.numKVHeads != null && (
        <HeadGroups
          numHeads={t.numHeads}
          numKVHeads={t.numKVHeads}
          attentionType={t.attentionType}
          dict={dict}
        />
      )}

      {(model.dtype ||
        model.tensorCount != null ||
        model.source.gated ||
        t.rope?.scaling ||
        t.moe?.numSharedExperts != null ||
        model.encoders?.some((e) => e.projectorTo != null)) && (
        <>
          <h2 className="mt-8 mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            {dict.model.advanced}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {model.dtype && <Stat k={dict.model.dataType} v={model.dtype} />}
            {model.tensorCount != null && (
              <Stat k={dict.model.tensors} v={compactNumber(model.tensorCount)} />
            )}
            {model.source.gated && (
              <Stat
                k={dict.model.gated}
                v={
                  <span title={model.source.note ?? dict.model.gatedNote}>
                    <span className="rounded bg-aud/15 px-2 py-0.5 font-mono text-xs font-semibold text-aud">
                      {dict.model.gated}
                    </span>
                  </span>
                }
              />
            )}
            {t.rope?.scaling && (
              <Stat
                k={dict.model.ropeScaling}
                v={
                  <span className="font-mono text-xs break-all">
                    {Object.entries(t.rope.scaling)
                      .map(([sk, sv]) => `${sk}: ${String(sv)}`)
                      .join(", ")}
                  </span>
                }
              />
            )}
            {t.moe?.numSharedExperts != null && (
              <Stat k={dict.model.sharedExperts} v={t.moe.numSharedExperts} />
            )}
            {model.encoders?.map((e) =>
              e.projectorTo != null ? (
                <Stat
                  key={`proj-${e.kind}`}
                  k={`${dict.model.projectorDim} (${e.kind === "vision" ? dict.modality.image : dict.modality.audio})`}
                  v={e.projectorTo}
                />
              ) : null,
            )}
          </div>
        </>
      )}

      {model.encoders && model.encoders.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Encoders
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {model.encoders.map((e) => (
              <Stat
                key={e.kind}
                k={e.kind === "vision" ? dict.modality.image : dict.modality.audio}
                v={`${e.numLayers}L · ${e.hiddenSize}d`}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-10">
        <ModelExplorer model={model} dict={dict} />
      </div>

      <JsonLd
        data={graph(
          techArticleNode({
            locale,
            path,
            headline: `${model.name} — ${dict.model.architecture}`,
            description: desc,
            keywords: [model.family, t.attentionType.toUpperCase(), "LLM architecture"],
            datePublished: model.generatedAt,
            dateModified: model.stats.lastModified,
            about: app,
          }),
          breadcrumbNode([
            { name: dict.site.name, path: localePath(locale, "") },
            { name: dict.nav.home, path: localePath(locale, "/models") },
            { name: model.name, path },
          ]),
        )}
      />
    </div>
  );
}
