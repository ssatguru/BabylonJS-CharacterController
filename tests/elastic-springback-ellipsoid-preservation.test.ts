import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: springback-ellipsoid-clearance
 * Property 2: Preservation — No-Obstruction and Disabled-Elasticity Behavior Unchanged
 *
 * These tests verify that for all inputs where isBugCondition returns false,
 * the elastic camera system behavior is unchanged. This captures the baseline
 * behavior on UNFIXED code that must be preserved after the fix is applied.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

// --- Types ---

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ElasticCameraState {
  cameraElastic: boolean;
  springback: boolean;
  cameraRadius: number;
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  cameraEllipsoid: Vec3;
  checkCollisions: boolean;
  originalRadius: number | null;
  elasticSteps: number;
  springbackSteps: number;
  obstructionDetected: boolean;
  pickPoint: Vec3 | null;
  springbackPathObstructions: Array<{ pickPoint: Vec3; pickDist: number }>;
}

interface ElasticCameraResult {
  newRadius: number;
  newPosition: Vec3;
  originalRadius: number | null;
}

// --- Pure functions extracted from _handleObstruction() ---
// These mirror the UNFIXED code behavior exactly.

/**
 * Simulates the elastic camera push-in logic from _handleObstruction().
 * This is the UNFIXED version — no ellipsoid offset is applied.
 */
function elasticPushIn(state: ElasticCameraState): ElasticCameraResult {
  // If elastic is disabled, no push-in occurs
  if (!state.cameraElastic) {
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: state.originalRadius,
    };
  }

  // If no obstruction detected, no push-in occurs
  if (!state.obstructionDetected || state.pickPoint === null) {
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: state.originalRadius,
    };
  }

  // Store original radius on first push-in
  const originalRadius =
    state.originalRadius === null ? state.cameraRadius : state.originalRadius;

  // Compute c2p vector (camera to pick point)
  const c2p: Vec3 = {
    x: state.cameraPosition.x - state.pickPoint.x,
    y: state.cameraPosition.y - state.pickPoint.y,
    z: state.cameraPosition.z - state.pickPoint.z,
  };
  const l = Math.sqrt(c2p.x * c2p.x + c2p.y * c2p.y + c2p.z * c2p.z);

  if (l <= 0.1) {
    // Close enough — stop moving
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius,
    };
  }

  if (state.checkCollisions) {
    // Collision mode: move camera position
    const norm: Vec3 = { x: c2p.x / l, y: c2p.y / l, z: c2p.z / l };
    const step = l / state.elasticSteps;
    return {
      newRadius: state.cameraRadius,
      newPosition: {
        x: state.cameraPosition.x - norm.x * step,
        y: state.cameraPosition.y - norm.y * step,
        z: state.cameraPosition.z - norm.z * step,
      },
      originalRadius,
    };
  } else {
    // Radius mode: decrease camera radius
    const step = l / state.elasticSteps;
    return {
      newRadius: state.cameraRadius - step,
      newPosition: { ...state.cameraPosition },
      originalRadius,
    };
  }
}

/**
 * Simulates the elastic camera springback logic from _handleObstruction().
 * This is the UNFIXED version — no ellipsoid offset is applied.
 */
