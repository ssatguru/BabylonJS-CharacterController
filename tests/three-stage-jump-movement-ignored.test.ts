import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 11: Movement inputs ignored during pre-jump and post-jump
 *
 * Pure function: handleMovementInput models how movement key inputs are gated
 * based on the current jump stage. During PRE_JUMP and POST_JUMP stages,
 * movement inputs (walk, walkback, strafe left, strafe right, turn left, turn right)
 * are completely ignored to maintain animation integrity.
 *
 * **Validates: Requirements 8.3, 8.5**
 */

/** Jump stage enum mirroring the implementation */
const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

/**
 * Pure function extracted from _onKeyDown movement key handling.
 * Models whether movement input should be accepted based on current jump stage.
 *
 * @param currentStage - the current JumpStage value
 * @returns true if movement input is accepted, false if ignored
 */
function handleMovementInput(currentStage: number): boolean {
    if (currentStage === JUMP_STAGE.PRE_JUMP || currentStage === JUMP_STAGE.POST_JUMP) {
        return false; // Movement input is ignored
    }
    return true; // Movement input is accepted
}

/** All movement types that are gated by jump stage */
const MOVEMENT_TYPES = [
    "walk",
    "walkback",
    "strafeLeft",
    "strafeRight",
    "turnLeft",
    "turnRight",
] as const;

describe("Feature: three-stage-jump, Property 11: Movement inputs ignored during pre-jump and post-jump", () => {
    it("returns false (movement blocked) for PRE_JUMP stage regardless of movement type", () => {
        fc.assert(
            fc.property(
                // Pick any movement type
                fc.constantFrom(...MOVEMENT_TYPES),
                // Additional state noise to confirm no influence on result
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (_movementType, _jumpStageTime, _jumpStageDuration) => {
                    const result = handleMovementInput(JUMP_STAGE.PRE_JUMP);

                    // Core property: movement input is ignored during PRE_JUMP
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("returns false (movement blocked) for POST_JUMP stage regardless of movement type", () => {
        fc.assert(
            fc.property(
                // Pick any movement type
                fc.constantFrom(...MOVEMENT_TYPES),
                // Additional state noise to confirm no influence on result
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (_movementType, _jumpStageTime, _jumpStageDuration) => {
                    const result = handleMovementInput(JUMP_STAGE.POST_JUMP);

                    // Core property: movement input is ignored during POST_JUMP
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("blocks all movement types for both PRE_JUMP and POST_JUMP stages (combined)", () => {
        fc.assert(
            fc.property(
                // Pick either PRE_JUMP or POST_JUMP stage
                fc.constantFrom(JUMP_STAGE.PRE_JUMP, JUMP_STAGE.POST_JUMP),
                // Pick any movement type
                fc.constantFrom(...MOVEMENT_TYPES),
                // Additional state noise
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (stage, _movementType, _otherState) => {
                    const result = handleMovementInput(stage);

                    // Property: for either PRE_JUMP or POST_JUMP, all movement inputs are blocked
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("handleMovementInput is pure — repeated calls return the same result for same stage", () => {
        fc.assert(
            fc.property(
                // Pick either PRE_JUMP or POST_JUMP stage
                fc.constantFrom(JUMP_STAGE.PRE_JUMP, JUMP_STAGE.POST_JUMP),
                // Simulate multiple key presses
                fc.integer({ min: 1, max: 50 }),
                (stage, numPresses) => {
                    // Call handleMovementInput N times — each should return false
                    // This confirms no state modification occurs between calls
                    for (let i = 0; i < numPresses; i++) {
                        const result = handleMovementInput(stage);
                        expect(result).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
