// Pure helpers behind the dynamic Open Graph cards (app/**/opengraph-image.tsx).
// Satori can't read CSS variables, so the card theme mirrors the design tokens
// from app/globals.css as hardcoded hex — same convention as the 3D palettes.

import type { Model } from "@/core/model/schema";
import { params as fmtParams, contextLen as fmtCtx } from "@/core/shared/format";

export const OG_THEME = {
  bg: "#0a0e1a",
  text: "#e8edf9",
  muted: "#aeb9d6",
  dim: "#8290b3",
  faint: "#6b7799",
  violet: "#7c5cff",
  cyan: "#22d3ee",
  panel: "rgba(255,255,255,0.04)",
  border: "rgba(174,185,214,0.18)",
  background:
    "radial-gradient(1200px 600px at 18% 8%, rgba(124,92,255,0.28), transparent 60%), radial-gradient(900px 500px at 92% 96%, rgba(34,211,238,0.22), transparent 60%), #0a0e1a",
} as const;

export type OgStat = { label: string; value: string };

/** The three headline stats for a model card. */
export function modelOgStats(m: Model): OgStat[] {
  return [
    { label: "params", value: fmtParams(m.paramsB) },
    { label: "layers", value: String(m.text.numLayers) },
    { label: "context", value: fmtCtx(m.text.contextLen) },
  ];
}

export type OgStripSegment = { kind: "embed" | "attention" | "mlp" | "moe" | "head"; color: string };

/** Max ticks the bottom architecture strip renders (keeps the card light). */
export const OG_STRIP_MAX = 28;

/**
 * A compact embed → [attention|mlp]* → head strip for the card footer:
 * one alternating tick pair per transformer layer, downsampled to the cap.
 */
export function archStripSegments(m: Model): OgStripSegment[] {
  const layers = Math.max(1, m.text.numLayers);
  const perLayer: OgStripSegment[] = m.text.moe
    ? [
        { kind: "attention", color: OG_THEME.violet },
        { kind: "moe", color: OG_THEME.cyan },
      ]
    : [
        { kind: "attention", color: OG_THEME.violet },
        { kind: "mlp", color: OG_THEME.dim },
      ];
  const body: OgStripSegment[] = [];
  const shown = Math.min(layers, OG_STRIP_MAX - 2);
  for (let i = 0; i < shown; i++) body.push(perLayer[i % perLayer.length]);
  return [{ kind: "embed", color: OG_THEME.faint }, ...body, { kind: "head", color: OG_THEME.faint }];
}

/** Badge strings for the model card header row. */
export function modelOgBadges(m: Model): string[] {
  const badges = [m.family, m.text.attentionType.toUpperCase()];
  if (m.text.moe) badges.push(`MoE ${m.text.moe.numExperts}×top-${m.text.moe.topK}`);
  return badges;
}
