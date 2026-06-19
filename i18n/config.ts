// Locale configuration for LLM X-ray — usable on server, client, and in proxy.ts
// (no server-only imports here so the proxy/middleware can import it).

export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Languages we plan to add later (uz). Kept here so SEO/UI can reference the roadmap
// without shipping incomplete dictionaries.
export const plannedLocales = ["uz"] as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

// Human-readable + BCP-47 tags for <html lang>, hreflang and og:locale.
export const localeMeta: Record<Locale, { label: string; native: string; bcp47: string; og: string }> = {
  en: { label: "English", native: "English", bcp47: "en", og: "en_US" },
  ru: { label: "Russian", native: "Русский", bcp47: "ru", og: "ru_RU" },
};
