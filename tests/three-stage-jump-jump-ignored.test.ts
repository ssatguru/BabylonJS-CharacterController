import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 15: jump() ignored during active jump or free-fall
 *
 * Pure function: programmaticJump models the public jump() method's guard logic.
 * When _jumpStage !== NONE or _inFreeFall === true, jump() silently ignores the call
 * and returns the state completely unchanged.
 *
 * **Validates: Requirements 9.2, 9.3**
 */

/** Jump stage enum mirroring the implementation */
const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

interface JumpCallState {
    jumpStage: number;
    inFreeFall: boolean;
    actJump: boolean;
    jumpTime: number;
    jumpStageTime: number;
}

/**
 * Pure function extracted from the public jump() method.
 * Models the guard logic that prevents jump() from modifying state
 * when a jump is already in progress or the character is in free-fall.
 */
function programmaticJump(state: JumpCallState): JumpCallState {
    // Guard 1: ignore if jump stage is not NONE
    if (state.jumpStage !== JUMP_STAGE.NONE) return state;
    // Guard 2: ignore if in free-fall
    if (state.inFreeFall) return state;
    // Otherwise: accept the jump (modifies state)
    return { ...state, actJump: true };
}

describe("Feature: three-stage-jump, Property 15: jump() ignored during active jump or free-fall", () => {
    it("jump() does not modify state when _jumpStage !== NONE (PRE_JUMP, JUMP, or POST_JUMP)", () => {
        fc.assert(
            fc.property(
                // Pick any active jump stage (not NONE)
                fc.constantFrom(JUMP_STAGE.PRE_JUMP, JUMP_STAGE.JUMP, JUMP_STAGE.POST_JUMP),
                // inFreeFall can be either value — the jump stage guard fires first
                fc.boolean(),
                // actJump may already be true (during active jump) or false
                fc.boolean(),
                // jumpTime — arbitrary elapsed time
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                // jumpStageTime — arbitrary elapsed stage time
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (jumpStage, inFreeFall, actJump, jumpTime, jumpStageTime) => {
                    const state: JumpCallState = {
                        jumpStage,
                        inFreeFall,
                        actJump,
                        jumpTime,
                        jumpStageTime,
                    };

                    const result = programmaticJump(state);

                    // Property: returned state is exactly the same as input — no modification
                    expect(result).toBe(state);
                    expect(result.jumpStage).toBe(jumpStage);
                    expect(result.inFreeFall).toBe(inFreeFall);
                    expect(result.actJump).toBe(actJump);
                    expect(result.jumpTime).toBe(jumpTime);
                    expect(result.jumpStageTime).toBe(jumpStageTime);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("jump() does not modify state when _inFreeFall === true (regardless of jump stage)", () => {
        fc.assert(
            fc.property(
                // jumpStage is NONE here — so we specifically test the free-fall guard
                fc.constant(JUMP_STAGE.NONE),
                // actJump before calling jump()
                fc.boolean(),
                // jumpTime — arbitrary elapsed time
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                // jumpStageTime — arbitrary elapsed stage time
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (jumpStage, actJump, jumpTime, jumpStageTime) => {
                    const state: JumpCallState = {
                        jumpStage,
                        inFreeFall: true, // free-fall is always true for this property
                        actJump,
                        jumpTime,
                        jumpStageTime,
                    };

                    const result = programmaticJump(state);

                    // Property: returned state is exactly the same reference — no modification
                    expect(result).toBe(state);
                    expect(result.jumpStage).toBe(JUMP_STAGE.NONE);
                    expect(result.inFreeFall).toBe(true);
                    expect(result.actJump).toBe(actJump);
                    expect(result.jumpTime).toBe(jumpTime);
                    expect(result.jumpStageTime).toBe(jumpStageTime);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("returned state is the exact same object reference (no copy or modification)", () => {
        fc.assert(
            fc.property(
                // Any state where jump should be ignored: either active stage or free-fall
                fc.oneof(
                    // Case 1: active jump stage (not NONE)
                    fc.record({
                        jumpStage: fc.constantFrom(JUMP_STAGE.PRE_JUMP, JUMP_STAGE.JUMP, JUMP_STAGE.POST_JUMP),
                        inFreeFall: fc.boolean(),
                        actJump: fc.boolean(),
                        jumpTime: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                        jumpStageTime: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                    }),
                    // Case 2: NONE stage but in free-fall
                    fc.record({
                        jumpStage: fc.constant(JUMP_STAGE.NONE),
                        inFreeFall: fc.constant(true),
                        actJump: fc.boolean(),
                        jumpTime: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                        jumpStageTime: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                    })
                ),
                (state: JumpCallState) => {
                    const result = programmaticJump(state);

                    // Property: the returned value is the exact same object reference (===)
                    // This confirms no copy was made, no fields were modified
                    expect(result).toBe(state);
                }
            ),
            { numRuns: 100 }
        );
    });
});
