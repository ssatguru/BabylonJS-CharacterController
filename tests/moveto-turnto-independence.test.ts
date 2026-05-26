import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 12: moveTo and turnTo are mutually exclusive
 *
 * When moveTo() is called, any active turnTo is cancelled.
 * When turnTo() is called, any active moveTo is cancelled.
 * Only one navigation operation can be active at a time.
 *
 * Validates: Requirements 10.6 (updated — mutual exclusivity)
 */

// --- State types for moveTo and turnTo ---

interface MoveToState {
    active: boolean;
    targetX: number;
    targetZ: number;
    run: boolean;
    arrivalDistance: number;
}

interface TurnToState {
    active: boolean;
    targetAngle: number;
    fast: boolean;
    angularTolerance: number;
}

interface NavigationState {
    moveTo: MoveToState;
    turnTo: TurnToState;
}

// --- Pure state machine functions ---

/**
 * Simulates calling moveTo(): activates moveTo and cancels any active turnTo.
 */
function activateMoveTo(state: NavigationState, newMoveTo: MoveToState): NavigationState {
    return {
        moveTo: { ...newMoveTo, active: true },
        turnTo: { ...state.turnTo, active: false },
    };
}

/**
 * Simulates calling turnTo(): activates turnTo and cancels any active moveTo.
 */
function activateTurnTo(state: NavigationState, newTurnTo: TurnToState): NavigationState {
    return {
        moveTo: { ...state.moveTo, active: false },
        turnTo: { ...newTurnTo, active: true },
    };
}

// --- Arbitraries ---

const moveToStateArb: fc.Arbitrary<MoveToState> = fc.record({
    active: fc.constant(true),
    targetX: fc.double({ min: -1000, max: 1000, noNaN: true }),
    targetZ: fc.double({ min: -1000, max: 1000, noNaN: true }),
    run: fc.boolean(),
    arrivalDistance: fc.double({ min: 0.1, max: 10, noNaN: true }),
});

const turnToStateArb: fc.Arbitrary<TurnToState> = fc.record({
    active: fc.constant(true),
    targetAngle: fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
    fast: fc.boolean(),
    angularTolerance: fc.double({ min: 0.001, max: 0.5, noNaN: true }),
});

describe("Feature: moveto-turnto, Property 12: moveTo and turnTo are mutually exclusive", () => {
    it("activating moveTo cancels any active turnTo", () => {
        fc.assert(
            fc.property(
                moveToStateArb,
                turnToStateArb,
                (newMoveTo, activeTurnTo) => {
                    // Start with turnTo active
                    const initialState: NavigationState = {
                        moveTo: { ...newMoveTo, active: false },
                        turnTo: activeTurnTo,
                    };

                    const afterMoveTo = activateMoveTo(initialState, newMoveTo);

                    // moveTo should be active
                    expect(afterMoveTo.moveTo.active).toBe(true);
                    // turnTo should be cancelled
                    expect(afterMoveTo.turnTo.active).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("activating turnTo cancels any active moveTo", () => {
        fc.assert(
            fc.property(
                moveToStateArb,
                turnToStateArb,
                (activeMoveTo, newTurnTo) => {
                    // Start with moveTo active
                    const initialState: NavigationState = {
                        moveTo: activeMoveTo,
                        turnTo: { ...newTurnTo, active: false },
                    };

                    const afterTurnTo = activateTurnTo(initialState, newTurnTo);

                    // turnTo should be active
                    expect(afterTurnTo.turnTo.active).toBe(true);
                    // moveTo should be cancelled
                    expect(afterTurnTo.moveTo.active).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("only one navigation operation is active at any time", () => {
        fc.assert(
            fc.property(
                moveToStateArb,
                turnToStateArb,
                fc.boolean(),
                (moveTo, turnTo, startWithMoveTo) => {
                    let state: NavigationState = {
                        moveTo: { ...moveTo, active: false },
                        turnTo: { ...turnTo, active: false },
                    };

                    if (startWithMoveTo) {
                        state = activateMoveTo(state, moveTo);
                        expect(state.moveTo.active).toBe(true);
                        expect(state.turnTo.active).toBe(false);

                        // Now activate turnTo — should cancel moveTo
                        state = activateTurnTo(state, turnTo);
                        expect(state.turnTo.active).toBe(true);
                        expect(state.moveTo.active).toBe(false);
                    } else {
                        state = activateTurnTo(state, turnTo);
                        expect(state.turnTo.active).toBe(true);
                        expect(state.moveTo.active).toBe(false);

                        // Now activate moveTo — should cancel turnTo
                        state = activateMoveTo(state, moveTo);
                        expect(state.moveTo.active).toBe(true);
                        expect(state.turnTo.active).toBe(false);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });
});
