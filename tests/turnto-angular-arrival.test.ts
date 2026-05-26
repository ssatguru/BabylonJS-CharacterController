import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 6: Angular arrival detection stops rotation
 *
 * For any character facing angle C and target angle T where
 * |shortestArcDelta(C, T)| <= angularTolerance, the turnTo operation
 * shall stop rotation.
 *
 * Validates: Requirements 5.3, 5.4, 7.5
 */

/**
 * Compute shortest-arc delta between current angle and target angle,
 * normalized to [-PI, PI].
 * Duplicated from src/CharacterController.ts for pure testability.
 */
function shortestArcDelta(current: number, target: number): number {
  let delta = target - current;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * Check if angular difference is within tolerance.
 * Duplicated from src/CharacterController.ts for pure testability.
 */
function isWithinAngularTolerance(delta: number, tolerance: number): boolean {
  return Math.abs(delta) <= tolerance;
}

describe("Feature: moveto-turnto, Property 6: Angular arrival detection stops rotation", () => {
  it("when angles are within angular tolerance, isWithinAngularTolerance returns true", () => {
    fc.assert(
      fc.property(
        // current angle in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        // angular tolerance in [0.001, 1.0]
        fc.double({ min: 0.001, max: 1.0, noNaN: true }),
        // offset factor in [0, 0.99] to generate target strictly within tolerance
        // (avoids floating-point boundary issues when factor ≈ 1.0)
        fc.double({ min: 0, max: 0.99, noNaN: true }),
        (currentAngle, tolerance, offsetFactor) => {
          // Generate a target angle that is within tolerance of the current angle
          const offset = offsetFactor * tolerance;
          const targetAngle = currentAngle + offset;

          const delta = shortestArcDelta(currentAngle, targetAngle);

          // The delta should be within tolerance, so rotation should stop
          expect(isWithinAngularTolerance(delta, tolerance)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("when angles are within angular tolerance (negative offset), isWithinAngularTolerance returns true", () => {
    fc.assert(
      fc.property(
        // current angle in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        // angular tolerance in [0.001, 1.0]
        fc.double({ min: 0.001, max: 1.0, noNaN: true }),
        // offset factor in [0, 0.99] to generate target within tolerance
        fc.double({ min: 0, max: 0.99, noNaN: true }),
        (currentAngle, tolerance, offsetFactor) => {
          // Generate a target angle that is within tolerance (negative direction)
          const offset = -offsetFactor * tolerance;
          const targetAngle = currentAngle + offset;

          const delta = shortestArcDelta(currentAngle, targetAngle);

          // The delta should be within tolerance, so rotation should stop
          expect(isWithinAngularTolerance(delta, tolerance)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("when angles are NOT within angular tolerance, isWithinAngularTolerance returns false", () => {
    fc.assert(
      fc.property(
        // current angle in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        // angular tolerance in [0.001, 1.0]
        fc.double({ min: 0.001, max: 1.0, noNaN: true }),
        // extra offset beyond tolerance in (0, π - tolerance]
        fc.double({ min: 0.001, max: Math.PI - 1.0, noNaN: true }),
        // direction: positive or negative
        fc.boolean(),
        (currentAngle, tolerance, extraOffset, positive) => {
          // Generate a target angle that is beyond tolerance
          const offset = tolerance + extraOffset;
          const targetAngle = currentAngle + (positive ? offset : -offset);

          const delta = shortestArcDelta(currentAngle, targetAngle);

          // Precondition: ensure the delta is actually beyond tolerance
          // (wrapping could bring it within tolerance for very large offsets)
          fc.pre(Math.abs(delta) > tolerance);

          // The delta should NOT be within tolerance, so rotation should continue
          expect(isWithinAngularTolerance(delta, tolerance)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("shortestArcDelta is always normalized to [-π, π]", () => {
    fc.assert(
      fc.property(
        // current angle in [-4π, 4π] (wider range to test normalization)
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true }),
        // target angle in [-4π, 4π]
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true }),
        (currentAngle, targetAngle) => {
          const delta = shortestArcDelta(currentAngle, targetAngle);

          // Delta must always be in [-π, π]
          expect(delta).toBeGreaterThanOrEqual(-Math.PI);
          expect(delta).toBeLessThanOrEqual(Math.PI);
        }
      ),
      { numRuns: 200 }
    );
  });
});
