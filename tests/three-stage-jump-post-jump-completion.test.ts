import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 13: Post-jump completion restores normal processing
 *
 * Pure function: doPostJump processes a frame during the POST_JUMP stage.
 * When the post-jump stage completes (jumpStageTime + dt >= jumpStageDuration)
 * and jumpBuffered is false:
 * - nextStage === NONE (0)
 * - actJump === false (normal processing resumes)
 * This allows the dispatch loop to route to _doIdle or _doMove.
 *
 * **Validates: Requirements 4.3, 4.4**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

/**
 * Pure function extracted from _doPostJump logic.
 * Processes a single frame during the POST_JUMP stage.
 *
 * - jumpStageTime: elapsed time in the post-jump stage so far
 * - dt: frame delta time
 * - jumpStageDuration: total duration of the post-jump animation
 * - jumpBuffered: whether a jump request was buffered during post-jump
 *
 * Returns:
 * - nextStage: the jump stage after this frame
 * - actJump: the value of _act._jump after this frame
 * - triggerNewJump: whether a new jump should be initiated on the next frame
 */
function doPostJump(
    jumpStageTime: number,
    dt: number,
    jumpStageDuration: number,
    jumpBuffered: boolean
): { nextStage: number; actJump: boolean; triggerNewJump: boolean } {
    const newTime = jumpStageTime + dt;
    if (newTime >= jumpStageDuration) {
        // Post-jump complete — full cleanup
        if (jumpBuffered) {
            // New jump triggers: actJump becomes true again for next frame
            return { nextStage: JUMP_STAGE.NONE, actJump: true, triggerNewJump: true };
        }
        return { nextStage: JUMP_STAGE.NONE, actJump: false, triggerNewJump: false };
    }
    // Still in post-jump
    return { nextStage: JUMP_STAGE.POST_JUMP, actJump: true, triggerNewJump: false };
}

describe("Feature: three-stage-jump, Property 13: Post-jump completion restores normal processing", () => {
    it("when POST_JUMP completes with no buffered jump, nextStage is NONE and actJump is false", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration: positive duration for the post-jump animation
                fc.double({ min: 0.01, max: 5.0, noNaN: true }),
                // fraction: how far along we already are (0 to 1 of duration)
                fc.double({ min: 0.0, max: 1.0, noNaN: true }),
                // dtExtra: additional time beyond what's needed to complete
                fc.double({ min: 0.001, max: 2.0, noNaN: true }),
                (jumpStageDuration, fraction, dtExtra) => {
                    // Set jumpStageTime so that adding dt will exceed jumpStageDuration
                    const jumpStageTime = jumpStageDuration * fraction;
                    const remaining = jumpStageDuration - jumpStageTime;
                    const dt = remaining + dtExtra; // ensures completion

                    const result = doPostJump(jumpStageTime, dt, jumpStageDuration, false);

                    // Post-jump completed without buffer: normal processing restored
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                    expect(result.actJump).toBe(false);
                    expect(result.triggerNewJump).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("when POST_JUMP completes exactly at the boundary (newTime === jumpStageDuration), restores normal processing", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration: positive duration
                fc.double({ min: 0.01, max: 5.0, noNaN: true }),
                // fraction: how far along we are (less than 1)
                fc.double({ min: 0.0, max: 0.99, noNaN: true }),
                (jumpStageDuration, fraction) => {
                    const jumpStageTime = jumpStageDuration * fraction;
                    // dt exactly fills the remaining time
                    const dt = jumpStageDuration - jumpStageTime;
                    fc.pre(dt > 0); // ensure dt is positive

                    const result = doPostJump(jumpStageTime, dt, jumpStageDuration, false);

                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                    expect(result.actJump).toBe(false);
                    expect(result.triggerNewJump).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("when POST_JUMP has NOT completed, stays in POST_JUMP with actJump true", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration: positive duration
                fc.double({ min: 0.1, max: 5.0, noNaN: true }),
                // jumpStageTime: some elapsed time less than duration
                fc.double({ min: 0.0, max: 4.9, noNaN: true }),
                // dt: small enough that we don't complete
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),
                fc.boolean(),
                (jumpStageDuration, jumpStageTime, dt, jumpBuffered) => {
                    // Ensure the post-jump does NOT complete this frame
                    fc.pre(jumpStageTime + dt < jumpStageDuration);

                    const result = doPostJump(jumpStageTime, dt, jumpStageDuration, jumpBuffered);

                    // Still in post-jump: actJump remains true, stage stays POST_JUMP
                    expect(result.nextStage).toBe(JUMP_STAGE.POST_JUMP);
                    expect(result.actJump).toBe(true);
                    expect(result.triggerNewJump).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("when POST_JUMP completes with jumpBuffered true, nextStage is NONE but actJump is true (new jump queued)", () => {
        fc.assert(
            fc.property(
                // jumpStageDuration: positive duration
                fc.double({ min: 0.01, max: 5.0, noNaN: true }),
                // fraction along the duration
                fc.double({ min: 0.0, max: 1.0, noNaN: true }),
                // dtExtra beyond completion
                fc.double({ min: 0.001, max: 2.0, noNaN: true }),
                (jumpStageDuration, fraction, dtExtra) => {
                    const jumpStageTime = jumpStageDuration * fraction;
                    const remaining = jumpStageDuration - jumpStageTime;
                    const dt = remaining + dtExtra;

                    const result = doPostJump(jumpStageTime, dt, jumpStageDuration, true);

                    // Post-jump completed with buffer: stage resets but actJump stays true for re-entry
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                    expect(result.actJump).toBe(true);
                    expect(result.triggerNewJump).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("completion without buffer always produces actJump===false regardless of timing parameters", () => {
        fc.assert(
            fc.property(
                // Various valid timing combinations that always result in completion
                fc.double({ min: 0.0, max: 10.0, noNaN: true }),
                fc.double({ min: 0.001, max: 10.0, noNaN: true }),
                fc.double({ min: 0.001, max: 10.0, noNaN: true }),
                (jumpStageTime, dt, jumpStageDuration) => {
                    // Only test completion cases
                    fc.pre(jumpStageTime + dt >= jumpStageDuration);

                    const result = doPostJump(jumpStageTime, dt, jumpStageDuration, false);

                    // Core property: completion without buffer restores normal processing
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                    expect(result.actJump).toBe(false);
                    expect(result.triggerNewJump).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});
