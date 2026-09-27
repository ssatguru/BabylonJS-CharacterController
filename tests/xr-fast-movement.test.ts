import { describe, it, expect, vi, afterEach } from "vitest";
import { XRController } from "../src/xr/XRController";
import { neutralMoveIntent } from "../src/xr/XRLocomotion";
import type { MoveIntent } from "../src/xr/XRLocomotion";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support - unit tests for XRController fast movement, driven by
 * the left-stick pressed (clicked) state (spec task 8.2). Example-based vitest
 * unit tests run entirely against mocks - no real BabylonJS scene, no headset.
 *
 * The fast modifier is NOT part of MoveIntent; XRController derives it from the
 * left-stick pressed state and combines it in applyIntent -> applyMovementDirection,
 * switching each active direction between its normal variant (walk/walkBack/
 * strafeLeft/strafeRight) and its Fast_Movement variant (run/walkBackFast/
 * strafeLeftFast/strafeRightFast).
 *
 * Requirements covered:
 *  - R7.1 WHILE pressed AND a direction is active -> drive the Fast_Movement
 *    variant matching that direction.
 *  - R7.2 WHEN released while a direction remains active -> switch that
 *    direction from its fast variant back to its normal variant.
 *  - R7.3 WHEN the Fast_Movement state changes for an active direction -> stop
 *    the previous-speed method and start the new-speed method; both speeds are
 *    never active at once.
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks
// ---------------------------------------------------------------------------

/** The normal- and fast-speed movement methods XRController drives per direction. */
const NORMAL_METHODS = ["walk", "walkBack", "strafeLeft", "strafeRight"] as const;
const FAST_METHODS = ["run", "walkBackFast", "strafeLeftFast", "strafeRightFast"] as const;

/** Normal method -> its fast counterpart, and vice versa. */
const FAST_OF: Record<string, string> = {
    walk: "run",
    walkBack: "walkBackFast",
    strafeLeft: "strafeLeftFast",
    strafeRight: "strafeRightFast",
};

function makeFakeCC() {
    const cc: Record<string, ReturnType<typeof vi.fn>> = {
        getSettings: vi.fn(() => ({ noFirstPerson: false })),
        setNoFirstPerson: vi.fn(),
    };
    for (const name of [...NORMAL_METHODS, ...FAST_METHODS]) {
        cc[name] = vi.fn();
    }
    return cc;
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
    return { controller, cc };
}

/** Build a MoveIntent with a single direction active. */
function only(direction: keyof MoveIntent): MoveIntent {
    const intent = neutralMoveIntent();
    intent[direction] = true;
    return intent;
}

/** The last boolean a spy was called with, or undefined if never called. */
function lastArg(spy: ReturnType<typeof vi.fn>): boolean | undefined {
    if (spy.mock.calls.length === 0) return undefined;
    return spy.mock.calls[spy.mock.calls.length - 1][0] as boolean;
}

/**
 * Assert that at most one of the two speed channels for a direction is
 * currently "on" (last call was true). Never-called or last-false both count as
 * off. Enforces R7.3's "both are never active at once".
 */
