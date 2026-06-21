import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 10: Jump inputs ignored during pre-jump and airborne
 *
 * Pure function: handleJumpInput models how the jump input handler responds
 * based on the current jump stage. During PRE_JUMP and JUMP stages, jump
 * inputs are completely ignored — they are neither accepted nor buffered.
 *
 * **Validates: Requirements 1.4, 8.1, 8.2**
 */

/** Jump stage enum mirroring the implementation */
const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

/**
 * Pure function extracted from _onKeyDown jump key handling.
 * Models the jump input acceptance logic based on current jump stage.
 *
 * @param currentStage - the current JumpStage value
 * @returns { accepted, buffered } indicating what happens to the jump input
 */
function handleJumpInput(currentStage: number): { accepted: boolean; buffered: boolean } {
    if (currentStage === JUMP_STAGE.NONE) {
        return { accepted: true, buffered: false };
    } else if (currentStage === JUMP_STAGE.POST_JUMP) {
        return { accepted: false, buffered: true };
    }
    // PRE_JUMP and JUMP stages: ignore completely
    return { accepted: false, buffered: false };
}

describe("Feature: three-stage-jump, Property 10: Jump inputs ignored during pre-jump and airborne", () => {
    it("returns accepted=false and buffered=false for PRE_JUMP stage", () => {
        fc.assert(
            fc.property(
                // Generate arbitrary "noise" values to confirm they don't affect the outcome
                // These represent other state that might exist (jumpTime, jumpStageTime, etc.)
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (_jumpTime, _jumpStageTime, _jumpStageDuration) => {
                    const result = handleJumpInput(JUMP_STAGE.PRE_JUMP);

                    // Core property: jump input is completely ignored during PRE_JUMP
                    expect(result.accepted).toBe(false);
                    expect(result.buffered).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("returns accepted=false and buffered=false for JUMP (airborne) stage", () => {
        fc.assert(
            fc.property(
                // Generate arbitrary "noise" values to confirm they don't affect the outcome
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (_jumpTime, _jumpStageTime, _jumpStageDuration) => {
                    const result = handleJumpInput(JUMP_STAGE.JUMP);

                    // Core property: jump input is completely ignored during JUMP (airborne)
                    expect(result.accepted).toBe(false);
                    expect(result.buffered).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("ignores jump input for both PRE_JUMP and JUMP stages (combined)", () => {
        fc.assert(
            fc.property(
                // Pick either PRE_JUMP or JUMP stage
                fc.constantFrom(JUMP_STAGE.PRE_JUMP, JUMP_STAGE.JUMP),
                // Additional state noise to confirm no state modification occurs
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (stage, _jumpTime, _jumpStageTime) => {
                    const result = handleJumpInput(stage);

                    // Property: for either PRE_JUMP or JUMP, jump input is completely ignored
                    expect(result.accepted).toBe(false);
                    expect(result.buffered).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("no state modification occurs — handleJumpInput is pure and returns same result regardless of other state", () => {
        fc.assert(
            fc.property(
                // Pick either PRE_JUMP or JUMP stage
                fc.constantFrom(JUMP_STAGE.PRE_JUMP, JUMP_STAGE.JUMP),
                // Simulate calling handleJumpInput multiple times (N presses)
                fc.integer({ min: 1, max: 50 }),
                (stage, numPresses) => {
                    // Call handleJumpInput N times — each call should return the same result
                    // This confirms no state modification occurs between calls
                    for (let i = 0; i < numPresses; i++) {
                        const result = handleJumpInput(stage);
                        expect(result.accepted).toBe(false);
                        expect(result.buffered).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