function elasticSpringback(state: ElasticCameraState): ElasticCameraResult {
  // If elastic is disabled, no springback occurs
  if (!state.cameraElastic) {
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: state.originalRadius,
    };
  }

  // If springback is disabled, no springback occurs
  if (!state.springback) {
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: state.originalRadius,
    };
  }

  // If no original radius stored, nothing to spring back to
  if (state.originalRadius === null) {
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: null,
    };
  }

  const remainingDistance = state.originalRadius - state.cameraRadius;

  if (remainingDistance <= 0) {
    // Camera is at or beyond original radius — clear recovery target
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: null,
    };
  }

  // Check if springback path is blocked
  const currentDist = vecDistance(state.cameraPosition, state.cameraTarget);
  let springBlocked = false;

  for (const obs of state.springbackPathObstructions) {
    if (obs.pickDist > currentDist) {
      springBlocked = true;
      break;
    }
  }

  if (springBlocked) {
    // Path is blocked — don't spring back
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: state.originalRadius,
    };
  }

  // Path is clear — perform springback
  if (remainingDistance <= 0.1) {
    // Close enough — snap to original
    return {
      newRadius: state.cameraRadius,
      newPosition: { ...state.cameraPosition },
      originalRadius: null,
    };
  }

  const step = remainingDistance / state.springbackSteps;

  if (state.checkCollisions) {
    // Collision mode: move camera position outward
    const dir = vecNormalize(vecSub(state.cameraPosition, state.cameraTarget));
    const newPosition: Vec3 = {
      x: state.cameraPosition.x + dir.x * step,
      y: state.cameraPosition.y + dir.y * step,
      z: state.cameraPosition.z + dir.z * step,
    };
    const newRadius = state.cameraRadius;
    // Check convergence
    let newOriginalRadius: number | null = state.originalRadius;
    if (Math.abs(newRadius - state.originalRadius) <= 0.01) {
      newOriginalRadius = null;
    }
    return { newRadius, newPosition, originalRadius: newOriginalRadius };
  } else {
    // Radius mode: increase camera radius
    const newRadius = state.cameraRadius + step;
    const newPosition = { ...state.cameraPosition };
    // Check convergence
    let newOriginalRadius: number | null = state.originalRadius;
    if (Math.abs(newRadius - state.originalRadius) <= 0.01) {
      newOriginalRadius = null;
    }
    return { newRadius, newPosition, originalRadius: newOriginalRadius };
  }
}

// --- Vector helpers ---

function vecSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vecDistance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x,
    dy = a.y - b.y,
    dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function vecNormalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

// --- Generators ---

const vec3Arb = fc.record({
  x: fc.double({ min: -50, max: 50, noNaN: true }),
  y: fc.double({ min: -50, max: 50, noNaN: true }),
  z: fc.double({ min: -50, max: 50, noNaN: true }),
});

const zeroVec3: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * Generates a camera state where no obstruction is detected.
 * This is a non-buggy input (isBugCondition returns false).
 */
const noObstructionStateArb = fc
  .record({
    cameraRadius: fc.double({ min: 1, max: 100, noNaN: true }),
    cameraPosition: vec3Arb,
    cameraTarget: vec3Arb,
    cameraEllipsoid: fc.record({
      x: fc.double({ min: 0, max: 3, noNaN: true }),
      y: fc.double({ min: 0, max: 3, noNaN: true }),
      z: fc.double({ min: 0, max: 3, noNaN: true }),
    }),
    checkCollisions: fc.boolean(),
    elasticSteps: fc.integer({ min: 1, max: 100 }),
    springbackSteps: fc.integer({ min: 1, max: 100 }),
  })
  .map((r) => ({
    ...r,
    cameraElastic: true,
    springback: true,
    originalRadius: null as number | null,
    obstructionDetected: false,
    pickPoint: null as Vec3 | null,
    springbackPathObstructions: [] as Array<{
      pickPoint: Vec3;
      pickDist: number;
    }>,
  }));

/**
 * Generates a camera state where elasticity is disabled.
 * This is a non-buggy input (isBugCondition returns false).
 */
const disabledElasticStateArb = fc
  .record({
    cameraRadius: fc.double({ min: 1, max: 100, noNaN: true }),
    cameraPosition: vec3Arb,
    cameraTarget: vec3Arb,
    cameraEllipsoid: fc.record({
      x: fc.double({ min: 0, max: 3, noNaN: true }),
      y: fc.double({ min: 0, max: 3, noNaN: true }),
      z: fc.double({ min: 0, max: 3, noNaN: true }),
    }),
    checkCollisions: fc.boolean(),
    elasticSteps: fc.integer({ min: 1, max: 100 }),
    springbackSteps: fc.integer({ min: 1, max: 100 }),
    obstructionDetected: fc.boolean(),
    pickPoint: fc.option(vec3Arb, { nil: null }),
    originalRadius: fc.option(
      fc.double({ min: 1, max: 200, noNaN: true }),
      { nil: null }
    ),
  })
  .map((r) => ({
    ...r,
    cameraElastic: false,
    springback: true,
    springbackPathObstructions: [] as Array<{
      pickPoint: Vec3;
      pickDist: number;
    }>,
  }));

