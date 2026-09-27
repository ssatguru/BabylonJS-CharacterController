# Implementation Plan: WebXR Support

## Overview

This plan implements WebXR (immersive VR/AR) support for the `CharacterController` library by adding four new modules under `src/xr/` and wiring thin public delegates into the existing `CharacterController` class. The work proceeds pure-logic-first (the three BabylonJS-free modules that carry the machine-verifiable correctness properties), then the BabylonJS-facing `XRController` glue built up concern by concern, then the public API delegates and re-exports, and finally the ESM import-map/bridge additions and build-integrity verification.

Each prompt builds on the previous ones and ends by wiring the new code into the library entry point so nothing is left orphaned. Testing follows the library's established pattern: pure modules get fast-check property tests plus focused unit tests (imported directly, no scene); the `XRController` glue is validated against mocked BabylonJS (a fake `onBeforeRenderObservable`, a mocked WebXR experience/feature manager, and a mocked `ArcRotateCamera`/`CharacterController`).

Language: **TypeScript** (matches the design and the existing library).

## Tasks

- [x] 1. Create the pure input-mapping module (`src/xr/XRInputMapping.ts`)
  - [x] 1.1 Define input-mapping enums, types, defaults, and constants
    - Create `src/xr/XRInputMapping.ts`
    - Define `BindableAction` enum (`Move`, `FastModifier`, `Jump`, `CameraOrbit`, `CameraDollyIn`, `CameraDollyOut`, `DollyToAvatarToggle`, `LocomotionModeToggle`, `Teleport`)
    - Define `BindableInput` enum (6 stick/trigger inputs + 8 a/b/x/y face buttons, values per R18.3)
    - Define `XRInputMapping = Record<BindableAction, BindableInput | null>` and `MappingResult { applied, rejected, reason? }`
    - Define the `Axis_Input` / `Axis_Action` type partitions (all others button-typed) used by validation
    - Define `DEFAULT_XR_INPUT_MAPPING` with the documented bindings (Move→left-thumbstick-axes, FastModifier→left-thumbstick-press, Jump→left-trigger, DollyToAvatarToggle→left-x-button, CameraOrbit→right-thumbstick-axes, CameraDollyIn→right-b-button, CameraDollyOut→right-a-button, LocomotionModeToggle→left-a-button, Teleport→null)
    - Define the standard WebXR component-id constants (`xr-standard-thumbstick`, `xr-standard-trigger`, `a-button`, `b-button`, `x-button`, `y-button`) and the (handedness + component id) resolution map for each `BindableInput`
    - _Requirements: 18.2, 18.3, 18.5_

  - [x] 1.2 Implement `mergeXRInputMapping` and `validateXRInputMapping`
    - Implement `mergeXRInputMapping(partial)`: overlay a partial onto `DEFAULT_XR_INPUT_MAPPING`, keeping defaults for unspecified actions
    - Implement `validateXRInputMapping(mapping)`: reject when any key/value is outside the enums, when a single input is bound to two or more conflicting actions, or when an `Axis_Action` is bound to a `Button_Input` / a `Button_Action` to an `Axis_Input`; return `{ applied:true, rejected:false }` when valid, else `{ rejected:true, reason }`
    - _Requirements: 18.6, 18.9, 18.11, 18.12, 18.13_

  - [ ]* 1.3 Write property test for effective-mapping overlay
    - `tests/xr-input-mapping-merge.test.ts`, tagged "Feature: webxr-support, Property 8"
    - **Property 8: Effective mapping overlays a partial onto the default**
    - **Validates: Requirements 18.6, 18.9**

  - [ ]* 1.4 Write property test for mapping validation and keep-previous
    - `tests/xr-input-mapping-validation.test.ts`, tagged "Feature: webxr-support, Property 9"
    - **Property 9: Invalid mappings are rejected and the previous mapping is retained**
    - Cover unknown enum, conflict, axis/button type-mismatch, and accept-valid cases
    - **Validates: Requirements 18.1, 18.11, 18.12, 18.13, 18.14**

