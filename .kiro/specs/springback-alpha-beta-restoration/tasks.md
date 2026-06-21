# Implementation Plan: Springback Alpha/Beta Restoration

## Overview

Extend the elastic camera springback system to restore the ArcRotateCamera's alpha and beta angles after an obstruction clears. The implementation adds angle tracking state, angle restoration logic using the same step-based deceleration formula, priority-based restoration during avatar forward movement, user angle change detection, and an independent enable/disable toggle with settings persistence. All changes are in `src/CharacterController.ts` following the single-file architecture.

## Tasks

- [x] 1. Add new private state fields and public API methods
  - [x] 1.1 Add angle tracking state fields to CharacterController
    - Add private fields to the class: `_originalAlpha: number | null = null`, `_originalBeta: number | null = null`, `_springbackAngleRestore: boolean = true`, `_expectedAlpha: number | null = null`, `_expectedBeta: number | null = null`, `_angleRestorationActive: boolean = false`
    - Place them near the existing `_originalRadius`, `_expectedRadius`, `_springback`, `_springbackSteps` fields
    - _Requirements: 1.1, 1.2, 7.2_

  - [x] 1.2 Add public setter/getter for angle restoration toggle
    - Add `public setSpringbackAngleRestore(b: boolean): void` that sets `_springbackAngleRestore = b`
    - If called during active recovery and disabled: stop angle steps (set `_angleRestorationActive = false`)
    - If called during active recovery and enabled: resume toward stored original angles (set `_angleRestorationActive = true` if `_originalAlpha !== null`)
    - Add `public isSpringbackAngleRestore(): boolean` that returns `_springbackAngleRestore`
    - _Requirements: 7.1, 7.7_

  - [x] 1.3 Extend CCSettings class and getSettings/setSettings methods
    - Add optional property `springbackAngleRestore?: boolean` to the `CCSettings` class
    - In `getSettings()`: set `ccs.springbackAngleRestore = this._springbackAngleRestore`
    - In `setSettings()`: if `ccs.springbackAngleRestore !== undefined`, call `this.setSpringbackAngleRestore(ccs.springbackAngleRestore)`; otherwise leave current state unchanged
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Implement angle storage on obstruction push-in
  - [x] 2.1 Store alpha/beta on first obstruction push-in
    - In `_handleObstruction()`, at the point where `_originalRadius` is stored (the `if (this._originalRadius === null)` block), add: if `_springbackAngleRestore` is true and `_originalAlpha === null`, store `_originalAlpha = this._camera.alpha` and `_originalBeta = this._camera.beta`
    - This captures the pre-obstruction angles only on the first push-in
    - _Requirements: 1.1, 7.3_

  - [x] 2.2 Clear angle state when radius state is cleared
    - At every location where `_originalRadius` is set to null (radius recovery complete, avatar movement restoring distance, user scroll reducing radius), also set `_originalAlpha = null` and `_originalBeta = null`
    - Locations: radius within 0.01 tolerance snap, avatar movement distance check in `_updateTargetValue`, user scroll detection, camera at/beyond original radius
    - _Requirements: 1.3, 1.5_

  - [x]* 2.3 Write property tests for angle storage (Properties 1, 2, 3)
    - **Property 1: Angle storage on first obstruction**
    - **Property 2: Stored angles immutable across subsequent obstructions**
    - **Property 3: Coordinated clearing of angle state with radius state**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 5.2, 5.4, 7.3**
    - Create test file `tests/springback-angle-storage.test.ts`
    - Extract angle storage logic into pure testable functions
    - Use fast-check with minimum 100 iterations per property

- [x] 3. Implement angle restoration during springback (concurrent mode)
  - [x] 3.1 Add concurrent angle restoration in no-obstruction branch
    - In the existing springback no-obstruction branch (where `_originalRadius !== null && _springback`), after the radius step is applied, add angle restoration logic:
    - If `_springbackAngleRestore` is true and `_originalAlpha !== null` and `_springback` is true:
      - Compute `alphaStep = (_originalAlpha - camera.alpha) / _springbackSteps`
      - Compute `betaStep = (_originalBeta - camera.beta) / _springbackSteps`
      - Check snap: if `|_originalAlpha - camera.alpha| <= 0.005` AND `|_originalBeta - camera.beta| <= 0.005`, snap both to targets
      - Otherwise apply steps: `camera.alpha += alphaStep`, `camera.beta += betaStep`
    - Store expected values: `_expectedAlpha = camera.alpha`, `_expectedBeta = camera.beta`
    - When angles snap to targets and radius is also restored, clear all state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.4, 7.5, 7.6_

  - [x]* 3.2 Write property tests for angle step formula and snap (Properties 5, 6, 7)
    - **Property 5: Angle step formula produces decelerating motion**
    - **Property 6: Angle snap at threshold**
    - **Property 7: Concurrent angle and radius restoration**
    - **Validates: Requirements 2.2, 2.3, 2.4**
    - Create test file `tests/springback-angle-step-formula.test.ts`
    - Extract step computation and snap logic into pure testable functions
    - Use fast-check with minimum 100 iterations per property

