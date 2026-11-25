import { describe, it, expect, vi, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import { neutralMoveIntent } from "../src/xr/XRLocomotion";
import type { MoveIntent } from "../src/xr/XRLocomotion";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for the XRController left-stick movement
 * WIRING (spec task 7.3). Example-based vitest unit tests run entirely against
 * mocks - no real BabylonJS scene, no headset.
 *
 * These tests exercise how the pure left-stick mapping is wired into the
 * per-frame render loop and the CharacterController movement surface. The pure
 * dominant-axis/deadzone mapping itself (mapStickToIntent) and the fast-variant
 * switching are covered by their own tests (xr-stick-to-intent / xr-fast-
 * movement); here we prove the WIRING:
 *
 *  - R6.1 WHILE an XR_Session is active, the bound left thumbstick is sampled
 *    EACH render frame and mapped to a Move_Intent via the pure mapper (with
 *    the Stick_Deadzone applied). We drive the session lifecycle by firing the
 *    WebXRState observer to IN_XR, inject a fake bound left-stick axes component,
 *    and fire the fake onBeforeRenderObservable to advance frames.
 *  - R6.6 A movement method is invoked Edge_Triggered - only on the frame a
 *    direction's active state changes (false->true / true->false), never every
 *    frame it stays held.
 *  - R6.7 WHEN an XR_Session ends WHILE a movement is active, a neutral
 *    Move_Intent is applied so the Avatar is not left moving under ArcRotate_Mode
 *    (the active direction receives its single `false` call).
 *
 * Harness convention mirrors xr-camera-follow.test.ts: a FakeObservable backs
 * both the WebXRState changes and the scene's onBeforeRenderObservable; the
 * `.add` token is the callback itself so firing the observable invokes the
 * per-frame closure registered by startStickSampler().
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// The documented default deadzone (design + XRController). Duplicated here so
// the tests can push the stick just beyond it.
const DEADZONE = 0.15;

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * Minimal fake BabylonJS Observable: records observers, supports removal, and
 * fires a value at every current observer. The `.add` token IS the callback so
 * firing calls the stored closures - matching the surface XRController touches.
 */
class FakeObservable<T> {
    observers: Array<(v: T) => void> = [];
    add = vi.fn((cb: (v: T) => void) => {
        this.observers.push(cb);
        return cb;
    });
    remove = vi.fn((token: ((v: T) => void) | null) => {
        if (token == null) {
            return false;
        }
        const i = this.observers.indexOf(token);
        if (i >= 0) {
            this.observers.splice(i, 1);
            return true;
        }
        return false;
    });
    fire(value: T): void {
        for (const cb of [...this.observers]) {
            cb(value);
        }
    }
}

/**
 * A fake CharacterController exposing every movement surface the sampler could
 * drive plus the coupling/keyboard surface onSessionStart touches. All spies so
 * the tests can assert exact on/off calls.
 */
function makeFakeCC() {
    return {
        walk: vi.fn(),
        run: vi.fn(),
        walkBack: vi.fn(),
        walkBackFast: vi.fn(),
        strafeLeft: vi.fn(),
        strafeLeftFast: vi.fn(),
        strafeRight: vi.fn(),
        strafeRightFast: vi.fn(),
        jump: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson: false })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
    };
}

/** Fake ArcRotateCamera exposing the orbit/dolly surface the guarded sampler may touch. */
function makeFakeArcCamera() {
    return {
        __kind: "ArcRotateCamera",
        position: { x: 0, y: 0, z: 0 },
        alpha: 0,
        beta: 1,
        radius: 10,
        lowerBetaLimit: null as number | null,
        upperBetaLimit: null as number | null,
        lowerRadiusLimit: null as number | null,
        upperRadiusLimit: null as number | null,
        attachControl: vi.fn(),
        computeWorldMatrix: vi.fn(),
    };
}

/** Fake WebXRCamera exposing the follow surface the per-frame update touches. */
function makeFakeXRCamera() {
    const cam = {
        __kind: "WebXRCamera",
        position: { x: 0, y: 0, z: 0 },
        setTransformationFromNonVRCamera: vi.fn(() => {
            cam.position.y = 0;
        }),
    };
    return cam;
}

function makeFakeScene() {
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
        onBeforeRenderObservable: new FakeObservable<void>(),
    };
}

interface FakeExperience {
    baseExperience: {
        onStateChangedObservable: FakeObservable<WebXRState>;
        camera: unknown;
    };
}

/**
 * A fake bound left-thumbstick axes component. Its live `axes` value is what the
 * sampler reads through `_readLeftStickInput()`. Mutating `axes` between frames
 * simulates the user moving the physical stick.
 */
function makeAxesComponent(x = 0, y = 0) {
    return { axes: { x, y } };
}

