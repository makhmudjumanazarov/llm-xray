"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Global beginner↔expert toggle (persisted). Expert reveals formulas + tensor math.
type ExpertState = {
  expert: boolean;
  setExpert: (v: boolean) => void;
};

export const useExpertMode = create<ExpertState>()(
  persist(
    (set) => ({
      expert: false,
      setExpert: (v) => set({ expert: v }),
    }),
    { name: "llmxray-expert" },
  ),
);
