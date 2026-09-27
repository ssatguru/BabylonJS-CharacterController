import { describe, it, expect } from "vitest";

/**
 * Feature: webxr-support - Public delegates & support exposure (task 20.3)
 *
 * These unit tests exercise the CharacterController-level public XR surface and
 * the re-export surface of the library entry point (`src/CharacterController.ts`).
 *
 * Testing strategy
 * ----------------
 * A full `CharacterController` cannot be constructed in a headless node test
 * environment: its constructor calls `setCharacter(avatar, ...)` and expects a
 * real BabylonJS `Mesh`/skeleton/scene. However, the public XR *delegate*
 * methods under test here (`isXRSupported`, `setXRInputMapping`,
 * `getDefaultXRInputMapping`, `getEffectiveXRInputMapping`) touch only two
 * instance fields - `_xr` (null until `enableXR`) and `_xrEffectiveMapping` -
 * and never the scene while `_xr` is null. We therefore drive the *actual*
 * delegate code on a prototype-backed instance (`Object.create(...)`) seeded
 * with those two fields, which faithfully validates the CharacterController
 * surface (not merely the pure modules it delegates to).
 *
 * Every symbol is imported from the entry point `../src/CharacterController`
 * (never directly from `src/xr/*`) so that these tests also exercise the task
 * 20.2 re-export surface that feeds the shared `dist/CharacterController.d.ts`.
 *
 * Validates: Requirements 16.2, 16.4, 16.5, 18.1, 18.2, 18.3, 18.4, 18.5,
 *            18.6, 18.14
 */

import {
    CharacterController,
    BindableAction,
    BindableInput,
    DEFAULT_XR_INPUT_MAPPING,
    detectXRSupport,
    type XRInputMapping,
    type XRSupportState,
    type MappingResult,
} from "../src/CharacterController";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a prototype-backed CharacterController that exercises the real delegate
 * methods without running the scene-dependent constructor. `_xr` is null (XR
 * never enabled) and the effective mapping is seeded to the documented default,
 * exactly as the real constructor field initializer does.
 */
function makeCC(): CharacterController {
    const cc = Object.create(CharacterController.prototype) as CharacterController;
    // Mirror the real field initializers relevant to the XR delegates.
    (cc as unknown as { _xr: unknown })._xr = null;
    (cc as unknown as { _xrEffectiveMapping: XRInputMapping })._xrEffectiveMapping = {
        ...DEFAULT_XR_INPUT_MAPPING,
    };
    return cc;
}

// The documented Bindable_Action members (R18.2).
const DOCUMENTED_ACTIONS = [
    "Move",
    "FastModifier",
    "Jump",
    "CameraOrbit",
    "CameraDollyIn",
    "CameraDollyOut",
    "DollyToAvatarToggle",
    "LocomotionModeToggle",
    "Teleport",
] as const;

// The documented Bindable_Input members (R18.3): handedness + component.
const DOCUMENTED_INPUTS = [
    "left-thumbstick-axes",
    "right-thumbstick-axes",
    "left-thumbstick-press",
    "right-thumbstick-press",
    "left-trigger",
    "right-trigger",
    "left-grip",
    "right-grip",
    "left-a-button",
    "left-b-button",
    "left-x-button",
    "left-y-button",
    "right-a-button",
    "right-b-button",
    "right-x-button",
    "right-y-button",
] as const;

// The documented Default_Mapping bindings (R18.5).
const DOCUMENTED_DEFAULT: Record<string, string | null> = {
    Move: "left-thumbstick-axes",
    FastModifier: "left-thumbstick-press",
    Jump: "left-trigger",
    CameraOrbit: "right-thumbstick-axes",
    CameraDollyIn: "right-b-button",
    CameraDollyOut: "right-a-button",
    DollyToAvatarToggle: "left-x-button",
    LocomotionModeToggle: "left-a-button",
    Teleport: null,
};

