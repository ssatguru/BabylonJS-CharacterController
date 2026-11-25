import { describe, it, expect, vi, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";
import { deriveArcAngles } from "../src/xr/XROrientationSync";

/**
 * Feature: xr-first-person-camera-sync - unit tests for the per-frame XR -> arc
 * orientation sync that REPLACES the legacy arc -> XR follow mirror. Example-
 * based vitest unit tests run entirely against mocks - no real BabylonJS scene,
 * no headset.
 *
 * The orientation coupling direction was intentionally reversed by the
 * `xr-first-person-camera-sync` spec. While XR_First_Person_Coupling holds
 * (`isInXR() && canFirstPerson() && cc.isInFirstPerson()`), the rendered
 * `WebXRCamera` is the SOURCE and the owned `ArcRotateCamera` is the SINK: the
 * render observer reads the headset yaw/pitch and drives the arc camera's
 * `alpha`/`beta` (via the pure `deriveArcAngles` helper). This supersedes the
 * old per-frame `_updateXRCameraFollow()` mirror (arc -> XR full transform) and
 * its D10 entry-blend glide, which are no longer invoked per frame.
 *
 * The sync lives in the PRIVATE `_syncArcFromXRCamera()` and is driven per-frame
 * by the render observer registered in `startStickSampler()`. That observer runs
 * `sampleSticks()` FIRST, then `_syncArcFromXRCamera()` (R5.3), then the ray
 * retry. Tests fire the observer via the fake `onBeforeRenderObservable` (whose
 * `.add` returns the callback itself, so the returned token IS the per-frame
 * closure), matching the internal-seam testing convention used by the other
 * XRController tests. Session lifecycle is driven by firing the `WebXRState`
 * observer to IN_XR / NOT_IN_XR.
 *
 * Behavior covered:
 *  - XR -> arc: while coupling holds, arc `alpha`/`beta` are driven from the
 *    headset pose each frame (R1.1, R1.2, R2.1, R2.2, R2.3).
 *  - Ordering: `sampleSticks()` runs before `_syncArcFromXRCamera()` (R5.3).
 *  - Coupling gate: while first person is inactive the arc is left unchanged
 *    (R4.2).
 *  - The per-frame render observer is detached on session exit (R6.1 teardown).
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * A minimal fake of a BabylonJS Observable: records added observers, supports
 * removal, and lets the test fire a value at every current observer. Matches
 * the `.add` / `.remove` surface XRController touches. The `.add` token is the
 * callback itself (opaque to the SUT), so firing calls the stored closures.
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
 * A fake WebXRCamera exposing the orientation surface the SUT reads: a
 * `rotationQuaternion` whose `toEulerAngles()` returns the mocked head pose
 * (Euler `{ x: pitch, y: yaw, z: roll }`). `_readHeadsetOrientation` reads
 * `euler.y` (yaw) and `euler.x` (pitch). Setting `orientation` updates what the
 * next `toEulerAngles()` call returns, so a test can move the head between
 * frames. `position` is retained (harmless) for parity with the real camera.
 */
function makeFakeXRCamera(orientation: { yaw: number; pitch: number } = { yaw: 0, pitch: 0 }) {
    const cam = {
        __kind: "WebXRCamera",
        position: { x: 0, y: 0, z: 0 },
        // Mutable head pose the test drives; toEulerAngles reflects it live.
        orientation: { yaw: orientation.yaw, pitch: orientation.pitch },
        // The orientation surface the XR->arc sync reads: a rotationQuaternion
        // whose toEulerAngles() returns the mocked head pose (Euler
        // { x: pitch, y: yaw, z: roll }). _readHeadsetOrientation reads euler.y
        // (yaw) and euler.x (pitch).
        rotationQuaternion: {
            toEulerAngles: vi.fn(() => ({ x: cam.orientation.pitch, y: cam.orientation.yaw, z: 0 })),
        },
    };
    return cam;
}

/**
 * A fake ArcRotateCamera exposing the orientation sink the SUT writes
 * (`alpha`/`beta`) plus the beta-limit fields `_resolveBetaLimits` reads and the
 * orbit/dolly surface the guarded per-frame sampler may touch. Defaults leave
 * the orbit/dolly and beta limits absent so the sampler never throws and the
 * pole-avoiding fallback beta range applies.
 */
function makeFakeArcCamera(initial: { alpha: number; beta: number } = { alpha: 0, beta: 1 }) {
    return {
        __kind: "ArcRotateCamera",
        position: { x: 0, y: 0, z: 0 },
        alpha: initial.alpha,
        beta: initial.beta,
        radius: 10,
        lowerBetaLimit: null as number | null,
        upperBetaLimit: null as number | null,
        lowerRadiusLimit: null as number | null,
        upperRadiusLimit: null as number | null,
        attachControl: vi.fn(),
        computeWorldMatrix: vi.fn(),
    };
}

/**
 * A fake CharacterController. `isInFirstPerson()` gates the XR_First_Person
 * coupling; default true so the sync is active. `getSettings().noFirstPerson`
 * drives `canFirstPerson()` (false -> first person permitted).
 */
function makeFakeCC(opts?: { noFirstPerson?: boolean; inFirstPerson?: boolean }) {
    const inFP = opts?.inFirstPerson ?? true;
    return {
        jump: vi.fn(),
        walk: vi.fn(),
        run: vi.fn(),
        walkBack: vi.fn(),
        walkBackFast: vi.fn(),
        strafeLeft: vi.fn(),
        strafeLeftFast: vi.fn(),
        strafeRight: vi.fn(),
        strafeRightFast: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson: opts?.noFirstPerson ?? false })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
        isInFirstPerson: vi.fn(() => inFP),
    };
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
 * Build an XRController wired to fresh fakes and enabled by adopting a provided
 * experience whose `baseExperience.camera` is the fake XR camera. Enabling by
 * adoption registers the `WebXRState` observer so firing IN_XR drives
 * `onSessionStart` (which starts the render observer).
 */
