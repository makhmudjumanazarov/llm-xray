import type { Metadata } from "next";
import { locales, defaultLocale, localeMeta, type Locale } from "@/i18n/config";

// Canonical production origin. Override via env for previews.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://llm-xray.com"
).replace(/\/$/, "");

export const SITE_NAME = "llm-xray";

/** Build a locale-prefixed path, e.g. ("en", "/models/x") -> "/en/models/x". */
export function localePath(locale: Locale, path = ""): string {
  const clean = path && !path.startsWith("/") ? `/${path}` : path;
  return `/${locale}${clean}`;
}

/**
 * hreflang alternates for a given page path (path WITHOUT locale prefix).
 * Returns one entry per locale plus an x-default pointing at the default locale.
 */
export function buildAlternates(path = ""): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[localeMeta[l].bcp47] = localePath(l, path);
  }
  languages["x-default"] = localePath(defaultLocale, path);
  return {
    canonical: localePath(defaultLocale, path),
    languages,
    // Advertise the RSS feed from every page.
    types: { "application/rss+xml": "/feed.xml" },
  };
}

type PageMetaInput = {
  locale: Locale;
  path?: string; // without locale prefix
  title: string;
  description: string;
  ogTitle?: string;
  /**
   * Set when the route ships its own opengraph-image.tsx. Next applies a
   * file-convention image only if generateMetadata leaves openGraph.images /
   * twitter.images unset — with the defaults below the colocated file would be
   * silently ignored (twitter then auto-inherits from openGraph).
   */
  ownOgImage?: boolean;
};

/** Compose a full Metadata object with localized fields + hreflang. */
export function pageMetadata({ locale, path = "", title, description, ogTitle, ownOgImage }: PageMetaInput): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: buildAlternates(path),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: ogTitle ?? title,
      description,
      url: localePath(locale, path),
      locale: localeMeta[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].og),
      // Resolved against metadataBase → absolute. Served by app/opengraph-image.tsx.
      ...(ownOgImage ? {} : { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description,
      ...(ownOgImage ? {} : { images: ["/opengraph-image"] }),
    },
  };
}
