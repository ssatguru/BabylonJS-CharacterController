/**
 * XROrientationSync - pure, scene-free orientation derivations for the
 * first-person camera sync feature.
 *
 * Numbers in / numbers out: no BabylonJS scene, no navigator, no I/O. The
 * functions are property/unit tested directly (mirroring XRLocomotion /
 * XRSupport / XRInputMapping). Because no BabylonJS type is imported, no ESM
 * import-map / bridge entry is required (R6.3).
 *
 * Two derivations live here:
 *  - `deriveArcAngles` maps a headset orientation ({ yaw, pitch }) to the owned
 *    `ArcRotateCamera`'s { alpha, beta }, clamping beta into the camera's valid
 *    range. Used by the XR->arc synchronization while XR_First_Person_Coupling
 *    holds. It is the EXACT INVERSE of the arc->XR orientation mirror
 *    (`ArcRotateCamera.setTransformationFromNonVRCamera`) so the round trip is
 *    exact - which is what keeps the right-stick orbit continuous and the
 *    first-person avatar facing correct (no ~90 degree offset).
 *  - `deriveAvatarYaw` reproduces the controller's existing first-person
 *    alignment formula (`_av2cam - camera.alpha`) as a pure function so the
 *    continuous follow step and the movement path share one definition.
 */

/** Horizontal (yaw) and vertical (pitch) orientation of the headset, in radians. */
export interface HeadsetOrientation {
    /** Headset yaw (horizontal look direction), radians. */
    yaw: number;
    /** Headset pitch (vertical look direction), radians. Positive looks up. */
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
 * This derivation is the EXACT INVERSE of the arc->XR orientation mirror that
 * BabylonJS's `ArcRotateCamera.setTransformationFromNonVRCamera(arc, true)`
 * performs (used by the follow/seed path in `XRController.ts`). That mirror
 * places the XR camera at the arc camera's pose, so the XR camera's world Euler
 * yaw/pitch (what `rotationQuaternion.toEulerAngles()` reports) are a fixed
 * function of the arc `alpha`/`beta`. To drive the arc FROM the headset we
 * invert that function.
 *
 * Forward mirror (ArcRotateCamera looking from position toward target, BabylonJS
 * left-handed convention):
 *   - alpha is the longitudinal/azimuth angle measured anti-clockwise around +Y
 *     from +X; the resulting camera view yaw (Euler Y) is measured clockwise
 *     from +Z. Hence  yaw = -alpha + PI/2  (equivalently alpha = PI/2 - yaw),
 *     verified against real-device behavior (the ~180 degree correction).
 *   - beta is the elevation from +Y in `0..PI`; the resulting camera pitch
 *     (Euler X, positive looks up) is  pitch = beta - PI/2.
 *
 * Inverting:
 *   - alpha = PI/2 - yaw   (see `deriveAlphaFromYaw`, normalized to (-PI, PI]).
 *   - beta  = pitch + PI/2  (see `deriveBetaFromPitch`), then clamped to
 *     `[limits.lower, limits.upper]` (R2.3).
 *
 * Because this is the mirror's inverse, feeding the headset pose the mirror
 * WOULD have produced for a given (alpha, beta) back through here returns that
 * same (alpha, beta) - so the right-stick orbit is continuous (no ~PI/2 snap)
 * and `deriveAvatarYaw` yields the correct avatar facing. The relationship is
 * proven by the round-trip property test
 * (`tests/xr-orientation-sync-roundtrip.property.test.ts`).
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

/**
 * Clamp a beta value into `[limits.lower, limits.upper]`. Pure.
 *
 * The `!(beta >= lower)` form is deliberate: it maps both `beta < lower` and a
 * non-finite `beta` (`NaN`) to `lower`, so a degenerate pitch never yields an
 * out-of-range beta. `beta > upper` maps to `upper`. In-range values are
 * returned unchanged, so the clamp is identity in-range and idempotent (R2.3).
 *
 * _Requirements: 2.3_
 */
export function clampBetaValue(beta: number, limits: BetaLimits): number {
    if (!(beta >= limits.lower)) return limits.lower; // handles beta < lower and NaN.
    if (beta > limits.upper) return limits.upper;
    return beta;
}

/**
 * Derive the aligned Avatar_Yaw from the arc camera alpha and the Facing_Offset.
 *
 * Reproduces the existing first-person alignment formula
 * (`_av2cam - camera.alpha`, CharacterController.ts:1795) as a pure function so
 * the continuous follow step and the movement path share one definition. Arc
 * alpha is measured anti-clockwise; avatar rotation.y is measured clockwise, so
 * the aligned avatar yaw is `facingOffset - alpha`. Correct given a correct
 * alpha (see `deriveAlphaFromYaw`); unchanged by this fix.
 *
 * _Requirements: 3.1, 6.2_
 */
export function deriveAvatarYaw(alpha: number, facingOffset: number): number {
    return facingOffset - alpha;
}

// --- internal helpers (kept small so the mapping is unit-testable in isolation) ---

/**
 * Normalize an angle into the half-open range `(-PI, PI]`. Pure. Keeps the
 * derived alpha bounded so the avatar-follow subtraction (`facingOffset - alpha`)
 * and the right-stick orbit start from a canonical representative rather than an
 * arbitrary multiple of 2*PI. `atan2(sin, cos)` returns `(-PI, PI]` for finite
 * input and propagates NaN unchanged.
 */
function normalizeAngle(angle: number): number {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/**
 * Map headset yaw to arc alpha - the INVERSE of the arc->XR mirror's
 * alpha->world-yaw relationship.
 *
 * The mirror (`setTransformationFromNonVRCamera`) produces a camera world yaw of
 * `yaw = -alpha + PI/2` from an arc `alpha` (alpha is anti-clockwise around +Y
 * from +X; the view yaw is clockwise from +Z). Inverting gives
 * `alpha = PI/2 - yaw` (i.e. `-yaw + PI/2`). The result is normalized into
 * `(-PI, PI]` so the value stays canonical for the avatar-follow subtraction and
 * orbit start.
 *
 * The forward mirror relationship `yaw = -alpha + PI/2` (equivalently
 * `alpha = PI/2 - yaw`) is verified against real-device behavior: the earlier
 * `-yaw - PI/2` mapping had the correct handedness but flipped the view exactly
 * 180 degrees (off by PI). Adding PI removes that flip.
 */
function deriveAlphaFromYaw(yaw: number): number {
    return normalizeAngle(-yaw + Math.PI / 2);
}

/**
 * Map headset pitch to arc beta (before clamping) - the INVERSE of the
 * arc->XR mirror's beta->world-pitch relationship.
 *
 * ArcRotateCamera `beta` is the elevation measured from the +Y (up) axis,
 * ranging `0..PI`: `beta = 0` looks straight up, `beta = PI/2` is level, and
 * `beta = PI` looks straight down. The mirror produces a camera pitch of
 * `pitch = beta - PI/2` (Euler X, positive looks up) for a camera looking toward
 * the target. Inverting gives `beta = pitch + PI/2`: level pitch (`0`) maps to
 * `PI/2`, looking up (positive pitch) INCREASES beta toward `PI`... which is the
 * consistent inverse of the mirror. `clampBetaValue` (not this helper) then
 * bounds the result to the camera's valid beta range.
 *
 * (Previously this was `beta = PI/2 - pitch`, the sign-flipped mapping that does
 * not invert the mirror and broke the round trip.)
 */
function deriveBetaFromPitch(pitch: number): number {
    return pitch + Math.PI / 2;
}
