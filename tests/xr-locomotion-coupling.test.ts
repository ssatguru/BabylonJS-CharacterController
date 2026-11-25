import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { XRController } from "../src/xr/XRController";
import type { LocomotionMode } from "../src/xr/XRLocomotion";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for the XRController Locomotion_Mode ->
 * camera coupling (spec task 6.2). Example-based vitest unit tests run entirely
 * against mocks - no real BabylonJS scene, no headset.
 *
 * Requirements covered:
 *  - R4.1 firstPerson -> cc.setNoFirstPerson(false)
 *  - R4.2 thirdPerson -> cc.setNoFirstPerson(true)
 *  - R4.3 applyLocomotionMode ensures teleport is disabled - the guarded
 *    teleport-disable path is exercised (featuresManager.disableFeature called
 *    when present, safe no-op under a missing features manager), and teleport is
 *    never enabled.
 *  - R4.4 applying/changing a mode never invokes any avatar movement method
 *    (walk/run/strafe/turn/jump/etc.); only the camera coupling is touched.
 *
 * detectXRSupport() is mocked so entry-related helpers never touch navigator.xr;
 * these tests exercise applyLocomotionMode / canFirstPerson directly, so support
 * is largely irrelevant, but the mock keeps the module import side-effect-free.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * The full set of avatar movement methods on a CharacterController. R4.4 asserts
 * NONE of these are invoked when a Locomotion_Mode is applied or changed - only
 * the camera coupling (setNoFirstPerson) is touched.
 */
const MOVEMENT_METHOD_NAMES = [
    "walk",
    "walkBack",
    "walkFast",
    "walkBackFast",
    "run",
    "strafeLeft",
    "strafeRight",
    "strafeLeftFast",
    "strafeRightFast",
    "turnLeft",
    "turnRight",
    "turnLeftFast",
    "turnRightFast",
    "jump",
    "idle",
    "start",
    "stop",
    "moveTo",
    "turnTo",
    "enableKeyBoard",
] as const;

function makeFakeCC(noFirstPerson = false) {
    const cc: Record<string, ReturnType<typeof vi.fn>> = {
        getSettings: vi.fn(() => ({ noFirstPerson })),
        setNoFirstPerson: vi.fn(),
    };
    for (const name of MOVEMENT_METHOD_NAMES) {
        cc[name] = vi.fn();
    }
    return cc;
}

/** A minimal features manager exposing a disableFeature spy (R4.3). */
function makeFakeFeaturesManager() {
    return { disableFeature: vi.fn() };
}

/**
 * A fake WebXRDefaultExperience whose baseExperience exposes a featuresManager
 * with a disableFeature spy, so the guarded teleport-disable path can be
 * observed. Passing this to enable() adopts it as the stored experience.
 */
function makeFakeExperience(featuresManager: { disableFeature: ReturnType<typeof vi.fn> } | null) {
    return {
        baseExperience: {
            featuresManager,
            camera: { __kind: "WebXRCamera" },
            onStateChangedObservable: { add: vi.fn((cb: unknown) => cb), remove: vi.fn(() => true) },
            enterXRAsync: vi.fn(async () => ({})),
            exitXRAsync: vi.fn(async () => undefined),
        },
    };
}

function makeFakeArcCamera() {
    return { __kind: "ArcRotateCamera", attachControl: vi.fn() };
}

function makeFakeScene() {
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
        createDefaultXRExperienceAsync: vi.fn(async () => null),
    };
}

function makeController(opts?: {
    noFirstPerson?: boolean;
    featuresManager?: { disableFeature: ReturnType<typeof vi.fn> } | null;
}) {
    const cc = makeFakeCC(opts?.noFirstPerson ?? false);
    const camera = makeFakeArcCamera();
    const scene = makeFakeScene();
    const fm = opts?.featuresManager === undefined ? makeFakeFeaturesManager() : opts.featuresManager;
    const experience = makeFakeExperience(fm);
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene, experience, fm };
}

/** Assert that none of the avatar movement methods were called. */
function expectNoMovementCalls(cc: Record<string, ReturnType<typeof vi.fn>>): void {
    for (const name of MOVEMENT_METHOD_NAMES) {
        expect(cc[name], `movement method ${name} must not be called`).not.toHaveBeenCalled();
    }
}

