import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebXRState } from "babylonjs";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for the XRController lifecycle and
 * enable/disable logic (spec task 5.3). These are example-based vitest unit
 * tests that run entirely against mocks - no real BabylonJS scene, no headset.
 *
 * Requirements covered:
 *  - R1.1 adopt a provided WebXRDefaultExperience -> enable resolves true and
 *    registers the WebXRState observer
 *  - R1.2 create a default experience when no argument is given
 *    (createDefaultXRExperienceAsync called with { disableTeleportation: true })
 *  - R1.3, R1.4 on any creation/adoption failure enable resolves false and
 *    leaves stored state untouched
 *  - R1.5 re-enable while already enabled replaces the stored reference and
 *    re-registers the observer (old removed, new added)
 *  - R1.6, R1.7, R1.8 disable variants: not-in-session release, in-session
 *    restore-ArcRotate-first, and not-enabled no-op
 *  - R1.9 no-op parity when not enabled (enter/exit/onSession* do nothing)
 *  - R2.1, R2.2 single reused experience + local-floor reference space; the
 *    session mode is 'immersive-vr' / 'immersive-ar'
 *  - R2.3 isInXR() tracking across IN_XR / NOT_IN_XR transitions
 *  - R2.4, R2.5, R2.6, R2.7 exit restore / idempotent exit / re-enter without
 *    recreating / enter-while-disabled stays in ArcRotate_Mode
 *  - R3.7, R3.8 session-start locomotion default derived from noFirstPerson
 *
 * detectXRSupport() is mocked (vi.mock below) so enter() sees the requested
 * session type as supported without stubbing navigator.xr / WebXRSessionManager.
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
 * removal, and lets the test fire a value at every current observer. Matches
 * the `.add` / `.remove` surface XRController touches.
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
        // Copy so a handler that mutates the list during dispatch is safe.
        for (const cb of [...this.observers]) {
            cb(value);
        }
    }
}

interface FakeBaseExperience {
    onStateChangedObservable: FakeObservable<WebXRState>;
    camera: unknown;
    enterXRAsync: ReturnType<typeof vi.fn>;
    exitXRAsync: ReturnType<typeof vi.fn>;
}

interface FakeExperience {
    baseExperience: FakeBaseExperience;
}

function makeFakeExperience(): FakeExperience {
    const camera = { __kind: "WebXRCamera" };
    return {
        baseExperience: {
            onStateChangedObservable: new FakeObservable<WebXRState>(),
            camera,
            enterXRAsync: vi.fn(async () => ({})),
            exitXRAsync: vi.fn(async () => undefined),
        },
    };
}

function makeFakeArcCamera() {
    return {
        __kind: "ArcRotateCamera",
        attachControl: vi.fn(),
    };
}

function makeFakeScene(experience: FakeExperience | null) {
    const canvas = { __kind: "canvas" };
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => canvas) })),
        createDefaultXRExperienceAsync: vi.fn(async (_opts: unknown) => experience),
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

/** Build an XRController wired to fresh fakes. */
function makeController(opts?: { experience?: FakeExperience | null; noFirstPerson?: boolean }) {
    const experience = opts?.experience === undefined ? makeFakeExperience() : opts.experience;
    const cc = makeFakeCC(opts?.noFirstPerson ?? false);
    const camera = makeFakeArcCamera();
    const scene = makeFakeScene(experience);
    // The SUT signatures expect concrete BabylonJS types; the fakes satisfy the
    // structural surface it actually touches, so cast through unknown.
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene, experience };
}

/** Drive the state observer to the IN_XR (session-active) transition. */
function fireInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.IN_XR);
}

/** Drive the state observer to the NOT_IN_XR (session-ended) transition. */
function fireNotInXR(experience: FakeExperience): void {
    experience.baseExperience.onStateChangedObservable.fire(WebXRState.NOT_IN_XR);
}