- [x] 4. Implement angle-priority restoration during avatar forward movement
  - [x] 4.1 Add angle-priority logic in _updateTargetValue holdCameraPos branch
    - In the `_updateTargetValue()` method where `holdCameraPos` is used (avatar moving forward while camera displaced), add angle-priority logic:
    - If `_originalAlpha !== null` and `_springbackAngleRestore` is true and `_springback` is true:
      - Set `_angleRestorationActive = true`
      - Apply angle steps: `alphaStep = (_originalAlpha - camera.alpha) / _springbackSteps`, same for beta
      - Suppress radius restoration (do not apply radius step) while angles are not within 0.005 rad of targets
      - When angles reach within 0.005 rad: snap angles, then verify obstruction at restored angles before allowing radius restoration
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Add ray cast verification at restored angles
    - When angle restoration completes (both within 0.005 rad), cast a ray from camera target in the direction defined by the restored alpha/beta with length equal to `_originalRadius`
    - Use the same `multiPickWithRay` logic and `_isSeeAble` check as existing obstruction detection
    - Apply ellipsoid radius offset when comparing pick distances
    - If clear: proceed with radius restoration (set `_angleRestorationActive = false`)
    - If blocked: hold current radius, clear `_originalAlpha`/`_originalBeta` to null, retain `_originalRadius` for radius-only springback
    - _Requirements: 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x]* 4.3 Write property tests for angle-priority and obstruction evaluation (Properties 8, 9)
    - **Property 8: Angle-priority suppresses radius during forward movement**
    - **Property 9: Obstruction evaluation at restored angles**
    - **Validates: Requirements 3.1, 3.2, 4.3**
    - Create test file `tests/springback-angle-restoration.test.ts` for Property 8
    - Create test file `tests/springback-angle-obstruction-eval.test.ts` for Property 9
    - Extract priority logic and obstruction evaluation into pure testable functions
    - Use fast-check with minimum 100 iterations per property

- [x] 5. Checkpoint - Ensure all tests pass
  - Run full test suite with `npx vitest run`
  - Ensure all existing tests pass
  - Ensure new property tests pass
  - Ensure build succeeds with `npm run build`
  - Ask the user if questions arise

- [x] 6. Implement obstruction interruption during angle restoration
  - [x] 6.1 Handle new obstruction during angle restoration
    - In `_handleObstruction()`, when an obstruction is detected while `_angleRestorationActive` is true:
      - Stop applying angle restoration steps for the current frame
      - Apply the normal push-in behavior to reduce camera radius
      - Retain the stored `_originalAlpha` and `_originalBeta` unchanged (do not overwrite)
      - If push-in stores a new `_originalRadius` (because it was previously null), do not overwrite existing `_originalAlpha`/`_originalBeta`
    - When the obstruction clears (no obstruction detected in subsequent frames), resume angle restoration toward stored targets
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x]* 6.2 Write unit tests for obstruction interruption
    - Test: new obstruction during angle restoration → push-in applied, angles retained
    - Test: obstruction clears → angle restoration resumes with remaining distance
    - Test: push-in stores new originalRadius but does not overwrite existing originalAlpha/originalBeta
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Implement user angle change detection
  - [x] 7.1 Add user angle change detection logic
    - In `_handleObstruction()`, after angle restoration steps are applied (or at the start of the method alongside existing radius user-change detection):
    - Compare actual camera alpha/beta against `_expectedAlpha`/`_expectedBeta`
    - Compute threshold: `max(|_originalAlpha - camera.alpha| / _springbackSteps, 0.001)` for alpha, same for beta
    - If `|actualAlpha - _expectedAlpha| > alphaThreshold` OR `|actualBeta - _expectedBeta| > betaThreshold`, and no obstruction-driven angle change is in progress:
      - If `_originalAlpha !== null`: update `_originalAlpha = camera.alpha`, `_originalBeta = camera.beta`
      - If `_originalAlpha === null`: no-op
    - Update `_expectedAlpha`/`_expectedBeta` after all angle modifications each frame
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 7.2 Write property tests for user angle change detection (Properties 4, 12, 13)
    - **Property 4: User angle change updates stored targets**
    - **Property 12: User change detection threshold formula**
    - **Property 13: User change detection OR logic**
    - **Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.5**
    - Create test file `tests/springback-angle-user-detection.test.ts`
    - Extract user-change detection logic into pure testable functions
    - Use fast-check with minimum 100 iterations per property

- [x] 8. Implement enable/disable behavior and settings integration
  - [x] 8.1 Add disabled-angle-restore behavior
    - When `_springbackAngleRestore` is false:
      - Do not store `_originalAlpha`/`_originalBeta` on obstruction push-in
      - Do not apply angle restoration steps during springback
      - Radius-only springback proceeds normally
    - When `_springback` (radius springback) is false:
      - Angle restoration does not occur regardless of `_springbackAngleRestore`
    - _Requirements: 7.4, 7.5, 7.6_

  - [x]* 8.2 Write property tests for enable/disable (Properties 10, 11, 14)
    - **Property 10: Disabled angle restore preserves angles during springback**
    - **Property 11: Angle restoration requires springback enabled**
    - **Property 14: Settings round-trip preserves angle restore configuration**
    - **Validates: Requirements 7.4, 7.6, 8.3, 8.5**
    - Create test file `tests/springback-angle-enable-disable.test.ts` for Properties 10, 11
    - Create test file `tests/springback-angle-settings.test.ts` for Property 14
    - Extract enable/disable logic into pure testable functions
    - Use fast-check with minimum 100 iterations per property

- [x] 9. Final checkpoint - Ensure all tests pass
  - Run full test suite with `npx vitest run`
  - Ensure all existing tests pass (no regressions)
  - Ensure all new property tests pass
  - Ensure build succeeds with `npm run build`
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All logic lives in `src/CharacterController.ts` (single-file architecture)
- Tests extract pure logic into standalone functions (no BabylonJS scene instantiation needed)
- Uses **fast-check** for property-based testing and **vitest** as the test runner
- The same `remaining / _springbackSteps` deceleration formula is used for angles as for radius
- Angle snap threshold is 0.005 radians; user-change minimum threshold is 0.001 radians
- Camera alpha is not clamped to [0, 2π] in BabylonJS — direct subtraction works without wrapping

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8.1"] },
    { "id": 8, "tasks": ["8.2"] }
  ]
}
```
