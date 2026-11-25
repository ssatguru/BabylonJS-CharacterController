import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for the D15 initial-pose hook
 * (spec task 12.4). Example-based vitest unit tests running entirely against
 * mocks - no real BabylonJS scene, no headset.
 *
 * The initial-pose hook (`_registerInitialPoseHook`, called from
 * `onSessionStart` step 4) registers a ONE-SHOT observer on
 * `baseExperience.onInitialXRPoseSetObservable`. On the first XR pose - before
 * the first render frame - it seeds the rendered `WebXRCamera` onto the live
 * follow pose (the shared `_seedXRCameraOntoFollowPose` helper:
 * `setTransformationFromNonVRCamera(arcCamera, true)` mirror + arc-camera-Y
 * re-apply) so the floor/eye-level Y drop never appears.
 *
 * Requirements covered:
 *  - R11.1 the XR camera is seeded onto the follow target
 *    (`setTransformationFromNonVRCamera(arcCamera, true)` mirror) on the first
 *    XR pose, before the first render frame
 *  - R11.2 the arc camera's Y is re-applied onto the XR camera (the mirror
 *    zeroes the XR camera Y)
 *  - R11.3 the observer is one-shot (a later pose does not re-seed) and is
 *    detached on session end
 *
 * detectXRSupport() is mocked so enter() sees the requested session type as
 * supported without stubbing navigator.xr / WebXRSessionManager.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

import { detectXRSupport } from "../src/xr/XRSupport";
const mockedDetectXRSupport = detectXRSupport as unknown as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * A minimal fake of a BabylonJS Observable: records added observers, supports
 * removal, and lets the test fire at every current observer. Matches the
 * `.add` / `.remove` surface XRController touches.
 */
class FakeObservable<T> {
    observers: Array<(v: T) => void> = [];
    add = vi.fn((cb: (v: T) => void) => {
        this.observers.push(cb);
        return cb; // Observer token is the callback itself (opaque to the SUT).
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
        // Copy so a handler that removes itself during dispatch is safe.
        for (const cb of [...this.observers]) {
            cb(value);
        }
    }
}

/**
 * A fake WebXRCamera exposing the exact surface `_seedXRCameraOntoFollowPose`
 * touches: `setTransformationFromNonVRCamera` (the mirror) and a `position`
 * with a numeric `y`. The mirror records the argument it was called with and
 * zeroes `position.y` to mimic BabylonJS forcing the XR camera to the floor.
 */
function makeFakeXRCamera() {
    const cam = {
        __kind: "WebXRCamera",
        position: { x: 0, y: 99, z: 0 },
        setTransformationFromNonVRCamera: vi.fn((_camera: unknown, _reset?: boolean) => {
            // The real mirror forces the XR camera position.y to zero.
            cam.position.y = 0;
        }),
    };
    return cam;
}

interface FakeBaseExperience {
    onStateChangedObservable: FakeObservable<WebXRState>;
    onInitialXRPoseSetObservable?: FakeObservable<void>;
    camera: ReturnType<typeof makeFakeXRCamera>;
    enterXRAsync: ReturnType<typeof vi.fn>;
    exitXRAsync: ReturnType<typeof vi.fn>;
}

interface FakeExperience {
    baseExperience: FakeBaseExperience;
}

/**
 * Build a fake experience. When `withPoseObservable` is true the base
 * experience exposes `onInitialXRPoseSetObservable` (primary hook path); when
 * false it is absent (the IN_XR fallback path).
 */
function makeFakeExperience(withPoseObservable = true): FakeExperience {
    const base: FakeBaseExperience = {
        onStateChangedObservable: new FakeObservable<WebXRState>(),
        camera: makeFakeXRCamera(),
        enterXRAsync: vi.fn(async () => ({})),
        exitXRAsync: vi.fn(async () => undefined),
    };
    if (withPoseObservable) {
        base.onInitialXRPoseSetObservable = new FakeObservable<void>();
    }
    return { baseExperience: base };
}

/** Arc (Follow) camera with a beta-driven Y the seed must re-apply onto the XR camera. */
function makeFakeArcCamera(arcY = 12.5) {
    return {
        __kind: "ArcRotateCamera",
        position: { x: 3, y: arcY, z: -7 },
        attachControl: vi.fn(),
    };
}

function makeFakeScene(experience: FakeExperience | null) {
    const canvas = { __kind: "canvas" };
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => canvas) })),
        createDefaultXRExperienceAsync: vi.fn(async (_opts: unknown) => experience),
        // A no-op render observable so the stick sampler / follow observer wiring
        // in onSessionStart never throws under the mock.
        onBeforeRenderObservable: new FakeObservable<void>(),
        __canvas: canvas,
    };
}

