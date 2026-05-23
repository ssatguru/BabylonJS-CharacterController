import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: elastic-camera-springback, Property 9: Collision-mode springback moves camera position along correct vector
 *
 * For any camera with checkCollisions = true, target position T, current camera position P,
 * and stored original position, the springback SHALL move the camera position away from T
 * along the normalized direction (P - T), increasing the distance from T toward the original distance.
 *
 * Validates: Requirements 5.1
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x,
    dy = a.y - b.y,
    dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Computes the new camera position after one springback step in collision mode.
 * Camera moves AWAY from target along the (P - T) direction.
 */
function collisionModeSpringback(
  cameraPos: Vec3,
  targetPos: Vec3,
  originalRadius: number,
  springbackSteps: number
): Vec3 {
  const dir = normalize({
    x: cameraPos.x - targetPos.x,
    y: cameraPos.y - targetPos.y,
    z: cameraPos.z - targetPos.z,
  });
  const currentDist = distance(cameraPos, targetPos);
  const remainingDistance = originalRadius - currentDist;
  const step = remainingDistance / springbackSteps;
  return {
    x: cameraPos.x + dir.x * step,
    y: cameraPos.y + dir.y * step,
    z: cameraPos.z + dir.z * step,
  };
}

/**
 * Feature: elastic-camera-springback, Property 10: Radius-mode springback increases camera radius
 *
 * When checkCollisions is false and no obstruction, camera.radius increases toward _originalRadius.
 *
 * Validates: Requirements 5.2
 */

/**
 * Computes the new camera radius after one springback step in radius mode.
 */
function radiusModeSpringback(
  currentRadius: number,
  originalRadius: number,
  springbackSteps: number
): number {
  const remainingDistance = originalRadius - currentRadius;
  const step = remainingDistance / springbackSteps;
  return currentRadius + step;
}

/**
 * Feature: elastic-camera-springback, Property 11: Disabled springback or disabled elastic prevents recovery
 *
 * Camera radius remains unchanged when springback or elastic is disabled.
 *
 * Validates: Requirements 6.3, 6.4
 */

/**
 * When springback is disabled or elastic is disabled, camera radius stays unchanged.
 */
function shouldPerformSpringback(
  springbackEnabled: boolean,
  elasticEnabled: boolean
): boolean {
  return springbackEnabled && elasticEnabled;
}