/**
 * Build an XRController wired to fresh fakes and enabled by adopting a provided
 * experience. Enabling registers the WebXRState observer so firing IN_XR drives
 * onSessionStart (which starts the render observer / stick sampler).
 */
async function makeEnabledController() {
    const cc = makeFakeCC();
    const arc = makeFakeArcCamera();
    const scene = makeFakeScene();
    const xrCamera = makeFakeXRCamera();
    const experience: FakeExperience = {
        baseExperience: {
            onStateChangedObservable: new FakeObservable<WebXRState>(),
            camera: xrCamera,
        },
    };
    const controller = new XRController(cc as any, arc as any, scene as any);
    const ok = await controller.enable(experience as any);
    expect(ok).toBe(true);
    return { controller, cc, arc, scene, xrCamera, experience };
}

function fireInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.IN_XR);
}
function fireNotInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.NOT_IN_XR);
}
function fireRenderFrame(scene: { onBeforeRenderObservable: FakeObservable<void> }): void {
    scene.onBeforeRenderObservable.fire(undefined as unknown as void);
}

/** Inject a bound left-stick axes component the way the data-driven binder would. */
function bindLeftStick(controller: XRController, component: unknown): void {
    (controller as any)._moveAxesComponent = component;
}

/** The last boolean a spy was called with, or undefined if never called. */
function lastArg(spy: ReturnType<typeof vi.fn>): boolean | undefined {
    if (spy.mock.calls.length === 0) return undefined;
    return spy.mock.calls[spy.mock.calls.length - 1][0] as boolean;
}

/** Build a MoveIntent with a single direction active. */
function only(direction: keyof MoveIntent): MoveIntent {
    const intent = neutralMoveIntent();
    intent[direction] = true;
    return intent;
}

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R6.1 - the bound left stick is sampled EACH render frame
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - the bound left stick is sampled each render frame (R6.1)", () => {
    it("registers exactly one per-frame render observer on session start", async () => {
        const { scene, experience } = await makeEnabledController();

        expect(scene.onBeforeRenderObservable.observers.length).toBe(0);
        fireInXR(experience);
        expect(scene.onBeforeRenderObservable.observers.length).toBe(1);
    });

    it("invokes sampleSticks() once per render frame while the session is active", async () => {
        const { controller, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const sampleSpy = vi.spyOn(controller as any, "sampleSticks");

        fireRenderFrame(scene);
        fireRenderFrame(scene);
        fireRenderFrame(scene);

        expect(sampleSpy).toHaveBeenCalledTimes(3);
    });

    it("reads the bound left-stick component's live axes each frame and maps forward push to walk", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        // Bind a live axes component and push it forward (leftY < -deadzone).
        const stick = makeAxesComponent(0, -1);
        bindLeftStick(controller, stick);

        fireRenderFrame(scene);

        // R6.1 wiring: the sampled stick mapped to a forward Move_Intent and
        // drove the CharacterController's `walk` on.
        expect(cc.walk).toHaveBeenCalledTimes(1);
        expect(cc.walk).toHaveBeenLastCalledWith(true);
    });

    it("re-reads the SAME bound component each frame so a mid-session stick change is picked up", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const stick = makeAxesComponent(0, 0); // resting
        bindLeftStick(controller, stick);

        // Frame 1: resting inside deadzone -> no movement.
        fireRenderFrame(scene);
        expect(cc.walk).not.toHaveBeenCalled();
        expect(cc.strafeRight).not.toHaveBeenCalled();

        // The physical stick is pushed right beyond the deadzone.
        stick.axes.x = 0.9;
        stick.axes.y = 0;

        // Frame 2: the live axes are re-read and mapped to strafeRight.
        fireRenderFrame(scene);
        expect(cc.strafeRight).toHaveBeenCalledTimes(1);
        expect(cc.strafeRight).toHaveBeenLastCalledWith(true);
    });

    it("treats a resting stick within the deadzone as zero (no movement)", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        // Both axes just under the default deadzone -> pure mapper yields neutral.
        bindLeftStick(controller, makeAxesComponent(DEADZONE - 0.01, -(DEADZONE - 0.01)));

        fireRenderFrame(scene);
        fireRenderFrame(scene);

        for (const name of ["walk", "walkBack", "strafeLeft", "strafeRight"] as const) {
            expect(cc[name], `${name} must not fire for a resting stick`).not.toHaveBeenCalled();
        }
    });
});

