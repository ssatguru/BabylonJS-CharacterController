# Implementation Plan: moveTo / turnTo

## Overview

This plan implements high-level navigation APIs (`moveTo()`, `moveToStop()`, `turnTo()`, `turnToStop()`) on the `CharacterController` class. The implementation adds navigation state fields, public API methods, per-frame update logic integrated into the existing render loop, and keyboard interrupt hooks. All code lives in the single-file architecture (`src/CharacterController.ts`).

## Tasks

- [x] 1. Add navigation state fields and interfaces
  - [x] 1.1 Define MoveToOptions and TurnToOptions interfaces and add navigation state fields
    - Add `MoveToOptions` interface with `run`, `arrivalDistance`, `obstructionThreshold` properties
    - Add `TurnToOptions` interface with `fast`, `angularTolerance` properties
    - Add private fields: `_moveToTarget`, `_moveToNode`, `_moveToRun`, `_moveToArrivalDist`, `_moveToObstructionThreshold`, `_moveToObstructionCount`, `_moveToActive`
    - Add private fields: `_turnToTarget`, `_turnToNode`, `_turnToAngle`, `_turnToTargetAngle`, `_turnToFast`, `_turnToAngularTolerance`, `_turnToActive`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 1.2 Implement pure helper functions for navigation logic
    - Implement `horizontalDistance(a: Vector3, b: Vector3): number` — XZ-plane distance
    - Implement `directionAngle(source: Vector3, target: Vector3, faceForward: boolean, isLHS_RHS: boolean): number` — Y rotation from source to target
    - Implement `shortestArcDelta(current: number, target: number): number` — normalized to [-π, π]
    - Implement `turnDirection(current: number, target: number): 'left' | 'right'`
    - Implement `isWithinArrival(distance: number, arrivalDistance: number): boolean`
    - Implement `isWithinAngularTolerance(delta: number, tolerance: number): boolean`
    - Implement `updateObstructionCount(frameDistance: number, threshold: number, currentCount: number): number`
    - Implement `clampPositive(value: number, defaultValue: number): number`
    - _Requirements: 1.3, 1.4, 3.1, 3.2, 5.1, 5.3, 9.6, 9.7, 9.8_

- [x] 2. Implement moveTo and moveToStop public API
  - [x] 2.1 Implement `moveTo()` method
    - Accept `target: Vector3 | TransformNode` and optional `options: MoveToOptions`
    - Validate and clamp parameters (arrivalDistance, obstructionThreshold) using `clampPositive()`
    - If target is a `TransformNode`: check if disposed (revert to idle if so), store in `_moveToNode`, get initial position into `_moveToTarget`
    - If target is a `Vector3`: store in `_moveToTarget`, clear `_moveToNode`
    - If already within arrival distance: call `idle()` and do not activate
    - Set `_moveToActive = true`, reset obstruction count
    - If replacing an existing moveTo, clear previous state first
    - _Requirements: 1.1, 1.2, 1.5, 1.7, 2.1, 2.7, 9.1, 9.2, 9.3, 10.1_

  - [x] 2.2 Implement `moveToStop()` method
    - Call `idle()` on the character
    - Clear all moveTo state fields (`_moveToTarget`, `_moveToNode`, `_moveToActive`, `_moveToObstructionCount`)
    - No-op if `_moveToActive` is false (do not call idle or alter state)
    - _Requirements: 1.6, 2.6, 4.1, 4.2, 4.3_

