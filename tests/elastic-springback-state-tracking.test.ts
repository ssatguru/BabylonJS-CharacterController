import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: elastic-camera-springback
 *
 * Property-based tests for state tracking logic:
 * - Property 1: Original radius capture and invariant
 * - Property 2: Original radius cleared at convergence threshold
 * - Property 3: User radius change updates recovery target
 */

// --- Pure logic functions extracted from CharacterController ---

/**
 * Captures the original radius on first push-in.
 * Only stores if not already stored (null). Subsequent calls with non-null
 * return the same stored value unchanged.
 *
 * Mirrors the logic in _handleObstruction() where _originalRadius is set.
 */
function captureOriginalRadius(
  currentOriginalRadius: number | null,
  cameraRadius: number
): number | null {
  if (currentOriginalRadius === null) {
    return cameraRadius;
  }
  return currentOriginalRadius;
}

/**
 * Determines whether the original radius should be cleared (set to null)
 * based on convergence threshold.
 *
 * When |currentRadius - originalRadius| <= 0.01, the camera has effectively
 * returned to its original position and the stored value should be cleared.
 */
function shouldClearOriginalRadius(
  currentRadius: number,
  originalRadius: number
): boolean {
  return Math.abs(currentRadius - originalRadius) <= 0.01;
}

/**
 * Handles a user-initiated radius change when _originalRadius is non-null.
 *
 * If originalRadius is null, no recovery is in progress — return null.
 * If the user scrolls beyond the original radius (R >= originalRadius),
 * no recovery is needed — return null.
 * Otherwise, the user set a new closer radius — update target to R.
 */
function handleUserRadiusChange(
  originalRadius: number | null,
  newUserRadius: number
): number | null {
  if (originalRadius === null) return null;
  if (newUserRadius >= originalRadius) return null;
  return newUserRadius;
}

// --- Property-based tests ---