// ---------------------------------------------------------------------------
// Support exposure: R16.4, R16.5, R16.2
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - isXRSupported before enable (R16.4, R16.5)", () => {
    it("resolves { vrSupported:false, arSupported:false } when XR was never enabled (R16.4)", async () => {
        const cc = makeCC();
        const state = await cc.isXRSupported();
        expect(state).toEqual({ vrSupported: false, arSupported: false });
    });

    it("exposes the XR_Support_State shape { vrSupported, arSupported } (R16.5)", async () => {
        const cc = makeCC();
        const state: XRSupportState = await cc.isXRSupported();
        expect(Object.keys(state).sort()).toEqual(["arSupported", "vrSupported"]);
        expect(typeof state.vrSupported).toBe("boolean");
        expect(typeof state.arSupported).toBe("boolean");
    });

    it("never throws and does not mutate on repeated queries before enable (R16.4)", async () => {
        const cc = makeCC();
        const a = await cc.isXRSupported();
        const b = await cc.isXRSupported();
        expect(a).toEqual(b);
        expect(a).toEqual({ vrSupported: false, arSupported: false });
    });
});

describe("Feature: webxr-support - navigator.xr absent edge case (R16.2)", () => {
    // The pure XRSupport module owns the exhaustive `navigator.xr` handling; here
    // we confirm the CharacterController-level surface (re-exported detector +
    // the null-_xr delegate) behaves safely when no WebXR API is present.
    // `navigator` may be a getter-only global in some runtimes, so override it
    // via a configurable property descriptor and restore the original after.
    const hadOwn = Object.getOwnPropertyDescriptor(globalThis, "navigator");

    function withNavigatorNoXR<T>(fn: () => T): T {
        Object.defineProperty(globalThis, "navigator", {
            value: {} as unknown, // a navigator with no `.xr`
            configurable: true,
            writable: true,
        });
        try {
            return fn();
        } finally {
            if (hadOwn) {
                Object.defineProperty(globalThis, "navigator", hadOwn);
            } else {
                delete (globalThis as { navigator?: unknown }).navigator;
            }
        }
    }

    it("re-exported detectXRSupport resolves {false,false} without throwing when navigator.xr is absent (R16.2)", async () => {
        const state = await withNavigatorNoXR(() => detectXRSupport());
        expect(state).toEqual({ vrSupported: false, arSupported: false });
    });

    it("the CharacterController surface stays safe (returns inert support) regardless of navigator.xr (R16.2, R16.4)", async () => {
        const state = await withNavigatorNoXR(() => {
            const cc = makeCC();
            return cc.isXRSupported();
        });
        expect(state).toEqual({ vrSupported: false, arSupported: false });
    });
});

