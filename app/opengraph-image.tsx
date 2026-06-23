import { ImageResponse } from "next/og";

// Branded Open Graph card — used by social platforms and surfaced by answer
// engines in citations. Site-wide default (the file convention auto-wires it
// into openGraph.images / twitter.images). Pure inline styles, no font fetch.
export const alt = "llm-xray — See inside every open-source LLM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(1200px 600px at 18% 8%, rgba(124,92,255,0.28), transparent 60%), radial-gradient(900px 500px at 92% 96%, rgba(34,211,238,0.22), transparent 60%), #0a0e1a",
          color: "#e8edf9",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 42,
            letterSpacing: "-0.01em",
            color: "#8290b3",
          }}
        >
          <div style={{ display: "flex", width: 18, height: 18, borderRadius: 5, background: "#22d3ee", marginRight: 18 }} />
          open-source LLM architecture, x-rayed
        </div>

        <div style={{ display: "flex", alignItems: "baseline", marginTop: 28, fontSize: 150, fontWeight: 800, letterSpacing: "-0.04em" }}>
          <span>llm-</span>
          <span style={{ color: "#22d3ee" }}>x</span>
          <span>ray</span>
        </div>

        <div style={{ display: "flex", marginTop: 24, fontSize: 52, fontWeight: 600, color: "#aeb9d6" }}>
          See inside every open-source LLM
        </div>

        <div style={{ display: "flex", marginTop: 36, fontSize: 30, color: "#6b7799" }}>
          Rank by downloads &amp; benchmarks · x-ray attention, MoE, RoPE in 2D &amp; 3D
        </div>
      </div>
    ),
    { ...size },
  );
}
