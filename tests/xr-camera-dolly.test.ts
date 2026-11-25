import { describe, it, expect, vi, afterEach } from "vitest";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";
import { XR_COMPONENT_A_BUTTON, XR_COMPONENT_B_BUTTON } from "../src/xr/XRInputMapping";

/**
 * Feature: webxr-support - unit tests for XRController camera dolly (spec task
 * 11.2). Example-based vitest unit tests run entirely against mocks - no real
 * BabylonJS scene, no headset.
 *
 * Camera dolly moves the Follow_Camera's `radius` in/out while the right-hand
 * dolly buttons are held, snaps to the avatar on the left-X toggle, and
 * captures its live button components only on the right controller.
 *
 * The per-frame dolly step lives in the PRIVATE `_applyButtonDolly()`; each held
 * frame is exercised by calling it directly via `(controller as any)`, matching
 * the internal-seam testing convention used by the other XRController tests. The
 * capture (`captureRightDollyButtons`) and the snap toggle (`toggleDollyToAvatar`)
 * are public. Session-end capture clearing is driven the same way the jump test
 * drives teardown: set `_inXR = true` then call `onSessionEnd()`.
 *
 * Requirements covered:
 *  - R10.1 dolly-in (right B) held: `radius -= radiusRate` each frame.
 *  - R10.2 dolly-out (right A) held: `radius += radiusRate` each frame.
 *  - R10.3 radius clamped to `lowerRadiusLimit`/`upperRadiusLimit` when present;
 *    unclamped on a bound that is absent.
 *  - R10.4 left-X dolly-to-avatar round-trip snaps to `lowerRadiusLimit` (or 0)
 *    then restores the original radius.
 *  - R10.5 dolly buttons captured ONLY on the right controller; captures cleared
 *    on session end so `_applyButtonDolly` no longer moves radius.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * A fake ArcRotateCamera exposing the dolly surface the SUT touches: numeric
 * `radius`, optional `lowerRadiusLimit`/`upperRadiusLimit`, and a spied
 * `computeWorldMatrix`. Defaults leave both limits absent so radius moves freely
 * unless a test opts into a bound.
 */
function makeFakeArcCamera(overrides: Record<string, unknown> = {}) {
    return {
        __kind: "ArcRotateCamera",
        radius: 10,
        lowerRadiusLimit: null as number | null,
        upperRadiusLimit: null as number | null,
        attachControl: vi.fn(),
        computeWorldMatrix: vi.fn(),
        ...overrides,
    };
}

function makeFakeCC() {
    return {
        jump: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson: false })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
    };
}

function makeFakeScene() {
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
        onBeforeRenderObservable: { add: vi.fn((cb: unknown) => cb), remove: vi.fn(() => true) },
    };
}

/**
 * A fake button component with a mutable `.pressed` flag, matching the surface
 * `_applyButtonDolly` reads (via `_isComponentPressed`). Tests hold a button by
 * flipping `pressed = true` and release it with `pressed = false`.
 */
function makeFakeButtonComponent(pressed = false) {
    return { pressed };
}

/**
 * A fake motion controller. `getComponent(id)` returns the dolly-in button for
 * the B-button id and the dolly-out button for the A-button id (per the DEFAULT
 * mapping: CameraDollyIn -> RightBButton, CameraDollyOut -> RightAButton); any
 * other id yields null. The `.pressed` flags are mutable so a test can hold a
 * button across frames then release it.
 */
function makeFakeMotionController() {
    const dollyIn = makeFakeButtonComponent(); // resolves via b-button
    const dollyOut = makeFakeButtonComponent(); // resolves via a-button
    const getComponent = vi.fn((id: string) => {
        if (id === XR_COMPONENT_B_BUTTON) {
            return dollyIn;
        }
        if (id === XR_COMPONENT_A_BUTTON) {
            return dollyOut;
        }
        return null;
    });
    return { motionController: { getComponent }, dollyIn, dollyOut, getComponent };
}

function makeController(cameraOverrides: Record<string, unknown> = {}) {
    const cc = makeFakeCC();
    const camera = makeFakeArcCamera(cameraOverrides);
    const scene = makeFakeScene();
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene };
}

/** Drive one dolly frame through the private per-frame step. */
function applyButtonDolly(controller: XRController): void {
    (controller as any)._applyButtonDolly();
}

// Documented default dolly rate (design + XRController constant DEFAULT_RADIUS_RATE).
const RADIUS_RATE = 0.05;

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R10.1 - dolly-in (right B) held decreases radius by radiusRate per frame
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - dolly-in decreases radius by radiusRate per frame (R10.1)", () => {
    it("a held right-B button subtracts radiusRate from radius each frame", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true; // hold dolly-in
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(10 - RADIUS_RATE, 12);
    });

    it("decrements continuously across multiple held frames", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true;
        applyButtonDolly(controller);
        applyButtonDolly(controller);
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(10 - 3 * RADIUS_RATE, 12);
    });

    it("stops decrementing once the button is released", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true;
        applyButtonDolly(controller);
        dollyIn.pressed = false; // release
        applyButtonDolly(controller);
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(10 - RADIUS_RATE, 12);
    });

    it("marks the arc camera dirty after a dolly-in change", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true;
        applyButtonDolly(controller);

        expect(camera.computeWorldMatrix).toHaveBeenCalledWith(true);
    });

    it("does nothing when no dolly button is held", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        applyButtonDolly(controller); // neither pressed

        expect(camera.radius).toBe(10);
        expect(camera.computeWorldMatrix).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// R10.2 - dolly-out (right A) held increases radius by radiusRate per frame
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - dolly-out increases radius by radiusRate per frame (R10.2)", () => {
    it("a held right-A button adds radiusRate to radius each frame", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyOut } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyOut.pressed = true; // hold dolly-out
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(10 + RADIUS_RATE, 12);
    });

    it("increments continuously across multiple held frames", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyOut } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyOut.pressed = true;
        applyButtonDolly(controller);
        applyButtonDolly(controller);
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(10 + 3 * RADIUS_RATE, 12);
    });

    it("marks the arc camera dirty after a dolly-out change", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyOut } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyOut.pressed = true;
        applyButtonDolly(controller);

        expect(camera.computeWorldMatrix).toHaveBeenCalledWith(true);
    });
});

