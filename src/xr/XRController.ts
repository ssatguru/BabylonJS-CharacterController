/**
 * XRController - the BabylonJS-facing WebXR glue for the CharacterController
 * library.
 *
 * This class owns the immersive-session lifecycle and (in later tasks) the
 * per-frame stick sampling, camera orbit/dolly/follow, data-driven controller
 * binding, ray management, teleport/point-to-move retention, and desktop
 * preserve/restore. It is owned by a single `CharacterController` instance,
 * which exposes thin public delegates to it.
 *
 * Naming convention (per steering / design D14): the class itself is normally
 * named (`XRController`) - it lives in its own module so it no longer needs a
 * leading-underscore NAME for file scoping - but its private MEMBERS keep the
 * `_` prefix and are Terser-mangled in UMD production builds.
 *
 * Design decision D9 - "never throw across the XR boundary": every BabylonJS
 * and WebXR access in this class is defensively guarded (try/catch or shape
 * guard) so a missing `navigator.xr`, a failed experience creation, or a mocked
 * test environment cannot crash the controller. Enable/disable report success
 * or no-op rather than throwing.
 *
 * BabylonJS import note: the WebXR types are imported individually from the
 * "babylonjs" package (matching `src/CharacterController.ts`); the ESM build
 * rewrites each to its `@babylonjs/core` sub-path via the bridge/import-map.
 * The `CharacterController` type is imported type-only to avoid a runtime
 * import cycle with the library entry point.
 *
 * This module contains the constructor, the enable/disable lifecycle surface
 * plus the `WebXRState` observer wiring (task 5.1), and the session enter/exit
 * requests plus the `onSessionStart`/`onSessionEnd` lifecycle hooks (task 5.2).
 * Sampling, camera coupling, binding, rays, and the full preserve/restore are
 * layered on in later tasks (6+) - many of those concerns are wired here
 * through guarded seam helpers that later tasks fill in.
 */

import { WebXRDefaultExperience, WebXRCamera, WebXRState, Scene, ArcRotateCamera, Observer } from "babylonjs";

import type { CharacterController } from "../CharacterController";

import {
    XRLocomotion,
    LocomotionMode,
    MoveIntent,
    StickInput,
    mapStickToIntent,
    neutralMoveIntent,
    DEFAULT_STICK_DEADZONE,
} from "./XRLocomotion";
import {
    DEFAULT_XR_INPUT_MAPPING,
    XRInputMapping,
    BindableAction,
    BindableInput,
    INPUT_RESOLUTION,
    XR_COMPONENT_THUMBSTICK,
    XR_COMPONENT_TRIGGER,
    XR_COMPONENT_A_BUTTON,
    XR_COMPONENT_B_BUTTON,
    Handedness,
} from "./XRInputMapping";
import { detectXRSupport } from "./XRSupport";
import type { XRSessionType } from "./XRSessionType";
import { deriveArcAngles, HeadsetOrientation, BetaLimits } from "./XROrientationSync";

/**
 * Default orbit/dolly sensitivity rates (radians-per-frame at full deflection
 * for orbit; radius-units-per-frame while held for dolly). Held as adjustable
 * instance state; clamped setters live in a later task.
 * _Requirements: 12.1_
 */
const DEFAULT_ALPHA_RATE = 0.0075;
const DEFAULT_BETA_RATE = 0.003;
const DEFAULT_RADIUS_RATE = 0.05;

/**
 * Upper bounds for the clamped sensitivity setters. Orbit rates (`alphaRate` /
 * `betaRate`) clamp to `0..MAX_ORBIT_RATE`; the dolly rate (`radiusRate`) clamps
 * to `0..MAX_RADIUS_RATE`. Non-finite setter inputs leave the rate unchanged.
 * _Requirements: 12.2, 12.3, 12.4_
 */
const MAX_ORBIT_RATE = 0.02;
const MAX_RADIUS_RATE = 0.2;

/**
 * Pole-avoiding fallback range for `clampBeta` when the Follow_Camera exposes no
 * `lowerBetaLimit`/`upperBetaLimit`. Keeps `beta` off the exact gimbal
 * singularity at the poles (design: `0.05 .. π − 0.05`). (R9.2)
 */
const BETA_MIN_FALLBACK = 0.05;
const BETA_MAX_FALLBACK = Math.PI - 0.05;

/**
 * The number of frames over which the entry-blend glide runs (design D10).
 * `_entryBlendFrame` is seeded to this inert value by the constructor so no
 * blend is in progress before a session starts.
 */
const ENTRY_BLEND_FRAMES = 90;

/**
 * The standard WebXR teleportation feature name (mirrors
 * `WebXRFeatureName.TELEPORTATION`). Used to defensively disable teleport when a
 * Locomotion_Mode is applied (R4.3); teleport is retained but never the active
 * flow (design D13). Kept as a literal so no additional BabylonJS runtime import
 * is introduced by this concern - the ESM import-map/bridge maintenance for new
 * imports is owned by task 21.
 */
const TELEPORTATION_FEATURE_NAME = "xr-controller-teleportation";

/**
 * The standard WebXR pointer-selection feature name (mirrors
 * `WebXRFeatureName.POINTER_SELECTION`). Used to resolve the pointer-selection
 * feature so the controller rays/rings can be hidden (left) or raised (right)
 * during a session (R13). Kept as a literal so no additional BabylonJS runtime
 * import is introduced by this concern - the ESM import-map/bridge maintenance
 * for new imports is owned by task 21.
 */
const POINTER_SELECTION_FEATURE_NAME = "xr-controller-pointer-selection";

/**
 * The rendering group the right controller's Pointer_Selection ring and laser
 * are raised to during a session (R13.2) so they render above other geometry
 * (a consumer HUD typically at group 1). Applied via `mesh.renderingGroupId`.
 */
const RIGHT_RAY_RENDERING_GROUP = 2;

export class XRController {
    // --- Collaborators recorded at construction ---
    private _cc: CharacterController;
    private _camera: ArcRotateCamera;
    private _scene: Scene;

    /** Pure first/third-person sub-mode state machine (design D5). */
    private _locomotion: XRLocomotion;

    /** The input mapping actually in force; seeded to the documented default. */
    private _effectiveMapping: XRInputMapping;

    // --- Adjustable sensitivity rates (clamped setters below: setAlphaRate /
    //     setBetaRate -> 0..0.02; setRadiusRate -> 0..0.2; non-finite ignored) ---
    private _alphaRate: number = DEFAULT_ALPHA_RATE;
    private _betaRate: number = DEFAULT_BETA_RATE;
    private _radiusRate: number = DEFAULT_RADIUS_RATE;

    /**
     * Left-stick deadzone used by `mapStickToIntent`. Clamped to `[0, 1]` by
     * `setStickDeadzone`; defaults to the documented `0.15` (R6.8).
     */
    private _stickDeadzone: number = DEFAULT_STICK_DEADZONE;

    /**
     * Entry-blend glide progress. Seeded to `ENTRY_BLEND_FRAMES` (inert) so no
     * blend runs before a session starts; reset to 0 on session start in a
     * later task.
     */
    private _entryBlendFrame: number = ENTRY_BLEND_FRAMES;

    // --- Lifecycle state ---
    /** The adopted or created WebXR experience. Null while XR support is disabled. */
    private _xrExperience: WebXRDefaultExperience | null = null;

    /** The rendered WebXR camera. Null while XR support is disabled. */
    private _xrCamera: WebXRCamera | null = null;

    /** True once `enable` has succeeded and not yet been `disable`d. */
    private _enabled: boolean = false;

    /** The registered `WebXRState` observer, retained for later unregistration. */
    private _stateObserver: Observer<WebXRState> | null = null;

    /**
     * The per-frame `scene.onBeforeRenderObservable` observer that drives stick
     * sampling (and, in later tasks, the camera follow update). Retained so it
     * can be detached on session end. Null while no sampler is running.
     */
    private _renderObserver: unknown = null;

    /**
     * Per-stream array of trigger-button observers registered by `_bindJump`
     * (one per bound trigger component, resolved by handedness from
     * `_effectiveMapping`). Each entry pairs the observable it was added to with
     * the observer handle so `_detachSessionObservers` can remove it precisely
     * (R8.3). Kept as its own tracked stream (design D-teardown) so enter/exit
     * cycles never accumulate jump handlers. Reset on session start; cleared on
     * session end.
     */
    private _triggerObservers: Array<{ observable: unknown; observer: unknown }> = [];

    /**
     * The persistent `onControllerAddedObservable` observer registered by
     * `bindInputs`. It fires whenever a WebXR controller is added (both the
     * controllers present at session start and any added later) and, for each,
     * wires the per-source motion-controller-init hook. Retained across the
     * session so it survives `rebindActiveSession` re-binds; torn down on session
     * end by `_detachSessionObservers`. Each entry pairs the observable with the
     * observer handle for precise removal (design D-teardown, D11). Reset on
     * session start; cleared on session end.
     */
    private _controllerAddedObservers: Array<{ observable: unknown; observer: unknown }> = [];

    /**
     * Per-source motion-controller-init observers registered by `bindInputs`
     * (one per added controller whose motion controller is not yet initialized).
     * On motion-controller init the bound handlers for that controller are wired.
     * Tracked here so `_detachSessionObservers` can remove each precisely. Reset
     * on session start; cleared on session end.
     */
    private _motionControllerInitObservers: Array<{ observable: unknown; observer: unknown }> = [];

    /**
     * Per-stream array of face-button (toggle) observers registered by the
     * data-driven binder for the rising-edge toggle actions
     * (`DollyToAvatarToggle` -> `toggleDollyToAvatar`, `LocomotionModeToggle` ->
     * `handleToggleRequest`). Each entry pairs the observable with the observer
     * handle so `_detachSessionObservers` can remove it precisely, ensuring
     * enter/exit cycles never accumulate toggle handlers (design D-teardown).
     * Reset on session start; cleared on session end.
     */
    private _toggleObservers: Array<{ observable: unknown; observer: unknown }> = [];

    /**
     * The live left/right thumbstick axes components captured by the data-driven
     * binder for the `Move` and `CameraOrbit` actions (resolved by handedness on
     * the correct controller). The per-frame `_readLeftStickInput` /
     * `_readRightStickInput` seams read each component's live `axes` value.
     * Null while no matching controller has been bound; cleared on session end.
     * _Requirements: 18.7, 18.10_
     */
    private _moveAxesComponent: unknown = null;
    private _orbitAxesComponent: unknown = null;

    /**
     * The live left-stick press component captured by the binder for the
     * `FastModifier` action (resolved by handedness). Its `.pressed` state feeds
     * the fast-modifier flag via the per-frame `_readFastModifier` seam. Null
     * until a matching controller is bound; cleared on session end.
     * _Requirements: 18.7_
     */
    private _fastModifierComponent: unknown = null;

    /**
     * The most-recent controller (motion controller) that requested a locomotion
     * mode toggle, recorded so blocked-toggle haptic feedback (task 14.2) can
     * pulse the requesting hand. Cleared on session end.
     * _Requirements: 5.5_
     */
    private _lastToggleController: unknown = null;

    // --- Controller ray-management latch/state (R13) ---
    /**
     * Latched `true` once the LEFT controller's Pointer_Selection laser ray and
     * selection ring have been hidden (R13.1). While `false`, the per-frame
     * `retryHideLeftControllerRay` keeps retrying because the pointer-selection
     * meshes may be created asynchronously after the controller is added
     * (R13.3). Reset on session start and by `resetRayState()` (R13.4).
     */
    private _leftRayHidden: boolean = false;

    /**
     * Latched `true` once the RIGHT controller's Pointer_Selection ring and
     * laser have been raised to `RIGHT_RAY_RENDERING_GROUP` (R13.2). While
     * `false`, the per-frame `retryRaiseRightSelectionRing` keeps retrying until
     * the async meshes exist (R13.3). Reset on session start and by
     * `resetRayState()` (R13.4).
     */
    private _rightRingRaised: boolean = false;

    /**
     * The remembered LEFT controller whose Pointer_Selection ray/ring are to be
     * hidden (R13.1). Recorded by `rememberLeftControllerAndHideRay` when the
     * left controller is wired; read by the retry seam each frame until the hide
     * latches. Null while no left controller has been wired; cleared on session
     * end via `resetRayState()`.
     */
    private _leftControllerForRay: unknown = null;

    /**
     * The remembered RIGHT controller whose Pointer_Selection ring/laser are to
     * be raised (R13.2). Recorded when the right controller is wired; read by the
     * retry seam each frame until the raise latches. Null while no right
     * controller has been wired; cleared on session end via `resetRayState()`.
     */
    private _rightControllerForRay: unknown = null;

    /**
     * The one-shot D15 initial-pose observer registered on
     * `baseExperience.onInitialXRPoseSetObservable`. On the first XR pose (before
     * the first render) it seeds the XR camera onto the live follow pose so the
     * floor/eye-level Y drop never appears. Retained here so
     * `_detachSessionObservers` can remove it if the session ends before it ever
     * fires; on firing it removes itself and clears this reference. Null while no
     * initial-pose hook is registered.
     * _Requirements: 11.1, 11.2, 11.3_
     */
    private _initialPoseObserver: { observable: unknown; observer: unknown } | null = null;

    /** True only while an immersive session is active. Driven by the state observer. */
    private _inXR: boolean = false;

    /**
     * The session type of the active (or most-recently-requested) session,
     * tracked so the state observer can pass it to `onSessionStart` on the
     * `IN_XR` transition. Null while no session type has been requested.
     */
    private _sessionType: XRSessionType | null = null;

    // --- Desktop snapshot recorded on session start, restored on session end ---
    /** Prior keyboard-enabled state, captured on session start (R15.1). */
    private _priorKeyboardEnabled: boolean = true;

    /**
     * Prior running state of the CharacterController. There is no public getter
     * for the started state, so this records the intent that the controller is
     * kept RUNNING across a session (R15.1); it is not toggled here.
     */
    private _priorRunning: boolean = true;

    // --- Entry-blend / last-intent per-session seams (filled by later tasks) ---
    /**
     * The last movement intent applied, retained so edge-triggering can diff
     * against it (full use in task 7.1). Reset on session start.
     */
    private _lastIntent: unknown = null;

    /** The last fast-modifier state applied, retained so `applyIntent` diffs against it. Reset on start. */
    private _lastFast: boolean = false;

    /**
     * The live left-stick pressed (clicked) state that drives the fast modifier
     * (R7.1). Sampled per frame from the FastModifier-bound button; the
     * data-driven binding that keeps this current lands in task 14.1. Read by
     * `_readFastModifier()` and combined into the applied intent by
     * `sampleSticks`. Reset to `false` on session start.
     */
    private _fastModifierPressed: boolean = false;

    /** Entry-blend captured offset seams (full use in task 12.1). Reset on start. */
    private _entryBlendOffsetX: number = 0;
    private _entryBlendOffsetY: number = 0;
    private _entryBlendOffsetZ: number = 0;

    /**
     * Captured live component references for the right-hand dolly buttons
     * (CameraDollyIn / CameraDollyOut), resolved once per session on the right
     * controller by handedness via `captureRightDollyButtons` (R10.5). The
     * per-frame `_applyButtonDolly` reads each component's live `.pressed` state.
     * Null while no right controller has been captured; cleared on session end.
     */
    private _dollyInComponent: unknown = null;
    private _dollyOutComponent: unknown = null;

    /**
     * Dolly-to-avatar toggle state (R10.4). `_dollyToAvatarActive` is true while
     * the camera is snapped to the avatar; `_dollyToAvatarPriorRadius` holds the
     * radius to restore on the next toggle. Reset on session start and cleared
     * on session end so a round-trip returns the radius to its original value.
     */
    private _dollyToAvatarActive: boolean = false;
    private _dollyToAvatarPriorRadius: number = 0;

    /**
     * Record collaborators, construct the pure locomotion state machine, seed
     * the effective mapping and the sensitivity rates, and set the entry-blend
     * progress to its inert value.
     *
     * _Requirements: 1.1, 12.1_
     */
    constructor(cc: CharacterController, camera: ArcRotateCamera, scene: Scene) {
        this._cc = cc;
        this._camera = camera;
        this._scene = scene;

        this._locomotion = new XRLocomotion();
        this._effectiveMapping = DEFAULT_XR_INPUT_MAPPING;

        this._alphaRate = DEFAULT_ALPHA_RATE;
        this._betaRate = DEFAULT_BETA_RATE;
        this._radiusRate = DEFAULT_RADIUS_RATE;
        this._stickDeadzone = DEFAULT_STICK_DEADZONE;

        this._entryBlendFrame = ENTRY_BLEND_FRAMES;
    }

    /**
     * True only while an immersive XR session is active. (R2.3)
     */
    isInXR(): boolean {
        return this._inXR === true;
    }