function makeFakeCC(noFirstPerson = false) {
    return {
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson })),
        setNoFirstPerson: vi.fn(),
    };
}

function makeController(opts?: {
    withPoseObservable?: boolean;
    arcY?: number;
    noFirstPerson?: boolean;
}) {
    const experience = makeFakeExperience(opts?.withPoseObservable ?? true);
    const cc = makeFakeCC(opts?.noFirstPerson ?? false);
    const camera = makeFakeArcCamera(opts?.arcY ?? 12.5);
    const scene = makeFakeScene(experience);
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene, experience };
}

function poseObs(experience: FakeExperience): FakeObservable<void> {
    return experience.baseExperience.onInitialXRPoseSetObservable as FakeObservable<void>;
}
function xrCam(experience: FakeExperience) {
    return experience.baseExperience.camera;
}

function fireInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.IN_XR);
}
function fireNotInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.NOT_IN_XR);
}

/** Enter a live session so onSessionStart (and thus the pose hook) has run. */
async function startSession(controller: XRController, experience: FakeExperience) {
    await controller.enable(experience as any);
    await controller.enter("vr");
    fireInXR(experience);
}

beforeEach(() => {
    mockedDetectXRSupport.mockReset();
    mockedDetectXRSupport.mockResolvedValue({ vrSupported: true, arSupported: true });
});

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Primary path: onInitialXRPoseSetObservable present (R11.1, R11.2, R11.3)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - initial-pose hook (primary observable path)", () => {
    it("registers a one-shot observer on onInitialXRPoseSetObservable at session start (R11.3)", async () => {
        const { controller, experience } = makeController();

        await startSession(controller, experience);

        // The pose observer was added exactly once and is pending (not yet fired).
        expect(poseObs(experience).add).toHaveBeenCalledTimes(1);
        expect(poseObs(experience).observers.length).toBe(1);
    });

    it("seeds the XR camera onto the follow target on the first pose, before any render frame (R11.1, R11.2)", async () => {
        const arcY = 8.25;
        const { controller, camera, experience } = makeController({ arcY });
        await startSession(controller, experience);

        const xr = xrCam(experience);
        // Not seeded yet - the observable has not fired.
        expect(xr.setTransformationFromNonVRCamera).not.toHaveBeenCalled();

        // Fire the initial-pose observable (this happens before the first render).
        poseObs(experience).fire();

        // R11.1: mirrored the Follow_Camera (the arc camera) with resetToBaseReferenceSpace=true.
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledWith(camera, true);
        // R11.2: the arc camera's Y was re-applied onto the XR camera (mirror had zeroed it).
        expect(xr.position.y).toBe(arcY);
    });

    it("is one-shot: firing a later pose does NOT re-seed (R11.3)", async () => {
        const { controller, experience } = makeController({ arcY: 5 });
        await startSession(controller, experience);
        const xr = xrCam(experience);

        // First pose seeds once and the observer removes itself.
        poseObs(experience).fire();
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
        expect(poseObs(experience).remove).toHaveBeenCalledTimes(1);
        expect(poseObs(experience).observers.length).toBe(0);

        // A later pose (e.g. a recenter) must not re-seed.
        poseObs(experience).fire();
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
    });

    it("detaches the (unfired) initial-pose observer on session end (R11.3)", async () => {
        const { controller, experience } = makeController();
        await startSession(controller, experience);
        const xr = xrCam(experience);

        // Session ends before the first pose ever fired.
        expect(poseObs(experience).observers.length).toBe(1);
        fireNotInXR(experience); // drives onSessionEnd -> _detachSessionObservers

        // Observer removed; the pose hook was never seeded.
        expect(poseObs(experience).remove).toHaveBeenCalledTimes(1);
        expect(poseObs(experience).observers.length).toBe(0);
        expect(xr.setTransformationFromNonVRCamera).not.toHaveBeenCalled();

        // A stray late pose after teardown does not seed.
        poseObs(experience).fire();
        expect(xr.setTransformationFromNonVRCamera).not.toHaveBeenCalled();
    });

    it("re-registers a fresh one-shot observer on a second session (no accumulation across cycles)", async () => {
        const { controller, experience } = makeController();

        // First session: enter, fire pose, end.
        await startSession(controller, experience);
        poseObs(experience).fire();
        fireNotInXR(experience);
        expect(poseObs(experience).observers.length).toBe(0);

        // Second session reuses the same experience.
        await controller.enter("vr");
        fireInXR(experience);

        // Exactly one pending observer for the new session (added twice total).
        expect(poseObs(experience).add).toHaveBeenCalledTimes(2);
        expect(poseObs(experience).observers.length).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Fallback path: onInitialXRPoseSetObservable absent (R11.1, R11.2, R11.3)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - initial-pose hook (IN_XR fallback path)", () => {
    it("seeds the XR camera once immediately during onSessionStart when the observable is absent (R11.1, R11.2)", async () => {
        const arcY = 4.75;
        const { controller, camera, experience } = makeController({ withPoseObservable: false, arcY });

        await startSession(controller, experience);

        const xr = xrCam(experience);
        // The fallback seeds immediately during onSessionStart (session already live).
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledWith(camera, true);
        expect(xr.position.y).toBe(arcY);
    });

    it("does not register an extra observer to leak in the fallback path (no pose observable, no double state observer)", async () => {
        const { controller, experience } = makeController({ withPoseObservable: false });

        await startSession(controller, experience);

        // No pose observable exists, so nothing was added there.
        expect(experience.baseExperience.onInitialXRPoseSetObservable).toBeUndefined();
        // The state observer count stays at exactly one (no extra state observer registered).
        expect(experience.baseExperience.onStateChangedObservable.observers.length).toBe(1);

        // Session end does not throw and does not re-seed.
        const xr = xrCam(experience);
        const seedCalls = xr.setTransformationFromNonVRCamera.mock.calls.length;
        fireNotInXR(experience);
        expect(xr.setTransformationFromNonVRCamera.mock.calls.length).toBe(seedCalls);
    });
});

