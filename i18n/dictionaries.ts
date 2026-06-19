import "server-only";
import type { Locale } from "./config";
import en from "../messages/en.json";
import ru from "../messages/ru.json";

// The English dictionary defines the canonical shape; `ru` must match it
// structurally (enforced by the typed map below) — build fails on missing keys.
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, ru };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}
