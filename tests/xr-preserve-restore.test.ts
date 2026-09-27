import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";
import { XR_COMPONENT_THUMBSTICK, XR_COMPONENT_TRIGGER } from "../src/xr/XRInputMapping";

/**
 * Feature: webxr-support - unit tests for XRController desktop preserve/restore,
 * per-session observer teardown, and movement/animation consistency (spec task
 * 17.2). Example-based vitest unit tests run entirely against mocks - no real
 * BabylonJS scene, no headset.
 *
 * Task 17.1 finalized the named preserve/restore + teardown surface on
 * XRController:
 *  - `disableDesktopController()` / `restoreDesktopController()`: keep the
 *    CharacterController RUNNING (never stop it), disable only its keyboard on
 *    session start, and restore the recorded keyboard-enabled + running state on
 *    session end (`ccKeyboardEnabled` / `ccStarted`).
 *  - `restoreArcRotateMode()`: re-activate the owned ArcRotateCamera as the
 *    rendered camera and re-attach its controls.
 *  - `detachSessionObservers()`: tear down all per-session observers
 *    (controller-added, motion-controller-init, toggle-button, trigger-button,
 *    render) plus the one-shot initial-pose hook, and reset ray state; the right
 *    B/A dolly captures are cleared on exit by `_clearSessionCaptures`.
 *
 * Lifecycle is driven the way the other XRController tests drive it: enable by
 * adopting a provided fake experience, then fire the `WebXRState` observer to
 * IN_XR / NOT_IN_XR. detectXRSupport() is mocked so support probing is a no-op.
 *
 * Requirements covered:
 *  - R15.1 session start disables ONLY the keyboard while the CC keeps running
 *    (cc.stop is never called); the prior keyboard-enabled state is recorded.
 *  - R15.2 session end restores the recorded keyboard-enabled + running state.
 *  - R15.3 session end restores ArcRotate_Mode (activeCamera === arc camera,
 *    controls re-attached).
 *  - R15.4 across enter/exit cycles every per-session observable's add count
 *    equals its remove count - no handler accumulation.
 *  - R15.5 collision handling, slope limits, and animation behavior are left
 *    untouched (no such CC API is ever called by XRController).
 *  - R17.1 / R17.2 XR movement routes through the existing CharacterController
 *    movement methods (moveWithCollisions/action-driven path), e.g. a forward
 *    stick calls cc.walk rather than moving the mesh directly.
 *  - R17.3 a jump is issued via cc.jump() (the action-driven jump that resets
 *    movement action state) - XRController delegates rather than manipulating
 *    movement state itself.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * A minimal fake of a BabylonJS Observable that COUNTS `.add` and `.remove`
 * calls (via vitest spies) and lets the test fire a value at every current
 * observer. The observer token IS the callback (opaque to the SUT), so removal
 * matching add can be asserted precisely.
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
 * A fake thumbstick component exposing the surface the SUT reads: a live `axes`
 * value (read each frame by the sampler) and `pressed` (the fast-modifier),
 * plus an `onButtonStateChangedObservable` (unused by the stick path but kept
 * for shape parity).
 */
function makeFakeThumbstick() {
    return {
        axes: { x: 0, y: 0 },
        pressed: false,
        onButtonStateChangedObservable: new FakeObservable<{ pressed?: boolean }>(),
    };
}

/**
 * A fake trigger component whose `onButtonStateChangedObservable` the SUT
 * subscribes to for the rising-edge jump.
 */
function makeFakeTrigger() {
    const observable = new FakeObservable<{ pressed?: boolean }>();
    return {
        component: { onButtonStateChangedObservable: observable, pressed: false },
        observable,
        press(): void {
            observable.fire({ pressed: true });
        },
        release(): void {
            observable.fire({ pressed: false });
        },
    };
}

/**
 * A fake motion controller for a given hand. `getComponent(id)` returns the
 * thumbstick for the standard-thumbstick id and the trigger for the
 * standard-trigger id, else null. Exposes the thumbstick / trigger so tests can
 * drive axes and rising edges.
 */
