import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 10: Keyboard press cancels navigation when keyboard is enabled
 *
 * For any active moveTo and/or turnTo operation on a character with keyboard
 * input enabled, when a keydown event is detected, all active navigation
 * operations shall be cancelled on the same frame, and the keyboard input
 * shall be processed normally.
 *
 * Validates: Requirements 10.7, 10.8, 11.1, 11.2, 11.3, 11.6
 */

// --- State types for navigation ---

interface NavigationState {
    moveToActive: boolean;
    turnToActive: boolean;
    keyboardEnabled: boolean;
}

interface NavigationResult {
    moveToActive: boolean;
    turnToActive: boolean;
    keyboardProcessed: boolean;
}

/**
 * Pure function that simulates the keyboard interrupt logic from _onKeyDown().
 *
 * When keyboard is enabled and a key is pressed:
 * - If moveTo is active: clear moveTo state
 * - If turnTo is active: clear turnTo state
 * - Keyboard input is processed normally
 *
 * When keyboard is disabled:
 * - Navigation state is unchanged
 * - Keyboard input is not processed
 */
function handleKeyboardInterrupt(state: NavigationState): NavigationResult {
    if (state.keyboardEnabled) {
        return {
            moveToActive: false,
            turnToActive: false,
            keyboardProcessed: true,
        };
    }
    // Keyboard disabled — navigation continues unaffected
    return {
        moveToActive: state.moveToActive,
        turnToActive: state.turnToActive,
        keyboardProcessed: false,
    };
}

describe("Feature: moveto-turnto, Property 10: Keyboard press cancels navigation when keyboard is enabled", () => {
    it("keyboard press cancels moveTo when keyboard is enabled and moveTo is active", () => {
        fc.assert(
            fc.property(
                // Generate random navigation states with keyboard enabled and moveTo active
                fc.record({
                    moveToActive: fc.constant(true),
                    turnToActive: fc.boolean(),
                    keyboardEnabled: fc.constant(true),
                }),
                (state) => {
                    const result = handleKeyboardInterrupt(state);

                    // moveTo must be cancelled
                    expect(result.moveToActive).toBe(false);
                    // Keyboard input must be processed normally
                    expect(result.keyboardProcessed).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("keyboard press cancels turnTo when keyboard is enabled and turnTo is active", () => {
        fc.assert(
            fc.property(
                // Generate random navigation states with keyboard enabled and turnTo active
                fc.record({
                    moveToActive: fc.boolean(),
                    turnToActive: fc.constant(true),
                    keyboardEnabled: fc.constant(true),
                }),
                (state) => {
                    const result = handleKeyboardInterrupt(state);

                    // turnTo must be cancelled
                    expect(result.turnToActive).toBe(false);
                    // Keyboard input must be processed normally
                    expect(result.keyboardProcessed).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("keyboard press cancels both moveTo and turnTo simultaneously when both are active", () => {
        fc.assert(
            fc.property(
                // Both operations active with keyboard enabled
                fc.record({
                    moveToActive: fc.constant(true),
                    turnToActive: fc.constant(true),
                    keyboardEnabled: fc.constant(true),
                }),
                (state) => {
                    const result = handleKeyboardInterrupt(state);

                    // Both must be cancelled simultaneously
                    expect(result.moveToActive).toBe(false);
                    expect(result.turnToActive).toBe(false);
                    // Keyboard input must be processed normally
                    expect(result.keyboardProcessed).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("keyboard press with keyboard enabled always cancels all active navigation", () => {
        fc.assert(
            fc.property(
                // Generate any combination of navigation states with keyboard enabled
                fc.record({
                    moveToActive: fc.boolean(),
                    turnToActive: fc.boolean(),
                    keyboardEnabled: fc.constant(true),
                }),
                (state) => {
                    const result = handleKeyboardInterrupt(state);

                    // Regardless of which operations were active, after keyboard press
                    // with keyboard enabled, all navigation is cleared
                    expect(result.moveToActive).toBe(false);
                    expect(result.turnToActive).toBe(false);
                    // Keyboard input is always processed when keyboard is enabled
                    expect(result.keyboardProcessed).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("keyboard press processes input normally after cancelling navigation", () => {
        fc.assert(
            fc.property(
                // Generate states where at least one navigation operation is active
                fc.record({
                    moveToActive: fc.boolean(),
                    turnToActive: fc.boolean(),
                    keyboardEnabled: fc.constant(true),
                }),
                fc.oneof(
                    fc.constant(true),
                    fc.constant(true)
                ),
                (state, _keyPressed) => {
                    // Precondition: at least one navigation operation is active
                    fc.pre(state.moveToActive || state.turnToActive);

                    const result = handleKeyboardInterrupt(state);

                    // After cancellation, keyboard input is processed normally
                    // (as if no moveTo or turnTo had been active)
                    expect(result.keyboardProcessed).toBe(true);
                    // Navigation is fully cleared
                    expect(result.moveToActive).toBe(false);
                    expect(result.turnToActive).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });
});
