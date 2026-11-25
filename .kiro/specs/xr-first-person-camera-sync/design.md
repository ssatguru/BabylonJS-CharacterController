# Design Document

## Overview

This feature makes first-person facing behavior consistent inside and outside an active WebXR session, and it corrects the orientation coupling in XR. It introduces two coupled per-frame behaviors:

1. **XR headset drives the arc camera (XR-scoped).** While `XR_First_Person_Coupling` holds (an immersive session is active AND first person is engaged), the rendered `WebXRCamera` orientation drives the owned `ArcRotateCamera`: headset yaw → `alpha`, headset pitch → `beta` (clamped to the camera's valid beta range). This reverses the current per-frame follow, which mirrors the arc camera *onto* the XR camera (`_updateXRCameraFollow` / `_seedXRCameraOntoFollowPose`) and therefore leaves `alpha`/`beta` stale while the user physically turns their head.

2. **Avatar yaw follows the arc camera in first person (XR and non-XR).** Whenever `First_Person_Mode` (`_inFP`) is active, the avatar's horizontal facing continuously follows the arc camera's `alpha` on *every* frame — `rotation.y = _av2cam - camera.alpha` — regardless of whether a movement key is held. Today this alignment happens only along the movement/turn code path (`_rotateAV2C`, invoked from the move path around `CharacterController.ts:1795`), so in non-XR first person the avatar does not rotate to match the camera when no key is pressed.

The two behaviors compose: in XR the arc `alpha` is driven by the headset (behavior 1) and the avatar then follows that `alpha` (behavior 2); in non-XR the arc `alpha` is driven by the existing camera controls and the avatar follows it. Behavior outside first person, in third person, and in camera mode 1 is unchanged.

The orientation math is extracted into a new **pure, scene-free** module `src/xr/XROrientationSync.ts`, following the established pure-module pattern (`XRLocomotion`, `XRSupport`, `XRInputMapping`). The BabylonJS-facing integration lives in the existing glue (`XRController._updateXRCameraFollow` is repurposed / replaced by an XR→arc sync) and in the `CharacterController` render loop (a new continuous first-person avatar-follow step).

## Architecture

### Component responsibilities

| Component | Type | Responsibility |
|-----------|------|----------------|
| `src/xr/XROrientationSync.ts` (new) | Pure module | `deriveArcAngles(orientation, betaLimits) → {alpha, beta}` and `deriveAvatarYaw(alpha, facingOffset) → yaw`. No BabylonJS scene, numbers in / numbers out. Property-testable. |
| `XRController` (existing glue) | BabylonJS-facing | Per-frame XR→arc synchronization: read `WebXRCamera` orientation, call `deriveArcAngles`, assign `arc.alpha`/`arc.beta` while `XR_First_Person_Coupling` holds. Replaces the arc→XR mirror direction of `_updateXRCameraFollow`. Guarded so an absent/mocked XR camera never throws. |
| `CharacterController` (core) | BabylonJS-facing | Owns the render loop (`_moveAVandCamera`, registered via `registerBeforeRender`). Adds a continuous first-person avatar-follow step that calls `deriveAvatarYaw(this._camera.alpha, this._av2cam)` and writes `_avatar.rotation.y` while `_inFP`. Guarded so an absent arc camera never throws. |

### Per-frame data flow (first person)

```
scene.onBeforeRenderObservable  (XRController render observer, active only in-session)
  1. sampleSticks()                      // existing: read thumbsticks, apply orbit/dolly to arc alpha/beta
  2. syncArcFromXRCamera()               // NEW (replaces _updateXRCameraFollow's mirror direction):
        if isInXR() && couplingActive:   //   XR_First_Person_Coupling
            xr = getXRCamera(); if xr == null -> return (no throw, no change)   // R5.1
            {alpha, beta} = deriveArcAngles(xrOrientation, {lower, upper})      // R1.1, R2.1, R2.3
            arc.alpha = alpha; arc.beta = beta                                  // R1.2, R2.2
        // else: leave arc alpha/beta unchanged                                 // R4.1, R4.2, R4.5

scene.registerBeforeRender(this._renderer -> _moveAVandCamera)  (CharacterController core loop)
  ... existing movement / jump / idle resolution (may set alpha via camera controls in non-XR) ...
  followArcInFirstPerson()               // NEW continuous step, ordered AFTER alpha is set:
        if _inFP:                                                              // R4.3, R4.4 (gate re-checked each frame)
            if !_hasCam || _camera == null -> return (no throw, no change)      // R5.2
            _avatar.rotation.y = deriveAvatarYaw(_camera.alpha, _av2cam)        // R3.1, R3.2, R3.3, R3.4
```

**Ordering guarantees (Requirement 5):**
- The XR→arc sync runs *after* `sampleSticks()` in the same render observer, so the assigned arc orientation reflects the same-frame stick/orbit state and the same-frame headset pose (R5.3). This preserves the existing ordering contract that `_updateXRCameraFollow` was invoked after `sampleSticks()`.
- The avatar-follow step runs *after* the arc `alpha` has been set for the frame (R5.4). Two registration orders exist and both satisfy this: (a) `XRController`'s render observer runs on `scene.onBeforeRenderObservable`; (b) `CharacterController`'s `_renderer` runs on `scene.registerBeforeRender`. The XR→arc sync therefore establishes `alpha` before the core loop's avatar-follow reads it. In non-XR the arc `alpha` is already settled by the camera controls before the core loop runs.

### Why a new pure module (not extending an existing one)

`XRLocomotion` models the first/third-person state machine and stick→intent mapping; `XRSupport` models capability detection; `XRInputMapping` models button bindings. The orientation derivations are a distinct concern (angle math). Per the structure steering ("prefer new cohesive modules"), the two derivations go in a small new `src/xr/XROrientationSync.ts`. It imports **no** BabylonJS types (it works on plain numbers / a small orientation DTO), so it needs **no** ESM import-map or bridge entries (Req 6.3).

## Components and Interfaces

### New pure module: `src/xr/XROrientationSync.ts`

```typescript
/**
 * XROrientationSync - pure, scene-free orientation derivations for the
 * first-person camera sync feature.
 *
 * Numbers in / numbers out: no BabylonJS scene, no navigator, no I/O. The two
 * functions are property/unit tested directly (mirroring XRLocomotion /
 * XRSupport / XRInputMapping). Because no BabylonJS type is imported, no ESM
 * import-map / bridge entry is required (R6.3).
 */

/** Horizontal (yaw) and vertical (pitch) orientation of the headset, in radians. */
export interface HeadsetOrientation {
    /** Headset yaw (horizontal look direction), radians. */
    yaw: number;
    /** Headset pitch (vertical look direction), radians. Up/down. */
    pitch: number;
}

/** Inclusive beta bounds accepted by the ArcRotateCamera for this frame. */
export interface BetaLimits {
    lower: number;
    upper: number;
}

/** Derived arc-camera orientation: alpha (yaw) and clamped beta (pitch). */
export interface ArcAngles {
    alpha: number;
    beta: number;
}

/**
 * Derive the ArcRotateCamera { alpha, beta } from a headset orientation.
 *
 * - `alpha` is the arc camera's horizontal angle derived from `orientation.yaw`
 *   using the same alpha/yaw convention the controller already uses for the
 *   arc<->avatar relationship (arc alpha measured anti-clockwise).
 * - `beta` is derived from `orientation.pitch` mapped into the ArcRotateCamera
 *   beta convention, then clamped to `[limits.lower, limits.upper]` (R2.3).
 *
 * Pure: for the same inputs it always returns the same output and touches no
 * external state.
 *
 * _Requirements: 1.1, 2.1, 2.3, 6.1_
 */
export function deriveArcAngles(orientation: HeadsetOrientation, limits: BetaLimits): ArcAngles {
    const alpha = deriveAlphaFromYaw(orientation.yaw);
    const rawBeta = deriveBetaFromPitch(orientation.pitch);
    const beta = clampBetaValue(rawBeta, limits);
    return { alpha, beta };
}

/** Clamp a beta value into [limits.lower, limits.upper]. Pure. (R2.3) */
export function clampBetaValue(beta: number, limits: BetaLimits): number {
    if (!(beta >= limits.lower)) return limits.lower; // handles beta < lower and NaN-safe lower
    if (beta > limits.upper) return limits.upper;
    return beta;
}

/**
 * Derive the aligned Avatar_Yaw from the arc camera alpha and the Facing_Offset.
 *
 * Reproduces the existing first-person alignment formula
 * (`_av2cam - camera.alpha`, CharacterController.ts:1795) as a pure function so
 * the continuous follow step and the movement path share one definition.
 *
 * _Requirements: 3.1, 3.3, 3.4, 6.2_
 */
export function deriveAvatarYaw(alpha: number, facingOffset: number): number {
    return facingOffset - alpha;
}

// --- internal helpers (exported for targeted unit tests if useful) ---

/** Map headset yaw to arc alpha (same convention as the existing arc/avatar coupling). */
function deriveAlphaFromYaw(yaw: number): number { /* ... */ return yaw; }

/** Map headset pitch to arc beta (before clamping). */
function deriveBetaFromPitch(pitch: number): number { /* ... */ return pitch; }
```

> The exact `deriveAlphaFromYaw` / `deriveBetaFromPitch` mappings are fixed during implementation against the current `ArcRotateCamera` alpha/beta conventions used elsewhere in the controller (arc alpha anti-clockwise; beta measured from the +Y axis, `0..π`). They are kept as small internal helpers so the mapping is unit-testable in isolation and the public `deriveArcAngles` composes them with the clamp. Whatever mapping is chosen, `clampBetaValue` guarantees the returned beta is within `[lower, upper]`.

### `XRController` integration (BabylonJS-facing glue)

The existing `_updateXRCameraFollow` mirrors the arc camera *onto* the XR camera (`setTransformationFromNonVRCamera` + re-apply arc Y). For first-person coupling this direction is reversed. The render observer already calls `sampleSticks()` then `_updateXRCameraFollow()` (`XRController.ts:2028-2030`); the follow call is replaced/extended by an XR→arc sync:

```typescript
/**
 * Per-frame XR -> arc synchronization. Invoked from the render observer AFTER
 * sampleSticks() (R5.3). While XR_First_Person_Coupling holds, read the headset
 * orientation, derive { alpha, beta } via the pure XROrientationSync helper, and
 * assign them to the owned ArcRotateCamera. Otherwise leave the arc unchanged.
 *
 * Design D9 ("never throw across the XR boundary"): every access is guarded, so
 * an absent / mocked XR camera (R5.1) completes without throwing and without
 * changing the arc orientation.
 *
 * _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.2, 4.5, 5.1, 5.3_
 */
private _syncArcFromXRCamera(): void {
    try {
        // Coupling gate: only while in XR AND first person is engaged.
        if (!this.isInXR() || !this.canFirstPerson() || !this._readInFirstPerson()) {
            return; // R4.2, R4.5: leave arc alpha/beta unchanged.
        }

        const xr = this._xrCamera as unknown as {
            rotationQuaternion?: { x: number; y: number; z: number; w: number } | null;
            // (or the already-available orientation accessor used elsewhere)
        } | null;
        if (xr == null) {
            return; // R5.1: absent XR camera -> no throw, no change.
        }

        const orientation = this._readHeadsetOrientation(xr); // guarded extract of yaw/pitch
        if (orientation == null) return;                      // R5.1: unreadable pose -> no change.

        const arc = this._camera as unknown as {
            alpha?: number; beta?: number;
            lowerBetaLimit?: number | null; upperBetaLimit?: number | null;
        } | null;
        if (arc == null) return;

        const limits = this._resolveBetaLimits(arc); // reuse clampBeta's fallback range (0.05 .. π-0.05)
        const { alpha, beta } = deriveArcAngles(orientation, limits); // R1.1, R2.1, R2.3

        arc.alpha = alpha; // R1.2
        arc.beta = beta;   // R2.2
    } catch {
        // D9: swallow. (contributes to R5.1)
    }
}
```

Notes:
- `_readInFirstPerson()` is a guarded seam that reports whether the `CharacterController` is currently in `_inFP` (via an existing/added lightweight query on `CharacterController`; falls back safe under mocks). Combined with `isInXR()` and `canFirstPerson()` this is exactly `XR_First_Person_Coupling`.
- `_resolveBetaLimits` reuses the same limit resolution `clampBeta()` already uses (`lowerBetaLimit`/`upperBetaLimit` when finite, else the pole-avoiding fallback `0.05 .. π−0.05`), so beta stays off the gimbal singularity (R2.3).
- The old arc→XR mirror (`_updateXRCameraFollow`) responsibility for *position/height* (the D6 mirror + arc-Y re-apply, and the D10 entry-blend) is a separate concern from the *orientation* coupling this feature changes. The orientation (`alpha`/`beta`) is now sourced from the headset; any residual position mirroring the entry-blend needs is left intact where it does not conflict. Implementation replaces only the orientation direction, not the entry-blend glide.

**Reading the headset orientation.** `_readHeadsetOrientation` extracts yaw/pitch from the `WebXRCamera`. The `WebXRCamera` type is already imported in `XRController.ts` (`import { ... WebXRCamera ... } from "babylonjs"`), so **no new BabylonJS import** is introduced and no ESM import-map/bridge change is needed (R6.3). If a future implementation needs a `Quaternion`/`Matrix` helper not already imported, the steering rule applies: add the entry to `webpack.es-externals.js` and `src/_babylonjs-esm-bridge.js` (the `esm-import-map-completeness` test enforces this). The design prefers reusing already-imported types and doing the small yaw/pitch extraction inline / via the pure module.

### `CharacterController` integration (core render loop)

`_moveAVandCamera` is the render-loop body registered via `registerBeforeRender` (`CharacterController.ts:1030`, `:3371`). A new continuous first-person follow step is added, ordered after the frame's `alpha` is settled:

```typescript
/**
 * Continuous first-person avatar-follow. While _inFP, align the avatar's yaw to
 * the arc camera alpha EVERY frame (independent of movement keys), using the
 * pure deriveAvatarYaw helper. Ordered after the frame's alpha has been set
 * (in XR, after the XR->arc sync; in non-XR, after camera controls). (R5.4)
 *
 * Guarded so an absent arc camera never throws and leaves the yaw unchanged
 * (R5.2). While !_inFP this is a no-op, preserving all non-first-person,
 * third-person, and mode-1 behavior (R4.3, R4.4).
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 4.3, 4.4, 5.2, 5.4_
 */
private _followArcInFirstPerson(): void {
    if (!this._inFP) return;                 // R4.3, R4.4: gate re-checked each frame.
    if (!this._hasCam || this._camera == null) return; // R5.2: absent arc camera -> no throw, no change.
    if (this._mode == 1) return;             // mode-1 unchanged (R4 scope).
    this._setAvatarRotationY(deriveAvatarYaw(this._camera.alpha, this._av2cam)); // R3.1..R3.4
}
```

Call site: at the end of `_moveAVandCamera`, after action resolution and after `_updateTargetValue()` (which is where `_inFP` is entered/exited based on camera radius, `CharacterController.ts:2133-2168`). Because `_updateTargetValue()` sets `_inFP` for the frame and the XR render observer has already set `alpha` for the frame, calling `_followArcInFirstPerson()` last satisfies R5.4.

- The existing per-key alignment in `_rotateAV2C` (`this._setAvatarRotationY(ca)` where `ca = _av2cam - _camera.alpha`) remains for the movement/turn path; the new continuous step makes the *same* alignment happen even when no key is held. Using `_setAvatarRotationY` (which handles the `rotationQuaternion` vs `rotation.y` cases, `:900-910`) keeps both paths consistent.
- No new BabylonJS import is added in `CharacterController.ts` for this step (`deriveAvatarYaw` is pure), so no import-map/bridge change (R6.3).

### Transition-off handling (Requirement 4)

- **Leaving first person** (`_inFP` goes false in `_updateTargetValue`): `_followArcInFirstPerson()` early-returns on the next frame (R4.3, R4.4). The avatar yaw is frozen at its last value; the restored camera mode/behavior takes over.
- **Leaving XR** (session ends): `onSessionEnd()` detaches the render observer, so `_syncArcFromXRCamera()` stops running; the arc orientation is no longer driven by the headset (R4.5). `restoreArcRotateMode()` restores the desktop camera.
- **FP off while still in XR** (`XR_First_Person_Coupling` becomes false because `_inFP` is false or `canFirstPerson()` is false): the coupling gate in `_syncArcFromXRCamera()` early-returns, leaving arc `alpha`/`beta` unchanged (R4.2, R4.5).

## Data Models

No persisted data. New in-memory/value types are the pure DTOs in `XROrientationSync.ts`:

- `HeadsetOrientation { yaw: number; pitch: number }` — extracted from the `WebXRCamera` each frame; radians.
- `BetaLimits { lower: number; upper: number }` — resolved from the arc camera's `lowerBetaLimit`/`upperBetaLimit` (or the pole-avoiding fallback) each frame.
- `ArcAngles { alpha: number; beta: number }` — derived arc orientation, `beta` guaranteed within `[lower, upper]`.

Existing fields consumed (not changed in shape): `CharacterController._inFP`, `_av2cam`, `_hasCam`, `_camera` (`ArcRotateCamera` with `alpha`, `beta`, `lowerBetaLimit`, `upperBetaLimit`); `XRController._xrCamera` (`WebXRCamera`).

## Error Handling

Design principle D9 ("never throw across the XR boundary") extends to both new integration points:

- **Absent XR camera (R5.1):** `_syncArcFromXRCamera()` guards `_xrCamera == null` and wraps all access in try/catch; on absence it returns without touching the arc, leaving `alpha`/`beta` unchanged.
- **Absent arc camera (R5.2):** `_followArcInFirstPerson()` guards `!_hasCam || _camera == null` and returns without writing `rotation.y`.
- **Unreadable pose:** if yaw/pitch cannot be extracted (mocked camera missing rotation), `_readHeadsetOrientation` returns `null` and the sync leaves the arc unchanged.
- **Non-finite / out-of-range pitch:** `clampBetaValue` clamps into `[lower, upper]`; the `!(beta >= lower)` form maps `NaN` to `lower`, so a degenerate pitch never produces an out-of-range beta.
- **Gating:** every gate (`isInXR`, `canFirstPerson`, `_inFP`, `_mode != 1`) is re-evaluated each frame, so transitions off stop driving on the very next frame with no residual state to unwind.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Following the prework analysis and a property-reflection pass, the redundant same-frame-responsiveness criteria (1.2, 2.2, 3.2), the directional/ordering criteria (1.3, 3.3, 3.4, 4.4, 4.5, 5.3, 5.4), the robustness edge cases (5.1, 5.2), and the structural/testability criteria (6.1, 6.2, 6.3) are covered by example/edge/smoke tests (see Testing Strategy) rather than universal properties. The universal properties below capture the derivations and gating invariants.

### Property 1: Alpha follows headset yaw

*For any* headset orientation, `deriveArcAngles(orientation, limits).alpha` equals the arc alpha derived from `orientation.yaw` (the same value for the same yaw, independent of pitch and limits).

**Validates: Requirements 1.1, 6.1**

### Property 2: Beta follows headset pitch (pre-clamp monotonic mapping)

*For any* headset orientation whose derived beta lies within `limits`, `deriveArcAngles(orientation, limits).beta` equals the beta derived from `orientation.pitch` (the pitch drives beta whenever it is in range).

**Validates: Requirements 2.1, 6.1**

### Property 3: Derived beta is always within the camera's beta range

*For any* headset orientation and *any* valid limits (`lower <= upper`), `deriveArcAngles(orientation, limits).beta` satisfies `lower <= beta <= upper`; and if the raw derived beta is already within `[lower, upper]` it is returned unchanged (clamp is identity in-range and idempotent).

**Validates: Requirements 2.3**

### Property 4: Avatar yaw equals facing offset minus alpha

*For any* arc alpha and *any* facing offset, `deriveAvatarYaw(alpha, facingOffset)` equals `facingOffset - alpha` (matching the existing first-person alignment formula, so first-person facing is identical whether alpha comes from the headset or the desktop controls).

**Validates: Requirements 3.1, 6.2**

### Property 5: No XR session leaves the arc orientation unchanged

*For any* initial arc `alpha`/`beta`, when `XR_Session_Active` is false the Camera_Sync_Update leaves both `alpha` and `beta` unchanged.

**Validates: Requirements 4.1**

### Property 6: XR active but first person inactive leaves the arc orientation unchanged

*For any* initial arc `alpha`/`beta`, when an XR session is active but `First_Person_Mode` is inactive (coupling false) the Camera_Sync_Update leaves both `alpha` and `beta` unchanged.

**Validates: Requirements 4.2**

### Property 7: Not in first person leaves the avatar yaw unchanged

*For any* avatar yaw and *any* arc alpha, when `First_Person_Mode` is inactive the Avatar_Follow_Update leaves the avatar's `rotation.y` unchanged.

**Validates: Requirements 4.3**

## Testing Strategy

The design mirrors the existing dual approach: pure functions get property tests (fast-check, ≥100 iterations); BabylonJS-facing glue gets example/mock tests (the established `XRController`-against-mocks pattern). Tests use **Vitest + fast-check** under `tests/`.

### Pure-function property/unit tests (`src/xr/XROrientationSync.ts`, scene-free)

| Test | Kind | Function under test | Property / assertion |
|------|------|--------------------|----------------------|
| `xr-orientation-alpha-follows-yaw` | Property (P1) | `deriveArcAngles` | For arbitrary orientation, `alpha` matches the yaw-derived alpha (mod 2π tolerance), independent of pitch/limits. |
| `xr-orientation-beta-follows-pitch` | Property (P2) | `deriveArcAngles` | For orientations whose raw beta is in range, `beta` matches the pitch-derived beta. |
| `xr-orientation-beta-clamped` | Property (P3) | `deriveArcAngles` / `clampBetaValue` | For arbitrary pitch + arbitrary `lower <= upper`, `lower <= beta <= upper`; in-range values preserved; clamp idempotent. |
| `xr-avatar-yaw-derivation` | Property (P4) | `deriveAvatarYaw` | For arbitrary `alpha`, `facingOffset`: result `=== facingOffset - alpha`. |
| `xr-orientation-purity` | Unit (SMOKE 6.1, 6.2) | module import | Module imports no BabylonJS scene; functions callable with plain numbers, no scene instantiation. |

Property test tag format (per workflow): **Feature: xr-first-person-camera-sync, Property {n}: {property text}**, each referencing its design property.

### Glue tests against mocks (`XRController` / `CharacterController` render steps)

Existing pattern: a mock `ArcRotateCamera` (`{alpha, beta, lowerBetaLimit, upperBetaLimit}`) and mock `WebXRCamera` (with a settable orientation) plus a stubbed `CharacterController` seam.

| Test | Kind | Covers | Assertion |
|------|------|--------|-----------|
| XR→arc assigns alpha/beta when coupling holds | EXAMPLE | 1.1, 1.2, 1.3, 2.1, 2.2 | Set headset yaw/pitch, run sync while `isInXR && canFirstPerson && _inFP`; assert arc `alpha`/`beta` updated from the headset (XR is source, arc is sink — not the reverse). |
| Same-frame update on pose change | EXAMPLE | 1.2, 2.2 | Change mocked yaw/pitch, re-run sync; assert arc reflects the new pose on that invocation. |
| No XR session leaves arc unchanged | PROPERTY (P5) | 4.1 | fast-check arbitrary initial `alpha`/`beta`, `isInXR=false`; assert unchanged after sync. |
| XR active, FP inactive leaves arc unchanged | PROPERTY (P6) | 4.2 | fast-check arbitrary initial `alpha`/`beta`, coupling false; assert unchanged. |
| FP→off in XR stops driving arc | EXAMPLE | 4.5 | Coupling becomes false; run sync; assert arc frozen. |
| Absent XR camera does not throw / no change | EDGE_CASE | 5.1 | `_xrCamera=null`; run sync; assert no throw and arc unchanged. |
| Sync ordered after stick sampling | EXAMPLE | 5.3 | Spy call order in render observer; assert `sampleSticks` before `_syncArcFromXRCamera`. |
| Avatar follows alpha every frame in FP | EXAMPLE | 3.1, 3.2, 3.3, 3.4 | `_inFP=true`, set `camera.alpha`; run follow step; assert `rotation.y === _av2cam - alpha`, with no movement key held. |
| Not in FP leaves avatar yaw unchanged | PROPERTY (P7) | 4.3, 4.4 | fast-check arbitrary yaw/alpha, `_inFP=false`; assert `rotation.y` unchanged. |
| Absent arc camera does not throw / no change | EDGE_CASE | 5.2 | `_hasCam=false` / `_camera=null`; run follow; assert no throw and yaw unchanged. |
| Avatar follow ordered after alpha set | EXAMPLE | 5.4 | Set alpha then run follow; assert yaw reflects the just-set alpha. |
| XR+FP composition | EXAMPLE | 3.4 | Run a full frame (XR→arc sync then avatar follow); assert avatar yaw reflects headset-derived alpha. |

### Build-config test (existing, reused)

- `esm-import-map-completeness` (SMOKE 6.3): the design adds no new BabylonJS runtime import (pure module is numbers-only; glue reuses the already-imported `WebXRCamera`/`ArcRotateCamera`). If implementation adds a new type, this existing test enforces the `webpack.es-externals.js` + `src/_babylonjs-esm-bridge.js` entries.

## Requirements Traceability

| Design component / behavior | Requirements |
|-----------------------------|--------------|
| `deriveArcAngles` (alpha from yaw) | 1.1, 6.1 |
| `_syncArcFromXRCamera` assigns `arc.alpha` each frame | 1.1, 1.2, 1.3 |
| `deriveArcAngles` (beta from pitch) | 2.1, 6.1 |
| `_syncArcFromXRCamera` assigns `arc.beta` each frame | 2.1, 2.2 |
| `clampBetaValue` / `_resolveBetaLimits` | 2.3 |
| `deriveAvatarYaw` (= facingOffset − alpha) | 3.1, 6.2 |
| `_followArcInFirstPerson` continuous per-frame follow | 3.1, 3.2, 3.3, 3.4 |
| Coupling gate + non-XR alpha source | 3.3, 3.4 |
| Sync gated off when not in XR | 4.1 |
| Sync gated off when FP inactive in XR | 4.2, 4.5 |
| Follow gated off when not in FP (re-checked each frame) | 4.3, 4.4 |
| `onSessionEnd` detaches observer / stops driving | 4.5 |
| Guarded absent XR camera | 5.1 |
| Guarded absent arc camera | 5.2 |
| Sync after `sampleSticks` in render observer | 5.3 |
| Follow after alpha set in core loop (end of `_moveAVandCamera`) | 5.4 |
| Pure `XROrientationSync` module (scene-free) | 6.1, 6.2 |
| No new BabylonJS import / import-map + bridge maintenance | 6.3 |