- [x] 2. Create the pure XR support-detection module (`src/xr/XRSupport.ts`)
  - [x] 2.1 Implement `computeXRSupportResult` and `detectXRSupport`
    - Create `src/xr/XRSupport.ts`
    - Define `XRSupportState { vrSupported, arSupported }`
    - Implement pure `computeXRSupportResult(vr, ar)` mapping each `true | false | 'error'` outcome independently, treating `'error'` as unsupported
    - Implement async `detectXRSupport()`: query `WebXRSessionManager.IsSessionSupportedAsync` for `immersive-vr` and `immersive-ar` independently, each wrapped so rejection/absence yields `false`; short-circuit both to `false` when `navigator.xr` is absent; never throw
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 2.2 Write property test for capability mapping
    - `tests/xr-support-capability-mapping.test.ts`, tagged "Feature: webxr-support, Property 1"
    - **Property 1: Capability mapping reflects support independently**
    - Cover all `{vr, ar} ∈ {true, false, error}` combinations
    - **Validates: Requirements 16.1, 16.3**

- [x] 3. Create the pure locomotion module (`src/xr/XRLocomotion.ts`)
  - [x] 3.1 Implement the `XRLocomotion` state machine
    - Create `src/xr/XRLocomotion.ts`
    - Define `LocomotionMode` and `ToggleResult { mode, changed, blocked }`
    - Implement `XRLocomotion` with `constructor(initial?)` (default `thirdPerson`), `getMode()`, `setMode(mode, canFirstPerson)`, `toggle(canFirstPerson)`
    - Enforce the guard: a transition to `firstPerson` requires `canFirstPerson === true` else `{ blocked:true, changed:false }` unchanged; transition to `thirdPerson` always allowed and never blocked; `changed` true only when the resulting mode differs from the prior mode
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Implement `mapStickToIntent` and `neutralMoveIntent`
    - Define `DEFAULT_STICK_DEADZONE = 0.15`, `StickInput { leftX, leftY }`, `MoveIntent { walk, walkBack, strafeLeft, strafeRight }`
    - Implement `neutralMoveIntent()`
    - Implement `mapStickToIntent(input, deadzone?)`: dominant-axis (larger raw magnitude wins; ties → forward/back), deadzone gates the winning axis, sign convention `leftY < -dz → walk`, `leftY > dz → walkBack`, `leftX > dz → strafeRight`, `leftX < -dz → strafeLeft`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.3 Write property test for the locomotion guard invariant
    - `tests/xr-locomotion-guard.test.ts`, tagged "Feature: webxr-support, Property 2"
    - **Property 2: First-person is unreachable without permission**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.6**

  - [ ]* 3.4 Write property test for toggle involution and transition reporting
    - `tests/xr-locomotion-involution.test.ts`, tagged "Feature: webxr-support, Property 3"
    - **Property 3: Toggle involution under permission**
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 3.5 Write property test for the left-stick mapper
    - `tests/xr-stick-to-intent.test.ts`, tagged "Feature: webxr-support, Property 4"
    - **Property 4: Left-stick mapping is dominant-axis, signed, and deadzoned**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 4. Checkpoint - pure modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create the `XRController` glue skeleton: lifecycle & enable/disable (`src/xr/XRController.ts`)
  - [x] 5.1 Implement construction and enable/disable
    - Create `src/xr/XRController.ts` as a normally-named exported class with underscore-prefixed private members
    - `constructor(cc, camera, scene)`: record references, construct `XRLocomotion`, seed `_effectiveMapping = DEFAULT_XR_INPUT_MAPPING`, init sensitivity rates and `entryBlendFrame` to inert
    - `enable(xr?)`: adopt provided experience/camera or `createDefaultXRExperienceAsync({ disableTeleportation: true })`; register the `WebXRState` observer; on re-enable replace the stored reference and re-register; resolve `true`; on any failure leave state untouched and resolve `false`; never throw
    - `disable()`: if a session is active restore ArcRotate_Mode first, release the stored reference, unregister the state observer; no-op when not enabled
    - Guard all BabylonJS access so the class never throws under mocks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 5.2 Implement session enter/exit and lifecycle hooks
    - `enter(type)`: guard on support, enter the base experience with `local-floor` reference space, reuse the single experience across sessions; no-op when disabled/unsupported
    - `exit()`: idempotent no-op when not in session, else `exitXRAsync`
    - `isInXR()`: true only while a session is active
    - `onSessionStart(type)`: record desktop snapshot, disable keyboard only (keep CC running), reset per-session state, register the D15 initial-pose hook (implemented in task 12.3), set locomotion default from `No_First_Person` and apply coupling, build `Effective_Mapping`, bind inputs, start the render observer
    - `onSessionEnd()`: guard on `inXR`, push neutral intent, detach all per-session observers, clear captures, restore keyboard + running + active camera
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.7, 3.8_

  - [x] 5.3 Write unit tests for lifecycle and enable/disable
    - Mocked WebXR experience/feature manager + mocked CharacterController/ArcRotateCamera + fake `onBeforeRenderObservable`
    - Cover adopt-provided (R1.1), create-default (R1.2), false+untouched on failure (R1.3, R1.4), re-enable replaces+re-registers (R1.5), disable variants incl. restore-first-when-active (R1.6–R1.8), unenabled no-op parity (R1.9), single reused experience + `local-floor` (R2.1, R2.2), `isInXR` tracking (R2.3), exit restore / idempotent / re-enter / entered-while-disabled (R2.4–R2.7), session-start default from `noFirstPerson` (R3.7, R3.8)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.7, 3.8_

