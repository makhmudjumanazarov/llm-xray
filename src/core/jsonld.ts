// Pure schema.org / JSON-LD builders — the structured-data layer behind both
// classic SEO (Google rich results) and GEO/LLMO (so generative engines —
// ChatGPT, Perplexity, Gemini, Claude — can parse, attribute, and cite the
// site accurately). Framework-free and language-neutral except for strings the
// caller passes in localized; every node is a plain object, so this is unit
// tested. Pages compose nodes with graph() and render via <JsonLd>.

import { SITE_URL, SITE_NAME, localePath } from "@/core/seo";
import { locales, localeMeta, type Locale } from "@/i18n/config";

export type JsonLdNode = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#website`;

const SITE_DESCRIPTION =
  "Rank the latest open-source LLMs by downloads and benchmarks, then x-ray any model's architecture layer by layer — attention, normalization, MLP, MoE — in interactive 2D and 3D.";

const KEYWORDS = [
  "open-source LLM",
  "LLM architecture",
  "transformer",
  "attention",
  "GQA",
  "MoE",
  "RoPE",
  "model comparison",
  "machine learning education",
];

/** Absolute URL from a site-relative path (passes through absolute URLs). */
function abs(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const inLanguages = (): string[] => locales.map((l) => localeMeta[l].bcp47);

/** The publisher entity — referenced by @id everywhere else (one canonical node). */
export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon.svg`,
    },
    knowsAbout: KEYWORDS,
  };
}

/** The site entity + a SearchAction (the /models list reads ?q on load). */
export function websiteNode(locale: Locale): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: inLanguages(),
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}${localePath(locale, "/models")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList from ordered { name, path } crumbs (path includes the locale). */
export function breadcrumbNode(items: { name: string; path: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

type PageInput = {
  locale: Locale;
  path: string; // includes locale prefix, e.g. /en/models
  name: string;
  description: string;
  type?: "WebPage" | "CollectionPage" | "AboutPage";
};

/** A WebPage/CollectionPage node tied to the site + org. */
export function webPageNode({ locale, path, name, description, type = "WebPage" }: PageInput): JsonLdNode {
  return {
    "@type": type,
    "@id": `${abs(path)}#page`,
    url: abs(path),
    name,
    description,
    inLanguage: localeMeta[locale].bcp47,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    isAccessibleForFree: true,
  };
}

/** A Dataset node — the ranked open-LLM catalog (Google Dataset Search + GEO). */
export function datasetNode(opts: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  count: number;
  dateModified?: string;
}): JsonLdNode {
  return {
    "@type": "Dataset",
    "@id": `${abs(opts.path)}#dataset`,
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    inLanguage: localeMeta[opts.locale].bcp47,
    creator: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isAccessibleForFree: true,
    keywords: KEYWORDS,
    variableMeasured: ["downloads", "likes", "parameters", "context length", "layers", "attention type", "MMLU"],
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    ...(opts.count ? { size: `${opts.count} models` } : {}),
  };
}

/** ItemList of links (e.g. the top-N models, or the lessons). */
export function itemListNode(items: { name: string; path: string }[], name?: string): JsonLdNode {
  return {
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  };
}

/** A TechArticle — the model/architecture explainer pages (strong for citation). */
export function techArticleNode(opts: {
  locale: Locale;
  path: string;
  headline: string;
  description: string;
  keywords?: string[];
  datePublished?: string;
  dateModified?: string;
  about?: JsonLdNode;
}): JsonLdNode {
  return {
    "@type": "TechArticle",
    "@id": `${abs(opts.path)}#article`,
    headline: opts.headline,
    description: opts.description,
    url: abs(opts.path),
    inLanguage: localeMeta[opts.locale].bcp47,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
    isAccessibleForFree: true,
    keywords: opts.keywords ?? KEYWORDS,
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    ...(opts.about ? { about: opts.about } : {}),
  };
}

/** A LearningResource — the /learn and /evolution interactive lessons. */
export function learningResourceNode(opts: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  teaches?: string[];
}): JsonLdNode {
  return {
    "@type": "LearningResource",
    "@id": `${abs(opts.path)}#learn`,
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    inLanguage: localeMeta[opts.locale].bcp47,
    provider: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
    learningResourceType: "interactive lesson",
    educationalLevel: "beginner to advanced",
    isAccessibleForFree: true,
    ...(opts.teaches && opts.teaches.length ? { teaches: opts.teaches } : {}),
  };
}

/** A SoftwareApplication node for one model — used as TechArticle.about. */
export function softwareApplicationNode(opts: {
  name: string;
  path: string;
  description: string;
  license?: string;
  family?: string;
  keywords?: string[];
}): JsonLdNode {
  return {
    "@type": "SoftwareApplication",
    name: opts.name,
    url: abs(opts.path),
    description: opts.description,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Large Language Model",
    operatingSystem: "Cross-platform",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    ...(opts.license ? { license: opts.license } : {}),
    ...(opts.family ? { applicationSuite: opts.family } : {}),
    ...(opts.keywords && opts.keywords.length ? { keywords: opts.keywords } : {}),
  };
}

/** An FAQPage from visible Q&A pairs (the answers must also render on the page). */
export function faqNode(qas: { q: string; a: string }[]): JsonLdNode {
  return {
    "@type": "FAQPage",
    mainEntity: qas.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** Wrap nodes in a single @graph document (drops null/undefined). */
export function graph(...nodes: (JsonLdNode | null | undefined)[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((n): n is JsonLdNode => Boolean(n)),
  };
}
