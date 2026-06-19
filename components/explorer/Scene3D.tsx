"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { Mesh } from "three";
import type { Model } from "@/core/model/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { decoderBlock, layerColorKind, type SubOp } from "@/core/model/blocks";
import { buildForwardPass, tokenizeIllustrative, type FpFrame } from "@/core/model/forwardPass";

const C = {
  slide: "#3b82f6",
  full: "#f472b6",
  acc2: "#7c5cff",
  proj: "#22d3ee",
  embed: "#7c5cff",
  logits: "#22d3ee",
  vis: "#34d399",
  aud: "#fbbf24",
  norm: "#64748b",
  attn: "#8b5cf6",
  out: "#7c5cff",
  mlp: "#2563eb",
  router: "#f59e0b",
  expert: "#fbbf24",
};

const PITCH = 0.62;
const LW = 4;
const LD = 4;
const LT = 0.46;

function opColor(kind: SubOp["kind"]): string {
  switch (kind) {
    case "norm": return C.norm;
    case "qkv": return C.attn;
    case "sdpa": return C.proj;
    case "out": return C.out;
    case "gate":
    case "up":
    case "down": return C.mlp;
    case "router": return C.router;
    case "expert": return C.expert;
  }
}

function layerColor(model: Model, i: number): string {
  const k = layerColorKind(model, i);
  if (k === "full") return C.full;
  if (k === "sliding") return C.slide;
  switch (model.text.attentionType) {
    case "mla": return C.proj;
    case "mqa": return C.slide;
    default: return C.acc2;
  }
}

function Box({
  position,
  size,
  color,
  highlight,
  glow,
  onClick,
  onOver,
  onOut,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  highlight?: boolean;
  glow?: number;
  onClick?: (e: { stopPropagation: () => void }) => void;
  onOver?: () => void;
  onOut?: () => void;
}) {
  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerOver={onOver ? (e) => { e.stopPropagation(); onOver(); document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onOut ? () => { onOut(); document.body.style.cursor = "default"; } : undefined}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.55}
        roughness={0.32}
        envMapIntensity={0.85}
        emissive={color}
        emissiveIntensity={glow ?? (highlight ? 0.6 : 0.1)}
      />
    </mesh>
  );
}

/** Cyan pulse that smoothly chases the current forward-pass position. */
function Pulse({ targetY }: { targetY: { current: number } }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    m.position.y += (targetY.current - m.position.y) * 0.18;
    m.scale.setScalar(1 + 0.15 * Math.sin(state.clock.elapsedTime * 9));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.15, 20, 20]} />
      <meshBasicMaterial color={C.proj} transparent opacity={0.8} />
    </mesh>
  );
}

function StackOverview({
  model,
  onDrill,
  litIndex = null,
  activeRegion = null,
}: {
  model: Model;
  onDrill: (i: number) => void;
  litIndex?: number | null;
  activeRegion?: "embed" | "logits" | null;
}) {
  const n = model.text.numLayers;
  const [hover, setHover] = useState<number | null>(null);
  const topY = n * PITCH;
  const encoders = model.encoders ?? [];
  const playing = litIndex !== null;

  const layerGlow = (i: number): number | undefined => {
    if (!playing) return undefined;
    if (i === litIndex) return 0.95;
    if (i < (litIndex as number)) return 0.32;
    return 0.05;
  };

  return (
    <group>
      {/* token embedding */}
      <Box
        position={[0, -1.1, 0]}
        size={[LW + 1.4, 0.7, LD + 1.4]}
        color={C.embed}
        glow={activeRegion === "embed" ? 0.85 : undefined}
      />
      <Html position={[0, -1.9, 0]} center distanceFactor={18}>
        <div className="whitespace-nowrap rounded bg-bg/90 px-2 py-0.5 font-mono text-[11px] text-acc">
          embedding · {model.text.vocabSize.toLocaleString()}×{model.text.hiddenSize}
        </div>
      </Html>

      {/* decoder layer stack */}
      {Array.from({ length: n }, (_, i) => (
        <Box
          key={i}
          position={[0, i * PITCH + PITCH / 2, 0]}
          size={[LW, LT, LD]}
          color={layerColor(model, i)}
          highlight={!playing && hover === i}
          glow={layerGlow(i)}
          onClick={playing ? undefined : (e) => { e.stopPropagation(); onDrill(i); }}
          onOver={playing ? undefined : () => setHover(i)}
          onOut={playing ? undefined : () => setHover((h) => (h === i ? null : h))}
        />
      ))}
      <Html position={[0, topY + 0.9, 0]} center distanceFactor={18}>
        <div className="whitespace-nowrap rounded bg-bg/90 px-2 py-0.5 font-mono text-[11px] text-acc">
          {n} × decoder · {model.text.attentionType.toUpperCase()}
        </div>
      </Html>

      {/* logits */}
      <Box
        position={[0, topY + 1.9, 0]}
        size={[LW - 0.8, 0.6, LD - 0.8]}
        color={C.logits}
        glow={activeRegion === "logits" ? 0.95 : undefined}
      />
      <Html position={[0, topY + 2.7, 0]} center distanceFactor={18}>
        <div className="whitespace-nowrap rounded bg-bg/90 px-2 py-0.5 font-mono text-[11px] text-proj">
          logits → softmax
        </div>
      </Html>

      {/* encoder towers (multimodal) */}
      {encoders.map((enc, k) => {
        const x = k === 0 ? -7.5 : 7.5;
        const col = enc.kind === "vision" ? C.vis : C.aud;
        const en = Math.min(enc.numLayers, 24);
        return (
          <group key={enc.kind}>
            {Array.from({ length: en }, (_, i) => (
              <Box key={i} position={[x, i * 0.34 + 1, 0]} size={[2.6, 0.26, 2.6]} color={col} />
            ))}
            <Html position={[x, en * 0.34 + 1.7, 0]} center distanceFactor={18}>
              <div className="whitespace-nowrap rounded bg-bg/90 px-2 py-0.5 font-mono text-[11px]" style={{ color: col }}>
                {enc.kind} · {enc.numLayers}L
              </div>
            </Html>
          </group>
        );
      })}

      <gridHelper args={[60, 24, "#2e3f63", "#182238"]} position={[0, -1.5, 0]} />
    </group>
  );
}

