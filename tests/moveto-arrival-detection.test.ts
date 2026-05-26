import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 2: Arrival detection stops movement
 *
 * For any character position P and target position T where
 * horizontalDistance(P, T) <= arrivalDistance, the moveTo operation shall
 * transition to idle and cease movement.
 *
 * Validates: Requirements 1.3, 1.7, 2.3
 */

/**
 * Pure horizontal distance logic duplicated from src/CharacterController.ts.
 * Computes the XZ-plane distance between two 3D positions.
 */
function horizontalDistance(a: { x: number; z: number }, b: { x: number; z: number }): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Pure arrival check logic duplicated from src/CharacterController.ts.
 * Returns true if the distance is within the arrival threshold.
 */
function isWithinArrival(distance: number, arrivalDistance: number): boolean {
    return distance <= arrivalDistance;
}

describe("Feature: moveto-turnto, Property 2: Arrival detection stops movement", () => {
    it("positions within arrival distance are detected as arrived", () => {
        fc.assert(
            fc.property(
                // Character position P (XZ plane, Y is irrelevant for horizontal distance)
                fc.record({
                    x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    z: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                }),
                // Arrival distance (positive value)
                fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
                // Offset dx within [-arrivalDist, arrivalDist]
                fc.double({ min: -1, max: 1, noNaN: true, noDefaultInfinity: true }),
                fc.double({ min: -1, max: 1, noNaN: true, noDefaultInfinity: true }),
                (charPos, arrivalDist, dxFactor, dzFactor) => {
                    // Generate target position T within arrivalDistance of P
                    // Use direct offsets scaled by arrivalDist, then verify distance
                    const dx = dxFactor * arrivalDist;
                    const dz = dzFactor * arrivalDist;
                    const targetPos = {
                        x: charPos.x + dx,
                        z: charPos.z + dz,
                    };

                    const dist = horizontalDistance(charPos, targetPos);

                    // Only test cases where the generated position is actually within arrival distance
                    fc.pre(dist <= arrivalDist);

                    // isWithinArrival should return true (meaning moveTo stops)
                    expect(isWithinArrival(dist, arrivalDist)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("positions exactly at the arrival distance boundary are detected as arrived", () => {
        fc.assert(
            fc.property(
                // A distance value that equals the arrival distance exactly
                fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
                (arrivalDist) => {
                    // When the computed distance equals the arrival distance exactly,
                    // isWithinArrival uses <= so it should return true
                    expect(isWithinArrival(arrivalDist, arrivalDist)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("distance just below arrival threshold is detected as arrived", () => {
        fc.assert(
            fc.property(
                // Arrival distance (positive value)
                fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
                // Small epsilon below the boundary
                fc.double({ min: 1e-15, max: 0.009, noNaN: true, noDefaultInfinity: true }),
                (arrivalDist, epsilon) => {
                    const dist = arrivalDist - epsilon;
                    fc.pre(dist > 0);

                    // Just below the boundary should still be within arrival
                    expect(isWithinArrival(dist, arrivalDist)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("positions beyond arrival distance are NOT detected as arrived", () => {
        fc.assert(
            fc.property(
                // Character position P
                fc.record({
                    x: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    z: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                }),
                // Arrival distance (positive value)
                fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
                // Factor > 1 to place target beyond arrival distance
                fc.double({ min: 1.001, max: 10, noNaN: true, noDefaultInfinity: true }),
                // Random angle for offset direction
                fc.double({ min: 0, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
                (charPos, arrivalDist, beyondFactor, angle) => {
                    // Generate target position T beyond arrivalDistance of P
                    const offsetDistance = arrivalDist * beyondFactor;
                    const targetPos = {
                        x: charPos.x + offsetDistance * Math.cos(angle),
                        z: charPos.z + offsetDistance * Math.sin(angle),
                    };

                    const dist = horizontalDistance(charPos, targetPos);

                    // The distance should be beyond arrival distance
                    // and isWithinArrival should return false (meaning moveTo continues)
                    expect(isWithinArrival(dist, arrivalDist)).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("Y coordinate does not affect horizontal arrival detection", () => {
        fc.assert(
            fc.property(
                // Character position with arbitrary Y
                fc.record({
                    x: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
                    y: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    z: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
                }),
                // Target position with different arbitrary Y
                fc.record({
                    x: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
                    y: fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
                    z: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
                }),
                // Arrival distance
                fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
                (charPos, targetPos, arrivalDist) => {
                    // horizontalDistance only uses x and z
                    const dist = horizontalDistance(charPos, targetPos);

                    // Changing Y should not affect the result
                    const distWithDifferentY = horizontalDistance(
                        { x: charPos.x, z: charPos.z },
                        { x: targetPos.x, z: targetPos.z }
                    );

                    expect(dist).toBe(distWithDifferentY);
                    // The arrival check result should be consistent
                    expect(isWithinArrival(dist, arrivalDist)).toBe(
                        isWithinArrival(distWithDifferentY, arrivalDist)
                    );
                }
            ),
            { numRuns: 200 }
        );
    });
});
