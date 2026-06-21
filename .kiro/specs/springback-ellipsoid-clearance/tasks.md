# Implementation Plan

## Overview

Fix the elastic camera system in `_handleObstruction()` to offset all push-in targets and springback limits by the camera's ellipsoid radius, preventing the camera from clipping into obstruction meshes. Uses the bug condition methodology: explore the bug with property-based tests, write preservation tests, implement the fix, then validate.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Ellipsoid Clearance During Push-In
  - **IMPORTANT**: Write this property-based test BEFORE implementing the fix
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the camera clips into obstructions because ellipsoid radius is not offset
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — push-in with non-zero ellipsoid where camera ends up closer to pick point than ellipsoid radius
  - Create test file `tests/elastic-springback-ellipsoid-clearance-bug.test.ts`
  - Extract the push-in logic from `_handleObstruction()` into a pure testable function that accepts camera state (position, radius, ellipsoid, pick point, elasticSteps) and returns new camera state
  - Bug Condition from design: `isBugCondition(input)` where `input.cameraElastic = true AND ellipsoidRadius > 0 AND obstructionDetected = true AND pickPoint IS NOT NULL AND distance(camera.position, pickPoint) < ellipsoidRadius`
  - Write property-based test using fast-check: for all camera states with non-zero ellipsoid and obstruction detected, assert that after push-in the camera center is at least `max(ellipsoid.x, ellipsoid.z)` units from the pick point
  - Include push-in stopping threshold test: simulate push-in until `l <= 0.1` and verify camera ellipsoid intersects obstruction (demonstrates bug)
  - Include springback overshoot test: simulate springback with obstruction at distance D and verify camera springs to within ellipsoid radius of obstruction (demonstrates bug)
  - Include large ellipsoid test: use ellipsoid (2.0, 2.0, 2.0) to amplify the bug
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "camera center at 0.1 units from pick point with ellipsoid radius 0.5 — ellipsoid clips 0.4 units into obstruction")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - No-Obstruction and Disabled-Elasticity Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file `tests/elastic-springback-ellipsoid-preservation.test.ts`
  - Extract the elastic camera logic into a pure testable function (reuse from task 1 if already extracted)
  - Observe behavior on UNFIXED code for non-buggy inputs (cases where `isBugCondition` returns false):
    - Observe: when no obstruction is detected, no push-in occurs and camera radius is unchanged
    - Observe: when `_cameraElastic = false`, no push-in or springback occurs regardless of ellipsoid size
    - Observe: when ellipsoid is (0, 0, 0), behavior is identical (zero offset means no change)
    - Observe: when no obstruction exists along springback path, springback proceeds normally toward full original radius using `remainingDistance / steps` formula
  - Write property-based tests using fast-check capturing observed behavior patterns:
    - Property: for all camera states with no obstruction detected, the fixed function produces the same result as the original function (no push-in, no radius change)
    - Property: for all camera states with `_cameraElastic = false`, the fixed function produces the same result as the original function (no elastic behavior)
    - Property: for all camera states with zero ellipsoid (0, 0, 0), the fixed function produces the same result as the original function
    - Property: for all springback states with no obstruction along path, springback proceeds identically using `remainingDistance / springbackSteps` formula
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for ellipsoid clearance in elastic camera push-in and springback

  - [x] 3.1 Compute ellipsoid radius at start of elastic block
    - In `_handleObstruction()`, after entering the `if (this._cameraElastic)` block, resolve the camera's collision volume (`ellipsoid` for FreeCamera, `collisionRadius` for ArcRotateCamera) and compute the lateral clearance radius:
      ```typescript
      const _ellipsoid = (this._camera as any).ellipsoid || (this._camera as any).collisionRadius;
      const ellipsoidRadius: number = _ellipsoid ? Math.max(_ellipsoid.x, _ellipsoid.z) : 0;
      ```
    - This provides the lateral clearance radius needed for all subsequent offset calculations
    - Falls back to 0 when neither property exists (no offset applied — safe default)
    - _Bug_Condition: isBugCondition(input) where input.cameraElastic = true AND ellipsoidRadius > 0 AND obstructionDetected = true_
    - _Expected_Behavior: ellipsoidRadius computed once and used consistently for all offset calculations_
    - _Preservation: when neither ellipsoid nor collisionRadius is defined, or when value is (0,0,0), ellipsoidRadius = 0 and no offset is applied — identical to unfixed behavior_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Offset push-in stopping threshold
    - Replace `if (l <= 0.1)` with `if (l <= ellipsoidRadius)` (or `if (l <= ellipsoidRadius + 0.1)` if the 0.1 proximity heuristic should be preserved)
    - This ensures the camera stops when its center is at least one ellipsoid radius from the pick point
    - _Bug_Condition: camera stops at 0.1 units from pick point, ellipsoid clips into obstruction_
    - _Expected_Behavior: camera stops at ellipsoidRadius units from pick point, ellipsoid is clear_
    - _Preservation: when ellipsoidRadius = 0, threshold reverts to original 0.1 behavior_
    - _Requirements: 1.2, 2.2_

  - [x] 3.3 Offset push-in step target distance
    - When computing the push-in step, subtract ellipsoidRadius from the travel distance: `const targetDist = Math.max(l - ellipsoidRadius, 0); const step = targetDist / this._elasticSteps;`
    - This makes the camera decelerate toward a point that is ellipsoidRadius units away from the pick point
    - _Bug_Condition: push-in uses full c2p.length() as distance, camera overshoots into obstruction_
    - _Expected_Behavior: push-in targets c2p.length() - ellipsoidRadius, camera stops with clearance_
    - _Preservation: when ellipsoidRadius = 0, targetDist = l (original behavior)_
    - _Requirements: 1.1, 2.1_

  - [x] 3.4 Offset springback blocking check
    - In the springback path-clear verification, subtract ellipsoidRadius from the pick-point distance: `if ((pickDist - ellipsoidRadius) <= currentDist)` to determine blocking
    - This accounts for the camera volume extending beyond its center point when checking if the springback path is clear
    - _Bug_Condition: springback uses raw pickDist > currentDist, allows camera ellipsoid to intersect obstruction_
    - _Expected_Behavior: springback uses (pickDist - ellipsoidRadius) > currentDist, camera ellipsoid stays clear_
    - _Preservation: when ellipsoidRadius = 0, comparison is unchanged (pickDist > currentDist)_
    - _Requirements: 1.3, 1.4, 2.3, 2.4_

  - [x] 3.5 Remove or repurpose `_cameraSkin`
    - The `_cameraSkin = 0.5` field is declared but never used in the obstruction logic
    - Since ellipsoidRadius now provides the clearance that `_cameraSkin` was intended to provide, either remove the field entirely or add a comment explaining it is superseded by ellipsoid-based clearance
    - For default ellipsoid (0.5, 1, 0.5), ellipsoidRadius = 0.5 which matches `_cameraSkin` value — visual similarity preserved
    - _Bug_Condition: _cameraSkin declared with intent to provide clearance but never applied_
    - _Expected_Behavior: clearance now provided by ellipsoidRadius computation_
    - _Preservation: default ellipsoid (0.5, 1, 0.5) produces 0.5 offset, matching _cameraSkin value for visual similarity_
    - _Requirements: 3.5_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Ellipsoid Clearance During Push-In
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (camera center >= ellipsoidRadius from pick point)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - No-Obstruction and Disabled-Elasticity Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation tests still pass after fix (no regressions introduced)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite with `npx vitest run`
  - Ensure all existing tests pass (elastic-springback-step-formula, elastic-springback-state-tracking, elastic-springback-modes, elastic-springback-settings, and all other tests)
  - Ensure new bug condition exploration test passes (confirms fix works)
  - Ensure new preservation property tests pass (confirms no regressions)
  - Ensure build succeeds with `npm run build`
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["3.6", "3.7"] },
    { "id": 4, "tasks": ["4"] }
  ]
}
```

## Notes

- Tests use **fast-check** for property-based testing and **vitest** as the test runner (per project conventions)
- The push-in and springback logic must be extracted into pure functions for testability (no BabylonJS scene instantiation needed)
- **Camera type compatibility**: `FreeCamera` exposes `ellipsoid` (default `(0.5, 1, 0.5)`), `ArcRotateCamera` exposes `collisionRadius` (default `(0.5, 0.5, 0.5)`). The fix checks both with fallback to 0.
- The `_cameraSkin` field (value 0.5) matches the default ellipsoid radius `max(0.5, 0.5) = 0.5`, ensuring visual similarity for default configurations
- When neither `ellipsoid` nor `collisionRadius` is defined, or when the value is (0, 0, 0), ellipsoidRadius = 0 and all offsets become zero — behavior is identical to unfixed code (degenerate case preservation)
- The fix applies universally regardless of `camera.checkCollisions` setting
