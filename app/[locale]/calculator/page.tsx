import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, localePath } from "@/core/seo";
import { getAllModels } from "@/modules/catalog";
import { graph, webPageNode, webApplicationNode, faqNode, breadcrumbNode } from "@/core/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { CalculatorClient } from "@/components/calculator/CalculatorClient";
import { estimateMemory, kvCacheBytes, type MemoryTextInput } from "@/core/memory/estimate";
import { weightsBytes } from "@/core/memory/quant";
import { gib } from "@/core/shared/format";

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
    path: "/calculator",
    title: dict.calculator.title,
    description: dict.calculator.subtitle,
  });
}

// Canonical 8B / 70B dense shapes for the FAQ examples, so the visible answers
// are computed by the same estimator the tool uses and can never drift from it.
const SHAPE_8B: MemoryTextInput = { numLayers: 32, numKVHeads: 8, headDim: 128, contextLen: 131072, attentionType: "gqa" };
const SHAPE_70B: MemoryTextInput = { numLayers: 80, numKVHeads: 8, headDim: 128, contextLen: 131072, attentionType: "gqa" };

function faqVars(): Record<string, string> {
  return {
    w70q4: gib(weightsBytes(70, "q4_k_m")),
    t70q4: gib(estimateMemory({ paramsB: 70, text: SHAPE_70B }, { quant: "q4_k_m", contextLen: 8192 }).totalBytes),
    w70fp16: gib(weightsBytes(70, "fp16")),
    w8fp16: gib(weightsBytes(8, "fp16")),
    w8q4: gib(weightsBytes(8, "q4_k_m")),
    kv8at8k: gib(kvCacheBytes(SHAPE_8B, 8192)),
  };
}

function tpl(s: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), s);
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const models = await getAllModels();

  const vars = faqVars();
  const faqItems = dict.calculator.faq.items.map((it) => ({ q: it.q, a: tpl(it.a, vars) }));

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 md:px-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-text">{dict.calculator.title}</h1>
      <p className="mt-2 mb-8 max-w-2xl text-base text-muted">{dict.calculator.subtitle}</p>

      <Suspense fallback={null}>
        <CalculatorClient models={models} dict={dict} />
      </Suspense>

      {/* Visible FAQ — the source of the FAQPage JSON-LD below (answers must render). */}
      <section aria-label={dict.calculator.faq.title} className="mt-10 rounded-card border border-border bg-panel/40 p-5 elev md:p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-text">{dict.calculator.faq.title}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faqItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-bg2 p-4">
              <h3 className="font-display text-base font-semibold text-text">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <JsonLd
        data={graph(
          webPageNode({
            locale,
            path: localePath(locale, "/calculator"),
            name: dict.calculator.title,
            description: dict.calculator.subtitle,
          }),
          webApplicationNode({
            locale,
            path: localePath(locale, "/calculator"),
            name: dict.calculator.title,
            description: dict.calculator.subtitle,
          }),
          faqNode(faqItems),
          breadcrumbNode([
            { name: dict.site.name, path: localePath(locale, "") },
            { name: dict.nav.calculator, path: localePath(locale, "/calculator") },
          ]),
        )}
      />
    </div>
  );
}