- [x] 6. Implement locomotion mode → camera coupling in `XRController`
  - [x] 6.1 Implement `canFirstPerson` and `applyLocomotionMode`
    - `canFirstPerson()`: `!cc.getSettings().noFirstPerson`
    - `applyLocomotionMode(mode)`: ensure teleport disabled, `cc.setNoFirstPerson(mode !== 'firstPerson')`, leave the movement mechanism unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Write unit tests for mode → coupling
    - `setNoFirstPerson(false/true)` per mode (R4.1, R4.2), teleport not active on apply (R4.3), movement mechanism unchanged on mode change (R4.4)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Implement left-stick movement sampling in `XRController`
  - [x] 7.1 Implement stick sampler, intent application, and edge-triggered movement
    - `startStickSampler()` / `stopStickSampler()`: register/detach the per-frame `onBeforeRenderObservable` observer
    - `sampleSticks()`: read bound left/right axes, call `mapStickToIntent` → `applyIntent`, then `applyCameraOrbit` and `applyButtonDolly` (orbit/dolly stubbed until tasks 9–10), run before the follow update
    - `applyIntent(intent, fast)`: diff against `_lastIntent`/`_lastFast`, edge-trigger via `applyMovementDirection`
    - `applyMovementDirection(...)`: emit minimal on/off calls per direction
    - `stopAllMovement()`: push a neutral intent (used on session end)
    - Provide `setStickDeadzone(v)` clamping to `[0,1]`, default `0.15`
    - _Requirements: 6.1, 6.6, 6.7, 6.8_

  - [x] 7.2 Write property test for the deadzone setter
    - `tests/xr-deadzone-setter.test.ts`, tagged "Feature: webxr-support, Property 6"
    - **Property 6: Deadzone setter is clamped to [0, 1]**
    - **Validates: Requirements 6.8**

  - [x] 7.3 Write unit tests for stick movement wiring
    - Per-frame sampling wiring (R6.1), edge-triggered on/off calls (R6.6), neutral intent on exit (R6.7)
    - _Requirements: 6.1, 6.6, 6.7_

