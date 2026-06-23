// Pure, React-free lesson registry metadata. The component map lives in
// components/learn/registry.tsx (which attaches the JSX); keeping ids/order/icons
// here makes the catalog importable from a node-env vitest. As a lesson ships,
// flip its status "soon" → "live" and the /learn page reacts (no page edits).

export type LessonId =
  | "softmax"
  | "attention"
  | "tokenization"
  | "sampling"
  | "rope"
  | "moe"
  | "kvcache"
  | "norm";

/** Icon name from components/ui/icons.tsx. */
export type LessonIconName = "BarChart" | "Grid" | "Type" | "Dice" | "Repeat" | "Layers" | "Database" | "Target";

export type LessonStatus = "live" | "soon";

export type LessonMeta = {
  id: LessonId;
  status: LessonStatus;
  iconName: LessonIconName;
};

/** Catalog in display order. `live` lessons render their interactive component;
 *  `soon` lessons show as "coming soon" cards (label from dict.learn.concepts). */
export const LESSONS: readonly LessonMeta[] = [
  { id: "softmax", status: "live", iconName: "BarChart" },
  { id: "tokenization", status: "live", iconName: "Type" },
  { id: "attention", status: "live", iconName: "Grid" },
  { id: "sampling", status: "live", iconName: "Dice" },
  { id: "rope", status: "live", iconName: "Repeat" },
  { id: "moe", status: "live", iconName: "Layers" },
  { id: "kvcache", status: "live", iconName: "Database" },
  { id: "norm", status: "live", iconName: "Target" },
];

export const LIVE_LESSONS = LESSONS.filter((l) => l.status === "live");
export const SOON_LESSONS = LESSONS.filter((l) => l.status === "soon");
