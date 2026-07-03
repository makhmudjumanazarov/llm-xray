import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, isLocale, localeMeta } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, SITE_NAME } from "@/core/seo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@/components/seo/Analytics";
import { graph, organizationNode, websiteNode } from "@/core/jsonld";

// Dark-theme browser chrome; matches the manifest theme_color.
export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  colorScheme: "dark",
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Display face for headings — Cyrillic-safe for the ru locale.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"], weight: ["600", "700", "800"] });

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
  return {
    ...pageMetadata({
      locale,
      path: "",
      title: `${dict.site.name} — ${dict.site.tagline}`,
      description: dict.site.description,
    }),
    title: { default: `${dict.site.name} — ${dict.site.tagline}`, template: `%s · ${SITE_NAME}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={localeMeta[locale].bcp47}
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
    >
      <body
        className="min-h-screen flex flex-col bg-bg text-text"
        style={{ zoom: "var(--ui-scale)" } as React.CSSProperties}
      >
        {/* Site-wide structured data (Organization + WebSite) on every page —
            the entity backbone classic crawlers and answer engines resolve against. */}
        <JsonLd data={graph(organizationNode(), websiteNode(locale))} />
        <SiteHeader locale={locale} dict={dict} />
        <main className="flex-1 w-full">{children}</main>
        <SiteFooter dict={dict} />
        <Analytics />
      </body>
    </html>
  );
}