- [x] 8. Implement fast movement (left-stick press) in `XRController`
  - [x] 8.1 Derive fast flag and switch normal↔fast variants
    - Derive `fast` from the left-stick pressed state, combine in `applyIntent`
    - In `applyMovementDirection`, drive the fast variant (`run`, `walkBackFast`, `strafeLeftFast`, `strafeRightFast`) for the active direction while pressed; switch back to the normal variant on release; stop the previous-speed method and start the new-speed method so both are never active at once
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Write unit tests for fast movement
    - Pressed switches normal↔fast for the active direction; never both speeds at once (R7.1–R7.3)
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Implement jump (left trigger) in `XRController`
  - [x] 9.1 Wire the left-trigger rising-edge jump handler
    - Bind the left trigger rising edge → `cc.jump()` once; do not bind jump to the right trigger; detach the trigger observers on session end
    - Track the trigger observer in a per-stream array for teardown
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 9.2 Write unit tests for jump
    - Left trigger rising edge → one `jump()` (R8.1), right trigger → none (R8.2), observers detached on exit (R8.3)
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 10. Implement camera orbit (right stick) in `XRController`
  - [x] 10.1 Implement `applyCameraOrbit` and `clampBeta`
    - `applyCameraOrbit(rightX, rightY)`: deadzone-gated, dominant-axis (ties → alpha), `alpha += alphaRate*x` OR `beta += betaRate*y` (decrease beta for `rightY < 0`), then `clampBeta`; mark the arc camera dirty; never rotate the avatar
    - `clampBeta()`: clamp `beta` to camera `lowerBetaLimit`/`upperBetaLimit` when present, else pole-avoiding fallback `0.05 .. (π − 0.05)`
    - Guard all camera access so the per-frame sampler never throws
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 10.2 Write property test for orbit selection gate
    - `tests/xr-orbit-selection.test.ts`, tagged "Feature: webxr-support, Property 5"
    - **Property 5: Right-stick orbit selection is dominant-axis with ties to alpha**
    - **Validates: Requirements 9.3**

  - [x] 10.3 Write unit tests for camera orbit
    - alpha/beta deltas from `rate*axis` and beta clamp (R9.1, R9.2), no avatar rotation (R9.4)
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 11. Implement camera dolly (right B/A + left X) in `XRController`
  - [x] 11.1 Implement `applyButtonDolly` and `toggleDollyToAvatar`
    - `applyButtonDolly()`: dolly-in held → `radius -= radiusRate`; dolly-out held → `radius += radiusRate`; clamp to `lowerRadiusLimit`/`upperRadiusLimit` only for whichever bound is present; call `arc.computeWorldMatrix(true)` only when a dolly (or orbit) actually changed the camera this frame
    - `toggleDollyToAvatar()`: left-X rising edge → snap `radius` to `lowerRadiusLimit` (or 0), remember prior radius; or restore the remembered value
    - Capture the right B/A dolly components only on the right controller by handedness; clear those captures on session end
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 11.2 Write unit tests for camera dolly
    - Continuous B/A radius delta + limit clamp (R10.1–R10.3), left-X dolly-to-avatar round-trip (R10.4), right-only capture cleared on exit (R10.5)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Implement XR camera follow with entry-blend glide in `XRController`
  - [x] 12.1 Implement `updateXRCameraFollow` and the entry-blend glide
    - `getXRCamera()`: return the rendered `WebXRCamera`
    - `updateXRCameraFollow()`: run unconditionally every frame — `setTransformationFromNonVRCamera(arcCamera, true)` then copy the arc camera's Y onto the XR camera Y (produces the live follow target); run after stick sampling
    - Entry-blend: reset `entryBlendFrame` to 0 and clear `entryBlendOffset{X,Y,Z}` on session start; capture the offset once on the first blend frame as `(on-entry XR camera position − live follow target)`; each frame while `entryBlendFrame < ENTRY_BLEND_FRAMES` render at `target + offset * ease` with `ease = smoothstep(1 − (frame+1)/ENTRY_BLEND_FRAMES)`; increment `entryBlendFrame`; go inert at `ENTRY_BLEND_FRAMES` (default 90)
    - Detach the per-frame render observer on session end
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 12.2 Write unit tests for follow + entry-blend
    - Per-frame `setTransformationFromNonVRCamera` then arc-Y copy (R11.1, R11.2), follow after sampling (R11.3), render observer detached on exit (R11.4); entry-blend ease decays monotonically to zero against a fake render observable
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 12.3 Implement the D15 initial-pose hook (seed XR camera onto the follow pose at entry)
    - Add `registerInitialPoseHook()` (called from `onSessionStart`): register a one-shot observer on `experience.baseExperience.onInitialXRPoseSetObservable` that, on the first XR pose (before the first render), computes the live follow target (the same `setTransformationFromNonVRCamera(arcCamera, true)` mirror + arc-camera-Y re-apply used by `updateXRCameraFollow`) and sets the `WebXRCamera` transform directly onto it, so the floor/eye-level Y drop never appears
    - Fall back to seeding on the `WebXRState.IN_XR` transition when `onInitialXRPoseSetObservable` is unavailable (add-guarded, one-shot)
    - Because the seed lands the camera on the follow pose, the D10 entry-blend offset captured on the first blend frame is near-zero; keep the glide as the secondary smoother (no behavior change to task 12.1)
    - Guard all BabylonJS/observable access so a missing observable never throws (D9); ensure the one-shot observer is removed after firing and torn down on session end with the other per-session observers
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 12.4 Write unit tests for the initial-pose hook
    - Against a mocked experience exposing `baseExperience.onInitialXRPoseSetObservable`: firing the observable seeds the XR camera onto the follow target before the first render frame; the observer is one-shot (does not re-seed on later poses) and is detached on session end
    - Cover the `IN_XR` fallback path when the observable is absent; hook access is guarded and never throws under mocks
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 13. Checkpoint - core XR glue movement/camera complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement data-driven controller binding & in-session toggle in `XRController`
  - [x] 14.1 Implement `bindInputs`, `rebindActiveSession`, and action handlers
    - `bindInputs(experience)`: persistent `onControllerAddedObservable` hook; on motion-controller init, for every `BindableAction` look up its bound `BindableInput` in `_effectiveMapping`, resolve the matching component by handedness, and attach the handler; skip unbound (`null`) actions
    - Wire handlers: `Move`, `FastModifier`, `Jump`, `CameraOrbit`, `CameraDollyIn`/`CameraDollyOut`, `DollyToAvatarToggle`, `LocomotionModeToggle`, `Teleport` (retained, not enabled)
    - `rebindActiveSession()`: re-run `bindInputs` against the live session
    - Track controller-added, per-source motion-controller-init, toggle-button, and trigger-button observers in per-stream arrays for teardown
    - _Requirements: 18.7, 18.8, 18.10_

  - [x] 14.2 Implement `handleToggleRequest` and blocked-toggle haptic feedback
    - `handleToggleRequest()`: derive `canFirstPerson` as negation of `No_First_Person`, drive `XRLocomotion.toggle`, reconfigure coupling on change, record the requesting controller; on block emit `emitToggleBlockedFeedback`
    - `emitToggleBlockedFeedback(controller)`: best-effort `motionController.pulse(0.5, 100)` with rejection swallowed + console log; guarded so the toggle still resolves; A/X face bound only, not the trigger; repeatable within a session
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 14.3 Write unit tests for binding and toggle
    - A/X face bound, trigger not (R5.1); `canFirstPerson` negation (R5.2); reconfigure on change (R5.3); blocked → stay thirdPerson + haptic attempted (R5.4); repeatable (R5.5); default equals documented bindings (R18.4, R18.5); valid mapping applied on next entry (R18.7); re-apply during active session (R18.8); unbound action wires no handler and never fires (R18.10)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 18.4, 18.7, 18.8, 18.10_

