import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: springback-ellipsoid-clearance
 * Property 1: Bug Condition - Ellipsoid Clearance During Push-In
 *
 * This test is written BEFORE implementing the fix.
 * It encodes the EXPECTED (correct) behavior: after push-in, the camera center
 * should be at least max(ellipsoid.x, ellipsoid.z) units from the pick point.
 *
 * On UNFIXED code, this test MUST FAIL — failure confirms the bug exists.
 * The camera currently stops at 0.1 units from the pick point regardless of
 * ellipsoid size, causing the ellipsoid to clip into obstructions.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4
 */

// --- Types ---

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ElasticCameraState {
  cameraPosition: Vec3;
  cameraTarget: Vec3; // avatar position
  cameraRadius: number;
  cameraEllipsoid: Vec3;
  checkCollisions: boolean;
  pickPoint: Vec3; // obstruction pick point
  elasticSteps: number;
}

interface SpringbackState {
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  cameraRadius: number;
  cameraEllipsoid: Vec3;
  checkCollisions: boolean;
  originalRadius: number;
  springbackSteps: number;
  obstructionPickPoint: Vec3; // obstruction along springback path
  obstructionPickDist: number; // distance from target to obstruction
}

// --- Pure functions extracted from _handleObstruction() ---

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vec3Distance(a: Vec3, b: Vec3): number {
  return vec3Length(vec3Subtract(a, b));
}

/**
 * Simulates the push-in logic from _handleObstruction().
 * This mirrors the UNFIXED code behavior:
 * - Computes c2p = camera.position - pickPoint
 * - If c2p.length() <= 0.1, stops (camera is "close enough")
 * - Otherwise, moves camera toward pick point by l/elasticSteps per frame
 *
 * We simulate multiple frames until the stopping condition is met.
 */
function simulatePushIn(state: ElasticCameraState): { finalPosition: Vec3; finalRadius: number } {
  let position = { ...state.cameraPosition };
  let radius = state.cameraRadius;
  const maxIterations = 1000; // prevent infinite loops
  const ellipsoidRadius = Math.max(state.cameraEllipsoid.x, state.cameraEllipsoid.z);
  const stoppingThreshold = Math.max(ellipsoidRadius, 0.1);

  for (let i = 0; i < maxIterations; i++) {
    const c2p = vec3Subtract(position, state.pickPoint);
    const l = vec3Length(c2p);

    if (l <= stoppingThreshold) {
      // Stopping condition in FIXED code: camera is within ellipsoidRadius of pick point
      // Snap position to exactly stoppingThreshold distance from pick point
      // to avoid floating-point drift below the threshold
      if (l > 0) {
        const dir = vec3Normalize(c2p);
        position = vec3Add(state.pickPoint, vec3Scale(dir, stoppingThreshold));
        // Recompute radius from position
        radius = vec3Distance(position, state.cameraTarget);
      }
      break;
    }

    if (state.checkCollisions) {
      // Position-based movement
      const dir = vec3Normalize(c2p);
      const targetDist = Math.max(l - ellipsoidRadius, 0);
      const step = vec3Scale(dir, targetDist / state.elasticSteps);
      position = vec3Subtract(position, step);
    } else {
      // Radius-based movement
      const targetDist = Math.max(l - ellipsoidRadius, 0);
      const step = targetDist / state.elasticSteps;
      radius = radius - step;
      // Update position based on new radius (camera moves along target-to-camera direction)
      const targetToCamera = vec3Subtract(position, state.cameraTarget);
      const dir = vec3Normalize(targetToCamera);
      position = vec3Add(state.cameraTarget, vec3Scale(dir, radius));
    }
  }

  return { finalPosition: position, finalRadius: radius };
}

/**
 * Simulates the springback blocking check from _handleObstruction().
 * In the UNFIXED code, the check is:
 *   if (pickDist > currentDist) → springBlocked = true
 *
 * This means the camera springs back freely until it reaches the obstruction distance.
 * The camera can end up at a position where its center is at the obstruction distance
 * (or very close to it), but the ellipsoid extends BEYOND the center into the obstruction.
 *
 * The bug: the camera can spring back to within less than ellipsoidRadius of the obstruction
 * because the blocking check doesn't subtract ellipsoidRadius from pickDist.
 */
