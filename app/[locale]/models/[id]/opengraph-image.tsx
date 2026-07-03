import { ImageResponse } from "next/og";
import { getModelBySlug } from "@/modules/catalog";
import { OG_THEME as T, modelOgStats, modelOgBadges, archStripSegments } from "@/core/og";

// Per-model Open Graph card. No generateStaticParams on purpose: 3 locales ×
// ~75 models would add 200+ satori renders to every build, so cards render
// on demand and ISR-cache in step with the page below.
export const revalidate = 86400;
export const alt = "Model architecture — llm-xray";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ModelOgImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const model = await getModelBySlug(id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          background: T.background,
          color: T.text,
          fontFamily: "sans-serif",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, color: T.dim }}>
          <div style={{ display: "flex", width: 16, height: 16, borderRadius: 4, background: T.cyan, marginRight: 14 }} />
          llm-xray · open-source LLM architecture, x-rayed
        </div>

        {model ? (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginTop: 28 }}>
            <div style={{ display: "flex", fontSize: 84, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {model.name}
            </div>

            {/* badges */}
            <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
              {modelOgBadges(model).map((b, i) => (
                <div
                  key={b}
                  style={{
                    display: "flex",
                    padding: "8px 20px",
                    borderRadius: 10,
                    border: `2px solid ${T.border}`,
                    background: T.panel,
                    fontSize: 28,
                    fontWeight: 600,
                    color: i === 0 ? T.muted : i === 1 ? T.violet : T.cyan,
                  }}
                >
                  {b}
                </div>
              ))}
            </div>

            {/* stat tiles */}
            <div style={{ display: "flex", gap: 20, marginTop: 34 }}>
              {modelOgStats(model).map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "20px 34px",
                    borderRadius: 14,
                    border: `2px solid ${T.border}`,
                    background: T.panel,
                  }}
                >
                  <div style={{ display: "flex", fontSize: 24, textTransform: "uppercase", color: T.faint }}>
                    {s.label}
                  </div>
                  <div style={{ display: "flex", fontSize: 52, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* architecture strip */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: "auto" }}>
              {archStripSegments(model).map((seg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: seg.kind === "embed" || seg.kind === "head" ? 26 : 34,
                    height: seg.kind === "embed" || seg.kind === "head" ? 22 : 34,
                    borderRadius: 6,
                    background: seg.color,
                    opacity: seg.kind === "mlp" ? 0.55 : 0.95,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          // Unknown slug: never 404 an og:image — fall back to the brand card.
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 140, fontWeight: 800, letterSpacing: "-0.04em" }}>
              <span>llm-</span>
              <span style={{ color: T.cyan }}>x</span>
              <span>ray</span>
            </div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 48, fontWeight: 600, color: T.muted }}>
              See inside every open-source LLM
            </div>
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
