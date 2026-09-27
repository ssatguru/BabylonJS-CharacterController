import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { XRLocomotion, LocomotionMode } from "../src/xr/XRLocomotion";

/**
 * Feature: webxr-support, Property 2: First-person is unreachable without permission
 *
 * The locomotion sub-mode state machine enforces a single guard: a transition
 * into `'firstPerson'` requires the caller to report first person is permitted
 * (`canFirstPerson === true`). A transition into `'thirdPerson'` is always
 * allowed. The invariant under test: for ANY sequence of mode-change operations
 * in which every operation supplies `canFirstPerson === false`, the resulting
 * mode SHALL never become `'firstPerson'`, regardless of the starting mode or
 * the operations attempted. Blocked first-person requests leave the mode
 * unchanged and report `{ changed: false, blocked: true }`.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.6
 */

// The two valid modes (R3.1).
const modes: LocomotionMode[] = ["firstPerson", "thirdPerson"];

// An operation is either a toggle or a setMode toward a specific target.
type Op =
    | { kind: "toggle" }
    | { kind: "setMode"; target: LocomotionMode };

const opArb: fc.Arbitrary<Op> = fc.oneof(
    fc.constant<Op>({ kind: "toggle" }),
    fc.constantFrom<LocomotionMode>(...modes).map((target) => ({ kind: "setMode" as const, target }))
);

function applyOp(machine: XRLocomotion, op: Op, canFirstPerson: boolean) {
    return op.kind === "toggle" ? machine.toggle(canFirstPerson) : machine.setMode(op.target, canFirstPerson);
}

describe("Feature: webxr-support, Property 2: First-person is unreachable without permission", () => {
    it("mode never becomes firstPerson across any op sequence when canFirstPerson is always false (R3.6)", () => {
        fc.assert(
            fc.property(
                // A machine constructed in thirdPerson (the only reachable start when
                // first person is never permitted).
                fc.array(opArb, { minLength: 0, maxLength: 30 }),
                (ops) => {
                    const machine = new XRLocomotion("thirdPerson");
                    for (const op of ops) {
                        const result = applyOp(machine, op, /* canFirstPerson */ false);
                        // Invariant holds after every single step, not just at the end.
                        expect(machine.getMode()).toBe("thirdPerson");
                        expect(result.mode).toBe("thirdPerson");
                    }
                    expect(machine.getMode()).toBe("thirdPerson");
                }
            ),
            { numRuns: 300 }
        );
    });

    it("a blocked firstPerson request leaves the mode unchanged and reports blocked+unchanged (R3.3)", () => {
        fc.assert(
            fc.property(fc.constantFrom<LocomotionMode>(...modes), (start) => {
                // Only thirdPerson is reachable without permission, but the guard
                // must behave correctly from any starting mode.
                const machine = new XRLocomotion(start);
                const prior = machine.getMode();
                const result = machine.setMode("firstPerson", /* canFirstPerson */ false);

                if (prior === "firstPerson") {
                    // Target equals current: guard still blocks the firstPerson
                    // transition (canFirstPerson false), mode unchanged, no change.
                    expect(result.blocked).toBe(true);
                    expect(result.changed).toBe(false);
                    expect(result.mode).toBe(prior);
                    expect(machine.getMode()).toBe(prior);
                } else {
                    // From thirdPerson: request denied, mode stays, blocked reported.
                    expect(result.blocked).toBe(true);
                    expect(result.changed).toBe(false);
                    expect(result.mode).toBe("thirdPerson");
                    expect(machine.getMode()).toBe("thirdPerson");
                }
            }),
            { numRuns: 100 }
        );
    });

    it("toggle toward firstPerson is blocked without permission and reports the current mode (R3.2, R3.3)", () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 20 }), (repeats) => {
                const machine = new XRLocomotion("thirdPerson");
                for (let i = 0; i < repeats; i++) {
                    const result = machine.toggle(/* canFirstPerson */ false);
                    // Toggle from thirdPerson targets firstPerson, which is denied.
                    expect(result.blocked).toBe(true);
                    expect(result.changed).toBe(false);
                    expect(result.mode).toBe("thirdPerson");
                }
                expect(machine.getMode()).toBe("thirdPerson");
            }),
            { numRuns: 100 }
        );
    });

    it("the machine only ever reports one of the two valid modes (R3.1)", () => {
        fc.assert(
            fc.property(fc.array(opArb, { maxLength: 30 }), (ops) => {
                const machine = new XRLocomotion("thirdPerson");
                for (const op of ops) {
                    const result = applyOp(machine, op, false);
                    expect(modes).toContain(result.mode);
                    expect(modes).toContain(machine.getMode());
                }
            }),
            { numRuns: 200 }
        );
    });
});