function makeFakeMotionController(handedness: "left" | "right") {
    const thumbstick = makeFakeThumbstick();
    const trigger = makeFakeTrigger();
    const getComponent = vi.fn((id: string) => {
        if (id === XR_COMPONENT_THUMBSTICK) {
            return thumbstick;
        }
        if (id === XR_COMPONENT_TRIGGER) {
            return trigger.component;
        }
        return null;
    });
    return { motionController: { handedness, getComponent }, thumbstick, trigger, getComponent };
}

/**
 * A fake WebXR controller (input source) carrying a motion controller that is
 * already initialized, so `_onControllerAdded` wires it immediately.
 */
function makeFakeController(handedness: "left" | "right") {
    const mc = makeFakeMotionController(handedness);
    return {
        controller: { inputSource: { handedness }, motionController: mc.motionController },
        ...mc,
    };
}

/**
 * A fake CharacterController exposing the full movement + jump + settings +
 * keyboard surface XRController touches, PLUS spies for
 * collision/slope/animation-mutating APIs that XRController must NEVER call
 * (R15.5). `stop` is spied so the tests can assert the CC is never stopped.
 */
function makeFakeCC(noFirstPerson = false) {
    return {
        // Movement (moveWithCollisions/action-driven path).
        walk: vi.fn(),
        walkBack: vi.fn(),
        run: vi.fn(),
        walkBackFast: vi.fn(),
        strafeLeft: vi.fn(),
        strafeLeftFast: vi.fn(),
        strafeRight: vi.fn(),
        strafeRightFast: vi.fn(),
        jump: vi.fn(),
        // Camera coupling + keyboard + settings.
        setNoFirstPerson: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson })),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
        // Lifecycle - must NOT be called during an XR session (R15.1).
        stop: vi.fn(),
        start: vi.fn(),
        // Collision / slope / animation mutating APIs - must NOT be called by
        // XRController during enter/run/exit (R15.5). Present as spies so the
        // tests can assert they were never touched.
        setSlopeLimit: vi.fn(),
        setStepOffset: vi.fn(),
        setGravity: vi.fn(),
        setAnimationGroups: vi.fn(),
        setAnimationRanges: vi.fn(),
        setWalkAnim: vi.fn(),
        setIdleAnim: vi.fn(),
        enableBlending: vi.fn(),
        setCameraCollision: vi.fn(),
    };
}

/**
 * A fake ArcRotateCamera exposing the follow + restore surface: a mutable
 * `position`, orbit/dolly fields (so the guarded sampler never throws), and a
 * spied `attachControl` (asserted by the ArcRotate_Mode restore test).
 */
function makeFakeArcCamera() {
    return {
        __kind: "ArcRotateCamera",
        position: { x: 0, y: 2, z: 0 },
        alpha: 0,
        beta: 1,
        radius: 10,
        lowerBetaLimit: null as number | null,
        upperBetaLimit: null as number | null,
        lowerRadiusLimit: null as number | null,
        upperRadiusLimit: null as number | null,
        attachControl: vi.fn(),
        detachControl: vi.fn(),
        computeWorldMatrix: vi.fn(),
    };
}

/** A fake WebXR camera exposing the follow surface the SUT touches. */
function makeFakeXRCamera() {
    const cam = {
        __kind: "WebXRCamera",
        position: { x: 0, y: 0, z: 0 },
        setTransformationFromNonVRCamera: vi.fn((camera: unknown) => {
            const arc = camera as { position?: { x?: number; z?: number } } | null;
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

interface FakeInput {
    controllers: unknown[];
    onControllerAddedObservable: FakeObservable<unknown>;
}

interface FakeBaseExperience {
    onStateChangedObservable: FakeObservable<WebXRState>;
    camera: unknown;
    enterXRAsync: ReturnType<typeof vi.fn>;
    exitXRAsync: ReturnType<typeof vi.fn>;
    featuresManager: { disableFeature: ReturnType<typeof vi.fn> };
    onInitialXRPoseSetObservable: FakeObservable<void>;
}

interface FakeExperience {
    baseExperience: FakeBaseExperience;
    input: FakeInput;
}

function makeFakeExperience(xrCamera: unknown): FakeExperience {
    return {
        baseExperience: {
            onStateChangedObservable: new FakeObservable<WebXRState>(),
            camera: xrCamera,
            enterXRAsync: vi.fn(async () => ({})),
            exitXRAsync: vi.fn(async () => undefined),
            featuresManager: { disableFeature: vi.fn() },
            onInitialXRPoseSetObservable: new FakeObservable<void>(),
        },
        input: {
            controllers: [],
            onControllerAddedObservable: new FakeObservable<unknown>(),
        },
    };
}

function makeFakeScene() {
    const canvas = { __kind: "canvas" };
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => canvas) })),
        onBeforeRenderObservable: new FakeObservable<void>(),
        __canvas: canvas,
    };
}

