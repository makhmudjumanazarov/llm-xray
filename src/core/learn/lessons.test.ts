import { describe, it, expect } from "vitest";
import { LESSONS } from "./lessons";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

const learnEn = (en as unknown as { learn: Record<string, Record<string, string>> }).learn;

describe("learn lesson catalog", () => {
  it("every live lesson has en copy with title/blurb/beginnerText/expertText", () => {
    for (const l of LESSONS.filter((x) => x.status === "live")) {
      const sub = learnEn[l.id];
      expect(sub, `en.learn.${l.id}`).toBeTruthy();
      for (const k of ["title", "blurb", "beginnerText", "expertText"]) {
        expect(typeof sub[k], `en.learn.${l.id}.${k}`).toBe("string");
      }
    }
  });

  it("every soon lesson has a concepts label", () => {
    const concepts = learnEn.concepts as Record<string, string>;
    for (const l of LESSONS.filter((x) => x.status === "soon")) {
      expect(typeof concepts[l.id], `learn.concepts.${l.id}`).toBe("string");
    }
  });

  it("en and ru learn subtrees have identical key sets (no i18n drift)", () => {
    const enKeys = keyPaths((en as Record<string, unknown>).learn).sort();
    const ruKeys = keyPaths((ru as Record<string, unknown>).learn).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
