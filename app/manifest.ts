import type { MetadataRoute } from "next";

// Web App Manifest — makes llm-xray installable (add-to-home-screen) without a
// service worker. Single-locale (manifests aren't per-locale); colors are the
// literal dark-theme --bg / --acc2 tokens (a manifest can't read CSS vars).
// Served at /manifest.webmanifest and auto-linked; proxy.ts ignores it (its
// matcher already excludes any dotted path).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "llm-xray — see how open-source LLMs work",
    short_name: "llm-xray",
    description:
      "Rank the latest open-source LLMs and x-ray any model's architecture — attention, MoE, RoPE — in interactive 2D and 3D.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e1a",
    theme_color: "#0a0e1a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
