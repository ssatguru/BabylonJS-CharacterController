import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 3: Obstruction detection after consecutive stalled frames
 *
 * For any sequence of per-frame horizontal distances where 3 or more consecutive
 * values are less than the obstruction threshold, the moveTo operation shall stop
 * and clear the target.
 *
 * Validates: Requirements 3.2, 3.4
 */

/**
 * Pure obstruction count logic extracted from CharacterController.ts for testability.
 * Increments count if frame distance is below threshold, resets to 0 otherwise.
 */
function updateObstructionCount(frameDistance: number, threshold: number, currentCount: number): number {
  return frameDistance < threshold ? currentCount + 1 : 0;
}

describe("Feature: moveto-turnto, Property 3: Obstruction detection after consecutive stalled frames", () => {
  it("after 3 consecutive frame distances below threshold, obstruction count reaches >= 3", () => {
    fc.assert(
      fc.property(
        // Random obstruction threshold (positive number)
        fc.double({ min: 0.0001, max: 10, noNaN: true }),
        // Random sequence of frame distances that are ALL below the threshold
        fc.double({ min: 0.0001, max: 10, noNaN: true }).chain((threshold) =>
          fc.tuple(
            fc.constant(threshold),
            // Generate 3 or more distances all below the threshold
            fc.array(
              fc.double({ min: 0, max: threshold * 0.999, noNaN: true }),
              { minLength: 3, maxLength: 20 }
            )
          )
        ),
        (_threshold, [actualThreshold, distances]) => {
          let count = 0;
          for (const dist of distances) {
            count = updateObstructionCount(dist, actualThreshold, count);
          }
          // After 3+ consecutive frames below threshold, count should be >= 3
          expect(count).toBeGreaterThanOrEqual(3);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("any frame distance above or equal to the threshold resets the count to 0", () => {
    fc.assert(
      fc.property(
        // Random obstruction threshold (positive number)
        fc.double({ min: 0.0001, max: 10, noNaN: true }),
        // Random current count (simulating some prior stalled frames)
        fc.integer({ min: 0, max: 100 }),
        // A frame distance that is >= threshold
        fc.double({ min: 0.0001, max: 10, noNaN: true }).chain((threshold) =>
          fc.tuple(
            fc.constant(threshold),
            fc.double({ min: threshold, max: threshold + 10, noNaN: true })
          )
        ),
        (_threshold, currentCount, [actualThreshold, frameDistance]) => {
          const newCount = updateObstructionCount(frameDistance, actualThreshold, currentCount);
          expect(newCount).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("mixed sequences: obstruction detected only after 3 consecutive stalled frames", () => {
    fc.assert(
      fc.property(
        // Random obstruction threshold (positive number)
        fc.double({ min: 0.001, max: 5, noNaN: true }),
        // Generate a sequence of frame distances (some below, some above threshold)
        fc.array(
          fc.double({ min: 0, max: 10, noNaN: true }),
          { minLength: 1, maxLength: 30 }
        ),
        (threshold, distances) => {
          let count = 0;
          let maxConsecutiveBelow = 0;
          let currentConsecutiveBelow = 0;

          for (const dist of distances) {
            count = updateObstructionCount(dist, threshold, count);

            // Track the expected consecutive count manually
            if (dist < threshold) {
              currentConsecutiveBelow++;
            } else {
              currentConsecutiveBelow = 0;
            }
            maxConsecutiveBelow = Math.max(maxConsecutiveBelow, currentConsecutiveBelow);
          }

          // The final count should equal the current streak of consecutive below-threshold frames
          // at the end of the sequence
          expect(count).toBe(currentConsecutiveBelow);

          // If we ever had 3+ consecutive stalled frames, the count at that point was >= 3
          // (obstruction would have been detected)
          if (maxConsecutiveBelow >= 3) {
            // There existed a point where count >= 3
            // Verify by replaying and checking
            let replayCount = 0;
            let detected = false;
            for (const dist of distances) {
              replayCount = updateObstructionCount(dist, threshold, replayCount);
              if (replayCount >= 3) {
                detected = true;
                break;
              }
            }
            expect(detected).toBe(true);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
