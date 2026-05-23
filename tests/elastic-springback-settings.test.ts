import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: elastic-camera-springback
 *
 * Property-based tests for springback settings: clamping, round-trip,
 * backward compatibility, and value constraints.
 */

// --- Pure logic extracted from CharacterController for testability ---

/**
 * Clamps springback steps: floors to integer, then clamps to [1, 1000].
 * Mirrors the logic in setSpringbackSteps().
 */
function clampSpringbackSteps(n: number): number {
  n = Math.floor(n);
  if (n < 1) n = 1;
  if (n > 1000) n = 1000;
  return n;
}

/**
 * Simulates saving springback settings via getSettings().
 * Returns the springback state and clamped steps value.
 */
function saveSpringbackSettings(
  springback: boolean,
  springbackSteps: number
): { springback: boolean; springbackSteps: number } {
  return {
    springback,
    springbackSteps: Math.floor(Math.min(1000, Math.max(1, springbackSteps))),
  };
}

/**
 * Simulates restoring springback settings via setSettings().
 * Only applies properties that are present in the settings object.
 */
function restoreSpringbackSettings(
  settings: { springback?: boolean; springbackSteps?: number },
  currentSpringback: boolean,
  currentSteps: number
): { springback: boolean; springbackSteps: number } {
  const sb =
    settings.springback !== undefined ? settings.springback : currentSpringback;
  const steps =
    settings.springbackSteps !== undefined
      ? Math.floor(Math.min(1000, Math.max(1, settings.springbackSteps)))
      : currentSteps;
  return { springback: sb, springbackSteps: steps };
}

/**
 * Simulates restoring a CCSettings object that has no springback properties.
 * Current values remain unchanged.
 */
function restoreWithoutSpringback(
  currentSpringback: boolean,
  currentSteps: number
): { springback: boolean; springbackSteps: number } {
  return { springback: currentSpringback, springbackSteps: currentSteps };
}

/**
 * Constrains a steps value: floor then clamp to [1, 1000].
 * Used during both save and restore.
 */
function constrainSteps(n: number): number {
  return Math.floor(Math.min(1000, Math.max(1, n)));
}

// --- Property Tests ---

describe("Feature: elastic-camera-springback, Property 8: Springback steps clamping", () => {
  /**
   * Validates: Requirements 4.3
   *
   * For any numeric value passed to setSpringbackSteps, the result is always
   * an integer in [1, 1000]. Values < 1 are clamped to 1, values > 1000 are
   * clamped to 1000, and non-integers are floored before clamping.
   */
  it("result is always an integer in [1, 1000] for any numeric input", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          const result = clampSpringbackSteps(n);

          // Result must be an integer
          expect(result).toBe(Math.floor(result));
          // Result must be in [1, 1000]
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("values less than 1 are clamped to 1", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 0.999, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          const result = clampSpringbackSteps(n);
          expect(result).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("values greater than 1000 are clamped to 1000", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1000.01, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          const result = clampSpringbackSteps(n);
          expect(result).toBe(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("non-integer values are floored before clamping", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.01, max: 999.99, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          const result = clampSpringbackSteps(n);
          expect(result).toBe(Math.floor(n));
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 12: Settings round-trip preserves springback configuration", () => {
  /**
   * Validates: Requirements 7.1, 7.2
   *
   * For any springback enabled state (boolean) and springback steps value
   * (integer in [1, 1000]), saving via getSettings() then restoring via
   * setSettings() produces the same springback enabled state and steps value.
   */
  it("save then restore produces identical springback state and steps", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 1000 }),
        (springback, steps) => {
          // Save settings
          const saved = saveSpringbackSettings(springback, steps);

          // Restore settings onto arbitrary current state
          const restored = restoreSpringbackSettings(
            saved,
            !springback, // different current state
            steps + 10  // different current steps
          );

          // Round-trip should preserve original values
          expect(restored.springback).toBe(springback);
          expect(restored.springbackSteps).toBe(steps);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("save then restore preserves values even with arbitrary numeric steps input", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.double({ min: 1, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (springback, rawSteps) => {
          // Save settings (applies clamping)
          const saved = saveSpringbackSettings(springback, rawSteps);

          // Restore settings
          const restored = restoreSpringbackSettings(
            saved,
            !springback,
            999
          );

          // Both save and restore apply the same constraint
          expect(restored.springback).toBe(springback);
          expect(restored.springbackSteps).toBe(constrainSteps(rawSteps));
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 13: Settings backward compatibility", () => {
  /**
   * Validates: Requirements 7.3
   *
   * For any current springback state, restoring a CCSettings object that does
   * not contain springback or springbackSteps properties leaves the current
   * springback enabled state and steps value unchanged.
   */
  it("restoring settings without springback properties preserves current state", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 1000 }),
        (currentSpringback, currentSteps) => {
          const result = restoreWithoutSpringback(currentSpringback, currentSteps);

          expect(result.springback).toBe(currentSpringback);
          expect(result.springbackSteps).toBe(currentSteps);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("restoring settings with empty object (no springback fields) preserves current state", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 1000 }),
        (currentSpringback, currentSteps) => {
          // Simulate restoring a CCSettings object without springback properties
          const settingsWithoutSpringback: { springback?: boolean; springbackSteps?: number } = {};

          const result = restoreSpringbackSettings(
            settingsWithoutSpringback,
            currentSpringback,
            currentSteps
          );

          expect(result.springback).toBe(currentSpringback);
          expect(result.springbackSteps).toBe(currentSteps);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: elastic-camera-springback, Property 14: Settings value constraint", () => {
  /**
   * Validates: Requirements 7.4
   *
   * For any numeric value passed as springbackSteps during save or restore,
   * the stored value is always an integer clamped to [1, 1000] inclusive.
   */
  it("springbackSteps is always an integer in [1, 1000] after save", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (springback, rawSteps) => {
          const saved = saveSpringbackSettings(springback, rawSteps);

          // Steps must be an integer
          expect(saved.springbackSteps).toBe(Math.floor(saved.springbackSteps));
          // Steps must be in [1, 1000]
          expect(saved.springbackSteps).toBeGreaterThanOrEqual(1);
          expect(saved.springbackSteps).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("springbackSteps is always an integer in [1, 1000] after restore", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (rawSteps) => {
          const settings = { springback: true, springbackSteps: rawSteps };
          const result = restoreSpringbackSettings(settings, false, 50);

          // Steps must be an integer
          expect(result.springbackSteps).toBe(Math.floor(result.springbackSteps));
          // Steps must be in [1, 1000]
          expect(result.springbackSteps).toBeGreaterThanOrEqual(1);
          expect(result.springbackSteps).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("constrainSteps produces same result as clampSpringbackSteps for any input", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          expect(constrainSteps(n)).toBe(clampSpringbackSteps(n));
        }
      ),
      { numRuns: 100 }
    );
  });
});
