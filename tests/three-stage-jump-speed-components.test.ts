import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 6: Jump stage uses correct speed components
 *
 * Pure function extracted from CharacterController._doJumpAirborne:
 * Computes jump displacement based on the movement state at jump initiation.
 * - Idle jump: zero horizontal displacement, vertical uses idleJump.speed
 * - Walk jump: horizontal uses walk.speed, vertical uses runJump.speed
 * - Run jump: horizontal uses run.speed, vertical uses runJump.speed
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

interface JumpDisplacement {
    x: number;
    y: number;
    z: number;
}

/**
 * Pure function extracted from _calcJumpDist.
 * Computes vertical jump displacement as: (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt²
 */
function calcJumpDist(speed: number, gravity: number, jumpTime: number, dt: number): number {
    let js = speed - gravity * jumpTime;
    return js * dt - 0.5 * gravity * dt * dt;
}

/**
 * Pure function extracted from _doJumpAirborne.
 * Computes the displacement vector for a single frame during the jump stage.
 *
 * @param wasIdleJump - Whether the jump originated from idle (no walk/run)
 * @param wasWalking - Whether the character was walking at jump start
 * @param wasRunning - Whether the character was running at jump start
 * @param walkSpeed - Walk speed setting
 * @param runSpeed - Run speed setting
 * @param idleJumpSpeed - Idle jump vertical speed
 * @param runJumpSpeed - Run jump vertical speed
 * @param gravity - Gravity constant
 * @param jumpTime - Elapsed time since jump started
 * @param dt - Frame delta time
 * @param moveDirectionX - X component of last movement direction
 * @param moveDirectionZ - Z component of last movement direction
 */
function computeJumpDisplacement(
    wasIdleJump: boolean,
    wasWalking: boolean,
    wasRunning: boolean,
    walkSpeed: number,
    runSpeed: number,
    idleJumpSpeed: number,
    runJumpSpeed: number,
    gravity: number,
    jumpTime: number,
    dt: number,
    moveDirectionX: number,
    moveDirectionZ: number
): JumpDisplacement {
    let forwardDist = 0;
    let jumpDist = 0;

    if (wasRunning || wasWalking) {
        if (wasRunning) {
            forwardDist = runSpeed * dt;
        } else if (wasWalking) {
            forwardDist = walkSpeed * dt;
        }
        // normalize move direction
        const len = Math.sqrt(moveDirectionX * moveDirectionX + moveDirectionZ * moveDirectionZ);
        const dirX = len > 0 ? moveDirectionX / len : 0;
        const dirZ = len > 0 ? moveDirectionZ / len : 0;

        jumpDist = calcJumpDist(runJumpSpeed, gravity, jumpTime, dt);
        return { x: dirX * forwardDist, y: jumpDist, z: dirZ * forwardDist };
    } else {
        jumpDist = calcJumpDist(idleJumpSpeed, gravity, jumpTime, dt);
        return { x: 0, y: jumpDist, z: 0 };
    }
}

