/**
 * XROrientationSync - pure, scene-free orientation derivation for the
 * first-person avatar follow.
 *
 * Numbers in / numbers out: no BabylonJS scene, no navigator, no I/O. Because
 * no BabylonJS type is imported, no ESM import-map / bridge entry is required.
 *
 * Note: this module used to also hold `deriveArcAngles` (headset -> arc camera
 * alpha/beta) for the `xr-first-person-camera-sync` feature. That headset -> arc
 * coupling was superseded in 0.5.0-2 (the arc camera drives the XR camera, and
 * head turns no longer rotate the avatar), so it was removed.
 */

/**
 * Derive the aligned Avatar_Yaw from the arc camera alpha and the Facing_Offset.
 *
 * Reproduces the first-person alignment formula (`_av2cam - camera.alpha`) as a
 * pure function so the continuous follow step and the movement path share one
 * definition. Arc alpha is measured anti-clockwise; avatar rotation.y is
 * measured clockwise, so the aligned avatar yaw is `facingOffset - alpha`.
 *
 * _Requirements (xr-first-person-camera-sync): 3.1, 6.2_
 */
export function deriveAvatarYaw(alpha: number, facingOffset: number): number {
    return facingOffset - alpha;
}
