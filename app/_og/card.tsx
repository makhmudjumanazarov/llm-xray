import { OG_THEME as T } from "@/core/og";

/**
 * Shared layout for per-route Open Graph cards (compare / evolution / learn /
 * calculator): brand row + localized title + subtitle over the site gradient.
 * The `_og` folder is private (not a route segment).
 */
export function RouteCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: T.background,
        color: T.text,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", fontSize: 34, color: T.dim }}>
        <div style={{ display: "flex", width: 18, height: 18, borderRadius: 5, background: T.cyan, marginRight: 16 }} />
        <span>llm-</span>
        <span style={{ color: T.cyan }}>x</span>
        <span>ray</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 30,
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", marginTop: 26, fontSize: 40, fontWeight: 500, color: T.muted, lineHeight: 1.3 }}>
        {subtitle}
      </div>
    </div>
  );
}