- [x] 15. Implement controller ray management in `XRController`
  - [x] 15.1 Implement left-ray hide and right-ring raise with retry-until-present
    - Resolve the pointer-selection feature via `featuresManager.getEnabledFeature(POINTER_SELECTION)` with `experience.pointerSelection` fallback; look up a controller's entry in the private `_controllers` map by `uniqueId` then by scanning for matching `.xrController`; try/catch-guard all access
    - `rememberLeftControllerAndHideRay` / `retryHideLeftControllerRay` / `hideLeftControllerRay`: hide left laser + selection ring (`isVisible=false`, `setEnabled(false)`), retry per frame until meshes exist, then latch
    - `retryRaiseRightSelectionRing` / `raiseRightSelectionRingRenderingGroup`: raise right ring/laser `renderingGroupId = 2`, retry per frame until present, then latch
    - `resetRayState()`: clear latches on session end so the next session re-applies
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 15.2 Write unit tests for ray management
    - Left ray hidden, right ring raised, retry-until-present then stop, reset on end (R13.1–R13.4)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 16. Implement retained teleport / point-to-move in `XRController`
  - [x] 16.1 Implement `disableTeleportation` and `handleSelect`
    - `disableTeleportation(fm)`: defensive teardown of any legacy-enabled teleport feature; teleport never enabled by the active flow
    - `handleSelect(pick)`: with a valid picked ground point drive the avatar via `cc.moveTo`; with no valid pick do nothing; not routed by the active flow (select not routed through point-to-move during a session)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 16.2 Write property test for point-to-move pick guard
    - `tests/xr-point-to-move-guard.test.ts`, tagged "Feature: webxr-support, Property 10"
    - **Property 10: Retained point-to-move requires a valid pick**
    - **Validates: Requirements 14.2, 14.3**