async function makeEnabledController(opts?: {
    arcInitial?: { alpha: number; beta: number };
    headset?: { yaw: number; pitch: number };
    cc?: ReturnType<typeof makeFakeCC>;
}) {
    const cc = opts?.cc ?? makeFakeCC();
    const arc = makeFakeArcCamera(opts?.arcInitial);
    const scene = makeFakeScene();
    const xrCamera = makeFakeXRCamera(opts?.headset);
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

/** Fire the state observer to start / end a session. */
function fireInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.IN_XR);
}
function fireNotInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.NOT_IN_XR);
}

/** Fire every registered per-frame render observer once (one render frame). */
function fireRenderFrame(scene: { onBeforeRenderObservable: FakeObservable<void> }): void {
    scene.onBeforeRenderObservable.fire(undefined as unknown as void);
}

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// XR -> arc orientation sync while coupling holds (R1.1, R1.2, R2.1, R2.2, R2.3)
// ---------------------------------------------------------------------------

describe("Feature: xr-first-person-camera-sync - headset drives the arc camera each render frame (R1, R2)", () => {
    it("assigns arc alpha/beta from the headset pose every render frame while coupling holds", async () => {
        const headset = { yaw: 0.7, pitch: 0.2 };
        const { arc, scene, experience } = await makeEnabledController({
            arcInitial: { alpha: 0, beta: 1 },
            headset,
        });
        fireInXR(experience);

        fireRenderFrame(scene);

        // The arc is the SINK: alpha/beta reflect the pure derivation from the
        // headset pose (fallback beta limits apply, so beta is in range).
        const expected = deriveArcAngles(headset, { lower: 0.05, upper: Math.PI - 0.05 });
        expect(arc.alpha).toBeCloseTo(expected.alpha, 10);
        expect(arc.beta).toBeCloseTo(expected.beta, 10);
    });

    it("re-derives the arc orientation on the same frame the headset pose changes", async () => {
        const { arc, scene, xrCamera, experience } = await makeEnabledController({
            arcInitial: { alpha: 0, beta: 1 },
            headset: { yaw: 0.1, pitch: 0.1 },
        });
        fireInXR(experience);

        fireRenderFrame(scene);
        const first = deriveArcAngles({ yaw: 0.1, pitch: 0.1 }, { lower: 0.05, upper: Math.PI - 0.05 });
        expect(arc.alpha).toBeCloseTo(first.alpha, 10);
        expect(arc.beta).toBeCloseTo(first.beta, 10);

        // Move the head; the next frame reflects the new pose.
        xrCamera.orientation.yaw = -1.2;
        xrCamera.orientation.pitch = 0.5;
        fireRenderFrame(scene);
        const second = deriveArcAngles({ yaw: -1.2, pitch: 0.5 }, { lower: 0.05, upper: Math.PI - 0.05 });
        expect(arc.alpha).toBeCloseTo(second.alpha, 10);
        expect(arc.beta).toBeCloseTo(second.beta, 10);
    });

    it("runs the sync unconditionally every frame while coupling holds", async () => {
        const { xrCamera, scene, experience } = await makeEnabledController({
            headset: { yaw: 0.3, pitch: 0.0 },
        });
        fireInXR(experience);

        // Reading the headset each frame proves the sync executed each frame.
        xrCamera.rotationQuaternion.toEulerAngles.mockClear();
        fireRenderFrame(scene);
        fireRenderFrame(scene);
        fireRenderFrame(scene);

        expect(xrCamera.rotationQuaternion.toEulerAngles).toHaveBeenCalledTimes(3);
    });
});