// ---------------------------------------------------------------------------
// Enums: R18.2, R18.3
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - BindableAction / BindableInput enums (R18.2, R18.3)", () => {
    it("BindableAction contains exactly the documented members (R18.2)", () => {
        expect(Object.keys(BindableAction).sort()).toEqual([...DOCUMENTED_ACTIONS].sort());
        for (const name of DOCUMENTED_ACTIONS) {
            expect(BindableAction[name as keyof typeof BindableAction]).toBe(name);
        }
    });

    it("BindableInput contains exactly the documented members with handedness+component values (R18.3)", () => {
        expect(Object.values(BindableInput).sort()).toEqual([...DOCUMENTED_INPUTS].sort());
        // Every value is prefixed by a handedness marker.
        for (const value of Object.values(BindableInput)) {
            expect(value.startsWith("left-") || value.startsWith("right-")).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// Default mapping: R18.4, R18.5
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - getDefaultXRInputMapping (R18.4, R18.5)", () => {
    it("equals the documented default bindings (R18.5)", () => {
        const cc = makeCC();
        expect(cc.getDefaultXRInputMapping()).toEqual(DOCUMENTED_DEFAULT);
    });

    it("returns a copy (mutating the result does not affect subsequent queries) (R18.4)", () => {
        const cc = makeCC();
        const first = cc.getDefaultXRInputMapping();
        (first as Record<string, unknown>)[BindableAction.Move] = "tampered";
        const second = cc.getDefaultXRInputMapping();
        expect(second[BindableAction.Move]).toBe(BindableInput.LeftThumbstickAxes);
        expect(second).toEqual(DOCUMENTED_DEFAULT);
    });

    it("effective mapping equals the default before any developer override (R18.4)", () => {
        const cc = makeCC();
        expect(cc.getEffectiveXRInputMapping()).toEqual(DOCUMENTED_DEFAULT);
    });
});

// ---------------------------------------------------------------------------
// setXRInputMapping accept case + overlay: R18.1, R18.6
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - setXRInputMapping accept + overlay (R18.1, R18.6)", () => {
    it("applies a valid partial mapping and reports { applied:true } (R18.1)", () => {
        const cc = makeCC();
        // Remap Jump (a button action) to the right trigger (a button input) -
        // a valid button→button rebind that does not conflict with defaults
        // (default Jump=left-trigger, and nothing else binds right-trigger).
        const result: MappingResult = cc.setXRInputMapping({
            [BindableAction.Jump]: BindableInput.RightTrigger,
        });
        expect(result.applied).toBe(true);
        expect(result.rejected).toBe(false);
    });

    it("effective mapping reflects the overlay after a valid set (R18.6)", () => {
        const cc = makeCC();
        cc.setXRInputMapping({ [BindableAction.Jump]: BindableInput.RightTrigger });
        expect(cc.getEffectiveXRInputMapping()[BindableAction.Jump]).toBe(BindableInput.RightTrigger);
    });

    it("unspecified actions retain their defaults after a valid partial set (R18.6)", () => {
        const cc = makeCC();
        cc.setXRInputMapping({ [BindableAction.Jump]: BindableInput.RightTrigger });
        const eff = cc.getEffectiveXRInputMapping();
        // Only Jump changed; everything else keeps its documented default.
        for (const action of DOCUMENTED_ACTIONS) {
            if (action === "Jump") {
                expect(eff[action]).toBe(BindableInput.RightTrigger);
            } else {
                expect(eff[action]).toBe(DOCUMENTED_DEFAULT[action]);
            }
        }
    });

    it("the default mapping itself is unaffected by a valid override (R18.4, R18.6)", () => {
        const cc = makeCC();
        cc.setXRInputMapping({ [BindableAction.Jump]: BindableInput.RightTrigger });
        expect(cc.getDefaultXRInputMapping()).toEqual(DOCUMENTED_DEFAULT);
    });
});

// ---------------------------------------------------------------------------
// setXRInputMapping reject-and-keep-previous: R18.14 (with R18.1)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - setXRInputMapping reject keeps previous effective (R18.14)", () => {
    it("an invalid mapping returns { rejected:true, reason } (R18.1, R18.14)", () => {
        const cc = makeCC();
        // Axis action Move bound to a button input → type mismatch → reject.
        const result = cc.setXRInputMapping({
            [BindableAction.Move]: BindableInput.LeftTrigger,
        });
        expect(result.rejected).toBe(true);
        expect(result.applied).toBe(false);
        expect(typeof result.reason).toBe("string");
        expect((result.reason ?? "").length).toBeGreaterThan(0);
    });

    it("effective mapping is UNCHANGED from before the rejected call (R18.14)", () => {
        const cc = makeCC();
        // First establish a known non-default effective mapping via a valid set.
        cc.setXRInputMapping({ [BindableAction.Jump]: BindableInput.RightTrigger });
        const before = cc.getEffectiveXRInputMapping();

        // Now attempt an invalid set (Move→button input is a type mismatch).
        const result = cc.setXRInputMapping({ [BindableAction.Move]: BindableInput.LeftTrigger });
        expect(result.rejected).toBe(true);

        const after = cc.getEffectiveXRInputMapping();
        expect(after).toEqual(before);
        // The previously-applied valid override survives the rejected call.
        expect(after[BindableAction.Jump]).toBe(BindableInput.RightTrigger);
    });

    it("a conflicting mapping (one input → two actions) is rejected and keeps previous (R18.14)", () => {
        const cc = makeCC();
        const before = cc.getEffectiveXRInputMapping();
        // Bind left-trigger to both Jump and FastModifier → conflict.
        const result = cc.setXRInputMapping({
            [BindableAction.Jump]: BindableInput.LeftTrigger,
            [BindableAction.FastModifier]: BindableInput.LeftTrigger,
        });
        expect(result.rejected).toBe(true);
        expect(cc.getEffectiveXRInputMapping()).toEqual(before);
    });
});
