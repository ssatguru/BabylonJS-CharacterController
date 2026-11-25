import { describe, it, expect, vi, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for XRController controller ray management
 * (spec task 15.2). Example-based vitest unit tests run entirely against mocks -
 * no real BabylonJS scene, no headset.
 *
 * Ray management (R13) hides the LEFT controller's Pointer_Selection laser ray +
 * selection ring (the left trigger is bound to jump) and RAISES the RIGHT
 * controller's ring + laser above other geometry (renderingGroupId = 2) so they
 * remain visible. The Pointer_Selection meshes may be created asynchronously
 * after a controller is added, so the hide (left) and raise (right) are retried
 * each render frame until they succeed, then latched (R13.3). When a session
 * ends, `resetRayState` clears the latches so the next session re-applies them
 * (R13.4).
 *
 * The per-controller ray/ring meshes are reachable only through the
 * pointer-selection feature's private `_controllers` map, resolved via
 * `featuresManager.getEnabledFeature(name)` with an `experience.pointerSelection`
 * fallback. A controller's entry is looked up by its `uniqueId` key first, then
 * by scanning entries for the one whose `.xrController` matches the controller.
 *
 * Requirements covered:
 *  - R13.1 a wired LEFT controller's laser + ring get isVisible=false and
 *    setEnabled(false).
 *  - R13.2 a wired RIGHT controller's ring + laser get renderingGroupId = 2.
 *  - R13.3 retry-until-present then stop: while the entry/meshes are absent the
 *    hide/raise return false and do NOT latch; once present they succeed and
 *    latch, and subsequent frames make no further changes.
 *  - R13.4 after session end, resetRayState clears the latches and remembered
 *    controllers so a fresh controller re-applies.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * A minimal fake of a BabylonJS Observable matching the `.add` / `.remove`
 * surface the SUT touches. The observer token IS the callback so tests can fire
 * events at whatever is currently subscribed.
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
 * A fake ray/ring mesh with the mutable fields the SUT reads/writes:
 * `isVisible`, `renderingGroupId`, and a `setEnabled` spy.
 */
function makeFakeMesh() {
    return {
        isVisible: true,
        renderingGroupId: 0,
        setEnabled: vi.fn(),
    };
}

/**
 * A fake motion controller (no button components needed for ray tests) that
 * reports handedness. `getComponent` returns null so the data-driven binders
 * wire nothing - ray management is driven purely by `_wireController` remembering
 * the controller by handedness.
 */
function makeFakeMotionController(handedness: "left" | "right") {
    return { handedness, getComponent: vi.fn(() => null), pulse: vi.fn(async () => undefined) };
}

/**
 * A fake WebXR controller wrapping a motion controller. Carries a `uniqueId`
 * (used as the pointer-selection `_controllers` map key) and its motion
 * controller is present immediately so `_onControllerAdded` wires synchronously.
 */
let uniqueIdCounter = 0;
function makeFakeController(handedness: "left" | "right", uniqueId?: string) {
    const motionController = makeFakeMotionController(handedness);
    const id = uniqueId ?? `ctrl-${handedness}-${uniqueIdCounter++}`;
    const controller = {
        uniqueId: id,
        motionController,
        inputSource: { handedness },
        onMotionControllerInitObservable: new FakeObservable<unknown>(),
    };
    return { controller, motionController, uniqueId: id };
}

/**
 * A fake pointer-selection feature exposing a private `_controllers` map keyed by
 * controller uniqueId. Each entry exposes `selectionMesh` and `laserPointer`
 * mesh fakes and an `xrController` back-reference (for the scan-fallback path).
 * `present(controller)` registers an entry; `absent(controller)` removes it. This
 * lets a test toggle meshes present/absent between frames to exercise R13.3.
 */
function makeFakePointerSelection() {
    const controllersMap: Record<string, { selectionMesh: ReturnType<typeof makeFakeMesh>; laserPointer: ReturnType<typeof makeFakeMesh>; xrController: unknown }> = {};

    return {
        feature: { _controllers: controllersMap },
        present(controller: { uniqueId: string }) {
            const entry = {
                selectionMesh: makeFakeMesh(),
                laserPointer: makeFakeMesh(),
                xrController: controller,
            };
            controllersMap[controller.uniqueId] = entry;
            return entry;
        },
        absent(controller: { uniqueId: string }) {
            delete controllersMap[controller.uniqueId];
        },
        entry(controller: { uniqueId: string }) {
            return controllersMap[controller.uniqueId];
        },
    };
}

function makeFakeCC(noFirstPerson = false) {
    return {
        jump: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
    };
}

function makeFakeArcCamera() {
    return { __kind: "ArcRotateCamera", attachControl: vi.fn(), radius: 10, computeWorldMatrix: vi.fn() };
}

function makeFakeScene() {
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
        onBeforeRenderObservable: { add: vi.fn((cb: unknown) => cb), remove: vi.fn(() => true) },
        createDefaultXRExperienceAsync: vi.fn(),
    };
}

