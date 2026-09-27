import { describe, it, expect, vi, afterEach } from "vitest";
import fc from "fast-check";
import { XRController } from "../src/xr/XRController";
import type { XRSupportState } from "../src/xr/XRSupport";

/**
 * Feature: webxr-support, Property 10 - property test for the retained
 * Point_to_Move pick guard (spec task 16.2). Runs entirely against mocks - no
 * real BabylonJS scene, no headset - matching the XRController mocking pattern
 * used by the other `tests/xr-*.test.ts` files.
 *
 * Property 10: Retained point-to-move requires a valid pick.
 *   `handleSelect(pick)` drives the avatar via `cc.moveTo(pickedPoint)` exactly
 *   once when (and only when) the pick is VALID - the pick exists, its `hit` is
 *   truthy (when present), and it carries a usable `pickedPoint` (a Vector3-like
 *   `{ x, y, z }` with all-finite numeric coordinates). For any INVALID pick
 *   (null/undefined, `hit === false`, a missing `pickedPoint`, or non-finite /
 *   non-numeric coordinates), `moveTo` is NOT called.
 *
 * Validates: Requirements 14.2, 14.3
 */

vi.mock("../src/xr/XRSupport", () => ({
    detectXRSupport: vi.fn(async (): Promise<XRSupportState> => ({ vrSupported: true, arSupported: true })),
}));

// ---------------------------------------------------------------------------
// Fakes / mocks (mirrors the shape used by the other xr-*.test.ts files)
// ---------------------------------------------------------------------------

/** A fake CharacterController recording `moveTo` calls via a spy (R14.2). */
function makeFakeCC() {
    return {
        moveTo: vi.fn(),
        jump: vi.fn(),
        getSettings: vi.fn(() => ({ noFirstPerson: false })),
        setNoFirstPerson: vi.fn(),
        isKeyBoardEnabled: vi.fn(() => true),
        enableKeyBoard: vi.fn(),
    };
}

/** A fake ArcRotateCamera - the SUT does not touch it here, but the ctor needs one. */
function makeFakeArcCamera() {
    return {
        __kind: "ArcRotateCamera",
        radius: 10,
        attachControl: vi.fn(),
        computeWorldMatrix: vi.fn(),
    };
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

afterEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** A finite Vector3-like coordinate. */
const finiteNumber = fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true });

/** A valid pick: hit true, pickedPoint with all-finite numeric coords. */
const validPickArb = fc.record({ x: finiteNumber, y: finiteNumber, z: finiteNumber }).map((point) => ({
    kind: "valid" as const,
    pick: { hit: true, pickedPoint: { x: point.x, y: point.y, z: point.z } },
    point,
}));

/** A non-finite / non-numeric coordinate value. */
const badCoord = fc.oneof(
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.constant(undefined),
    fc.constant(null),
    fc.string(),
);

/** A collection of invalid picks - each must NOT trigger moveTo (R14.3). */
const invalidPickArb = fc.oneof(
    // null / undefined pick
    fc.constant({ kind: "invalid" as const, pick: null }),
    fc.constant({ kind: "invalid" as const, pick: undefined }),
    // hit explicitly false, even with a usable point
    fc
        .record({ x: finiteNumber, y: finiteNumber, z: finiteNumber })
        .map((p) => ({ kind: "invalid" as const, pick: { hit: false, pickedPoint: p } })),
    // missing pickedPoint
    fc.constant({ kind: "invalid" as const, pick: { hit: true } }),
    fc.constant({ kind: "invalid" as const, pick: { hit: true, pickedPoint: null } }),
    // non-finite / non-numeric coordinate in at least one axis
    fc
        .record({ good1: finiteNumber, good2: finiteNumber, bad: badCoord, axis: fc.integer({ min: 0, max: 2 }) })
        .map(({ good1, good2, bad, axis }) => {
            const coords = [good1, good2, good2];
            coords[axis] = bad as never;
            const [x, y, z] = coords;
            return { kind: "invalid" as const, pick: { hit: true, pickedPoint: { x, y, z } } };
        }),
);

// ---------------------------------------------------------------------------
// Property 10
// ---------------------------------------------------------------------------

describe("Feature: webxr-support, Property 10 - retained point-to-move requires a valid pick (R14.2, R14.3)", () => {
    it("calls moveTo exactly once with the picked point for a valid pick (R14.2)", () => {
        fc.assert(
            fc.property(validPickArb, ({ pick, point }) => {
                const { controller, cc } = makeController();

                controller.handleSelect(pick as any);

                expect(cc.moveTo).toHaveBeenCalledTimes(1);
                // moveTo receives the picked point itself.
                const arg = cc.moveTo.mock.calls[0][0] as { x: number; y: number; z: number };
                expect(arg.x).toBe(point.x);
                expect(arg.y).toBe(point.y);
                expect(arg.z).toBe(point.z);

                vi.clearAllMocks();
            }),
        );
    });

    it("never calls moveTo for an invalid pick (R14.3)", () => {
        fc.assert(
            fc.property(invalidPickArb, ({ pick }) => {
                const { controller, cc } = makeController();

                controller.handleSelect(pick as any);

                expect(cc.moveTo).not.toHaveBeenCalled();

                vi.clearAllMocks();
            }),
        );
    });

    it("calls moveTo if and only if the pick is valid (mixed stream)", () => {
        fc.assert(
            fc.property(fc.oneof(validPickArb, invalidPickArb), (sample) => {
                const { controller, cc } = makeController();

                controller.handleSelect(sample.pick as any);

                if (sample.kind === "valid") {
                    expect(cc.moveTo).toHaveBeenCalledTimes(1);
                    const arg = cc.moveTo.mock.calls[0][0] as { x: number; y: number; z: number };
                    expect(arg.x).toBe(sample.point.x);
                    expect(arg.y).toBe(sample.point.y);
                    expect(arg.z).toBe(sample.point.z);
                } else {
                    expect(cc.moveTo).not.toHaveBeenCalled();
                }

                vi.clearAllMocks();
            }),
        );
    });
});
