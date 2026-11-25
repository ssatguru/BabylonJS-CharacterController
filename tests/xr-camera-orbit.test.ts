import { describe, it, expect, vi, afterEach } from "vitest";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for XRController camera orbit (spec task
 * 10.3). Example-based vitest unit tests run entirely against mocks - no real
 * BabylonJS scene, no headset.
 *
 * Camera orbit is driven by the public `applyCameraOrbit(rightX, rightY)`
 * method. Per R9 it applies Dominant_Axis_Gating (the axis with the larger raw
 * magnitude wins; ties resolve to alpha), gates the winning axis by the stick
 * deadzone, then either `alpha += alphaRate * rightX` OR `beta += betaRate *
 * rightY` (forward `rightY < 0` decreases beta), clamps beta, marks the arc
 * camera dirty, and NEVER rotates the avatar.
 *
 * Requirements covered:
 *  - R9.1 alpha delta computed from `alphaRate * rightX`.
 *  - R9.2 beta delta computed from `betaRate * rightY` (forward decreases beta),
 *    then clamped within the camera's beta limits / pole-avoiding fallback.
 *  - R9.4 no avatar rotation occurs during orbit.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/**
 * A fake ArcRotateCamera exposing the orbit surface the SUT touches: numeric
 * `alpha`/`beta`, optional `lowerBetaLimit`/`upperBetaLimit`, and a spied
 * `computeWorldMatrix`. Defaults place beta comfortably inside the pole-avoiding
 * fallback range so a small delta never trips the clamp unless intended.
 */
function makeFakeArcCamera(overrides: Record<string, unknown> = {}) {
    return {
        __kind: "ArcRotateCamera",
        alpha: 1.0,
        beta: 1.5,
        attachControl: vi.fn(),
        computeWorldMatrix: vi.fn(),
        ...overrides,
    };
}

/**
 * A fake CharacterController. It exposes ALL rotation-capable surfaces the SUT
 * could conceivably call so the "no avatar rotation" assertion can prove none of
 * them are invoked during orbit. None of these should ever be called by orbit.
 */
function makeFakeCC() {
    return {
        jump: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson: false })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
        // Rotation / turn surfaces that orbit must NOT touch (R9.4).
        turnLeft: vi.fn(),
        turnRight: vi.fn(),
        turnLeftFast: vi.fn(),
        turnRightFast: vi.fn(),
        turnTo: vi.fn(),
        // Movement surfaces (also must not be called by orbit).
        walk: vi.fn(),
        walkBack: vi.fn(),
        strafeLeft: vi.fn(),
        strafeRight: vi.fn(),
        run: vi.fn(),
    };
}

function makeFakeScene() {
    return {
        activeCamera: null as unknown,
        getEngine: vi.fn(() => ({ getRenderingCanvas: vi.fn(() => ({ __kind: "canvas" })) })),
        onBeforeRenderObservable: { add: vi.fn((cb: unknown) => cb), remove: vi.fn(() => true) },
    };
}

function makeController(cameraOverrides: Record<string, unknown> = {}) {
    const cc = makeFakeCC();
    const camera = makeFakeArcCamera(cameraOverrides);
    const scene = makeFakeScene();
    const controller = new XRController(cc as any, camera as any, scene as any);
    return { controller, cc, camera, scene };
}

// Documented default rates (design + XRController constants).
const ALPHA_RATE = 0.0075;
const BETA_RATE = 0.003;
const BETA_MIN_FALLBACK = 0.05;
const BETA_MAX_FALLBACK = Math.PI - 0.05;

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R9.1 - alpha delta from alphaRate * rightX
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - orbit changes alpha by alphaRate * rightX (R9.1)", () => {
    it("a dominant right-stick X beyond the deadzone adds alphaRate * rightX to alpha", () => {
        const { controller, camera } = makeController();
        const alpha0 = camera.alpha;
        const rightX = 1.0; // full deflection, X dominant (Y = 0)

        controller.applyCameraOrbit(rightX, 0);

        expect(camera.alpha).toBeCloseTo(alpha0 + ALPHA_RATE * rightX, 12);
    });

    it("scales the alpha delta by the raw (signed, partial) axis value", () => {
        const { controller, camera } = makeController();
        const alpha0 = camera.alpha;
        const rightX = -0.6; // negative, partial deflection (beyond 0.15 deadzone)

        controller.applyCameraOrbit(rightX, 0);

        expect(camera.alpha).toBeCloseTo(alpha0 + ALPHA_RATE * rightX, 12);
    });

    it("leaves beta unchanged when alpha is the dominant axis", () => {
        const { controller, camera } = makeController();
        const beta0 = camera.beta;

        controller.applyCameraOrbit(0.9, 0.1); // X dominant

        expect(camera.beta).toBe(beta0);
    });

    it("does nothing when the dominant X is within the deadzone", () => {
        const { controller, camera } = makeController();
        const alpha0 = camera.alpha;
        const beta0 = camera.beta;

        controller.applyCameraOrbit(0.1, 0.05); // both within 0.15 deadzone, X dominant

        expect(camera.alpha).toBe(alpha0);
        expect(camera.beta).toBe(beta0);
        expect(camera.computeWorldMatrix).not.toHaveBeenCalled();
    });

    it("marks the arc camera dirty after an alpha change", () => {
        const { controller, camera } = makeController();

        controller.applyCameraOrbit(1.0, 0);

        expect(camera.computeWorldMatrix).toHaveBeenCalledWith(true);
    });
});