// ---------------------------------------------------------------------------
// Guarding: hook access never throws under odd mocks (D9)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - initial-pose hook is guarded (never throws)", () => {
    it("does not throw when the XR camera lacks setTransformationFromNonVRCamera / position", async () => {
        const { controller, experience } = makeController();
        // Replace the camera with an odd shape after enable adopted the good one.
        (experience.baseExperience as any).camera = { __kind: "oddCamera" };
        // Re-enable so the controller adopts the odd camera.
        await controller.enable(experience as any);
        await controller.enter("vr");

        // onSessionStart (pose hook registration) must not throw.
        expect(() => fireInXR(experience)).not.toThrow();
        // Firing the pose must not throw even though the camera is mis-shaped.
        expect(() => poseObs(experience).fire()).not.toThrow();
    });

    it("does not throw when onInitialXRPoseSetObservable is a non-observable shape (missing add)", async () => {
        const { controller, experience } = makeController();
        (experience.baseExperience as any).onInitialXRPoseSetObservable = { notAdd: true };
        await controller.enable(experience as any);
        await controller.enter("vr");

        // Registration falls back to an immediate one-shot seed and never throws.
        expect(() => fireInXR(experience)).not.toThrow();
        // The odd observable was not treated as addable.
        const xr = xrCam(experience);
        // Fallback seeded once via the immediate path.
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
    });

    it("does not throw when the arc camera position is missing (arc-Y re-apply guarded)", async () => {
        const { controller, camera, experience } = makeController();
        (camera as any).position = undefined;
        await controller.enable(experience as any);
        await controller.enter("vr");
        fireInXR(experience);

        const xr = xrCam(experience);
        expect(() => poseObs(experience).fire()).not.toThrow();
        // Mirror still applied; arc-Y defaults to 0 when arc position is absent.
        expect(xr.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
        expect(xr.position.y).toBe(0);
    });
});
