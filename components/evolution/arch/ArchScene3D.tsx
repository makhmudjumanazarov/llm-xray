"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { Mesh } from "three";
import type { Architecture } from "@/core/evolution/deepdive";
import type { Dictionary } from "@/i18n/dictionaries";
import { KIND_HEX } from "./palette";

// Generic 3D view of any historical architecture: its ordered layers as a stack
// of metallic slabs (input at the bottom → output at the top), themed by layer
// kind. Click a slab to inspect it; press Run to watch activation rise through
// the stack. Mirrors the model explorer's r3f rig (Environment + Bloom, the
// ui-scale zoom counter that keeps the WebGL canvas measured correctly).

const PITCH = 0.98;
const LW = 4.4;
const LT = 0.5;
const LD = 4.4;

function Slab({
  position,
  color,
  highlight,
  glow,
  onClick,
  onOver,
  onOut,
}: {
  position: [number, number, number];
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
      <boxGeometry args={[LW, LT, LD]} />
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

/** Cyan pulse that smoothly chases the active layer as the flow runs. */
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
      <sphereGeometry args={[1.0, 20, 20]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
    </mesh>
  );
}

export function ArchScene3D({
  arch,
  dict,
  selected,
  onSelect,
}: {
  arch: Architecture;
  dict: Dictionary;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  const layers = arch.layers;
  const n = layers.length;
  const [hover, setHover] = useState<number | null>(null);
  const [lit, setLit] = useState<number | null>(null); // running-flow index
  const pulseY = useRef(0);
  const playing = lit !== null;

  // Sequential activation flow, bottom → top, then clear.
  useEffect(() => {
    if (lit === null) return;
    if (lit >= n) {
      const done = setTimeout(() => setLit(null), 500);
      return () => clearTimeout(done);
    }
    pulseY.current = lit * PITCH;
    const next = setTimeout(() => setLit((i) => (i === null ? null : i + 1)), 620);
    return () => clearTimeout(next);
  }, [lit, n]);

  // Reset the global cursor if we unmount (toggle to 2D / switch arch) while a
  // slab is hovered — onPointerOut may not fire on unmount.
  useEffect(() => () => { document.body.style.cursor = "default"; }, []);

  const { camPos, target } = useMemo(() => {
    const h = n * PITCH;
    const dist = Math.max(9, h * 1.9);
    return {
      camPos: [dist * 0.62, h * 0.5, dist] as [number, number, number],
      target: [0, h * 0.5, 0] as [number, number, number],
    };
  }, [n]);

  const detail = selected !== null ? layers[selected] : null;

  return (
    // Counter the global body `zoom` (UI-scale): CSS zoom desyncs r3f canvas
    // measurement and blanks the WebGL view. Net zoom 1 fixes it.
    <div
      className="relative h-[440px] w-full overflow-hidden rounded-card border border-border bg-[#0a0e1a]"
      style={{ zoom: "calc(1 / var(--ui-scale, 1))" } as React.CSSProperties}
    >
      <Canvas key={arch.id} camera={{ position: camPos, fov: 50, near: 0.1, far: 2000 }} dpr={[1, 2]}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[30, 50, 35]} intensity={0.7} />
        <Environment resolution={256}>
          <Lightformer intensity={2.4} color="#7c5cff" position={[-6, 5, -4]} scale={[9, 9, 1]} />
          <Lightformer intensity={1.8} color="#22d3ee" position={[7, 1, 5]} scale={[7, 7, 1]} />
          <Lightformer intensity={1.2} color="#ffffff" position={[0, 9, 3]} scale={[12, 3, 1]} />
          <Lightformer intensity={0.8} color="#f472b6" position={[3, -6, -3]} scale={[6, 6, 1]} />
        </Environment>

        <group>
          {layers.map((l, i) => {
            const y = i * PITCH;
            const glow = playing ? (i === lit ? 0.95 : i < (lit as number) ? 0.3 : 0.05) : undefined;
            const focused = !playing && (selected === i || hover === i);
            return (
              <group key={i}>
                <Slab
                  position={[0, y, 0]}
                  color={KIND_HEX[l.kind]}
                  highlight={focused}
                  glow={glow}
                  onClick={(e) => { e.stopPropagation(); onSelect(selected === i ? null : i); }}
                  onOver={() => setHover(i)}
                  onOut={() => setHover((h) => (h === i ? null : h))}
                />
                <Html position={[LW / 2 + 0.6, y, 0]} center distanceFactor={15} style={{ pointerEvents: "none" }}>
                  <div
                    className="whitespace-nowrap rounded bg-bg/85 px-2 py-0.5 font-mono text-[11px]"
                    style={{ color: focused ? "#ffffff" : "#aeb9d6" }}
                  >
                    {l.label}
                    {l.note ? ` · ${l.note}` : ""}
                  </div>
                </Html>
              </group>
            );
          })}
          {playing && <Pulse targetY={pulseY} />}
          <gridHelper args={[40, 20, "#2e3f63", "#182238"]} position={[0, -0.85, 0]} />
        </group>

        <OrbitControls target={target} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={120} />
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.22} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {/* overlay chrome */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-panel/70 px-2.5 py-1.5 font-mono text-[11px] text-dim">
        {dict.explorer.selectHint}
      </div>
      <div className="absolute right-3 top-3">
        <button
          onClick={() => setLit(playing ? null : 0)}
          className={`pointer-events-auto rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold ${
            playing ? "bg-panel text-muted hover:text-text" : "bg-acc2 text-white"
          }`}
        >
          {playing ? dict.forward.stop : dict.forward.run}
        </button>
      </div>
      {detail && (
        <div className="absolute inset-x-3 bottom-3 rounded-card border border-border bg-bg/85 px-3 py-2 backdrop-blur">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-xs font-bold text-text">{detail.label}</span>
            <span className="font-mono text-[11px] uppercase tracking-wide text-dim">{detail.kind}</span>
            {detail.note && <span className="font-mono text-[11px] text-muted">· {detail.note}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