function expectNotBothActive(
    cc: Record<string, ReturnType<typeof vi.fn>>,
    normalName: string,
    fastName: string
): void {
    const normalOn = lastArg(cc[normalName]) === true;
    const fastOn = lastArg(cc[fastName]) === true;
    expect(normalOn && fastOn, `${normalName} and ${fastName} must not both be active`).toBe(false);
}

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// R7.1 - pressed drives the Fast_Movement variant for the active direction
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - fast movement drives the fast variant while pressed (R7.1)", () => {
    it.each(NORMAL_METHODS.map((n) => [n, FAST_OF[n]] as const))(
        "activating %s while pressed starts %s (not the normal variant)",
        (normalName, fastName) => {
            const { controller, cc } = makeController();

            // neutral -> direction active with fast pressed
            controller.applyIntent(only(normalName as keyof MoveIntent), true);

            expect(cc[fastName]).toHaveBeenCalledWith(true);
            expect(cc[normalName]).not.toHaveBeenCalled();
            expectNotBothActive(cc, normalName, fastName);
        }
    );

    it("keeping the same direction+fast held across frames emits no repeat calls (edge-triggered)", () => {
        const { controller, cc } = makeController();

        controller.applyIntent(only("walk"), true);
        controller.applyIntent(only("walk"), true);
        controller.applyIntent(only("walk"), true);

        expect(cc.run).toHaveBeenCalledTimes(1);
        expect(cc.run).toHaveBeenCalledWith(true);
        expect(cc.walk).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// R7.2 / R7.3 - release/press switches normal<->fast for the active direction
// ---------------------------------------------------------------------------

describe("Feature: webxr-support - fast state change switches variants for an active direction (R7.2, R7.3)", () => {
    it.each(NORMAL_METHODS.map((n) => [n, FAST_OF[n]] as const))(
        "releasing the press while %s stays active stops %s and starts %s (R7.2, R7.3)",
        (normalName, fastName) => {
            const { controller, cc } = makeController();

            // Active + pressed -> fast variant on.
            controller.applyIntent(only(normalName as keyof MoveIntent), true);
            expect(cc[fastName]).toHaveBeenLastCalledWith(true);

            // Release while the direction stays active -> fast off, normal on.
            controller.applyIntent(only(normalName as keyof MoveIntent), false);

            expect(cc[fastName]).toHaveBeenLastCalledWith(false); // previous speed stopped
            expect(cc[normalName]).toHaveBeenLastCalledWith(true); // new speed started
            expectNotBothActive(cc, normalName, fastName);
        }
    );

    it.each(NORMAL_METHODS.map((n) => [n, FAST_OF[n]] as const))(
        "pressing while %s stays active stops the normal variant and starts %s (R7.1, R7.3)",
        (normalName, fastName) => {
            const { controller, cc } = makeController();

            // Active + not pressed -> normal variant on.
            controller.applyIntent(only(normalName as keyof MoveIntent), false);
            expect(cc[normalName]).toHaveBeenLastCalledWith(true);

            // Press while the direction stays active -> normal off, fast on.
            controller.applyIntent(only(normalName as keyof MoveIntent), true);

            expect(cc[normalName]).toHaveBeenLastCalledWith(false); // previous speed stopped
            expect(cc[fastName]).toHaveBeenLastCalledWith(true); // new speed started
            expectNotBothActive(cc, normalName, fastName);
        }
    );

    it("toggling the press repeatedly on a held direction never leaves both speeds active (R7.3)", () => {
        const { controller, cc } = makeController();

        const fastSequence = [false, true, false, true, true, false];
        for (const fast of fastSequence) {
            controller.applyIntent(only("walk"), fast);
            expectNotBothActive(cc, "walk", "run");
        }

        // Final state: not pressed -> normal on, fast off.
        expect(lastArg(cc.walk)).toBe(true);
        expect(lastArg(cc.run)).toBe(false);
    });

    it("changing the fast flag with no active direction emits no movement calls", () => {
        const { controller, cc } = makeController();

        controller.applyIntent(neutralMoveIntent(), false);
        controller.applyIntent(neutralMoveIntent(), true);
        controller.applyIntent(neutralMoveIntent(), false);

        for (const name of [...NORMAL_METHODS, ...FAST_METHODS]) {
            expect(cc[name], `${name} must not be called with no active direction`).not.toHaveBeenCalled();
        }
    });

    it("releasing the press AND stopping the direction in one frame stops the fast variant only", () => {
        const { controller, cc } = makeController();

        // Fast + active.
        controller.applyIntent(only("strafeRight"), true);
        expect(cc.strafeRightFast).toHaveBeenLastCalledWith(true);

        // Same frame: direction inactive and press released -> fast off, normal never on.
        controller.applyIntent(neutralMoveIntent(), false);

        expect(cc.strafeRightFast).toHaveBeenLastCalledWith(false);
        expect(cc.strafeRight).not.toHaveBeenCalled();
        expectNotBothActive(cc, "strafeRight", "strafeRightFast");
    });
});
