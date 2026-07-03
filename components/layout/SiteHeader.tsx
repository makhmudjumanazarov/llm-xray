"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localePath } from "@/core/seo";
import { Search } from "@/components/ui/icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";

function SearchBox({ locale, placeholder }: { locale: Locale; placeholder: string }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(localePath(locale, "/models") + "?q=" + encodeURIComponent(term));
      }}
      className="hidden items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 sm:flex"
      role="search"
    >
      <Search size={15} className="shrink-0 text-dim" />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-32 bg-transparent text-sm text-text placeholder:text-dim focus:outline-none md:w-44"
      />
    </form>
  );
}

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const nav = [
    { href: localePath(locale, "/models"), label: dict.nav.home },
    { href: localePath(locale, "/learn"), label: dict.nav.learn },
    { href: localePath(locale, "/evolution"), label: dict.nav.evolution },
    { href: localePath(locale, "/compare"), label: dict.nav.compare },
    { href: localePath(locale, "/calculator"), label: dict.nav.calculator },
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
          <SearchBox locale={locale} placeholder={dict.home.searchPlaceholder} />
          <LanguageSwitcher locale={locale} />
          <MobileNav items={nav} menuLabel={dict.nav.menu} />
        </div>
      </div>
    </header>
  );
}
