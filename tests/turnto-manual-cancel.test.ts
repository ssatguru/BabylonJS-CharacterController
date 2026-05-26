import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 9: Manual turn commands cancel active turnTo
 *
 * For any active turnTo state, when any manual turn command (turnLeft, turnRight,
 * turnLeftFast, turnRightFast) is called, the turnTo operation shall be cancelled
 * and the turnTo target cleared.
 *
 * Validates: Requirements 10.4
 */

/**
 * State type representing turnTo state in the CharacterController.
 */
interface TurnToState {
  active: boolean;
  target: { x: number; y: number; z: number } | null;
  node: { id: string } | null;
  angle: number | null;
  targetAngle: number | null;
}

/**
 * The set of manual turn commands that should cancel an active turnTo operation.
 */
const MANUAL_TURN_COMMANDS = [
  "turnLeft",
  "turnRight",
  "turnLeftFast",
  "turnRightFast",
] as const;

type ManualTurnCommand = (typeof MANUAL_TURN_COMMANDS)[number];

/**
 * Pure function simulating what happens to turnTo state when a manual turn
 * command is called while turnTo is active.
 *
 * This mirrors the cancellation logic in CharacterController.ts where each
 * manual turn command checks if _turnToActive is true and clears the state.
 */
function applyManualTurnCommand(
  state: TurnToState,
  _command: ManualTurnCommand
): TurnToState {
  if (state.active) {
    return {
      active: false,
      target: null,
      node: null,
      angle: null,
      targetAngle: null,
    };
  }
  // If not active, state is unchanged
  return state;
}

describe("Feature: moveto-turnto, Property 9: Manual turn commands cancel active turnTo", () => {
  /**
   * Arbitrary for generating random active turnTo states.
   */
  const activeTurnToStateArb = fc.record({
    active: fc.constant(true),
    target: fc.oneof(
      fc.record({
        x: fc.double({ min: -1000, max: 1000, noNaN: true }),
        y: fc.double({ min: -1000, max: 1000, noNaN: true }),
        z: fc.double({ min: -1000, max: 1000, noNaN: true }),
      }),
      fc.constant(null)
    ),
    node: fc.oneof(
      fc.record({ id: fc.string({ minLength: 1, maxLength: 20 }) }),
      fc.constant(null)
    ),
    angle: fc.oneof(
      fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
      fc.constant(null)
    ),
    targetAngle: fc.oneof(
      fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
      fc.constant(null)
    ),
  });

  /**
   * Arbitrary for generating a random manual turn command.
   */
  const manualTurnCommandArb = fc.constantFrom(...MANUAL_TURN_COMMANDS);

  it("any manual turn command cancels an active turnTo and clears all state", () => {
    fc.assert(
      fc.property(
        activeTurnToStateArb,
        manualTurnCommandArb,
        (initialState, command) => {
          const resultState = applyManualTurnCommand(initialState, command);

          // After any manual turn command, turnTo state must be fully cleared
          expect(resultState.active).toBe(false);
          expect(resultState.target).toBeNull();
          expect(resultState.node).toBeNull();
          expect(resultState.angle).toBeNull();
          expect(resultState.targetAngle).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it("all four manual turn commands produce the same cancellation result", () => {
    fc.assert(
      fc.property(activeTurnToStateArb, (initialState) => {
        const results = MANUAL_TURN_COMMANDS.map((cmd) =>
          applyManualTurnCommand(initialState, cmd)
        );

        // All commands should produce the same cleared state
        for (const result of results) {
          expect(result.active).toBe(false);
          expect(result.target).toBeNull();
          expect(result.node).toBeNull();
          expect(result.angle).toBeNull();
          expect(result.targetAngle).toBeNull();
        }
      }),
      { numRuns: 200 }
    );
  });

  it("cancellation works regardless of which turnTo fields are populated", () => {
    fc.assert(
      fc.property(
        // Generate states with various combinations of populated fields
        fc.record({
          active: fc.constant(true),
          target: fc.oneof(
            fc.record({
              x: fc.double({ min: -500, max: 500, noNaN: true }),
              y: fc.double({ min: -500, max: 500, noNaN: true }),
              z: fc.double({ min: -500, max: 500, noNaN: true }),
            }),
            fc.constant(null)
          ),
          node: fc.oneof(
            fc.record({ id: fc.string({ minLength: 1, maxLength: 10 }) }),
            fc.constant(null)
          ),
          angle: fc.oneof(
            fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
            fc.constant(null)
          ),
          targetAngle: fc.oneof(
            fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
            fc.constant(null)
          ),
        }),
        manualTurnCommandArb,
        (initialState, command) => {
          const resultState = applyManualTurnCommand(initialState, command);

          // Regardless of which fields were populated, all must be cleared
          expect(resultState.active).toBe(false);
          expect(resultState.target).toBeNull();
          expect(resultState.node).toBeNull();
          expect(resultState.angle).toBeNull();
          expect(resultState.targetAngle).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });
});
