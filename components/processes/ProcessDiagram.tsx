"use client";

import type { ProcessId } from "@/core/processes/definitions";
import { useMounted, usePrefersReducedMotion } from "@/components/training/hooks";

// Compact, explicitly-illustrative schematic per process. Themed by the process
// accent; structural strokes use --border2/--dim. Shared 240×120 viewBox.

const D = "var(--dim)";

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg2 p-3">
      <svg viewBox="0 0 240 120" className="h-40 w-full" role="img" aria-label={label}>
        {children}
      </svg>
    </div>
  );
}

function ArrowRight({ x1, x2, y, color = D }: { x1: number; x2: number; y: number; color?: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1.6" />
      <path d={`M${x2 - 5} ${y - 4} ${x2} ${y} ${x2 - 5} ${y + 4}`} fill="none" stroke={color} strokeWidth="1.6" />
    </g>
  );
}

/* 1 — Quantization: a fine fp32 block compressed to a coarse low-bit block. */
function Quantization({ a }: { a: string }) {
  const fine = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++)
      fine.push(<rect key={`f${r}-${c}`} x={20 + c * 9} y={30 + r * 9} width="8" height="8" rx="1" fill={a} opacity={0.25 + ((r + c) % 4) * 0.18} />);
  const coarse = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      coarse.push(<rect key={`q${r}-${c}`} x={158 + c * 18} y={30 + r * 18} width="16" height="16" rx="1.5" fill={a} opacity={0.4 + ((r + c) % 2) * 0.45} stroke={a} strokeWidth="0.8" />);
  return (
    <Frame label="Quantization">
      {fine}
      <text x="46" y="96" textAnchor="middle" fontSize="9" fill={D} fontFamily="monospace">fp32</text>
      <ArrowRight x1={92} x2={150} y={56} color={a} />
      <text x="121" y="48" textAnchor="middle" fontSize="9" fill={a} fontFamily="monospace">int4</text>
      {coarse}
      <text x="185" y="96" textAnchor="middle" fontSize="9" fill={D} fontFamily="monospace">≈ ¼ size</text>
    </Frame>
  );
}

/* 2 — Distillation: a big teacher transfers soft targets to a small student. */
function Distillation({ a }: { a: string }) {
  return (
    <Frame label="Knowledge distillation">
      <circle cx="58" cy="58" r="34" fill="none" stroke={D} strokeWidth="2" />
      <text x="58" y="56" textAnchor="middle" fontSize="11" fill={D} fontFamily="monospace">teacher</text>
      <text x="58" y="70" textAnchor="middle" fontSize="8" fill={D} fontFamily="monospace">(large)</text>
      <line x1="96" y1="58" x2="150" y2="58" stroke={a} strokeWidth="1.6" strokeDasharray="4 3" />
      <text x="123" y="50" textAnchor="middle" fontSize="9" fill={a} fontFamily="monospace">KL</text>
      <circle cx="184" cy="58" r="20" fill={a} opacity="0.18" stroke={a} strokeWidth="2" />
      <text x="184" y="56" textAnchor="middle" fontSize="10" fill={a} fontFamily="monospace">student</text>
      <text x="184" y="68" textAnchor="middle" fontSize="8" fill={a} fontFamily="monospace">(small)</text>
    </Frame>
  );
}

/* 3 — Adaptation: frozen base + a small trainable LoRA adapter on your data. */
function Adaptation({ a }: { a: string }) {
  return (
    <Frame label="Adaptation (LoRA)">
      <rect x="30" y="34" width="60" height="52" rx="4" fill="var(--panel2)" stroke={D} strokeWidth="1.6" />
      <text x="60" y="56" textAnchor="middle" fontSize="11" fill={D} fontFamily="monospace">W₀</text>
      <text x="60" y="70" textAnchor="middle" fontSize="13" fill={D}>❄</text>
      <text x="60" y="98" textAnchor="middle" fontSize="8" fill={D} fontFamily="monospace">frozen base</text>
      <text x="108" y="62" textAnchor="middle" fontSize="14" fill={a} fontFamily="monospace">+</text>
      <rect x="122" y="44" width="34" height="32" rx="4" fill={a} opacity="0.2" stroke={a} strokeWidth="1.8" />
      <text x="139" y="64" textAnchor="middle" fontSize="11" fill={a} fontFamily="monospace">B·A</text>
      <text x="139" y="98" textAnchor="middle" fontSize="8" fill={a} fontFamily="monospace">adapter (~1%)</text>
      <ArrowRight x1={176} x2={210} y={60} color={D} />
      <text x="200" y="44" textAnchor="middle" fontSize="8" fill={D} fontFamily="monospace">your data</text>
    </Frame>
  );
}