function LayerDetail({
  model,
  layer,
  selected,
  onSelect,
}: {
  model: Model;
  layer: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = decoderBlock(model);
  const ROW = 2.4;
  const LANE = 2.0;
  let row = 0;
  const rows = groups.map((g) => {
    const y = row * ROW;
    row++;
    return { g, y };
  });
  const topY = (row - 1) * ROW;

  return (
    <group>
      <Html position={[0, topY + 1.6, 0]} center distanceFactor={20}>
        <div className="whitespace-nowrap rounded bg-bg/90 px-2 py-0.5 font-mono text-xs font-bold text-text">
          layer #{layer} · {model.text.attentionType.toUpperCase()}
        </div>
      </Html>
      {rows.map(({ g, y }) => (
        <group key={g.id}>
          <Html position={[-(g.ops.length * LANE) / 2 - 2.4, y + 0.2, 0]} center distanceFactor={20}>
            <div className="whitespace-nowrap font-mono text-[11px] text-muted">{g.id}</div>
          </Html>
          {g.ops.map((op, j) => {
            const x = (j - (g.ops.length - 1) / 2) * LANE;
            return (
              <group key={op.id}>
                <Box
                  position={[x, y, 0]}
                  size={[1.3, 0.5, 1.3]}
                  color={opColor(op.kind)}
                  highlight={selected === op.id}
                  onClick={(e) => { e.stopPropagation(); onSelect(op.id); }}
                />
                <Html position={[x, y + 0.7, 0]} center distanceFactor={20}>
                  <div className="whitespace-nowrap font-mono text-[10px] text-dim">{op.label}</div>
                </Html>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function pulseYFor(frame: FpFrame, n: number): number {
  if (frame.region === "embed") return -1.1;
  if (frame.region === "logits") return n * PITCH + 1.9;
  return (frame.layer ?? 0) * PITCH + PITCH / 2;
}

export function Scene3D({
  model,
  dict,
  selected,
  onSelect,
}: {
  model: Model;
  dict: Dictionary;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [drill, setDrill] = useState<number | null>(null);

  // Forward-pass animation state.
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<string[]>([]);
  const [frames, setFrames] = useState<FpFrame[] | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const pulseY = useRef(0);
  const playing = frames !== null;
  const frame = playing ? frames[frameIdx] : null;

  useEffect(() => {
    if (!frames) return;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const n = model.text.numLayers;
    const step = () => {
      setFrameIdx(idx);
      const f = frames[idx];
      pulseY.current = pulseYFor(f, n);
      if (idx < frames.length - 1) {
        timer = setTimeout(() => { idx++; step(); }, f.durationMs);
      } else {
        timer = setTimeout(() => setFrames(null), f.durationMs);
      }
    };
    step();
    return () => clearTimeout(timer);
  }, [frames, model]);

  const { camPos, target } = useMemo(() => {
    if (drill != null) {
      const h = decoderBlock(model).length * 2.4;
      return { camPos: [2, h / 2, 16] as [number, number, number], target: [0, h / 2, 0] as [number, number, number] };
    }
    const stackH = model.text.numLayers * PITCH;
    const dist = Math.max(12, stackH * 1.35);
    return {
      camPos: [dist * 0.7, stackH * 0.55, dist] as [number, number, number],
      target: [0, stackH * 0.5, 0] as [number, number, number],
    };
  }, [model, drill]);

  function runForward() {
    setDrill(null);
    setTokens(tokenizeIllustrative(query.trim() || dict.forward.sample));
    setFrameIdx(0);
    setFrames(buildForwardPass(model));
  }

  const litIndex = frame ? frame.litIndex : null;
  const activeRegion = frame ? (frame.region === "embed" ? "embed" : frame.region === "logits" ? "logits" : null) : null;
  const fstages = dict.forward.stages as Record<string, string>;

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-card border border-border bg-[#0a0e1a]">
      <Canvas
        key={drill == null ? "overview" : `detail-${drill}`}
        camera={{ position: camPos, fov: 50, near: 0.1, far: 2000 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[30, 50, 35]} intensity={0.7} />
        {/* Brand-colored studio rig — reflects off the metallic slabs (the "lit" look). */}
        <Environment resolution={256}>
          <Lightformer intensity={2.4} color="#7c5cff" position={[-6, 5, -4]} scale={[9, 9, 1]} />
          <Lightformer intensity={1.8} color="#22d3ee" position={[7, 1, 5]} scale={[7, 7, 1]} />
          <Lightformer intensity={1.2} color="#ffffff" position={[0, 9, 3]} scale={[12, 3, 1]} />
          <Lightformer intensity={0.8} color="#f472b6" position={[3, -6, -3]} scale={[6, 6, 1]} />
        </Environment>
        {drill == null ? (
          <>
            <StackOverview model={model} onDrill={setDrill} litIndex={litIndex} activeRegion={activeRegion} />
            {playing && <Pulse targetY={pulseY} />}
          </>
        ) : (
          <LayerDetail model={model} layer={drill} selected={selected} onSelect={onSelect} />
        )}
        <OrbitControls target={target} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={200} />
        {/* Glow: bright emissive layers + the cyan pulse bleed light. */}
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.22} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {/* overlay chrome */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
        {drill != null && (
          <button
            onClick={() => setDrill(null)}
            className="pointer-events-auto rounded-lg border border-border bg-panel/90 px-2.5 py-1.5 font-mono text-xs text-text hover:border-border2"
          >
            {dict.explorer.back}
          </button>
        )}
        {!playing && (
          <div className="rounded-lg bg-panel/70 px-2.5 py-1.5 font-mono text-[11px] text-dim">
            {drill == null ? dict.explorer.drillHint : dict.explorer.selectHint}
          </div>
        )}
      </div>

      {/* legend (layer types) */}
      {drill == null && model.text.layerTypes && (
        <div className="absolute right-3 top-3 flex gap-3 rounded-lg bg-panel/70 px-2.5 py-1.5 font-mono text-[11px]">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C.slide }} />sliding</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C.full }} />full</span>
        </div>
      )}

      {/* forward-pass HUD */}
      {playing && frame && (
        <div className="pointer-events-none absolute left-1/2 top-3 w-[min(92%,520px)] -translate-x-1/2 rounded-card border border-border bg-bg/85 px-3 py-2 backdrop-blur">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-proj">{fstages[frame.stage]}</span>
            {frame.stage === "layer" && (
              <span className="font-mono text-[11px] text-muted">
                {(frame.layer ?? 0) + 1} {dict.forward.ofLayers.replace("{n}", String(model.text.numLayers))}
                {frame.attn === "full" && <span className="ml-1.5 text-full">· {dict.forward.attnFull}</span>}
                {frame.attn === "sliding" && <span className="ml-1.5 text-slide">· {dict.forward.attnSliding}</span>}
              </span>
            )}
            {frame.stage === "sample" && (
              <span className="font-mono text-[11px] text-aud">
                {dict.forward.genToken.replace("{n}", String(frame.genToken ?? 1))}
              </span>
            )}
          </div>
          {tokens.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tokens.map((t, i) => (
                <span key={i} className="rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted">{t}</span>
              ))}
            </div>
          )}
          <div className="mt-1.5 text-[10px] text-dim">{dict.forward.illustrative}</div>
        </div>
      )}

      {/* forward-pass controls */}
      {drill == null && (
        <div className="absolute inset-x-3 bottom-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !playing) runForward(); }}
            placeholder={dict.forward.queryPlaceholder}
            disabled={playing}
            className="pointer-events-auto min-w-0 flex-1 rounded-lg border border-border bg-panel/90 px-3 py-1.5 text-sm text-text outline-none focus:border-border2 disabled:opacity-60"
          />
          <button
            onClick={() => (playing ? setFrames(null) : runForward())}
            className={`pointer-events-auto whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-xs font-semibold ${
              playing ? "bg-panel text-muted hover:text-text" : "bg-acc2 text-white"
            }`}
          >
            {playing ? dict.forward.stop : dict.forward.run}
          </button>
        </div>
      )}
    </div>
  );
}