- [x] 17. Implement desktop preserve/restore in `XRController`
  - [x] 17.1 Implement preserve/restore and observer teardown
    - `disableDesktopController()` / `restoreDesktopController()`: keep CC running, disable/restore keyboard, record `ccStarted` / `ccKeyboardEnabled`
    - `restoreArcRotateMode()`: restore the `ArcRotateCamera` as the active rendered camera and re-attach controls
    - `detachSessionObservers()`: tear down all per-session observers (controller-added, motion-controller-init, toggle-button, trigger-button, render) and clear right B/A captures on exit so enter/exit cycles never accumulate handlers
    - Leave collision handling, slope limits, and animation behavior untouched throughout
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 17.1, 17.2, 17.3_

  - [x] 17.2 Write unit tests for preserve/restore and consistency
    - Keyboard-only disable while running + restore (R15.1, R15.2), ArcRotate_Mode restored (R15.3), observer add-count == remove-count across cycles (R15.4), untouched collision/slope/animation (R15.5); XR movement routes through `moveWithCollisions`-based methods + action-driven animation (R17.1, R17.2); documents `jump()` resets movement action state (R17.3)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 17.1, 17.2, 17.3_

- [x] 18. Implement sensitivity-rate state and setters in `XRController`
  - [x] 18.1 Add sensitivity-rate instance state and clamped setters
    - Hold `alphaRate` (0.0075), `betaRate` (0.003), `radiusRate` (0.05) as adjustable state
    - Setters for `alphaRate`/`betaRate` clamp to `0…0.02`; setter for `radiusRate` clamps to `0…0.2`; non-finite input leaves the corresponding rate unchanged
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 18.2 Write property test for sensitivity setters
    - `tests/xr-sensitivity-setters.test.ts`, tagged "Feature: webxr-support, Property 7"
    - **Property 7: Sensitivity setters clamp in range and ignore non-finite input**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 19. Checkpoint - XRController glue complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Wire the public XR API into `CharacterController` and re-export XR types
  - [x] 20.1 Add the public XR delegate methods to `CharacterController`
    - In `src/CharacterController.ts` add a lazily-constructed `private _xr: XRController | null = null`
    - Add `XRSessionType = 'vr' | 'ar'`
    - Add delegates: `enableXR(xr?)`, `disableXR()`, `enterXR(type)`, `exitXR()`, `isInXR()`, `isXRSupported()`, `setXRStickDeadzone(v)`, `setXROrbitAlphaRate(v)`, `setXROrbitBetaRate(v)`, `setXRDollyRate(v)`, `setXRInputMapping(mapping)`, `getDefaultXRInputMapping()`, `getEffectiveXRInputMapping()`
    - `setXRInputMapping`: merge the partial, validate, store as effective only if valid and return `{ applied:true }`, else leave effective unchanged and return `{ rejected:true, reason }`
    - `isXRSupported()` returns `{ vrSupported:false, arSupported:false }` when `_xr` is null; all public methods no-op or resolve safely when `_xr` is null (R1.9, R2.7, R16.4)
    - Leave existing core classes (`_Action`, `ActionData`, `ActionMap`, `CCSettings`) unchanged
    - _Requirements: 1.9, 2.7, 6.8, 12.1, 12.2, 12.3, 12.4, 16.4, 16.5, 18.1, 18.4, 18.5, 18.6, 18.14_

  - [x] 20.2 Re-export the public XR types/enums/functions from the entry point
    - From `src/CharacterController.ts` re-export `XRSessionType`, `XRSupportState`, `LocomotionMode`, `ToggleResult`, `MoveIntent`, `StickInput`, `BindableAction`, `BindableInput`, `XRInputMapping`, `MappingResult`, `DEFAULT_XR_INPUT_MAPPING`, `detectXRSupport`, `mapStickToIntent`, `XRLocomotion`, `mergeXRInputMapping`, `validateXRInputMapping` so they appear in the shared `dist/CharacterController.d.ts`
    - _Requirements: 16.5, 18.2, 18.3, 18.5_

  - [x] 20.3 Write unit tests for public delegates and support exposure
    - `{false,false}` before enable (R16.4), state shape exposed (R16.5), `navigator.xr` absent edge case (R16.2); `setXRInputMapping` accept/reject-and-keep-previous parity (R18.1, R18.14); enums contain documented members (R18.2, R18.3); default equals documented bindings (R18.4, R18.5); effective overlay (R18.6)
    - _Requirements: 16.2, 16.4, 16.5, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.14_

