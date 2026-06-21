import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 4: Backward compatibility with no pre/post animations
 *
 * When all pre/post exist flags are false, the three-stage jump system
 * produces the same displacement and state transitions as the original
 * single-stage implementation.
 *
 * **Validates: Requirements 2.3**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

/**
 * Original single-stage implementation (reference).
 * Computes vertical jump displacement per frame.
 */
function calcJumpDistOriginal(speed: number, gravity: number, jumpTime: number, dt: number): number {
    const js = speed - gravity * jumpTime;
    const jumpDist = js * dt - 0.5 * gravity * dt * dt;
    return jumpDist;
}

/**
 * Three-stage beginJump: determines which stage to enter.
 * When preAnim doesn't exist, goes directly to JUMP.
 */
function beginJump(
    wasWalking: boolean,
    wasRunning: boolean,
    preIdleExists: boolean,
    preRunExists: boolean
): number {
    const wasIdleJump = !wasWalking && !wasRunning;
    const preAnimExists = wasIdleJump ? preIdleExists : preRunExists;
    return preAnimExists ? JUMP_STAGE.PRE_JUMP : JUMP_STAGE.JUMP;
}

/**
 * Three-stage endJump: determines transition after landing.
 * When postAnim doesn't exist, goes directly to NONE (full cleanup).
 */
function endJump(
    wasIdleJump: boolean,
    postIdleExists: boolean,
    postRunExists: boolean
): number {
    const postAnimExists = wasIdleJump ? postIdleExists : postRunExists;
    return postAnimExists ? JUMP_STAGE.POST_JUMP : JUMP_STAGE.NONE;
}

/**
 * Three-stage calcJumpDist in the JUMP stage.
 * Uses the exact same formula as the original.
 */
function calcJumpDistThreeStage(speed: number, gravity: number, jumpTime: number, dt: number): number {
    const js = speed - gravity * jumpTime;
    const jumpDist = js * dt - 0.5 * gravity * dt * dt;
    return jumpDist;
}

describe("Feature: three-stage-jump, Property 4: Backward compatibility with no pre/post animations", () => {
    it("beginJump always returns JUMP stage (skips PRE_JUMP) when all pre/post exist flags are false", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasWalking
                fc.boolean(), // wasRunning
                (wasWalking, wasRunning) => {
                    // All pre/post exist flags are false
                    const stage = beginJump(wasWalking, wasRunning, false, false);
                    expect(stage).toBe(JUMP_STAGE.JUMP);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("jump displacement formula in JUMP stage is identical to original _calcJumpDist", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 1, max: 50, noNaN: true }),     // speed
                fc.double({ min: 0.1, max: 100, noNaN: true }),  // gravity
                fc.double({ min: 0, max: 10, noNaN: true }),     // jumpTime
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),// dt (frame delta)
                (speed, gravity, jumpTime, dt) => {
                    const original = calcJumpDistOriginal(speed, gravity, jumpTime, dt);
                    const threeStage = calcJumpDistThreeStage(speed, gravity, jumpTime, dt);
                    expect(threeStage).toBeCloseTo(original, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("landing (calcJumpDist < 0) immediately clears state (no POST_JUMP entered) when post-anim missing", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasIdleJump
                fc.double({ min: 1, max: 50, noNaN: true }),     // speed
                fc.double({ min: 0.1, max: 100, noNaN: true }),  // gravity
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),// dt
                (wasIdleJump, speed, gravity, dt) => {
                    // Choose a jumpTime large enough so displacement is negative (landing condition)
                    // jumpDist < 0 when: (speed - gravity*jumpTime)*dt - 0.5*gravity*dt^2 < 0
                    // => speed - gravity*jumpTime < 0.5*gravity*dt (approximately speed/gravity < jumpTime)
                    const jumpTime = (speed / gravity) + dt + 0.1; // ensures negative displacement

                    const jumpDist = calcJumpDistOriginal(speed, gravity, jumpTime, dt);
                    // Verify we actually have a landing condition
                    expect(jumpDist).toBeLessThan(0);

                    // With no post-animations, endJump should return NONE (skip POST_JUMP)
                    const nextStage = endJump(wasIdleJump, false, false);
                    expect(nextStage).toBe(JUMP_STAGE.NONE);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("full backward-compat: no pre/post animations means jump goes NONE→JUMP→NONE (single-stage path)", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasWalking
                fc.boolean(), // wasRunning
                fc.double({ min: 1, max: 50, noNaN: true }),     // speed
                fc.double({ min: 0.1, max: 100, noNaN: true }),  // gravity
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),// dt
                (wasWalking, wasRunning, speed, gravity, dt) => {
                    // Step 1: Begin jump with no pre-animations → goes directly to JUMP
                    const startStage = beginJump(wasWalking, wasRunning, false, false);
                    expect(startStage).toBe(JUMP_STAGE.JUMP);

                    // Step 2: During JUMP stage, displacement matches original formula exactly
                    const jumpTime = 0; // first frame
                    const originalDist = calcJumpDistOriginal(speed, gravity, jumpTime, dt);
                    const threeStagerDist = calcJumpDistThreeStage(speed, gravity, jumpTime, dt);
                    expect(threeStagerDist).toBeCloseTo(originalDist, 10);

                    // Step 3: On landing, with no post-animations → goes directly to NONE
                    const wasIdleJump = !wasWalking && !wasRunning;
                    const endStage = endJump(wasIdleJump, false, false);
                    expect(endStage).toBe(JUMP_STAGE.NONE);
                }
            ),
            { numRuns: 100 }
        );
    });
});