/* 4 — RAG: query → retriever → top-k docs → LLM → grounded answer. */
function Rag({ a, drawn }: { a: string; drawn: boolean }) {
  return (
    <Frame label="Retrieval-augmented generation">
      <rect x="14" y="50" width="34" height="20" rx="3" fill="var(--panel2)" stroke={D} strokeWidth="1.4" />
      <text x="31" y="63" textAnchor="middle" fontSize="9" fill={D} fontFamily="monospace">query</text>
      <ArrowRight x1={48} x2={70} y={60} />
      {/* doc store */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={74 + i * 4} y={42 - i * 2} width="26" height="34" rx="2" fill={a} opacity={0.18 + i * 0.12} stroke={a} strokeWidth="1.2" />
      ))}
      <text x="88" y="92" textAnchor="middle" fontSize="8" fill={a} fontFamily="monospace">top-k docs</text>
      <ArrowRight x1={108} x2={132} y={60} color={a} />
      <rect x="134" y="46" width="40" height="28" rx="5" fill="var(--panel2)" stroke={a} strokeWidth="1.8" />
      <text x="154" y="64" textAnchor="middle" fontSize="10" fill={a} fontFamily="monospace">LLM</text>
      <ArrowRight x1={176} x2={200} y={60} />
      <text x="214" y="63" textAnchor="middle" fontSize="9" fill={D} fontFamily="monospace">ans</text>
      {/* flowing packet along the pipeline */}
      <circle cx="0" cy="60" r="2.5" fill="var(--cyan)" opacity={drawn ? 0.9 : 0}>
        {drawn && <animate attributeName="cx" values="50;200" dur="2.6s" repeatCount="indefinite" />}
      </circle>
    </Frame>
  );
}

/* 5 — Agents: an observe→think→act loop wired to external tools. */
function Agents({ a }: { a: string }) {
  const tools = ["search", "code", "calc"];
  return (
    <Frame label="Agents and tool use">
      <rect x="92" y="46" width="56" height="30" rx="6" fill={a} opacity="0.18" stroke={a} strokeWidth="1.8" />
      <text x="120" y="65" textAnchor="middle" fontSize="10" fill={a} fontFamily="monospace">agent</text>
      {/* loop */}
      <path d="M120 40 a30 30 0 1 1 -1 0" fill="none" stroke={D} strokeWidth="1.4" strokeDasharray="3 3" />
      <text x="120" y="20" textAnchor="middle" fontSize="8" fill={D} fontFamily="monospace">observe → think → act</text>
      {/* tools */}
      {tools.map((t, i) => (
        <g key={t}>
          <rect x={20 + i * 70} y="92" width="58" height="18" rx="4" fill="var(--panel2)" stroke={a} strokeWidth="1.2" />
          <text x={49 + i * 70} y="104" textAnchor="middle" fontSize="9" fill={a} fontFamily="monospace">{t}</text>
          <line x1={49 + i * 70} y1="92" x2={49 + i * 70 < 120 ? 105 : i === 1 ? 120 : 135} y2="78" stroke={D} strokeWidth="1.1" />
        </g>
      ))}
    </Frame>
  );
}

/* 6 — Reasoning: a short direct answer vs a longer, better chain of thought. */
function Reasoning({ a }: { a: string }) {
  return (
    <Frame label="Reasoning / test-time compute">
      <rect x="14" y="20" width="34" height="18" rx="3" fill="var(--panel2)" stroke={D} strokeWidth="1.4" />
      <text x="31" y="32" textAnchor="middle" fontSize="9" fill={D} fontFamily="monospace">prompt</text>
      {/* direct path */}
      <line x1="48" y1="29" x2="186" y2="29" stroke={D} strokeWidth="1.3" strokeDasharray="3 3" />
      <text x="118" y="24" textAnchor="middle" fontSize="8" fill={D} fontFamily="monospace">direct (often wrong)</text>
      {/* chain of thought */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={56 + i * 34} y="58" width="28" height="18" rx="3" fill={a} opacity={0.18 + i * 0.08} stroke={a} strokeWidth="1.3" />
          <text x={70 + i * 34} y="70" textAnchor="middle" fontSize="8" fill={a} fontFamily="monospace">z{i + 1}</text>
          {i < 3 && <line x1={84 + i * 34} y1="67" x2={90 + i * 34} y2="67" stroke={a} strokeWidth="1.3" />}
        </g>
      ))}
      <line x1="31" y1="38" x2="31" y2="67" stroke={D} strokeWidth="1.2" />
      <line x1="31" y1="67" x2="54" y2="67" stroke={a} strokeWidth="1.3" />
      <text x="118" y="92" textAnchor="middle" fontSize="8" fill={a} fontFamily="monospace">chain of thought → answer ✓</text>
      <rect x="196" y="58" width="30" height="18" rx="3" fill={a} opacity="0.5" stroke={a} strokeWidth="1.4" />
      <text x="211" y="70" textAnchor="middle" fontSize="8" fill="var(--bg)" fontFamily="monospace">ans</text>
    </Frame>
  );
}

