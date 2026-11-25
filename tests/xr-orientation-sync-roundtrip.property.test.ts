import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveArcAngles, clampBetaValue } from "../src/xr/XROrientationSync";

/**
 * Feature: xr-first-person-camera-sync, Round-trip property: deriveArcAngles is
 * the exact inverse of the arc->XR orientation mirror.
 *
 * Validates: Requirements 1.1, 2.1, 2.3
 *
 * Background (the ~90 degree first-person bug this proves is fixed):
 * The follow/seed path in `XRController.ts` uses BabylonJS's
 * `ArcRotateCamera.setTransformationFromNonVRCamera(arc, true)` to place the XR
 * camera AT the arc camera's pose. That mirror makes the XR camera's world Euler
 * yaw/pitch (what `rotationQuaternion.toEulerAngles()` reports) a fixed function
 * of the arc `alpha`/`beta`:
 *
 *   FORWARD MIRROR (ArcRotateCamera looking from position toward target,
 *   BabylonJS left-handed convention, verified against real-device behavior):
 *     yaw   = -alpha + PI/2      (alpha anti-clockwise around +Y from +X;
 *                                 view yaw clockwise from +Z)
 *     pitch =  beta  - PI/2      (beta elevation from +Y in 0..PI;
 *                                 pitch Euler X, positive looks up)
 *
 * The XR->arc sync must be the INVERSE of this mirror, otherwise the arc alpha
 * it writes is offset (and wrong-handed), which (a) leaves the avatar rotated
 * ~90 degrees via `_av2cam - alpha`, and (b) makes the right-stick orbit start
 * from an offset alpha (snap, then smooth). We prove `deriveArcAngles` inverts
 * the forward mirror below.
 *
 * The forward mirror is defined here in the TEST (not imported) so the test is
 * an independent statement of the convention we verified against BabylonJS docs
 * (alpha = longitudinal rotation around Y; beta = latitudinal/elevation). If the
 * production helpers drift, this round trip fails.
 */

/** Forward mirror: (alpha, beta) -> the world (yaw, pitch) the mirror produces. */
function mirrorArcToWorld(alpha: number, beta: number): { yaw: number; pitch: number } {
    return { yaw: -alpha + Math.PI / 2, pitch: beta - Math.PI / 2 };
}

/** Normalize an angle into (-PI, PI], matching the module's internal normalization. */
function normalizeAngle(angle: number): number {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** True when two angles are equal modulo 2*PI within eps. */
function anglesCloseMod2Pi(a: number, b: number, eps: number): boolean {
    const d = normalizeAngle(a - b);
    return Math.abs(d) <= eps;
}

const EPS = 1e-9;

// Wide, pole-avoiding beta limits so an in-range beta is never clamped in the
// round-trip. Matches the controller's fallback range (0.05 .. PI-0.05) used by
// `_resolveBetaLimits`.
const WIDE_LIMITS = { lower: 0.05, upper: Math.PI - 0.05 };

describe("Feature: xr-first-person-camera-sync - deriveArcAngles inverts the arc->XR mirror", () => {
    it("round-trips (alpha, beta) -> mirror world (yaw, pitch) -> deriveArcAngles back to (alpha, beta)", () => {
        fc.assert(
            fc.property(
                // alpha over a full turn (normalized on the way out).
                fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
                // beta strictly inside the pole-avoiding limits so no clamp fires.
                fc.double({ min: WIDE_LIMITS.lower + 1e-3, max: WIDE_LIMITS.upper - 1e-3, noNaN: true }),
                (alpha, beta) => {
                    const world = mirrorArcToWorld(alpha, beta);
                    const back = deriveArcAngles(world, WIDE_LIMITS);

                    // Alpha equals the original modulo 2*PI (module normalizes to (-PI, PI]).
                    expect(anglesCloseMod2Pi(back.alpha, alpha, 1e-7)).toBe(true);
                    // Beta is untouched by the clamp here and equals the original.
                    expect(Math.abs(back.beta - beta)).toBeLessThanOrEqual(1e-9);
                },
            ),
            { numRuns: 300 },
        );
    });

    it("the derived alpha is normalized into (-PI, PI]", () => {
        fc.assert(
            fc.property(fc.double({ min: -100, max: 100, noNaN: true }), (yaw) => {
                const { alpha } = deriveArcAngles({ yaw, pitch: 0 }, WIDE_LIMITS);
                expect(alpha).toBeGreaterThan(-Math.PI - EPS);
                expect(alpha).toBeLessThanOrEqual(Math.PI + EPS);
            }),
            { numRuns: 300 },
        );
    });

    it("beta beyond the limits is clamped, matching clampBetaValue on the raw pitch->beta mapping", () => {
        fc.assert(
            fc.property(
                fc.double({ min: -10, max: 10, noNaN: true }),
                fc.double({ min: 0.01, max: Math.PI / 2 - 0.01, noNaN: true }),
                fc.double({ min: Math.PI / 2 + 0.01, max: Math.PI - 0.01, noNaN: true }),
                (pitch, lower, upper) => {
                    const limits = { lower, upper };
                    const { beta } = deriveArcAngles({ yaw: 0, pitch }, limits);
                    // Always within bounds.
                    expect(beta).toBeGreaterThanOrEqual(lower - EPS);
                    expect(beta).toBeLessThanOrEqual(upper + EPS);
                    // Equal to clamping the raw inverse mapping (beta = pitch + PI/2).
                    const expected = clampBetaValue(pitch + Math.PI / 2, limits);
                    expect(Math.abs(beta - expected)).toBeLessThanOrEqual(1e-9);
                },
            ),
            { numRuns: 300 },
        );
    });
});