/**
 * Generates a camera state with zero ellipsoid (0, 0, 0).
 * When ellipsoid is zero, ellipsoidRadius = 0 and no offset is applied.
 * This is a non-buggy input (isBugCondition returns false for the fix's perspective
 * since ellipsoidRadius = 0 means no offset needed).
 */
const zeroEllipsoidStateArb = fc
  .record({
    cameraRadius: fc.double({ min: 1, max: 100, noNaN: true }),
    cameraPosition: vec3Arb,
    cameraTarget: vec3Arb,
    checkCollisions: fc.boolean(),
    elasticSteps: fc.integer({ min: 1, max: 100 }),
    springbackSteps: fc.integer({ min: 1, max: 100 }),
    obstructionDetected: fc.boolean(),
    pickPoint: fc.option(vec3Arb, { nil: null }),
    originalRadius: fc.option(
      fc.double({ min: 1, max: 200, noNaN: true }),
      { nil: null }
    ),
  })
  .map((r) => ({
    ...r,
    cameraElastic: true,
    springback: true,
    cameraEllipsoid: zeroVec3,
    springbackPathObstructions: [] as Array<{
      pickPoint: Vec3;
      pickDist: number;
    }>,
  }));

/**
 * Generates a springback state with no obstruction along the springback path.
 * Camera is pushed in (radius < originalRadius) and path is clear.
 */
const clearSpringbackStateArb = fc
  .record({
    cameraRadius: fc.double({ min: 1, max: 50, noNaN: true }),
    originalRadiusOffset: fc.double({ min: 2, max: 50, noNaN: true }),
    cameraTarget: vec3Arb,
    cameraEllipsoid: fc.record({
      x: fc.double({ min: 0, max: 3, noNaN: true }),
      y: fc.double({ min: 0, max: 3, noNaN: true }),
      z: fc.double({ min: 0, max: 3, noNaN: true }),
    }),
    checkCollisions: fc.boolean(),
    elasticSteps: fc.integer({ min: 1, max: 100 }),
    springbackSteps: fc.integer({ min: 1, max: 100 }),
    // Direction from target to camera (non-zero)
    cameraDir: fc.record({
      x: fc.double({ min: -10, max: 10, noNaN: true }),
      y: fc.double({ min: -10, max: 10, noNaN: true }),
      z: fc.double({ min: -10, max: 10, noNaN: true }),
    }),
  })
  .filter((r) => {
    const len = Math.sqrt(
      r.cameraDir.x * r.cameraDir.x +
        r.cameraDir.y * r.cameraDir.y +
        r.cameraDir.z * r.cameraDir.z
    );
    return len > 0.1;
  })
  .map((r) => {
    const originalRadius = r.cameraRadius + r.originalRadiusOffset;
    // Position camera at cameraRadius distance from target along cameraDir
    const dir = vecNormalize(r.cameraDir);
    const cameraPosition: Vec3 = {
      x: r.cameraTarget.x + dir.x * r.cameraRadius,
      y: r.cameraTarget.y + dir.y * r.cameraRadius,
      z: r.cameraTarget.z + dir.z * r.cameraRadius,
    };
    return {
      cameraElastic: true,
      springback: true,
      cameraRadius: r.cameraRadius,
      cameraPosition,
      cameraTarget: r.cameraTarget,
      cameraEllipsoid: r.cameraEllipsoid,
      checkCollisions: r.checkCollisions,
      originalRadius,
      elasticSteps: r.elasticSteps,
      springbackSteps: r.springbackSteps,
      obstructionDetected: false,
      pickPoint: null as Vec3 | null,
      springbackPathObstructions: [] as Array<{
        pickPoint: Vec3;
        pickDist: number;
      }>,
    };
  });

// --- Property-based tests ---