/* 7 — Serving: a fast draft model proposed, target verifies (speculative). */
function Serving({ a }: { a: string }) {
  const toks = [0, 1, 2, 3, 4];
  const accepted = [true, true, true, false, false];
  return (
    <Frame label="Serving and speculative decoding">
      <rect x="14" y="24" width="50" height="22" rx="4" fill="var(--panel2)" stroke={D} strokeWidth="1.4" />
      <text x="39" y="38" textAnchor="middle" fontSize="8.5" fill={D} fontFamily="monospace">draft (fast)</text>
      <rect x="14" y="74" width="50" height="22" rx="4" fill="var(--panel2)" stroke={a} strokeWidth="1.6" />
      <text x="39" y="88" textAnchor="middle" fontSize="8.5" fill={a} fontFamily="monospace">target</text>
      {/* proposed tokens, some accepted */}
      {toks.map((i) => (
        <g key={i}>
          <rect x={86 + i * 26} y="48" width="20" height="20" rx="3" fill={accepted[i] ? a : "var(--panel2)"} opacity={accepted[i] ? 1 : 0.6} stroke={accepted[i] ? a : D} strokeWidth="1.3" />
          <text x={96 + i * 26} y="62" textAnchor="middle" fontSize="9" fill={accepted[i] ? "var(--bg)" : D} fontFamily="monospace">{accepted[i] ? "✓" : "✕"}</text>
        </g>
      ))}
      <text x="150" y="86" textAnchor="middle" fontSize="8" fill={D} fontFamily="monospace">accept run · batch many requests</text>
      <line x1="64" y1="35" x2="84" y2="52" stroke={D} strokeWidth="1.2" />
      <line x1="64" y1="85" x2="84" y2="64" stroke={a} strokeWidth="1.2" />
    </Frame>
  );
}

/* 8 — Safety: input/output guardrails gate the model; unsafe is blocked. */
function Safety({ a }: { a: string }) {
  return (
    <Frame label="Safety and guardrails">
      <rect x="12" y="50" width="30" height="20" rx="3" fill="var(--panel2)" stroke={D} strokeWidth="1.4" />
      <text x="27" y="63" textAnchor="middle" fontSize="8.5" fill={D} fontFamily="monospace">input</text>
      {/* input guardrail */}
      <path d="M64 40 56 43v9c0 6 4 10 8 11 4-1 8-5 8-11v-9l-8-3Z" fill={a} opacity="0.18" stroke={a} strokeWidth="1.6" />
      <text x="64" y="86" textAnchor="middle" fontSize="7.5" fill={a} fontFamily="monospace">guard</text>
      <ArrowRight x1={42} x2={54} y={60} />
      <rect x="92" y="46" width="40" height="28" rx="5" fill="var(--panel2)" stroke={D} strokeWidth="1.6" />
      <text x="112" y="64" textAnchor="middle" fontSize="10" fill={D} fontFamily="monospace">LLM</text>
      <ArrowRight x1={76} x2={90} y={60} />
      {/* output guardrail */}
      <path d="M156 40 148 43v9c0 6 4 10 8 11 4-1 8-5 8-11v-9l-8-3Z" fill={a} opacity="0.18" stroke={a} strokeWidth="1.6" />
      <text x="156" y="86" textAnchor="middle" fontSize="7.5" fill={a} fontFamily="monospace">guard</text>
      <ArrowRight x1={132} x2={146} y={60} />
      {/* safe pass vs blocked */}
      <line x1="166" y1="56" x2="196" y2="44" stroke="var(--vis)" strokeWidth="1.6" />
      <text x="214" y="44" textAnchor="middle" fontSize="8.5" fill="var(--vis)" fontFamily="monospace">safe ✓</text>
      <line x1="166" y1="64" x2="196" y2="78" stroke="var(--danger)" strokeWidth="1.6" strokeDasharray="3 2" />
      <text x="214" y="80" textAnchor="middle" fontSize="8.5" fill="var(--danger)" fontFamily="monospace">block ✕</text>
    </Frame>
  );
}

export function ProcessDiagram({ id, accentVar }: { id: ProcessId; accentVar: string }) {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const drawn = mounted && !reduced;
  switch (id) {
    case "quantization":
      return <Quantization a={accentVar} />;
    case "distillation":
      return <Distillation a={accentVar} />;
    case "adaptation":
      return <Adaptation a={accentVar} />;
    case "rag":
      return <Rag a={accentVar} drawn={drawn} />;
    case "agents":
      return <Agents a={accentVar} />;
    case "reasoning":
      return <Reasoning a={accentVar} />;
    case "serving":
      return <Serving a={accentVar} />;
    case "safety":
      return <Safety a={accentVar} />;
  }
}