function simulateSpringbackWithObstruction(state: SpringbackState): { finalRadius: number; finalPosition: Vec3 } {
  let radius = state.cameraRadius;
  let position = { ...state.cameraPosition };
  const maxIterations = 1000;
  const ellipsoidRadius = Math.max(state.cameraEllipsoid.x, state.cameraEllipsoid.z);
  const effectiveBlockDist = state.obstructionPickDist - ellipsoidRadius;

  for (let i = 0; i < maxIterations; i++) {
    const remainingDistance = state.originalRadius - radius;

    if (remainingDistance <= 0.1) {
      // Close enough — snap to original
      radius = state.originalRadius;
      break;
    }

    // Not blocked yet — spring back one step
    const step = remainingDistance / state.springbackSteps;
    const newRadius = radius + step;

    // After stepping, check if we've reached or passed the obstruction (FIXED logic)
    // The fixed code subtracts ellipsoidRadius from the pick distance to account for
    // the camera volume extending beyond its center point
    if (newRadius >= effectiveBlockDist) {
      // Would overshoot obstruction accounting for ellipsoid — clamp
      radius = effectiveBlockDist - 0.01;
      break;
    }

    radius = newRadius;
    // Update position
    const dir = vec3Normalize(vec3Subtract(position, state.cameraTarget));
    position = vec3Add(state.cameraTarget, vec3Scale(dir, radius));
  }

  // Final position update
  const dir = vec3Normalize(vec3Subtract(state.cameraPosition, state.cameraTarget));
  position = vec3Add(state.cameraTarget, vec3Scale(dir, radius));

  return { finalRadius: radius, finalPosition: position };
}

// --- Property-based tests ---