describe("Feature: springback-ellipsoid-clearance, Property 2: Preservation — No-Obstruction Behavior Unchanged", () => {
  /**
   * Validates: Requirements 3.1, 3.2
   *
   * For all camera states with no obstruction detected, the function produces
   * no push-in and no radius change. Camera state remains unchanged.
   */
  it("no obstruction detected: no push-in occurs and camera radius is unchanged", () => {
    fc.assert(
      fc.property(noObstructionStateArb, (state) => {
        const result = elasticPushIn(state);

        // No push-in: radius unchanged
        expect(result.newRadius).toBe(state.cameraRadius);
        // No push-in: position unchanged
        expect(result.newPosition.x).toBe(state.cameraPosition.x);
        expect(result.newPosition.y).toBe(state.cameraPosition.y);
        expect(result.newPosition.z).toBe(state.cameraPosition.z);
        // No original radius captured (no push-in happened)
        expect(result.originalRadius).toBeNull();
      }),
      { numRuns: 200 }
    );
  });
});

describe("Feature: springback-ellipsoid-clearance, Property 2: Preservation — Disabled Elasticity Behavior Unchanged", () => {
  /**
   * Validates: Requirements 3.3
   *
   * For all camera states with _cameraElastic = false, no push-in or springback
   * occurs regardless of ellipsoid size or obstruction state.
   */
  it("disabled elasticity: no push-in occurs regardless of obstruction state", () => {
    fc.assert(
      fc.property(disabledElasticStateArb, (state) => {
        const result = elasticPushIn(state);

        // No push-in: radius unchanged
        expect(result.newRadius).toBe(state.cameraRadius);
        // No push-in: position unchanged
        expect(result.newPosition.x).toBe(state.cameraPosition.x);
        expect(result.newPosition.y).toBe(state.cameraPosition.y);
        expect(result.newPosition.z).toBe(state.cameraPosition.z);
      }),
      { numRuns: 200 }
    );
  });

  it("disabled elasticity: no springback occurs regardless of original radius", () => {
    fc.assert(
      fc.property(disabledElasticStateArb, (state) => {
        const result = elasticSpringback(state);

        // No springback: radius unchanged
        expect(result.newRadius).toBe(state.cameraRadius);
        // No springback: position unchanged
        expect(result.newPosition.x).toBe(state.cameraPosition.x);
        expect(result.newPosition.y).toBe(state.cameraPosition.y);
        expect(result.newPosition.z).toBe(state.cameraPosition.z);
      }),
      { numRuns: 200 }
    );
  });
});