describe("Feature: three-stage-jump, Property 6: Jump stage uses correct speed components", () => {
    it("idle jump produces zero horizontal displacement and uses idleJumpSpeed vertically", () => {
        fc.assert(
            fc.property(
                // walkSpeed (unused for idle jump, but present in signature)
                fc.double({ min: 0.1, max: 20, noNaN: true }),
                // runSpeed (unused for idle jump, but present in signature)
                fc.double({ min: 0.1, max: 40, noNaN: true }),
                // idleJumpSpeed > 0
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // runJumpSpeed (unused for idle jump)
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // gravity > 0
                fc.double({ min: 0.1, max: 30, noNaN: true }),
                // jumpTime >= 0
                fc.double({ min: 0, max: 5, noNaN: true }),
                // dt > 0
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),
                // moveDirectionX (irrelevant for idle)
                fc.double({ min: -1, max: 1, noNaN: true }),
                // moveDirectionZ (irrelevant for idle)
                fc.double({ min: -1, max: 1, noNaN: true }),
                (walkSpeed, runSpeed, idleJumpSpeed, runJumpSpeed, gravity, jumpTime, dt, dirX, dirZ) => {
                    const result = computeJumpDisplacement(
                        true,   // wasIdleJump
                        false,  // wasWalking
                        false,  // wasRunning
                        walkSpeed,
                        runSpeed,
                        idleJumpSpeed,
                        runJumpSpeed,
                        gravity,
                        jumpTime,
                        dt,
                        dirX,
                        dirZ
                    );

                    // Idle jump: x and z must be exactly zero
                    expect(result.x).toBe(0);
                    expect(result.z).toBe(0);

                    // Idle jump: y must use idleJumpSpeed (not runJumpSpeed)
                    const expectedY = calcJumpDist(idleJumpSpeed, gravity, jumpTime, dt);
                    expect(result.y).toBeCloseTo(expectedY, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("walk jump uses walkSpeed for horizontal displacement and runJumpSpeed vertically", () => {
        fc.assert(
            fc.property(
                // walkSpeed > 0
                fc.double({ min: 0.1, max: 20, noNaN: true }),
                // runSpeed (unused for walk jump horizontal)
                fc.double({ min: 0.1, max: 40, noNaN: true }),
                // idleJumpSpeed (unused for walk jump)
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // runJumpSpeed > 0
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // gravity > 0
                fc.double({ min: 0.1, max: 30, noNaN: true }),
                // jumpTime >= 0
                fc.double({ min: 0, max: 5, noNaN: true }),
                // dt > 0
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),
                // moveDirectionX (non-zero direction)
                fc.double({ min: -10, max: 10, noNaN: true }),
                // moveDirectionZ (non-zero direction)
                fc.double({ min: -10, max: 10, noNaN: true }),
                (walkSpeed, runSpeed, idleJumpSpeed, runJumpSpeed, gravity, jumpTime, dt, moveX, moveZ) => {
                    const result = computeJumpDisplacement(
                        false,  // wasIdleJump
                        true,   // wasWalking
                        false,  // wasRunning
                        walkSpeed,
                        runSpeed,
                        idleJumpSpeed,
                        runJumpSpeed,
                        gravity,
                        jumpTime,
                        dt,
                        moveX,
                        moveZ
                    );

                    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
                    const dirX = len > 0 ? moveX / len : 0;
                    const dirZ = len > 0 ? moveZ / len : 0;

                    const expectedForward = walkSpeed * dt;
                    const expectedX = dirX * expectedForward;
                    const expectedZ = dirZ * expectedForward;
                    const expectedY = calcJumpDist(runJumpSpeed, gravity, jumpTime, dt);

                    // Walk jump: horizontal uses walkSpeed
                    expect(result.x).toBeCloseTo(expectedX, 10);
                    expect(result.z).toBeCloseTo(expectedZ, 10);

                    // Walk jump: vertical uses runJumpSpeed
                    expect(result.y).toBeCloseTo(expectedY, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("run jump uses runSpeed for horizontal displacement and runJumpSpeed vertically", () => {
        fc.assert(
            fc.property(
                // walkSpeed (unused for run jump horizontal)
                fc.double({ min: 0.1, max: 20, noNaN: true }),
                // runSpeed > 0
                fc.double({ min: 0.1, max: 40, noNaN: true }),
                // idleJumpSpeed (unused for run jump)
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // runJumpSpeed > 0
                fc.double({ min: 0.1, max: 50, noNaN: true }),
                // gravity > 0
                fc.double({ min: 0.1, max: 30, noNaN: true }),
                // jumpTime >= 0
                fc.double({ min: 0, max: 5, noNaN: true }),
                // dt > 0
                fc.double({ min: 0.001, max: 0.1, noNaN: true }),
                // moveDirectionX (non-zero direction)
                fc.double({ min: -10, max: 10, noNaN: true }),
                // moveDirectionZ (non-zero direction)
                fc.double({ min: -10, max: 10, noNaN: true }),
                (walkSpeed, runSpeed, idleJumpSpeed, runJumpSpeed, gravity, jumpTime, dt, moveX, moveZ) => {
                    const result = computeJumpDisplacement(
                        false,  // wasIdleJump
                        false,  // wasWalking
                        true,   // wasRunning
                        walkSpeed,
                        runSpeed,
                        idleJumpSpeed,
                        runJumpSpeed,
                        gravity,
                        jumpTime,
                        dt,
                        moveX,
                        moveZ
                    );

                    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
                    const dirX = len > 0 ? moveX / len : 0;
                    const dirZ = len > 0 ? moveZ / len : 0;

                    const expectedForward = runSpeed * dt;
                    const expectedX = dirX * expectedForward;
                    const expectedZ = dirZ * expectedForward;
                    const expectedY = calcJumpDist(runJumpSpeed, gravity, jumpTime, dt);

                    // Run jump: horizontal uses runSpeed
                    expect(result.x).toBeCloseTo(expectedX, 10);
                    expect(result.z).toBeCloseTo(expectedZ, 10);

                    // Run jump: vertical uses runJumpSpeed
                    expect(result.y).toBeCloseTo(expectedY, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
});