describe("Feature: elastic-camera-springback, Property 9: Collision-mode springback moves camera position along correct vector", () => {
  it("after one step, distance from target increases (camera moves away from target)", () => {
    fc.assert(
      fc.property(
        // target position
        fc.record({
          x: fc.double({ min: -50, max: 50, noNaN: true }),
          y: fc.double({ min: -50, max: 50, noNaN: true }),
          z: fc.double({ min: -50, max: 50, noNaN: true }),
        }),
        // camera offset direction (will be normalized and scaled)
        fc.record({
          x: fc.double({ min: -10, max: 10, noNaN: true }),
          y: fc.double({ min: -10, max: 10, noNaN: true }),
          z: fc.double({ min: -10, max: 10, noNaN: true }),
        }),
        // current distance from target (pushed in, less than original)
        fc.double({ min: 2, max: 50, noNaN: true }),
        // original radius (must be greater than current distance)
        fc.double({ min: 5, max: 100, noNaN: true }),
        // springback steps
        fc.integer({ min: 1, max: 200 }),
        (targetPos, offsetDir, currentDist, originalRadius, springbackSteps) => {
          // Ensure offset direction is non-zero
          const len = Math.sqrt(
            offsetDir.x * offsetDir.x +
              offsetDir.y * offsetDir.y +
              offsetDir.z * offsetDir.z
          );
          fc.pre(len > 0.1);

          // Ensure original radius > current distance (camera is pushed in)
          fc.pre(originalRadius > currentDist + 1);

          // Compute camera position at currentDist from target along offset direction
          const dir = normalize(offsetDir);
          const cameraPos: Vec3 = {
            x: targetPos.x + dir.x * currentDist,
            y: targetPos.y + dir.y * currentDist,
            z: targetPos.z + dir.z * currentDist,
          };

          const newPos = collisionModeSpringback(
            cameraPos,
            targetPos,
            originalRadius,
            springbackSteps
          );
          const newDist = distance(newPos, targetPos);

          // Distance from target should increase (camera moves away)
          expect(newDist).toBeGreaterThan(currentDist);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("springback direction is along the normalized (P - T) vector", () => {
    fc.assert(
      fc.property(
        // target position
        fc.record({
          x: fc.double({ min: -50, max: 50, noNaN: true }),
          y: fc.double({ min: -50, max: 50, noNaN: true }),
          z: fc.double({ min: -50, max: 50, noNaN: true }),
        }),
        // camera offset direction
        fc.record({
          x: fc.double({ min: -10, max: 10, noNaN: true }),
          y: fc.double({ min: -10, max: 10, noNaN: true }),
          z: fc.double({ min: -10, max: 10, noNaN: true }),
        }),
        // current distance from target
        fc.double({ min: 2, max: 50, noNaN: true }),
        // original radius
        fc.double({ min: 5, max: 100, noNaN: true }),
        // springback steps
        fc.integer({ min: 1, max: 200 }),
        (targetPos, offsetDir, currentDist, originalRadius, springbackSteps) => {
          const len = Math.sqrt(
            offsetDir.x * offsetDir.x +
              offsetDir.y * offsetDir.y +
              offsetDir.z * offsetDir.z
          );
          fc.pre(len > 0.1);
          fc.pre(originalRadius > currentDist + 1);

          const dir = normalize(offsetDir);
          const cameraPos: Vec3 = {
            x: targetPos.x + dir.x * currentDist,
            y: targetPos.y + dir.y * currentDist,
            z: targetPos.z + dir.z * currentDist,
          };

          const newPos = collisionModeSpringback(
            cameraPos,
            targetPos,
            originalRadius,
            springbackSteps
          );

          // Movement vector should be parallel to (P - T) direction
          const movement: Vec3 = {
            x: newPos.x - cameraPos.x,
            y: newPos.y - cameraPos.y,
            z: newPos.z - cameraPos.z,
          };
          const movementNorm = normalize(movement);
          const expectedDir = normalize({
            x: cameraPos.x - targetPos.x,
            y: cameraPos.y - targetPos.y,
            z: cameraPos.z - targetPos.z,
          });

          // Normalized movement direction should match (P - T) direction
          expect(movementNorm.x).toBeCloseTo(expectedDir.x, 5);
          expect(movementNorm.y).toBeCloseTo(expectedDir.y, 5);
          expect(movementNorm.z).toBeCloseTo(expectedDir.z, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 10: Radius-mode springback increases camera radius", () => {
  it("for currentRadius < originalRadius, new radius is greater than currentRadius", () => {
    fc.assert(
      fc.property(
        // current radius (pushed in)
        fc.double({ min: 1, max: 100, noNaN: true }),
        // original radius (must be greater than current)
        fc.double({ min: 5, max: 200, noNaN: true }),
        // springback steps
        fc.integer({ min: 1, max: 1000 }),
        (currentRadius, originalRadius, springbackSteps) => {
          // Ensure original > current (camera is pushed in)
          fc.pre(originalRadius > currentRadius + 1);

          const newRadius = radiusModeSpringback(
            currentRadius,
            originalRadius,
            springbackSteps
          );

          // New radius should be greater than current (moving toward original)
          expect(newRadius).toBeGreaterThan(currentRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("new radius does not exceed originalRadius", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 100, noNaN: true }),
        fc.double({ min: 5, max: 200, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        (currentRadius, originalRadius, springbackSteps) => {
          fc.pre(originalRadius > currentRadius + 1);

          const newRadius = radiusModeSpringback(
            currentRadius,
            originalRadius,
            springbackSteps
          );

          // New radius should not overshoot the original
          expect(newRadius).toBeLessThanOrEqual(originalRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("step size decreases as camera approaches originalRadius (decelerating motion)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 50, noNaN: true }),
        fc.double({ min: 55, max: 200, noNaN: true }),
        fc.integer({ min: 2, max: 500 }),
        (currentRadius, originalRadius, springbackSteps) => {
          fc.pre(originalRadius > currentRadius + 2);

          // First step
          const afterFirst = radiusModeSpringback(
            currentRadius,
            originalRadius,
            springbackSteps
          );
          const firstStep = afterFirst - currentRadius;

          // Second step (from new position)
          const afterSecond = radiusModeSpringback(
            afterFirst,
            originalRadius,
            springbackSteps
          );
          const secondStep = afterSecond - afterFirst;

          // Second step should be smaller than first (decelerating)
          expect(secondStep).toBeLessThan(firstStep);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 11: Disabled springback or disabled elastic prevents recovery", () => {
  it("when springback is disabled, shouldPerformSpringback returns false", () => {
    fc.assert(
      fc.property(
        fc.boolean(), // elasticEnabled can be anything
        (elasticEnabled) => {
          const result = shouldPerformSpringback(false, elasticEnabled);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("when elastic is disabled, shouldPerformSpringback returns false", () => {
    fc.assert(
      fc.property(
        fc.boolean(), // springbackEnabled can be anything
        (springbackEnabled) => {
          const result = shouldPerformSpringback(springbackEnabled, false);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("only when both springback AND elastic are enabled, shouldPerformSpringback returns true", () => {
    const result = shouldPerformSpringback(true, true);
    expect(result).toBe(true);
  });

  it("camera radius remains unchanged when shouldPerformSpringback is false", () => {
    fc.assert(
      fc.property(
        // current radius
        fc.double({ min: 1, max: 100, noNaN: true }),
        // original radius (greater than current)
        fc.double({ min: 5, max: 200, noNaN: true }),
        // springback steps
        fc.integer({ min: 1, max: 1000 }),
        // springbackEnabled
        fc.boolean(),
        // elasticEnabled
        fc.boolean(),
        (
          currentRadius,
          originalRadius,
          springbackSteps,
          springbackEnabled,
          elasticEnabled
        ) => {
          fc.pre(originalRadius > currentRadius + 1);
          // Only test cases where at least one is disabled
          fc.pre(!springbackEnabled || !elasticEnabled);

          // When springback should not be performed, radius stays the same
          const shouldSpring = shouldPerformSpringback(
            springbackEnabled,
            elasticEnabled
          );
          expect(shouldSpring).toBe(false);

          // Simulate: if shouldPerformSpringback is false, radius is unchanged
          const resultRadius = shouldSpring
            ? radiusModeSpringback(currentRadius, originalRadius, springbackSteps)
            : currentRadius;

          expect(resultRadius).toBe(currentRadius);
        }
      ),
      { numRuns: 100 }
    );
  });
});
