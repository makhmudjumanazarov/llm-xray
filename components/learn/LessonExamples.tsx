import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Model } from "@/core/model/schema";
import type { LessonId } from "@/core/learn/lessons";
import { modelsForLesson } from "@/core/learn/examples";
import { localePath } from "@/core/seo";

export function LessonExamples({
  lessonId,
  models,
  locale,
  dict,
}: {
  lessonId: LessonId;
  models: Model[];
  locale: Locale;
  dict: Dictionary;
}) {
  const examples = modelsForLesson(lessonId, models);
  if (examples.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-wider text-dim">{dict.cta.seeItIn}</span>
      {examples.map((model) => (
        <Link
          key={model.slug}
          href={localePath(locale, "/models/" + model.slug)}
          className="rounded-lg border border-border bg-bg2 px-2.5 py-1 font-mono text-xs text-text no-underline transition-colors hover:border-border2"
        >
          {model.name}
        </Link>
      ))}
    </div>
  );
}
