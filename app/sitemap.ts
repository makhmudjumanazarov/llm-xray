import type { MetadataRoute } from "next";
import { locales, defaultLocale, localeMeta } from "@/i18n/config";
import { SITE_URL, localePath } from "@/core/seo";
import { getAllModels } from "@/modules/catalog";

function abs(p: string): string {
  return `${SITE_URL}${p}`;
}

/** One sitemap entry per route, with hreflang alternates for every locale. */
function entry(path: string, lastModified?: string | Date): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeMeta[l].bcp47] = abs(localePath(l, path));
  return {
    url: abs(localePath(defaultLocale, path)),
    lastModified: lastModified ?? new Date(),
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/models", "/learn", "/evolution", "/compare"];
  const models = await getAllModels();
  const modelPaths = models.map((m) => entry(`/models/${m.slug}`, m.stats.lastModified));
  return [...staticPaths.map((p) => entry(p)), ...modelPaths];
}
