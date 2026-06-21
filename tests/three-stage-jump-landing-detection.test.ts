import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 7: Landing detection ends jump stage
 *
 * Pure functions extracted from CharacterController:
 * - calcJumpDist: computes vertical displacement per frame
 * - shouldEndJump: determines if landing condition is met
 *
 * The landing condition is: jumpDist < 0 (descending) AND avatar at or above start position.
 * When both conditions are true, the jump stage ends.
 *
 * **Validates: Requirements 3.5**
 */

/**
 * Pure function extracted from _calcJumpDist.
 * Computes jump displacement as: (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt²
 */
function calcJumpDist(speed: number, gravity: number, jumpTime: number, dt: number): number {
    let js = speed - gravity * jumpTime;
    return js * dt - 0.5 * gravity * dt * dt;
}

/**
 * Pure function extracted from landing detection logic in _doJumpAirborne.
 * Returns true when the avatar should end the jump stage:
 * - jumpDist is negative (avatar is descending)
 * - avatarY is at or above avStartPosY (avatar has returned to ground level or above)
 */
function shouldEndJump(jumpDist: number, avatarY: number, avStartPosY: number): boolean {
    if (jumpDist < 0) {
        // Avatar is descending
        if (avatarY > avStartPosY || avatarY === avStartPosY) {
            return true; // Landing detected — back on ground or above start
        }
    }
    return false;
}

describe("Feature: three-stage-jump, Property 7: Landing detection ends jump stage", () => {
    it("shouldEndJump returns true when calcJumpDist is negative and avatarY >= avStartPosY", () => {
        fc.assert(
            fc.property(
                // speed > 0 (jump speed)
                fc.double({ min: 0.1, max: 100, noNaN: true }),
                // gravity > 0
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // dt > 0 (frame delta time)
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),
                // jumpTime large enough that calcJumpDist < 0
                // For jumpDist < 0: (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt² < 0
                // This requires jumpTime large enough that initial velocity is sufficiently negative
                fc.double({ min: 0.5, max: 20, noNaN: true }),
                // avatarY offset above avStartPosY (>= 0 means at or above start)
                fc.double({ min: 0, max: 50, noNaN: true }),
                // avStartPosY (ground level)
                fc.double({ min: -100, max: 100, noNaN: true }),
                (speed, gravity, dt, jumpTime, yOffset, avStartPosY) => {
                    const jumpDist = calcJumpDist(speed, gravity, jumpTime, dt);

                    // Only test cases where jumpDist is actually negative (descending)
                    fc.pre(jumpDist < 0);

                    // avatarY is at or above start position
                    const avatarY = avStartPosY + yOffset;

                    const result = shouldEndJump(jumpDist, avatarY, avStartPosY);
                    expect(result).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("shouldEndJump returns false when jumpDist is non-negative (still ascending)", () => {
        fc.assert(
            fc.property(
                // jumpDist >= 0 (avatar still ascending or at apex)
                fc.double({ min: 0, max: 100, noNaN: true }),
                // avatarY (any value, doesn't matter since jumpDist >= 0)
                fc.double({ min: -100, max: 200, noNaN: true }),
                // avStartPosY
                fc.double({ min: -100, max: 100, noNaN: true }),
                (jumpDist, avatarY, avStartPosY) => {
                    const result = shouldEndJump(jumpDist, avatarY, avStartPosY);
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("shouldEndJump returns false when jumpDist is negative but avatarY is below start (still falling)", () => {
        fc.assert(
            fc.property(
                // jumpDist < 0 (descending)
                fc.double({ min: -100, max: -0.001, noNaN: true }),
                // avStartPosY
                fc.double({ min: 0, max: 100, noNaN: true }),
                // offset below start (strictly negative)
                fc.double({ min: 0.001, max: 50, noNaN: true }),
                (jumpDist, avStartPosY, belowOffset) => {
                    // avatarY is strictly below avStartPosY
                    const avatarY = avStartPosY - belowOffset;

                    const result = shouldEndJump(jumpDist, avatarY, avStartPosY);
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});