beforeEach(() => {
    mockedDetectXRSupport.mockReset();
    mockedDetectXRSupport.mockResolvedValue({ vrSupported: true, arSupported: true });
});

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// enable() - adoption, creation, failure, re-enable
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - XRController.enable", () => {
    it("adopts a provided experience, registers the state observer, and resolves true (R1.1)", async () => {
        const { controller, scene, experience } = makeController();

        const ok = await controller.enable(experience as any);

        expect(ok).toBe(true);
        // Adoption path must NOT create a default experience.
        expect(scene.createDefaultXRExperienceAsync).not.toHaveBeenCalled();
        // The WebXRState observer is registered against the adopted experience.
        expect(experience!.baseExperience.onStateChangedObservable.add).toHaveBeenCalledTimes(1);
        expect(experience!.baseExperience.onStateChangedObservable.observers.length).toBe(1);
    });

    it("creates a default experience with { disableTeleportation: true } when no arg is given (R1.2)", async () => {
        const { controller, scene, experience } = makeController();

        const ok = await controller.enable();

        expect(ok).toBe(true);
        expect(scene.createDefaultXRExperienceAsync).toHaveBeenCalledTimes(1);
        expect(scene.createDefaultXRExperienceAsync).toHaveBeenCalledWith({ disableTeleportation: true });
        // Observer registered on the created experience.
        expect(experience!.baseExperience.onStateChangedObservable.observers.length).toBe(1);
    });

    it("resolves false and leaves state untouched when creation returns null (R1.3, R1.4)", async () => {
        // Scene factory returns null -> no experience and no camera resolvable.
        const { controller, scene } = makeController({ experience: null });

        const ok = await controller.enable();

        expect(ok).toBe(false);
        expect(scene.createDefaultXRExperienceAsync).toHaveBeenCalledTimes(1);
        // State untouched: a subsequent enter() is a no-op (never entered),
        // and disable() is a no-op (not enabled) - neither throws.
        await expect(controller.enter("vr")).resolves.toBeUndefined();
        await expect(controller.disable()).resolves.toBeUndefined();
        expect(controller.isInXR()).toBe(false);
    });

    it("resolves false and leaves prior enabled state untouched when a later creation throws (R1.3, R1.4)", async () => {
        const { controller, scene, experience } = makeController();

        // First enable succeeds by adoption.
        expect(await controller.enable(experience as any)).toBe(true);
        const firstObserverCount = experience!.baseExperience.onStateChangedObservable.observers.length;
        expect(firstObserverCount).toBe(1);

        // Now force a re-enable via the create path to throw.
        scene.createDefaultXRExperienceAsync.mockRejectedValueOnce(new Error("boom"));
        const ok = await controller.enable();

        expect(ok).toBe(false);
        // Prior observer registration remains intact (state untouched on failure).
        expect(experience!.baseExperience.onStateChangedObservable.observers.length).toBe(1);
        // The still-enabled controller continues to track sessions.
        fireInXR(experience!);
        expect(controller.isInXR()).toBe(true);
    });

    it("re-enable replaces the stored reference and re-registers the observer (old removed, new added) (R1.5)", async () => {
        const { controller, experience: first } = makeController();
        const second = makeFakeExperience();

        expect(await controller.enable(first as any)).toBe(true);
        expect(first!.baseExperience.onStateChangedObservable.observers.length).toBe(1);

        // Re-enable with a different experience.
        expect(await controller.enable(second as any)).toBe(true);

        // Old observer removed from the first experience.
        expect(first!.baseExperience.onStateChangedObservable.remove).toHaveBeenCalledTimes(1);
        expect(first!.baseExperience.onStateChangedObservable.observers.length).toBe(0);
        // New observer added on the second experience.
        expect(second.baseExperience.onStateChangedObservable.add).toHaveBeenCalledTimes(1);
        expect(second.baseExperience.onStateChangedObservable.observers.length).toBe(1);

        // Transitions now flow through the NEW experience only.
        fireInXR(second);
        expect(controller.isInXR()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// disable() - release, restore-first-when-active, no-op
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - XRController.disable", () => {
    it("releases the reference and unregisters the observer when not in a session (R1.6)", async () => {
        const { controller, experience, scene, camera } = makeController();
        await controller.enable(experience as any);

        await controller.disable();

        expect(experience!.baseExperience.onStateChangedObservable.remove).toHaveBeenCalledTimes(1);
        expect(experience!.baseExperience.onStateChangedObservable.observers.length).toBe(0);
        // Not in a session -> ArcRotate restore is not required, but must not throw.
        // A subsequent enter() is now a no-op (disabled): no session mode entered.
        await controller.enter("vr");
        expect(experience!.baseExperience.enterXRAsync).not.toHaveBeenCalled();
        // Nothing forced the arc camera back mid-flow here.
        void scene;
        void camera;
    });

    it("restores ArcRotate_Mode first (activeCamera set back to the arc camera) then releases when in a session (R1.7)", async () => {
        const { controller, experience, scene, camera } = makeController();
        await controller.enable(experience as any);

        // Enter a session so _inXR is true.
        await controller.enter("vr");
        fireInXR(experience!);
        expect(controller.isInXR()).toBe(true);

        await controller.disable();

        // ArcRotate restored as the active rendered camera.
        expect(scene.activeCamera).toBe(camera);
        expect(camera.attachControl).toHaveBeenCalled();
        // Reference released + observer unregistered.
        expect(experience!.baseExperience.onStateChangedObservable.observers.length).toBe(0);
        expect(controller.isInXR()).toBe(false);
    });

    it("is a no-op and never throws when XR support is not enabled (R1.8)", async () => {
        const { controller, experience } = makeController();

        // Never enabled.
        await expect(controller.disable()).resolves.toBeUndefined();
        // No observer was ever registered, so none removed.
        expect(experience!.baseExperience.onStateChangedObservable.remove).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// no-op parity when not enabled (R1.9, R2.7)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - not-enabled no-op parity (R1.9, R2.7)", () => {
    it("enter/exit/onSessionStart/onSessionEnd do nothing when not enabled", async () => {
        const { controller, experience, cc } = makeController();

        // enter is a no-op while disabled: never asks the base experience to enter.
        await controller.enter("vr");
        expect(experience!.baseExperience.enterXRAsync).not.toHaveBeenCalled();
        // detectXRSupport must not even be consulted while disabled (R2.7 short-circuit).
        expect(mockedDetectXRSupport).not.toHaveBeenCalled();

        // exit is an idempotent no-op (not in a session).
        await controller.exit();
        expect(experience!.baseExperience.exitXRAsync).not.toHaveBeenCalled();

        // onSessionEnd guards on _inXR (never entered) -> no keyboard restore etc.
        controller.onSessionEnd();
        expect(cc.enableKeyBoard).not.toHaveBeenCalled();

        // isInXR stays false throughout.
        expect(controller.isInXR()).toBe(false);
    });

    it("enter while disabled leaves the controller in ArcRotate_Mode (isInXR stays false) (R2.7)", async () => {
        const { controller } = makeController();
        await controller.enter("ar");
        expect(controller.isInXR()).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// enter() / reuse / local-floor (R2.1, R2.2, R2.6)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - XRController.enter", () => {
    it("reuses the single created experience across entries (createDefault called once) (R2.1)", async () => {
        const { controller, scene, experience } = makeController();
        await controller.enable(); // create-default path

        await controller.enter("vr");
        // Simulate the round-trip so a re-enter is legitimate.
        fireInXR(experience!);
        fireNotInXR(experience!);
        await controller.enter("vr");

        // The experience was created exactly once and reused on the 2nd entry.
        expect(scene.createDefaultXRExperienceAsync).toHaveBeenCalledTimes(1);
        expect(experience!.baseExperience.enterXRAsync).toHaveBeenCalledTimes(2);
    });

    it("enters with 'immersive-vr' and the 'local-floor' reference space for a vr session (R2.2)", async () => {
        const { controller, experience } = makeController();
        await controller.enable(experience as any);

        await controller.enter("vr");

        expect(experience!.baseExperience.enterXRAsync).toHaveBeenCalledWith("immersive-vr", "local-floor");
    });

    it("enters with 'immersive-ar' and the 'local-floor' reference space for an ar session (R2.2)", async () => {
        const { controller, experience } = makeController();
        await controller.enable(experience as any);

        await controller.enter("ar");

        expect(experience!.baseExperience.enterXRAsync).toHaveBeenCalledWith("immersive-ar", "local-floor");
    });

    it("does not enter when the requested session type is unsupported", async () => {
        mockedDetectXRSupport.mockResolvedValue({ vrSupported: false, arSupported: true });
        const { controller, experience } = makeController();
        await controller.enable(experience as any);

        await controller.enter("vr"); // vr unsupported
        expect(experience!.baseExperience.enterXRAsync).not.toHaveBeenCalled();

        await controller.enter("ar"); // ar supported
        expect(experience!.baseExperience.enterXRAsync).toHaveBeenCalledWith("immersive-ar", "local-floor");
    });

    it("re-enters after an exit without recreating the experience (R2.6)", async () => {
        const { controller, scene, experience } = makeController();
        await controller.enable();

        await controller.enter("vr");
        fireInXR(experience!);
        // Exit the session.
        await controller.exit();
        expect(experience!.baseExperience.exitXRAsync).toHaveBeenCalledTimes(1);
        fireNotInXR(experience!);
        expect(controller.isInXR()).toBe(false);

        // Re-enter: same experience, no new creation.
        await controller.enter("vr");
        expect(scene.createDefaultXRExperienceAsync).toHaveBeenCalledTimes(1);
        expect(experience!.baseExperience.enterXRAsync).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// isInXR() tracking + exit idempotence (R2.3, R2.4, R2.5)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - session state tracking", () => {
    it("isInXR is false initially, true after IN_XR, false after NOT_IN_XR (R2.3)", async () => {
        const { controller, experience } = makeController();
        await controller.enable(experience as any);

        expect(controller.isInXR()).toBe(false);

        fireInXR(experience!);
        expect(controller.isInXR()).toBe(true);

        fireNotInXR(experience!);
        expect(controller.isInXR()).toBe(false);
    });

    it("exit calls exitXRAsync when a session is active (R2.4)", async () => {
        const { controller, experience } = makeController();
        await controller.enable(experience as any);
        await controller.enter("vr");
        fireInXR(experience!);

        await controller.exit();

        expect(experience!.baseExperience.exitXRAsync).toHaveBeenCalledTimes(1);
    });

    it("exit is an idempotent no-op when not in a session (R2.5)", async () => {
        const { controller, experience } = makeController();
        await controller.enable(experience as any);

        // No session started.
        await controller.exit();
        expect(experience!.baseExperience.exitXRAsync).not.toHaveBeenCalled();

        // Enter + end, then exit again: still no extra exitXRAsync from the 2nd call.
        await controller.enter("vr");
        fireInXR(experience!);
        fireNotInXR(experience!);
        await controller.exit();
        expect(experience!.baseExperience.exitXRAsync).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// session-start locomotion default from noFirstPerson (R3.7, R3.8)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - session-start locomotion default", () => {
    it("defaults to firstPerson and applies setNoFirstPerson(false) when noFirstPerson === false (R3.7)", async () => {
        const { controller, experience, cc } = makeController({ noFirstPerson: false });
        await controller.enable(experience as any);
        await controller.enter("vr");

        fireInXR(experience!); // drives onSessionStart

        // firstPerson mode -> setNoFirstPerson(false).
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
        // Keyboard disabled on session start, controller kept running.
        expect(cc.enableKeyBoard).toHaveBeenCalledWith(false);
    });

    it("defaults to thirdPerson and applies setNoFirstPerson(true) when noFirstPerson === true (R3.8)", async () => {
        const { controller, experience, cc } = makeController({ noFirstPerson: true });
        await controller.enable(experience as any);
        await controller.enter("vr");

        fireInXR(experience!); // drives onSessionStart

        // thirdPerson mode -> setNoFirstPerson(true).
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(true);
        expect(cc.enableKeyBoard).toHaveBeenCalledWith(false);
    });
});
