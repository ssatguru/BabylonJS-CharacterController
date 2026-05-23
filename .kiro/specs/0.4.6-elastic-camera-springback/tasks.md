# Implementation Plan: Elastic Camera Springback

## Overview

This plan implements automatic camera springback recovery for the existing elastic camera obstruction system. The camera will smoothly return to its pre-obstruction radius once an obstruction clears, using step-based deceleration. All changes are within the single `src/CharacterController.ts` file, following the existing architecture patterns. Tests use vitest + fast-check, extracting pure logic into standalone functions.

## Tasks

- [x] 1. Add springback state and configuration members
  - [x] 1.1 Add private members and public setter/getter methods for springback
    - Add `_springback: boolean = true`, `_springbackSteps: number = 50`, `_originalRadius: number | null = null` private members
    - Add `setCameraElasticSpringback(b: boolean)` and `isCameraElasticSpringback(): boolean` methods
    - Add `setSpringbackSteps(n: number)` method with clamping (floor to integer, clamp to [1, 1000])
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2_

  - [x] 1.2 Extend CCSettings class with springback properties
    - Add optional `springback?: boolean` and `springbackSteps?: number` properties to `CCSettings`
    - Update `getSettings()` to include springback enabled state and steps value (clamped to [1, 1000])
    - Update `setSettings()` to apply springback properties only if present in the settings object
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement core springback logic in _handleObstruction
  - [x] 2.1 Store original radius on first push-in
    - In `_handleObstruction()`, before applying radius reduction, store `_originalRadius = camera.radius` if `_originalRadius` is currently null
    - Ensure subsequent push-in events do not overwrite the stored value
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement springback movement when obstruction clears
    - In the "no obstruction" branch of `_handleObstruction()`, add springback logic
    - When `_originalRadius` is not null, springback is enabled, and elastic is enabled: compute step = remainingDistance / _springbackSteps
    - If remaining distance <= 1, snap to `_originalRadius` (offset by `_cameraSkin` in collision mode)
    - Support both `checkCollisions` mode (move camera position along vector) and radius mode (increase `camera.radius`)
    - Clear `_originalRadius` to null when camera reaches target (within 0.01 tolerance)
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 2.3 Handle re-obstruction during springback
    - If an obstruction is detected while springing back, immediately apply push-in behavior
    - Preserve the stored `_originalRadius` so springback can resume when the new obstruction clears
    - _Requirements: 2.4, 3.1, 3.2, 3.3_

  - [x] 2.4 Detect user-initiated radius changes
    - Track expected radius from previous frame
    - If radius changed by more than the expected step amount, treat as user-initiated change
    - Update `_originalRadius` to the new user-requested radius
    - Clear `_originalRadius` if user scrolls beyond the original radius
    - _Requirements: 1.4_

  - [x] 2.5 Handle disabled springback and disabled elastic
    - When springback is disabled, do not perform recovery (camera stays at pushed-in radius)
    - When `setCameraElasticity(false)` is called, clear `_originalRadius` and stop any in-progress springback
    - _Requirements: 6.3, 6.4_

- [x] 3. Checkpoint - Verify core implementation compiles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Property-based tests for step formula and state tracking
  - [x] 4.1 Write property test for springback step formula (Property 4)
    - **Property 4: Springback step formula produces decelerating motion**
    - For any remaining distance D > 1 and steps S >= 1, step = D / S, new remaining = D * (S-1) / S < D
    - **Validates: Requirements 2.2, 4.4**

  - [x] 4.2 Write property test for snap threshold (Property 5)
    - **Property 5: Springback snap at threshold**
    - For any remaining distance in (0, 1], camera snaps to original radius (offset by cameraSkin in collision mode)
    - **Validates: Requirements 2.3, 5.4**

  - [x] 4.3 Write property test for original radius capture invariant (Property 1)
    - **Property 1: Original radius capture and invariant**
    - First push-in stores radius; subsequent push-ins do not overwrite
    - **Validates: Requirements 1.1, 1.2**

  - [x] 4.4 Write property test for convergence threshold clearing (Property 2)
    - **Property 2: Original radius cleared at convergence threshold**
    - When |currentRadius - _originalRadius| <= 0.01, _originalRadius is set to null
    - **Validates: Requirements 1.3**

  - [x] 4.5 Write property test for user radius change updates target (Property 3)
    - **Property 3: User radius change updates recovery target**
    - For any non-null _originalRadius and user-initiated radius change to R, _originalRadius becomes R
    - **Validates: Requirements 1.4**

  - [x] 4.6 Write property test for obstruction during springback (Property 6)
    - **Property 6: Obstruction during springback triggers push-in and preserves original radius**
    - New obstruction applies push-in; _originalRadius remains unchanged
    - **Validates: Requirements 2.4, 3.1, 3.2**

  - [x] 4.7 Write property test for springback resume after interruption (Property 7)
    - **Property 7: Springback resumes after interruption clears**
    - After interrupting obstruction clears, springback resumes toward same _originalRadius
    - **Validates: Requirements 3.3**

- [x] 5. Property-based tests for modes, settings, and clamping
  - [x] 5.1 Write property test for springback steps clamping (Property 8)
    - **Property 8: Springback steps clamping**
    - Any value < 1 passed to setSpringbackSteps is clamped to 1
    - **Validates: Requirements 4.3**

  - [x] 5.2 Write property test for collision-mode springback direction (Property 9)
    - **Property 9: Collision-mode springback moves camera position along correct vector**
    - Camera moves away from target along normalized (P - T) direction
    - **Validates: Requirements 5.1**

  - [x] 5.3 Write property test for radius-mode springback (Property 10)
    - **Property 10: Radius-mode springback increases camera radius**
    - When checkCollisions is false and no obstruction, camera.radius increases toward _originalRadius
    - **Validates: Requirements 5.2**

  - [x] 5.4 Write property test for disabled springback prevents recovery (Property 11)
    - **Property 11: Disabled springback or disabled elastic prevents recovery**
    - Camera radius remains unchanged when springback or elastic is disabled
    - **Validates: Requirements 6.3, 6.4**

  - [x] 5.5 Write property test for settings round-trip (Property 12)
    - **Property 12: Settings round-trip preserves springback configuration**
    - getSettings() then setSettings() preserves springback state and steps
    - **Validates: Requirements 7.1, 7.2**

  - [x] 5.6 Write property test for settings backward compatibility (Property 13)
    - **Property 13: Settings backward compatibility**
    - Restoring CCSettings without springback properties leaves current values unchanged
    - **Validates: Requirements 7.3**

  - [x] 5.7 Write property test for settings value constraint (Property 14)
    - **Property 14: Settings value constraint**
    - springbackSteps is always an integer clamped to [1, 1000] after save/restore
    - **Validates: Requirements 7.4**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All implementation is in `src/CharacterController.ts` following the single-file architecture
- Tests extract pure logic into standalone functions (no BabylonJS scene instantiation needed)
- Test files: `tests/elastic-springback-step-formula.test.ts`, `tests/elastic-springback-state-tracking.test.ts`, `tests/elastic-springback-modes.test.ts`, `tests/elastic-springback-settings.test.ts`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5"] },
    { "id": 3, "tasks": ["2.3"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "5.1", "5.5", "5.6", "5.7"] },
    { "id": 5, "tasks": ["4.6", "4.7", "5.2", "5.3", "5.4"] }
  ]
}
```
