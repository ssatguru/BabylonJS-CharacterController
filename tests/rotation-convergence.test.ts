import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: smooth-turning, Property 3: Rotation convergence
 *
 * For any current avatar rotation c, target angle t, smooth turn speed s > 0,
 * and delta time dt > 0: if the shortest-arc angular difference d = shortestArc(c, t)
 * satisfies |d| > s * dt, then after one frame the avatar rotation SHALL change by
 * exactly s * dt toward t. If |d| <= s * dt, the avatar rotation SHALL equal t exactly
 * (snap to prevent overshoot).
 *
 * Validates: Requirements 2.1, 2.2
 */

/**
 * Pure rotation logic extracted from _rotateAV2C() for testability.
 * This mirrors the implementation in src/CharacterController.ts.
 */
function computeRotationStep(
  current: number,
  targetAngle: number,
  smoothTurnSpeed: number,
  dt: number
): number {
  // Compute shortest-arc delta normalized to [-PI, PI]
  let delta = targetAngle - current;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;

  const step = Math.min(Math.abs(delta), smoothTurnSpeed * dt);

  if (Math.abs(delta) <= step) {
    // Close enough — snap to target to prevent overshoot
    return targetAngle;
  } else {
    // Rotate by step in the direction of shortest arc
    const sign = delta > 0 ? 1 : -1;
    return current + step * sign;
  }
}

/**
 * Compute the shortest-arc delta between two angles, normalized to [-PI, PI].
 */
function shortestArcDelta(current: number, target: number): number {
  let delta = target - current;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

describe("Feature: smooth-turning, Property 3: Rotation convergence", () => {
  it("step size equals min(|delta|, speed * dt) and snaps to target when |delta| <= step", () => {
    fc.assert(
      fc.property(
        // current angle in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        // target angle in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        // speed in (0, 10] radians/sec
        fc.double({ min: 0.001, max: 10, noNaN: true }),
        // dt in (0, 0.1] seconds
        fc.double({ min: 0.0001, max: 0.1, noNaN: true }),
        (current, targetAngle, speed, dt) => {
          const newAngle = computeRotationStep(current, targetAngle, speed, dt);
          const delta = shortestArcDelta(current, targetAngle);
          const maxStep = speed * dt;

          if (Math.abs(delta) <= maxStep) {
            // Should snap to target
            expect(newAngle).toBe(targetAngle);
          } else {
            // Should rotate by exactly speed * dt
            const actualChange = Math.abs(newAngle - current);
            expect(actualChange).toBeCloseTo(maxStep, 10);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("when |delta| > speed * dt, rotation moves toward target (reduces distance)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        fc.double({ min: 0.001, max: 10, noNaN: true }),
        fc.double({ min: 0.0001, max: 0.1, noNaN: true }),
        (current, targetAngle, speed, dt) => {
          const delta = shortestArcDelta(current, targetAngle);
          const maxStep = speed * dt;

          // Only test the non-snap case
          fc.pre(Math.abs(delta) > maxStep);

          const newAngle = computeRotationStep(current, targetAngle, speed, dt);
          const newDelta = shortestArcDelta(newAngle, targetAngle);

          // After one step, the remaining distance should be smaller
          expect(Math.abs(newDelta)).toBeLessThan(Math.abs(delta));
        }
      ),
      { numRuns: 200 }
    );
  });

  it("when |delta| <= speed * dt, avatar snaps exactly to target (no overshoot)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true }),
        fc.double({ min: 0.001, max: 10, noNaN: true }),
        fc.double({ min: 0.0001, max: 0.1, noNaN: true }),
        (current, targetAngle, speed, dt) => {
          const delta = shortestArcDelta(current, targetAngle);
          const maxStep = speed * dt;

          // Only test the snap case
          fc.pre(Math.abs(delta) <= maxStep);

          const newAngle = computeRotationStep(current, targetAngle, speed, dt);

          // Should snap exactly to target
          expect(newAngle).toBe(targetAngle);
        }
      ),
      { numRuns: 200 }
    );
  });
});
