import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 3: Pre-jump skip when animation missing
 *
 * Pure function: beginJump determines the next jump stage based on movement state
 * and whether the corresponding pre-jump animation exists.
 *
 * When the pre-jump animation does not exist (preAnim.exist is false),
 * beginJump should skip directly to the JUMP stage (2).
 *
 * **Validates: Requirements 2.1, 2.2**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

function beginJump(
    wasWalking: boolean,
    wasRunning: boolean,
    preIdleExists: boolean,
    preRunExists: boolean
): { nextStage: number; wasIdleJump: boolean } {
    const wasIdleJump = !wasWalking && !wasRunning;
    const preAnimExists = wasIdleJump ? preIdleExists : preRunExists;

    if (preAnimExists) {
        return { nextStage: JUMP_STAGE.PRE_JUMP, wasIdleJump };
    } else {
        return { nextStage: JUMP_STAGE.JUMP, wasIdleJump };
    }
}

describe("Feature: three-stage-jump, Property 3: Pre-jump skip when animation missing", () => {
    it("beginJump returns JUMP stage directly when idle and preIdleJump does not exist", () => {
        fc.assert(
            fc.property(
                // wasWalking = false, wasRunning = false → idle jump
                // preIdleExists = false (the animation is missing)
                // preRunExists can be anything since it's not used for idle jumps
                fc.boolean(),
                (preRunExists) => {
                    const result = beginJump(false, false, false, preRunExists);
                    expect(result.nextStage).toBe(JUMP_STAGE.JUMP);
                    expect(result.wasIdleJump).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("beginJump returns JUMP stage directly when moving and preRunJump does not exist", () => {
        fc.assert(
            fc.property(
                // At least one of wasWalking/wasRunning must be true for a run jump
                fc.boolean(),
                fc.boolean(),
                // preIdleExists can be anything since it's not used for run jumps
                fc.boolean(),
                (wasWalking, wasRunning, preIdleExists) => {
                    // Ensure at least one movement flag is true
                    const effectiveWalking = wasWalking || !wasRunning;
                    const effectiveRunning = wasRunning || !wasWalking;
                    // Pick one that ensures not idle (at least one true)
                    const w = wasWalking || wasRunning ? wasWalking : true;
                    const r = wasWalking || wasRunning ? wasRunning : false;

                    // Skip if both are false (that's idle, covered above)
                    fc.pre(w || r);

                    const result = beginJump(w, r, preIdleExists, false);
                    expect(result.nextStage).toBe(JUMP_STAGE.JUMP);
                    expect(result.wasIdleJump).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("beginJump returns JUMP stage for any movement state when corresponding preAnim is missing", () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (wasWalking, wasRunning, preIdleExists, preRunExists) => {
                    const wasIdleJump = !wasWalking && !wasRunning;
                    // Only test cases where the relevant pre-anim does NOT exist
                    const relevantPreExists = wasIdleJump
                        ? preIdleExists
                        : preRunExists;
                    fc.pre(!relevantPreExists);

                    const result = beginJump(
                        wasWalking,
                        wasRunning,
                        preIdleExists,
                        preRunExists
                    );
                    expect(result.nextStage).toBe(JUMP_STAGE.JUMP);
                    expect(result.wasIdleJump).toBe(wasIdleJump);
                }
            ),
            { numRuns: 100 }
        );
    });
});
