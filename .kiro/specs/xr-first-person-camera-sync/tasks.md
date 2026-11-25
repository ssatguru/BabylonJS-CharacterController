# Implementation Plan: XR First-Person Camera Sync

## Overview

Implement two coupled per-frame behaviors: (1) in an active WebXR first-person session, the headset orientation drives the owned `ArcRotateCamera` (`alpha`/`beta`); (2) in any first-person mode (XR and non-XR), the avatar yaw continuously follows the arc camera `alpha`. The orientation math is extracted into a new pure, scene-free module `src/xr/XROrientationSync.ts`, property-tested directly. The BabylonJS-facing integration replaces the arc→XR orientation mirror in `XRController` with an XR→arc sync (`_syncArcFromXRCamera`) and adds a continuous first-person avatar-follow step (`_followArcInFirstPerson`) to `CharacterController`'s render loop, each guarded so a missing/mocked camera never throws. Glue is verified with the established mock-based tests, and the full suite plus a production build confirm no new BabylonJS import is introduced.

## Tasks

- [x] 1. Create the pure orientation-sync module and its tests
  - [x] 1.1 Implement `src/xr/XROrientationSync.ts`
    - Create `src/xr/XROrientationSync.ts` following the established scene-free pure-module pattern (`XRLocomotion`, `XRSupport`, `XRInputMapping`)
    - Define and export the DTOs: `HeadsetOrientation { yaw, pitch }`, `BetaLimits { lower, upper }`, `ArcAngles { alpha, beta }`
    - Implement `deriveArcAngles(orientation, limits) → { alpha, beta }` composing internal `deriveAlphaFromYaw(yaw)` and `deriveBetaFromPitch(pitch)` helpers, then clamping beta via `clampBetaValue`
    - Implement and export `clampBetaValue(beta, limits)` using the `!(beta >= lower)` form so NaN maps to `lower`, and `beta > upper` maps to `upper`
    - Implement and export `deriveAvatarYaw(alpha, facingOffset) → facingOffset - alpha`
    - Fix the `deriveAlphaFromYaw` / `deriveBetaFromPitch` mappings against the controller's arc conventions (arc alpha anti-clockwise; beta from +Y axis, `0..π`)
    - Import NO BabylonJS types (numbers/DTOs only), so no ESM import-map / bridge entry is required
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 6.1, 6.2, 6.3_

  - [ ]* 1.2 Write property tests for the pure orientation derivations
    - Create `tests/xr-orientation-alpha-follows-yaw.test.ts`, `tests/xr-orientation-beta-follows-pitch.test.ts`, `tests/xr-orientation-beta-clamped.test.ts`, `tests/xr-avatar-yaw-derivation.test.ts` (fast-check, ≥100 iterations each)
    - Tag each with format `Feature: xr-first-person-camera-sync, Property {n}: {property text}`
    - **Property 1: Alpha follows headset yaw** — `deriveArcAngles(orientation, limits).alpha` equals the yaw-derived alpha, independent of pitch/limits
    - **Validates: Requirements 1.1, 6.1**
    - **Property 2: Beta follows headset pitch** — for orientations whose raw beta is in range, `.beta` equals the pitch-derived beta
    - **Validates: Requirements 2.1, 6.1**
    - **Property 3: Derived beta is always within the camera's beta range** — for arbitrary pitch and `lower <= upper`, `lower <= beta <= upper`; in-range values preserved; clamp idempotent
    - **Validates: Requirements 2.3**
    - **Property 4: Avatar yaw equals facing offset minus alpha** — `deriveAvatarYaw(alpha, facingOffset) === facingOffset - alpha`
    - **Validates: Requirements 3.1, 6.2**

  - [ ]* 1.3 Write purity smoke test for the pure module
    - Create `tests/xr-orientation-purity.test.ts`
    - Assert the module imports no BabylonJS scene and functions run with plain numbers, no scene instantiation
    - _Requirements: 6.1, 6.2_

- [x] 2. Add the CharacterController `_inFP` query seam
  - [x] 2.1 Add the lightweight `_inFP` query on `CharacterController`
    - Add a mock-safe query that reports the current `_inFP` state for `XRController` to consume via `_readInFirstPerson()`
    - Keep the seam minimal so it can be stubbed under mocks
    - _Requirements: 4.3, 4.5_

