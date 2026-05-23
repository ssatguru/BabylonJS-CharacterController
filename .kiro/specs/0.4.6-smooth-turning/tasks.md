# Implementation Plan: Smooth Turning

## Overview

This plan implements smooth (gradual) avatar rotation in the BabylonJS CharacterController when `turningOff` is enabled in mode 0. The implementation adds a configurable `_smoothTurnSpeed` field, public getter/setter, modifies `_rotateAV2C()` to use frame-rate-independent interpolation, updates `CCSettings`, and introduces a Vitest + fast-check test setup for property-based and unit testing.

## Tasks

- [x] 1. Add smooth turn speed field and public API
  - [x] 1.1 Add `_smoothTurnSpeed` private field and `setSmoothTurnSpeed` / `getSmoothTurnSpeed` methods
    - Add `private _smoothTurnSpeed: number = 2 * Math.PI / 3;` field to `CharacterController`
    - Implement `setSmoothTurnSpeed(speed: number)` that validates input (rejects zero, negative, NaN, Infinity) and converts degrees/sec to radians/sec
    - Implement `getSmoothTurnSpeed(): number` that returns the current value converted back to degrees/sec
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 Add `smoothTurnSpeed` property to `CCSettings` and update `getSettings()` / `setSettings()`
    - Add `public smoothTurnSpeed: number;` to the `CCSettings` class
    - In `getSettings()`, set `ccs.smoothTurnSpeed = this.getSmoothTurnSpeed()`
    - In `setSettings()`, call `this.setSmoothTurnSpeed(ccs.smoothTurnSpeed)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. Implement smooth rotation logic in `_rotateAV2C()`
  - [x] 2.1 Modify the `_noRot` branch of `_rotateAV2C()` to use incremental rotation
    - Obtain `dt` from `this._scene.getEngine().getDeltaTime() / 1000`
    - Compute target angle from the existing switch/case key combinations (same angles as current code)
    - Compute shortest-arc delta: normalize `(target - current)` to `[-PI, PI]`
    - Compute step: `min(abs(delta), _smoothTurnSpeed * dt)`
    - If `abs(delta) <= step`, snap to target; otherwise rotate by `step * sign(delta)`
    - Use `_setAvatarRotationY()` for the final angle assignment
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [x] 2.2 Ensure movement direction uses current avatar facing during smooth turn
    - Verify that the existing movement code in `_doMove()` already uses the avatar's current forward direction for displacement
    - If needed, confirm that walk/run animation selection and gravity application remain unchanged during smooth turning
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 2.3 Ensure key release stops rotation and movement mid-turn
    - Verify that when directional keys are released, `_rotateAV2C()` is no longer called (the `_noRot` branch only executes when keys are active), leaving the avatar at its current orientation
    - _Requirements: 3.2_

- [x] 3. Checkpoint - Verify build and manual behavior
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Ensure no effect outside mode 0 with turningOff
  - [x] 4.1 Verify mode 0 with `turningOff=false` still uses instant rotation
    - Confirm the `else` branch of `_noRot` check in `_rotateAV2C()` remains unchanged (instant snap to `ca`)
    - _Requirements: 5.1_

  - [x] 4.2 Verify mode 1 is unaffected by `_smoothTurnSpeed`
    - Confirm the `_mode != 1` guard in `_rotateAV2C()` prevents smooth turning logic from executing in mode 1
    - Confirm `_rotateAVnC()` sign-based turn logic is unchanged
    - _Requirements: 5.2_

  - [x] 4.3 Verify mode/turningOff change mid-rotation stops smooth turn
    - Confirm that changing mode or turningOff immediately routes to the appropriate rotation logic on the next frame
    - _Requirements: 5.3_

- [x] 5. Set up test framework (Vitest + fast-check)
  - [x] 5.1 Install and configure Vitest and fast-check
    - Add `vitest` and `fast-check` as devDependencies
    - Create `vitest.config.ts` with TypeScript support matching the project's tsconfig
    - Add `"test": "vitest --run"` script to `package.json`
    - Create a `tests/` directory for test files
    - _Requirements: 1.1, 1.2 (enables automated validation)_

  - [ ]* 5.2 Write property test for speed parameter round-trip (Property 1)
    - **Property 1: Speed parameter round-trip**
    - Generate random positive finite numbers, call `setSmoothTurnSpeed(s)` then verify `getSmoothTurnSpeed()` returns `s`
    - Also test via `setSettings` / `getSettings` round-trip
    - **Validates: Requirements 1.2, 1.3, 1.4, 4.2, 4.3, 4.4**

  - [ ]* 5.3 Write property test for invalid input rejection (Property 2)
    - **Property 2: Invalid input rejection**
    - Generate invalid values (zero, negatives, NaN, ±Infinity), verify `getSmoothTurnSpeed()` is unchanged after calling `setSmoothTurnSpeed(v)`
    - **Validates: Requirements 1.5**

  - [x] 5.4 Write property test for rotation convergence (Property 3)
    - **Property 3: Rotation convergence**
    - Generate random current angle, target angle, speed, and dt; verify step size equals `min(|delta|, speed * dt)` or snaps to target when `|delta| <= step`
    - **Validates: Requirements 2.1, 2.2**

  - [x] 5.5 Write property test for shortest arc direction (Property 4)
    - **Property 4: Shortest arc direction**
    - Generate random angle pairs, verify the rotation is always in the shortest-arc direction (absolute change ≤ π)
    - **Validates: Requirements 2.3**

  - [x] 5.6 Write property test for movement direction during smooth turn (Property 5)
    - **Property 5: Movement direction during smooth turn**
    - Generate random avatar orientations, verify horizontal displacement is aligned with current forward direction scaled by walk/run speed × dt
    - **Validates: Requirements 3.1**

- [x] 6. Final checkpoint - Ensure build passes and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All implementation is in `src/CharacterController.ts` (single-file architecture)
- Build with `npm run build`; test with `npm test` (after task 5.1 sets up Vitest)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "5.2", "5.3"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "5.4", "5.5"] },
    { "id": 4, "tasks": ["5.6"] }
  ]
}
```