- [x] 3. Implement turnTo and turnToStop public API
  - [x] 3.1 Implement `turnTo()` method
    - Accept `target: Vector3 | TransformNode | number` and optional `options: TurnToOptions`
    - If target is `null` or `undefined`: ignore the call, return immediately
    - If target is a number:
      - If angle is 0: call `idle()` immediately, do not activate
      - If positive: compute absolute target angle (current Y + angle), store in `_turnToTargetAngle`
      - If negative: compute absolute target angle (current Y + angle), store in `_turnToTargetAngle`
    - If target is a `TransformNode`: store in `_turnToNode`, compute initial target angle
    - If target is a `Vector3`: store in `_turnToTarget`, compute initial target angle
    - If already within angular tolerance of target: do not initiate rotation
    - Validate `angularTolerance` with `clampPositive()`
    - Cancel any previous turnTo operation before starting new one
    - Set `_turnToActive = true`
    - _Requirements: 5.1, 5.2, 5.4, 6.1, 6.2, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.4, 9.5, 10.2_

  - [x] 3.2 Implement `turnToStop()` method
    - Call `idle()` on the character
    - Clear all turnTo state fields (`_turnToTarget`, `_turnToNode`, `_turnToAngle`, `_turnToTargetAngle`, `_turnToActive`)
    - No-op if `_turnToActive` is false (do not call idle or alter state)
    - _Requirements: 5.5, 6.5, 8.1, 8.2, 8.3_

