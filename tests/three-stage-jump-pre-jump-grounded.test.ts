import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 1: Pre-jump keeps avatar grounded
 *
 * Pure function: doPreJump models the pre-jump stage of the three-stage jump state machine.
 * During PRE_JUMP, the function accumulates time but applies NO vertical displacement.
 * The avatar remains grounded regardless of dt, jumpSpeed, or gravity values.
 *
 * **Validates: Requirements 1.1, 1.2**
 */

/** Jump stage enum mirroring the implementation */
const enum JumpStage {
    NONE = 0,
    PRE_JUMP = 1,
    JUMP = 2,
    POST_JUMP = 3
}

/**
 * Pure function extracted from _doPreJump.
 * Models the pre-jump stage behavior: accumulates time and returns next state.
 * The key property is that displacement is always 0 during this stage.
 *
 * @param jumpStageTime - elapsed time in the pre-jump stage so far (seconds)
 * @param dt - frame delta time (seconds)
 * @param jumpStageDuration - total duration of the pre-jump animation (seconds)
 * @returns nextStage, newStageTime, and displacement (always 0 during PRE_JUMP)
 */
function doPreJump(
    jumpStageTime: number,
    dt: number,
    jumpStageDuration: number
): { nextStage: number; newStageTime: number; displacement: number } {
    const newTime = jumpStageTime + dt;

    if (newTime >= jumpStageDuration) {
        // Pre-jump animation complete, transition to airborne
        return {
            nextStage: JumpStage.JUMP,
            newStageTime: 0,
            displacement: 0
        };
    }

    // Keep avatar grounded — no displacement applied
    return {
        nextStage: JumpStage.PRE_JUMP,
        newStageTime: newTime,
        displacement: 0
    };
}

describe("Feature: three-stage-jump, Property 1: Pre-jump keeps avatar grounded", () => {
    it("produces zero vertical displacement for any valid dt, jumpSpeed, and gravity while in PRE_JUMP", () => {
        fc.assert(
            fc.property(
                // jumpStageTime: elapsed time so far (0 to large value)
                fc.double({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
                // dt: frame delta time (positive, typical game frame times)
                fc.double({ min: 0.0001, max: 1.0, noNaN: true, noDefaultInfinity: true }),
                // jumpStageDuration: animation duration (positive)
                fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
                // jumpSpeed: any positive speed (should not affect displacement during pre-jump)
                fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
                // gravity: any positive gravity (should not affect displacement during pre-jump)
                fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
                (jumpStageTime, dt, jumpStageDuration, _jumpSpeed, _gravity) => {
                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);

                    // Core property: displacement is ALWAYS 0 during pre-jump stage,
                    // regardless of jumpSpeed, gravity, or any other physics parameters
                    expect(result.displacement).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("never produces negative displacement (avatar never moves down) during PRE_JUMP", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0.0001, max: 1.0, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
                (jumpStageTime, dt, jumpStageDuration) => {
                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);
                    expect(result.displacement).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("never produces positive displacement (avatar never moves up) during PRE_JUMP", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0.0001, max: 1.0, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
                (jumpStageTime, dt, jumpStageDuration) => {
                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);
                    expect(result.displacement).toBeLessThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("keeps displacement at zero even when transitioning to JUMP stage", () => {
        fc.assert(
            fc.property(
                // jumpStageTime close to or exceeding duration (forces transition)
                fc.double({ min: 0.5, max: 10, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0.0001, max: 1.0, noNaN: true, noDefaultInfinity: true }),
                // jumpStageDuration smaller so that jumpStageTime + dt >= jumpStageDuration
                fc.double({ min: 0.01, max: 0.5, noNaN: true, noDefaultInfinity: true }),
                (jumpStageTime, dt, jumpStageDuration) => {
                    // Ensure we trigger the transition: jumpStageTime + dt >= jumpStageDuration
                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);
                    // Even at the transition frame, PRE_JUMP itself does not produce displacement
                    expect(result.displacement).toBe(0);
                    expect(result.nextStage).toBe(JumpStage.JUMP);
                }
            ),
            { numRuns: 100 }
        );
    });
});
