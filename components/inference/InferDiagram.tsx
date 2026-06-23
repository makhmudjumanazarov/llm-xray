"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import type { InferStageMeta } from "@/core/inference/stages";
import { candidatesForStep, buildGenerationScript, softmaxTemp, type SamplingState } from "@/core/inference/run";
import { TokenStrip } from "./TokenStrip";
import { AttentionGrid } from "./AttentionGrid";
import { ResidualStack } from "./ResidualStack";
import { SamplingDials } from "./SamplingDials";
import { LogitsBars } from "./LogitsBars";

const N_LAYERS = 12;

/** Deterministic 0–1 cell value for the embedding vector motif (no RNG). */
function vecCell(tok: number, dim: number): number {
  const x = Math.sin((tok + 1) * 12.9898 + (dim + 1) * 78.233) * 43758.5453;
  return Math.abs(x - Math.floor(x));
}

function EmbedMotif({ tokens, accentVar }: { tokens: string[]; accentVar: string }) {
  const toks = (tokens.length ? tokens : ["The", "cat", "sat"]).slice(0, 6);
  return (
    <div className="flex flex-wrap items-start gap-2">
      {toks.map((t, ti) => (
        <div key={ti} className="flex flex-col items-center gap-1">
          <span className="font-mono text-[10px] text-muted">{t.length > 6 ? t.slice(0, 6) : t}</span>
          <div className="flex flex-col gap-[2px]">
            {Array.from({ length: 7 }, (_, di) => (
              <span
                key={di}
                className="h-1.5 w-6 rounded-sm"
                style={{ background: accentVar, opacity: 0.2 + vecCell(ti, di) * 0.8 }}
              />
            ))}
          </div>
          <span className="text-[9px]" style={{ color: accentVar }} aria-hidden="true">
            ⟳{ti}
          </span>
        </div>
      ))}
    </div>
  );
}

export function InferDiagram({
  stage,
  expert,
  prompt,
  tokens,
  sampling,
  setSampling,
  j,
}: {
  stage: InferStageMeta;
  expert: boolean;
  prompt: string;
  tokens: string[];
  sampling: SamplingState;
  setSampling: (s: SamplingState) => void;
  j: Dictionary["inference"];
}) {
  const accentVar = `var(${stage.accentToken})`;
  const candidates = candidatesForStep(0);

  let body: React.ReactNode = null;
  switch (stage.id) {
    case "tokenize":
      body = (
        <TokenStrip tokens={tokens} promptLabel={j.tokensLabel} generatedLabel={j.generatedLabel} accentVar={accentVar} caret={false} />
      );
      break;
    case "embed":
      body = <EmbedMotif tokens={tokens} accentVar={accentVar} />;
      break;
    case "layers":
      body = expert ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AttentionGrid tokens={tokens} accentVar={accentVar} labels={j.attention} />
          <ResidualStack numLayers={N_LAYERS} accentVar={accentVar} kvSize={tokens.length} kvLabel={j.kvCacheLabel} kvNote={j.kvCacheNote} />
        </div>
      ) : (
        <AttentionGrid tokens={tokens} accentVar={accentVar} labels={j.attention} />
      );
      break;
    case "logits": {
      const probs = softmaxTemp(candidates.map((c) => c.logit), 1);
      body = <LogitsBars bars={candidates.map((c, i) => ({ label: c.token, prob: probs[i] }))} accentVar={accentVar} />;
      break;
    }
    case "sampling":
      body = <SamplingDials candidates={candidates} sampling={sampling} setSampling={setSampling} labels={j.sampling} accentVar={accentVar} />;
      break;
    case "loop": {
      const script = buildGenerationScript(prompt, 4);
      const generated = script.steps.map((s) => s.chosenToken);
      body = (
        <div className="space-y-2">
          <TokenStrip tokens={tokens} generated={generated} promptLabel={j.tokensLabel} generatedLabel={j.generatedLabel} accentVar={accentVar} />
          <div className="flex items-center gap-2 font-mono text-[10px] text-dim">
            <span style={{ color: accentVar }}>↺ {j.loop.repeat}</span>
            <span>·</span>
            <span>{j.loop.caption}</span>
          </div>
        </div>
      );
      break;
    }
  }

  return <div className="rounded-lg border border-border bg-panel/40 p-3">{body}</div>;
}
