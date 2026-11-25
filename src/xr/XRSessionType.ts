/**
 * XRSessionType - the immersive session kind requested when entering XR.
 *
 * `'vr'` maps to an `immersive-vr` WebXR session and `'ar'` maps to an
 * `immersive-ar` (passthrough) WebXR session. This is a pure, BabylonJS-free
 * type alias used by `XRController`'s public signatures; the library entry
 * point (`CharacterController`) re-exports it as the public `XRSessionType`
 * (task 20.1) so consumers import it from the library entry.
 */
export type XRSessionType = "vr" | "ar";