    /**
     * Request entry into an immersive XR session of the given `type`.
     *
     * Behavior (R2.1, R2.2, R2.6, R2.7):
     *  - No-op when XR support is disabled (`_enabled === false`) so the
     *    controller remains in ArcRotate_Mode (R2.7).
     *  - No-op when the requested session type is unsupported. Support is probed
     *    via `detectXRSupport()`; `'vr' -> vrSupported`, `'ar' -> arSupported`.
     *  - Otherwise reuse the single stored experience (created/adopted in
     *    `enable`, never re-created here - R2.1) and enter the base experience
     *    with the `local` Reference_Space (R2.2) via
     *    `baseExperience.enterXRAsync('immersive-vr' | 'immersive-ar',
     *    'local')`.
     *    Uses the `local` reference space (origin at the session-start head
     *    pose, ~eye level) rather than `local-floor` so the runtime does not add
     *    the user's floor-to-head standing height on top of the follow-camera
     *    position (which placed the XR eye above the avatar's head).
     *  - Re-entry after an exit reuses the same experience so no page reload is
     *    needed (R2.6).
     *
     * The actual session-start side effects (snapshot, keyboard, binding, render
     * observer) run from `onSessionStart`, driven by the `IN_XR` state
     * transition. This method only records the requested type and asks the base
     * experience to enter. All access is guarded (design D9) so a missing
     * `baseExperience`/`enterXRAsync` (e.g. under mocks) resolves without
     * throwing.
     *
     * _Requirements: 2.1, 2.2, 2.6, 2.7_
     */
    async enter(type: XRSessionType): Promise<void> {
        // R2.7: entering while XR support is disabled leaves ArcRotate_Mode intact.
        if (!this._enabled) {
            return;
        }

        try {
            // No-op when the requested session type is unsupported.
            const support = await detectXRSupport();
            const supported = type === "ar" ? support.arSupported === true : support.vrSupported === true;
            if (!supported) {
                return;
            }

            // R2.1: reuse the single stored experience; never create a new one here.
            const base = (
                this._xrExperience as {
                    baseExperience?: {
                        enterXRAsync?: (sessionMode: string, referenceSpaceType: string) => Promise<unknown>;
                    };
                } | null
            )?.baseExperience;

            if (base == null || typeof base.enterXRAsync !== "function") {
                return;
            }

            // Record the requested type so onSessionStart can read it on IN_XR.
            this._sessionType = type;

            const sessionMode = type === "ar" ? "immersive-ar" : "immersive-vr";
            // R2.2: enter with the `local` Reference_Space (origin at the
            // session-start head pose, ~eye level) rather than `local-floor` so
            // the runtime does not add the user's floor-to-head standing height
            // on top of the follow-camera position (which placed the XR eye
            // above the avatar's head).
            await base.enterXRAsync(sessionMode, "local");
        } catch {
            // D9: never throw across the XR boundary.
        }
    }

    /**
     * Request exit from the active immersive XR session.
     *
     * Behavior (R2.4, R2.5):
     *  - Idempotent: a no-op when no session is active (`_inXR === false`) so
     *    the desktop state is left unchanged (R2.5).
     *  - Otherwise ask the base experience to exit via `exitXRAsync()`. The
     *    restore side effects (neutral intent, observer teardown, keyboard/
     *    camera restore) run from `onSessionEnd`, driven by the `NOT_IN_XR`
     *    state transition (R2.4).
     *
     * All access is guarded (design D9) so a missing `baseExperience`/
     * `exitXRAsync` never throws.
     *
     * _Requirements: 2.4, 2.5_
     */
    async exit(): Promise<void> {
        // R2.5: idempotent no-op when not in a session.
        if (!this._inXR) {
            return;
        }

        try {
            const base = (
                this._xrExperience as {
                    baseExperience?: { exitXRAsync?: () => Promise<unknown> };
                } | null
            )?.baseExperience;

            if (base != null && typeof base.exitXRAsync === "function") {
                await base.exitXRAsync();
            }
        } catch {
            // D9: never throw across the XR boundary.
        }
    }

