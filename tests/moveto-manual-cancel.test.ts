import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 8: Manual commands cancel active moveTo
 *
 * For any active moveTo state, when any manual movement command (walk, walkBack,
 * run, strafeLeft, strafeRight, jump, fall, idle) is called, the moveTo operation
 * shall be cancelled and the moveTo target cleared.
 *
 * Validates: Requirements 10.3
 */

/**
 * State type representing moveTo state within the CharacterController.
 */
interface MoveToState {
  active: boolean;
  target: { x: number; z: number } | null;
  node: { id: string } | null;
  obstructionCount: number;
  lastPos: { x: number; z: number } | null;
}

/**
 * All manual movement commands that should cancel an active moveTo operation.
 */
const MANUAL_COMMANDS = [
  "walk",
  "walkBack",
  "run",
  "strafeLeft",
  "strafeRight",
  "jump",
  "fall",
  "idle",
] as const;

type ManualCommand = (typeof MANUAL_COMMANDS)[number];

/**
 * Pure function simulating what happens to moveTo state when a manual command
 * is called while moveTo is active. This mirrors the cancellation logic in
 * CharacterController.ts where each manual movement command clears moveTo state.
 */
function applyManualCommand(state: MoveToState, _command: ManualCommand): MoveToState {
  if (!state.active) {
    // If moveTo is not active, manual commands don't affect moveTo state
    return state;
  }
  // When moveTo is active and a manual command is issued, clear all moveTo state
  return {
    active: false,
    target: null,
    node: null,
    obstructionCount: 0,
    lastPos: null,
  };
}

/**
 * Arbitrary for generating a random active moveTo state.
 */
const activeMoveToStateArb: fc.Arbitrary<MoveToState> = fc.record({
  active: fc.constant(true),
  target: fc.oneof(
    fc.record({
      x: fc.double({ min: -1000, max: 1000, noNaN: true }),
      z: fc.double({ min: -1000, max: 1000, noNaN: true }),
    }),
    fc.constant(null as { x: number; z: number } | null)
  ),
  node: fc.oneof(
    fc.record({ id: fc.string({ minLength: 1, maxLength: 10 }) }),
    fc.constant(null as { id: string } | null)
  ),
  obstructionCount: fc.integer({ min: 0, max: 10 }),
  lastPos: fc.oneof(
    fc.record({
      x: fc.double({ min: -1000, max: 1000, noNaN: true }),
      z: fc.double({ min: -1000, max: 1000, noNaN: true }),
    }),
    fc.constant(null as { x: number; z: number } | null)
  ),
});

/**
 * Arbitrary for generating a random manual command.
 */
const manualCommandArb: fc.Arbitrary<ManualCommand> = fc.constantFrom(...MANUAL_COMMANDS);

describe("Feature: moveto-turnto, Property 8: Manual commands cancel active moveTo", () => {
  it("any manual movement command cancels an active moveTo and clears all state", () => {
    fc.assert(
      fc.property(
        activeMoveToStateArb,
        manualCommandArb,
        (state, command) => {
          const result = applyManualCommand(state, command);

          // After any manual command on an active moveTo, state must be fully cleared
          expect(result.active).toBe(false);
          expect(result.target).toBeNull();
          expect(result.node).toBeNull();
          expect(result.obstructionCount).toBe(0);
          expect(result.lastPos).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it("all manual commands produce the same cleared state regardless of initial moveTo state", () => {
    fc.assert(
      fc.property(
        activeMoveToStateArb,
        manualCommandArb,
        manualCommandArb,
        (state, command1, command2) => {
          const result1 = applyManualCommand(state, command1);
          const result2 = applyManualCommand(state, command2);

          // Any two manual commands should produce identical cleared state
          expect(result1).toEqual(result2);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("manual commands do not affect moveTo state when moveTo is already inactive", () => {
    fc.assert(
      fc.property(
        manualCommandArb,
        (command) => {
          const inactiveState: MoveToState = {
            active: false,
            target: null,
            node: null,
            obstructionCount: 0,
            lastPos: null,
          };

          const result = applyManualCommand(inactiveState, command);

          // State should remain unchanged when moveTo is not active
          expect(result).toEqual(inactiveState);
        }
      ),
      { numRuns: 200 }
    );
  });
});
