import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localePath } from "@/core/seo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const nav = [
    { href: localePath(locale, ""), label: dict.nav.home },
    { href: localePath(locale, "/learn"), label: dict.nav.learn },
    { href: localePath(locale, "/compare"), label: dict.nav.compare },
  ];
  return (
    <header className="glass sticky top-0 z-30 w-full border-x-0 border-t-0">
      <div className="mx-auto flex w-full max-w-[1680px] items-center gap-6 px-5 py-3 md:px-10">
        <Link href={localePath(locale, "")} className="flex items-center gap-2 no-underline">
          <Logo size={28} />
          <span className="font-mono text-[15px] font-semibold lowercase tracking-tight text-text">
            llm-<span className="text-cyan">x</span>ray
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted no-underline transition-colors hover:bg-panel hover:text-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
