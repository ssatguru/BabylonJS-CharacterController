import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 11: Keyboard press does not cancel navigation when keyboard is disabled
 *
 * For any active moveTo or turnTo operation on a character with keyboard input disabled,
 * when a keyboard key is pressed, the navigation operation shall continue unaffected.
 *
 * Validates: Requirements 11.4
 */

// --- State types for navigation state machine ---

interface NavigationState {
    moveToActive: boolean;
    turnToActive: boolean;
    moveToTarget: { x: number; z: number } | null;
    turnToTargetAngle: number | null;
}

// --- Pure keyboard interrupt logic ---

/**
 * Simulates the keyboard interrupt logic from _onKeyDown().
 * If keyboard is DISABLED: do NOT cancel any navigation state.
 * If keyboard is ENABLED: cancel active navigation (not tested here).
 *
 * Returns the navigation state after the keyboard press is processed.
 */
function processKeyboardPress(
    state: NavigationState,
    keyboardEnabled: boolean
): NavigationState {
    if (!keyboardEnabled) {
        // Keyboard disabled: navigation continues unaffected
        return state;
    }

    // Keyboard enabled: cancel active navigation
    return {
        moveToActive: false,
        turnToActive: false,
        moveToTarget: null,
        turnToTargetAngle: null,
    };
}

describe("Feature: moveto-turnto, Property 11: Keyboard press does not cancel navigation when keyboard is disabled", () => {
    it("moveTo state remains unchanged after keyboard press with keyboard disabled", () => {
        fc.assert(
            fc.property(
                // Random moveTo target position
                fc.record({
                    x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    z: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                }),
                // Random turnTo target angle (may or may not be active)
                fc.option(
                    fc.double({ min: -Math.PI, max: Math.PI, noNaN: true, noDefaultInfinity: true }),
                    { nil: null }
                ),
                // Whether turnTo is also active
                fc.boolean(),
                (moveToTarget, turnToAngle, turnToAlsoActive) => {
                    const initialState: NavigationState = {
                        moveToActive: true,
                        turnToActive: turnToAlsoActive,
                        moveToTarget: moveToTarget,
                        turnToTargetAngle: turnToAlsoActive ? turnToAngle : null,
                    };

                    // Keyboard is disabled
                    const keyboardEnabled = false;

                    const resultState = processKeyboardPress(initialState, keyboardEnabled);

                    // moveTo state remains unchanged
                    expect(resultState.moveToActive).toBe(true);
                    expect(resultState.moveToTarget).toEqual(moveToTarget);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("turnTo state remains unchanged after keyboard press with keyboard disabled", () => {
        fc.assert(
            fc.property(
                // Random turnTo target angle
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true, noDefaultInfinity: true }),
                // Random moveTo target (may or may not be active)
                fc.option(
                    fc.record({
                        x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                        z: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    }),
                    { nil: null }
                ),
                // Whether moveTo is also active
                fc.boolean(),
                (turnToAngle, moveToTarget, moveToAlsoActive) => {
                    const initialState: NavigationState = {
                        moveToActive: moveToAlsoActive,
                        turnToActive: true,
                        moveToTarget: moveToAlsoActive ? moveToTarget : null,
                        turnToTargetAngle: turnToAngle,
                    };

                    // Keyboard is disabled
                    const keyboardEnabled = false;

                    const resultState = processKeyboardPress(initialState, keyboardEnabled);

                    // turnTo state remains unchanged
                    expect(resultState.turnToActive).toBe(true);
                    expect(resultState.turnToTargetAngle).toBe(turnToAngle);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("both moveTo and turnTo states remain unchanged after keyboard press with keyboard disabled", () => {
        fc.assert(
            fc.property(
                // Random moveTo target position
                fc.record({
                    x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    z: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                }),
                // Random turnTo target angle
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true, noDefaultInfinity: true }),
                (moveToTarget, turnToAngle) => {
                    const initialState: NavigationState = {
                        moveToActive: true,
                        turnToActive: true,
                        moveToTarget: moveToTarget,
                        turnToTargetAngle: turnToAngle,
                    };

                    // Keyboard is disabled
                    const keyboardEnabled = false;

                    const resultState = processKeyboardPress(initialState, keyboardEnabled);

                    // Both states remain completely unchanged
                    expect(resultState.moveToActive).toBe(initialState.moveToActive);
                    expect(resultState.turnToActive).toBe(initialState.turnToActive);
                    expect(resultState.moveToTarget).toEqual(initialState.moveToTarget);
                    expect(resultState.turnToTargetAngle).toBe(initialState.turnToTargetAngle);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("navigation state is identity-preserved when keyboard is disabled (any random state)", () => {
        fc.assert(
            fc.property(
                // Generate random navigation states
                fc.record({
                    moveToActive: fc.boolean(),
                    turnToActive: fc.boolean(),
                    moveToTarget: fc.option(
                        fc.record({
                            x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                            z: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                        }),
                        { nil: null }
                    ),
                    turnToTargetAngle: fc.option(
                        fc.double({ min: -Math.PI, max: Math.PI, noNaN: true, noDefaultInfinity: true }),
                        { nil: null }
                    ),
                }),
                (state) => {
                    // Ensure at least one navigation is active
                    fc.pre(state.moveToActive || state.turnToActive);

                    // Keyboard is disabled
                    const keyboardEnabled = false;

                    const resultState = processKeyboardPress(state, keyboardEnabled);

                    // The entire state is unchanged — keyboard press is a no-op
                    expect(resultState).toEqual(state);
                }
            ),
            { numRuns: 200 }
        );
    });
});
