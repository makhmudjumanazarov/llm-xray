"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { Share, Check } from "./icons";

/**
 * Share / copy-link button: the native share sheet where available (mobile),
 * otherwise copy-to-clipboard with a transient inline "copied" state — the
 * codebase has no toast layer, and a label swap is enough feedback.
 * `url` defaults to the live location at click time so query-string state
 * (compare selections, calculator settings, active era) rides along.
 */
export function ShareButton({
  title,
  url,
  dict,
  className = "",
}: {
  title: string;
  url?: string;
  dict: Dictionary;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const share = async () => {
    const target = url ?? window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: target });
        return;
      }
      await navigator.clipboard.writeText(target);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked — nothing to clean up.
    }
  };

  return (
    <button
      onClick={share}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 py-1.5 font-mono text-xs font-semibold text-muted transition-colors hover:border-border2 hover:text-text ${className}`}
    >
      {copied ? <Check size={13} className="text-success" /> : <Share size={13} />}
      <span aria-live="polite">{copied ? dict.share.copied : dict.share.share}</span>
    </button>
  );
}