// ---------------------------------------------------------------------------
// R10.3 - radius clamped to present limits; unclamped when a bound is absent
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - radius is clamped to present radius limits (R10.3)", () => {
    it("dolly-in below lowerRadiusLimit pins to the limit", () => {
        const { controller, camera } = makeController({ radius: 2.02, lowerRadiusLimit: 2, upperRadiusLimit: 20 });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true; // 2.02 - 0.05 = 1.97 -> clamps to 2
        applyButtonDolly(controller);

        expect(camera.radius).toBe(2);
    });

    it("dolly-out above upperRadiusLimit pins to the limit", () => {
        const { controller, camera } = makeController({ radius: 19.98, lowerRadiusLimit: 2, upperRadiusLimit: 20 });
        const { motionController, dollyOut } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyOut.pressed = true; // 19.98 + 0.05 = 20.03 -> clamps to 20
        applyButtonDolly(controller);

        expect(camera.radius).toBe(20);
    });

    it("with no limits present, radius moves freely past where a limit would be", () => {
        const { controller, camera } = makeController({ radius: 0.02, lowerRadiusLimit: null, upperRadiusLimit: null });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true; // 0.02 - 0.05 = -0.03, no lower bound to clamp
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(0.02 - RADIUS_RATE, 12);
    });

    it("clamps only the present bound when the other is absent", () => {
        // Upper limit present, lower absent: dolly-in past 0 is not clamped.
        const { controller, camera } = makeController({ radius: 0.02, lowerRadiusLimit: null, upperRadiusLimit: 20 });
        const { motionController, dollyIn } = makeFakeMotionController();
        controller.captureRightDollyButtons(motionController as any, "right");

        dollyIn.pressed = true;
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(0.02 - RADIUS_RATE, 12);
    });
});

// ---------------------------------------------------------------------------
// R10.4 - left-X dolly-to-avatar round-trip
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - dolly-to-avatar toggle snaps then restores radius (R10.4)", () => {
    it("with a lower limit: first toggle snaps radius to lowerRadiusLimit", () => {
        const { controller, camera } = makeController({ radius: 12, lowerRadiusLimit: 2, upperRadiusLimit: 20 });

        controller.toggleDollyToAvatar();

        expect(camera.radius).toBe(2);
    });

    it("with a lower limit: round-trip restores the original radius", () => {
        const { controller, camera } = makeController({ radius: 12, lowerRadiusLimit: 2, upperRadiusLimit: 20 });

        controller.toggleDollyToAvatar(); // snap to 2
        controller.toggleDollyToAvatar(); // restore

        expect(camera.radius).toBe(12);
    });

    it("with no lower limit: first toggle snaps radius to 0", () => {
        const { controller, camera } = makeController({ radius: 12, lowerRadiusLimit: null, upperRadiusLimit: null });

        controller.toggleDollyToAvatar();

        expect(camera.radius).toBe(0);
    });

    it("with no lower limit: round-trip restores the original radius", () => {
        const { controller, camera } = makeController({ radius: 12, lowerRadiusLimit: null, upperRadiusLimit: null });

        controller.toggleDollyToAvatar(); // snap to 0
        controller.toggleDollyToAvatar(); // restore

        expect(camera.radius).toBe(12);
    });
});

// ---------------------------------------------------------------------------
// R10.5 - right-only capture; cleared on exit
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - dolly buttons capture right-only and clear on exit (R10.5)", () => {
    it("a left controller captures no dolly buttons, so applyButtonDolly does nothing", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn, dollyOut } = makeFakeMotionController();

        // Left controller: capture is a no-op.
        controller.captureRightDollyButtons(motionController as any, "left");

        // Even with the (left-hand) components pressed, nothing was captured.
        dollyIn.pressed = true;
        dollyOut.pressed = true;
        applyButtonDolly(controller);

        expect(camera.radius).toBe(10);
        expect(camera.computeWorldMatrix).not.toHaveBeenCalled();
    });

    it("the right controller captures the dolly buttons so applyButtonDolly moves radius", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn } = makeFakeMotionController();

        controller.captureRightDollyButtons(motionController as any, "right");
        dollyIn.pressed = true;
        applyButtonDolly(controller);

        expect(camera.radius).toBeCloseTo(10 - RADIUS_RATE, 12);
    });

    it("session end clears the captures so applyButtonDolly no longer moves radius", () => {
        const { controller, camera } = makeController({ radius: 10 });
        const { motionController, dollyIn } = makeFakeMotionController();

        controller.captureRightDollyButtons(motionController as any, "right");

        // End the session -> _detachSessionObservers -> _clearSessionCaptures.
        // Mark _inXR so onSessionEnd runs its teardown, then fire the hook.
        (controller as any)._inXR = true;
        controller.onSessionEnd();

        // The button is still "held", but the capture reference was cleared, so
        // the per-frame step finds nothing pressed and leaves radius unchanged.
        dollyIn.pressed = true;
        applyButtonDolly(controller);

        expect(camera.radius).toBe(10);
        expect(camera.computeWorldMatrix).not.toHaveBeenCalled();
    });
});
