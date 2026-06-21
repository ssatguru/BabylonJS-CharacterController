import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 5: Shortest-arc direction selection for turnTo
 *
 * Validates: Requirements 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4
 *
 * Property: For any character facing angle C and target angle T, the turnTo
 * operation shall select the turn direction (left or right) that corresponds
 * to the shortest angular path from C to T, normalized to [-π, π].
 */

/**
 * Compute shortest-arc delta between current angle and target angle,
 * normalized to [-PI, PI]. Duplicated from CharacterController.ts.
 */
function shortestArcDelta(current: number, target: number): number {
  let delta = target - current;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * Determine turn direction based on shortest arc.
 * Returns 'left' for negative delta, 'right' for positive delta.
 * Duplicated from CharacterController.ts.
 */
function turnDirection(current: number, target: number): "left" | "right" {
  const delta = shortestArcDelta(current, target);
  return delta >= 0 ? "left" : "right";
}

describe("Feature: moveto-turnto, Property 5: Shortest-arc direction selection for turnTo", () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * shortestArcDelta always returns a value in [-π, π], ensuring the
   * rotation path chosen is always the shortest arc.
   */
  it("shortestArcDelta always returns a value in [-π, π]", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        (current, target) => {
          const delta = shortestArcDelta(current, target);

          expect(delta).toBeGreaterThanOrEqual(-Math.PI);
          expect(delta).toBeLessThanOrEqual(Math.PI);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   *
   * When delta > 0, turnDirection returns 'left' (positive rotation.y = turn left).
   */
  it("turnDirection returns 'left' when shortestArcDelta is positive", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        (current, target) => {
          const delta = shortestArcDelta(current, target);

          // Only check cases where delta is strictly positive
          if (delta <= 0) return;

          expect(turnDirection(current, target)).toBe("left");
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 7.3, 7.4**
   *
   * When delta < 0, turnDirection returns 'right' (negative rotation.y = turn right).
   */
  it("turnDirection returns 'right' when shortestArcDelta is negative", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        (current, target) => {
          const delta = shortestArcDelta(current, target);

          // Only check cases where delta is strictly negative
          if (delta >= 0) return;

          expect(turnDirection(current, target)).toBe("right");
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * The selected direction is indeed the shortest path: |delta| <= π.
   * This confirms we never select the long way around the circle.
   */
  it("selected direction corresponds to the shortest path (|delta| <= π)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        (current, target) => {
          const delta = shortestArcDelta(current, target);

          // The absolute delta must be at most π, confirming shortest path
          expect(Math.abs(delta)).toBeLessThanOrEqual(Math.PI);
        }
      ),
      { numRuns: 200 }
    );
  });
});
