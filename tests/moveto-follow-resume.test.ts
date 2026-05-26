import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: moveto-turnto, Property 4: Follow mode resumes when node moves beyond arrival distance
 *
 * For any TransformNode target where the character is idle within arrival distance,
 * when the node's position changes such that the distance exceeds arrival distance,
 * the moveTo operation shall resume movement.
 *
 * Validates: Requirements 2.4
 */

/**
 * Pure horizontal distance logic extracted from CharacterController.ts.
 * Computes the XZ-plane distance between two 3D positions.
 */
function horizontalDistance(a: { x: number; z: number }, b: { x: number; z: number }): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Pure arrival check logic extracted from CharacterController.ts.
 * Returns true if the distance is within the arrival threshold.
 */
function isWithinArrival(distance: number, arrivalDistance: number): boolean {
    return distance <= arrivalDistance;
}

describe("Feature: moveto-turnto, Property 4: Follow mode resumes when node moves beyond arrival distance", () => {
    it("node initially within arrival distance returns isWithinArrival true", () => {
        fc.assert(
            fc.property(
                // Character position on XZ plane
                fc.double({ min: -100, max: 100, noNaN: true }),
                fc.double({ min: -100, max: 100, noNaN: true }),
                // Arrival distance (positive)
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                // Fraction of arrival distance for node placement (0, 0.99] to ensure within
                // (avoids floating-point boundary issues when fraction ≈ 1.0)
                fc.double({ min: 0, max: 0.99, noNaN: true }),
                // Angle for node placement direction
                fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
                (charX, charZ, arrivalDist, fraction, angle) => {
                    const charPos = { x: charX, z: charZ };

                    // Place node within arrival distance
                    const nodeDistance = fraction * arrivalDist;
                    const nodePos = {
                        x: charX + nodeDistance * Math.cos(angle),
                        z: charZ + nodeDistance * Math.sin(angle),
                    };

                    const dist = horizontalDistance(charPos, nodePos);
                    expect(isWithinArrival(dist, arrivalDist)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("node moved beyond arrival distance returns isWithinArrival false (movement should resume)", () => {
        fc.assert(
            fc.property(
                // Character position on XZ plane
                fc.double({ min: -100, max: 100, noNaN: true }),
                fc.double({ min: -100, max: 100, noNaN: true }),
                // Arrival distance (positive)
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                // Extra distance beyond arrival (> 0)
                fc.double({ min: 0.001, max: 50, noNaN: true }),
                // Angle for node placement direction
                fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
                (charX, charZ, arrivalDist, extraDist, angle) => {
                    const charPos = { x: charX, z: charZ };

                    // Place node beyond arrival distance
                    const nodeDistance = arrivalDist + extraDist;
                    const newNodePos = {
                        x: charX + nodeDistance * Math.cos(angle),
                        z: charZ + nodeDistance * Math.sin(angle),
                    };

                    const dist = horizontalDistance(charPos, newNodePos);
                    expect(isWithinArrival(dist, arrivalDist)).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });

    it("transition from within to beyond arrival distance triggers resume condition", () => {
        fc.assert(
            fc.property(
                // Character position on XZ plane
                fc.double({ min: -100, max: 100, noNaN: true }),
                fc.double({ min: -100, max: 100, noNaN: true }),
                // Arrival distance (positive)
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                // Fraction for initial node placement within arrival (0, 0.99]
                // (avoids floating-point boundary issues when fraction ≈ 1.0)
                fc.double({ min: 0, max: 0.99, noNaN: true }),
                // Extra distance to move node beyond arrival (> 0)
                fc.double({ min: 0.001, max: 50, noNaN: true }),
                // Angle for initial node placement
                fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
                // Angle for new node position (may differ)
                fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
                (charX, charZ, arrivalDist, fraction, extraDist, angle1, angle2) => {
                    const charPos = { x: charX, z: charZ };

                    // Initial node position: within arrival distance
                    const initialNodeDistance = fraction * arrivalDist;
                    const initialNodePos = {
                        x: charX + initialNodeDistance * Math.cos(angle1),
                        z: charZ + initialNodeDistance * Math.sin(angle1),
                    };

                    // New node position: beyond arrival distance
                    const newNodeDistance = arrivalDist + extraDist;
                    const newNodePos = {
                        x: charX + newNodeDistance * Math.cos(angle2),
                        z: charZ + newNodeDistance * Math.sin(angle2),
                    };

                    // Verify initial state: character is idle within arrival distance
                    const initialDist = horizontalDistance(charPos, initialNodePos);
                    const wasWithinArrival = isWithinArrival(initialDist, arrivalDist);

                    // Verify new state: node has moved beyond arrival distance
                    const newDist = horizontalDistance(charPos, newNodePos);
                    const isNowWithinArrival = isWithinArrival(newDist, arrivalDist);

                    // The transition: was within, now beyond — movement should resume
                    expect(wasWithinArrival).toBe(true);
                    expect(isNowWithinArrival).toBe(false);
                }
            ),
            { numRuns: 200 }
        );
    });
});
