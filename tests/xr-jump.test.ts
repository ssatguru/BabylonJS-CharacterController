import { describe, it, expect, vi, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";
import { XR_COMPONENT_TRIGGER } from "../src/xr/XRInputMapping";
import type { Handedness } from "../src/xr/XRInputMapping";

/**
 * Feature: webxr-support - unit tests for XRController jump, driven by a
 * rising-edge press of the bound trigger (spec task 9.2). Example-based vitest
 * unit tests run entirely against mocks - no real BabylonJS scene, no headset.
 *
 * Jump is wired by the public `bindJump(motionController, handedness)` method.
 * It reads `_effectiveMapping[BindableAction.Jump]`, resolves the bound input to
 * a (handedness, componentId) pair via INPUT_RESOLUTION, and only attaches when
 * the incoming controller's handedness matches AND the bound component is the
 * standard trigger (`xr-standard-trigger`). It subscribes to the trigger
 * component's `onButtonStateChangedObservable` with a rising-edge detector that
 * calls `cc.jump()` once on a false -> true transition of `pressed`. Each
 * observer is tracked in `_triggerObservers` and removed on session end via
 * `_detachTriggerObservers` (wired into `_detachSessionObservers`).
 *
 * Requirements covered:
 *  - R8.1 left trigger rising edge -> exactly one cc.jump(); held state does not
 *    re-fire; release then re-press fires again.
 *  - R8.2 a right-hand controller does NOT wire a jump handler (default binds
 *    Jump to the left trigger).
 *  - R8.3 trigger observers are detached from their observables on session end,
 *    and the tracking array is cleared, so enter/exit cycles never accumulate
 *    handlers.
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
 * events at whatever is currently subscribed and assert precise removal.
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
        for (const cb of [...this.observers]) {
            cb(value);
        }
    }
}

/**
 * A fake trigger component exposing the `onButtonStateChangedObservable` the SUT
 * subscribes to. `press()` / `release()` fire a button-state-changed event
 * carrying the new `pressed` value.
 */
function makeFakeTriggerComponent() {
    const observable = new FakeObservable<{ pressed?: boolean }>();
    return {
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
 * A fake motion controller. `getComponent(id)` returns the trigger component
 * only for the standard-trigger component id; any other id yields null (so a
 * non-trigger binding never wires a handler).
 */
function makeFakeMotionController() {
    const trigger = makeFakeTriggerComponent();
    const getComponent = vi.fn((id: string) => {
        if (id === XR_COMPONENT_TRIGGER) {
            return { onButtonStateChangedObservable: trigger.observable };
        }
        return null;
    });
    return { motionController: { getComponent }, trigger, getComponent };
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

function makeController() {
    const cc = makeFakeCC();
    const camera = makeFakeArcCamera();
    const scene = makeFakeScene();
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene };
}

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R8.1 - left trigger rising edge -> exactly one jump()
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - jump fires on the left-trigger rising edge (R8.1)", () => {
    it("a rising edge on the left trigger calls jump() exactly once", () => {
        const { controller, cc } = makeController();
        const { motionController, trigger } = makeFakeMotionController();

        controller.bindJump(motionController as any, "left");
        trigger.press(); // false -> true

        expect(cc.jump).toHaveBeenCalledTimes(1);
    });

    it("a held (still-pressed) state does not re-fire jump()", () => {
        const { controller, cc } = makeController();
        const { motionController, trigger } = makeFakeMotionController();

        controller.bindJump(motionController as any, "left");

        trigger.press(); // rising edge -> 1 jump
        trigger.press(); // still pressed -> no new jump
        trigger.press(); // still pressed -> no new jump

        expect(cc.jump).toHaveBeenCalledTimes(1);
    });

    it("release then re-press fires jump() again (one per rising edge)", () => {
        const { controller, cc } = makeController();
        const { motionController, trigger } = makeFakeMotionController();

        controller.bindJump(motionController as any, "left");

        trigger.press(); // rising edge -> jump #1
        trigger.release(); // falling edge -> no jump
        trigger.press(); // rising edge -> jump #2

        expect(cc.jump).toHaveBeenCalledTimes(2);
    });

    it("a leading release before any press does not fire jump()", () => {
        const { controller, cc } = makeController();
        const { motionController, trigger } = makeFakeMotionController();

        controller.bindJump(motionController as any, "left");
        trigger.release(); // not a rising edge

        expect(cc.jump).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// R8.2 - right controller does NOT wire a jump handler
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - the right controller does not jump (R8.2)", () => {
    it("bindJump on a right-hand controller subscribes to no trigger observable", () => {
        const { controller, cc } = makeController();
        const { motionController, trigger, getComponent } = makeFakeMotionController();

        // Default mapping binds Jump to the LEFT trigger, so a right-hand
        // controller resolves to a different handedness and is skipped.
        controller.bindJump(motionController as any, "right");

        // No trigger observable subscription was made on the right controller.
        expect(getComponent).not.toHaveBeenCalled();
        expect(trigger.observable.add).not.toHaveBeenCalled();

        // Even if the right trigger fires a rising edge, no jump is triggered.
        trigger.press();
        expect(cc.jump).not.toHaveBeenCalled();
    });

    it("with both hands bound, only the left trigger's rising edge jumps", () => {
        const { controller, cc } = makeController();
        const left = makeFakeMotionController();
        const right = makeFakeMotionController();

        controller.bindJump(left.motionController as any, "left");
        controller.bindJump(right.motionController as any, "right");

        // Right trigger press -> nothing.
        right.trigger.press();
        expect(cc.jump).not.toHaveBeenCalled();

        // Left trigger press -> exactly one jump.
        left.trigger.press();
        expect(cc.jump).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// R8.3 - trigger observers detached on session end / exit
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - trigger observers are detached on session end (R8.3)", () => {
    it("removes the trigger observer from its observable and clears the tracking array", () => {
        const { controller, cc } = makeController();
        const { motionController, trigger } = makeFakeMotionController();

        controller.bindJump(motionController as any, "left");
        expect(trigger.observable.add).toHaveBeenCalledTimes(1);
        expect(trigger.observable.observers.length).toBe(1);

        // End the session -> _detachSessionObservers -> _detachTriggerObservers.
        // Mark _inXR so onSessionEnd runs its teardown, then fire the hook.
        (controller as any)._inXR = true;
        controller.onSessionEnd();

        // add count == remove count on the observable, and no observers remain.
        expect(trigger.observable.remove).toHaveBeenCalledTimes(1);
        expect(trigger.observable.observers.length).toBe(0);

        // A press after teardown no longer reaches cc.jump().
        trigger.press();
        expect(cc.jump).not.toHaveBeenCalled();
    });

    it("does not accumulate handlers across repeated bind + session-end cycles", () => {
        const { controller, cc } = makeController();

        for (let cycle = 0; cycle < 3; cycle++) {
            const { motionController, trigger } = makeFakeMotionController();

            controller.bindJump(motionController as any, "left");
            expect(trigger.observable.observers.length).toBe(1);

            // A single rising edge jumps exactly once this cycle.
            trigger.press();
            expect(cc.jump).toHaveBeenCalledTimes(1);

            // Tear down: add count == remove count, observers cleared.
            (controller as any)._inXR = true;
            controller.onSessionEnd();
            expect(trigger.observable.add).toHaveBeenCalledTimes(1);
            expect(trigger.observable.remove).toHaveBeenCalledTimes(1);
            expect(trigger.observable.observers.length).toBe(0);

            cc.jump.mockClear();
        }
    });
});

// ---------------------------------------------------------------------------
// R8.1 + R8.3 - end-to-end via the state observer (session start binds, end
// detaches). Mirrors the lifecycle test's IN_XR / NOT_IN_XR driving so the jump
// wiring is exercised through the real onSessionStart -> onSessionEnd path.
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - jump wiring through the session lifecycle (R8.1, R8.3)", () => {
    /** A fake experience whose controller-added observable can hand a motion controller to the SUT. */
    function makeLifecycleController() {
        const cc = makeFakeCC();
        const camera = makeFakeArcCamera();
        const stateObservable = new FakeObservable<WebXRState>();
        const scene = {
            activeCamera: null as unknown,
            getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
            onBeforeRenderObservable: { add: vi.fn((cb: unknown) => cb), remove: vi.fn(() => true) },
            createDefaultXRExperienceAsync: vi.fn(),
        };
        const experience = {
            baseExperience: {
                onStateChangedObservable: stateObservable,
                camera: { __kind: "WebXRCamera" },
                enterXRAsync: vi.fn(async () => ({})),
                exitXRAsync: vi.fn(async () => undefined),
            },
        };
        const controller = new XRController(cc as any, camera as any, scene as any);
        return { controller, cc, experience };
    }

    it("session end detaches a jump observer bound during the session", async () => {
        const { controller, cc, experience } = makeLifecycleController();
        const { motionController, trigger } = makeFakeMotionController();

        await controller.enable(experience as any);
        experience.baseExperience.onStateChangedObservable.fire(WebXRState.IN_XR);

        // Bind a jump handler as if a left controller was added during the session.
        controller.bindJump(motionController as any, "left");
        trigger.press();
        expect(cc.jump).toHaveBeenCalledTimes(1);

        // End the session -> observers detached, array cleared.
        experience.baseExperience.onStateChangedObservable.fire(WebXRState.NOT_IN_XR);

        expect(trigger.observable.remove).toHaveBeenCalledTimes(1);
        expect(trigger.observable.observers.length).toBe(0);

        // A post-session press does not jump.
        cc.jump.mockClear();
        trigger.press();
        expect(cc.jump).not.toHaveBeenCalled();
    });
});
