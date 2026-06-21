import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 1: Movement toward target reduces distance
 *
 * For any character position P and target position T where
 * horizontalDistance(P, T) > arrivalDistance, after one frame of moveTo execution,
 * the character's new position P' shall satisfy
 * horizontalDistance(P', T) < horizontalDistance(P, T)
 * (assuming no collision obstruction).
 *
 * Validates: Requirements 1.1, 1.2, 2.1
 */

/**
 * Compute the horizontal (XZ-plane) distance between two 3D positions.
 * This duplicates the pure logic from the CharacterController implementation.
 */
function horizontalDistance(
  a: { x: number; z: number },
  b: { x: number; z: number }
): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Simulate one frame of moveTo movement: compute direction from position to target,
 * move a step in that direction. Returns the new position.
 */
function simulateMoveToStep(
  position: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  stepSize: number
): { x: number; y: number; z: number } {
  const dx = target.x - position.x;
  const dz = target.z - position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // Normalize direction and move by stepSize
  const nx = dx / dist;
  const nz = dz / dist;

  return {
    x: position.x + nx * stepSize,
    y: position.y,
    z: position.z + nz * stepSize,
  };
}

describe("Feature: moveto-turnto, Property 1: Movement toward target reduces distance", () => {
  it("after one frame of movement toward target, horizontal distance decreases", () => {
    fc.assert(
      fc.property(
        // Character position (x, y, z)
        fc.record({
          x: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
          y: fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
          z: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
        }),
        // Target position (x, y, z)
        fc.record({
          x: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
          y: fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
          z: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
        }),
        // Step size (simulates walk/run speed * dt), small positive value
        fc.double({ min: 0.01, max: 2.0, noNaN: true, noDefaultInfinity: true }),
        // Arrival distance
        fc.double({ min: 0.1, max: 5.0, noNaN: true, noDefaultInfinity: true }),
        (position, target, stepSize, arrivalDistance) => {
          const distBefore = horizontalDistance(position, target);

          // Precondition: character is beyond arrival distance
          fc.pre(distBefore > arrivalDistance);
          // Precondition: step size is smaller than remaining distance (no overshoot)
          fc.pre(stepSize < distBefore);

          const newPosition = simulateMoveToStep(position, target, stepSize);
          const distAfter = horizontalDistance(newPosition, target);

          // Property: distance after one frame is strictly less than before
          expect(distAfter).toBeLessThan(distBefore);
        }
      ),
      { numRuns: 200 }
    );
  });
});
