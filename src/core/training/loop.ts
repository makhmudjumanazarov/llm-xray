// Pure, React-free model of the universal training LOOP that every training
// stage shares: data → forward → predict-vs-target → loss → backprop+update → ↻.
// Pretraining/SFT/preference are all THIS loop with different (data, loss, what
// updates); evaluation is the same loop with the backward half removed (forward
// only, weights frozen). Language-neutral — all copy lives under journey.loop.

import type { StageId } from "./lifecycle";

/** Ordered stations of one training step. */
export type LoopNodeId = "data" | "forward" | "predict" | "loss" | "update";

export const LOOP_NODES: readonly LoopNodeId[] = ["data", "forward", "predict", "loss", "update"];

/** The two ways to do preference tuning. */
export type AlignmentMethod = "rlhf" | "dpo";
export const ALIGNMENT_METHODS: readonly AlignmentMethod[] = ["rlhf", "dpo"];

export type StageLoop = {
  /** Stations highlighted for this stage. */
  lit: readonly LoopNodeId[];
  /** Eval breaks the loop: forward only, weights frozen, no backward/update. */
  frozen: boolean;
};

const LIT: Record<StageId, readonly LoopNodeId[]> = {
  pretraining: ["data", "update"],
  sft: ["data", "loss", "update"],
  preference: ["data", "loss", "update"],
  eval: ["data", "forward", "predict"],
};

export function loopForStage(stage: StageId): StageLoop {
  return { lit: LIT[stage], frozen: stage === "eval" };
}

/** A station is part of the backward half (disabled at eval). */
export function isBackwardNode(node: LoopNodeId): boolean {
  return node === "update";
}
