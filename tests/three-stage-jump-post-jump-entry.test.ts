import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 8: Post-jump stage entered when animation exists
 *
 * Pure function: endJump determines the next jump stage after landing based on
 * whether the corresponding post-jump animation exists.
 *
 * When the post-jump animation exists (postAnim.exist is true),
 * endJump should transition to POST_JUMP and keep _act._jump true.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

/**
 * Pure function extracted from _endJump logic.
 * Determines whether to enter POST_JUMP stage or fully end the jump.
 *
 * - wasIdleJump: whether the jump originated from idle (selects postIdleJump vs postRunJump)
 * - postIdleExists: whether the postIdleJump animation exists
 * - postRunExists: whether the postRunJump animation exists
 *
 * Returns:
 * - nextStage: the jump stage to transition to
 * - actJumpRemains: whether _act._jump stays true (for dispatch routing)
 */
function endJump(
    wasIdleJump: boolean,
    postIdleExists: boolean,
    postRunExists: boolean
): { nextStage: number; actJumpRemains: boolean } {
    const postAnimExists = wasIdleJump ? postIdleExists : postRunExists;

    if (postAnimExists) {
        // Transition to POST_JUMP, _act._jump stays true
        return { nextStage: JUMP_STAGE.POST_JUMP, actJumpRemains: true };
    } else {
        // Full cleanup, _act._jump set to false
        return { nextStage: JUMP_STAGE.NONE, actJumpRemains: false };
    }
}

describe("Feature: three-stage-jump, Property 8: Post-jump stage entered when animation exists", () => {
    it("landing after idle jump with postIdleJump existing transitions to POST_JUMP with _act._jump true", () => {
        fc.assert(
            fc.property(
                // postRunExists can be anything — not relevant for idle jumps
                fc.boolean(),
                (postRunExists) => {
                    // wasIdleJump = true, postIdleExists = true
                    const result = endJump(true, true, postRunExists);
                    expect(result.nextStage).toBe(JUMP_STAGE.POST_JUMP);
                    expect(result.actJumpRemains).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("landing after run jump with postRunJump existing transitions to POST_JUMP with _act._jump true", () => {
        fc.assert(
            fc.property(
                // postIdleExists can be anything — not relevant for run jumps
                fc.boolean(),
                (postIdleExists) => {
                    // wasIdleJump = false, postRunExists = true
                    const result = endJump(false, postIdleExists, true);
                    expect(result.nextStage).toBe(JUMP_STAGE.POST_JUMP);
                    expect(result.actJumpRemains).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("for any jump type where the corresponding post-anim exists, transitions to POST_JUMP with _act._jump true", () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (wasIdleJump, postIdleExists, postRunExists) => {
                    // Only test cases where the relevant post-anim exists
                    const relevantPostExists = wasIdleJump
                        ? postIdleExists
                        : postRunExists;
                    fc.pre(relevantPostExists);

                    const result = endJump(
                        wasIdleJump,
                        postIdleExists,
                        postRunExists
                    );
                    expect(result.nextStage).toBe(JUMP_STAGE.POST_JUMP);
                    expect(result.actJumpRemains).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