/**
 * A fake WebXRDefaultExperience whose features manager resolves the
 * pointer-selection feature via `getEnabledFeature(name)`. Also supports the
 * `experience.pointerSelection` fallback (set `usePointerSelectionFallback` to
 * route resolution there instead of the features manager).
 */
function makeFakeExperience(pointerSelection: unknown, usePointerSelectionFallback = false) {
    const stateObservable = new FakeObservable<WebXRState>();
    const controllerAddedObservable = new FakeObservable<unknown>();
    return {
        experience: {
            baseExperience: {
                onStateChangedObservable: stateObservable,
                camera: { __kind: "WebXRCamera", setTransformationFromNonVRCamera: vi.fn(), position: { x: 0, y: 0, z: 0 } },
                featuresManager: {
                    disableFeature: vi.fn(),
                    getEnabledFeature: usePointerSelectionFallback ? vi.fn(() => null) : vi.fn(() => pointerSelection),
                },
                enterXRAsync: vi.fn(async () => ({})),
                exitXRAsync: vi.fn(async () => undefined),
            },
            pointerSelection: usePointerSelectionFallback ? pointerSelection : undefined,
            input: {
                controllers: [] as unknown[],
                onControllerAddedObservable: controllerAddedObservable,
            },
        },
        stateObservable,
        controllerAddedObservable,
    };
}

function makeController(noFirstPerson = false) {
    const cc = makeFakeCC(noFirstPerson);
    const camera = makeFakeArcCamera();
    const scene = makeFakeScene();
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene };
}

/** Set the private xr experience through the internal seam. */
function setExperience(controller: XRController, experience: unknown): void {
    (controller as any)._xrExperience = experience;
}

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R13.1 - LEFT controller ray + ring hidden
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - the LEFT controller's ray + ring are hidden (R13.1)", () => {
    it("wiring a left controller hides its laser + selection ring (isVisible=false, setEnabled(false))", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const left = makeFakeController("left");
        const entry = ps.present(left.controller); // meshes present up front

        (controller as any)._onControllerAdded(left.controller);

        expect(entry.selectionMesh.isVisible).toBe(false);
        expect(entry.selectionMesh.setEnabled).toHaveBeenCalledWith(false);
        expect(entry.laserPointer.isVisible).toBe(false);
        expect(entry.laserPointer.setEnabled).toHaveBeenCalledWith(false);
        // Latched once hidden.
        expect((controller as any)._leftRayHidden).toBe(true);
    });

    it("resolves the feature through the experience.pointerSelection fallback", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature, true); // fallback path
        setExperience(controller, experience);

        const left = makeFakeController("left");
        const entry = ps.present(left.controller);

        (controller as any)._onControllerAdded(left.controller);

        expect(entry.selectionMesh.isVisible).toBe(false);
        expect(entry.laserPointer.setEnabled).toHaveBeenCalledWith(false);
    });

    it("finds the controller entry via the xrController scan fallback when uniqueId is absent", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        // Register the entry under a different key so the uniqueId lookup misses
        // and the scan-by-xrController fallback must find it.
        const left = makeFakeController("left", "left-id");
        const entry = { selectionMesh: makeFakeMesh(), laserPointer: makeFakeMesh(), xrController: left.controller };
        (ps.feature._controllers as Record<string, unknown>)["some-other-key"] = entry;

        (controller as any)._onControllerAdded(left.controller);

        expect(entry.selectionMesh.isVisible).toBe(false);
        expect(entry.laserPointer.isVisible).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// R13.2 - RIGHT controller ring + laser raised to renderingGroupId = 2
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - the RIGHT controller's ring + laser are raised (R13.2)", () => {
    it("wiring a right controller sets its ring + laser renderingGroupId to 2", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const right = makeFakeController("right");
        const entry = ps.present(right.controller);

        (controller as any)._onControllerAdded(right.controller);

        expect(entry.selectionMesh.renderingGroupId).toBe(2);
        expect(entry.laserPointer.renderingGroupId).toBe(2);
        expect((controller as any)._rightRingRaised).toBe(true);
    });

    it("does NOT hide the right controller meshes (raise only)", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const right = makeFakeController("right");
        const entry = ps.present(right.controller);

        (controller as any)._onControllerAdded(right.controller);

        // Raise does not disable/hide the meshes.
        expect(entry.selectionMesh.setEnabled).not.toHaveBeenCalled();
        expect(entry.selectionMesh.isVisible).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// R13.3 - retry-until-present then stop (latch)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - hide/raise retry until present, then latch and stop (R13.3)", () => {
    it("left-ray hide does not latch while the entry/meshes are absent, then latches once present", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const left = makeFakeController("left");

        // Frame 0: controller added but no pointer-selection entry yet -> absent.
        (controller as any)._onControllerAdded(left.controller);
        expect((controller as any)._leftRayHidden).toBe(false);

        // A couple of retry frames with the entry still absent -> still no latch.
        (controller as any)._retryRayManagement();
        (controller as any)._retryRayManagement();
        expect((controller as any)._leftRayHidden).toBe(false);

        // Later frame: the async Pointer_Selection meshes appear.
        const entry = ps.present(left.controller);
        (controller as any)._retryRayManagement();

        expect(entry.selectionMesh.isVisible).toBe(false);
        expect(entry.laserPointer.isVisible).toBe(false);
        expect((controller as any)._leftRayHidden).toBe(true);
    });

    it("once the left ray is latched hidden, later frames make no further setEnabled calls", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const left = makeFakeController("left");
        const entry = ps.present(left.controller);

        (controller as any)._onControllerAdded(left.controller); // latches this frame
        expect((controller as any)._leftRayHidden).toBe(true);

        const callsAfterLatch = entry.selectionMesh.setEnabled.mock.calls.length;

        // Subsequent frames must not touch the meshes again.
        (controller as any)._retryRayManagement();
        (controller as any)._retryRayManagement();

        expect(entry.selectionMesh.setEnabled.mock.calls.length).toBe(callsAfterLatch);
    });

    it("right-ring raise retries while absent then latches once present, and stops thereafter", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const right = makeFakeController("right");

        // Absent on the first frames.
        (controller as any)._onControllerAdded(right.controller);
        (controller as any)._retryRayManagement();
        expect((controller as any)._rightRingRaised).toBe(false);

        // Present now -> raises + latches.
        const entry = ps.present(right.controller);
        (controller as any)._retryRayManagement();
        expect(entry.selectionMesh.renderingGroupId).toBe(2);
        expect((controller as any)._rightRingRaised).toBe(true);

        // Mutate the mesh group and confirm a later frame does NOT re-raise it
        // (proving the latch stops further work).
        entry.selectionMesh.renderingGroupId = 99;
        (controller as any)._retryRayManagement();
        expect(entry.selectionMesh.renderingGroupId).toBe(99);
    });
});