- [x] 4. Implement per-frame navigation update logic
  - [x] 4.1 Implement `_updateMoveTo()` per-frame method
    - If `_moveToNode` is set and disposed: call `moveToStop()`, return
    - If `_moveToNode` is set: update `_moveToTarget` from `node.getAbsolutePosition()`
    - Compute horizontal distance from character to `_moveToTarget`
    - If within arrival distance:
      - For static target: call `idle()`, clear moveTo state
      - For node target: call `idle()` but remain active (will resume when node moves beyond arrival distance)
    - If node target and character is idle within arrival distance and node moves beyond: resume movement
    - Compute direction angle to target
    - If `_turnToActive` is false: orient character toward target (smooth rotation)
    - Issue `walk(true)` or `run(true)` based on `_moveToRun`
    - Compute frame movement distance on XZ plane
    - Update obstruction detection: increment count if below threshold, reset if above
    - If obstruction count >= 3: call `moveToStop()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 3.1, 3.2, 3.3, 3.4, 10.6_

  - [x] 4.2 Implement `_updateTurnTo()` per-frame method
    - If `_turnToNode` is set and disposed: call `turnToStop()`, return
    - If `_turnToNode` is set: compute target angle from character position to node world position
    - If `_turnToTarget` (Vector3) is set: compute target angle from character position to target
    - Compute shortest-arc delta from current Y rotation to `_turnToTargetAngle`
    - If within angular tolerance:
      - For node tracking: hold (remain active, stop turning commands)
      - For static/angle target: call `idle()`, clear turnTo state
    - If delta > 0: call `turnRight(true)` or `turnRightFast(true)` based on `_turnToFast`
    - If delta < 0: call `turnLeft(true)` or `turnLeftFast(true)` based on `_turnToFast`
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.3 Integrate navigation updates into `_moveAVandCamera()` render loop
    - Call `_updateMoveTo()` at the start of the render loop (before existing movement logic) when `_moveToActive` is true
    - Call `_updateTurnTo()` at the start of the render loop when `_turnToActive` is true
    - Ensure navigation commands flow through existing command infrastructure (animations, collision, camera)
    - _Requirements: 1.1, 1.4, 2.1, 5.1, 6.1_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement cancellation by manual commands and keyboard input
  - [x] 6.1 Add moveTo cancellation to manual movement commands
    - At the start of `walk()`, `walkBack()`, `run()`, `strafeLeft()`, `strafeRight()`, `jump()`, `fall()`, and `idle()`: if `_moveToActive` is true, clear moveTo state (without calling idle again to avoid recursion)
    - Ensure the manual command proceeds normally after cancellation
    - _Requirements: 10.3, 10.5_

  - [x] 6.2 Add turnTo cancellation to manual turn commands
    - At the start of `turnLeft()`, `turnRight()`, `turnLeftFast()`, `turnRightFast()`: if `_turnToActive` is true, clear turnTo state (without calling idle again)
    - Ensure the manual turn command proceeds normally after cancellation
    - _Requirements: 10.4, 10.5_

  - [x] 6.3 Add keyboard interrupt hooks in `_onKeyDown()` handler
    - At the top of the keydown handler: if keyboard is enabled and `_moveToActive` is true, cancel moveTo
    - At the top of the keydown handler: if keyboard is enabled and `_turnToActive` is true, cancel turnTo
    - Process the keyboard input normally after cancellation
    - Do not cancel if keyboard is disabled (`_ekb` is false)
    - _Requirements: 10.7, 10.8, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Property-based tests for navigation logic
  - [x] 8.1 Write property test for movement toward target reduces distance
    - **Property 1: Movement toward target reduces distance**
    - **Validates: Requirements 1.1, 1.2, 2.1**

  - [x] 8.2 Write property test for arrival detection stops movement
    - **Property 2: Arrival detection stops movement**
    - **Validates: Requirements 1.3, 1.7, 2.3**

  - [x] 8.3 Write property test for obstruction detection after consecutive stalled frames
    - **Property 3: Obstruction detection after consecutive stalled frames**
    - **Validates: Requirements 3.2, 3.4**

  - [x] 8.4 Write property test for follow mode resumes when node moves beyond arrival distance
    - **Property 4: Follow mode resumes when node moves beyond arrival distance**
    - **Validates: Requirements 2.4**

  - [x] 8.5 Write property test for shortest-arc direction selection
    - **Property 5: Shortest-arc direction selection for turnTo**
    - **Validates: Requirements 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4**

  - [x] 8.6 Write property test for angular arrival detection stops rotation
    - **Property 6: Angular arrival detection stops rotation**
    - **Validates: Requirements 5.3, 5.4, 7.5**

  - [x] 8.7 Write property test for invalid parameters clamped to defaults
    - **Property 7: Invalid parameters are clamped to defaults**
    - **Validates: Requirements 9.6, 9.7, 9.8**

  - [x] 8.8 Write property test for manual commands cancel active moveTo
    - **Property 8: Manual commands cancel active moveTo**
    - **Validates: Requirements 10.3**

  - [x] 8.9 Write property test for manual turn commands cancel active turnTo
    - **Property 9: Manual turn commands cancel active turnTo**
    - **Validates: Requirements 10.4**

  - [x] 8.10 Write property test for keyboard press cancels navigation when enabled
    - **Property 10: Keyboard press cancels navigation when keyboard is enabled**
    - **Validates: Requirements 10.7, 10.8, 11.1, 11.2, 11.3, 11.6**

  - [x] 8.11 Write property test for keyboard press does not cancel when disabled
    - **Property 11: Keyboard press does not cancel navigation when keyboard is disabled**
    - **Validates: Requirements 11.4**

  - [x] 8.12 Write property test for moveTo and turnTo independence
    - **Property 12: moveTo and turnTo operate independently**
    - **Validates: Requirements 10.6**

  - [x] 8.13 Write property test for stop methods are no-ops when inactive
    - **Property 13: moveToStop and turnToStop are no-ops when inactive**
    - **Validates: Requirements 4.3, 8.3**

  - [x] 8.14 Write property test for facing direction converges toward target
    - **Property 14: Facing direction converges toward target during moveTo**
    - **Validates: Requirements 1.4**

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Pure helper functions (task 1.2) follow the existing project pattern of extracting testable logic without BabylonJS scene instantiation
- The implementation uses TypeScript, matching the existing codebase
- All navigation logic integrates through existing command APIs (walk, run, turnLeft, turnRight, idle) to preserve animation, collision, and camera behavior

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2"] },
    { "id": 4, "tasks": ["4.1", "4.2"] },
    { "id": 5, "tasks": ["4.3"] },
    { "id": 6, "tasks": ["6.1", "6.2"] },
    { "id": 7, "tasks": ["6.3"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 9, "tasks": ["8.8", "8.9", "8.10", "8.11", "8.12", "8.13", "8.14"] }
  ]
}
```
