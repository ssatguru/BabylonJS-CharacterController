/**
 * XRSupport - WebXR capability detection for the CharacterController library.
 *
 * This module exposes the immersive-VR / immersive-AR capability state and the
 * routine that probes for it. The capability *mapping* is a pure, scene-free
 * function (`computeXRSupportResult`) that is unit/property-testable in
 * isolation; the async probe (`detectXRSupport`) touches only `navigator.xr`
 * and the `WebXRSessionManager` static probe - no BabylonJS scene is required,
 * so the module is safe to import and call under a mocked or absent
 * `navigator.xr`.
 *
 * `detectXRSupport` never throws: each per-mode probe is wrapped so a rejection
 * or the absence of the API resolves to unsupported, and the final mapping is
 * delegated to `computeXRSupportResult`.
 *
 * BabylonJS import note: `WebXRSessionManager` is imported individually from the
 * "babylonjs" package; the ESM build rewrites it to
 * "@babylonjs/core/XR/webXRSessionManager" via the bridge/import-map.
 */

import { WebXRSessionManager } from "babylonjs";

/**
 * The detected WebXR capability state. Each flag reflects whether the
 * corresponding immersive session type is supported, independently of the other.
 * _Requirements: 16.1_
 */
export interface XRSupportState {
    vrSupported: boolean;
    arSupported: boolean;
}

/**
 * The outcome of probing a single immersive session type: `true` when the mode
 * is supported, `false` when it is not, and `'error'` when the probe rejected or
 * threw (which is mapped to unsupported).
 */
export type ProbeOutcome = boolean | "error";

/**
 * Map two independent per-mode probe outcomes to an {@link XRSupportState}.
 *
 * Each outcome is mapped on its own: `true` => supported, `false` =>
 * unsupported, and `'error'` => unsupported (a failed probe is treated as
 * lack of support).
 *
 * This function is pure - no BabylonJS, no `navigator`, no I/O.
 *
 * _Requirements: 16.1, 16.3_
 */
export function computeXRSupportResult(vr: ProbeOutcome, ar: ProbeOutcome): XRSupportState {
    return {
        vrSupported: vr === true,
        arSupported: ar === true,
    };
}

/**
 * Probe a single immersive session type via
 * `WebXRSessionManager.IsSessionSupportedAsync`, wrapping the call so that a
 * rejection, a throw, or the absence of the API yields `'error'` rather than
 * propagating. `'error'` is treated as unsupported by
 * {@link computeXRSupportResult}.
 *
 * _Requirements: 16.3_
 */
async function probeSession(mode: "immersive-vr" | "immersive-ar"): Promise<ProbeOutcome> {
    try {
        const supported = await WebXRSessionManager.IsSessionSupportedAsync(mode);
        return supported === true;
    } catch {
        return "error";
    }
}

/**
 * Detect immersive VR and AR support independently.
 *
 * Behavior:
 *  - When `navigator.xr` is absent, both results short-circuit to unsupported
 *    without probing (R16.2).
 *  - Otherwise each session type is probed independently; a rejection or absence
 *    of the API for a given mode yields unsupported for that mode only, never
 *    propagating the error (R16.3).
 *  - The final mapping is delegated to {@link computeXRSupportResult}, passing
 *    `'error'` for any probe that rejected/threw.
 *  - This function never throws.
 *
 * _Requirements: 16.1, 16.2, 16.3_
 */
export async function detectXRSupport(): Promise<XRSupportState> {
    // R16.2: without navigator.xr there is no WebXR; short-circuit both to false.
    const nav: unknown = typeof navigator !== "undefined" ? navigator : undefined;
    const hasXR = !!nav && !!(nav as { xr?: unknown }).xr;
    if (!hasXR) {
        return computeXRSupportResult(false, false);
    }

    // R16.3: probe each mode independently; a rejection/throw becomes 'error'.
    const [vr, ar] = await Promise.all([probeSession("immersive-vr"), probeSession("immersive-ar")]);

    return computeXRSupportResult(vr, ar);
}