// ---------------------------------------------------------------------------
// R9.2 - beta delta from betaRate * rightY (forward decreases beta) + clamp
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - orbit changes beta by betaRate * rightY (R9.2)", () => {
    it("a dominant right-stick Y adds betaRate * rightY to beta", () => {
        const { controller, camera } = makeController();
        const beta0 = camera.beta;
        const rightY = 1.0; // back -> increases beta; Y dominant (X = 0)

        controller.applyCameraOrbit(0, rightY);

        expect(camera.beta).toBeCloseTo(beta0 + BETA_RATE * rightY, 12);
    });

    it("forward (rightY < 0) decreases beta", () => {
        const { controller, camera } = makeController();
        const beta0 = camera.beta;
        const rightY = -1.0; // forward -> decreases beta

        controller.applyCameraOrbit(0, rightY);

        expect(camera.beta).toBeCloseTo(beta0 + BETA_RATE * rightY, 12);
        expect(camera.beta).toBeLessThan(beta0);
    });

    it("leaves alpha unchanged when beta is the dominant axis", () => {
        const { controller, camera } = makeController();
        const alpha0 = camera.alpha;

        controller.applyCameraOrbit(0.1, 0.9); // Y dominant

        expect(camera.alpha).toBe(alpha0);
    });

    it("clamps beta to the camera's lowerBetaLimit when a downward push would undershoot", () => {
        // beta starts just above the lower limit; a forward (negative) full push
        // would go below it, so clampBeta pins it to the lower limit.
        const { controller, camera } = makeController({ beta: 0.2, lowerBetaLimit: 0.2, upperBetaLimit: 3.0 });

        controller.applyCameraOrbit(0, -1.0); // forward, would push beta below 0.2

        expect(camera.beta).toBe(0.2);
    });

    it("clamps beta to the camera's upperBetaLimit when an upward push would overshoot", () => {
        const { controller, camera } = makeController({ beta: 3.0, lowerBetaLimit: 0.2, upperBetaLimit: 3.0 });

        controller.applyCameraOrbit(0, 1.0); // back, would push beta above 3.0

        expect(camera.beta).toBe(3.0);
    });

    it("uses the pole-avoiding fallback range when the camera has no beta limits", () => {
        // No limits present -> clampBeta uses 0.05 .. (π − 0.05). Start beta at
        // the fallback floor and push forward: it must not drop below the floor.
        const { controller, camera } = makeController({
            beta: BETA_MIN_FALLBACK,
            lowerBetaLimit: null,
            upperBetaLimit: null,
        });

        controller.applyCameraOrbit(0, -1.0); // forward, would undershoot the fallback floor

        expect(camera.beta).toBe(BETA_MIN_FALLBACK);
        expect(camera.beta).toBeGreaterThanOrEqual(BETA_MIN_FALLBACK);
        expect(camera.beta).toBeLessThanOrEqual(BETA_MAX_FALLBACK);
    });

    it("marks the arc camera dirty after a beta change", () => {
        const { controller, camera } = makeController();

        controller.applyCameraOrbit(0, 1.0);

        expect(camera.computeWorldMatrix).toHaveBeenCalledWith(true);
    });
});

// ---------------------------------------------------------------------------
// R9.4 - no avatar rotation during orbit
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - orbit never rotates the avatar (R9.4)", () => {
    it("an alpha orbit calls no avatar turn/rotation method", () => {
        const { controller, cc } = makeController();

        controller.applyCameraOrbit(1.0, 0);

        expect(cc.turnLeft).not.toHaveBeenCalled();
        expect(cc.turnRight).not.toHaveBeenCalled();
        expect(cc.turnLeftFast).not.toHaveBeenCalled();
        expect(cc.turnRightFast).not.toHaveBeenCalled();
        expect(cc.turnTo).not.toHaveBeenCalled();
    });

    it("a beta orbit calls no avatar turn/rotation or movement method", () => {
        const { controller, cc } = makeController();

        controller.applyCameraOrbit(0, -1.0);

        expect(cc.turnLeft).not.toHaveBeenCalled();
        expect(cc.turnRight).not.toHaveBeenCalled();
        expect(cc.turnTo).not.toHaveBeenCalled();
        expect(cc.walk).not.toHaveBeenCalled();
        expect(cc.walkBack).not.toHaveBeenCalled();
        expect(cc.strafeLeft).not.toHaveBeenCalled();
        expect(cc.strafeRight).not.toHaveBeenCalled();
    });

    it("orbit does not touch the CharacterController at all", () => {
        const { controller, cc } = makeController();

        controller.applyCameraOrbit(0.8, -0.2);

        for (const fn of Object.values(cc)) {
            expect(fn).not.toHaveBeenCalled();
        }
    });
});

// ---------------------------------------------------------------------------
// R9.3 - dominant-axis gating with ties to alpha (behavior, not the optional
// property test): the larger raw magnitude wins; equal magnitude -> alpha.
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - orbit selects one axis per frame, ties to alpha (R9.3)", () => {
    it("equal-magnitude axes resolve to alpha (beta unchanged)", () => {
        const { controller, camera } = makeController();
        const alpha0 = camera.alpha;
        const beta0 = camera.beta;

        controller.applyCameraOrbit(0.5, -0.5); // |x| == |y| -> alpha wins

        expect(camera.alpha).toBeCloseTo(alpha0 + ALPHA_RATE * 0.5, 12);
        expect(camera.beta).toBe(beta0);
    });

    it("changes only one axis per frame (never both)", () => {
        const { controller, camera } = makeController();
        const alpha0 = camera.alpha;
        const beta0 = camera.beta;

        controller.applyCameraOrbit(0.9, 0.9); // tie -> alpha only

        const alphaChanged = camera.alpha !== alpha0;
        const betaChanged = camera.beta !== beta0;
        expect(alphaChanged).toBe(true);
        expect(betaChanged).toBe(false);
    });
});
