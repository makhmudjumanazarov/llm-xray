import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Visible FAQ — answer-first, quotable Q&A that doubles as the source for the
 * FAQPage JSON-LD on the home page. Rendered server-side so the text is in the
 * HTML for both crawlers and answer engines (GEO/LLMO). Kept open (not collapsed)
 * so the answers are always extractable.
 */
export function FaqSection({ dict }: { dict: Dictionary }) {
  const faq = dict.faq;
  return (
    <section aria-label={faq.title} className="rounded-card border border-border bg-panel/40 p-5 elev md:p-6">
      <h2 className="font-display text-2xl font-bold tracking-tight text-text">{faq.title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {faq.items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-bg2 p-4">
            <h3 className="font-display text-base font-semibold text-text">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
