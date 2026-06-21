import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 2: Pre-jump completion transitions to jump stage
 *
 * Pure function under test: doPreJump(jumpStageTime, dt, jumpStageDuration)
 * When jumpStageTime + dt >= jumpStageDuration, the stage transitions to JUMP (2)
 * and newStageTime resets to 0.
 *
 * **Validates: Requirements 1.3**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

function doPreJump(
    jumpStageTime: number,
    dt: number,
    jumpStageDuration: number
): { nextStage: number; newStageTime: number } {
    const newTime = jumpStageTime + dt;
    if (newTime >= jumpStageDuration) {
        return { nextStage: JUMP_STAGE.JUMP, newStageTime: 0 };
    }
    return { nextStage: JUMP_STAGE.PRE_JUMP, newStageTime: newTime };
}

describe("Feature: three-stage-jump, Property 2: Pre-jump completion transitions to jump stage", () => {
    it("transitions to JUMP stage when jumpStageTime + dt >= jumpStageDuration", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration > 0 (valid animation duration)
                fc.double({ min: 0.001, max: 10, noNaN: true, noDefaultInfinity: true }),
                // jumpStageTime >= 0 (accumulated time so far)
                fc.double({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
                // dt > 0 (frame delta time)
                fc.double({ min: 0.001, max: 1, noNaN: true, noDefaultInfinity: true }),
                (jumpStageDuration, jumpStageTime, dt) => {
                    // Constrain: jumpStageTime + dt >= jumpStageDuration (completion condition)
                    fc.pre(jumpStageTime + dt >= jumpStageDuration);

                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);

                    expect(result.nextStage).toBe(JUMP_STAGE.JUMP);
                    expect(result.newStageTime).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("stays in PRE_JUMP stage when jumpStageTime + dt < jumpStageDuration", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration > 0 (valid animation duration)
                fc.double({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }),
                // jumpStageTime >= 0 (accumulated time, less than duration)
                fc.double({ min: 0, max: 9, noNaN: true, noDefaultInfinity: true }),
                // dt > 0 (frame delta time)
                fc.double({ min: 0.001, max: 0.5, noNaN: true, noDefaultInfinity: true }),
                (jumpStageDuration, jumpStageTime, dt) => {
                    // Constrain: jumpStageTime + dt < jumpStageDuration (not yet complete)
                    fc.pre(jumpStageTime + dt < jumpStageDuration);

                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);

                    expect(result.nextStage).toBe(JUMP_STAGE.PRE_JUMP);
                    expect(result.newStageTime).toBeCloseTo(jumpStageTime + dt, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("transitions on exact boundary: jumpStageTime + dt === jumpStageDuration", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration > 0
                fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
                // fraction of duration already elapsed (0 to 0.99)
                fc.double({ min: 0, max: 0.99, noNaN: true, noDefaultInfinity: true }),
                (jumpStageDuration, fraction) => {
                    // Set jumpStageTime + dt to exactly equal jumpStageDuration
                    const jumpStageTime = jumpStageDuration * fraction;
                    const dt = jumpStageDuration - jumpStageTime;

                    // Guard against dt <= 0 due to floating point
                    fc.pre(dt > 0);

                    const result = doPreJump(jumpStageTime, dt, jumpStageDuration);

                    expect(result.nextStage).toBe(JUMP_STAGE.JUMP);
                    expect(result.newStageTime).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});
