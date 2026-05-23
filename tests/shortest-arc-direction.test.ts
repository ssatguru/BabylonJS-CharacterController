import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: smooth-turning, Property 4: Shortest arc direction
 *
 * Validates: Requirements 2.3
 *
 * Property: For any current avatar rotation `c` and target angle `t`,
 * the rotation applied by smooth turning SHALL always be in the direction
 * of the shortest arc, meaning the absolute angular change is at most π
 * radians from `c` to `t`.
 *
 * The rotation logic under test:
 *   let delta = targetAngle - current;
 *   while (delta > Math.PI) delta -= 2 * Math.PI;
 *   while (delta < -Math.PI) delta += 2 * Math.PI;
 *   const step = Math.min(Math.abs(delta), smoothTurnSpeed * dt);
 *   const sign = delta > 0 ? 1 : -1;
 *   newAngle = current + step * sign;
 */

/**
 * Normalize an angle delta to the range [-PI, PI] using the same
 * algorithm as the production code in _rotateAV2C().
 */
function normalizeDelta(delta: number): number {
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * Simulate one frame of smooth turning rotation logic.
 * Returns the new angle after applying the rotation step.
 */
function computeSmoothTurnStep(
  current: number,
  targetAngle: number,
  smoothTurnSpeed: number,
  dt: number
): { newAngle: number; delta: number; step: number; sign: number } {
  let delta = targetAngle - current;
  // Normalize to [-PI, PI] (shortest arc)
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;

  const step = Math.min(Math.abs(delta), smoothTurnSpeed * dt);
  const sign = delta > 0 ? 1 : -1;
  const newAngle = current + step * sign;

  return { newAngle, delta, step, sign };
}

describe("Feature: smooth-turning, Property 4: Shortest arc direction", () => {
  /**
   * **Validates: Requirements 2.3**
   *
   * The normalized delta (shortest arc) is always in [-π, π].
   * This ensures the rotation direction chosen is always the shortest path.
   */
  it("normalized delta is always in [-π, π] for any angle pair", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        (current, target) => {
          const delta = normalizeDelta(target - current);

          // The normalized delta must be in [-PI, PI]
          expect(delta).toBeGreaterThanOrEqual(-Math.PI);
          expect(delta).toBeLessThanOrEqual(Math.PI);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * The direction of rotation (sign of step applied) always matches
   * the sign of the normalized delta, ensuring we rotate along the
   * shortest arc.
   */
  it("rotation direction matches the sign of the shortest-arc delta", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }), // smoothTurnSpeed (rad/s)
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }), // dt (seconds)
        (current, target, smoothTurnSpeed, dt) => {
          const { delta, newAngle, step, sign } = computeSmoothTurnStep(
            current,
            target,
            smoothTurnSpeed,
            dt
          );

          // Skip the trivial case where delta is exactly 0 (already at target)
          if (Math.abs(delta) < 1e-10) return;

          // The sign of the applied rotation must match the sign of the normalized delta
          const appliedDirection = newAngle - current;

          if (Math.abs(appliedDirection) < 1e-10) return; // step was effectively zero

          // sign(appliedDirection) should equal sign(delta)
          expect(Math.sign(appliedDirection)).toBe(Math.sign(delta));
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * The absolute rotation applied in a single frame is at most π radians,
   * confirming we never take the long way around.
   */
  it("absolute rotation step is at most π radians", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -4 * Math.PI, max: 4 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }), // smoothTurnSpeed (rad/s)
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }), // dt (seconds)
        (current, target, smoothTurnSpeed, dt) => {
          const { newAngle } = computeSmoothTurnStep(current, target, smoothTurnSpeed, dt);

          // The absolute change in angle must be at most π
          const absoluteChange = Math.abs(newAngle - current);
          expect(absoluteChange).toBeLessThanOrEqual(Math.PI + 1e-10); // small epsilon for floating point
        }
      ),
      { numRuns: 200 }
    );
  });
});
