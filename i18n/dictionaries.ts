import "server-only";
import type { Locale } from "./config";
import en from "../messages/en.json";
import ru from "../messages/ru.json";
import uz from "../messages/uz.json";

// English defines the canonical shape. `ru` is complete; `uz` may be partial and
// is deep-merged over English, so any untranslated key falls back to English
// (lets us ship a locale + SEO immediately and translate deep content over time).
export type Dictionary = typeof en;

/* eslint-disable @typescript-eslint/no-explicit-any */
function deepMerge(base: any, over: any): any {
  if (over == null || typeof over !== "object" || Array.isArray(over)) return over ?? base;
  const out: any = { ...base };
  for (const k of Object.keys(over)) {
    out[k] =
      k in base && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])
        ? deepMerge(base[k], over[k])
        : over[k];
  }
  return out;
}

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru,
  uz: deepMerge(en, uz) as Dictionary,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}