/** Build an XRController enabled by adopting a provided fake experience. */
async function makeEnabledController(opts?: { noFirstPerson?: boolean }) {
    const cc = makeFakeCC(opts?.noFirstPerson ?? false);
    const arc = makeFakeArcCamera();
    const scene = makeFakeScene();
    const xrCamera = makeFakeXRCamera();
    const experience = makeFakeExperience(xrCamera);
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

beforeEach(() => {
    // Nothing to reset beyond per-test fakes; the mocked detectXRSupport is
    // fresh per import and cleared in afterEach.
});

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R15.1 / R15.2 - keyboard-only disable while running + restore
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - desktop preserve/restore keeps the CC running (R15.1, R15.2)", () => {
    it("disables only the keyboard on session start and never stops the CharacterController (R15.1)", async () => {
        const { controller, cc, experience } = await makeEnabledController();

        fireInXR(experience); // drives onSessionStart -> disableDesktopController()

        // Keyboard disabled...
        expect(cc.enableKeyBoard).toHaveBeenCalledWith(false);
        // ...while the CC is kept RUNNING (never stopped).
        expect(cc.stop).not.toHaveBeenCalled();
        expect(controller.isInXR()).toBe(true);
    });

    it("restores the prior keyboard-enabled state (true) on session end (R15.2)", async () => {
        const { controller, cc, experience } = await makeEnabledController();
        cc.isKeyBoardEnabled.mockReturnValue(true); // prior state = enabled

        fireInXR(experience);
        expect(cc.enableKeyBoard).toHaveBeenLastCalledWith(false);

        fireNotInXR(experience); // drives onSessionEnd -> restoreDesktopController()

        // The recorded prior value (true) is restored exactly.
        expect(cc.enableKeyBoard).toHaveBeenLastCalledWith(true);
        // The CC was never stopped, so it is never restarted.
        expect(cc.stop).not.toHaveBeenCalled();
        expect(cc.start).not.toHaveBeenCalled();
    });

    it("restores the prior keyboard-enabled state (false) on session end when it was disabled before (R15.2)", async () => {
        const { cc, experience } = await makeEnabledController();
        cc.isKeyBoardEnabled.mockReturnValue(false); // prior state = disabled

        fireInXR(experience);
        fireNotInXR(experience);

        // The recorded prior value (false) is restored exactly - not forced true.
        expect(cc.enableKeyBoard).toHaveBeenLastCalledWith(false);
    });

    it("disableDesktopController / restoreDesktopController round-trip the recorded keyboard state directly", async () => {
        const { controller, cc } = await makeEnabledController();
        cc.isKeyBoardEnabled.mockReturnValue(true);

        controller.disableDesktopController();
        expect(cc.enableKeyBoard).toHaveBeenLastCalledWith(false);
        expect(cc.stop).not.toHaveBeenCalled();

        controller.restoreDesktopController();
        expect(cc.enableKeyBoard).toHaveBeenLastCalledWith(true);
    });
});

