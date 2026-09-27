import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for the XR camera follow + entry-blend
 * glide (spec task 12.2). Example-based vitest unit tests run entirely against
 * mocks - no real BabylonJS scene, no headset.
 *
 * Per frame, `_updateXRCameraFollow()` mirrors the Follow_Camera (the owned
 * `ArcRotateCamera`) transform onto the rendered `WebXRCamera` via
 * `setTransformationFromNonVRCamera(arcCamera, true)`, then copies the arc
 * camera's Y onto the XR camera Y (the mirror zeroes the XR camera position.y,
 * so re-applying the arc Y preserves beta-driven camera height). It runs
 * UNCONDITIONALLY each frame, AFTER stick sampling, and its render observer is
 * detached on session end.
 *
 * The follow update lives in the PRIVATE `_updateXRCameraFollow()` and is driven
 * per-frame by the render observer registered in `startStickSampler()`. Tests
 * fire that observer via the fake `onBeforeRenderObservable` (whose `.add`
 * returns the callback itself, so the returned token IS the per-frame closure),
 * matching the internal-seam testing convention used by the other XRController
 * tests. Session lifecycle is driven the way the lifecycle test drives it: fire
 * the `WebXRState` observer to IN_XR / NOT_IN_XR.
 *
 * Requirements covered:
 *  - R11.1 per frame `setTransformationFromNonVRCamera(arcCamera, true)`.
 *  - R11.2 the arc camera's Y is copied onto the XR camera Y after the mirror.
 *  - R11.3 the follow update runs AFTER stick sampling in the render observer.
 *  - R11.4 the per-frame render observer is detached on session exit.
 *  - Entry-blend ease decays monotonically to zero over ENTRY_BLEND_FRAMES: the
 *    XR camera position converges to the live follow target and the offset
 *    contribution is monotonic non-increasing, ending at zero.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// The number of blend frames must mirror the ENTRY_BLEND_FRAMES constant in
// XRController (design D10, default 90). It is a private module constant, so it
// is duplicated here intentionally.
const ENTRY_BLEND_FRAMES = 90;

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
 * A fake WebXRCamera exposing the follow surface the SUT touches: a spied
 * `setTransformationFromNonVRCamera` and a mutable `position`.
 *
 * The spy mimics the real mirror contract closely enough for the follow logic:
 * it copies the arc camera's X/Z onto the XR camera position and FORCES the XR
 * camera position.y to zero (the real `setTransformationFromNonVRCamera`
 * measures head pose from the reference-space floor and drops the arc Y). The
 * SUT then re-applies the arc Y in `_updateXRCameraFollow`, which these tests
 * assert.
 */
function makeFakeXRCamera(initial: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }) {
    const cam = {
        __kind: "WebXRCamera",
        position: { x: initial.x, y: initial.y, z: initial.z },
        setTransformationFromNonVRCamera: vi.fn((camera: unknown, _resetToBase?: boolean) => {
            // Mirror the arc camera X/Z onto the XR camera and zero the Y, as the
            // real WebXR mirror does (floor-relative head pose).
            const arc = camera as { position?: { x?: number; y?: number; z?: number } } | null;
            if (arc?.position != null) {
                if (typeof arc.position.x === "number") {
                    cam.position.x = arc.position.x;
                }
                if (typeof arc.position.z === "number") {
                    cam.position.z = arc.position.z;
                }
            }
            cam.position.y = 0;
        }),
    };
    return cam;
}

/**
 * A fake ArcRotateCamera exposing the follow surface: a mutable `position`
 * (its Y is the beta-driven camera height the SUT re-applies) plus the
 * orbit/dolly surface the guarded per-frame sampler may touch. Defaults leave
 * the orbit/dolly limits absent so the sampler never throws.
 */
