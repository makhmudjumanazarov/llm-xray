import { describe, it, expect } from "vitest";
import { LIFECYCLE_STAGES } from "./lifecycle";
import { LOOP_NODES, ALIGNMENT_METHODS, loopForStage, isBackwardNode, type LoopNodeId } from "./loop";

describe("training loop model", () => {
  it("has the five canonical stations in order", () => {
    expect(LOOP_NODES).toEqual(["data", "forward", "predict", "loss", "update"]);
  });

  it("every lifecycle stage maps to a loop with lit stations that are valid nodes", () => {
    for (const s of LIFECYCLE_STAGES) {
      const loop = loopForStage(s.id);
      expect(loop.lit.length).toBeGreaterThan(0);
      for (const id of loop.lit) expect(LOOP_NODES).toContain(id);
    }
  });

  it("eval is the only frozen (forward-only) loop", () => {
    for (const s of LIFECYCLE_STAGES) {
      expect(loopForStage(s.id).frozen).toBe(s.id === "eval");
    }
    // eval never lights the backward (update) station
    expect(loopForStage("eval").lit).not.toContain("update");
  });

  it("the three training stages all update weights (light the update station)", () => {
    for (const id of ["pretraining", "sft", "preference"] as const) {
      expect(loopForStage(id).lit).toContain("update");
    }
  });

  it("classifies the backward station", () => {
    const backward = LOOP_NODES.filter((n: LoopNodeId) => isBackwardNode(n));
    expect(backward).toEqual(["update"]);
  });

  it("exposes exactly the two alignment methods", () => {
    expect(ALIGNMENT_METHODS).toEqual(["rlhf", "dpo"]);
  });
});
