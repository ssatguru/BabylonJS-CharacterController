import { describe, it, expect, vi, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";
import {
    BindableAction,
    BindableInput,
    DEFAULT_XR_INPUT_MAPPING,
    mergeXRInputMapping,
    INPUT_RESOLUTION,
    XR_COMPONENT_A_BUTTON,
    XR_COMPONENT_X_BUTTON,
    XR_COMPONENT_TRIGGER,
    XR_COMPONENT_THUMBSTICK,
    XR_COMPONENT_B_BUTTON,
} from "../src/xr/XRInputMapping";
import type { XRInputMapping } from "../src/xr/XRInputMapping";

/**
 * Feature: webxr-support - unit tests for the XRController data-driven controller
 * binding and the in-session Locomotion_Mode toggle (spec task 14.3). Example-
 * based vitest unit tests run entirely against mocks - no real BabylonJS scene,
 * no headset.
 *
 * Binding is driven by `bindInputs(experience)`: it wires the controllers
 * already present on `experience.input.controllers` and subscribes to
 * `experience.input.onControllerAddedObservable`. For each controller it resolves
 * the motion controller (immediately, or via `onMotionControllerInitObservable`)
 * and, in `_wireController`, walks every `BindableAction`, looks up its bound
 * `BindableInput` in `_effectiveMapping`, resolves the `(handedness, componentId)`
 * via `INPUT_RESOLUTION`, and attaches the matching handler only on the matching
 * hand. Actions bound to `null` wire nothing (R18.10).
 *
 * The Locomotion_Mode toggle is bound to the A/X face button (default:
 * `LocomotionModeToggle -> LeftAButton`) as a rising-edge press. On a press the
 * binder records the requesting motion controller and calls `handleToggleRequest`,
 * which derives `canFirstPerson` as the negation of `No_First_Person`, drives the
 * pure `XRLocomotion.toggle`, reconfigures the camera coupling on `changed`, and
 * on a blocked toward-firstPerson toggle stays in thirdPerson and emits a
 * best-effort haptic pulse on the requesting controller.
 *
 * Requirements covered:
 *  - R5.1 A/X face button is bound to LocomotionModeToggle; the trigger is NOT.
 *  - R5.2 handleToggleRequest derives canFirstPerson = !No_First_Person (both
 *    noFirstPerson=false -> true and noFirstPerson=true -> false).
 *  - R5.3 on a changed toggle, coupling is reconfigured via applyLocomotionMode /
 *    setNoFirstPerson.
 *  - R5.4 a blocked toggle (toward firstPerson while noFirstPerson=true) stays in
 *    thirdPerson AND a best-effort haptic pulse is attempted on the requester.
 *  - R5.5 the toggle is repeatable within a session (no latch).
 *  - R18.4 / R18.5 the default effective mapping equals DEFAULT_XR_INPUT_MAPPING.
 *  - R18.7 a mapping set before session entry is applied on the NEXT entry
 *    (bindInputs reads _effectiveMapping).
 *  - R18.8 a re-applied mapping during an active session takes effect via
 *    rebindActiveSession.
 *  - R18.10 an unbound (null) action wires no handler and never fires.
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
 * A fake button component exposing the `onButtonStateChangedObservable` the SUT
 * subscribes to for face-button / trigger / press bindings. `press()` /
 * `release()` fire a button-state-changed event carrying the new `pressed` value.
 */
function makeFakeButtonComponent() {
    const observable = new FakeObservable<{ pressed?: boolean }>();
    return {
        observable,
        component: { onButtonStateChangedObservable: observable, pressed: false },
        press(): void {
            (this.component as { pressed?: boolean }).pressed = true;
            observable.fire({ pressed: true });
        },
        release(): void {
            (this.component as { pressed?: boolean }).pressed = false;
            observable.fire({ pressed: false });
        },
    };
}

/**
 * A fake motion controller that resolves each standard WebXR component id to its
 * own button component (a-button, x-button, b-button, trigger) and the thumbstick
 * to an axes component. `getComponent(id)` returns the corresponding component,
 * or null for unknown ids. Exposes `.pulse` so blocked-toggle haptics can be
 * observed, and records its `handedness`.
 */
function makeFakeMotionController(handedness: "left" | "right") {
    const aButton = makeFakeButtonComponent();
    const xButton = makeFakeButtonComponent();
    const bButton = makeFakeButtonComponent();
    const trigger = makeFakeButtonComponent();
    const thumbstick = { axes: { x: 0, y: 0 }, pressed: false, onButtonStateChangedObservable: new FakeObservable<{ pressed?: boolean }>() };

    const getComponent = vi.fn((id: string) => {
        switch (id) {
            case XR_COMPONENT_A_BUTTON:
                return aButton.component;
            case XR_COMPONENT_X_BUTTON:
                return xButton.component;
            case XR_COMPONENT_B_BUTTON:
                return bButton.component;
            case XR_COMPONENT_TRIGGER:
                return trigger.component;
            case XR_COMPONENT_THUMBSTICK:
                return thumbstick;
            default:
                return null;
        }
    });

    const pulse = vi.fn(async () => undefined);

    const motionController = { handedness, getComponent, pulse };
    return { motionController, aButton, xButton, bButton, trigger, thumbstick, getComponent, pulse };
}

/**
 * A fake WebXR controller wrapping a motion controller. Its motion controller is
 * present immediately (so `_onControllerAdded` wires without waiting on the init
 * observable), and it reports handedness via `inputSource.handedness` as a
 * fallback.
 */
function makeFakeController(handedness: "left" | "right") {
    const mc = makeFakeMotionController(handedness);
    const controller = {
        motionController: mc.motionController,
        inputSource: { handedness },
        onMotionControllerInitObservable: new FakeObservable<unknown>(),
    };
    return { controller, ...mc };
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
 * A fake WebXRDefaultExperience exposing the state observable (to drive IN_XR /
 * NOT_IN_XR) and the input feature with a controller-added observable and a
 * mutable `controllers` array (controllers present at session start).
 */
function makeFakeExperience(initialControllers: unknown[] = []) {
    const stateObservable = new FakeObservable<WebXRState>();
    const controllerAddedObservable = new FakeObservable<unknown>();
    return {
        experience: {
            baseExperience: {
                onStateChangedObservable: stateObservable,
                camera: { __kind: "WebXRCamera", setTransformationFromNonVRCamera: vi.fn(), position: { x: 0, y: 0, z: 0 } },
                featuresManager: { disableFeature: vi.fn() },
                enterXRAsync: vi.fn(async () => ({})),
                exitXRAsync: vi.fn(async () => undefined),
            },
            input: {
                controllers: initialControllers,
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

/** Read the private effective mapping through the internal seam. */
function effectiveMapping(controller: XRController): XRInputMapping {
    return (controller as any)._effectiveMapping as XRInputMapping;
}

/** Set the private effective mapping through the internal seam (as a mapping change would). */
function setEffectiveMapping(controller: XRController, mapping: XRInputMapping): void {
    (controller as any)._effectiveMapping = mapping;
}

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R18.4 / R18.5 - default effective mapping equals documented bindings
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - default effective mapping equals DEFAULT_XR_INPUT_MAPPING (R18.4, R18.5)", () => {
    it("a freshly constructed controller seeds the documented default mapping", () => {
        const { controller } = makeController();

        expect(effectiveMapping(controller)).toEqual(DEFAULT_XR_INPUT_MAPPING);
    });

    it("the documented default binds the toggle and dolly toggle to face buttons and jump to the left trigger", () => {
        // Sanity-lock the exact documented bindings the binding tests rely on.
        expect(DEFAULT_XR_INPUT_MAPPING[BindableAction.LocomotionModeToggle]).toBe(BindableInput.LeftAButton);
        expect(DEFAULT_XR_INPUT_MAPPING[BindableAction.DollyToAvatarToggle]).toBe(BindableInput.LeftXButton);
        expect(DEFAULT_XR_INPUT_MAPPING[BindableAction.Jump]).toBe(BindableInput.LeftTrigger);
    });
});

// ---------------------------------------------------------------------------
// R5.1 - A/X face button bound to LocomotionModeToggle; trigger NOT bound to it
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - LocomotionModeToggle is bound to the A/X face button, not the trigger (R5.1)", () => {
    it("wires the toggle on the left A-button and firing it toggles the mode", () => {
        const { controller, cc } = makeController(false);
        // noFirstPerson=false -> firstPerson permitted.
        const { controller: left, aButton, trigger } = makeFakeController("left");

        // Simulate a controller being added during a session (motion controller present).
        (controller as any)._onControllerAdded(left);

        // The A-button observable was subscribed (toggle handler attached).
        expect(aButton.observable.add).toHaveBeenCalled();

        // A rising edge on the A-button drives a locomotion toggle.
        aButton.press();
        expect(cc.setNoFirstPerson).toHaveBeenCalled();

        // The trigger's observable is NOT used for the locomotion toggle. (It is
        // used for jump; here noFirstPerson affects only the toggle assertion.)
        // A trigger press must not invoke setNoFirstPerson (the toggle coupling).
        cc.setNoFirstPerson.mockClear();
        trigger.press();
        expect(cc.setNoFirstPerson).not.toHaveBeenCalled();
    });

    it("the trigger drives jump, never the locomotion toggle (R5.1)", () => {
        const { controller, cc } = makeController();
        const { controller: left, trigger } = makeFakeController("left");

        (controller as any)._onControllerAdded(left);

        trigger.press();
        // The trigger fires jump (bound to left trigger), not a mode toggle.
        expect(cc.jump).toHaveBeenCalledTimes(1);
        expect(cc.setNoFirstPerson).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// R5.2 - handleToggleRequest derives canFirstPerson = !No_First_Person
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - handleToggleRequest derives canFirstPerson = !No_First_Person (R5.2)", () => {
    it("canFirstPerson is true when noFirstPerson=false", () => {
        const { controller } = makeController(false);
        expect(controller.canFirstPerson()).toBe(true);
    });

    it("canFirstPerson is false when noFirstPerson=true", () => {
        const { controller } = makeController(true);
        expect(controller.canFirstPerson()).toBe(false);
    });

    it("with noFirstPerson=false the toggle reaches firstPerson (canFirstPerson=true)", () => {
        const { controller, cc } = makeController(false);
        // Start in a known thirdPerson state so a toggle heads toward firstPerson.
        (controller as any)._locomotion.setMode("thirdPerson", true);

        controller.handleToggleRequest();

        // Reaching firstPerson couples to setNoFirstPerson(false).
        expect((controller as any)._locomotion.getMode()).toBe("firstPerson");
        expect(cc.setNoFirstPerson).toHaveBeenLastCalledWith(false);
    });

    it("with noFirstPerson=true the toggle cannot reach firstPerson (canFirstPerson=false)", () => {
        const { controller } = makeController(true);
        (controller as any)._locomotion.setMode("thirdPerson", false);

        controller.handleToggleRequest();

        // Blocked - stays in thirdPerson.
        expect((controller as any)._locomotion.getMode()).toBe("thirdPerson");
    });
});

// ---------------------------------------------------------------------------
// R5.3 - a changed toggle reconfigures coupling via applyLocomotionMode
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - a changed toggle reconfigures camera coupling (R5.3)", () => {
    it("toggling thirdPerson -> firstPerson calls setNoFirstPerson(false)", () => {
        const { controller, cc } = makeController(false);
        (controller as any)._locomotion.setMode("thirdPerson", true);

        controller.handleToggleRequest();

        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
    });

    it("toggling firstPerson -> thirdPerson calls setNoFirstPerson(true)", () => {
        const { controller, cc } = makeController(false);
        (controller as any)._locomotion.setMode("firstPerson", true);

        controller.handleToggleRequest();

        expect((controller as any)._locomotion.getMode()).toBe("thirdPerson");
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(true);
    });

    it("a blocked (unchanged) toggle does not reconfigure coupling", () => {
        const { controller, cc } = makeController(true);
        (controller as any)._locomotion.setMode("thirdPerson", false);

        controller.handleToggleRequest();

        // No change -> applyLocomotionMode not invoked -> no coupling call.
        expect(cc.setNoFirstPerson).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// R5.4 - blocked toggle stays thirdPerson + best-effort haptic on requester
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - a blocked toggle stays thirdPerson and pulses the requester (R5.4)", () => {
    it("emitToggleBlockedFeedback attempts a short pulse on the requesting controller", () => {
        const { controller } = makeController(true);
        const { motionController, pulse } = makeFakeMotionController("left");

        controller.emitToggleBlockedFeedback(motionController as any);

        expect(pulse).toHaveBeenCalledTimes(1);
        expect(pulse).toHaveBeenCalledWith(0.5, 100);
    });

    it("a blocked toward-firstPerson request stays in thirdPerson and pulses the recorded controller", () => {
        const { controller, cc } = makeController(true);
        const { controller: left, aButton, pulse } = makeFakeController("left");
        (controller as any)._onControllerAdded(left);

        // Ensure we start in thirdPerson (noFirstPerson=true forces this on setMode).
        (controller as any)._locomotion.setMode("thirdPerson", false);

        aButton.press(); // rising edge -> handleToggleRequest with a blocked result

        expect((controller as any)._locomotion.getMode()).toBe("thirdPerson");
        expect(cc.setNoFirstPerson).not.toHaveBeenCalled();
        // Best-effort haptic on the requesting controller.
        expect(pulse).toHaveBeenCalledWith(0.5, 100);
    });

    it("never throws when the requesting controller cannot pulse (missing haptics)", () => {
        const { controller } = makeController(true);
        expect(() => controller.emitToggleBlockedFeedback({} as any)).not.toThrow();
        expect(() => controller.emitToggleBlockedFeedback(null as any)).not.toThrow();
    });

    it("swallows a rejected pulse promise so the toggle still resolves", () => {
        const { controller } = makeController(true);
        const rejecting = { pulse: vi.fn(() => Promise.reject(new Error("no haptics"))) };
        expect(() => controller.emitToggleBlockedFeedback(rejecting as any)).not.toThrow();
        expect(rejecting.pulse).toHaveBeenCalledWith(0.5, 100);
    });
});

// ---------------------------------------------------------------------------
// R5.5 - the toggle is repeatable within a session (no latch)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - the locomotion toggle is repeatable within a session (R5.5)", () => {
    it("multiple A-button presses keep toggling the mode back and forth", () => {
        const { controller, cc } = makeController(false);
        const { controller: left, aButton } = makeFakeController("left");
        (controller as any)._onControllerAdded(left);

        // Session default from noFirstPerson=false is firstPerson; normalize to a
        // known start so the flip sequence is deterministic.
        (controller as any)._locomotion.setMode("thirdPerson", true);

        aButton.press(); // -> firstPerson
        aButton.release();
        aButton.press(); // -> thirdPerson
        aButton.release();
        aButton.press(); // -> firstPerson

        const modes = cc.setNoFirstPerson.mock.calls.map((c) => c[0]);
        // Each rising edge flips the coupling; no latch after the first press.
        expect(modes).toEqual([false, true, false]);
        expect((controller as any)._locomotion.getMode()).toBe("firstPerson");
    });

    it("a held (not re-pressed) button does not repeat the toggle", () => {
        const { controller, cc } = makeController(false);
        const { controller: left, aButton } = makeFakeController("left");
        (controller as any)._onControllerAdded(left);
        (controller as any)._locomotion.setMode("thirdPerson", true);

        aButton.press(); // rising edge -> 1 toggle
        aButton.press(); // still pressed -> no new toggle
        aButton.press(); // still pressed -> no new toggle

        expect(cc.setNoFirstPerson).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// R18.7 - a mapping set before entry is applied on the NEXT session entry
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - a mapping is applied on the next session entry (R18.7)", () => {
    it("bindInputs reads _effectiveMapping so a remapped toggle input takes effect on entry", () => {
        const { controller, cc, camera, scene } = makeController(false);

        // Remap the locomotion toggle to the RIGHT A-button before entering.
        const remapped = mergeXRInputMapping({ [BindableAction.LocomotionModeToggle]: BindableInput.RightAButton });
        setEffectiveMapping(controller, remapped);

        const { experience, stateObservable } = makeFakeExperience();
        // Enable, then drive IN_XR so onSessionStart -> bindInputs runs.
        return controller.enable(experience as any).then(() => {
            stateObservable.fire(WebXRState.IN_XR);

            // A RIGHT controller is added; its A-button should now be wired to the toggle.
            const right = makeFakeController("right");
            (experience.input.onControllerAddedObservable as FakeObservable<unknown>).fire(right.controller);

            (controller as any)._locomotion.setMode("thirdPerson", true);
            right.aButton.press();
            expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);

            // The LEFT A-button (the old default) no longer drives the toggle.
            const left = makeFakeController("left");
            (experience.input.onControllerAddedObservable as FakeObservable<unknown>).fire(left.controller);
            cc.setNoFirstPerson.mockClear();
            left.aButton.press();
            expect(cc.setNoFirstPerson).not.toHaveBeenCalled();

            void camera;
            void scene;
        });
    });

    it("controllers present at session start are wired from _effectiveMapping on entry", async () => {
        const { controller, cc } = makeController(false);
        const left = makeFakeController("left");
        const { experience, stateObservable } = makeFakeExperience([left.controller]);

        await controller.enable(experience as any);
        stateObservable.fire(WebXRState.IN_XR);

        // The already-present left controller's A-button toggles locomotion.
        (controller as any)._locomotion.setMode("thirdPerson", true);
        left.aButton.press();
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
    });
});

// ---------------------------------------------------------------------------
// R18.8 - a re-applied mapping during an active session takes effect
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - rebindActiveSession applies a new mapping mid-session (R18.8)", () => {
    it("re-binding after a remap wires the new toggle input and drops the old one", async () => {
        const { controller, cc } = makeController(false);
        const left = makeFakeController("left");
        const { experience, stateObservable } = makeFakeExperience([left.controller]);

        await controller.enable(experience as any);
        stateObservable.fire(WebXRState.IN_XR);

        // Initially the left A-button toggles.
        (controller as any)._locomotion.setMode("thirdPerson", true);
        left.aButton.press();
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
        cc.setNoFirstPerson.mockClear();

        // Remap the toggle to the left X-button and re-bind the active session.
        const remapped = mergeXRInputMapping({ [BindableAction.LocomotionModeToggle]: BindableInput.LeftXButton });
        setEffectiveMapping(controller, remapped);
        controller.rebindActiveSession();

        // The old A-button binding was torn down; pressing it no longer toggles.
        (controller as any)._locomotion.setMode("thirdPerson", true);
        left.aButton.press();
        expect(cc.setNoFirstPerson).not.toHaveBeenCalled();

        // The new X-button binding drives the toggle.
        left.xButton.press();
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
    });

    it("rebindActiveSession is a no-op when no session is active", () => {
        const { controller } = makeController(false);
        // Not in XR -> nothing to re-bind, must not throw.
        expect(() => controller.rebindActiveSession()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// R18.10 - an unbound (null) action wires no handler and never fires
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - an unbound (null) action wires no handler and never fires (R18.10)", () => {
    it("unbinding LocomotionModeToggle subscribes no A-button handler and never toggles", () => {
        const { controller, cc } = makeController(false);

        const unbound = mergeXRInputMapping({ [BindableAction.LocomotionModeToggle]: null });
        setEffectiveMapping(controller, unbound);

        const { controller: left, aButton } = makeFakeController("left");
        (controller as any)._onControllerAdded(left);

        // No handler was attached to the A-button for the (now unbound) toggle.
        expect(aButton.observable.add).not.toHaveBeenCalled();

        // Firing the A-button never toggles locomotion.
        aButton.press();
        expect(cc.setNoFirstPerson).not.toHaveBeenCalled();
    });

    it("unbinding Jump subscribes no trigger handler and never jumps", () => {
        const { controller, cc } = makeController(false);

        const unbound = mergeXRInputMapping({ [BindableAction.Jump]: null });
        setEffectiveMapping(controller, unbound);

        const { controller: left, trigger } = makeFakeController("left");
        (controller as any)._onControllerAdded(left);

        expect(trigger.observable.add).not.toHaveBeenCalled();
        trigger.press();
        expect(cc.jump).not.toHaveBeenCalled();
    });

    it("the default Teleport action is unbound and wires nothing", () => {
        const { controller } = makeController(false);
        // Teleport is null in the default mapping (retained, never enabled).
        expect(effectiveMapping(controller)[BindableAction.Teleport]).toBeNull();
        expect(INPUT_RESOLUTION).toBeDefined();
    });
});