// ---------------------------------------------------------------------------
// R6.6 - edge-triggered on/off calls (only on active-state change)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - movement methods are edge-triggered (R6.6)", () => {
    it("drives `walk(true)` only on the frame the direction becomes active, not while held", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const stick = makeAxesComponent(0, -1); // forward
        bindLeftStick(controller, stick);

        // Hold forward across several frames.
        fireRenderFrame(scene);
        fireRenderFrame(scene);
        fireRenderFrame(scene);

        // Edge-triggered: exactly ONE `walk(true)` on the rising edge, no repeats.
        expect(cc.walk).toHaveBeenCalledTimes(1);
        expect(cc.walk).toHaveBeenLastCalledWith(true);
    });

    it("drives `walk(false)` once on release, then nothing while it stays released", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const stick = makeAxesComponent(0, -1); // forward
        bindLeftStick(controller, stick);

        fireRenderFrame(scene); // rising edge -> walk(true)
        expect(cc.walk).toHaveBeenCalledTimes(1);

        // Release the stick to center.
        stick.axes.x = 0;
        stick.axes.y = 0;

        fireRenderFrame(scene); // falling edge -> walk(false)
        fireRenderFrame(scene); // still released -> no call
        fireRenderFrame(scene);

        expect(cc.walk).toHaveBeenCalledTimes(2);
        expect(cc.walk).toHaveBeenNthCalledWith(1, true);
        expect(cc.walk).toHaveBeenNthCalledWith(2, false);
    });

    it("applyIntent emits no calls when the intent is unchanged between frames", () => {
        // Drive applyIntent directly to isolate the edge-trigger diff (no scene).
        const cc = makeFakeCC();
        const controller = new XRController(cc as any, makeFakeArcCamera() as any, makeFakeScene() as any);

        controller.applyIntent(only("strafeLeft"), false);
        controller.applyIntent(only("strafeLeft"), false);
        controller.applyIntent(only("strafeLeft"), false);

        expect(cc.strafeLeft).toHaveBeenCalledTimes(1);
        expect(cc.strafeLeft).toHaveBeenLastCalledWith(true);
    });

    it("emits a single off for the old direction and a single on for the new when direction switches", () => {
        const cc = makeFakeCC();
        const controller = new XRController(cc as any, makeFakeArcCamera() as any, makeFakeScene() as any);

        controller.applyIntent(only("walk"), false); // walk on
        controller.applyIntent(only("strafeRight"), false); // walk off, strafeRight on

        expect(cc.walk).toHaveBeenCalledTimes(2);
        expect(cc.walk).toHaveBeenNthCalledWith(1, true);
        expect(cc.walk).toHaveBeenNthCalledWith(2, false);

        expect(cc.strafeRight).toHaveBeenCalledTimes(1);
        expect(cc.strafeRight).toHaveBeenLastCalledWith(true);
    });
});

// ---------------------------------------------------------------------------
// R6.7 - neutral Move_Intent on session end while moving
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - a neutral Move_Intent is applied on session end (R6.7)", () => {
    it("stops an active forward movement when the session ends", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const stick = makeAxesComponent(0, -1); // forward
        bindLeftStick(controller, stick);

        fireRenderFrame(scene); // walk(true)
        expect(lastArg(cc.walk)).toBe(true);

        // Session ends while forward is still active.
        fireNotInXR(experience);

        // R6.7: the active direction received its single `false` call.
        expect(cc.walk).toHaveBeenLastCalledWith(false);
    });

    it("stops an active strafe movement when the session ends", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const stick = makeAxesComponent(0.9, 0); // strafe right
        bindLeftStick(controller, stick);

        fireRenderFrame(scene);
        expect(lastArg(cc.strafeRight)).toBe(true);

        fireNotInXR(experience);

        expect(cc.strafeRight).toHaveBeenLastCalledWith(false);
    });

    it("does not emit spurious `false` calls for directions that were never active", async () => {
        const { controller, cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        const stick = makeAxesComponent(0, -1); // only forward active
        bindLeftStick(controller, stick);
        fireRenderFrame(scene);

        // Clear the render-frame calls so we observe only the session-end effect.
        cc.walk.mockClear();
        cc.walkBack.mockClear();
        cc.strafeLeft.mockClear();
        cc.strafeRight.mockClear();

        fireNotInXR(experience);

        // Forward gets its single stop; the never-active directions get nothing.
        expect(cc.walk).toHaveBeenCalledTimes(1);
        expect(cc.walk).toHaveBeenLastCalledWith(false);
        expect(cc.walkBack).not.toHaveBeenCalled();
        expect(cc.strafeLeft).not.toHaveBeenCalled();
        expect(cc.strafeRight).not.toHaveBeenCalled();
    });

    it("stopAllMovement() pushes a neutral intent that stops the active direction (unit-level)", () => {
        const cc = makeFakeCC();
        const controller = new XRController(cc as any, makeFakeArcCamera() as any, makeFakeScene() as any);

        controller.applyIntent(only("walkBack"), false);
        expect(cc.walkBack).toHaveBeenLastCalledWith(true);

        controller.stopAllMovement();

        expect(cc.walkBack).toHaveBeenLastCalledWith(false);
    });
});
