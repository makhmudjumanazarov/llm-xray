import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/core/seo";
import { getAllSlugs, getModelBySlug } from "@/modules/catalog";
import { params as fmtParams, contextLen, compactNumber } from "@/core/shared/format";
import { ModelExplorer } from "@/components/explorer/ModelExplorer";

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

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-panel p-4">
      <div className="font-mono text-[11px] uppercase tracking-wide text-dim">{k}</div>
      <div className="mt-1.5 text-lg font-bold text-text">{v}</div>
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

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <Link href={`/${locale}`} className="font-mono text-xs text-dim no-underline hover:text-acc">
        ← {dict.nav.home}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text">{model.name}</h1>
        <span className="rounded bg-acc2/15 px-2 py-0.5 font-mono text-xs font-semibold text-acc">
          {dict.attentionType[t.attentionType]}
        </span>
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
        <Stat k={dict.model.context} v={contextLen(t.contextLen)} />
        <Stat k={dict.model.vocab} v={compactNumber(t.vocabSize)} />
        <Stat k={dict.model.activation} v={t.activation} />
        <Stat k={dict.model.norm} v={t.normType} />
        {t.slidingWindow && <Stat k="Sliding window" v={t.slidingWindow} />}
        {t.moe && <Stat k={dict.model.experts} v={`${t.moe.numExperts} (top-${t.moe.topK})`} />}
        {t.rope?.theta && <Stat k="RoPE θ" v={compactNumber(t.rope.theta)} />}
      </div>

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
    </div>
  );
}