// ---------------------------------------------------------------------------
// R13.4 - resetRayState clears latches on session end
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - resetRayState clears the latches on session end (R13.4)", () => {
    it("clears both latch flags and both remembered controllers", () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience } = makeFakeExperience(ps.feature);
        setExperience(controller, experience);

        const left = makeFakeController("left");
        const right = makeFakeController("right");
        ps.present(left.controller);
        ps.present(right.controller);

        (controller as any)._onControllerAdded(left.controller);
        (controller as any)._onControllerAdded(right.controller);

        expect((controller as any)._leftRayHidden).toBe(true);
        expect((controller as any)._rightRingRaised).toBe(true);
        expect((controller as any)._leftControllerForRay).not.toBeNull();
        expect((controller as any)._rightControllerForRay).not.toBeNull();

        controller.resetRayState();

        expect((controller as any)._leftRayHidden).toBe(false);
        expect((controller as any)._rightRingRaised).toBe(false);
        expect((controller as any)._leftControllerForRay).toBeNull();
        expect((controller as any)._rightControllerForRay).toBeNull();
    });

    it("session end (NOT_IN_XR) resets the latches so a fresh controller re-applies", async () => {
        const { controller } = makeController();
        const ps = makeFakePointerSelection();
        const { experience, stateObservable } = makeFakeExperience(ps.feature);

        await controller.enable(experience as any);
        stateObservable.fire(WebXRState.IN_XR);

        // A left controller is added and its ray is hidden + latched.
        const left = makeFakeController("left");
        ps.present(left.controller);
        (experience.input.onControllerAddedObservable as FakeObservable<unknown>).fire(left.controller);
        expect((controller as any)._leftRayHidden).toBe(true);

        // Session ends -> teardown resets the ray latch state (R13.4).
        stateObservable.fire(WebXRState.NOT_IN_XR);
        expect((controller as any)._leftRayHidden).toBe(false);
        expect((controller as any)._leftControllerForRay).toBeNull();

        // A new session re-applies: re-enter and add a fresh left controller.
        stateObservable.fire(WebXRState.IN_XR);
        const left2 = makeFakeController("left");
        const entry2 = ps.present(left2.controller);
        (experience.input.onControllerAddedObservable as FakeObservable<unknown>).fire(left2.controller);

        expect(entry2.selectionMesh.isVisible).toBe(false);
        expect((controller as any)._leftRayHidden).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Guarding - never throws when the feature/map/meshes are missing
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - ray management is fully guarded (D9)", () => {
    it("never throws when there is no experience / pointer-selection feature", () => {
        const { controller } = makeController();
        const left = makeFakeController("left");

        expect(() => controller.rememberLeftControllerAndHideRay(left.controller)).not.toThrow();
        expect(() => controller.retryHideLeftControllerRay()).not.toThrow();
        expect(() => controller.retryRaiseRightSelectionRing()).not.toThrow();
        // No feature -> hide/raise report failure (no latch).
        expect((controller as any)._leftRayHidden).toBe(false);
    });

    it("hideLeftControllerRay returns false with no remembered controller", () => {
        const { controller } = makeController();
        expect(controller.hideLeftControllerRay()).toBe(false);
    });

    it("raiseRightSelectionRingRenderingGroup returns false with no remembered controller", () => {
        const { controller } = makeController();
        expect(controller.raiseRightSelectionRingRenderingGroup()).toBe(false);
    });
});
