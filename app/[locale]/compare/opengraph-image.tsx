import { ImageResponse } from "next/og";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { RouteCard } from "@/app/_og/card";

// Localized Open Graph card for /compare (3 locales, rendered on demand).
export const revalidate = 86400;
export const alt = "llm-xray — compare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? locale : defaultLocale);
  return new ImageResponse(<RouteCard title={dict.compare.title} subtitle={dict.compare.subtitle} />, { ...size });
}
