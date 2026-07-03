import Script from "next/script";

// Privacy-friendly, cookieless analytics (Umami-compatible). Renders nothing
// unless BOTH public env vars are set, so local dev and the default build stay
// tracker-free. Read directly from process.env rather than src/infra/config
// (dependency-cruiser forbids components → infra); NEXT_PUBLIC_* vars are
// inlined at build time and safe to reference in a client-visible component.
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_URL;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_ID;
  if (!src || !websiteId) return null;
  return (
    <Script
      src={`${src.replace(/\/$/, "")}/script.js`}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