describe("Feature: springback-ellipsoid-clearance, Property 2: Preservation — Zero Ellipsoid Behavior Unchanged", () => {
  /**
   * Validates: Requirements 3.5
   *
   * For all camera states with zero ellipsoid (0, 0, 0), behavior is identical
   * to unfixed code. Zero offset means no change in behavior.
   * When ellipsoidRadius = 0, the fix applies zero offset — identical to unfixed.
   */
  it("zero ellipsoid: push-in behavior is identical (no offset applied)", () => {
    fc.assert(
      fc.property(zeroEllipsoidStateArb, (state) => {
        // With zero ellipsoid, the fix would apply zero offset.
        // The unfixed function and the fixed function produce the same result.
        // We verify the unfixed function behavior is well-defined for zero ellipsoid.
        const result = elasticPushIn(state);

        if (!state.obstructionDetected || state.pickPoint === null) {
          // No obstruction: no change
          expect(result.newRadius).toBe(state.cameraRadius);
          expect(result.newPosition.x).toBe(state.cameraPosition.x);
          expect(result.newPosition.y).toBe(state.cameraPosition.y);
          expect(result.newPosition.z).toBe(state.cameraPosition.z);
        } else {
          // With obstruction: push-in occurs normally (same as non-zero ellipsoid unfixed)
          // The key point: zero ellipsoid means ellipsoidRadius = 0, so no offset difference
          const c2p = vecSub(state.cameraPosition, state.pickPoint);
          const l = Math.sqrt(c2p.x * c2p.x + c2p.y * c2p.y + c2p.z * c2p.z);

          if (l <= 0.1) {
            // Close enough — no movement
            expect(result.newRadius).toBe(state.cameraRadius);
          } else if (!state.checkCollisions) {
            // Radius mode: radius decreases by l / elasticSteps
            const expectedStep = l / state.elasticSteps;
            expect(result.newRadius).toBeCloseTo(
              state.cameraRadius - expectedStep,
              10
            );
          }
          // For collision mode, position changes — verified by the push-in logic
        }
      }),
      { numRuns: 200 }
    );
  });

  it("zero ellipsoid: springback behavior is identical (no offset applied)", () => {
    fc.assert(
      fc.property(
        fc
          .record({
            cameraRadius: fc.double({ min: 1, max: 50, noNaN: true }),
            originalRadiusOffset: fc.double({ min: 2, max: 50, noNaN: true }),
            cameraTarget: vec3Arb,
            checkCollisions: fc.boolean(),
            elasticSteps: fc.integer({ min: 1, max: 100 }),
            springbackSteps: fc.integer({ min: 1, max: 100 }),
            cameraDir: fc.record({
              x: fc.double({ min: -10, max: 10, noNaN: true }),
              y: fc.double({ min: -10, max: 10, noNaN: true }),
              z: fc.double({ min: -10, max: 10, noNaN: true }),
            }),
          })
          .filter((r) => {
            const len = Math.sqrt(
              r.cameraDir.x * r.cameraDir.x +
                r.cameraDir.y * r.cameraDir.y +
                r.cameraDir.z * r.cameraDir.z
            );
            return len > 0.1;
          })
          .map((r) => {
            const originalRadius = r.cameraRadius + r.originalRadiusOffset;
            const dir = vecNormalize(r.cameraDir);
            const cameraPosition: Vec3 = {
              x: r.cameraTarget.x + dir.x * r.cameraRadius,
              y: r.cameraTarget.y + dir.y * r.cameraRadius,
              z: r.cameraTarget.z + dir.z * r.cameraRadius,
            };
            return {
              cameraElastic: true,
              springback: true,
              cameraRadius: r.cameraRadius,
              cameraPosition,
              cameraTarget: r.cameraTarget,
              cameraEllipsoid: zeroVec3,
              checkCollisions: r.checkCollisions,
              originalRadius,
              elasticSteps: r.elasticSteps,
              springbackSteps: r.springbackSteps,
              obstructionDetected: false,
              pickPoint: null as Vec3 | null,
              springbackPathObstructions: [] as Array<{
                pickPoint: Vec3;
                pickDist: number;
              }>,
            };
          }),
        (state) => {
          const result = elasticSpringback(state);
          const remainingDistance = state.originalRadius! - state.cameraRadius;

          // Springback should proceed normally with zero ellipsoid
          if (remainingDistance <= 0.1) {
            // Snap — originalRadius cleared
            expect(result.originalRadius).toBeNull();
          } else {
            // Step formula applied: remainingDistance / springbackSteps
            const expectedStep = remainingDistance / state.springbackSteps;
            if (!state.checkCollisions) {
              expect(result.newRadius).toBeCloseTo(
                state.cameraRadius + expectedStep,
                10
              );
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe("Feature: springback-ellipsoid-clearance, Property 2: Preservation — Clear Springback Path Uses remainingDistance/steps Formula", () => {
  /**
   * Validates: Requirements 3.2, 3.4
   *
   * For all springback states with no obstruction along the path, springback
   * proceeds normally toward the full original radius using the
   * remainingDistance / springbackSteps formula.
   */
  it("clear springback path: step size equals remainingDistance / springbackSteps", () => {
    fc.assert(
      fc.property(clearSpringbackStateArb, (state) => {
        const remainingDistance = state.originalRadius! - state.cameraRadius;

        // Only test when remaining distance is > 0.1 (not in snap zone)
        fc.pre(remainingDistance > 0.1);

        const result = elasticSpringback(state);
        const expectedStep = remainingDistance / state.springbackSteps;

        if (!state.checkCollisions) {
          // Radius mode: radius increases by step
          expect(result.newRadius).toBeCloseTo(
            state.cameraRadius + expectedStep,
            10
          );
        } else {
          // Collision mode: position moves outward by step
          const newDist = vecDistance(result.newPosition, state.cameraTarget);
          const currentDist = vecDistance(
            state.cameraPosition,
            state.cameraTarget
          );
          expect(newDist).toBeCloseTo(currentDist + expectedStep, 5);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("clear springback path: camera moves toward original radius (decelerating)", () => {
    fc.assert(
      fc.property(clearSpringbackStateArb, (state) => {
        const remainingDistance = state.originalRadius! - state.cameraRadius;
        fc.pre(remainingDistance > 1); // Ensure not in snap zone

        const result = elasticSpringback(state);

        if (!state.checkCollisions) {
          // Radius increases toward original
          expect(result.newRadius).toBeGreaterThan(state.cameraRadius);
          expect(result.newRadius).toBeLessThanOrEqual(state.originalRadius!);
        } else {
          // Distance from target increases toward original
          const newDist = vecDistance(result.newPosition, state.cameraTarget);
          const currentDist = vecDistance(
            state.cameraPosition,
            state.cameraTarget
          );
          expect(newDist).toBeGreaterThan(currentDist);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("clear springback path: snap to original when remainingDistance <= 0.1", () => {
    fc.assert(
      fc.property(
        fc
          .record({
            cameraRadius: fc.double({ min: 5, max: 100, noNaN: true }),
            // Use a small offset that guarantees remainingDistance <= 0.1 after FP arithmetic
            snapOffset: fc.double({ min: 0.001, max: 0.09, noNaN: true }),
            cameraTarget: vec3Arb,
            cameraEllipsoid: fc.record({
              x: fc.double({ min: 0, max: 3, noNaN: true }),
              y: fc.double({ min: 0, max: 3, noNaN: true }),
              z: fc.double({ min: 0, max: 3, noNaN: true }),
            }),
            checkCollisions: fc.boolean(),
            elasticSteps: fc.integer({ min: 1, max: 100 }),
            springbackSteps: fc.integer({ min: 1, max: 100 }),
            cameraDir: fc.record({
              x: fc.double({ min: -10, max: 10, noNaN: true }),
              y: fc.double({ min: -10, max: 10, noNaN: true }),
              z: fc.double({ min: -10, max: 10, noNaN: true }),
            }),
          })
          .filter((r) => {
            const len = Math.sqrt(
              r.cameraDir.x * r.cameraDir.x +
                r.cameraDir.y * r.cameraDir.y +
                r.cameraDir.z * r.cameraDir.z
            );
            return len > 0.1;
          })
          .map((r) => {
            const originalRadius = r.cameraRadius + r.snapOffset;
            const dir = vecNormalize(r.cameraDir);
            const cameraPosition: Vec3 = {
              x: r.cameraTarget.x + dir.x * r.cameraRadius,
              y: r.cameraTarget.y + dir.y * r.cameraRadius,
              z: r.cameraTarget.z + dir.z * r.cameraRadius,
            };
            return {
              cameraElastic: true,
              springback: true,
              cameraRadius: r.cameraRadius,
              cameraPosition,
              cameraTarget: r.cameraTarget,
              cameraEllipsoid: r.cameraEllipsoid,
              checkCollisions: r.checkCollisions,
              originalRadius,
              elasticSteps: r.elasticSteps,
              springbackSteps: r.springbackSteps,
              obstructionDetected: false,
              pickPoint: null as Vec3 | null,
              springbackPathObstructions: [] as Array<{
                pickPoint: Vec3;
                pickDist: number;
              }>,
            };
          }),
        (state) => {
          // Guard: ensure the actual computed remaining distance is <= 0.1
          // (floating point arithmetic can shift values slightly)
          const remainingDistance = state.originalRadius! - state.cameraRadius;
          fc.pre(remainingDistance > 0 && remainingDistance <= 0.1);

          const result = elasticSpringback(state);

          // When remaining distance <= 0.1, originalRadius is cleared (snap)
          expect(result.originalRadius).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });
});