- [x] 3. Implement the XR→arc synchronization in XRController
  - [x] 3.1 Add `_syncArcFromXRCamera()` replacing the arc→XR orientation mirror direction
    - Import `deriveArcAngles` from `src/xr/XROrientationSync.ts`
    - Gate on `isInXR() && canFirstPerson() && _readInFirstPerson()` (XR_First_Person_Coupling); otherwise leave arc `alpha`/`beta` unchanged
    - Guard absent/unreadable XR camera (`_readHeadsetOrientation` returns null) — return without throwing or changing the arc; wrap access in try/catch per design D9
    - Add `_resolveBetaLimits` reusing `clampBeta`'s limit resolution (`lowerBetaLimit`/`upperBetaLimit` when finite, else `0.05 .. π−0.05` fallback)
    - Call `deriveArcAngles(orientation, limits)` and assign `arc.alpha`/`arc.beta`
    - Reuse the already-imported `WebXRCamera` type — introduce NO new BabylonJS import
    - Leave the entry-blend / position-mirror concern intact; replace only the orientation direction
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.1, 4.2, 4.5, 5.1_

  - [x] 3.2 Wire `_syncArcFromXRCamera()` into the render observer after `sampleSticks()`
    - Replace the `_updateXRCameraFollow()` orientation call so the sync runs after `sampleSticks()` in the same observer (preserves the ordering contract)
    - Ensure `onSessionEnd()` still detaches the observer so the sync stops when the session ends
    - _Requirements: 5.3, 4.5_

  - [ ]* 3.3 Write mock-based glue tests for the XR→arc sync
    - **Property 5: No XR session leaves the arc orientation unchanged** — fast-check arbitrary initial `alpha`/`beta`, `isInXR=false`, assert unchanged
    - **Validates: Requirements 4.1**
    - **Property 6: XR active but first person inactive leaves the arc orientation unchanged** — fast-check arbitrary initial `alpha`/`beta`, coupling false, assert unchanged
    - **Validates: Requirements 4.2**
    - EXAMPLE: XR→arc assigns `alpha`/`beta` from the headset when coupling holds (XR is source, arc is sink) (_Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_)
    - EXAMPLE: same-frame update on mocked pose change (_Requirements: 1.2, 2.2_)
    - EXAMPLE: FP→off while in XR freezes the arc (_Requirements: 4.5_)
    - EXAMPLE: sync ordered after `sampleSticks` via spy call order (_Requirements: 5.3_)
    - EDGE_CASE: absent XR camera (`_xrCamera=null`) does not throw and leaves arc unchanged (_Requirements: 5.1_)

- [x] 4. Implement the continuous first-person avatar follow in CharacterController
  - [x] 4.1 Add `_followArcInFirstPerson()`
    - Import `deriveAvatarYaw` from `src/xr/XROrientationSync.ts`
    - Early-return when `!_inFP` (gate re-checked each frame), when `_mode == 1`, and when `!_hasCam || _camera == null` (absent arc camera — no throw, no change)
    - Call `deriveAvatarYaw(this._camera.alpha, this._av2cam)` and write it via `_setAvatarRotationY` (handles `rotationQuaternion` vs `rotation.y`)
    - Add no new BabylonJS import (`deriveAvatarYaw` is pure)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.3, 4.4, 5.2_

  - [x] 4.2 Wire `_followArcInFirstPerson()` into `_moveAVandCamera`
    - Call it at the end of `_moveAVandCamera`, after action resolution and `_updateTargetValue()` (where `_inFP` is entered/exited), so the follow reads the same-frame `alpha`
    - _Requirements: 5.4_

  - [ ]* 4.3 Write mock-based glue tests for the avatar-follow step
    - **Property 7: Not in first person leaves the avatar yaw unchanged** — fast-check arbitrary yaw/alpha, `_inFP=false`, assert `rotation.y` unchanged
    - **Validates: Requirements 4.3, 4.4**
    - EXAMPLE: avatar follows `alpha` every frame in FP with no movement key held — `rotation.y === _av2cam - alpha` (_Requirements: 3.1, 3.2, 3.3, 3.4_)
    - EXAMPLE: avatar follow ordered after `alpha` is set — yaw reflects the just-set `alpha` (_Requirements: 5.4_)
    - EDGE_CASE: absent arc camera (`_hasCam=false` / `_camera=null`) does not throw and leaves yaw unchanged (_Requirements: 5.2_)

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate and verify the XR+FP composition
  - [ ]* 6.1 Write the composition glue test
    - EXAMPLE: run a full frame (XR→arc sync then avatar follow); assert avatar yaw reflects the headset-derived `alpha` (_Requirements: 3.4_)

  - [x] 6.2 Run the full verification pass
    - Run `npm test` and confirm the whole suite passes, including `esm-import-map-completeness` (no new BabylonJS import expected)
    - Run `npm run build` and confirm the production UMD + ESM outputs build cleanly
    - _Requirements: 6.3_

- [x] 7. Final checkpoint - Ensure all tests pass and the build succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster MVP.
- The design uses TypeScript throughout (no pseudocode), so the implementation language is TypeScript.
- Property tests use fast-check with ≥100 iterations and the tag format `Feature: xr-first-person-camera-sync, Property {n}: {property text}`, each referencing its design property.
- The pure module (`XROrientationSync.ts`) imports no BabylonJS types, so no `webpack.es-externals.js` / `src/_babylonjs-esm-bridge.js` entries are needed; the glue reuses the already-imported `WebXRCamera` and `ArcRotateCamera`.
- Each task references specific requirement clauses for traceability; ordering is pure module → seam → glue integration → glue tests → verification, matching the design's per-frame data flow and ordering guarantees (R5.3, R5.4).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "4.2"] },
    { "id": 3, "tasks": ["3.3", "4.3", "6.1"] },
    { "id": 4, "tasks": ["6.2"] }
  ]
}
```
