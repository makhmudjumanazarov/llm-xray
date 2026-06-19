"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeMeta, isLocale, type Locale } from "@/i18n/config";

/** Swaps the leading /<locale> segment of the current path, preserving the rest. */
function swapLocale(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  // parts[0] is "" (leading slash), parts[1] is the current locale segment.
  if (parts[1] && isLocale(parts[1])) {
    parts[1] = next;
    return parts.join("/") || `/${next}`;
  }
  return `/${next}${pathname}`;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-panel p-0.5">
      {locales.map((l) => (
        <Link
          key={l}
          href={swapLocale(pathname, l)}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded-md px-2 py-1 font-mono text-xs font-semibold no-underline transition-colors ${
            l === locale
              ? "bg-acc2 text-white"
              : "text-muted hover:text-text"
          }`}
        >
          {localeMeta[l].bcp47.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
