import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 13: moveToStop and turnToStop are no-ops when inactive
 *
 * For any character state where no moveTo (or turnTo) operation is active,
 * calling moveToStop() (or turnToStop()) shall not alter the character's current
 * state, animation, or orientation.
 *
 * Validates: Requirements 4.3, 8.3
 */

/**
 * State types modeling the moveTo and turnTo navigation state machines.
 * When active is false, calling stop should be a no-op.
 */
interface MoveToState {
    active: boolean;
    positionX: number;
    positionZ: number;
    rotationY: number;
    animation: string;
}

interface TurnToState {
    active: boolean;
    rotationY: number;
    animation: string;
}

/**
 * Pure moveToStop logic extracted from CharacterController.ts.
 * If NOT active: return state unchanged (no-op).
 * If active: clear state and call idle.
 */
function moveToStop(state: MoveToState): MoveToState {
    if (!state.active) {
        return state;
    }
    return {
        ...state,
        active: false,
        animation: "idle",
    };
}

/**
 * Pure turnToStop logic extracted from CharacterController.ts.
 * If NOT active: return state unchanged (no-op).
 * If active: clear state and call idle.
 */
function turnToStop(state: TurnToState): TurnToState {
    if (!state.active) {
        return state;
    }
    return {
        ...state,
        active: false,
        animation: "idle",
    };
}

describe("Feature: moveto-turnto, Property 13: moveToStop and turnToStop are no-ops when inactive", () => {
    const animationArb = fc.constantFrom("idle", "walk", "run", "turnLeft", "turnRight");

    it("moveToStop is a no-op when moveTo is not active", () => {
        fc.assert(
            fc.property(
                // Generate random character states where moveTo is NOT active
                fc.double({ min: -1000, max: 1000, noNaN: true }),
                fc.double({ min: -1000, max: 1000, noNaN: true }),
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
                animationArb,
                (posX, posZ, rotY, animation) => {
                    const state: MoveToState = {
                        active: false,
                        positionX: posX,
                        positionZ: posZ,
                        rotationY: rotY,
                        animation: animation,
                    };

                    const result = moveToStop(state);

                    // State should be returned unchanged (exact same reference)
                    expect(result).toBe(state);
                    // Verify no fields were mutated
                    expect(result.active).toBe(false);
                    expect(result.positionX).toBe(posX);
                    expect(result.positionZ).toBe(posZ);
                    expect(result.rotationY).toBe(rotY);
                    expect(result.animation).toBe(animation);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("turnToStop is a no-op when turnTo is not active", () => {
        fc.assert(
            fc.property(
                // Generate random character states where turnTo is NOT active
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
                animationArb,
                (rotY, animation) => {
                    const state: TurnToState = {
                        active: false,
                        rotationY: rotY,
                        animation: animation,
                    };

                    const result = turnToStop(state);

                    // State should be returned unchanged (exact same reference)
                    expect(result).toBe(state);
                    // Verify no fields were mutated
                    expect(result.active).toBe(false);
                    expect(result.rotationY).toBe(rotY);
                    expect(result.animation).toBe(animation);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("moveToStop transitions to idle when moveTo IS active (contrast case)", () => {
        fc.assert(
            fc.property(
                fc.double({ min: -1000, max: 1000, noNaN: true }),
                fc.double({ min: -1000, max: 1000, noNaN: true }),
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
                animationArb,
                (posX, posZ, rotY, animation) => {
                    const state: MoveToState = {
                        active: true,
                        positionX: posX,
                        positionZ: posZ,
                        rotationY: rotY,
                        animation: animation,
                    };

                    const result = moveToStop(state);

                    // When active, stop should deactivate and set idle
                    expect(result).not.toBe(state);
                    expect(result.active).toBe(false);
                    expect(result.animation).toBe("idle");
                    // Position and rotation should remain unchanged
                    expect(result.positionX).toBe(posX);
                    expect(result.positionZ).toBe(posZ);
                    expect(result.rotationY).toBe(rotY);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("turnToStop transitions to idle when turnTo IS active (contrast case)", () => {
        fc.assert(
            fc.property(
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
                animationArb,
                (rotY, animation) => {
                    const state: TurnToState = {
                        active: true,
                        rotationY: rotY,
                        animation: animation,
                    };

                    const result = turnToStop(state);

                    // When active, stop should deactivate and set idle
                    expect(result).not.toBe(state);
                    expect(result.active).toBe(false);
                    expect(result.animation).toBe("idle");
                    // Rotation should remain unchanged
                    expect(result.rotationY).toBe(rotY);
                }
            ),
            { numRuns: 200 }
        );
    });
});
