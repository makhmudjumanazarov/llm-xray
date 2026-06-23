import type { LayerKind } from "@/core/evolution/deepdive";

// One palette for the historical-architecture visualizers, keyed by layer kind.
// KIND_VAR mirrors LayerStack.tsx (CSS design tokens) so the 2D diagram reads as
// the same family as the kept layer list. KIND_HEX is the resolved-hex twin for
// the WebGL scene (three.js can't read CSS custom properties).

export const KIND_VAR: Record<LayerKind, string> = {
  input: "var(--dim)",
  embed: "var(--acc2)",
  conv: "var(--slide)",
  pool: "var(--proj)",
  norm: "var(--dim)",
  act: "var(--aud)",
  fc: "var(--acc)",
  recurrent: "var(--aud)",
  attention: "var(--acc2)",
  residual: "var(--full)",
  moe: "var(--aud)",
  op: "var(--proj)",
  output: "var(--cyan)",
};

export const KIND_HEX: Record<LayerKind, string> = {
  input: "#8290b3",
  embed: "#7c5cff",
  conv: "#3b82f6",
  pool: "#22d3ee",
  norm: "#8290b3",
  act: "#fbbf24",
  fc: "#a78bfa",
  recurrent: "#fbbf24",
  attention: "#7c5cff",
  residual: "#f472b6",
  moe: "#fbbf24",
  op: "#22d3ee",
  output: "#22d3ee",
};