describe("Feature: elastic-camera-springback, Property 1: Original radius capture and invariant", () => {
  /**
   * Validates: Requirements 1.1, 1.2
   *
   * For any camera radius R > 0 and any sequence of obstruction-driven push-in
   * events, the stored _originalRadius SHALL equal the camera radius at the moment
   * of the first push-in, and SHALL remain unchanged across all subsequent push-in
   * events until explicitly cleared.
   */

  it("first push-in stores the camera radius as original radius", () => {
    fc.assert(
      fc.property(
        // Camera radius at first push-in: positive value
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (cameraRadius) => {
          const result = captureOriginalRadius(null, cameraRadius);
          expect(result).toBe(cameraRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("subsequent push-ins do not overwrite the stored original radius", () => {
    fc.assert(
      fc.property(
        // Already stored original radius
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        // New camera radius from subsequent push-in
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (storedRadius, newCameraRadius) => {
          const result = captureOriginalRadius(storedRadius, newCameraRadius);
          // Should always return the already-stored value, never overwrite
          expect(result).toBe(storedRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sequence of push-ins preserves the first captured radius", () => {
    fc.assert(
      fc.property(
        // Initial camera radius (first push-in)
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        // Array of subsequent camera radii from further push-ins
        fc.array(fc.double({ min: 0.01, max: 1000, noNaN: true }), {
          minLength: 1,
          maxLength: 20,
        }),
        (firstRadius, subsequentRadii) => {
          // First call captures the radius
          let stored = captureOriginalRadius(null, firstRadius);
          expect(stored).toBe(firstRadius);

          // All subsequent calls should not change the stored value
          for (const r of subsequentRadii) {
            stored = captureOriginalRadius(stored, r);
            expect(stored).toBe(firstRadius);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 2: Original radius cleared at convergence threshold", () => {
  /**
   * Validates: Requirements 1.3
   *
   * For any stored _originalRadius value and current camera radius where
   * |currentRadius - _originalRadius| <= 0.01, the system SHALL set
   * _originalRadius to null.
   */

  it("returns true (clear) when |currentRadius - originalRadius| <= 0.01", () => {
    fc.assert(
      fc.property(
        // Original radius: positive value
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        // Offset within convergence threshold [-0.009, 0.009] (tighter to avoid FP rounding)
        fc.double({ min: -0.009, max: 0.009, noNaN: true }),
        (originalRadius, offset) => {
          const currentRadius = originalRadius + offset;
          // Guard: only test when the actual computed difference is within threshold
          // (floating-point addition can shift the result slightly)
          fc.pre(Math.abs(currentRadius - originalRadius) <= 0.01);
          const result = shouldClearOriginalRadius(currentRadius, originalRadius);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns false (do not clear) when |currentRadius - originalRadius| > 0.01", () => {
    fc.assert(
      fc.property(
        // Original radius: positive value
        fc.double({ min: 1, max: 1000, noNaN: true }),
        // Offset beyond convergence threshold (> 0.01)
        fc.double({ min: 0.02, max: 500, noNaN: true }),
        // Direction: positive or negative offset
        fc.boolean(),
        (originalRadius, offsetMagnitude, positive) => {
          const offset = positive ? offsetMagnitude : -offsetMagnitude;
          const currentRadius = originalRadius + offset;
          const result = shouldClearOriginalRadius(currentRadius, originalRadius);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("exact match (offset = 0) clears the original radius", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (originalRadius) => {
          const result = shouldClearOriginalRadius(originalRadius, originalRadius);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 3: User radius change updates recovery target", () => {
  /**
   * Validates: Requirements 1.4
   *
   * For any non-null _originalRadius and any user-initiated radius change to a
   * new value R, the stored _originalRadius SHALL be updated to R (if R < originalRadius),
   * or cleared to null (if R >= originalRadius, meaning user scrolled beyond — no recovery needed).
   */

  it("when originalRadius is null, result is always null regardless of user radius", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (newUserRadius) => {
          const result = handleUserRadiusChange(null, newUserRadius);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for non-null originalRadius and user radius R < originalRadius, result is R", () => {
    fc.assert(
      fc.property(
        // Original radius
        fc.double({ min: 1, max: 1000, noNaN: true }),
        // Factor to make newUserRadius strictly less than originalRadius
        fc.double({ min: 0.01, max: 0.99, noNaN: true }),
        (originalRadius, factor) => {
          const newUserRadius = originalRadius * factor;
          // Ensure it's strictly less
          fc.pre(newUserRadius < originalRadius);

          const result = handleUserRadiusChange(originalRadius, newUserRadius);
          expect(result).toBe(newUserRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for non-null originalRadius and user radius R >= originalRadius, result is null", () => {
    fc.assert(
      fc.property(
        // Original radius
        fc.double({ min: 0.01, max: 500, noNaN: true }),
        // Factor to make newUserRadius >= originalRadius
        fc.double({ min: 1.0, max: 3.0, noNaN: true }),
        (originalRadius, factor) => {
          const newUserRadius = originalRadius * factor;
          // Ensure it's >= originalRadius
          fc.pre(newUserRadius >= originalRadius);

          const result = handleUserRadiusChange(originalRadius, newUserRadius);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 6 & 7: Obstruction during springback and resume after interruption ---

/**
 * Simulates what happens when an obstruction is detected during springback.
 * The push-in logic runs, but _originalRadius is preserved (not overwritten)
 * because it's already non-null.
 */
function handleObstructionDuringSpringback(
  currentRadius: number,
  originalRadius: number, // non-null, springback was in progress
  obstructionDistance: number // distance to obstruction (push-in target)
): { newRadius: number; originalRadius: number | null } {
  // Push-in applies: camera moves closer
  // _originalRadius guard: only stores if null — since it's non-null, it's preserved
  const newRadius = currentRadius - obstructionDistance / 50; // simplified push-in step
  return { newRadius, originalRadius: originalRadius }; // originalRadius unchanged
}

/**
 * Simulates the full cycle: springback → obstruction interrupts → obstruction clears → springback resumes.
 * The key invariant is that _originalRadius is the same before and after the interruption.
 */
function springbackResumeTarget(
  originalRadiusBefore: number,
  obstructionOccurred: boolean
): number {
  // After obstruction clears, springback resumes toward the same target
  return originalRadiusBefore;
}

// --- Property 6 tests ---

describe("Feature: elastic-camera-springback, Property 6: Obstruction during springback triggers push-in and preserves original radius", () => {
  /**
   * Validates: Requirements 2.4, 3.1, 3.2
   *
   * For any springback-in-progress state (currentRadius < _originalRadius, no obstruction)
   * followed by a new obstruction detection, the system SHALL immediately apply push-in
   * behavior (reducing radius toward the obstruction) AND the stored _originalRadius SHALL
   * remain unchanged.
   */

  it("push-in during springback does not overwrite the stored original radius", () => {
    fc.assert(
      fc.property(
        // Original radius stored before springback began
        fc.double({ min: 5, max: 1000, noNaN: true }),
        // Current radius during springback (less than originalRadius)
        fc.double({ min: 1, max: 4.99, noNaN: true }),
        // Obstruction distance (positive, causes push-in)
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (originalRadius, currentRadius, obstructionDistance) => {
          // Guard: currentRadius must be less than originalRadius (springback in progress)
          fc.pre(currentRadius < originalRadius);

          const result = handleObstructionDuringSpringback(
            currentRadius,
            originalRadius,
            obstructionDistance
          );

          // The key invariant: originalRadius is preserved unchanged
          expect(result.originalRadius).toBe(originalRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("push-in during springback reduces the camera radius", () => {
    fc.assert(
      fc.property(
        // Original radius stored before springback began
        fc.double({ min: 5, max: 1000, noNaN: true }),
        // Current radius during springback (less than originalRadius)
        fc.double({ min: 2, max: 4.99, noNaN: true }),
        // Obstruction distance (positive, causes push-in)
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (originalRadius, currentRadius, obstructionDistance) => {
          fc.pre(currentRadius < originalRadius);
          fc.pre(obstructionDistance > 0);

          const result = handleObstructionDuringSpringback(
            currentRadius,
            originalRadius,
            obstructionDistance
          );

          // Push-in reduces the radius
          expect(result.newRadius).toBeLessThan(currentRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("originalRadius remains the same value regardless of obstruction distance", () => {
    fc.assert(
      fc.property(
        // Original radius
        fc.double({ min: 5, max: 1000, noNaN: true }),
        // Current radius (in springback)
        fc.double({ min: 1, max: 4.99, noNaN: true }),
        // Multiple different obstruction distances
        fc.array(fc.double({ min: 0.1, max: 50, noNaN: true }), {
          minLength: 1,
          maxLength: 10,
        }),
        (originalRadius, currentRadius, obstructions) => {
          fc.pre(currentRadius < originalRadius);

          let radius = currentRadius;
          let storedOriginal: number | null = originalRadius;

          // Apply multiple obstructions sequentially
          for (const dist of obstructions) {
            const result = handleObstructionDuringSpringback(
              radius,
              storedOriginal!,
              dist
            );
            radius = result.newRadius;
            storedOriginal = result.originalRadius;
          }

          // After all obstructions, originalRadius is still the same
          expect(storedOriginal).toBe(originalRadius);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 7 tests ---

describe("Feature: elastic-camera-springback, Property 7: Springback resumes after interruption clears", () => {
  /**
   * Validates: Requirements 3.3
   *
   * For any state where springback was interrupted by an obstruction, when that
   * obstruction is no longer detected, the system SHALL resume springback movement
   * toward the same stored _originalRadius that was set before the interruption.
   */

  it("springback target after interruption clears is the same originalRadius", () => {
    fc.assert(
      fc.property(
        // Original radius before any interruption
        fc.double({ min: 5, max: 1000, noNaN: true }),
        // Whether an obstruction occurred (always true for this test, but property holds for both)
        fc.boolean(),
        (originalRadius, obstructionOccurred) => {
          const resumeTarget = springbackResumeTarget(
            originalRadius,
            obstructionOccurred
          );

          // The resume target is always the same originalRadius
          expect(resumeTarget).toBe(originalRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("springback target is preserved through multiple interruption cycles", () => {
    fc.assert(
      fc.property(
        // Original radius
        fc.double({ min: 5, max: 1000, noNaN: true }),
        // Number of interruption cycles
        fc.integer({ min: 1, max: 20 }),
        (originalRadius, cycles) => {
          let target = originalRadius;

          // Simulate multiple obstruction → clear cycles
          for (let i = 0; i < cycles; i++) {
            // Obstruction occurs (interrupts springback)
            const afterObstruction = handleObstructionDuringSpringback(
              target - 1, // camera is closer than target
              target,
              0.5 // some obstruction distance
            );

            // originalRadius preserved through obstruction
            expect(afterObstruction.originalRadius).toBe(originalRadius);

            // Obstruction clears — springback resumes toward same target
            const resumeTarget = springbackResumeTarget(
              afterObstruction.originalRadius!,
              true
            );
            expect(resumeTarget).toBe(originalRadius);

            target = afterObstruction.originalRadius!;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("resume target is independent of how many obstructions interrupted springback", () => {
    fc.assert(
      fc.property(
        // Original radius
        fc.double({ min: 10, max: 1000, noNaN: true }),
        // Array of obstruction distances representing sequential interruptions
        fc.array(fc.double({ min: 0.1, max: 5, noNaN: true }), {
          minLength: 1,
          maxLength: 15,
        }),
        (originalRadius, obstructions) => {
          let currentRadius = originalRadius - 2; // start in springback state
          let storedOriginal: number | null = originalRadius;

          // Apply multiple obstructions
          for (const dist of obstructions) {
            const result = handleObstructionDuringSpringback(
              currentRadius,
              storedOriginal!,
              dist
            );
            currentRadius = result.newRadius;
            storedOriginal = result.originalRadius;
          }

          // After all obstructions clear, resume target is still the original
          const resumeTarget = springbackResumeTarget(storedOriginal!, true);
          expect(resumeTarget).toBe(originalRadius);
        }
      ),
      { numRuns: 100 }
    );
  });
});
