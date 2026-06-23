import { describe, it, expect } from "vitest";
import { EVOLUTION_ERAS, type EraId } from "./timeline";
import { EVOLUTION_DETAIL, deepDive, LAYER_KINDS, MILESTONE_KINDS } from "./deepdive";
import en from "../../../messages/en.json";

const ERA_IDS = EVOLUTION_ERAS.map((e) => e.id);

describe("evolution deep-dive content", () => {
  it("covers every era", () => {
    for (const id of ERA_IDS) {
      expect(EVOLUTION_DETAIL[id], `deepdive for ${id}`).toBeTruthy();
      expect(deepDive(id)).toBe(EVOLUTION_DETAIL[id]);
    }
    // no stray eras
    expect(Object.keys(EVOLUTION_DETAIL).sort()).toEqual([...ERA_IDS].sort());
  });

  it("each era has architectures and a milestone timeline", () => {
    for (const id of ERA_IDS) {
      const d = EVOLUTION_DETAIL[id];
      expect(d.architectures.length, `${id} architectures`).toBeGreaterThanOrEqual(1);
      expect(d.milestones.length, `${id} milestones`).toBeGreaterThanOrEqual(3);
    }
  });

  it("every architecture has ≥3 layers with valid kinds, input first and output last", () => {
    for (const id of ERA_IDS) {
      for (const a of EVOLUTION_DETAIL[id].architectures) {
        expect(a.layers.length, `${id}/${a.id} layers`).toBeGreaterThanOrEqual(3);
        for (const l of a.layers) expect(LAYER_KINDS).toContain(l.kind);
        expect(a.layers[0].kind, `${id}/${a.id} starts at input`).toBe("input");
        expect(a.layers[a.layers.length - 1].kind, `${id}/${a.id} ends at output`).toBe("output");
        expect(a.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("architecture and milestone ids are unique within an era", () => {
    for (const id of ERA_IDS) {
      const d = EVOLUTION_DETAIL[id];
      const aIds = d.architectures.map((a) => a.id);
      const mIds = d.milestones.map((m) => m.id);
      expect(new Set(aIds).size).toBe(aIds.length);
      expect(new Set(mIds).size).toBe(mIds.length);
    }
  });

  it("every milestone has a valid kind and a sane year", () => {
    for (const id of ERA_IDS) {
      for (const m of EVOLUTION_DETAIL[id].milestones) {
        expect(MILESTONE_KINDS).toContain(m.kind);
        expect(m.year).toBeGreaterThan(1940);
        expect(m.year).toBeLessThan(2030);
      }
    }
  });
});

// ---- i18n contract: en must label every milestone and architecture id ----

type EraI18n = { milestones?: Record<string, string>; architectures?: Record<string, string> };

describe("deep-dive dictionary (English canonical)", () => {
  const eras = (en as { evolution: { eras: Record<string, EraI18n> } }).evolution.eras;

  it("defines a translated label for every milestone id", () => {
    for (const id of ERA_IDS as EraId[]) {
      const ms = eras[id].milestones ?? {};
      for (const m of EVOLUTION_DETAIL[id].milestones) {
        expect(typeof ms[m.id], `en.evolution.eras.${id}.milestones.${m.id}`).toBe("string");
      }
    }
  });

  it("defines a translated blurb for every architecture id", () => {
    for (const id of ERA_IDS as EraId[]) {
      const arch = eras[id].architectures ?? {};
      for (const a of EVOLUTION_DETAIL[id].architectures) {
        expect(typeof arch[a.id], `en.evolution.eras.${id}.architectures.${a.id}`).toBe("string");
      }
    }
  });
});
