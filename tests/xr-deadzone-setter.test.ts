import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { XRController } from "../src/xr/XRController";
import { DEFAULT_STICK_DEADZONE } from "../src/xr/XRLocomotion";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support, Property 6
 *
 * Property 6: Deadzone setter is clamped to [0, 1]
 *
 * For any real input value, the stored stick deadzone after
 * `setStickDeadzone` (the seam behind the public `setXRStickDeadzone`
 * delegate) SHALL lie within `[0, 1]`, and SHALL equal the input exactly
 * when the input is already within `[0, 1]`. Non-finite input SHALL leave
 * the current deadzone unchanged.
 *
 * These are pure-state property assertions run entirely against minimal mocks -
 * no real BabylonJS scene, no headset. The effective clamped value is read back
 * through the private `_stickDeadzone` field (the only observable seam for the
 * stored deadzone), mirroring the private-field access used by the sibling
 * pure-state XR tests.
 *
 * Validates: Requirements 6.8
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Minimal mocks - just enough to construct an XRController.
// ---------------------------------------------------------------------------

function makeFakeCC() {
    return {
        getSettings: vi.fn(() => ({ noFirstPerson: false })),
        setNoFirstPerson: vi.fn(),
    };
}

function makeFakeArcCamera() {
    return { __kind: "ArcRotateCamera", attachControl: vi.fn() };
}

function makeFakeScene() {
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
        onBeforeRenderObservable: { add: vi.fn((cb: unknown) => cb), remove: vi.fn(() => true) },
    };
}

function makeController(): XRController {
    return new XRController(makeFakeCC() as any, makeFakeArcCamera() as any, makeFakeScene() as any);
}

/** Read the effective stored deadzone (the only observable seam). */
function storedDeadzone(controller: XRController): number {
    return (controller as unknown as { _stickDeadzone: number })._stickDeadzone;
}

// ---------------------------------------------------------------------------
// Property 6 - clamp to [0, 1]; identity within range; ignore non-finite.
// ---------------------------------------------------------------------------

describe("Feature: webxr-support, Property 6 - deadzone setter is clamped to [0, 1] (R6.8)", () => {
    it("stores the documented default before any setter call", () => {
        const controller = makeController();
        expect(storedDeadzone(controller)).toBe(DEFAULT_STICK_DEADZONE);
        expect(storedDeadzone(controller)).toBeGreaterThanOrEqual(0);
        expect(storedDeadzone(controller)).toBeLessThanOrEqual(1);
    });

    it("for any finite input, the stored deadzone always lies within [0, 1]", () => {
        fc.assert(
            fc.property(
                fc.double({ min: -1e9, max: 1e9, noNaN: true }),
                (v) => {
                    const controller = makeController();
                    controller.setStickDeadzone(v);
                    const stored = storedDeadzone(controller);
                    expect(stored).toBeGreaterThanOrEqual(0);
                    expect(stored).toBeLessThanOrEqual(1);
                }
            )
        );
    });

    it("for any input already within [0, 1], the stored deadzone equals the input exactly", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 1, noNaN: true }),
                (v) => {
                    const controller = makeController();
                    controller.setStickDeadzone(v);
                    expect(storedDeadzone(controller)).toBe(v);
                }
            )
        );
    });

    it("for any input below 0, the stored deadzone clamps to 0", () => {
        fc.assert(
            fc.property(
                fc.double({ min: -1e9, max: -Number.MIN_VALUE, noNaN: true }),
                (v) => {
                    const controller = makeController();
                    controller.setStickDeadzone(v);
                    expect(storedDeadzone(controller)).toBe(0);
                }
            )
        );
    });

    it("for any input above 1, the stored deadzone clamps to 1", () => {
        fc.assert(
            fc.property(
                // strictly above 1
                fc.double({ min: 1 + Number.EPSILON, max: 1e9, noNaN: true }),
                (v) => {
                    const controller = makeController();
                    controller.setStickDeadzone(v);
                    expect(storedDeadzone(controller)).toBe(1);
                }
            )
        );
    });

    it("non-finite input (NaN, +/-Infinity) leaves the current deadzone unchanged", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
                // a valid prior value to establish before the non-finite call
                fc.double({ min: 0, max: 1, noNaN: true }),
                (nonFinite, prior) => {
                    const controller = makeController();
                    controller.setStickDeadzone(prior);
                    expect(storedDeadzone(controller)).toBe(prior);

                    controller.setStickDeadzone(nonFinite);
                    // Unchanged from the prior valid value.
                    expect(storedDeadzone(controller)).toBe(prior);
                }
            )
        );
    });

    it("the boundary values 0 and 1 are stored exactly (idempotent at bounds)", () => {
        const controller = makeController();
        controller.setStickDeadzone(0);
        expect(storedDeadzone(controller)).toBe(0);
        controller.setStickDeadzone(1);
        expect(storedDeadzone(controller)).toBe(1);
    });
});
