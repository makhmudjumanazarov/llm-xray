"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useExpertMode } from "@/components/ui/useExpertMode";
import { candidatesForStep, type SamplingState } from "@/core/inference/run";
import { SamplingDials } from "@/components/inference/SamplingDials";
import { LessonCard } from "./LessonCard";

const FORMULA =
  "p_i = \\dfrac{e^{z_i/T}}{\\sum_j e^{z_j/T}}, \\qquad \\text{top-}p:\\ \\min\\Big\\{\\,|S| : \\textstyle\\sum_{i\\in S} p_i \\ge p\\,\\Big\\}";

export function SamplingLesson({ dict }: { dict: Dictionary }) {
  const expert = useExpertMode((s) => s.expert);
  const L = dict.learn.sampling;
  const [sampling, setSampling] = useState<SamplingState>({ temp: 1, method: "topk", k: 3, p: 0.9 });
  const candidates = candidatesForStep(0);

  return (
    <LessonCard title={L.title} blurb={L.blurb} expert={expert} beginner={L.beginnerText} expertText={L.expertText} formula={FORMULA}>
      <SamplingDials
        candidates={candidates}
        sampling={sampling}
        setSampling={setSampling}
        labels={dict.inference.sampling}
        accentVar="var(--acc2)"
      />
    </LessonCard>
  );
}