    /**
     * Session-start lifecycle hook, invoked on the `IN_XR` state transition.
     *
     * Steps (R2.2, R3.7, R3.8, R15.1):
     *  1. Record the desktop snapshot: prior keyboard-enabled state (via
     *     `cc.isKeyBoardEnabled()`) and prior running state. There is no public
     *     getter for the CharacterController started state, so running is
     *     recorded as an intent to keep it RUNNING - `cc.stop()` is NOT called.
     *  2. Disable keyboard input ONLY via `cc.enableKeyBoard(false)` (R15.1),
     *     keeping the controller running.
     *  3. Reset per-session state (entry-blend progress/offsets and the
     *     last-intent tracking seams).
     *  4. Register the D15 initial-pose hook via a guarded seam (task 12.3).
     *  5. Set the Locomotion_Mode default from `No_First_Person`: `firstPerson`
     *     when `noFirstPerson === false`, else `thirdPerson` (R3.7, R3.8), on the
     *     `_locomotion` machine using `setMode(mode, canFirstPerson)` where
     *     `canFirstPerson = !noFirstPerson`, then apply the camera coupling via a
     *     guarded seam (task 6.1).
     *  6. Build the Effective_Mapping (guarded seam; task 14.1).
     *  7. Bind inputs (guarded seam; task 14.1) and start the render observer
     *     (guarded seam; task 7.1 / 12.1).
     *
     * All access is guarded (design D9) so a mocked CharacterController never
     * throws here.
     *
     * _Requirements: 2.2, 3.7, 3.8, 15.1_
     */
    onSessionStart(type: XRSessionType): void {
        try {
            this._sessionType = type;

            // 1-2. Desktop preserve: record the prior keyboard-enabled and
            // running state (`ccKeyboardEnabled` / `ccStarted`) and disable ONLY
            // keyboard input while keeping the CharacterController RUNNING - it is
            // never stopped (R15.1).
            this.disableDesktopController();

            // 3. Reset per-session state.
            this._entryBlendFrame = 0;
            this._entryBlendOffsetX = 0;
            this._entryBlendOffsetY = 0;
            this._entryBlendOffsetZ = 0;
            this._lastIntent = null;
            this._lastFast = false;
            this._fastModifierPressed = false;
            this._triggerObservers = [];
            this._controllerAddedObservers = [];
            this._motionControllerInitObservers = [];
            this._toggleObservers = [];
            this._moveAxesComponent = null;
            this._orbitAxesComponent = null;
            this._fastModifierComponent = null;
            this._lastToggleController = null;
            // R13.4: reset ray-management latches/state so this session
            // re-applies the left-ray hide and right-ring raise to its own
            // controllers.
            this._leftRayHidden = false;
            this._rightRingRaised = false;
            this._leftControllerForRay = null;
            this._rightControllerForRay = null;
            this._initialPoseObserver = null;
            // Reset the dolly-to-avatar toggle so a new session starts clean (R10.4).
            this._dollyToAvatarActive = false;
            this._dollyToAvatarPriorRadius = 0;

            // 4. Register the D15 initial-pose hook (full impl in task 12.3).
            this._registerInitialPoseHook();

            // 5. Locomotion default from No_First_Person (R3.7, R3.8), then couple.
            const noFirstPerson = this._readNoFirstPerson();
            const mode: LocomotionMode = noFirstPerson === false ? "firstPerson" : "thirdPerson";
            const canFirstPerson = noFirstPerson === false;
            try {
                this._locomotion.setMode(mode, canFirstPerson);
            } catch {
                // D9: swallow.
            }
            this.applyLocomotionMode(mode);

            // 6. Build the Effective_Mapping (full impl in task 14.1).
            this._buildEffectiveMapping();

            // 7. Bind inputs + start the render observer (full impls in 14.1 / 7.1).
            this._bindInputs(this._xrExperience);
            this._startRenderObserver();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Session-end lifecycle hook, invoked on the `NOT_IN_XR` state transition
     * (while `_inXR` still reflects the just-ended session).
     *
     * Steps (R2.4, R6.7, R15.2, R15.3, R15.4):
     *  1. Guard on `_inXR` - no-op if no session was active.
     *  2. Push a neutral movement intent so the Avatar is not left moving under
     *     ArcRotate_Mode (R6.7), via a guarded seam (task 7.1).
     *  3. Detach all per-session observers (guarded seam; task 17.1) (R15.4).
     *  4. Clear per-session captures (guarded seam) (R15.4).
     *  5. Restore keyboard-enabled and running state (R15.2) and restore
     *     ArcRotate_Mode as the active rendered camera via the existing
     *     `_restoreArcRotateMode()` (R15.3).
     *
     * All access is guarded (design D9).
     *
     * _Requirements: 2.4, 6.7, 15.2, 15.3, 15.4_
     */
    onSessionEnd(): void {
        // 1. R15.x: nothing to tear down if no session was active.
        if (!this._inXR) {
            return;
        }

        try {
            // 2. R6.7: neutral movement intent so the Avatar stops on exit.
            this._stopAllMovement();

            // 3. R15.4: detach all per-session observers.
            this.detachSessionObservers();

            // 4. R15.4: clear per-session captures.
            this._clearSessionCaptures();

            // 5. R15.2: restore the recorded keyboard-enabled + running state.
            this.restoreDesktopController();

            // 6. R15.3: restore ArcRotate_Mode as the active rendered camera.
            this.restoreArcRotateMode();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Desktop preserve (R15.1): record the prior keyboard-enabled and running
     * state of the CharacterController, then disable ONLY its keyboard input.
     *
     * The CharacterController is kept RUNNING throughout an XR session - it is
     * never stopped. There is no public getter for its started state, so the
     * "running" snapshot (`ccStarted`, stored in `_priorRunning`) records the
     * intent that the controller stays running; only keyboard input is toggled.
     * The prior keyboard-enabled state (`ccKeyboardEnabled`, stored in
     * `_priorKeyboardEnabled`) is captured so it can be restored exactly on
     * session end.
     *
     * This encapsulates the keyboard snapshot+disable that `onSessionStart`
     * performs so the preserve/restore pair is symmetric with
     * {@link restoreDesktopController}. Every access is guarded (design D9) so a
     * mocked controller never throws.
     *
     * _Requirements: 15.1, 17.1, 17.2, 17.3_
     */
    disableDesktopController(): void {
        // Record the prior keyboard-enabled state (`ccKeyboardEnabled`).
        try {
            this._priorKeyboardEnabled = this._cc.isKeyBoardEnabled?.() === true;
        } catch {
            this._priorKeyboardEnabled = true;
        }
        // Record that the controller is kept RUNNING (`ccStarted`); it is not
        // toggled here - the CC is never stopped for an XR session (R15.1).
        this._priorRunning = true;

        // Disable ONLY keyboard input; the controller stays running (R15.1).
        try {
            this._cc.enableKeyBoard?.(false);
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Desktop restore (R15.2): restore the recorded keyboard-enabled state and
     * running state captured by {@link disableDesktopController}.
     *
     * The CharacterController was kept RUNNING for the whole session, so nothing
     * needs restarting - the recorded `ccStarted` (`_priorRunning`) intent is
     * preserved for symmetry. The keyboard is re-enabled to exactly the prior
     * `ccKeyboardEnabled` (`_priorKeyboardEnabled`) value, whether it was on or
     * off before the session. Collision handling, slope limits, and animation
     * behavior are left untouched (R15.5, R17.x). Guarded (design D9) so a
     * mocked controller never throws.
     *
     * _Requirements: 15.2, 15.5, 17.1, 17.2, 17.3_
     */
    restoreDesktopController(): void {
        try {
            this._cc.enableKeyBoard?.(this._priorKeyboardEnabled);
        } catch {
            // D9: swallow.
        }
        // Running state was kept RUNNING throughout; nothing to restart. The
        // recorded `ccStarted` (`_priorRunning`) intent is preserved for symmetry.
        void this._priorRunning;
    }

    /**
     * Enable XR support by adopting a provided experience/camera or, when none
     * is provided, lazily creating a default experience.
     *
     * Behavior (R1.1-R1.5):
     *  - With a provided `WebXRDefaultExperience` (or a `WebXRCamera`), adopt it,
     *    register the `WebXRState` observer, and resolve `true`.
     *  - With no argument, create a default experience via
     *    `createDefaultXRExperienceAsync({ disableTeleportation: true })`, adopt
     *    it and its camera, register the observer, and resolve `true`.
     *  - On re-enable (already enabled), replace the stored reference and
     *    re-register the observer, then resolve `true`.
     *  - On ANY failure, leave all stored state untouched and resolve `false`.
     *
     * This method is async and never throws (design D9): every BabylonJS/WebXR
     * access is guarded, and failures are reported via a resolved boolean.
     *
     * _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
     */
    async enable(xr?: WebXRDefaultExperience | WebXRCamera): Promise<boolean> {
        try {
            // Resolve the experience/camera to adopt WITHOUT touching any stored
            // state yet, so that a failure leaves prior state untouched (R1.4).
            let experience: WebXRDefaultExperience | null = null;
            let camera: WebXRCamera | null = null;

            if (xr != null) {
                const adopted = this._adoptProvided(xr);
                experience = adopted.experience;
                camera = adopted.camera;
            } else {
                experience = await this._createDefaultExperience();

                //sat test
                //experience.baseExperience.camera.compensateOnFirstFrame = false; // Prevents initial frame jumps

                camera = this._extractCameraFromExperience(experience);
            }

            // A successful adoption requires at least an experience or a camera to
            // hang the session lifecycle off of. Without one, treat as failure and
            // leave state untouched (R1.4).
            if (experience == null && camera == null) {
                return false;
            }

            // Register the state observer against the resolved experience BEFORE we
            // mutate any stored reference, so a registration failure also leaves
            // prior state untouched (R1.4).
            const observer = this._registerStateObserver(experience);

            // On re-enable, drop the prior observer registration before replacing
            // the stored references (R1.5).
            if (this._enabled) {
                this._unregisterStateObserver();
            }

            this._xrExperience = experience;
            this._xrCamera = camera;
            this._stateObserver = observer;
            this._enabled = true;

            return true;
        } catch {
            // D9: never throw across the XR boundary; report failure as false and
            // leave all stored state untouched (R1.3, R1.4).
            return false;
        }
    }

    /**
     * Disable XR support.
     *
     * Behavior (R1.6-R1.8):
     *  - When a session is currently active, restore ArcRotate_Mode first so the
     *    avatar is not left in a broken camera state, then release the stored
     *    reference and unregister the state observer.
     *  - When no session is active, release the stored reference and unregister
     *    the state observer.
     *  - When XR support is not enabled, take no action (no-op) and never throw.
     *
     * All access is guarded (design D9) so this never throws under mocks.
     *
     * _Requirements: 1.6, 1.7, 1.8_
     */
    async disable(): Promise<void> {
        // R1.8: no-op when not enabled.
        if (!this._enabled) {
            return;
        }

        try {
            // R1.7: when a session is active, restore ArcRotate_Mode first so the
            // avatar isn't left in a broken camera state. The full restore lives
            // in a later task (17.1); this guarded placeholder re-activates the
            // ArcRotateCamera as the rendered camera and re-attaches its controls.
            if (this._inXR) {
                this.restoreArcRotateMode();
            }
        } finally {
            // R1.6/R1.7: release the stored reference and unregister the observer.
            this._unregisterStateObserver();
            this._xrExperience = null;
            this._xrCamera = null;
            this._inXR = false;
            this._enabled = false;
        }
    }

    // --- Guarded internal helpers (D9: none of these throw) ---

    /**
     * Adopt a provided `WebXRDefaultExperience` or `WebXRCamera`. A shape guard
     * distinguishes the two: a `WebXRDefaultExperience` exposes a
     * `baseExperience`, whereas a bare camera does not. Returns whichever of
     * experience/camera could be resolved; either may be null.
     */
    private _adoptProvided(xr: WebXRDefaultExperience | WebXRCamera): {
        experience: WebXRDefaultExperience | null;
        camera: WebXRCamera | null;
    } {
        try {
            const asExperience = xr as WebXRDefaultExperience;
            if (asExperience != null && (asExperience as { baseExperience?: unknown }).baseExperience != null) {
                return {
                    experience: asExperience,
                    camera: this._extractCameraFromExperience(asExperience),
                };
            }
            // Otherwise treat the argument as a bare WebXRCamera.
            return { experience: null, camera: (xr as WebXRCamera) ?? null };
        } catch {
            return { experience: null, camera: null };
        }
    }

    /**
     * Create a default WebXR experience with teleportation disabled (design:
     * teleport is retained but never the active flow). Guarded so a missing
     * factory (e.g. under mocks) resolves to null rather than throwing.
     */
    private async _createDefaultExperience(): Promise<WebXRDefaultExperience | null> {
        try {
            const scene = this._scene as unknown as {
                createDefaultXRExperienceAsync?: (opts: unknown) => Promise<WebXRDefaultExperience>;
            };
            if (scene == null || typeof scene.createDefaultXRExperienceAsync !== "function") {
                return null;
            }
            const experience = await scene.createDefaultXRExperienceAsync({ disableTeleportation: true });
            return experience ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Pull the rendered `WebXRCamera` out of an experience's base helper,
     * guarding every hop so an unexpected shape yields null.
     */
    private _extractCameraFromExperience(experience: WebXRDefaultExperience | null): WebXRCamera | null {
        try {
            const base = (experience as { baseExperience?: { camera?: WebXRCamera } } | null)?.baseExperience;
            return base?.camera ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Register a `WebXRState` observer on the experience's
     * `baseExperience.onStateChangedObservable`, tracking session activity so
     * `isInXR` reflects whether a session is running. Returns the observer (for
     * later unregistration) or null when the observable is unavailable.
     */
    private _registerStateObserver(experience: WebXRDefaultExperience | null): Observer<WebXRState> | null {
        try {
            const observable = (
                experience as {
                    baseExperience?: {
                        onStateChangedObservable?: {
                            add?: (cb: (state: WebXRState) => void) => Observer<WebXRState>;
                        };
                    };
                } | null
            )?.baseExperience?.onStateChangedObservable;

            if (observable == null || typeof observable.add !== "function") {
                return null;
            }

            return observable.add((state: WebXRState) => this._onStateChanged(state)) ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Remove the previously-registered `WebXRState` observer, guarding the
     * removal so a missing observable/observer never throws.
     */
    private _unregisterStateObserver(): void {
        try {
            const observable = (
                this._xrExperience as {
                    baseExperience?: {
                        onStateChangedObservable?: {
                            remove?: (o: Observer<WebXRState> | null) => void;
                        };
                    };
                } | null
            )?.baseExperience?.onStateChangedObservable;

            if (observable != null && typeof observable.remove === "function" && this._stateObserver != null) {
                observable.remove(this._stateObserver);
            }
        } catch {
            // D9: swallow.
        } finally {
            this._stateObserver = null;
        }
    }

    /**
     * Track session activity from `WebXRState` transitions. `IN_XR` marks a live
     * session; `NOT_IN_XR` marks its end. The full session enter/exit hooks
     * (snapshot, keyboard, binding, render observer) are wired in a later task
     * (5.2); here we only maintain the `_inXR` flag that backs `isInXR`.
     */
    private _onStateChanged(state: WebXRState): void {
        try {
            if (state === WebXRState.IN_XR) {
                this._inXR = true;
                // Fire the session-start lifecycle hook now that a session is live.
                this.onSessionStart(this._sessionType ?? "vr");
            } else if (state === WebXRState.NOT_IN_XR) {
                // Run the session-end teardown while `_inXR` still reflects the
                // just-ended session (the hook guards on it), then clear the flag.
                this.onSessionEnd();
                this._inXR = false;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Read the CharacterController's `noFirstPerson` setting via `getSettings()`,
     * guarding the access so a mocked controller yields a safe default (`false`,
     * i.e. first person permitted) rather than throwing.
     */
    private _readNoFirstPerson(): boolean {
        try {
            const settings = this._cc.getSettings?.();
            return (settings as { noFirstPerson?: boolean } | undefined)?.noFirstPerson === true;
        } catch {
            return false;
        }
    }

    /**
     * Register the D15 initial-pose hook that seeds the XR camera onto the follow
     * pose at entry so the floor/eye-level Y drop never appears.
     *
     * `WebXRDefaultExperience` seeds the `WebXRCamera` from the non-VR camera on
     * entry via `setTransformationFromNonVRCamera`, which measures head pose from
     * the reference-space floor and drops the arc camera's Y (the camera appears
     * at standing eye-level from the floor instead of at the follow pose). To fix
     * this at its source (design D15), a ONE-SHOT observer is registered on
     * `baseExperience.onInitialXRPoseSetObservable`; on the first XR pose - before
     * the first render - it computes the live follow target (the SAME mirror +
     * arc-camera-Y re-apply as `_updateXRCameraFollow`, D6, extracted into the
     * shared `_seedXRCameraOntoFollowPose` helper) and sets the XR camera directly
     * onto it. The observer removes itself after firing so a later pose never
     * re-seeds.
     *
     * When `onInitialXRPoseSetObservable` is unavailable (e.g. an older
     * experience or a mocked test env), the seed falls back to the `IN_XR`
     * transition. Because this hook is registered from `onSessionStart`, which is
     * itself driven by the `IN_XR` transition (see `_onStateChanged`), the
     * fallback seeds immediately and once - the session is already live and the
     * follow pose is computable - so no extra state observer is registered or
     * needs teardown.
     *
     * Because the seed lands the camera on the follow pose, the D10 entry-blend
     * offset captured on the first blend frame is near-zero; the glide remains as
     * the secondary smoother (no behavior change to `_updateXRCameraFollow`).
     *
     * Both the primary and fallback observers are tracked
     * (`_initialPoseObserver` / `_initialPoseFallbackObserver`) so
     * `_detachSessionObservers` tears them down on session end if they never
     * fired. Every BabylonJS/observable hop is guarded (design D9) so a missing
     * observable never throws.
     *
     * _Requirements: 11.1, 11.2, 11.3_
     */
    private _registerInitialPoseHook(): void {
        try {
            const base = (
                this._xrExperience as {
                    baseExperience?: {
                        onInitialXRPoseSetObservable?: {
                            add?: (cb: () => void) => unknown;
                            remove?: (o: unknown) => void;
                        };
                        onStateChangedObservable?: {
                            add?: (cb: (state: WebXRState) => void) => unknown;
                            remove?: (o: unknown) => void;
                        };
                    };
                } | null
            )?.baseExperience;

            const poseObservable = base?.onInitialXRPoseSetObservable;

            // Primary path: seed on the first XR pose, before the first render.
            if (poseObservable != null && typeof poseObservable.add === "function") {
                const observer = poseObservable.add(() => {
                    try {
                        this._seedXRCameraOntoFollowPose();
                    } catch {
                        // D9: swallow inside the per-event handler.
                    } finally {
                        // One-shot: remove self so a later pose never re-seeds.
                        this._removeInitialPoseObserver();
                    }
                });
                this._initialPoseObserver = { observable: poseObservable, observer };
                return;
            }

            // Fallback path: the initial-pose observable is unavailable. This
            // hook runs from `onSessionStart`, which is driven by the `IN_XR`
            // transition, so the session is already live - seed the follow pose
            // immediately, once. No extra state observer is registered (nothing to
            // leak or tear down); the D10 entry-blend glide still smooths any
            // residual settling on the first render frames.
            this._seedXRCameraOntoFollowPose();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Seed the rendered `WebXRCamera` onto the live follow pose: mirror the
     * Follow_Camera (the owned `ArcRotateCamera`) transform via
     * `setTransformationFromNonVRCamera(arcCamera, true)` then re-apply the arc
     * camera's Y (the mirror zeroes the XR camera's `position.y`, so re-applying
     * the arc Y preserves the beta-driven camera height). This is the SAME
     * mirror-plus-reapply-Y computation `_updateXRCameraFollow` performs per
     * frame (D6), extracted here so the initial-pose hook and the per-frame
     * follow share one implementation without changing the follow's behavior.
     *
     * Every BabylonJS/camera hop is individually guarded (design D9) so a
     * missing/mocked camera, an absent `setTransformationFromNonVRCamera`, or an
     * odd-shaped `position` never throws.
     *
     * _Requirements: 11.1, 11.2_
     */
    private _seedXRCameraOntoFollowPose(): void {
        try {
            const xr = this._xrCamera as unknown as {
                setTransformationFromNonVRCamera?: (camera: unknown, resetToBaseReferenceSpace?: boolean) => unknown;
                position?: { x?: number; y?: number; z?: number };
                realWorldHeight?: number;
            } | null;
            if (xr == null) {
                return;
            }

            const arc = this._camera as unknown as {
                position?: { x?: number; y?: number; z?: number };
            } | null;

            // R11.1: mirror the Follow_Camera transform onto the XR camera. The
            // mirror forces the XR camera position.y to zero.
            if (typeof xr.setTransformationFromNonVRCamera === "function") {
                xr.setTransformationFromNonVRCamera(this._camera, true);
            }

            // R11.2: re-apply the arc camera's Y so beta-driven camera height is
            // preserved (the mirror zeroed it).
            const arcY = typeof arc?.position?.y === "number" ? arc.position.y : 0;
            // Compensate for the runtime adding the user's real-world head height H on
            // top of the base position: to land the RENDERED eye at arcY (design A), set
            // the base Y to arcY - H. realWorldHeight is a stable physical measurement
            // (NOT derived from the base position we write here), so it does not create
            // the per-frame feedback loop that reading rigCameras[0].position.y did.
            const rwh = typeof xr.realWorldHeight === "number" && isFinite(xr.realWorldHeight) ? xr.realWorldHeight : 0;
            if (xr.position != null && typeof xr.position.y === "number") {
                xr.position.y = arcY - rwh;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Remove the one-shot D15 initial-pose observer from
     * `onInitialXRPoseSetObservable`, guarding the removal so a missing
     * observable/observer never throws (design D9), then clear the tracking
     * reference. Called after the observer fires and from
     * `_detachSessionObservers` on session end.
     *
     * _Requirements: 11.3_
     */
    private _removeInitialPoseObserver(): void {
        try {
            const entry = this._initialPoseObserver;
            if (entry != null) {
                const observable = entry.observable as { remove?: (o: unknown) => void } | null | undefined;
                if (observable != null && typeof observable.remove === "function" && entry.observer != null) {
                    observable.remove(entry.observer);
                }
            }
        } catch {
            // D9: swallow.
        } finally {
            this._initialPoseObserver = null;
        }
    }

    /**
     * Whether first-person camera coupling is permitted, derived from the
     * CharacterController's `No_First_Person` setting: first person is allowed
     * exactly when `noFirstPerson` is falsy.
     *
     * This is the negation of the controller setting - `!cc.getSettings()
     * .noFirstPerson` - read through the guarded `_readNoFirstPerson()` seam so
     * a mocked controller yields a safe default (first person permitted) rather
     * than throwing (design D9). It backs the in-session toggle's
     * `Can_First_Person` derivation (R5.2).
     *
     * _Requirements: 5.2_
     */
    canFirstPerson(): boolean {
        return this._readNoFirstPerson() === false;
    }

    /**
     * The XR_First_Person_Coupling gate: `isInXR() && canFirstPerson() &&
     * _readInFirstPerson()`. This is the single source of truth for whether the
     * headset drives the arc camera orientation this frame.
     *
     * Consulted in two places: `_syncArcFromXRCamera()` uses it as its early-
     * return gate, and the per-frame render observer branches on it to choose the
     * headset-driven XR -> arc sync (coupled) vs. the legacy arc -> XR follow
     * mirror `_updateXRCameraFollow()` (not coupled, i.e. third person).
     *
     * Guarded (design D9): if any hop throws, it returns `false` (no coupling) so
     * the render loop never throws across the XR boundary.
     *
     * _Requirements: 4.1, 4.2, 4.5_
     */
    private _xrFirstPersonCoupled(): boolean {
        try {
            return this.isInXR() && this.canFirstPerson() && this._readInFirstPerson();
        } catch {
            return false;
        }
    }

    /**
     * Per-frame XR -> arc synchronization. While XR_First_Person_Coupling holds
     * (`isInXR() && canFirstPerson() && _readInFirstPerson()`), read the headset
     * orientation from the rendered `WebXRCamera`, derive `{ alpha, beta }` via
     * the pure `deriveArcAngles` helper, and assign them to the owned
     * `ArcRotateCamera`. Otherwise the arc `alpha`/`beta` are left unchanged
     * (R4.1, R4.2, R4.5).
     *
     * This reverses the direction of the legacy `_updateXRCameraFollow` mirror:
     * the headset is now the SOURCE and the arc camera the SINK for orientation
     * (R1.3). Only the orientation (`alpha`/`beta`) is sourced here; the
     * position/height entry-blend concern that `_updateXRCameraFollow` owns is
     * left intact (this task defines the method only; wiring lands in task 3.2).
     *
     * Design D9 ("never throw across the XR boundary"): every access is guarded
     * and the whole body is wrapped in try/catch, so an absent/mocked/unreadable
     * XR camera (R5.1) completes without throwing and without changing the arc.
     *
     * _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.1, 4.2, 4.5, 5.1_
     */
    private _syncArcFromXRCamera(): void {
        try {
            // Coupling gate: only while in XR AND first person is engaged.
            // R4.1: not in XR -> no change. R4.2/R4.5: FP inactive -> no change.
            // Single source of truth for the coupling gate (see
            // `_xrFirstPersonCoupled`), also consulted per-frame by the render
            // observer to choose the headset-driven sync vs. the arc -> XR follow.
            if (!this._xrFirstPersonCoupled()) {
                return;
            }

            const xr = this._xrCamera;
            if (xr == null) {
                return; // R5.1: absent XR camera -> no throw, no change.
            }

            const orientation = this._readHeadsetOrientation(xr);
            if (orientation == null) {
                return; // R5.1: unreadable pose -> no change.
            }

            const arc = this._camera as unknown as {
                alpha?: number;
                beta?: number;
                lowerBetaLimit?: number | null;
                upperBetaLimit?: number | null;
            } | null;
            if (arc == null) {
                return;
            }

            const limits = this._resolveBetaLimits(arc);
            const { alpha, beta } = deriveArcAngles(orientation, limits); // R1.1, R2.1, R2.3

            arc.alpha = alpha; // R1.2
            arc.beta = beta; // R2.2
        } catch {
            // D9: swallow - never throw across the XR boundary (contributes to R5.1).
        }
    }

    /**
     * Guarded seam reporting whether the owned `CharacterController` is currently
     * in First_Person_Mode, by reading its lightweight `isInFirstPerson()` query
     * (added in task 2.1). Combined with `isInXR()` and `canFirstPerson()` this
     * forms the XR_First_Person_Coupling gate for `_syncArcFromXRCamera`.
     *
     * Access is optional-chained and wrapped so a mocked controller that omits
     * the query yields a safe default (`false`, i.e. no coupling) rather than
     * throwing (design D9).
     *
     * _Requirements: 4.3, 4.5_
     */
    private _readInFirstPerson(): boolean {
        try {
            return this._cc.isInFirstPerson?.() === true;
        } catch {
            return false;
        }
    }

    /**
     * Extract the headset yaw/pitch (radians) from the rendered `WebXRCamera`,
     * returning a pure `HeadsetOrientation` DTO the `deriveArcAngles` helper
     * consumes, or `null` when the pose cannot be read.
     *
     * The `WebXRCamera` (a `FreeCamera`) expresses head orientation as a
     * `rotationQuaternion`; its Euler decomposition gives yaw (Y) and pitch (X).
     * Access is guarded so a mocked camera missing the quaternion (or its
     * `toEulerAngles`) yields `null` rather than throwing (design D9). No new
     * BabylonJS import is introduced - only the already-imported `WebXRCamera`
     * type is referenced and the extraction reads its runtime shape.
     *
     * _Requirements: 1.1, 2.1, 5.1_
     */
    private _readHeadsetOrientation(xr: WebXRCamera): HeadsetOrientation | null {
        try {
            const cam = xr as unknown as {
                rotationQuaternion?: { toEulerAngles?: () => { x?: number; y?: number } | null } | null;
            } | null;
            const quat = cam?.rotationQuaternion;
            if (quat == null || typeof quat.toEulerAngles !== "function") {
                return null;
            }
            const euler = quat.toEulerAngles();
            if (euler == null) {
                return null;
            }
            const yaw = euler.y;
            const pitch = euler.x;
            if (typeof yaw !== "number" || typeof pitch !== "number") {
                return null;
            }
            return { yaw, pitch };
        } catch {
            return null;
        }
    }

    /**
     * Resolve the inclusive `BetaLimits` for the arc camera this frame, reusing
     * the SAME resolution `clampBeta()` uses: the camera's `lowerBetaLimit` /
     * `upperBetaLimit` when each is numeric and finite, else the pole-avoiding
     * fallback `BETA_MIN_FALLBACK (0.05) .. BETA_MAX_FALLBACK (π − 0.05)` for the
     * missing bound, so the headset-derived beta stays off the gimbal
     * singularity (R2.3).
     *
     * _Requirements: 2.3_
     */
    private _resolveBetaLimits(arc: {
        lowerBetaLimit?: number | null;
        upperBetaLimit?: number | null;
    }): BetaLimits {
        const lower =
            typeof arc.lowerBetaLimit === "number" && isFinite(arc.lowerBetaLimit)
                ? arc.lowerBetaLimit
                : BETA_MIN_FALLBACK;
        const upper =
            typeof arc.upperBetaLimit === "number" && isFinite(arc.upperBetaLimit)
                ? arc.upperBetaLimit
                : BETA_MAX_FALLBACK;
        return { lower, upper };
    }

    /**
     * Apply the Locomotion_Mode camera coupling.
     *
     * Behavior (R4.1-R4.4):
     *  - Ensure the Teleport capability is not active, because
     *    Thumbstick_Locomotion is the movement mechanism (R4.3). Any teleport
     *    feature is torn down defensively; it is never enabled by this flow.
     *  - Configure the camera coupling via `cc.setNoFirstPerson(mode !==
     *    'firstPerson')`: `firstPerson` -> `setNoFirstPerson(false)` (R4.1);
     *    `thirdPerson` -> `setNoFirstPerson(true)` (R4.2).
     *  - Leave the movement mechanism (thumbstick-driven walk/strafe) unchanged;
     *    only camera coupling is altered here (R4.4).
     *
     * All BabylonJS/controller access is guarded (design D9) so a mocked
     * controller/experience never throws.
     *
     * _Requirements: 4.1, 4.2, 4.3, 4.4_
     */
    applyLocomotionMode(mode: LocomotionMode): void {
        // R4.3: teleport must not be the active mechanism when a mode is applied.
        this._disableTeleportation();

        try {
            // R4.1/R4.2: couple the camera to the mode. R4.4: nothing about the
            // thumbstick movement mechanism is touched here.
            this._cc.setNoFirstPerson?.(mode !== "firstPerson");
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Defensive teardown of any legacy-enabled WebXR teleportation feature on
     * the supplied features manager (R14.1). Teleport is RETAINED in the
     * codebase but is NEVER enabled by the active flow (design D13); this method
     * only ever *disables* the feature - it never enables it.
     *
     * Accepts the features manager as a parameter so callers that already hold
     * it (e.g. session setup) can request the guarded teardown directly. The
     * private `_disableTeleportation()` resolves the features manager off the
     * stored experience and delegates here, so there is a single implementation.
     *
     * Every hop is guarded so a null/mocked features manager, a missing
     * `disableFeature`, or a features manager created with
     * `disableTeleportation: true` never throws (design D9).
     *
     * @param fm The WebXR features manager (or any shape exposing an optional
     *   `disableFeature`); may be `null`/`undefined`, in which case this is a
     *   no-op.
     *
     * _Requirements: 14.1_
     */
    disableTeleportation(fm: { disableFeature?: (feature: unknown) => unknown } | null | undefined): void {
        try {
            if (fm != null && typeof fm.disableFeature === "function") {
                // WebXRFeatureName.TELEPORTATION. Passed as the literal feature
                // name so this task adds no new BabylonJS runtime import (and thus
                // no ESM import-map/bridge entry, which task 21 owns).
                fm.disableFeature(TELEPORTATION_FEATURE_NAME);
            }
        } catch {
            // D9: swallow - teleport already off / no features manager.
        }
    }

    /**
     * Ensure the WebXR teleportation feature is not active (R4.3, R14.1).
     * Teleport is retained in the codebase but never the active locomotion path
     * (design D13); this resolves the features manager off the stored experience
     * and delegates to {@link disableTeleportation} so there is a single guarded
     * teardown implementation. Every hop is guarded so a missing features
     * manager (e.g. under mocks, or when the experience was created with
     * `disableTeleportation: true`) never throws (design D9). It never enables
     * teleport.
     *
     * _Requirements: 4.3, 14.1_
     */
    private _disableTeleportation(): void {
        try {
            const fm = (
                this._xrExperience as {
                    baseExperience?: {
                        featuresManager?: { disableFeature?: (feature: unknown) => unknown };
                    };
                } | null
            )?.baseExperience?.featuresManager;

            this.disableTeleportation(fm);
        } catch {
            // D9: swallow - teleport already off / no features manager.
        }
    }

    /**
     * Retained Point_to_Move helper (R14.2, R14.3).
     *
     * Given a WebXR pointer/pick result carrying a VALID picked ground point,
     * drive the Avatar to that point via the CharacterController's public
     * `moveTo(target)` API (R14.2). Given no valid pick, do nothing - `moveTo`
     * is not invoked (R14.3).
     *
     * A pick is "valid" when the pick object exists, its `hit` is truthy (when
     * the property is present), and it carries a usable `pickedPoint` - a
     * Vector3-like `{ x, y, z }` whose components are all finite numbers. A
     * null/undefined pick, a `hit === false`, a missing `pickedPoint`, or any
     * non-finite coordinate yields NO `moveTo` call.
     *
     * This helper is RETAINED for reuse but is NOT routed by the active flow:
     * XR controller select is deliberately never wired through it during a
     * session, because Thumbstick_Locomotion is the movement mechanism (R14.4).
     * It exists only as a reusable helper.
     *
     * All access is guarded so a malformed pick never throws (design D9).
     *
     * @param pick A WebXR pointer/pick result (or any shape exposing `hit` and
     *   `pickedPoint`); may be `null`/`undefined`.
     *
     * _Requirements: 14.2, 14.3, 14.4_
     */
    handleSelect(pick: { hit?: unknown; pickedPoint?: { x?: unknown; y?: unknown; z?: unknown } | null } | null | undefined): void {
        try {
            if (pick == null) {
                // R14.3: no pick -> no move.
                return;
            }

            // When `hit` is present it must be truthy; when absent we fall
            // through to the pickedPoint check (some pick shapes omit `hit`).
            if ("hit" in pick && !pick.hit) {
                return;
            }

            const point = pick.pickedPoint;
            if (point == null) {
                // R14.3: no picked point -> no move.
                return;
            }

            const { x, y, z } = point;
            if (
                typeof x !== "number" ||
                typeof y !== "number" ||
                typeof z !== "number" ||
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(z)
            ) {
                // R14.3: non-finite / non-numeric coords -> no move.
                return;
            }

            // R14.2: valid picked ground point -> drive the avatar there.
            (this._cc.moveTo as ((target: unknown) => void) | undefined)?.(point);
        } catch {
            // D9: swallow - a malformed pick must never throw.
        }
    }

    /**
     * Seam: build the Effective_Mapping (developer partial overlaid on the
     * default). The full implementation lands in task 14.1; here we simply keep
     * the seeded `_effectiveMapping` in force. Guarded so it never throws (D9).
     */
    private _buildEffectiveMapping(): void {
        try {
            if (this._effectiveMapping == null) {
                this._effectiveMapping = DEFAULT_XR_INPUT_MAPPING;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Internal entry point used by `onSessionStart` to bind XR controller inputs
     * against the live experience. Delegates to the public `bindInputs` so the
     * lifecycle hook and any explicit re-bind share one implementation. Guarded
     * so a missing/mocked experience never throws (D9).
     *
     * _Requirements: 18.7, 18.10_
     */
    private _bindInputs(experience: WebXRDefaultExperience | null): void {
        try {
            this.bindInputs(experience);
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Data-driven controller binding (design D7, D11).
     *
     * Registers a persistent `onControllerAddedObservable` hook on the
     * experience's input feature so that, for every WebXR controller (both those
     * present at session start and any added later), the bound handlers are
     * wired according to the `_effectiveMapping`. Because a controller's motion
     * controller may not be initialized when the controller is added, each added
     * controller's `onMotionControllerInitObservable` is subscribed (or, when the
     * motion controller is already present, wired immediately).
     *
     * On motion-controller init, `_wireController` walks every
     * {@link BindableAction}, looks up its bound {@link BindableInput} in the
     * `_effectiveMapping`, resolves the matching WebXR component by handedness
     * via `INPUT_RESOLUTION`, and attaches the appropriate handler. Actions bound
     * to `null` are skipped entirely, so no handler is wired and the action never
     * fires (R18.10).
     *
     * The controller-added, per-source motion-controller-init, toggle-button, and
     * trigger-button observers are tracked in per-stream arrays so
     * `_detachSessionObservers` tears them all down on session end (design
     * D-teardown) - repeated enter/exit or re-bind cycles never accumulate
     * handlers.
     *
     * Every BabylonJS/WebXR hop is guarded (design D9) so a missing input
     * feature, a mocked experience, or an absent observable never throws.
     *
     * _Requirements: 18.7, 18.10_
     */
    bindInputs(experience: WebXRDefaultExperience | null): void {
        try {
            const input = (
                experience as {
                    input?: {
                        controllers?: unknown[];
                        onControllerAddedObservable?: {
                            add?: (cb: (controller: unknown) => void) => unknown;
                        };
                    };
                } | null
            )?.input;

            if (input == null) {
                return;
            }

            // Wire any controllers already present (e.g. a re-bind mid-session, or
            // controllers connected before the hook was registered).
            const existing = Array.isArray(input.controllers) ? input.controllers : [];
            for (const controller of existing) {
                this._onControllerAdded(controller);
            }

            // Persistent hook: wire controllers added during the session.
            const observable = input.onControllerAddedObservable;
            if (observable != null && typeof observable.add === "function") {
                const observer = observable.add((controller: unknown) => {
                    try {
                        this._onControllerAdded(controller);
                    } catch {
                        // D9: swallow inside the per-event handler.
                    }
                });
                this._controllerAddedObservers.push({ observable, observer });
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Re-run the data-driven binding against the live session so a re-applied
     * `_effectiveMapping` takes effect during an active XR_Session without
     * requiring a session exit (R18.8).
     *
     * The prior per-session binding observers and captured components are torn
     * down first (so no stale handlers or axes captures survive the re-bind),
     * then `bindInputs` is re-run against the stored experience. A no-op when no
     * session is active. Guarded (design D9) so it never throws under mocks.
     *
     * _Requirements: 18.8_
     */
    rebindActiveSession(): void {
        try {
            // Only meaningful during a live session.
            if (!this._inXR) {
                return;
            }

            // Tear down the binding observers/captures from the prior mapping so a
            // re-bind starts clean and never double-fires.
            this._detachBindingObservers();
            this._clearSessionCaptures();

            // Re-run the binder against the live experience with the new mapping.
            this.bindInputs(this._xrExperience);
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Handle a controller-added event: resolve the controller's motion
     * controller and wire the bound handlers for it. When the motion controller
     * is not yet initialized, subscribe to its
     * `onMotionControllerInitObservable` (one-shot) and wire on init; otherwise
     * wire immediately. The init observer is tracked for teardown. Guarded so a
     * mocked/odd-shaped controller never throws (design D9).
     *
     * _Requirements: 18.7, 18.10_
     */
    private _onControllerAdded(controller: unknown): void {
        try {
            if (controller == null) {
                return;
            }

            const c = controller as {
                motionController?: unknown;
                onMotionControllerInitObservable?: {
                    add?: (cb: (mc: unknown) => void) => unknown;
                };
            };

            // Motion controller already present -> wire immediately.
            if (c.motionController != null) {
                this._wireController(controller, c.motionController);
                return;
            }

            // Otherwise wait for the per-source motion-controller-init event.
            const observable = c.onMotionControllerInitObservable;
            if (observable != null && typeof observable.add === "function") {
                const observer = observable.add((mc: unknown) => {
                    try {
                        this._wireController(controller, mc);
                    } catch {
                        // D9: swallow inside the per-event handler.
                    }
                });
                this._motionControllerInitObservers.push({ observable, observer });
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Wire every bound handler for a single controller once its motion
     * controller is initialized (design D7, D11).
     *
     * Resolves the controller's handedness (from the motion controller or the
     * input source), then, for each {@link BindableAction}, looks up its bound
     * {@link BindableInput} in `_effectiveMapping`, resolves the matching
     * `(handedness, componentId)` via `INPUT_RESOLUTION`, and attaches the
     * handler ONLY when the resolved handedness matches this controller. Actions
     * bound to `null` are skipped so nothing is wired and they never fire
     * (R18.10). `Teleport` is retained but never wired to an active handler
     * (design D13).
     *
     * Every hop is guarded (design D9) so a missing component or a mocked
     * controller never throws.
     *
     * _Requirements: 18.7, 18.10_
     */
    private _wireController(controller: unknown, motionController: unknown): void {
        try {
            const handedness = this._resolveHandedness(controller, motionController);
            if (handedness == null) {
                return;
            }

            // Delegate the existing, already-tested per-action binders:
            //  - Jump: left-trigger rising edge -> cc.jump() (task 9.1).
            //  - Right dolly buttons: capture live components for the per-frame
            //    button-dolly sampler (task 11.1).
            this.bindJump(motionController, handedness);
            this.captureRightDollyButtons(motionController, handedness);

            // Axis + press + toggle handlers wired here by walking the mapping.
            this._wireMoveAxes(motionController, handedness);
            this._wireOrbitAxes(motionController, handedness);
            this._wireFastModifier(motionController, handedness);
            this._wireToggle(motionController, handedness, BindableAction.DollyToAvatarToggle);
            this._wireToggle(motionController, handedness, BindableAction.LocomotionModeToggle);
            // Teleport is retained but intentionally never wired (design D13).

            // R13: remember this controller for pointer-ray management and attempt
            // the hide (left) / raise (right) immediately. Because the
            // Pointer_Selection meshes may not exist yet, the per-frame retry seam
            // (`_retryRayManagement`) keeps trying until they do, then latches
            // (R13.3). Guarded so a mocked controller never throws (D9).
            try {
                if (handedness === "left") {
                    this.rememberLeftControllerAndHideRay(controller);
                } else if (handedness === "right") {
                    this._rightControllerForRay = controller;
                    this.retryRaiseRightSelectionRing();
                }
            } catch {
                // D9: swallow.
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Resolve a controller's handedness from the motion controller's
     * `handedness` field (preferred) or the input source's, mapping WebXR's
     * `'left' | 'right' | 'none'` to our {@link Handedness} (`'none'` yields
     * null so no hand-specific binding is attached). Guarded (design D9).
     */
    private _resolveHandedness(controller: unknown, motionController: unknown): Handedness | null {
        try {
            const fromMc = (motionController as { handedness?: string } | null | undefined)?.handedness;
            const fromController = (controller as { inputSource?: { handedness?: string } } | null | undefined)
                ?.inputSource?.handedness;
            const raw = fromMc ?? fromController;
            if (raw === "left" || raw === "right") {
                return raw;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Capture the live thumbstick axes component bound to `Move` for the per-frame
     * left-stick sampler (`_readLeftStickInput`), but only on the controller whose
     * handedness matches the bound input. Skips when `Move` is unbound (R18.10) or
     * the bound input is not a thumbstick-axes input. Guarded (design D9).
     *
     * _Requirements: 18.7, 18.10_
     */
    private _wireMoveAxes(motionController: unknown, handedness: Handedness): void {
        const component = this._resolveAxesComponent(motionController, handedness, BindableAction.Move);
        if (component != null) {
            this._moveAxesComponent = component;
        }
    }

    /**
     * Capture the live thumbstick axes component bound to `CameraOrbit` for the
     * per-frame right-stick sampler (`_readRightStickInput`), only on the matching
     * handedness. Skips when unbound (R18.10) or non-axes. Guarded (design D9).
     *
     * _Requirements: 18.7, 18.10_
     */
    private _wireOrbitAxes(motionController: unknown, handedness: Handedness): void {
        const component = this._resolveAxesComponent(motionController, handedness, BindableAction.CameraOrbit);
        if (component != null) {
            this._orbitAxesComponent = component;
        }
    }

    /**
     * Resolve the live thumbstick component bound to an axis action on the
     * matching controller. Returns the component only when the action is bound to
     * a thumbstick-axes input whose resolved handedness matches this controller,
     * else null (which also covers the unbound/`null` case per R18.10). Guarded
     * (design D9).
     */
    private _resolveAxesComponent(
        motionController: unknown,
        handedness: Handedness,
        action: BindableAction
    ): unknown {
        try {
            const boundInput = this._effectiveMapping?.[action];
            if (boundInput == null) {
                return null;
            }
            const resolution = INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return null;
            }
            // Only capture on the matching hand and only for the thumbstick.
            if (resolution.handedness !== handedness || resolution.componentId !== XR_COMPONENT_THUMBSTICK) {
                return null;
            }
            const mc = motionController as { getComponent?: (id: string) => unknown } | null | undefined;
            return mc?.getComponent?.(resolution.componentId) ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Capture the live thumbstick-press component bound to `FastModifier` on the
     * matching controller and subscribe to its button-state changes so the live
     * `_fastModifierPressed` flag tracks the press. Skips when unbound (R18.10) or
     * when the bound input is not a thumbstick-press. The observer is tracked in
     * the toggle-button stream for teardown. Guarded (design D9).
     *
     * _Requirements: 18.7, 18.10_
     */
    private _wireFastModifier(motionController: unknown, handedness: Handedness): void {
        try {
            const boundInput = this._effectiveMapping?.[BindableAction.FastModifier];
            if (boundInput == null) {
                return;
            }
            const resolution = INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return;
            }
            // FastModifier default is the left thumbstick PRESS (the thumbstick
            // component's pressed state). Only wire on the matching hand + stick.
            if (resolution.handedness !== handedness || resolution.componentId !== XR_COMPONENT_THUMBSTICK) {
                return;
            }

            const mc = motionController as {
                getComponent?: (id: string) => {
                    pressed?: boolean;
                    onButtonStateChangedObservable?: {
                        add?: (cb: (component: { pressed?: boolean }) => void) => unknown;
                    };
                } | null | undefined;
            } | null | undefined;

            const component = mc?.getComponent?.(resolution.componentId);
            this._fastModifierComponent = component ?? null;

            const observable = component?.onButtonStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }

            const observer = observable.add((changed: { pressed?: boolean }) => {
                try {
                    this._fastModifierPressed = changed?.pressed === true;
                } catch {
                    // D9: swallow inside the per-event handler.
                }
            });
            this._toggleObservers.push({ observable, observer });
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Wire a rising-edge face-button toggle action on the matching controller.
     *
     * For `DollyToAvatarToggle` the rising edge invokes `toggleDollyToAvatar()`
     * (R10.4); for `LocomotionModeToggle` it records the requesting controller and
     * invokes `handleToggleRequest()` (R5). Skips when the action is unbound
     * (R18.10). Attaches ONLY when the bound input's resolved handedness matches
     * this controller. The observer is tracked in the toggle-button stream for
     * teardown so enter/exit cycles never accumulate toggle handlers. Guarded
     * (design D9).
     *
     * _Requirements: 18.7, 18.10_
     */
    private _wireToggle(motionController: unknown, handedness: Handedness, action: BindableAction): void {
        try {
            const boundInput = this._effectiveMapping?.[action];
            if (boundInput == null) {
                return;
            }
            const resolution = INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return;
            }
            if (resolution.handedness !== handedness) {
                return;
            }

            const mc = motionController as {
                getComponent?: (id: string) => {
                    onButtonStateChangedObservable?: {
                        add?: (cb: (component: { pressed?: boolean }) => void) => unknown;
                    };
                } | null | undefined;
            } | null | undefined;

            const component = mc?.getComponent?.(resolution.componentId);
            const observable = component?.onButtonStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }

            let wasPressed = false;
            const observer = observable.add((changed: { pressed?: boolean }) => {
                try {
                    const pressed = changed?.pressed === true;
                    if (pressed && !wasPressed) {
                        // Rising edge -> dispatch the toggle action.
                        if (action === BindableAction.DollyToAvatarToggle) {
                            this.toggleDollyToAvatar();
                        } else if (action === BindableAction.LocomotionModeToggle) {
                            this._lastToggleController = motionController;
                            this.handleToggleRequest();
                        }
                    }
                    wasPressed = pressed;
                } catch {
                    // D9: swallow inside the per-event handler.
                }
            });
            this._toggleObservers.push({ observable, observer });
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Handle a locomotion-mode toggle request from the bound A/X face button
     * (R5). This is invoked by the `LocomotionModeToggle` binding (task 14.1),
     * which records the requesting motion controller as `_lastToggleController`
     * before calling in; the toggle is bound to the A/X face button only and
     * never to the trigger (R5.1), and the binding is a per-press rising edge so
     * the control is repeatable within a single session without latching (R5.5).
     *
     * Behavior:
     *  - Derive `canFirstPerson` as the logical negation of No_First_Person
     *    (`!cc.getSettings().noFirstPerson`) through the guarded
     *    `canFirstPerson()` / `_readNoFirstPerson()` seam (R5.2).
     *  - Drive the pure `XRLocomotion.toggle(canFirstPerson)` state machine.
     *  - Reconfigure the camera coupling via `applyLocomotionMode(result.mode)`
     *    ONLY when the toggle reports `changed` (R5.3).
     *  - When the toggle is blocked (a `firstPerson` request refused because
     *    No_First_Person is true), stay in `thirdPerson` and emit best-effort
     *    haptic feedback on the requesting controller via
     *    `emitToggleBlockedFeedback` (R5.4).
     *
     * All access is guarded (design D9) so a mocked controller / missing
     * locomotion result never throws.
     *
     * _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
     */
    handleToggleRequest(): void {
        try {
            // R5.2: Can_First_Person is the negation of No_First_Person.
            const canFirstPerson = this.canFirstPerson();
            const result = this._locomotion.toggle(canFirstPerson);
            if (result == null) {
                return;
            }
            // R5.3: reconfigure the camera coupling only when the mode changed.
            if (result.changed === true) {
                this.applyLocomotionMode(result.mode);
            }
            // R5.4: a blocked toward-firstPerson toggle stays in thirdPerson and
            // provides lightweight best-effort haptic feedback on the requesting
            // controller (recorded by the binder as `_lastToggleController`).
            if (result.blocked === true) {
                this.emitToggleBlockedFeedback(this._lastToggleController);
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Emit lightweight best-effort haptic feedback on the controller that
     * requested a blocked locomotion-mode toggle (R5.4).
     *
     * The motion controller exposes a `pulse(intensity, duration)` method that
     * returns a promise; we request a short pulse (`0.5` intensity, `100` ms) and
     * swallow any rejection from the returned promise, logging it via
     * `console`. The whole thing is guarded (design D9) so a missing/absent
     * `pulse` (unsupported haptics, or a mocked controller) never throws and the
     * toggle still resolves normally. Haptics are strictly advisory - no state
     * depends on the pulse succeeding.
     *
     * The `controller` passed in is the requesting motion controller recorded by
     * the `LocomotionModeToggle` binder; access to `.pulse` is via a guarded
     * shape cast so no additional BabylonJS runtime import is introduced.
     *
     * _Requirements: 5.4_
     */
    emitToggleBlockedFeedback(controller: unknown): void {
        try {
            const haptic = controller as { pulse?: (intensity: number, duration: number) => unknown } | null | undefined;
            if (haptic == null || typeof haptic.pulse !== "function") {
                return;
            }
            const result = haptic.pulse(0.5, 100);
            // Swallow any rejection from the returned promise so an unavailable
            // haptic actuator can't produce an unhandled rejection or crash the
            // toggle (D9). Only wire the catch when the result is thenable.
            const thenable = result as { then?: (onOk: () => void, onErr: (e: unknown) => void) => unknown } | null | undefined;
            if (thenable != null && typeof thenable.then === "function") {
                thenable.then(
                    () => {},
                    (err: unknown) => {
                        try {
                            console.log("XRController: blocked-toggle haptic pulse failed", err);
                        } catch {
                            // D9: swallow.
                        }
                    }
                );
            }
        } catch (err) {
            // D9: never throw - the toggle must still resolve even if pulse is
            // missing or throws synchronously.
            try {
                console.log("XRController: blocked-toggle haptic pulse unavailable", err);
            } catch {
                // D9: swallow.
            }
        }
    }

    /**
     * Detach every binding observer registered by `bindInputs` /
     * `_wireController` (controller-added, per-source motion-controller-init,
     * toggle/press buttons, and trigger jump), then clear their tracking arrays.
     * Each removal is individually guarded so a missing observable/observer never
     * throws (design D9). Shared by `_detachSessionObservers` (session end) and
     * `rebindActiveSession` (mid-session re-bind).
     *
     * _Requirements: 18.8_
     */
    private _detachBindingObservers(): void {
        this._detachObserverStream(this._controllerAddedObservers);
        this._controllerAddedObservers = [];

        this._detachObserverStream(this._motionControllerInitObservers);
        this._motionControllerInitObservers = [];

        this._detachObserverStream(this._toggleObservers);
        this._toggleObservers = [];

        // Trigger (jump) observers share the same teardown contract.
        this._detachTriggerObservers();
    }

    /**
     * Remove every `{ observable, observer }` entry in a tracked stream from the
     * observable it was added to, guarding each removal so a missing
     * observable/observer never throws (design D9). Does not clear the array
     * itself - the caller resets the field so the stream reference stays stable.
     */
    private _detachObserverStream(stream: Array<{ observable: unknown; observer: unknown }>): void {
        try {
            for (const entry of stream) {
                try {
                    const observable = entry?.observable as { remove?: (o: unknown) => void } | null | undefined;
                    if (observable != null && typeof observable.remove === "function" && entry.observer != null) {
                        observable.remove(entry.observer);
                    }
                } catch {
                    // D9: swallow per-observer removal failures.
                }
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Wire the left-trigger rising-edge jump handler for a single motion
     * controller (R8.1-R8.3).
     *
     * This is the `Jump` action's binder in the data-driven binding scheme
     * (design D11, D7): the full `bindInputs` dispatcher (task 14.1) iterates
     * every `BindableAction` on motion-controller init and, for `Jump`, calls
     * this method with the added controller's `motionController` and its
     * `handedness`.
     *
     * Behavior:
     *  - Look up the input bound to `BindableAction.Jump` in the
     *    `_effectiveMapping`. When it is `null` (unbound), attach nothing so no
     *    jump ever fires (R18.10).
     *  - Resolve the bound input to a `(handedness, componentId)` pair via
     *    `INPUT_RESOLUTION`. Attach ONLY when the incoming controller's
     *    handedness matches the bound handedness AND the bound component is the
     *    standard trigger. Because the Default_Mapping binds `Jump` to the LEFT
     *    trigger, the right trigger resolves to a different handedness and is
     *    skipped here - so a right-trigger press never triggers a jump (R8.2).
     *  - Resolve the live trigger component via `getComponent(componentId)` and
     *    subscribe to its `onButtonStateChangedObservable`. Fire `cc.jump()`
     *    exactly once on the rising edge (a `false -> true` transition of the
     *    component's `pressed` state), tracking the previous pressed state so a
     *    held trigger jumps only once (R8.1).
     *  - Record `{ observable, observer }` in the `_triggerObservers` per-stream
     *    array so `_detachSessionObservers` can remove it on session end (R8.3),
     *    ensuring repeated enter/exit cycles never accumulate jump handlers.
     *
     * Every BabylonJS/controller hop is guarded (design D9) so a missing
     * component, a mocked controller, or an absent observable never throws.
     *
     * _Requirements: 8.1, 8.2, 8.3_
     */
    bindJump(motionController: unknown, handedness: Handedness): void {
        try {
            // Look up the input bound to Jump; skip entirely when unbound (R18.10).
            const boundInput = this._effectiveMapping?.[BindableAction.Jump];
            if (boundInput == null) {
                return;
            }

            // Resolve the bound input to (handedness, componentId).
            const resolution = INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return;
            }

            // R8.2: only bind on the controller whose handedness matches the
            // bound input, and only when the bound component is the trigger. The
            // default binds Jump to the LEFT trigger, so a right-hand controller
            // (or a non-trigger component) never wires a jump handler here.
            if (resolution.handedness !== handedness || resolution.componentId !== XR_COMPONENT_TRIGGER) {
                return;
            }

            const mc = motionController as {
                getComponent?: (id: string) => {
                    onButtonStateChangedObservable?: {
                        add?: (cb: (component: { pressed?: boolean }) => void) => unknown;
                    };
                } | null | undefined;
            } | null | undefined;

            const component = mc?.getComponent?.(resolution.componentId);
            const observable = component?.onButtonStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }

            // Rising-edge detector: fire jump() once on false -> true.
            let wasPressed = false;
            const observer = observable.add((changed: { pressed?: boolean }) => {
                try {
                    const pressed = changed?.pressed === true;
                    if (pressed && !wasPressed) {
                        // R8.1: rising edge -> exactly one jump().
                        this._cc.jump?.();
                    }
                    wasPressed = pressed;
                } catch {
                    // D9: swallow inside the per-event handler.
                }
            });

            // Track the observer in its per-stream array for teardown (R8.3).
            this._triggerObservers.push({ observable, observer });
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Detach every trigger-button observer registered by `bindJump`, removing
     * each from the observable it was added to and then clearing the tracking
     * array. Guarded so a missing observable/observer never throws (design D9).
     * Called from `_detachSessionObservers` on session end so repeated
     * enter/exit cycles never accumulate jump handlers (R8.3).
     *
     * _Requirements: 8.3_
     */
    private _detachTriggerObservers(): void {
        try {
            for (const entry of this._triggerObservers) {
                try {
                    const observable = entry?.observable as { remove?: (o: unknown) => void } | null | undefined;
                    if (observable != null && typeof observable.remove === "function" && entry.observer != null) {
                        observable.remove(entry.observer);
                    }
                } catch {
                    // D9: swallow per-observer removal failures.
                }
            }
        } catch {
            // D9: swallow.
        } finally {
            this._triggerObservers = [];
        }
    }

    /**
     * Seam: start the per-frame render observer (stick sampling + camera follow).
     * Task 7.1 wires the stick sampler here; the camera-follow update lands in
     * task 12.1. Delegates to `startStickSampler()` so the render observer is
     * registered exactly once. Guarded so it never throws (D9).
     *
     * _Requirements: 6.1_
     */
    private _startRenderObserver(): void {
        try {
            this.startStickSampler();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Register the per-frame `scene.onBeforeRenderObservable` observer that
     * samples the thumbsticks each frame (R6.1). The observer runs the stick
     * sampler first (movement + camera orbit/dolly), so sampling always runs
     * BEFORE the orientation step and that step sees the same-frame orbit/dolly
     * state (R5.3). It then arbitrates the orientation step three ways, reading
     * the same-frame stick activity (`_anyStickActive()`) so exactly one of the
     * two updates runs per frame (never both):
     *   - not coupled (third person): run the legacy per-frame arc -> XR follow
     *     mirror (`_updateXRCameraFollow`), which travels the XR camera onto the
     *     arc camera pose and reflects right-stick orbit into the headset exactly
     *     as before this feature.
     *   - coupled (first person) AND both sticks idle AND no dolly button held:
     *     run the headset-driven XR -> arc orientation sync
     *     (`_syncArcFromXRCamera`); the headset is the SOURCE and the arc camera
     *     the SINK (first-person look).
     *   - coupled (first person) AND either stick moving OR a dolly button held
     *     (`_dollyActive()`): run the arc -> XR follow (`_updateXRCameraFollow`)
     *     exactly like third person, so left-stick travel moves the XR camera
     *     with the avatar, right-stick orbit takes effect, and — like an active
     *     stick — a held dolly button routes here so the XR camera follows the
     *     dollying arc camera (otherwise the orientation-only sync branch would
     *     freeze the XR camera position during a button-dolly, the dolly-out
     *     "pause") instead of being overwritten by the headset sync.
     * Net: `_syncArcFromXRCamera()` runs only when coupled AND both sticks are
     * idle AND no dolly is held; otherwise `_updateXRCameraFollow()` runs. The
     * headset orientation and the full arc -> XR mirror therefore never conflict
     * in the same frame.
     *
     * The observer reference is retained in `_renderObserver` so
     * `stopStickSampler()` can detach it. If a sampler is already running it is
     * detached first so enter/exit cycles never accumulate observers. Every hop
     * is guarded (design D9) so a missing/mocked scene observable never throws.
     *
     * _Requirements: 6.1_
     */
    startStickSampler(): void {
        try {
            // Detach any prior observer so we never register twice.
            this.stopStickSampler();

            const observable = (
                this._scene as unknown as {
                    onBeforeRenderObservable?: {
                        add?: (cb: () => void) => unknown;
                    };
                } | null
            )?.onBeforeRenderObservable;

            if (observable == null || typeof observable.add !== "function") {
                return;
            }

            this._renderObserver =
                observable.add(() => {
                    // R6.1: sampling runs before the orientation step.
                    this.sampleSticks();
                    // Arbitrate the orientation step. `_anyStickActive()` reads
                    // the same live axes `sampleSticks()` just consumed (via the
                    // guarded read seams), so it reflects this frame's input.
                    if (this._xrFirstPersonCoupled() && !this._anyStickActive() && !this._dollyActive()) {
                        // R5.3 / R1.3: coupled (first person) AND both sticks idle
                        // AND no dolly button held - the orientation coupling flows
                        // XR -> arc. `_syncArcFromXRCamera()` reads the same-frame
                        // headset pose (after `sampleSticks()`) and drives the arc
                        // camera `alpha`/`beta` (first-person look). The full arc ->
                        // XR mirror is intentionally NOT run this frame: it would
                        // fight the headset orientation.
                        this._syncArcFromXRCamera();
                    } else {
                        // Either third person, or first person with a stick
                        // moving OR a dolly button held: run the arc -> XR position
                        // + orientation mirror so the XR camera travels to the arc
                        // pose. In first person this lets left-stick travel move the
                        // camera with the avatar, right-stick orbit take effect, and
                        // a held dolly button move the XR camera with the dollying
                        // arc camera (otherwise the orientation-only sync branch
                        // would freeze the XR camera position during a button-dolly
                        // - the dolly-out "pause") instead of being overwritten by
                        // the headset sync; in third person it behaves exactly as
                        // before this feature.
                        this._updateXRCameraFollow();
                    }
                    // R13.3: retry the pointer-ray hide (left) / raise (right)
                    // each frame until they succeed, then latch (both no-op once
                    // latched).
                    this._retryRayManagement();
                }) ?? null;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Detach the per-frame render observer registered by `startStickSampler()`,
     * if any. Guarded so a missing observable/observer never throws (D9). Always
     * clears `_renderObserver` so a subsequent start re-registers cleanly.
     *
     * _Requirements: 6.1_
     */
    stopStickSampler(): void {
        try {
            const observable = (
                this._scene as unknown as {
                    onBeforeRenderObservable?: {
                        remove?: (o: unknown) => void;
                    };
                } | null
            )?.onBeforeRenderObservable;

            if (observable != null && typeof observable.remove === "function" && this._renderObserver != null) {
                observable.remove(this._renderObserver);
            }
        } catch {
            // D9: swallow.
        } finally {
            this._renderObserver = null;
        }
    }

    /**
     * Per-frame sampler (R6.1). Reads the bound left-stick axes through the
     * guarded `_readLeftStickInput()` seam, maps them to a `MoveIntent` via the
     * pure `mapStickToIntent` (honoring the configured deadzone), and applies
     * the intent with edge-triggering through `applyIntent`. It then runs the
     * camera orbit and button-dolly seams (implemented in tasks 9-10; stubbed
     * no-ops here).
     *
     * Every step is guarded (design D9) so a missing/mocked scene, camera, or
     * controller never throws inside the render loop.
     *
     * _Requirements: 6.1_
     */
    sampleSticks(): void {
        try {
            const left = this._readLeftStickInput();
            const intent = mapStickToIntent(left, this._stickDeadzone);
            // R7.1: the left-stick pressed state selects the Fast_Movement variants.
            const fast = this._readFastModifier();
            this.applyIntent(intent, fast);

            // R9: right-stick axes feed the camera orbit. Button dolly is
            // implemented in task 11 (stubbed no-op for now).
            const right = this._readRightStickInput();
            this.applyCameraOrbit(right.leftX, right.leftY);
            this._applyButtonDolly();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Apply a decoded `MoveIntent` (plus the fast-modifier flag) to the
     * CharacterController with edge-triggering (R6.6, design D3): a movement
     * method is invoked ONLY on the frame a direction's active state changes
     * (false->true or true->false), never every frame it stays held. The new
     * intent + fast flag are stored as the last-applied state for the next
     * frame's diff.
     *
     * Guarded (design D9) so a mocked controller never throws.
     *
     * _Requirements: 6.6_
     */
    applyIntent(intent: MoveIntent, fast: boolean): void {
        try {
            const prev = (this._lastIntent as MoveIntent | null) ?? neutralMoveIntent();
            const prevFast = this._lastFast === true;

            this.applyMovementDirection(prev, prevFast, intent, fast);

            // Store the applied state so the next frame diffs against it.
            this._lastIntent = {
                walk: intent.walk === true,
                walkBack: intent.walkBack === true,
                strafeLeft: intent.strafeLeft === true,
                strafeRight: intent.strafeRight === true,
            };
            this._lastFast = fast === true;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Emit the minimal on/off CharacterController movement calls needed to move
     * from the previous intent to the next (R6.6, R7.1-R7.3). Each direction has
     * two speed "channels" - a normal variant (`walk`, `walkBack`, `strafeLeft`,
     * `strafeRight`) and a Fast_Movement variant (`run`, `walkBackFast`,
     * `strafeLeftFast`, `strafeRightFast`) - selected by the fast-modifier flag
     * (`fast` = left-stick pressed).
     *
     * For each direction the effective per-channel active state is:
     *  - normal channel active  <=> direction active AND NOT fast
     *  - fast channel   active  <=> direction active AND fast
     * These two are mutually exclusive by construction, so edge-triggering each
     * channel independently (call `true` only on false->true, `false` only on
     * true->false) yields exactly the required behavior:
     *  - R7.1: while pressed and a direction is active, the Fast_Movement variant
     *    matching that direction is driven (`run`/`walkBackFast`/`strafeLeftFast`/
     *    `strafeRightFast`).
     *  - R7.2: releasing the press while a direction stays active switches that
     *    direction from its fast variant back to its normal variant.
     *  - R7.3: on a Fast_Movement state change for an active direction the
     *    previous-speed method is stopped (`false`) and the new-speed method is
     *    started (`true`), so both speeds are never active at once. A direction
     *    (channel) whose active state is unchanged between frames produces no
     *    call.
     *
     * NOTE on the CharacterController contract: each movement method calls
     * `_act.reset()` first, clearing all direction flags before setting its own.
     * Because `mapStickToIntent` guarantees at most one direction is active at a
     * time, driving each changed channel independently is safe.
     *
     * Every CC call is individually guarded (design D9).
     *
     * _Requirements: 6.6, 7.1, 7.2, 7.3_
     */
    applyMovementDirection(prev: MoveIntent, prevFast: boolean, next: MoveIntent, nextFast: boolean): void {
        // Forward (walk / run).
        this._edgeCall(prev.walk === true && !prevFast, next.walk === true && !nextFast, (b) => this._cc.walk?.(b));
        this._edgeCall(prev.walk === true && prevFast, next.walk === true && nextFast, (b) => this._cc.run?.(b));

        // Backward (walkBack / walkBackFast).
        this._edgeCall(
            prev.walkBack === true && !prevFast,
            next.walkBack === true && !nextFast,
            (b) => this._cc.walkBack?.(b)
        );
        this._edgeCall(
            prev.walkBack === true && prevFast,
            next.walkBack === true && nextFast,
            (b) => this._cc.walkBackFast?.(b)
        );

        // Strafe left (strafeLeft / strafeLeftFast).
        this._edgeCall(
            prev.strafeLeft === true && !prevFast,
            next.strafeLeft === true && !nextFast,
            (b) => this._cc.strafeLeft?.(b)
        );
        this._edgeCall(
            prev.strafeLeft === true && prevFast,
            next.strafeLeft === true && nextFast,
            (b) => this._cc.strafeLeftFast?.(b)
        );

        // Strafe right (strafeRight / strafeRightFast).
        this._edgeCall(
            prev.strafeRight === true && !prevFast,
            next.strafeRight === true && !nextFast,
            (b) => this._cc.strafeRight?.(b)
        );
        this._edgeCall(
            prev.strafeRight === true && prevFast,
            next.strafeRight === true && nextFast,
            (b) => this._cc.strafeRightFast?.(b)
        );
    }

    /**
     * Invoke `call(next)` only when the boolean active-state changed between
     * frames (edge trigger); no call when it is unchanged. Each invocation is
     * guarded so a missing/mocked CC method never throws (design D9).
     */
    private _edgeCall(prev: boolean, next: boolean, call: (b: boolean) => void): void {
        if (prev === next) {
            return;
        }
        try {
            call(next);
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Push a neutral (all-false) movement intent so the Avatar is not left
     * moving when a session ends (R6.7). Runs through the same edge-triggered
     * `applyIntent` path so any currently-active direction receives its `false`
     * call exactly once. Guarded (design D9).
     *
     * _Requirements: 6.7_
     */
    stopAllMovement(): void {
        try {
            this.applyIntent(neutralMoveIntent(), false);
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Set the left-stick deadzone used by `mapStickToIntent`, clamped to the
     * `[0, 1]` range; the documented default is `0.15` (R6.8). A non-finite
     * value leaves the current deadzone unchanged. Guarded (design D9).
     *
     * _Requirements: 6.8_
     */
    setStickDeadzone(v: number): void {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._stickDeadzone = v < 0 ? 0 : v > 1 ? 1 : v;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Set the right-stick orbit alpha (horizontal) sensitivity rate, clamped to
     * `[0, MAX_ORBIT_RATE]` (`0..0.02`); the documented default is `0.0075`. A
     * non-finite value leaves the current rate unchanged (R12.4). Consumed by
     * `applyCameraOrbit` (`alpha += alphaRate * rightX`). Guarded (design D9).
     *
     * _Requirements: 12.2, 12.4_
     */
    setAlphaRate(v: number): void {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._alphaRate = v < 0 ? 0 : v > MAX_ORBIT_RATE ? MAX_ORBIT_RATE : v;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Set the right-stick orbit beta (vertical) sensitivity rate, clamped to
     * `[0, MAX_ORBIT_RATE]` (`0..0.02`); the documented default is `0.003`. A
     * non-finite value leaves the current rate unchanged (R12.4). Consumed by
     * `applyCameraOrbit` (`beta += betaRate * rightY`). Guarded (design D9).
     *
     * _Requirements: 12.2, 12.4_
     */
    setBetaRate(v: number): void {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._betaRate = v < 0 ? 0 : v > MAX_ORBIT_RATE ? MAX_ORBIT_RATE : v;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Set the button-dolly radius sensitivity rate, clamped to
     * `[0, MAX_RADIUS_RATE]` (`0..0.2`); the documented default is `0.05`. A
     * non-finite value leaves the current rate unchanged (R12.4). Consumed by
     * `applyButtonDolly` (`radius -/+= radiusRate` while held). Guarded (D9).
     *
     * _Requirements: 12.3, 12.4_
     */
    setRadiusRate(v: number): void {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._radiusRate = v < 0 ? 0 : v > MAX_RADIUS_RATE ? MAX_RADIUS_RATE : v;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Seam: push a neutral movement intent so the Avatar is not left moving when
     * a session ends. The full implementation lands in task 7.1; this guarded
     * stub never throws (D9).
     *
     * _Requirements: 6.7_
     */
    private _stopAllMovement(): void {
        try {
            // R6.7: push a neutral intent through the edge-triggered path so any
            // active direction gets its single `false` call, then clear the
            // last-applied tracking state.
            this.stopAllMovement();
            this._lastIntent = null;
            this._lastFast = false;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Seam: read the bound left-thumbstick axes for movement sampling. The full
     * data-driven binding (resolving the bound component from
     * `_effectiveMapping` on the correct controller by handedness) lands in task
     * 14.1; until then this returns a neutral `(0, 0)` input so the sampler runs
     * safely under mocks and before real bindings exist. Guarded so a missing
     * component/axes never throws (design D9).
     *
     * _Requirements: 6.1_
     */
    private _readLeftStickInput(): StickInput {
        return this._readAxesComponent(this._moveAxesComponent);
    }

    /**
     * Read a captured thumbstick component's live `axes` value into a
     * `StickInput`, guarding every hop so a null capture, a mocked component, or
     * an odd-shaped `axes` yields a neutral `(0, 0)` rather than throwing (design
     * D9). WebXR thumbstick axes expose `.axes.x` / `.axes.y`.
     */
    private _readAxesComponent(component: unknown): StickInput {
        try {
            const axes = (component as { axes?: { x?: number; y?: number } } | null | undefined)?.axes;
            const x = typeof axes?.x === "number" && isFinite(axes.x) ? axes.x : 0;
            const y = typeof axes?.y === "number" && isFinite(axes.y) ? axes.y : 0;
            return { leftX: x, leftY: y };
        } catch {
            return { leftX: 0, leftY: 0 };
        }
    }

    /**
     * Seam: read the bound right-thumbstick axes for camera orbit. Returns a
     * neutral `(0, 0)` input until the data-driven binding lands in task 14.1.
     * Guarded (design D9). Uses the `StickInput` shape for convenience
     * (`leftX`/`leftY` carry the right-stick X/Y here).
     *
     * _Requirements: 6.1_
     */
    private _readRightStickInput(): StickInput {
        return this._readAxesComponent(this._orbitAxesComponent);
    }

    /**
     * Report whether EITHER thumbstick is active this frame, using the SAME
     * deadzone the sampler applies (`_stickDeadzone`). A stick is active when the
     * magnitude of its raw axes exceeds the deadzone
     * (`Math.hypot(x, y) > _stickDeadzone`). Reads the live axes through the
     * guarded `_readLeftStickInput()` / `_readRightStickInput()` seams (whose
     * `leftX`/`leftY` carry each stick's X/Y), so it reflects the same-frame
     * input the sampler just consumed.
     *
     * The per-frame render observer uses this to arbitrate the first-person
     * orientation source: while coupled, both sticks idle -> the headset drives
     * the arc (`_syncArcFromXRCamera`); either stick moving -> the arc drives the
     * XR camera (`_updateXRCameraFollow`) so left-stick travel and right-stick
     * orbit both take effect. Guarded (design D9): any throw yields "not active".
     */
    private _anyStickActive(): boolean {
        try {
            const dz = this._stickDeadzone;
            const dz2 = dz * dz;
            const left = this._readLeftStickInput();
            if (left.leftX * left.leftX + left.leftY * left.leftY > dz2) {
                return true;
            }
            const right = this._readRightStickInput();
            if (right.leftX * right.leftX + right.leftY * right.leftY > dz2) {
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * True while either dolly button (dolly-in / dolly-out) is held. A held dolly
     * is a camera-radius change that must route the per-frame arbitration to the
     * arc->XR follow (`_updateXRCameraFollow`) so the XR camera travels with the
     * dollying arc camera — WITHOUT this, a first-person button-dolly would take
     * the orientation-only sync branch and the XR camera position would not follow
     * (the dolly-out "pause"). Reuses the same `_isComponentPressed` check that
     * `_applyButtonDolly` uses. Guarded (design D9): any throw yields false.
     */
    private _dollyActive(): boolean {
        try {
            return this._isComponentPressed(this._dollyInComponent) || this._isComponentPressed(this._dollyOutComponent);
        } catch {
            return false;
        }
    }

    /**
     * Read the bound fast-modifier (left-stick pressed) state that selects the
     * Fast_Movement variants (R7.1). Returns the live `_fastModifierPressed`
     * flag, which the data-driven FastModifier binding keeps current (the
     * binding that sets it from the left-thumbstick pressed component lands in
     * task 14.1; until then it stays `false`, so only the normal-speed variants
     * are driven). Guarded (design D9).
     *
     * _Requirements: 6.1, 7.1_
     */
    private _readFastModifier(): boolean {
        try {
            return this._fastModifierPressed === true;
        } catch {
            return false;
        }
    }

    /**
     * Apply right-stick Camera_Orbit to the Follow_Camera (the owned
     * `ArcRotateCamera`), orbiting it around the avatar WITHOUT rotating the
     * avatar itself (R9.4).
     *
     * Behavior (R9.1-R9.4):
     *  - Dominant_Axis_Gating (R9.3): only one of `alpha` or `beta` changes per
     *    frame. The axis with the larger RAW magnitude wins; ties resolve to
     *    `alpha` (`|rightX| >= |rightY|` -> alpha). This matches the pure
     *    left-stick mapper's dominant-axis convention.
     *  - The winning axis is gated by the Stick_Deadzone (`_stickDeadzone`): if
     *    its raw magnitude is within the deadzone, nothing changes this frame.
     *  - Alpha branch (R9.1): `alpha += alphaRate * rightX` (scaled by the raw,
     *    still-signed axis value).
     *  - Beta branch (R9.2): `beta += betaRate * rightY`, i.e. forward
     *    (`rightY < 0`) DECREASES beta and back (`rightY > 0`) increases it,
     *    then `clampBeta()` keeps beta within the camera's limits / the
     *    pole-avoiding fallback.
     *  - After a change, mark the arc camera dirty (`computeWorldMatrix(true)`)
     *    so the position the follow copy reads is rebuilt (the follow update /
     *    button dolly rely on this; here we rebuild whenever orbit changed the
     *    camera). No rebuild when neither axis moved.
     *
     * Every camera hop is guarded (design D9) so a missing/mocked/odd-shaped
     * camera never throws inside the per-frame sampler. The avatar is never
     * touched (R9.4): only `ArcRotateCamera.alpha`/`beta` are mutated.
     *
     * _Requirements: 9.1, 9.2, 9.3, 9.4_
     */
    applyCameraOrbit(rightX: number, rightY: number): void {
        try {
            const arc = this._camera as unknown as {
                alpha?: number;
                beta?: number;
                computeWorldMatrix?: (force?: boolean) => unknown;
            } | null;
            if (arc == null) {
                return;
            }

            const x = typeof rightX === "number" && isFinite(rightX) ? rightX : 0;
            const y = typeof rightY === "number" && isFinite(rightY) ? rightY : 0;
            const dz = this._stickDeadzone;

            // R9.3: dominant axis by raw magnitude; ties (|x| >= |y|) -> alpha.
            const alphaWins = Math.abs(x) >= Math.abs(y);

            let changed = false;

            if (alphaWins) {
                // R9.1: alpha branch, gated by the deadzone on the raw X value.
                if (Math.abs(x) > dz && typeof arc.alpha === "number") {
                    arc.alpha += this._alphaRate * x;
                    changed = true;
                }
            } else {
                // R9.2: beta branch, gated by the deadzone on the raw Y value.
                if (Math.abs(y) > dz && typeof arc.beta === "number") {
                    arc.beta += this._betaRate * y;
                    this.clampBeta();
                    changed = true;
                }
            }

            // Mark the arc camera dirty so its world matrix (and the position the
            // follow copy reads) is rebuilt only when orbit actually changed it.
            if (changed && typeof arc.computeWorldMatrix === "function") {
                arc.computeWorldMatrix(true);
            }
        } catch {
            // D9: swallow - never throw across the XR boundary.
        }
    }

    /**
     * Clamp the Follow_Camera's `beta` within its configured limits (R9.2).
     *
     * When the `ArcRotateCamera` exposes numeric `lowerBetaLimit` /
     * `upperBetaLimit`, beta is clamped to each present bound. When a limit is
     * absent (null/non-numeric), a pole-avoiding fallback range of
     * `BETA_MIN_FALLBACK (0.05) .. BETA_MAX_FALLBACK (π − 0.05)` is used for
     * that bound, so beta never reaches the exact gimbal singularity at the
     * poles.
     *
     * Guarded (design D9) so a missing/odd-shaped camera never throws.
     *
     * _Requirements: 9.2_
     */
    clampBeta(): void {
        try {
            const arc = this._camera as unknown as {
                beta?: number;
                lowerBetaLimit?: number | null;
                upperBetaLimit?: number | null;
            } | null;
            if (arc == null || typeof arc.beta !== "number") {
                return;
            }

            const lower =
                typeof arc.lowerBetaLimit === "number" && isFinite(arc.lowerBetaLimit)
                    ? arc.lowerBetaLimit
                    : BETA_MIN_FALLBACK;
            const upper =
                typeof arc.upperBetaLimit === "number" && isFinite(arc.upperBetaLimit)
                    ? arc.upperBetaLimit
                    : BETA_MAX_FALLBACK;

            if (arc.beta < lower) {
                arc.beta = lower;
            } else if (arc.beta > upper) {
                arc.beta = upper;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Apply held-button camera dolly to the Follow_Camera (the owned
     * `ArcRotateCamera`), moving it toward/away from the avatar WITHOUT rotating
     * the avatar.
     *
     * Behavior (R10.1-R10.3):
     *  - Dolly-in (right B, `CameraDollyIn` -> `RightBButton`) held: `radius -=
     *    radiusRate` this frame (R10.1). The held state comes from the captured
     *    `_dollyInComponent`'s live `.pressed` flag (captured on the right
     *    controller by handedness in `captureRightDollyButtons`).
     *  - Dolly-out (right A, `CameraDollyOut` -> `RightAButton`) held: `radius +=
     *    radiusRate` this frame (R10.2).
     *  - After a change, clamp `radius` to `lowerRadiusLimit` / `upperRadiusLimit`
     *    ONLY for whichever bound is present (numeric + finite) on the camera
     *    (R10.3).
     *  - Rebuild the arc camera's world matrix (`computeWorldMatrix(true)`) ONLY
     *    when the radius actually changed this frame, mirroring the dirty-mark
     *    convention of `applyCameraOrbit` (orbit already rebuilds when it
     *    changes; the dolly rebuilds when it changes the radius).
     *
     * Every camera/component hop is guarded (design D9) so a missing/mocked
     * component or odd-shaped camera never throws inside the per-frame sampler.
     * The avatar is never touched: only `ArcRotateCamera.radius` is mutated.
     *
     * _Requirements: 10.1, 10.2, 10.3_
     */
    private _applyButtonDolly(): void {
        try {
            const arc = this._camera as unknown as {
                radius?: number;
                lowerRadiusLimit?: number | null;
                upperRadiusLimit?: number | null;
                computeWorldMatrix?: (force?: boolean) => unknown;
            } | null;
            if (arc == null || typeof arc.radius !== "number") {
                return;
            }

            const dollyInHeld = this._isComponentPressed(this._dollyInComponent);
            const dollyOutHeld = this._isComponentPressed(this._dollyOutComponent);

            let changed = false;

            // R10.1: dolly-in (right B) held decreases the radius each frame.
            if (dollyInHeld) {
                arc.radius -= this._radiusRate;
                changed = true;
            }
            // R10.2: dolly-out (right A) held increases the radius each frame.
            if (dollyOutHeld) {
                arc.radius += this._radiusRate;
                changed = true;
            }

            if (changed) {
                // R10.3: clamp only to whichever bound is present on the camera.
                if (
                    typeof arc.lowerRadiusLimit === "number" &&
                    isFinite(arc.lowerRadiusLimit) &&
                    arc.radius < arc.lowerRadiusLimit
                ) {
                    arc.radius = arc.lowerRadiusLimit;
                }
                if (
                    typeof arc.upperRadiusLimit === "number" &&
                    isFinite(arc.upperRadiusLimit) &&
                    arc.radius > arc.upperRadiusLimit
                ) {
                    arc.radius = arc.upperRadiusLimit;
                }

                // Rebuild the world matrix only when the dolly changed the radius,
                // mirroring the orbit dirty-mark convention.
                if (typeof arc.computeWorldMatrix === "function") {
                    arc.computeWorldMatrix(true);
                }
            }
        } catch {
            // D9: swallow - never throw across the XR boundary.
        }
    }

    /**
     * Read a captured button component's live pressed state, guarding every hop
     * so a null capture, a mocked component, or an odd-shaped component yields
     * `false` rather than throwing (design D9).
     */
    private _isComponentPressed(component: unknown): boolean {
        try {
            return (component as { pressed?: boolean } | null | undefined)?.pressed === true;
        } catch {
            return false;
        }
    }

    /**
     * Toggle the dolly-to-avatar snap on the left-X rising edge
     * (`DollyToAvatarToggle` -> `LeftXButton`) (R10.4).
     *
     * Behavior:
     *  - When not currently dollied-to-avatar: remember the prior `radius`, then
     *    snap `radius` to the camera's `lowerRadiusLimit` (when present +
     *    numeric + finite) or `0` when no limit is present, and mark
     *    dollied-to-avatar.
     *  - When currently dollied-to-avatar: restore the remembered `radius` and
     *    clear the dollied-to-avatar state.
     * A round-trip (toggle on then off) therefore returns `radius` to its
     * original value.
     *
     * The rising-edge detection wiring (the left-X button observer) is the
     * data-driven binder's concern (task 14.1); this method performs only the
     * toggle action and is safe to call directly. Every camera hop is guarded
     * (design D9) so a missing/odd-shaped camera never throws.
     *
     * _Requirements: 10.4_
     */
    toggleDollyToAvatar(): void {
        try {
            const arc = this._camera as unknown as {
                radius?: number;
                lowerRadiusLimit?: number | null;
            } | null;
            if (arc == null || typeof arc.radius !== "number") {
                return;
            }

            if (!this._dollyToAvatarActive) {
                // Remember the current radius, then snap to the lower limit (or 0).
                this._dollyToAvatarPriorRadius = arc.radius;
                const lower =
                    typeof arc.lowerRadiusLimit === "number" && isFinite(arc.lowerRadiusLimit)
                        ? arc.lowerRadiusLimit
                        : 0;
                arc.radius = lower;
                this._dollyToAvatarActive = true;
            } else {
                // Restore the remembered radius and clear the snap state.
                arc.radius = this._dollyToAvatarPriorRadius;
                this._dollyToAvatarActive = false;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Capture the live right-hand dolly button components (CameraDollyIn /
     * CameraDollyOut) on the right controller only, resolving each bound input
     * through `_effectiveMapping` + `INPUT_RESOLUTION` +
     * `motionController.getComponent(componentId)` and storing the component
     * references for the per-frame `_applyButtonDolly` to read (R10.5).
     *
     * Behavior:
     *  - No-op unless `handedness === 'right'`, so the dolly buttons are captured
     *    only on the right controller (R10.5).
     *  - For each of `CameraDollyIn` / `CameraDollyOut`, look up its bound input
     *    in `_effectiveMapping`; skip when unbound (`null`). Resolve the input to
     *    a `(handedness, componentId)` pair via `INPUT_RESOLUTION` and capture
     *    the component ONLY when the bound handedness is `right` and the
     *    resolved component is a face button (A/B button), matching the default
     *    RightBButton / RightAButton bindings.
     *  - Store the resolved live component in `_dollyInComponent` /
     *    `_dollyOutComponent`.
     *
     * This mirrors the data-driven resolution style of `bindJump` (task 9.1) and
     * is intended to be called from the motion-controller-init binder (task
     * 14.1). Every hop is guarded (design D9) so a mocked controller, a missing
     * component, or an absent binding never throws.
     *
     * _Requirements: 10.5_
     */
    captureRightDollyButtons(motionController: unknown, handedness: Handedness): void {
        try {
            // R10.5: capture the dolly buttons only on the right controller.
            if (handedness !== "right") {
                return;
            }

            const mc = motionController as {
                getComponent?: (id: string) => unknown;
            } | null | undefined;
            if (mc == null || typeof mc.getComponent !== "function") {
                return;
            }

            this._dollyInComponent = this._resolveRightDollyComponent(mc, BindableAction.CameraDollyIn);
            this._dollyOutComponent = this._resolveRightDollyComponent(mc, BindableAction.CameraDollyOut);
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Resolve the live right-hand face-button component bound to `action`
     * (CameraDollyIn / CameraDollyOut) from a right controller's
     * `motionController`. Returns the component when the action is bound to a
     * right-hand A/B button and the component resolves, else `null`. Guarded so
     * a missing/mocked component never throws (design D9).
     *
     * _Requirements: 10.5_
     */
    private _resolveRightDollyComponent(
        mc: { getComponent?: (id: string) => unknown },
        action: BindableAction
    ): unknown {
        try {
            const boundInput = this._effectiveMapping?.[action];
            // Skip unbound (null) actions.
            if (boundInput == null) {
                return null;
            }

            const resolution = INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return null;
            }

            // Only capture when the bound input resolves to a right-hand face
            // button (A/B button); skip anything else.
            if (
                resolution.handedness !== "right" ||
                (resolution.componentId !== XR_COMPONENT_A_BUTTON &&
                    resolution.componentId !== XR_COMPONENT_B_BUTTON)
            ) {
                return null;
            }

            return mc.getComponent?.(resolution.componentId) ?? null;
        } catch {
            return null;
        }
    }

    // --- Controller ray management (R13) ---

    /**
     * Per-frame retry seam for pointer-ray management (R13.3), invoked from the
     * render observer after `sampleSticks()` / `_syncArcFromXRCamera()`.
     *
     * The Pointer_Selection meshes may be created asynchronously after a
     * controller is added, so the left-ray hide and the right-ring raise are
     * retried each frame until they succeed, then latched (R13.3). Both calls are
     * no-ops once their latch is set, so this is cheap to run every frame.
     * Guarded (design D9) so it never throws inside the render loop.
     *
     * _Requirements: 13.3_
     */
    private _retryRayManagement(): void {
        try {
            this.retryHideLeftControllerRay();
            this.retryRaiseRightSelectionRing();
        } catch {
            // D9: swallow - never throw across the XR boundary.
        }
    }

    /**
     * Resolve the WebXR Pointer_Selection feature (R13). Prefers the features
     * manager's `getEnabledFeature(POINTER_SELECTION_FEATURE_NAME)` and falls
     * back to `experience.pointerSelection`. Every hop is try/catch-guarded
     * because the private feature shape differs across mocks and BabylonJS
     * versions (design D9); returns `null` on any failure.
     *
     * _Requirements: 13.1, 13.2_
     */
    private _resolvePointerSelection(): unknown {
        try {
            const exp = this._xrExperience as {
                baseExperience?: {
                    featuresManager?: { getEnabledFeature?: (name: string) => unknown };
                };
                pointerSelection?: unknown;
            } | null;
            if (exp == null) {
                return null;
            }

            const fm = exp.baseExperience?.featuresManager;
            if (fm != null && typeof fm.getEnabledFeature === "function") {
                try {
                    const feature = fm.getEnabledFeature(POINTER_SELECTION_FEATURE_NAME);
                    if (feature != null) {
                        return feature;
                    }
                } catch {
                    // D9: fall through to the fallback below.
                }
            }

            // Fallback: some experiences expose the feature directly.
            return exp.pointerSelection ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Look up a controller's entry in the pointer-selection feature's private
     * `_controllers` map (R13). First tries the controller's `uniqueId` as the
     * map key, then falls back to scanning the map's values for an entry whose
     * `.xrController` matches the given controller. The resolved entry is
     * expected to expose the ray/ring meshes (`selectionMesh` / `laserPointer`).
     *
     * The private-map shape differs across mocks and BabylonJS versions, so
     * every hop is try/catch-guarded (design D9); returns `null` when the
     * feature/map/entry cannot be resolved.
     *
     * _Requirements: 13.1, 13.2_
     */
    private _findControllerEntry(feature: unknown, controller: unknown): unknown {
        try {
            if (feature == null || controller == null) {
                return null;
            }

            const controllersMap = (feature as { _controllers?: Record<string, unknown> } | null | undefined)
                ?._controllers;
            if (controllersMap == null || typeof controllersMap !== "object") {
                return null;
            }

            // Preferred: key by the controller's uniqueId.
            const uniqueId = (controller as { uniqueId?: unknown } | null | undefined)?.uniqueId;
            if (uniqueId != null) {
                const byKey = (controllersMap as Record<string, unknown>)[String(uniqueId)];
                if (byKey != null) {
                    return byKey;
                }
            }

            // Fallback: scan the map's values for the entry whose xrController
            // matches this controller.
            for (const key of Object.keys(controllersMap)) {
                const entry = (controllersMap as Record<string, unknown>)[key];
                const xrController = (entry as { xrController?: unknown } | null | undefined)?.xrController;
                if (xrController != null && xrController === controller) {
                    return entry;
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Read the ray/ring mesh-like fields from a resolved controller entry,
     * returning whichever of `selectionMesh` / `laserPointer` are present. The
     * entry may expose either or both; missing fields are simply omitted. Guarded
     * (design D9).
     *
     * _Requirements: 13.1, 13.2_
     */
    private _entryMeshes(entry: unknown): unknown[] {
        const meshes: unknown[] = [];
        try {
            const e = entry as { selectionMesh?: unknown; laserPointer?: unknown } | null | undefined;
            if (e == null) {
                return meshes;
            }
            if (e.selectionMesh != null) {
                meshes.push(e.selectionMesh);
            }
            if (e.laserPointer != null) {
                meshes.push(e.laserPointer);
            }
        } catch {
            // D9: swallow.
        }
        return meshes;
    }

    /**
     * Remember the LEFT controller whose Pointer_Selection ray/ring are to be
     * hidden (R13.1) and attempt the hide immediately. Because the meshes may be
     * created asynchronously, the immediate attempt may find nothing yet - the
     * per-frame `retryHideLeftControllerRay` keeps retrying until it succeeds,
     * then latches (R13.3). Guarded (design D9).
     *
     * _Requirements: 13.1, 13.3_
     */
    rememberLeftControllerAndHideRay(controller: unknown): void {
        try {
            this._leftControllerForRay = controller;
            this.retryHideLeftControllerRay();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Retry hiding the LEFT controller's Pointer_Selection ray + ring until it
     * succeeds, then latch (R13.1, R13.3). A no-op once `_leftRayHidden` is
     * `true`. Calls `hideLeftControllerRay()` and latches only when it reports
     * the meshes were found and hidden. Guarded (design D9).
     *
     * _Requirements: 13.1, 13.3_
     */
    retryHideLeftControllerRay(): void {
        try {
            if (this._leftRayHidden === true) {
                return;
            }
            if (this.hideLeftControllerRay()) {
                this._leftRayHidden = true;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Hide the LEFT controller's Pointer_Selection laser ray and selection ring
     * because the left trigger is bound to jump (R13.1): sets each resolved mesh
     * `isVisible = false` and calls `setEnabled(false)`.
     *
     * Returns `true` only when the expected meshes were found and hidden (so the
     * caller can latch and stop retrying); returns `false` when the async meshes
     * do not exist yet, so the per-frame retry tries again next frame (R13.3).
     * Every private-map/mesh hop is try/catch-guarded (design D9).
     *
     * _Requirements: 13.1, 13.3_
     */
    hideLeftControllerRay(): boolean {
        try {
            const controller = this._leftControllerForRay;
            if (controller == null) {
                return false;
            }
            const feature = this._resolvePointerSelection();
            if (feature == null) {
                return false;
            }
            const entry = this._findControllerEntry(feature, controller);
            if (entry == null) {
                return false;
            }
            const meshes = this._entryMeshes(entry);
            if (meshes.length === 0) {
                // The Pointer_Selection meshes are not created yet - retry later.
                return false;
            }

            let hidAny = false;
            for (const mesh of meshes) {
                if (this._hideMesh(mesh)) {
                    hidAny = true;
                }
            }
            // Latch only when at least one mesh was actually hidden.
            return hidAny;
        } catch {
            return false;
        }
    }

    /**
     * Hide a single ray/ring mesh: set `isVisible = false` and call
     * `setEnabled(false)` when present. Returns `true` when the mesh exposed at
     * least one of those and it was applied. Guarded (design D9).
     */
    private _hideMesh(mesh: unknown): boolean {
        try {
            const m = mesh as { isVisible?: boolean; setEnabled?: (v: boolean) => unknown } | null | undefined;
            if (m == null) {
                return false;
            }
            let applied = false;
            if ("isVisible" in m) {
                m.isVisible = false;
                applied = true;
            }
            if (typeof m.setEnabled === "function") {
                m.setEnabled(false);
                applied = true;
            }
            return applied;
        } catch {
            return false;
        }
    }

    /**
     * Retry raising the RIGHT controller's Pointer_Selection ring + laser
     * rendering group until it succeeds, then latch (R13.2, R13.3). A no-op once
     * `_rightRingRaised` is `true`. Calls `raiseRightSelectionRingRenderingGroup()`
     * and latches only when it reports the meshes were present and raised.
     * Guarded (design D9).
     *
     * _Requirements: 13.2, 13.3_
     */
    retryRaiseRightSelectionRing(): void {
        try {
            if (this._rightRingRaised === true) {
                return;
            }
            if (this.raiseRightSelectionRingRenderingGroup()) {
                this._rightRingRaised = true;
            }
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Raise the RIGHT controller's Pointer_Selection ring and laser above other
     * geometry's rendering group so they remain visible (R13.2): sets each
     * resolved mesh's `renderingGroupId = RIGHT_RAY_RENDERING_GROUP`.
     *
     * Returns `true` when the expected meshes were present and raised (so the
     * caller can latch); returns `false` when the async meshes do not exist yet,
     * so the per-frame retry tries again next frame (R13.3). Also remembers the
     * right controller (`_rightControllerForRay`) when not already set. Every
     * private-map/mesh hop is try/catch-guarded (design D9).
     *
     * _Requirements: 13.2, 13.3_
     */
    raiseRightSelectionRingRenderingGroup(): boolean {
        try {
            const controller = this._rightControllerForRay;
            if (controller == null) {
                return false;
            }
            const feature = this._resolvePointerSelection();
            if (feature == null) {
                return false;
            }
            const entry = this._findControllerEntry(feature, controller);
            if (entry == null) {
                return false;
            }
            const meshes = this._entryMeshes(entry);
            if (meshes.length === 0) {
                // The Pointer_Selection meshes are not created yet - retry later.
                return false;
            }

            let raisedAny = false;
            for (const mesh of meshes) {
                if (this._raiseMesh(mesh)) {
                    raisedAny = true;
                }
            }
            return raisedAny;
        } catch {
            return false;
        }
    }

    /**
     * Raise a single ray/ring mesh above other geometry by setting its
     * `renderingGroupId` to `RIGHT_RAY_RENDERING_GROUP`. Returns `true` when the
     * mesh exposed a `renderingGroupId` and it was applied. Guarded (design D9).
     */
    private _raiseMesh(mesh: unknown): boolean {
        try {
            const m = mesh as { renderingGroupId?: number } | null | undefined;
            if (m == null) {
                return false;
            }
            if ("renderingGroupId" in m) {
                m.renderingGroupId = RIGHT_RAY_RENDERING_GROUP;
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Reset the ray-hide / ring-raise latch state so the next session re-applies
     * them to its own controllers (R13.4). Clears the two latch flags and the
     * two remembered controllers. Called from the session-end teardown path
     * (`_detachSessionObservers`). Guarded (design D9).
     *
     * _Requirements: 13.4_
     */
    resetRayState(): void {
        try {
            this._leftRayHidden = false;
            this._rightRingRaised = false;
            this._leftControllerForRay = null;
            this._rightControllerForRay = null;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * The rendered `WebXRCamera` for the active experience, or `null` while XR
     * support is disabled / no camera has been adopted. Backs the public
     * `getXRCamera()` delegate and is the target of the per-frame follow copy.
     *
     * _Requirements: 11.1_
     */
    getXRCamera(): WebXRCamera | null {
        return this._xrCamera;
    }

    /**
     * Per-frame XR camera follow update (design D6, D10, D12).
     *
     * Runs per frame in THIRD-PERSON (non-coupled) mode: the render observer
     * calls this whenever `_xrFirstPersonCoupled()` is false. (While first-person
     * coupling holds the observer instead runs the headset-driven
     * `_syncArcFromXRCamera()`, and this follow is skipped so the arc -> XR
     * mirror never fights the headset orientation.) It mirrors the Follow_Camera
     * (the owned `ArcRotateCamera`) transform onto the rendered `WebXRCamera` via
     * `setTransformationFromNonVRCamera(arcCamera, true)`, then copies the arc
     * camera's Y onto the XR camera's Y - the mirror forces the XR camera's
     * `position.y` to zero, so re-applying the arc Y preserves the beta-driven
     * camera height (R11.1, R11.2). This produces the LIVE follow target and,
     * because the mirror carries orientation too, reflects right-stick orbit into
     * the headset.
     *
     * Called from the render observer AFTER `sampleSticks()` (R11.3), so the
     * headset view reflects the same-frame Follow_Camera pose (including any
     * orbit/dolly applied this frame). The render observer itself is detached on
     * session end (R11.4) via `stopStickSampler()` in `_detachSessionObservers`.
     *
     * Entry-blend glide (D10): while `_entryBlendFrame < ENTRY_BLEND_FRAMES`, the
     * XR camera is nudged off the live target by a captured per-session offset
     * that decays monotonically to zero, gliding the view onto the follow pose
     * so any residual entry-drop is absorbed. The offset is captured ONCE on the
     * first blend frame as `(on-entry XR camera position - live follow target)`
     * and is added to the LIVE target each frame scaled by
     * `ease = smoothstep(1 - (frame + 1) / ENTRY_BLEND_FRAMES)`. `_entryBlendFrame`
     * increments each frame and the glide goes inert at `ENTRY_BLEND_FRAMES`
     * (default 90).
     *
     * Every BabylonJS/camera hop is individually guarded (design D9) so a
     * missing/mocked camera, an absent `setTransformationFromNonVRCamera`, or an
     * odd-shaped `position` never throws inside the render loop.
     *
     * _Requirements: 11.1, 11.2, 11.3, 11.4_
     */
    private _updateXRCameraFollow(): void {
        try {
            const xr = this._xrCamera as unknown as {
                setTransformationFromNonVRCamera?: (camera: unknown, resetToBaseReferenceSpace?: boolean) => unknown;
                position?: { x?: number; y?: number; z?: number };
                realWorldHeight?: number;
            } | null;
            if (xr == null) {
                return;
            }

            const arc = this._camera as unknown as {
                position?: { x?: number; y?: number; z?: number };
            } | null;

            // Capture the XR camera's on-entry position BEFORE the mirror overwrites
            // it. Only meaningful on the first blend frame, where it feeds the
            // once-captured entry-blend offset below (D10).
            const captureEntryPose = this._entryBlendFrame === 0;
            const entryX = captureEntryPose && typeof xr.position?.x === "number" ? (xr.position!.x as number) : 0;
            const entryY = captureEntryPose && typeof xr.position?.y === "number" ? (xr.position!.y as number) : 0;
            const entryZ = captureEntryPose && typeof xr.position?.z === "number" ? (xr.position!.z as number) : 0;

            // R11.1: mirror the Follow_Camera transform onto the XR camera. The
            // mirror forces the XR camera position.y to zero.
            if (typeof xr.setTransformationFromNonVRCamera === "function") {
               xr.setTransformationFromNonVRCamera(this._camera, true);
            }

            // R11.2: re-apply the arc camera's Y so beta-driven camera height is
            // preserved (the mirror zeroed it). This yields the LIVE follow target.
            const arcY = typeof arc?.position?.y === "number" ? arc.position.y : 0;
            // Compensate for the runtime adding the user's real-world head height H on
            // top of the base position: to land the RENDERED eye at arcY (design A), set
            // the base Y to arcY - H. realWorldHeight is a stable physical measurement
            // (NOT derived from the base position we write here), so it does not create
            // the per-frame feedback loop that reading rigCameras[0].position.y did.
            const rwh = typeof xr.realWorldHeight === "number" && isFinite(xr.realWorldHeight) ? xr.realWorldHeight : 0;
            if (xr.position != null && typeof xr.position.y === "number") {
                xr.position.y = arcY - rwh;
            }

            // Nothing further to do once the entry-blend glide is inert.
            if (this._entryBlendFrame >= ENTRY_BLEND_FRAMES) {
                return;
            }

            // The live follow target is the XR camera's current position after the
            // mirror + Y re-apply.
            const targetX = typeof xr.position?.x === "number" ? (xr.position!.x as number) : 0;
            const targetY = typeof xr.position?.y === "number" ? (xr.position!.y as number) : 0;
            const targetZ = typeof xr.position?.z === "number" ? (xr.position!.z as number) : 0;

            // D10: capture the offset ONCE on the first blend frame as
            // (on-entry XR camera position - live follow target). The on-entry
            // position was snapshotted BEFORE the mirror overwrote it above. With
            // the D15 initial-pose hook the seed lands on the follow pose, so the
            // captured offset is typically near-zero.
            if (captureEntryPose) {
                this._entryBlendOffsetX = entryX - targetX;
                this._entryBlendOffsetY = entryY - targetY;
                this._entryBlendOffsetZ = entryZ - targetZ;
            }

            // ease = smoothstep of the REMAINING fraction, decays monotonically to
            // zero across the blend so the offset fades and the camera glides onto
            // the live follow target.
            const progress = (this._entryBlendFrame + 1) / ENTRY_BLEND_FRAMES;
            const ease = this._smoothstep(1 - progress);

            // Render the XR camera at target + offset * ease (offset rides the LIVE
            // target so a moving avatar / settling controller is tracked without
            // overshoot).
            if (xr.position != null) {
                if (typeof xr.position.x === "number") {
                    xr.position.x = targetX + this._entryBlendOffsetX * ease;
                }
                if (typeof xr.position.y === "number") {
                    xr.position.y = targetY + this._entryBlendOffsetY * ease;
                }
                if (typeof xr.position.z === "number") {
                    xr.position.z = targetZ + this._entryBlendOffsetZ * ease;
                }
            }

            // Advance the blend; it goes inert once it reaches ENTRY_BLEND_FRAMES.
            this._entryBlendFrame += 1;
        } catch {
            // D9: swallow - never throw across the XR boundary.
        }
    }

    /**
     * Hermite smoothstep on `[0, 1]`: `3t^2 − 2t^3`, with the input clamped to
     * `[0, 1]` first. Monotonic on the unit interval with zero slope at both
     * ends, so the entry-blend ease decays smoothly to zero. Pure and guard-free
     * (no BabylonJS access).
     *
     * _Requirements: 11.1_
     */
    private _smoothstep(t: number): number {
        const x = typeof t === "number" && isFinite(t) ? (t < 0 ? 0 : t > 1 ? 1 : t) : 0;
        return x * x * (3 - 2 * x);
    }

    /**
     * Detach ALL per-session observers so repeated enter/exit cycles never
     * accumulate handlers (R15.4). Tears down, via {@link _detachSessionObservers}:
     *  - the per-frame render observer (`onBeforeRenderObservable`) that drives
     *    stick sampling + camera follow (`stopStickSampler`);
     *  - the data-driven binding observers - controller-added,
     *    per-source motion-controller-init, toggle-button, and trigger-button
     *    (jump) streams (`_detachBindingObservers`);
     *  - the one-shot D15 initial-pose observer if the session ended before it
     *    fired (`_removeInitialPoseObserver`);
     *  - and resets the ray-hide / ring-raise latch state (`resetRayState`).
     *
     * The right B/A dolly component captures are cleared on session end by
     * `_clearSessionCaptures()` (called alongside this from `onSessionEnd`), so
     * "clear right B/A captures on exit" is satisfied without duplicating that
     * work here. This is the public name task 17.1 calls out; it delegates to
     * the private implementation so all existing callers keep working. Guarded
     * (design D9) so it never throws under mocks.
     *
     * _Requirements: 15.4_
     */
    detachSessionObservers(): void {
        this._detachSessionObservers();
    }

    /**
     * Detach all per-session observers (controller-added, motion-controller
     * init, toggle/trigger buttons, render) plus the one-shot initial-pose hook,
     * and reset the ray-management latches (R15.4). Guarded so it never throws
     * (D9). Delegated to by the public {@link detachSessionObservers}.
     *
     * _Requirements: 15.4_
     */
    private _detachSessionObservers(): void {
        try {
            // Detach the per-frame render observer registered by the stick
            // sampler (task 7.1). The remaining per-session observers
            // (controller-added, motion-controller-init, toggle buttons) are
            // torn down here in task 17.1.
            this.stopStickSampler();

            // R8.3 / R18.8: detach the data-driven binding observers
            // (controller-added, per-source motion-controller-init, toggle/press
            // buttons, and the left-trigger jump observers) so repeated enter/exit
            // cycles never accumulate handlers.
            this._detachBindingObservers();

            // D15 (task 12.3): tear down the one-shot initial-pose observer(s) if
            // the session ends before either ever fired, so enter/exit cycles
            // never accumulate initial-pose hooks.
            this._removeInitialPoseObserver();

            // R13.4: reset the ray-hide / ring-raise latch state so the next
            // session re-applies them to its own controllers.
            this.resetRayState();
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Clear per-session component captures: the right B/A dolly button component
     * references and the dolly-to-avatar toggle state (R10.4, R10.5). Called
     * from `onSessionEnd` (via the teardown path) so a subsequent session
     * re-resolves its own captures and starts the toggle clean. Guarded so it
     * never throws (D9).
     *
     * _Requirements: 10.4, 10.5, 15.4_
     */
    private _clearSessionCaptures(): void {
        try {
            // R10.5: clear the right-hand dolly button captures so the next
            // session re-resolves them on its own right controller.
            this._dollyInComponent = null;
            this._dollyOutComponent = null;

            // R18.7: clear the data-driven axes/press captures so the next session
            // (or a mid-session re-bind) re-resolves them from the new mapping.
            this._moveAxesComponent = null;
            this._orbitAxesComponent = null;
            this._fastModifierComponent = null;
            this._lastToggleController = null;

            // R10.4: reset the dolly-to-avatar toggle state so a new session
            // starts clean and never restores a stale radius.
            this._dollyToAvatarActive = false;
            this._dollyToAvatarPriorRadius = 0;
        } catch {
            // D9: swallow.
        }
    }

    /**
     * Restore ArcRotate_Mode as the active rendered camera behavior (R15.3,
     * R1.7): re-activate the owned `ArcRotateCamera` as `scene.activeCamera` and
     * re-attach its controls to the rendering canvas.
     *
     * This is the public name task 17.1 calls out; it delegates to the private
     * {@link _restoreArcRotateMode} so all existing callers (`disable()`,
     * `onSessionEnd`) keep working. It must never leave the avatar in a broken
     * camera state and must never throw (design D9).
     *
     * _Requirements: 15.3, 1.7_
     */
    restoreArcRotateMode(): void {
        this._restoreArcRotateMode();
    }

    /**
     * Restore the `ArcRotateCamera` as the active rendered camera and re-attach
     * its controls (R15.3, R1.7). It must never leave the avatar in a broken
     * camera state and must never throw (D9). Delegated to by the public
     * {@link restoreArcRotateMode}.
     */
    private _restoreArcRotateMode(): void {
        try {
            const scene = this._scene as unknown as {
                activeCamera?: ArcRotateCamera;
                getEngine?: () => { getRenderingCanvas?: () => unknown };
            };
            if (scene == null || this._camera == null) {
                return;
            }

            scene.activeCamera = this._camera;

            const attach = (this._camera as unknown as {
                attachControl?: (canvas?: unknown, noPreventDefault?: boolean) => void;
            }).attachControl;
            if (typeof attach === "function") {
                const canvas = scene.getEngine?.().getRenderingCanvas?.();
                attach.call(this._camera, canvas, true);
            }
        } catch {
            // D9: swallow.
        }
    }
}
