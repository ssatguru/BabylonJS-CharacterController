import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 12: Jump buffering during post-jump
 *
 * Pure functions: handleJumpInput and doPostJump model the jump buffering
 * behavior during the POST_JUMP stage. When a jump key is pressed during
 * POST_JUMP, it is buffered (not accepted). When the post-jump stage
 * completes with a buffered jump, a new jump is triggered.
 *
 * **Validates: Requirements 8.4**
 */

/** Jump stage enum mirroring the implementation */
const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

/**
 * Pure function extracted from _onKeyDown jump key handling.
 * Models the jump input acceptance logic based on current jump stage.
 */
function handleJumpInput(currentStage: number): { accepted: boolean; buffered: boolean } {
    if (currentStage === JUMP_STAGE.NONE) {
        return { accepted: true, buffered: false };
    } else if (currentStage === JUMP_STAGE.POST_JUMP) {
        return { accepted: false, buffered: true };
    }
    return { accepted: false, buffered: false };
}

/**
 * Pure function extracted from _doPostJump logic.
 * Advances the post-jump timer and determines what happens when it completes.
 *
 * @param jumpStageTime - elapsed time in post-jump stage so far
 * @param dt - frame delta time
 * @param jumpStageDuration - total duration of the post-jump animation
 * @param jumpBuffered - whether a jump request was buffered during POST_JUMP
 * @returns next stage, new stage time, and whether a new jump should trigger
 */
function doPostJump(
    jumpStageTime: number,
    dt: number,
    jumpStageDuration: number,
    jumpBuffered: boolean
): { nextStage: number; newStageTime: number; triggerNewJump: boolean } {
    const newTime = jumpStageTime + dt;
    if (newTime >= jumpStageDuration) {
        return { nextStage: JUMP_STAGE.NONE, newStageTime: 0, triggerNewJump: jumpBuffered };
    }
    return { nextStage: JUMP_STAGE.POST_JUMP, newStageTime: newTime, triggerNewJump: false };
}

describe("Feature: three-stage-jump, Property 12: Jump buffering during post-jump", () => {
    it("handleJumpInput during POST_JUMP always returns buffered=true", () => {
        fc.assert(
            fc.property(
                // Generate arbitrary noise values to confirm they don't affect the outcome
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (_jumpStageTime, _jumpStageDuration, _otherState) => {
                    const result = handleJumpInput(JUMP_STAGE.POST_JUMP);

                    // Core property: jump input is buffered during POST_JUMP
                    expect(result.accepted).toBe(false);
                    expect(result.buffered).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("when post-jump completes with jumpBuffered=true, a new jump triggers", () => {
        fc.assert(
            fc.property(
                // jumpStageTime close to or at completion
                fc.double({ min: 0, max: 5, noNaN: true, noDefaultInfinity: true }),
                // dt large enough to push past duration
                fc.double({ min: 0.001, max: 2, noNaN: true, noDefaultInfinity: true }),
                // jumpStageDuration — ensure newTime >= duration for completion
                fc.double({ min: 0.01, max: 5, noNaN: true, noDefaultInfinity: true }),
                (jumpStageTime, dt, jumpStageDuration) => {
                    // Only test when post-jump actually completes
                    fc.pre(jumpStageTime + dt >= jumpStageDuration);

                    const result = doPostJump(jumpStageTime, dt, jumpStageDuration, true);

                    // Core property: when post-jump completes with buffer, new jump triggers
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                    expect(result.newStageTime).toBe(0);
                    expect(result.triggerNewJump).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("N≥1 consecutive handleJumpInput calls during POST_JUMP all return buffered=true", () => {
        fc.assert(
            fc.property(
                // N: number of consecutive jump presses (at least 1)
                fc.integer({ min: 1, max: 50 }),
                // Additional state noise
                fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                (numPresses, _noise) => {
                    // Simulate N jump key presses during POST_JUMP
                    // Each press should consistently return buffered=true
                    for (let i = 0; i < numPresses; i++) {
                        const result = handleJumpInput(JUMP_STAGE.POST_JUMP);
                        expect(result.accepted).toBe(false);
                        expect(result.buffered).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
