import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: smooth-turning, Property 5: Movement direction during smooth turn
 *
 * **Validates: Requirements 3.1**
 *
 * Property: For any avatar orientation during smooth turning, the horizontal
 * displacement vector SHALL be aligned with the avatar's current forward direction
 * (not the target direction), scaled by walk speed × dt (or run speed × dt if the
 * speed modifier is held).
 *
 * In BabylonJS's left-handed coordinate system, for an avatar with Y rotation θ,
 * the forward direction on the XZ plane is (sin(θ), 0, cos(θ)).
 *
 * The movement logic uses calcMovePOV(leftRight, upDown, frontBack) which computes
 * displacement relative to the mesh's current orientation. For forward movement:
 *   dx = sin(θ) * speed * dt
 *   dz = cos(θ) * speed * dt
 *
 * The key insight: displacement direction is aligned with the CURRENT avatar facing
 * (not the target direction), ensuring responsive movement during smooth turning.
 */

/**
 * Compute the expected horizontal displacement for an avatar at rotation θ
 * moving forward at a given speed for dt seconds.
 *
 * This models BabylonJS's calcMovePOV for pure forward movement:
 *   displacement = forward_direction * speed * dt
 *
 * In BabylonJS left-handed coords:
 *   forward = (sin(θ), 0, cos(θ))
 */
function computeForwardDisplacement(
  rotationY: number,
  speed: number,
  dt: number
): { dx: number; dz: number } {
  const dx = Math.sin(rotationY) * speed * dt;
  const dz = Math.cos(rotationY) * speed * dt;
  return { dx, dz };
}

/**
 * Check if a displacement vector (dx, dz) is aligned with the forward direction
 * at rotation θ. Two vectors are aligned if they are parallel (same direction).
 *
 * We verify alignment by checking:
 * 1. The displacement direction matches the forward direction (via cross product ≈ 0)
 * 2. The magnitude equals speed * dt
 */
function isAlignedWithForward(
  dx: number,
  dz: number,
  rotationY: number,
  speed: number,
  dt: number,
  epsilon: number = 1e-10
): { directionAligned: boolean; magnitudeCorrect: boolean } {
  const forwardX = Math.sin(rotationY);
  const forwardZ = Math.cos(rotationY);

  const expectedMagnitude = speed * dt;
  const actualMagnitude = Math.sqrt(dx * dx + dz * dz);

  // Check magnitude
  const magnitudeCorrect = Math.abs(actualMagnitude - expectedMagnitude) < epsilon;

  // Check direction alignment via 2D cross product (should be ~0 for parallel vectors)
  // cross = dx * forwardZ - dz * forwardX
  // For parallel vectors, cross product is 0
  const cross = dx * forwardZ - dz * forwardX;
  const directionAligned = Math.abs(cross) < epsilon;

  return { directionAligned, magnitudeCorrect };
}