function makeFakeArcCamera(position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }) {
    return {
        __kind: "ArcRotateCamera",
        position: { x: position.x, y: position.y, z: position.z },
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

function makeFakeCC(noFirstPerson = false) {
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
        getSettings: vi.fn(() => ({ noFirstPerson })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
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
 * `onSessionStart` (which seeds the entry blend and starts the render observer).
 */
async function makeEnabledController(opts?: {
    arcPosition?: { x: number; y: number; z: number };
    xrInitial?: { x: number; y: number; z: number };
}) {
    const cc = makeFakeCC();
    const arc = makeFakeArcCamera(opts?.arcPosition);
    const scene = makeFakeScene();
    const xrCamera = makeFakeXRCamera(opts?.xrInitial);
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
// R11.1 / R11.2 - per-frame mirror then arc-Y copy
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - follow mirrors the arc camera then re-applies its Y (R11.1, R11.2)", () => {
    it("calls setTransformationFromNonVRCamera(arcCamera, true) each render frame (R11.1)", async () => {
        const { arc, scene, xrCamera, experience } = await makeEnabledController();
        fireInXR(experience);

        // The initial-pose fallback (onSessionStart -> _registerInitialPoseHook)
        // seeds once because the fake experience exposes no
        // onInitialXRPoseSetObservable; reset so we count only render-frame calls.
        xrCamera.setTransformationFromNonVRCamera.mockClear();

        fireRenderFrame(scene);

        expect(xrCamera.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(1);
        expect(xrCamera.setTransformationFromNonVRCamera).toHaveBeenCalledWith(arc, true);
    });

    it("re-applies the arc camera's Y onto the XR camera Y after the mirror zeroes it (R11.2)", async () => {
        // arc.position.y is the beta-driven camera height the mirror drops.
        const arcY = 4.25;
        const { scene, xrCamera, experience } = await makeEnabledController({
            arcPosition: { x: 1, y: arcY, z: -2 },
        });
        fireInXR(experience);

        // Run the full blend to inert so the entry-blend offset contributes zero
        // and the XR camera Y equals the live follow target Y (the arc Y).
        for (let i = 0; i < ENTRY_BLEND_FRAMES; i++) {
            fireRenderFrame(scene);
        }

        // The mirror set position.y = 0; the SUT re-applied the arc Y.
        expect(xrCamera.position.y).toBeCloseTo(arcY, 10);
        // X/Z track the arc camera's follow position.
        expect(xrCamera.position.x).toBeCloseTo(1, 10);
        expect(xrCamera.position.z).toBeCloseTo(-2, 10);
    });

    it("runs unconditionally every frame (mirror called once per frame)", async () => {
        const { scene, xrCamera, experience } = await makeEnabledController();
        fireInXR(experience);
        xrCamera.setTransformationFromNonVRCamera.mockClear();

        fireRenderFrame(scene);
        fireRenderFrame(scene);
        fireRenderFrame(scene);

        expect(xrCamera.setTransformationFromNonVRCamera).toHaveBeenCalledTimes(3);
    });
});

// ---------------------------------------------------------------------------
// R11.3 - follow runs AFTER stick sampling
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - follow update runs after stick sampling (R11.3)", () => {
    it("invokes sampleSticks() before _updateXRCameraFollow() within the render observer", async () => {
        const { controller, scene, experience } = await makeEnabledController();
        fireInXR(experience);

        // Record ordering by spying both stages after the observer is registered.
        const calls: string[] = [];
        const sampleSpy = vi
            .spyOn(controller as any, "sampleSticks")
            .mockImplementation(() => calls.push("sampleSticks"));
        const followSpy = vi
            .spyOn(controller as any, "_updateXRCameraFollow")
            .mockImplementation(() => calls.push("updateXRCameraFollow"));

        fireRenderFrame(scene);

        expect(sampleSpy).toHaveBeenCalledTimes(1);
        expect(followSpy).toHaveBeenCalledTimes(1);
        expect(calls).toEqual(["sampleSticks", "updateXRCameraFollow"]);
    });
});

// ---------------------------------------------------------------------------
// R11.4 - render observer detached on session exit
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - render observer detached on session exit (R11.4)", () => {
    it("removes the per-frame render observer on session end so no frames run after exit", async () => {
        const { scene, xrCamera, experience } = await makeEnabledController();
        fireInXR(experience);

        // A render observer is registered.
        expect(scene.onBeforeRenderObservable.observers.length).toBe(1);

        // End the session -> onSessionEnd -> _detachSessionObservers -> stopStickSampler.
        fireNotInXR(experience);

        expect(scene.onBeforeRenderObservable.remove).toHaveBeenCalled();
        expect(scene.onBeforeRenderObservable.observers.length).toBe(0);

        // Firing further frames does nothing: no observer is subscribed.
        xrCamera.setTransformationFromNonVRCamera.mockClear();
        fireRenderFrame(scene);
        expect(xrCamera.setTransformationFromNonVRCamera).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Entry-blend glide - monotonic decay to zero over ENTRY_BLEND_FRAMES
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - entry-blend ease decays monotonically to zero (D10)", () => {
    it("converges the XR camera to the live follow target and the offset contribution is monotonic non-increasing, ending at zero", async () => {
        // Follow target: arc X/Z + arc Y (beta height). Fixed across the blend.
        const arcPosition = { x: 3, y: 5, z: -1 };
        const targetX = arcPosition.x;
        const targetY = arcPosition.y;
        const targetZ = arcPosition.z;

        // Seed the XR camera OFF the follow target so the entry-blend captures a
        // non-zero offset on the first blend frame (offset = on-entry XR pos -
        // live target). This exercises the glide's decay directly rather than the
        // near-zero offset the initial-pose seed would produce.
        const xrInitial = { x: targetX + 10, y: targetY + 6, z: targetZ - 4 };

        const { controller, scene, xrCamera, experience } = await makeEnabledController({ arcPosition, xrInitial });

        // Prevent the initial-pose fallback seed from overwriting the off-target
        // start pose before the first render frame captures the offset.
        vi.spyOn(controller as any, "_seedXRCameraOntoFollowPose").mockImplementation(() => {
            /* keep the off-target xrInitial pose */
        });

        fireInXR(experience);

        // The euclidean distance from the live target measures the offset
        // contribution (offset * ease). Record it after each blend frame.
        const distances: number[] = [];
        const distanceFromTarget = () => {
            const dx = xrCamera.position.x - targetX;
            const dy = xrCamera.position.y - targetY;
            const dz = xrCamera.position.z - targetZ;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        };

        for (let i = 0; i < ENTRY_BLEND_FRAMES; i++) {
            fireRenderFrame(scene);
            distances.push(distanceFromTarget());
        }

        // Monotonic NON-INCREASING: each frame's offset contribution is <= the
        // previous frame's (the ease decays across the blend).
        for (let i = 1; i < distances.length; i++) {
            expect(distances[i]).toBeLessThanOrEqual(distances[i - 1] + 1e-9);
        }

        // The blend actually decayed (started off-target, moved toward the target).
        expect(distances[0]).toBeGreaterThan(0);

        // Ends at zero contribution: the final blend frame lands exactly on the
        // live follow target (ease at the last frame is smoothstep(0) = 0).
        expect(distances[distances.length - 1]).toBeCloseTo(0, 9);
        expect(xrCamera.position.x).toBeCloseTo(targetX, 9);
        expect(xrCamera.position.y).toBeCloseTo(targetY, 9);
        expect(xrCamera.position.z).toBeCloseTo(targetZ, 9);
    });

    it("stays inert once the blend completes: the XR camera tracks the live follow target on later frames", async () => {
        const arcPosition = { x: 2, y: 3, z: 2 };
        const { arc, scene, xrCamera, experience } = await makeEnabledController({
            arcPosition,
            xrInitial: { x: 50, y: 50, z: 50 },
        });
        fireInXR(experience);

        // Run past the blend so the glide is inert.
        for (let i = 0; i < ENTRY_BLEND_FRAMES + 5; i++) {
            fireRenderFrame(scene);
        }
        expect(xrCamera.position.x).toBeCloseTo(arcPosition.x, 9);
        expect(xrCamera.position.y).toBeCloseTo(arcPosition.y, 9);
        expect(xrCamera.position.z).toBeCloseTo(arcPosition.z, 9);

        // Move the avatar / follow camera; a later frame must track it exactly
        // (no residual entry-blend offset once the glide is inert).
        arc.position.x = 9;
        arc.position.y = 7;
        arc.position.z = -3;
        fireRenderFrame(scene);

        expect(xrCamera.position.x).toBeCloseTo(9, 9);
        expect(xrCamera.position.y).toBeCloseTo(7, 9);
        expect(xrCamera.position.z).toBeCloseTo(-3, 9);
    });
});