// ---------------------------------------------------------------------------
// R15.3 - ArcRotate_Mode restored on session end
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - ArcRotate_Mode restored on session end (R15.3)", () => {
    it("sets the arc camera as the active rendered camera and re-attaches controls", async () => {
        const { controller, arc, scene, experience } = await makeEnabledController();

        fireInXR(experience);
        expect(controller.isInXR()).toBe(true);

        fireNotInXR(experience); // drives onSessionEnd -> restoreArcRotateMode()

        expect(scene.activeCamera).toBe(arc);
        expect(arc.attachControl).toHaveBeenCalled();
        // Controls re-attached to the rendering canvas with noPreventDefault=true.
        expect(arc.attachControl).toHaveBeenCalledWith(scene.__canvas, true);
    });

    it("the public restoreArcRotateMode() delegates to the same restore behavior", async () => {
        const { controller, arc, scene } = await makeEnabledController();

        controller.restoreArcRotateMode();

        expect(scene.activeCamera).toBe(arc);
        expect(arc.attachControl).toHaveBeenCalledWith(scene.__canvas, true);
    });
});

// ---------------------------------------------------------------------------
// R15.4 - observer add-count == remove-count across enter/exit cycles
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - per-session observers do not accumulate across cycles (R15.4)", () => {
    it("render + controller-added observers have matching add/remove counts after one enter->exit", async () => {
        const { scene, experience } = await makeEnabledController();

        fireInXR(experience);
        // A controller added during the session wires its per-source observers.
        const left = makeFakeController("left");
        experience.input.onControllerAddedObservable.fire(left.controller);

        fireNotInXR(experience);

        // Render observer: added once by the sampler, removed once on end.
        expect(scene.onBeforeRenderObservable.add).toHaveBeenCalledTimes(1);
        expect(scene.onBeforeRenderObservable.remove).toHaveBeenCalledTimes(1);
        expect(scene.onBeforeRenderObservable.observers.length).toBe(0);

        // Controller-added observable: add count == remove count, none left.
        expect(experience.input.onControllerAddedObservable.remove).toHaveBeenCalledTimes(
            experience.input.onControllerAddedObservable.add.mock.calls.length
        );
        expect(experience.input.onControllerAddedObservable.observers.length).toBe(0);

        // Trigger observer (jump) bound for the left controller was removed too.
        expect(left.trigger.observable.observers.length).toBe(0);
    });

    it("no per-session observable accumulates handlers across THREE full enter->exit cycles", async () => {
        const { scene, experience } = await makeEnabledController();

        for (let cycle = 0; cycle < 3; cycle++) {
            fireInXR(experience);

            const left = makeFakeController("left");
            const right = makeFakeController("right");
            experience.input.onControllerAddedObservable.fire(left.controller);
            experience.input.onControllerAddedObservable.fire(right.controller);

            // A render frame runs the sampler (must not throw or double-register).
            fireRenderFrame(scene);

            fireNotInXR(experience);

            // After every cycle, no per-session observable retains observers.
            expect(scene.onBeforeRenderObservable.observers.length).toBe(0);
            expect(experience.input.onControllerAddedObservable.observers.length).toBe(0);
            expect(left.trigger.observable.observers.length).toBe(0);
            expect(left.thumbstick.onButtonStateChangedObservable.observers.length).toBe(0);
            expect(right.trigger.observable.observers.length).toBe(0);
        }

        // The render observer never accumulates: it is added once per cycle and
        // removed once per cycle (add count == remove count).
        expect(scene.onBeforeRenderObservable.add.mock.calls.length).toBe(
            scene.onBeforeRenderObservable.remove.mock.calls.length
        );
    });

    it("detachSessionObservers() is the public teardown and clears the render observer", async () => {
        const { controller, scene, experience } = await makeEnabledController();
        fireInXR(experience);
        expect(scene.onBeforeRenderObservable.observers.length).toBe(1);

        controller.detachSessionObservers();

        expect(scene.onBeforeRenderObservable.remove).toHaveBeenCalled();
        expect(scene.onBeforeRenderObservable.observers.length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// R15.5 - collision / slope / animation untouched
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - collision/slope/animation left untouched (R15.5)", () => {
    it("never calls any collision/slope/animation-mutating CC API during enter/run/exit", async () => {
        const { cc, scene, experience } = await makeEnabledController();

        fireInXR(experience);
        const left = makeFakeController("left");
        experience.input.onControllerAddedObservable.fire(left.controller);
        // Run a few frames of the live session.
        fireRenderFrame(scene);
        fireRenderFrame(scene);
        fireNotInXR(experience);

        // XRController only ever touches camera coupling (setNoFirstPerson),
        // keyboard (enableKeyBoard), and movement-intent methods. It must never
        // mutate collision handling, slope limits, or animation behavior.
        expect(cc.setSlopeLimit).not.toHaveBeenCalled();
        expect(cc.setStepOffset).not.toHaveBeenCalled();
        expect(cc.setGravity).not.toHaveBeenCalled();
        expect(cc.setAnimationGroups).not.toHaveBeenCalled();
        expect(cc.setAnimationRanges).not.toHaveBeenCalled();
        expect(cc.setWalkAnim).not.toHaveBeenCalled();
        expect(cc.setIdleAnim).not.toHaveBeenCalled();
        expect(cc.enableBlending).not.toHaveBeenCalled();
        expect(cc.setCameraCollision).not.toHaveBeenCalled();
        // And it never stops/starts the controller.
        expect(cc.stop).not.toHaveBeenCalled();
        expect(cc.start).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// R17.1 / R17.2 - XR movement routes through the CC movement methods
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - XR movement uses the CC movement methods (R17.1, R17.2)", () => {
    it("a forward left-stick push drives the avatar via cc.walk (the moveWithCollisions/action-driven path), not a direct transform", async () => {
        const { cc, scene, experience } = await makeEnabledController();

        fireInXR(experience);
        // Add a left controller so the Move axes component is captured.
        const left = makeFakeController("left");
        experience.input.onControllerAddedObservable.fire(left.controller);

        // Push the left stick forward (leftY < -deadzone). WebXR thumbstick Y is
        // read straight through; forward is negative Y.
        left.thumbstick.axes = { x: 0, y: -1 };

        // A render frame samples the stick -> mapStickToIntent -> edge-triggered
        // applyMovementDirection -> cc.walk(true). Movement is thus driven
        // exclusively through the CharacterController's existing movement API
        // (which performs moveWithCollisions + action-driven animation), never by
        // manipulating the mesh transform directly (R17.1, R17.2).
        fireRenderFrame(scene);

        expect(cc.walk).toHaveBeenCalledWith(true);
        // No fast variant while the stick is not pressed.
        expect(cc.run).not.toHaveBeenCalled();
    });

    it("releasing the stick edge-triggers cc.walk(false) so the avatar stops via the same movement path", async () => {
        const { cc, scene, experience } = await makeEnabledController();
        fireInXR(experience);
        const left = makeFakeController("left");
        experience.input.onControllerAddedObservable.fire(left.controller);

        left.thumbstick.axes = { x: 0, y: -1 };
        fireRenderFrame(scene); // walk(true)
        expect(cc.walk).toHaveBeenCalledWith(true);

        left.thumbstick.axes = { x: 0, y: 0 };
        fireRenderFrame(scene); // walk(false) on the falling edge

        expect(cc.walk).toHaveBeenLastCalledWith(false);
    });
});

// ---------------------------------------------------------------------------
// R17.3 - jump delegates to cc.jump() (which resets movement action state)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - jump delegates to cc.jump() (R17.3)", () => {
    it("a left-trigger rising edge issues the action-driven cc.jump() rather than manipulating movement state directly", async () => {
        const { cc, experience } = await makeEnabledController();
        fireInXR(experience);

        // Add a left controller so the trigger jump handler is bound.
        const left = makeFakeController("left");
        experience.input.onControllerAddedObservable.fire(left.controller);

        // Rising edge on the left trigger.
        left.trigger.press();

        // XRController delegates to the CharacterController's existing jump().
        // jump() is the action-driven jump that resets movement action state
        // (see R17.3: simultaneous move-and-jump is a known limitation because
        // jump() resets the movement action) - XRController does not touch that
        // state itself, it just calls jump().
        expect(cc.jump).toHaveBeenCalledTimes(1);
    });
});