beforeEach(() => {
    // no shared state
});

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R4.1 / R4.2 - mode -> setNoFirstPerson coupling
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - applyLocomotionMode camera coupling", () => {
    it("firstPerson couples to setNoFirstPerson(false) (R4.1)", () => {
        const { controller, cc } = makeController({ noFirstPerson: false });

        controller.applyLocomotionMode("firstPerson");

        expect(cc.setNoFirstPerson).toHaveBeenCalledTimes(1);
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
    });

    it("thirdPerson couples to setNoFirstPerson(true) (R4.2)", () => {
        const { controller, cc } = makeController({ noFirstPerson: false });

        controller.applyLocomotionMode("thirdPerson");

        expect(cc.setNoFirstPerson).toHaveBeenCalledTimes(1);
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(true);
    });

    it("changing mode across calls flips the coupling argument each time (R4.1, R4.2)", () => {
        const { controller, cc } = makeController();

        const sequence: LocomotionMode[] = ["firstPerson", "thirdPerson", "firstPerson"];
        for (const mode of sequence) {
            controller.applyLocomotionMode(mode);
        }

        expect(cc.setNoFirstPerson.mock.calls.map((c) => c[0])).toEqual([false, true, false]);
    });
});

// ---------------------------------------------------------------------------
// R4.3 - teleport not active on apply
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - applyLocomotionMode disables teleport (R4.3)", () => {
    it("calls featuresManager.disableFeature and never enables teleport when an experience is enabled", async () => {
        const fm = makeFakeFeaturesManager();
        const { controller, experience } = makeController({ featuresManager: fm });
        await controller.enable(experience as any);

        controller.applyLocomotionMode("firstPerson");

        // The guarded teleport-disable path ran against the features manager.
        expect(fm.disableFeature).toHaveBeenCalled();
        // There is no enableFeature spy - teleport is never enabled by this flow.
        expect(fm).not.toHaveProperty("enableFeature");
    });

    it("disables teleport on every apply, regardless of mode (R4.3)", async () => {
        const fm = makeFakeFeaturesManager();
        const { controller, experience } = makeController({ featuresManager: fm });
        await controller.enable(experience as any);

        controller.applyLocomotionMode("thirdPerson");
        controller.applyLocomotionMode("firstPerson");

        // One disable per apply.
        expect(fm.disableFeature).toHaveBeenCalledTimes(2);
    });

    it("is a safe no-op (never throws) when the features manager is absent under mocks (R4.3)", () => {
        // No experience enabled at all -> _xrExperience is null.
        const { controller, cc } = makeController({ featuresManager: null });

        expect(() => controller.applyLocomotionMode("firstPerson")).not.toThrow();
        // Coupling still applied even though there was no teleport feature to disable.
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(false);
    });

    it("is a safe no-op (never throws) when an enabled experience has no features manager (R4.3)", async () => {
        const { controller, cc, experience } = makeController({ featuresManager: null });
        await controller.enable(experience as any);

        expect(() => controller.applyLocomotionMode("thirdPerson")).not.toThrow();
        expect(cc.setNoFirstPerson).toHaveBeenCalledWith(true);
    });
});

// ---------------------------------------------------------------------------
// R4.4 - movement mechanism unchanged on mode change
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - applyLocomotionMode leaves movement unchanged (R4.4)", () => {
    it("invokes no avatar movement method when applying firstPerson", () => {
        const { controller, cc } = makeController();
        controller.applyLocomotionMode("firstPerson");
        expectNoMovementCalls(cc);
    });

    it("invokes no avatar movement method when applying thirdPerson", () => {
        const { controller, cc } = makeController();
        controller.applyLocomotionMode("thirdPerson");
        expectNoMovementCalls(cc);
    });

    it("invokes no avatar movement method across repeated mode changes", async () => {
        const fm = makeFakeFeaturesManager();
        const { controller, cc, experience } = makeController({ featuresManager: fm });
        await controller.enable(experience as any);

        controller.applyLocomotionMode("firstPerson");
        controller.applyLocomotionMode("thirdPerson");
        controller.applyLocomotionMode("firstPerson");
        controller.applyLocomotionMode("thirdPerson");

        expectNoMovementCalls(cc);
        // Only the camera coupling was touched.
        expect(cc.setNoFirstPerson).toHaveBeenCalledTimes(4);
    });
});

// ---------------------------------------------------------------------------
// canFirstPerson - negation of noFirstPerson (supporting R4.1/R4.2 derivation)
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - canFirstPerson reflects !noFirstPerson", () => {
    it("returns true when noFirstPerson === false", () => {
        const { controller } = makeController({ noFirstPerson: false });
        expect(controller.canFirstPerson()).toBe(true);
    });

    it("returns false when noFirstPerson === true", () => {
        const { controller } = makeController({ noFirstPerson: true });
        expect(controller.canFirstPerson()).toBe(false);
    });
});