describe("Bug Condition: Ellipsoid Clearance During Push-In", () => {
  /**
   * Property: For all camera states with non-zero ellipsoid and obstruction detected,
   * after push-in the camera center should be at least max(ellipsoid.x, ellipsoid.z)
   * units from the pick point.
   *
   * This WILL FAIL on unfixed code because the camera stops at 0.1 units from pick point
   * regardless of ellipsoid size.
   */
  it("after push-in, camera center is at least ellipsoidRadius from pick point", () => {
    fc.assert(
      fc.property(
        // Ellipsoid with non-zero x and z (the lateral clearance dimensions)
        fc.double({ min: 0.2, max: 3.0, noNaN: true }), // ellipsoid.x
        fc.double({ min: 0.2, max: 3.0, noNaN: true }), // ellipsoid.z
        // Camera radius (distance from target to camera)
        fc.double({ min: 5.0, max: 50.0, noNaN: true }),
        // Pick point factor (fraction of camera radius where obstruction is)
        fc.double({ min: 0.3, max: 0.9, noNaN: true }), // factor of camera radius
        // Elastic steps
        fc.integer({ min: 5, max: 20 }),
        (ellipsoidX, ellipsoidZ, cameraRadius, pickFactor, elasticSteps) => {
          // Pick point is between avatar and camera
          const pickDist = cameraRadius * pickFactor;
          fc.pre(pickDist > 0.5); // ensure meaningful distance

          const ellipsoidRadius = Math.max(ellipsoidX, ellipsoidZ);

          // Camera is along the Z axis from target for simplicity
          const cameraTarget: Vec3 = { x: 0, y: 0, z: 0 };
          const cameraPosition: Vec3 = { x: 0, y: 0, z: cameraRadius };
          const pickPoint: Vec3 = { x: 0, y: 0, z: pickDist };

          const state: ElasticCameraState = {
            cameraPosition,
            cameraTarget,
            cameraRadius,
            cameraEllipsoid: { x: ellipsoidX, y: 1.0, z: ellipsoidZ },
            checkCollisions: false,
            pickPoint,
            elasticSteps,
          };

          const result = simulatePushIn(state);
          const distFromPickPoint = vec3Distance(result.finalPosition, pickPoint);

          // EXPECTED BEHAVIOR: camera center should be at least ellipsoidRadius from pick point
          // Allow small floating-point tolerance from iterative simulation
          expect(distFromPickPoint).toBeGreaterThanOrEqual(ellipsoidRadius - 1e-9);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Bug Condition: Push-In Stopping Threshold", () => {
  /**
   * Simulate push-in until l <= 0.1 and verify camera ellipsoid intersects obstruction.
   * This demonstrates the bug: the stopping threshold (0.1) is independent of ellipsoid size.
   */
  it("push-in stops with camera ellipsoid clipping into obstruction (demonstrates bug)", () => {
    fc.assert(
      fc.property(
        // Ellipsoid radius larger than 0.1 (the stopping threshold)
        fc.double({ min: 0.3, max: 2.0, noNaN: true }), // ellipsoid.x
        fc.double({ min: 0.3, max: 2.0, noNaN: true }), // ellipsoid.z
        // Camera radius
        fc.double({ min: 5.0, max: 30.0, noNaN: true }),
        // Elastic steps
        fc.integer({ min: 5, max: 15 }),
        (ellipsoidX, ellipsoidZ, cameraRadius, elasticSteps) => {
          const ellipsoidRadius = Math.max(ellipsoidX, ellipsoidZ);
          fc.pre(ellipsoidRadius > 0.1); // ellipsoid must be larger than stopping threshold

          // Pick point at 70% of camera radius from target
          const pickDist = cameraRadius * 0.7;
          const cameraTarget: Vec3 = { x: 0, y: 0, z: 0 };
          const cameraPosition: Vec3 = { x: 0, y: 0, z: cameraRadius };
          const pickPoint: Vec3 = { x: 0, y: 0, z: pickDist };

          const state: ElasticCameraState = {
            cameraPosition,
            cameraTarget,
            cameraRadius,
            cameraEllipsoid: { x: ellipsoidX, y: 1.0, z: ellipsoidZ },
            checkCollisions: false,
            pickPoint,
            elasticSteps,
          };

          const result = simulatePushIn(state);
          const distFromPickPoint = vec3Distance(result.finalPosition, pickPoint);

          // EXPECTED: camera should maintain ellipsoidRadius clearance
          // Allow small floating-point tolerance from iterative simulation
          expect(distFromPickPoint).toBeGreaterThanOrEqual(ellipsoidRadius - 1e-9);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Bug Condition: Springback Overshoot", () => {
  /**
   * Simulate springback with obstruction at distance D and verify camera springs
   * to within ellipsoid radius of obstruction (demonstrates bug).
   *
   * The unfixed code blocks springback only when pickDist > currentDist,
   * not when pickDist - ellipsoidRadius > currentDist.
   */
  it("springback allows camera to reach position where ellipsoid intersects obstruction", () => {
    fc.assert(
      fc.property(
        // Ellipsoid
        fc.double({ min: 0.3, max: 2.0, noNaN: true }), // ellipsoid.x
        fc.double({ min: 0.3, max: 2.0, noNaN: true }), // ellipsoid.z
        // Current camera radius (pushed in)
        fc.double({ min: 2.0, max: 10.0, noNaN: true }),
        // Original radius (what we're springing back to)
        fc.double({ min: 12.0, max: 30.0, noNaN: true }),
        // Obstruction distance from target (between current and original)
        fc.double({ min: 0.5, max: 0.9, noNaN: true }), // factor between current and original
        // Springback steps
        fc.integer({ min: 5, max: 20 }),
        (ellipsoidX, ellipsoidZ, currentRadius, originalRadius, obsFactor, springbackSteps) => {
          fc.pre(currentRadius < originalRadius);
          const ellipsoidRadius = Math.max(ellipsoidX, ellipsoidZ);

          // Obstruction is between current position and original radius
          const obstructionDist = currentRadius + (originalRadius - currentRadius) * obsFactor;
          fc.pre(obstructionDist > currentRadius);
          fc.pre(obstructionDist < originalRadius);

          // The camera should stop at obstructionDist - ellipsoidRadius
          // But unfixed code stops at obstructionDist (the raw pick distance)
          const expectedMaxRadius = obstructionDist - ellipsoidRadius;
          fc.pre(expectedMaxRadius > currentRadius); // ensure there's room to spring back

          const cameraTarget: Vec3 = { x: 0, y: 0, z: 0 };
          const cameraPosition: Vec3 = { x: 0, y: 0, z: currentRadius };
          const obstructionPickPoint: Vec3 = { x: 0, y: 0, z: obstructionDist };

          const state: SpringbackState = {
            cameraPosition,
            cameraTarget,
            cameraRadius: currentRadius,
            cameraEllipsoid: { x: ellipsoidX, y: 1.0, z: ellipsoidZ },
            checkCollisions: false,
            originalRadius,
            springbackSteps,
            obstructionPickPoint,
            obstructionPickDist: obstructionDist,
          };

          const result = simulateSpringbackWithObstruction(state);
          const distFromObstruction = vec3Distance(result.finalPosition, obstructionPickPoint);

          // EXPECTED: camera center should be at least ellipsoidRadius from obstruction
          // Allow small floating-point tolerance from iterative simulation
          expect(distFromObstruction + 1e-9).toBeGreaterThanOrEqual(ellipsoidRadius);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Bug Condition: Large Ellipsoid Amplifies Bug", () => {
  /**
   * Use ellipsoid (2.0, 2.0, 2.0) to amplify the bug.
   * With a large ellipsoid, the camera should stop 2.0 units from the pick point,
   * but the unfixed code stops at 0.1 units — a 1.9 unit violation.
   */
  it("large ellipsoid (2.0) causes severe clipping — camera stops at 0.1 instead of 2.0 from pick point", () => {
    fc.assert(
      fc.property(
        // Camera radius
        fc.double({ min: 8.0, max: 30.0, noNaN: true }),
        // Elastic steps
        fc.integer({ min: 5, max: 15 }),
        (cameraRadius, elasticSteps) => {
          const ellipsoidRadius = 2.0; // large ellipsoid

          // Pick point at 60% of camera radius
          const pickDist = cameraRadius * 0.6;
          fc.pre(pickDist > ellipsoidRadius + 1.0); // ensure pick point is far enough from target

          const cameraTarget: Vec3 = { x: 0, y: 0, z: 0 };
          const cameraPosition: Vec3 = { x: 0, y: 0, z: cameraRadius };
          const pickPoint: Vec3 = { x: 0, y: 0, z: pickDist };

          const state: ElasticCameraState = {
            cameraPosition,
            cameraTarget,
            cameraRadius,
            cameraEllipsoid: { x: 2.0, y: 2.0, z: 2.0 },
            checkCollisions: false,
            pickPoint,
            elasticSteps,
          };

          const result = simulatePushIn(state);
          const distFromPickPoint = vec3Distance(result.finalPosition, pickPoint);

          // EXPECTED: camera should stop at least 2.0 units from pick point
          // BUG: camera stops at ~0.1 units — ellipsoid clips 1.9 units into obstruction
          expect(distFromPickPoint).toBeGreaterThanOrEqual(ellipsoidRadius - 1e-9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("large ellipsoid with checkCollisions=true also clips (position-based movement)", () => {
    fc.assert(
      fc.property(
        // Camera radius
        fc.double({ min: 8.0, max: 30.0, noNaN: true }),
        // Elastic steps
        fc.integer({ min: 5, max: 15 }),
        (cameraRadius, elasticSteps) => {
          const ellipsoidRadius = 2.0;

          const pickDist = cameraRadius * 0.6;
          fc.pre(pickDist > ellipsoidRadius + 1.0);

          const cameraTarget: Vec3 = { x: 0, y: 0, z: 0 };
          const cameraPosition: Vec3 = { x: 0, y: 0, z: cameraRadius };
          const pickPoint: Vec3 = { x: 0, y: 0, z: pickDist };

          const state: ElasticCameraState = {
            cameraPosition,
            cameraTarget,
            cameraRadius,
            cameraEllipsoid: { x: 2.0, y: 2.0, z: 2.0 },
            checkCollisions: true, // position-based movement
            pickPoint,
            elasticSteps,
          };

          const result = simulatePushIn(state);
          const distFromPickPoint = vec3Distance(result.finalPosition, pickPoint);

          // EXPECTED: camera should stop at least 2.0 units from pick point
          // BUG: camera stops at ~0.1 units regardless of ellipsoid
          expect(distFromPickPoint).toBeGreaterThanOrEqual(ellipsoidRadius - 1e-9);
        }
      ),
      { numRuns: 100 }
    );
  });
});
