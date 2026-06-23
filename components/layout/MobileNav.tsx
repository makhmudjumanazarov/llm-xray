"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "@/components/ui/icons";

/** Mobile-only (<md) disclosure menu. The desktop <nav> in SiteHeader is
 *  `hidden md:flex`, so without this the nav links vanish on phones. */
export function MobileNav({
  items,
  menuLabel,
}: {
  items: { href: string; label: string }[];
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // While open: Escape closes (returns focus to the toggle) and the body scroll
  // is locked so the page behind the sheet doesn't move.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={btnRef}
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((o) => !o)}
        className="relative z-[60] inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-muted transition-colors hover:text-text"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <>
          {/* Backdrop — sits below the panel (and the toggle) but above the page. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/50"
          />
          <nav
            id="mobile-nav-panel"
            className="glass absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-x-0 border-b-0 p-3"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted no-underline transition-colors hover:bg-panel hover:text-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
