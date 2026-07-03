// Tiny custom-event helper for the analytics layer. No-op unless the Umami
// script has loaded (see components/seo/Analytics.tsx), so call sites never
// need to guard on whether analytics is configured.
export function trackEvent(name: string, data?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  window.umami?.track(name, data);
}
