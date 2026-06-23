import type { Dictionary } from "@/i18n/dictionaries";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-16 w-full border-t border-border">
      <div className="mx-auto w-full max-w-[1680px] px-5 py-8 md:px-10">
        <p className="max-w-3xl text-sm text-dim">{dict.footer.dataNote}</p>
        <p className="mt-3 font-mono text-xs text-dim">{dict.site.name} · llm-xray.com</p>
      </div>
    </footer>
  );
}
