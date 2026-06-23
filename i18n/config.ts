// Locale configuration for LLM X-ray — usable on server, client, and in proxy.ts
// (no server-only imports here so the proxy/middleware can import it).

export const locales = ["en", "ru", "uz"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

// Human-readable + BCP-47 tags for <html lang>, hreflang and og:locale.
export const localeMeta: Record<Locale, { label: string; native: string; bcp47: string; og: string }> = {
  en: { label: "English", native: "English", bcp47: "en", og: "en_US" },
  ru: { label: "Russian", native: "Русский", bcp47: "ru", og: "ru_RU" },
  uz: { label: "Uzbek", native: "O‘zbekcha", bcp47: "uz", og: "uz_UZ" },
};
