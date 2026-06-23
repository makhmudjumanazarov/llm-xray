"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import * as Icons from "@/components/ui/icons";

type Item = { id: string; label: string; iconName: string };
type IconCmp = (p: { size?: number; className?: string }) => ReactElement;
const ICONS = Icons as unknown as Record<string, IconCmp>;

/** In-page lesson index for /learn. Renders a sticky horizontal chip bar on
 *  mobile and a sticky vertical sidebar on lg+, with the lesson currently in
 *  view highlighted (IntersectionObserver). The /learn page wraps each lesson in
 *  a <section id> matching these item ids. */
export function LessonNav({ items, label }: { items: Item[]; label: string }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el != null);
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      // Trigger the "active" band roughly in the upper third of the viewport.
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [items]);

  const Link = ({ it, variant }: { it: Item; variant: "side" | "chip" }) => {
    const Icon = ICONS[it.iconName];
    const isActive = active === it.id;
    const base = "flex items-center gap-2 no-underline transition-colors";
    const cls =
      variant === "chip"
        ? `${base} shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium ${
            isActive
              ? "border-transparent bg-acc2 text-white"
              : "border-border bg-panel text-muted hover:text-text"
          }`
        : `${base} rounded-lg px-3 py-2 text-sm font-medium ${
            isActive ? "bg-acc-soft text-text" : "text-muted hover:bg-panel hover:text-text"
          }`;
    return (
      <a href={`#${it.id}`} aria-current={isActive ? "true" : undefined} className={cls}>
        {Icon && <Icon size={15} className="shrink-0" />}
        <span>{it.label}</span>
      </a>
    );
  };

  return (
    <div>
      {/* Mobile: sticky horizontal scroller below the header. */}
      <nav
        aria-label={label}
        className="sticky top-[54px] z-20 -mx-5 mb-6 border-b border-border bg-bg/85 px-5 py-2 backdrop-blur md:-mx-10 md:px-10 lg:hidden"
      >
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {items.map((it) => (
            <Link key={it.id} it={it} variant="chip" />
          ))}
        </div>
      </nav>

      {/* Desktop: sticky vertical sidebar. */}
      <nav aria-label={label} className="hidden lg:sticky lg:top-24 lg:block">
        <p className="mb-2 px-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-dim">
          {label}
        </p>
        <div className="flex flex-col gap-0.5">
          {items.map((it) => (
            <Link key={it.id} it={it} variant="side" />
          ))}
        </div>
      </nav>
    </div>
  );
}
