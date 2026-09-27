/**
 * XRLocomotion - pure, BabylonJS-free locomotion state machine for WebXR support.
 *
 * This module houses the first/third-person sub-mode state machine that governs
 * how the controller couples the camera to the avatar while in an immersive
 * session. The machine enforces a single guard - a transition into
 * `'firstPerson'` is only allowed when the caller reports that first person is
 * permitted (`canFirstPerson === true`), mirroring the controller's
 * `noFirstPerson` setting - while a transition into `'thirdPerson'` is always
 * allowed.
 *
 * The state machine is a plain object with no BabylonJS dependency, so it is
 * unit/property-testable in isolation without a scene.
 *
 * Alongside the state machine, this module also hosts the pure left-stick
 * mapper (`mapStickToIntent` / `neutralMoveIntent`) and its `StickInput` /
 * `MoveIntent` types. These are likewise BabylonJS-free and testable in
 * isolation.
 */

/**
 * The two locomotion sub-modes. `'firstPerson'` lets the camera pull in to the
 * avatar; `'thirdPerson'` holds a third-person offset.
 * _Requirements: 3.1_
 */
export type LocomotionMode = "firstPerson" | "thirdPerson";

/**
 * The outcome of a mode change request.
 *  - `mode`: the resulting mode after the request (unchanged when blocked).
 *  - `changed`: true only when the resulting mode differs from the prior mode.
 *  - `blocked`: true when a `'firstPerson'` transition was denied because first
 *    person was not permitted.
 * _Requirements: 3.3, 3.4, 3.5_
 */
export interface ToggleResult {
    mode: LocomotionMode;
    changed: boolean;
    blocked: boolean;
}

/**
 * First/third-person locomotion state machine.
 *
 * Guard semantics (R3.2-R3.5):
 *  - A transition to `'firstPerson'` requires `canFirstPerson === true`;
 *    otherwise the request is blocked, the mode is left unchanged, and the
 *    result reports `{ changed: false, blocked: true }`.
 *  - A transition to `'thirdPerson'` is always allowed and never blocked.
 *  - `changed` is true only when the resulting mode differs from the prior mode.
 */
export class XRLocomotion {
    private _mode: LocomotionMode;

    /**
     * @param initial the starting mode; defaults to `'thirdPerson'`.
     * _Requirements: 3.1_
     */
    constructor(initial?: LocomotionMode) {
        this._mode = initial ?? "thirdPerson";
    }

    /**
     * The current locomotion mode.
     * _Requirements: 3.1_
     */
    getMode(): LocomotionMode {
        return this._mode;
    }

    /**
     * Set a specific mode under the `canFirstPerson` guard.
     *
     * A `'firstPerson'` target is blocked unless `canFirstPerson === true`; a
     * `'thirdPerson'` target is always accepted. On a blocked request the mode
     * is left unchanged.
     *
     * _Requirements: 3.2, 3.3, 3.4, 3.5_
     */
    setMode(mode: LocomotionMode, canFirstPerson: boolean): ToggleResult {
        const prior = this._mode;

        // R3.3: a transition to first person is only permitted when allowed.
        if (mode === "firstPerson" && canFirstPerson !== true) {
            return { mode: prior, changed: false, blocked: true };
        }

        this._mode = mode;
        return { mode: this._mode, changed: this._mode !== prior, blocked: false };
    }

    /**
     * Flip between the two modes under the `canFirstPerson` guard.
     *
     * From `'thirdPerson'` this attempts `'firstPerson'` (subject to the guard);
     * from `'firstPerson'` this always returns to `'thirdPerson'`.
     *
     * _Requirements: 3.4, 3.5_
     */
    toggle(canFirstPerson: boolean): ToggleResult {
        const target: LocomotionMode = this._mode === "thirdPerson" ? "firstPerson" : "thirdPerson";
        return this.setMode(target, canFirstPerson);
    }
}

/**
 * Default left-stick deadzone. Raw axis magnitudes at or below this threshold
 * are treated as neutral (no movement).
 * _Requirements: 6.1_
 */
export const DEFAULT_STICK_DEADZONE = 0.15;

/**
 * Raw left-thumbstick axes, each nominally in the range [-1, 1].
 *  - `leftX`: positive to the right, negative to the left.
 *  - `leftY`: NEGATIVE when pushed forward/up, POSITIVE when pulled back/down
 *    (WebXR/gamepad convention; see `mapStickToIntent`).
 * _Requirements: 6.2, 6.3, 6.4, 6.5_
 */
export interface StickInput {
    leftX: number;
    leftY: number;
}

/**
 * A decoded movement intent for a single frame. At most one of
 * {`walk`/`walkBack`} vs {`strafeLeft`/`strafeRight`} is active, per the
 * dominant-axis rule in `mapStickToIntent`.
 * _Requirements: 6.2, 6.3, 6.4, 6.5_
 */
export interface MoveIntent {
    walk: boolean;
    walkBack: boolean;
    strafeLeft: boolean;
    strafeRight: boolean;
}

/**
 * A neutral (all-false) movement intent — no direction active.
 * _Requirements: 6.1_
 */
export function neutralMoveIntent(): MoveIntent {
    return { walk: false, walkBack: false, strafeLeft: false, strafeRight: false };
}

/**
 * Pure left-stick mapping. Dominant-axis: only one of {forward/back} vs
 * {strafe} is active per call (larger raw magnitude wins; ties -> forward/back).
 * The deadzone gates the winning axis: if the winning axis's raw magnitude is
 * within (<=) the deadzone, the result is a neutral intent. Sign:
 * `leftY < -dz` => walk; `leftY > dz` => walkBack; `leftX > dz` => strafeRight;
 * `leftX < -dz` => strafeLeft.
 *
 * SIGN GOTCHA: WebXR/gamepad thumbstick Y is NEGATIVE when pushed forward/up and
 * POSITIVE when pulled back/down. Hence `leftY < -deadzone` maps to walk
 * (forward) and `leftY > deadzone` maps to walkBack — do not invert this. X is
 * positive to the right. The mapper encodes this convention directly.
 *
 * Pure function — no BabylonJS dependency.
 * _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
 */
export function mapStickToIntent(input: StickInput, deadzone: number = DEFAULT_STICK_DEADZONE): MoveIntent {
    const { leftX, leftY } = input;

    // R6.2: dominant-axis gating — the axis with the larger RAW magnitude wins.
    // Ties (|leftY| === |leftX|) resolve to the forward/back axis.
    const forwardBackWins = Math.abs(leftY) >= Math.abs(leftX);

    if (forwardBackWins) {
        // R6.1: deadzone gates the winning (forward/back) axis.
        if (Math.abs(leftY) <= deadzone) {
            return neutralMoveIntent();
        }
        // R6.3: negative Y is forward (walk), positive Y is backward (walkBack).
        return {
            walk: leftY < -deadzone,
            walkBack: leftY > deadzone,
            strafeLeft: false,
            strafeRight: false,
        };
    }

    // R6.1: deadzone gates the winning (strafe) axis.
    if (Math.abs(leftX) <= deadzone) {
        return neutralMoveIntent();
    }
    // R6.4, R6.5: positive X is strafeRight, negative X is strafeLeft.
    return {
        walk: false,
        walkBack: false,
        strafeLeft: leftX < -deadzone,
        strafeRight: leftX > deadzone,
    };
}
