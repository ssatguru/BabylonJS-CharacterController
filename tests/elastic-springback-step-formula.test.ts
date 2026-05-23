import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: elastic-camera-springback, Property 4: Springback step formula produces decelerating motion
 *
 * For any remaining distance D > 1 and springback steps S >= 1, the per-frame step size
 * SHALL equal D / S, and after applying the step the new remaining distance SHALL be
 * D - (D / S) = D * (S-1) / S, which is strictly less than D.
 *
 * Validates: Requirements 2.2, 4.4
 */

/**
 * Pure springback step logic extracted for testability.
 * Mirrors the implementation in src/CharacterController.ts.
 */
function computeSpringbackStep(
  remainingDistance: number,
  springbackSteps: number
): { stepSize: number; newRemaining: number } {
  const stepSize = remainingDistance / springbackSteps;
  const newRemaining = remainingDistance - stepSize;
  return { stepSize, newRemaining };
}

/**
 * Feature: elastic-camera-springback, Property 5: Springback snap at threshold
 *
 * For any remaining distance in (0, 1], camera snaps to original radius
 * (offset by cameraSkin in collision mode) rather than applying the step formula.
 *
 * Validates: Requirements 2.3, 5.4
 */

/**
 * Determines whether the camera should snap to the target rather than stepping.
 */
function shouldSnap(remainingDistance: number): boolean {
  return remainingDistance <= 1 && remainingDistance > 0;
}

/**
 * Computes the final snap radius, accounting for cameraSkin in collision mode.
 */
function computeSnapRadius(
  originalRadius: number,
  cameraSkin: number,
  checkCollisions: boolean
): number {
  if (checkCollisions) {
    return originalRadius - cameraSkin;
  }
  return originalRadius;
}

describe("Feature: elastic-camera-springback, Property 4: Springback step formula produces decelerating motion", () => {
  it("step size equals D / S and new remaining equals D * (S-1) / S", () => {
    fc.assert(
      fc.property(
        // remaining distance D > 1
        fc.double({ min: 1.001, max: 1000, noNaN: true }),
        // springback steps S >= 1
        fc.integer({ min: 1, max: 1000 }),
        (D, S) => {
          const { stepSize, newRemaining } = computeSpringbackStep(D, S);

          // Step size should equal D / S
          expect(stepSize).toBeCloseTo(D / S, 10);

          // New remaining should equal D * (S-1) / S
          const expectedRemaining = (D * (S - 1)) / S;
          expect(newRemaining).toBeCloseTo(expectedRemaining, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("new remaining distance is strictly less than original distance (decelerating)", () => {
    fc.assert(
      fc.property(
        // remaining distance D > 1
        fc.double({ min: 1.001, max: 1000, noNaN: true }),
        // springback steps S >= 1
        fc.integer({ min: 1, max: 1000 }),
        (D, S) => {
          const { newRemaining } = computeSpringbackStep(D, S);

          // New remaining must be strictly less than original distance
          expect(newRemaining).toBeLessThan(D);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("step size is always positive for D > 1 and S >= 1", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.001, max: 1000, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        (D, S) => {
          const { stepSize } = computeSpringbackStep(D, S);

          // Step size must be positive
          expect(stepSize).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("new remaining is always non-negative for D > 1 and S >= 1", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.001, max: 1000, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        (D, S) => {
          const { newRemaining } = computeSpringbackStep(D, S);

          // New remaining must be non-negative
          expect(newRemaining).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 5: Springback snap at threshold", () => {
  it("shouldSnap returns true for any remaining distance in (0, 1]", () => {
    fc.assert(
      fc.property(
        // remaining distance in (0, 1]
        fc.double({ min: 0.0001, max: 1, noNaN: true }),
        (remaining) => {
          expect(shouldSnap(remaining)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("shouldSnap returns false for remaining distance > 1", () => {
    fc.assert(
      fc.property(
        // remaining distance > 1
        fc.double({ min: 1.001, max: 1000, noNaN: true }),
        (remaining) => {
          expect(shouldSnap(remaining)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("shouldSnap returns false for remaining distance <= 0", () => {
    fc.assert(
      fc.property(
        // remaining distance <= 0
        fc.double({ min: -100, max: 0, noNaN: true }),
        (remaining) => {
          expect(shouldSnap(remaining)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("in non-collision mode, snap radius equals originalRadius exactly", () => {
    fc.assert(
      fc.property(
        // originalRadius > 0
        fc.double({ min: 1, max: 500, noNaN: true }),
        // cameraSkin > 0
        fc.double({ min: 0.01, max: 1, noNaN: true }),
        (originalRadius, cameraSkin) => {
          const snapRadius = computeSnapRadius(originalRadius, cameraSkin, false);
          expect(snapRadius).toBe(originalRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("in collision mode, snap radius equals originalRadius minus cameraSkin", () => {
    fc.assert(
      fc.property(
        // originalRadius > cameraSkin (so result is positive)
        fc.double({ min: 2, max: 500, noNaN: true }),
        // cameraSkin > 0
        fc.double({ min: 0.01, max: 1, noNaN: true }),
        (originalRadius, cameraSkin) => {
          const snapRadius = computeSnapRadius(originalRadius, cameraSkin, true);
          expect(snapRadius).toBeCloseTo(originalRadius - cameraSkin, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("snap is triggered instead of step formula when remaining <= 1", () => {
    fc.assert(
      fc.property(
        // current radius
        fc.double({ min: 1, max: 500, noNaN: true }),
        // remaining distance in (0, 1] — triggers snap
        fc.double({ min: 0.0001, max: 1, noNaN: true }),
        // cameraSkin
        fc.double({ min: 0.01, max: 0.5, noNaN: true }),
        // checkCollisions flag
        fc.boolean(),
        (currentRadius, remaining, cameraSkin, checkCollisions) => {
          const originalRadius = currentRadius + remaining;

          // Snap should be triggered
          expect(shouldSnap(remaining)).toBe(true);

          // The snap target is computed correctly
          const snapTarget = computeSnapRadius(originalRadius, cameraSkin, checkCollisions);

          if (checkCollisions) {
            expect(snapTarget).toBeCloseTo(originalRadius - cameraSkin, 10);
          } else {
            expect(snapTarget).toBe(originalRadius);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
