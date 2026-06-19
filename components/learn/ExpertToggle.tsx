"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useExpertMode } from "@/components/ui/useExpertMode";
import type { Dictionary } from "@/i18n/dictionaries";

export function ExpertToggle({ dict }: { dict: Dictionary }) {
  const expert = useExpertMode((s) => s.expert);
  const setExpert = useExpertMode((s) => s.setExpert);
  return (
    <SegmentedControl
      value={expert ? "expert" : "beginner"}
      onChange={(v) => setExpert(v === "expert")}
      options={[
        { value: "beginner", label: dict.learn.beginner },
        { value: "expert", label: dict.learn.expert },
      ]}
    />
  );
}
