// Pure cross-link map: connects an architecture element (explorer op kind, a
// model stat field, or an evolution era) to the /learn lesson that explains it.
// Returns only LIVE lessons (so a link never lands on a "coming soon" stub).
// React-free → unit tested. Components build the URL with localePath(locale,
// "/learn") + "#" + id.

import type { LessonId } from "./lessons";
import { LESSONS } from "./lessons";

const LIVE = new Set<LessonId>(LESSONS.filter((l) => l.status === "live").map((l) => l.id));

function live(id: LessonId | null): LessonId | null {
  return id && LIVE.has(id) ? id : null;
}

/** Explorer decoder-op kind (see src/core/model/blocks.ts SubOp) → lesson. */
export function lessonForOpKind(kind: string): LessonId | null {
  switch (kind) {
    case "norm":
      return live("norm");
    case "qkv":
    case "sdpa":
    case "out":
      return live("attention");
    case "router":
    case "expert":
      return live("moe");
    default:
      return null; // gate/up/down (MLP) — no dedicated lesson yet
  }
}

/** Model stat field (model detail page) → lesson. */
export function lessonForField(field: string): LessonId | null {
  switch (field) {
    case "attentionType":
      return live("attention");
    case "normType":
      return live("norm");
    case "rope":
      return live("rope");
    case "moe":
      return live("moe");
    case "contextLen":
      return live("kvcache");
    case "vocabSize":
      return live("tokenization");
    default:
      return null;
  }
}

/** Evolution era id (src/core/evolution/timeline.ts) → lesson, where one fits. */
export function lessonForEra(eraId: string): LessonId | null {
  switch (eraId) {
    case "transformers":
      return live("attention");
    case "frontier":
      return live("moe");
    default:
      return null;
  }
}
