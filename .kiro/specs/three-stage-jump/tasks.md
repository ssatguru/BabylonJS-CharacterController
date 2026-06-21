# Implementation Plan: Three-Stage Jump

## Overview

Implement a three-stage jump sequence (pre-jump → jump → post-jump) as a state machine layered on top of the existing jump logic in `src/CharacterController.ts`. Each stage is gated by the presence of its corresponding animation — if absent, the stage is skipped. All changes are within the single-file architecture. Tests use vitest + fast-check for property-based testing.

## Tasks

- [x] 1. Add JumpStage enum, new ActionData entries, and state variables
  - [x] 1.1 Add JumpStage const enum and new state variables to CharacterController
    - Add `const enum JumpStage { NONE = 0, PRE_JUMP = 1, JUMP = 2, POST_JUMP = 3 }` before the class
    - Add private fields: `_jumpStage: JumpStage = JumpStage.NONE`, `_jumpStageTime: number = 0`, `_jumpStageDuration: number = 0`, `_jumpBuffered: boolean = false`, `_wasIdleJump: boolean = false`
    - _Requirements: 1.1, 1.2, 4.1, 4.2, 8.4_

  - [x] 1.2 Add new ActionData entries to ActionMap and Actions constant
    - Add `PREIDLEJUMP`, `POSTIDLEJUMP`, `PRERUNJUMP`, `POSTRUNJUMP` to the Actions constant
    - Add `preIdleJump`, `postIdleJump`, `preRunJump`, `postRunJump` as public ActionData properties in ActionMap with speed `0` and key `"na"`
    - _Requirements: 6.5, 6.7_

  - [x] 1.3 Add animation registration API methods
    - Add `setPreIdleJumpAnim`, `setPostIdleJumpAnim`, `setPreRunJumpAnim`, `setPostRunJumpAnim` following existing `set*Anim` pattern
    - Each accepts `(rangeName: string | AnimationGroup, rate: number, loop: boolean)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Implement the three-stage jump state machine
  - [x] 2.1 Implement `_getAnimDuration` helper method
    - Pure function: computes playback duration as `frameCount / (fps × |rate|)`
    - Handle AnimationGroup path (use `ag.to - ag.from` and `targetedAnimations[0].animation.framePerSecond`)
    - Handle AnimationRange path (use skeleton range, default 30 fps)
    - Return 0 for null/missing data (graceful degradation)
    - _Requirements: 1.1, 1.2, 4.1, 4.2_

  - [x] 2.2 Implement `_beginJump` method
    - Determine `_wasIdleJump` from movement state
    - Check if corresponding pre-jump animation exists
    - If exists: set `_jumpStage = PRE_JUMP`, compute duration, return pre-anim ActionData
    - If missing: set `_jumpStage = JUMP`, delegate to `_doJumpAirborne`
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x] 2.3 Implement `_doPreJump` method
    - Accumulate `_jumpStageTime += dt`
    - When `_jumpStageTime >= _jumpStageDuration`: transition to `_jumpStage = JUMP`
    - Keep avatar grounded (no vertical displacement)
    - Return pre-jump ActionData for animation playback
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.4 Refactor existing `_doJump` into `_doJumpAirborne` and make `_doJump` a dispatcher
    - Extract current `_doJump` body into `_doJumpAirborne(dt)`
    - Rewrite `_doJump` as a switch on `_jumpStage`: NONE → `_beginJump`, PRE_JUMP → `_doPreJump`, JUMP → `_doJumpAirborne`, POST_JUMP → `_doPostJump`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.5 Implement `_doPostJump` method
    - Accumulate `_jumpStageTime += dt`
    - When `_jumpStageTime >= _jumpStageDuration`: call `_endJumpFull()`, check `_jumpBuffered`
    - Keep avatar grounded (no vertical displacement)
    - Return post-jump ActionData for animation playback
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.6 Implement `_endJump` modification and `_endJumpFull` extraction
    - Modify `_endJump`: check post-jump animation existence; if exists, transition to POST_JUMP instead of clearing state
    - Extract original cleanup into `_endJumpFull()`: clears `_act._jump`, resets `_jumpStage` to NONE, resets all jump state variables
    - Handle buffered jump: if `_jumpBuffered` was true, set `_act._jump = true` after cleanup
    - _Requirements: 4.1, 4.5, 5.1, 5.2, 5.3_

- [x] 3. Implement input handling and API modifications
  - [x] 3.1 Modify `_onKeyDown` to gate jump and movement inputs by jump stage
    - Jump key: ignore during PRE_JUMP and JUMP; buffer during POST_JUMP; accept only during NONE
    - Movement keys (walk, walkback, strafe, turn): ignore during PRE_JUMP and POST_JUMP
    - _Requirements: 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.2 Modify public `jump()` method for three-stage compatibility
    - Add guard: if `_jumpStage !== JumpStage.NONE` return immediately
    - Keep existing `_inFreeFall` guard
    - Call `_act.reset()` then set `_act._jump = true`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 3.3 Add auto-detection guard in `_checkAnimRanges`
    - Add `if (anim.exist) continue;` before auto-detection logic to preserve manual registrations
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Property-based tests for three-stage jump state machine
  - [x] 5.1 Write property test: pre-jump keeps avatar grounded
    - **Property 1: Pre-jump keeps avatar grounded**
    - Test that for any valid dt, jumpSpeed, gravity, when `_jumpStage === PRE_JUMP`, no vertical displacement is produced
    - **Validates: Requirements 1.1, 1.2**

  - [x] 5.2 Write property test: pre-jump completion transitions to jump stage
    - **Property 2: Pre-jump completion transitions to jump stage**
    - Test that when `_jumpStageTime + dt >= _jumpStageDuration`, the stage transitions to JUMP
    - **Validates: Requirements 1.3**

  - [x] 5.3 Write property test: pre-jump skip when animation missing
    - **Property 3: Pre-jump skip when animation missing**
    - Test that `beginJump` returns JUMP stage directly when preAnim.exist is false
    - **Validates: Requirements 2.1, 2.2**

  - [x] 5.4 Write property test: backward compatibility with no pre/post animations
    - **Property 4: Backward compatibility with no pre/post animations**
    - Test that when all pre/post exist flags are false, the state machine produces same displacement as original single-stage implementation
    - **Validates: Requirements 2.3**

  - [x] 5.5 Write property test: jump displacement formula correctness
    - **Property 5: Jump displacement formula correctness**
    - Test `calcJumpDist(speed, gravity, jumpTime, dt) === (speed - gravity * jumpTime) * dt - 0.5 * gravity * dt²`
    - **Validates: Requirements 3.4**

  - [x] 5.6 Write property test: jump stage uses correct speed components
    - **Property 6: Jump stage uses correct speed components**
    - Test that idle jump has zero horizontal displacement and uses idleJump.speed vertically; walk/run jumps use walk/run speed horizontally
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 5.7 Write property test: landing detection ends jump stage
    - **Property 7: Landing detection ends jump stage**
    - Test that when calcJumpDist returns negative and avatar is at/above start height, jump stage ends
    - **Validates: Requirements 3.5**

  - [x] 5.8 Write property test: post-jump stage entered when animation exists
    - **Property 8: Post-jump stage entered when animation exists**
    - Test that landing with postAnim.exist === true transitions to POST_JUMP with _act._jump still true
    - **Validates: Requirements 4.1, 4.2**

  - [x] 5.9 Write property test: post-jump skip and cleanup when animation missing
    - **Property 9: Post-jump skip and cleanup when animation missing**
    - Test that landing with postAnim.exist === false calls _endJumpFull and clears all state
    - **Validates: Requirements 4.5, 5.1, 5.2, 5.3**

  - [x] 5.10 Write property test: jump inputs ignored during pre-jump and airborne
    - **Property 10: Jump inputs ignored during pre-jump and airborne stages**
    - Test that handleJumpInput returns {accepted: false, buffered: false} when stage is PRE_JUMP or JUMP
    - **Validates: Requirements 1.4, 8.1, 8.2**

  - [x] 5.11 Write property test: movement inputs ignored during pre-jump and post-jump
    - **Property 11: Movement inputs ignored during pre-jump and post-jump stages**
    - Test that handleMovementInput returns false when stage is PRE_JUMP or POST_JUMP
    - **Validates: Requirements 8.3, 8.5**

  - [x] 5.12 Write property test: jump buffering during post-jump
    - **Property 12: Jump buffering during post-jump**
    - Test that N≥1 jump presses during POST_JUMP result in `_jumpBuffered === true` and new jump triggers after completion
    - **Validates: Requirements 8.4**

  - [x] 5.13 Write property test: post-jump completion restores normal processing
    - **Property 13: Post-jump completion restores normal processing**
    - Test that when POST_JUMP completes, `_act._jump === false` and `_jumpStage === NONE`
    - **Validates: Requirements 4.3, 4.4**

  - [x] 5.14 Write property test: programmatic jump() triggers same state machine
    - **Property 14: Programmatic jump() triggers same state machine**
    - Test that jump() from grounded state with NONE stage enters PRE_JUMP or JUMP based on animation existence
    - **Validates: Requirements 9.1**

  - [x] 5.15 Write property test: jump() ignored during active jump or free-fall
    - **Property 15: jump() ignored during active jump or free-fall**
    - Test that jump() with `_jumpStage !== NONE` or `_inFreeFall === true` does not modify state
    - **Validates: Requirements 9.2, 9.3**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All implementation is within `src/CharacterController.ts` (single-file architecture)
- Tests go in `tests/` folder using vitest + fast-check
- The design uses TypeScript — all code examples and implementation use TypeScript

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.5"] },
    { "id": 3, "tasks": ["2.4", "2.6"] },
    { "id": 4, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6", "5.7", "5.8", "5.9", "5.10"] },
    { "id": 7, "tasks": ["5.11", "5.12", "5.13", "5.14", "5.15"] }
  ]
}
```