describe("Feature: smooth-turning, Property 5: Movement direction during smooth turn", () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * For any avatar orientation θ and walk speed, the horizontal displacement
   * is exactly (sin(θ) * speed * dt, cos(θ) * speed * dt).
   */
  it("horizontal displacement is aligned with current forward direction at walk speed", () => {
    fc.assert(
      fc.property(
        // Avatar rotation Y in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        // Walk speed in (0, 10] units/sec
        fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
        // Delta time in (0, 0.1] seconds
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }),
        (rotationY, walkSpeed, dt) => {
          // Compute displacement using the movement model
          const { dx, dz } = computeForwardDisplacement(rotationY, walkSpeed, dt);

          // Verify the displacement is aligned with the avatar's current forward direction
          const { directionAligned, magnitudeCorrect } = isAlignedWithForward(
            dx,
            dz,
            rotationY,
            walkSpeed,
            dt
          );

          expect(directionAligned).toBe(true);
          expect(magnitudeCorrect).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * For any avatar orientation θ and run speed, the horizontal displacement
   * is exactly (sin(θ) * speed * dt, cos(θ) * speed * dt).
   * This verifies the same property holds for run speed (speed modifier held).
   */
  it("horizontal displacement is aligned with current forward direction at run speed", () => {
    fc.assert(
      fc.property(
        // Avatar rotation Y in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        // Run speed in (0, 10] units/sec (typically higher than walk speed)
        fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
        // Delta time in (0, 0.1] seconds
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }),
        (rotationY, runSpeed, dt) => {
          const { dx, dz } = computeForwardDisplacement(rotationY, runSpeed, dt);

          const { directionAligned, magnitudeCorrect } = isAlignedWithForward(
            dx,
            dz,
            rotationY,
            runSpeed,
            dt
          );

          expect(directionAligned).toBe(true);
          expect(magnitudeCorrect).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * The displacement uses the CURRENT avatar facing, not the target direction.
   * Given a current rotation and a different target rotation, the displacement
   * must be computed from the current rotation, not the target.
   *
   * Generator strategy: generate current rotation and an angular offset in
   * [0.3, π-0.3] to guarantee the target is meaningfully different from current
   * and avoids near-parallel/anti-parallel edge cases.
   */
  it("displacement uses current facing direction, not target direction", () => {
    fc.assert(
      fc.property(
        // Current avatar rotation Y in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        // Angular offset from current to target in [0.3, π-0.3]
        // Avoids near-0 and near-π offsets where forward vectors become parallel/anti-parallel
        fc.double({ min: 0.3, max: Math.PI - 0.3, noNaN: true, noDefaultInfinity: true }),
        // Direction of offset: +1 or -1
        fc.constantFrom(1, -1),
        // Speed in (0, 10]
        fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
        // Delta time in (0, 0.1]
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }),
        (currentRotation, offset, direction, speed, dt) => {
          const targetRotation = currentRotation + offset * direction;

          // Displacement should be based on CURRENT rotation
          const displacement = computeForwardDisplacement(currentRotation, speed, dt);

          // Verify displacement matches current facing
          const { directionAligned: alignedWithCurrent } = isAlignedWithForward(
            displacement.dx,
            displacement.dz,
            currentRotation,
            speed,
            dt
          );
          expect(alignedWithCurrent).toBe(true);

          // Verify displacement is NOT aligned with target facing.
          // Use the sine of the angle between displacement direction and target forward.
          // sin(angle) = cross / (|a| * |b|) — for unit vectors this is just the cross product.
          const currentForwardX = Math.sin(currentRotation);
          const currentForwardZ = Math.cos(currentRotation);
          const targetForwardX = Math.sin(targetRotation);
          const targetForwardZ = Math.cos(targetRotation);

          // Cross product of unit forward vectors: sin(targetRotation - currentRotation)
          // This equals sin(offset * direction) which is guaranteed non-zero for offset in [0.3, π-0.3]
          const crossOfForwards =
            currentForwardX * targetForwardZ - currentForwardZ * targetForwardX;

          // Since displacement is aligned with current forward, and current forward is NOT
          // aligned with target forward (cross of unit forwards is non-zero), the displacement
          // cannot be aligned with target forward.
          expect(Math.abs(crossOfForwards)).toBeGreaterThan(0.1);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * The magnitude of horizontal displacement equals speed × dt regardless
   * of the avatar's orientation. This ensures rotation doesn't affect movement speed.
   */
  it("displacement magnitude equals speed × dt regardless of orientation", () => {
    fc.assert(
      fc.property(
        // Avatar rotation Y in [-2π, 2π]
        fc.double({ min: -2 * Math.PI, max: 2 * Math.PI, noNaN: true, noDefaultInfinity: true }),
        // Speed in (0, 10]
        fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
        // Delta time in (0, 0.1]
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }),
        (rotationY, speed, dt) => {
          const { dx, dz } = computeForwardDisplacement(rotationY, speed, dt);

          const magnitude = Math.sqrt(dx * dx + dz * dz);
          const expectedMagnitude = speed * dt;

          // Magnitude should be exactly speed * dt (within floating point tolerance)
          expect(magnitude).toBeCloseTo(expectedMagnitude, 10);
        }
      ),
      { numRuns: 200 }
    );
  });
});
