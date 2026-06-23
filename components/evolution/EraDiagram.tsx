"use client";

import type { EraId } from "@/core/evolution/timeline";
import { ClassicalMlViz } from "./eras/ClassicalMlViz";
import { PerceptronViz } from "./eras/PerceptronViz";
import { DeepLearningViz } from "./eras/DeepLearningViz";
import { VisionCnnViz } from "./eras/VisionCnnViz";
import { NlpSeqViz } from "./eras/NlpSeqViz";
import { TransformersViz } from "./eras/TransformersViz";
import { LlmsViz } from "./eras/LlmsViz";
import { FrontierViz } from "./eras/FrontierViz";

// Per-era schematic. Each is an interactive, looping SVG animation (drawn in a
// shared 240×120 viewBox; see eras/_shared.tsx) that reads as the same family.
export function EraDiagram({ id, accentVar }: { id: EraId; accentVar: string }) {
  switch (id) {
    case "classical_ml":
      return <ClassicalMlViz a={accentVar} />;
    case "perceptron":
      return <PerceptronViz a={accentVar} />;
    case "deep_learning":
      return <DeepLearningViz a={accentVar} />;
    case "vision_cnn":
      return <VisionCnnViz a={accentVar} />;
    case "nlp_seq":
      return <NlpSeqViz a={accentVar} />;
    case "transformers":
      return <TransformersViz a={accentVar} />;
    case "llms":
      return <LlmsViz a={accentVar} />;
    case "frontier":
      return <FrontierViz a={accentVar} />;
  }
}
