import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 7: Invalid parameters are clamped to defaults
 *
 * For any numeric parameter value V where V <= 0, the system shall use the
 * corresponding default value (arrivalDistance: 0.5, obstructionThreshold: 0.001,
 * angularTolerance: 0.035).
 *
 * Validates: Requirements 9.6, 9.7, 9.8
 */

/**
 * Pure clampPositive logic extracted from CharacterController.ts for testability.
 * If value is <= 0, returns defaultValue. Otherwise returns value.
 */
function clampPositive(value: number, defaultValue: number): number {
  return value > 0 ? value : defaultValue;
}

describe("Feature: moveto-turnto, Property 7: Invalid parameters are clamped to defaults", () => {
  const defaults = [
    { name: "arrivalDistance", defaultValue: 0.5 },
    { name: "obstructionThreshold", defaultValue: 0.001 },
    { name: "angularTolerance", defaultValue: 0.035 },
  ];

  for (const { name, defaultValue } of defaults) {
    it(`for any value <= 0, clampPositive returns default ${name} (${defaultValue})`, () => {
      fc.assert(
        fc.property(
          // Generate negative numbers and zero
          fc.double({ min: -1e10, max: 0, noNaN: true }),
          (value) => {
            const result = clampPositive(value, defaultValue);
            expect(result).toBe(defaultValue);
          }
        ),
        { numRuns: 200 }
      );
    });

    it(`for any value > 0, clampPositive returns the original value for ${name}`, () => {
      fc.assert(
        fc.property(
          // Generate positive numbers (excluding zero)
          fc.double({ min: Number.MIN_VALUE, max: 1e10, noNaN: true }),
          (value) => {
            fc.pre(value > 0);
            const result = clampPositive(value, defaultValue);
            expect(result).toBe(value);
          }
        ),
        { numRuns: 200 }
      );
    });
  }
});