- [x] 21. Add ESM import-map and bridge entries for new WebXR types
  - [x] 21.1 Update `webpack.es-externals.js` and `src/_babylonjs-esm-bridge.js`
    - Add every new BabylonJS type imported by `src/xr/*.ts` (`WebXRDefaultExperience`, `WebXRCamera`, `WebXRState`, `WebXRSessionManager`, `WebXRFeaturesManager`, `WebXRMotionControllerTeleportation`, `WebXRControllerPointerSelection`, `WebXRInputSource`, plus any others actually imported) to the `BABYLONJS_ES6_MAP` in `webpack.es-externals.js`
    - Add matching `export { ... } from "@babylonjs/core/..."` re-export lines to `src/_babylonjs-esm-bridge.js`
    - Confirm exact `@babylonjs/core` sub-paths against the installed version
    - _Requirements: 1.1, 1.2_

  - [x] 21.2 Verify build-integrity tests pass
    - Confirm `tests/esm-import-map-completeness.test.ts`, `tests/esm-output-externals.test.ts`, `tests/esm-output-integration.test.ts`, `tests/package-entry-points.test.ts`, and `tests/webpack-config-structure.test.ts` still pass with the new imports
    - _Requirements: 1.1, 1.2_

- [x] 22. Add a changelog entry
  - [x] 22.1 Document the WebXR feature in `changelog.md`
    - Add an entry describing the new WebXR support: public XR API on `CharacterController`, thumbstick-primary locomotion, follow-camera mirroring, configurable input mapping, and the new `src/xr/` modules
    - _Requirements: 1.1_

- [x] 23. Final checkpoint - full build and test
  - Ensure `npm test` and `npm run build` pass; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation sub-tasks are never optional.
- Each task references specific requirements for traceability; property-test tasks name the design property they validate and are tagged "Feature: webxr-support, Property N".
- The three pure modules (`XRInputMapping`, `XRSupport`, `XRLocomotion`) carry all 10 correctness properties and are built first so the machine-verifiable behavior is proven before the stateful glue depends on it.
- The `XRController` glue is built concern-by-concern (lifecycle → coupling → movement → fast → jump → orbit → dolly → follow → binding/toggle → rays → retained mechanisms → preserve/restore → sensitivity), each concern wired into the same class so nothing is orphaned.
- The public API delegates and re-exports integrate the whole feature into the library entry point; the ESM import-map/bridge additions keep the dual UMD/ESM build green.
- Checkpoints appear after the pure modules, after the core movement/camera glue, after the full glue, and at the end.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "3.2"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.3", "3.4", "3.5"] },
    { "id": 2, "tasks": ["1.3", "1.4"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 8, "tasks": ["8.2", "9.1"] },
    { "id": 9, "tasks": ["9.2", "10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 11, "tasks": ["11.2", "12.1"] },
    { "id": 12, "tasks": ["12.2", "12.3", "14.1"] },
    { "id": 13, "tasks": ["12.4", "14.2"] },
    { "id": 14, "tasks": ["14.3", "15.1", "16.1", "18.1"] },
    { "id": 15, "tasks": ["15.2", "16.2", "18.2", "17.1"] },
    { "id": 16, "tasks": ["17.2", "20.1"] },
    { "id": 17, "tasks": ["20.2"] },
    { "id": 18, "tasks": ["20.3", "21.1"] },
    { "id": 19, "tasks": ["21.2", "22.1"] }
  ]
}
```
