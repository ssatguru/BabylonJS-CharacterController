import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 5: Jump displacement formula correctness
 *
 * Pure function extracted from CharacterController._calcJumpDist:
 * Computes vertical jump displacement each frame using the kinematic formula
 * s = v₀t + ½at² where v₀ = jumpSpeed - gravity × jumpTime.
 *
 * **Validates: Requirements 3.4**
 */

/**
 * Pure function extracted from _calcJumpDist.
 * Computes jump displacement as: (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt²
 */
function calcJumpDist(speed: number, gravity: number, jumpTime: number, dt: number): number {
    // up velocity at the beginning of the last frame (v=u+at)
    let js = speed - gravity * jumpTime;
    // distance travelled up since last frame to this frame (s=ut+1/2*at^2)
    let jumpDist = js * dt - 0.5 * gravity * dt * dt;
    return jumpDist;
}

describe("Feature: three-stage-jump, Property 5: Jump displacement formula correctness", () => {
    it("calcJumpDist equals (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt² for all valid inputs", () => {
        fc.assert(
            fc.property(
                // speed > 0 (jump speed)
                fc.double({ min: 0.1, max: 100, noNaN: true }),
                // gravity > 0
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // jumpTime >= 0 (elapsed time since jump start)
                fc.double({ min: 0, max: 10, noNaN: true }),
                // dt > 0 (frame delta time)
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),
                (speed, gravity, jumpTime, dt) => {
                    const result = calcJumpDist(speed, gravity, jumpTime, dt);
                    const expected = (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt * dt;
                    expect(result).toBeCloseTo(expected, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
});
