import type { Dictionary } from "@/i18n/dictionaries";
import { LESSONS, type LessonId, type LessonIconName, type LessonMeta } from "@/core/learn/lessons";
import { SoftmaxPlayground } from "./SoftmaxPlayground";
import { AttentionLesson } from "./AttentionLesson";
import { TokenizationLesson } from "./TokenizationLesson";
import { SamplingLesson } from "./SamplingLesson";
import { MoeLesson } from "./MoeLesson";
import { RopeLesson } from "./RopeLesson";
import { KvCacheLesson } from "./KvCacheLesson";
import { NormLesson } from "./NormLesson";
import { BarChart, Grid, Type, Dice, Repeat, Layers, Database, Target } from "@/components/ui/icons";

export type LessonComponent = (props: { dict: Dictionary }) => React.ReactElement;
type IconComponent = typeof BarChart;

// `live` lessons map to their interactive component; `soon` lessons stay undefined
// and render as "coming soon" cards. Add a lesson here + flip its status in
// src/core/learn/lessons.ts to ship it — the /learn page reacts automatically.
const COMPONENTS: Partial<Record<LessonId, LessonComponent>> = {
  softmax: SoftmaxPlayground,
  attention: AttentionLesson,
  tokenization: TokenizationLesson,
  sampling: SamplingLesson,
  moe: MoeLesson,
  rope: RopeLesson,
  kvcache: KvCacheLesson,
  norm: NormLesson,
};

const ICONS: Record<LessonIconName, IconComponent> = { BarChart, Grid, Type, Dice, Repeat, Layers, Database, Target };

export type RegistryEntry = LessonMeta & { Component?: LessonComponent; Icon: IconComponent };

export const LESSON_REGISTRY: RegistryEntry[] = LESSONS.map((l) => ({
  ...l,
  Component: COMPONENTS[l.id],
  Icon: ICONS[l.iconName],
}));