// ---------------------------------------------------------------------------
// Coupling gate - arc unchanged when first person is inactive (R4.2)
// ---------------------------------------------------------------------------

describe("Feature: xr-first-person-camera-sync - coupling gate leaves the arc unchanged when first person is inactive (R4.2)", () => {
    it("does not touch arc alpha/beta while the controller is not in first person", async () => {
        const cc = makeFakeCC({ inFirstPerson: false });
        const { arc, scene, experience } = await makeEnabledController({
            arcInitial: { alpha: 1.5, beta: 0.9 },
            headset: { yaw: 0.7, pitch: 0.2 },
            cc,
        });
        fireInXR(experience);

        fireRenderFrame(scene);

        // Coupling is false (isInFirstPerson() === false) -> arc left as-is.
        expect(arc.alpha).toBe(1.5);
        expect(arc.beta).toBe(0.9);
    });
});

// ---------------------------------------------------------------------------
// Ordering - sampleSticks() before _syncArcFromXRCamera() (R5.3)
// ---------------------------------------------------------------------------

describe("Feature: xr-first-person-camera-sync - sync runs after stick sampling (R5.3)", () => {
    it("invokes sampleSticks() before _syncArcFromXRCamera() within the render observer", async () => {
        const { controller, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        // Record ordering by spying both stages after the observer is registered.
        const calls: string[] = [];
        const sampleSpy = vi
            .spyOn(controller as any, "sampleSticks")
            .mockImplementation(() => calls.push("sampleSticks"));
        const syncSpy = vi
            .spyOn(controller as any, "_syncArcFromXRCamera")
            .mockImplementation(() => calls.push("syncArcFromXRCamera"));

        fireRenderFrame(scene);

        expect(sampleSpy).toHaveBeenCalledTimes(1);
        expect(syncSpy).toHaveBeenCalledTimes(1);
        expect(calls).toEqual(["sampleSticks", "syncArcFromXRCamera"]);
    });
});

// ---------------------------------------------------------------------------
// Render observer detached on session exit (teardown; R6.1)
// ---------------------------------------------------------------------------

describe("Feature: xr-first-person-camera-sync - render observer detached on session exit", () => {
    it("removes the per-frame render observer on session end so no frames run after exit", async () => {
        const { arc, scene, experience } = await makeEnabledController({
            arcInitial: { alpha: 0, beta: 1 },
            headset: { yaw: 0.7, pitch: 0.2 },
        });
        fireInXR(experience);

        // A render observer is registered.
        expect(scene.onBeforeRenderObservable.observers.length).toBe(1);

        // End the session -> onSessionEnd -> _detachSessionObservers -> stopStickSampler.
        fireNotInXR(experience);

        expect(scene.onBeforeRenderObservable.remove).toHaveBeenCalled();
        expect(scene.onBeforeRenderObservable.observers.length).toBe(0);

        // Firing further frames does nothing: no observer is subscribed, so the
        // arc orientation is frozen at its last value.
        const frozenAlpha = arc.alpha;
        const frozenBeta = arc.beta;
        fireRenderFrame(scene);
        expect(arc.alpha).toBe(frozenAlpha);
        expect(arc.beta).toBe(frozenBeta);
    });
});

