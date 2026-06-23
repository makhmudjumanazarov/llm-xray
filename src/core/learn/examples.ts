// Picks a few real catalog models that exemplify a lesson's concept, so each
// /learn lesson can deep-link "see it in a real model". Most-downloaded first.
// Pure → unit tested; the UI maps the result to model chips.

import type { Model } from "@/core/model/schema";
import type { LessonId } from "./lessons";

export function modelsForLesson(id: LessonId, models: Model[], limit = 3): Model[] {
  const ranked = [...models].sort((a, b) => (b.stats.downloads ?? 0) - (a.stats.downloads ?? 0));
  const pick = (pred: (m: Model) => boolean) => ranked.filter(pred).slice(0, limit);

  switch (id) {
    case "moe":
      return pick((m) => !!m.text.moe);
    case "attention":
      return pick((m) => m.text.attentionType === "gqa" || m.text.attentionType === "mla");
    case "kvcache":
      return pick((m) => m.text.numKVHeads < m.text.numHeads);
    case "rope":
      return pick((m) => !!m.text.rope);
    case "norm":
      return pick((m) => m.text.normType === "rmsnorm");
    case "softmax":
    case "sampling":
    case "tokenization":
      return ranked.slice(0, limit); // universal — show top models
  }
}
