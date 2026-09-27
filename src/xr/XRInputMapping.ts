/**
 * XRInputMapping - pure, BabylonJS-free input-mapping foundation for WebXR support.
 *
 * This module defines the bindable actions and inputs, the mapping shape, the
 * default mapping, the axis/button type partitions used by validation, the
 * standard WebXR component-id constants, and the per-input (handedness +
 * component-id) resolution map.
 *
 * It contains no logic functions - `mergeXRInputMapping` and
 * `validateXRInputMapping` live in a subsequent task and consume the partitions
 * and defaults exported here.
 *
 * No BabylonJS imports: this module is unit/property-testable without a scene.
 */

/**
 * The set of controller-driven actions a developer may bind.
 * _Requirements: 18.2_
 */
export enum BindableAction {
    Move = "Move",
    FastModifier = "FastModifier",
    Jump = "Jump",
    CameraOrbit = "CameraOrbit",
    CameraDollyIn = "CameraDollyIn",
    CameraDollyOut = "CameraDollyOut",
    DollyToAvatarToggle = "DollyToAvatarToggle",
    LocomotionModeToggle = "LocomotionModeToggle",
    Teleport = "Teleport",
}

/**
 * The set of XR controller inputs (identified by handedness + component) that
 * can be bound to an action. Six stick/trigger inputs, two grip (squeeze)
 * buttons, plus eight a/b/x/y face buttons.
 * _Requirements: 18.3_
 */
export enum BindableInput {
    LeftThumbstickAxes = "left-thumbstick-axes",
    RightThumbstickAxes = "right-thumbstick-axes",
    LeftThumbstickPress = "left-thumbstick-press",
    RightThumbstickPress = "right-thumbstick-press",
    LeftTrigger = "left-trigger",
    RightTrigger = "right-trigger",
    LeftGrip = "left-grip",
    RightGrip = "right-grip",
    LeftAButton = "left-a-button",
    LeftBButton = "left-b-button",
    LeftXButton = "left-x-button",
    LeftYButton = "left-y-button",
    RightAButton = "right-a-button",
    RightBButton = "right-b-button",
    RightXButton = "right-x-button",
    RightYButton = "right-y-button",
}

/**
 * An input mapping binds every {@link BindableAction} to a {@link BindableInput}
 * or to `null` (unbound).
 */
export type XRInputMapping = Record<BindableAction, BindableInput | null>;

/**
 * The result of attempting to apply an input mapping.
 */
export interface MappingResult {
    applied: boolean;
    rejected: boolean;
    reason?: string;
}

/**
 * Axis-typed inputs supply a two-axis analog value. All other inputs are
 * button-typed (digital pressed/released).
 * _Requirements: 18.3_
 */
export const AXIS_INPUTS: ReadonlySet<BindableInput> = new Set<BindableInput>([
    BindableInput.LeftThumbstickAxes,
    BindableInput.RightThumbstickAxes,
]);

/**
 * True when the input supplies a two-axis analog value; false for button inputs.
 */
export function isAxisInput(input: BindableInput): boolean {
    return AXIS_INPUTS.has(input);
}

/**
 * Axis-typed actions are driven by a two-axis analog input. All other actions
 * are button-typed.
 * _Requirements: 18.3_
 */
export const AXIS_ACTIONS: ReadonlySet<BindableAction> = new Set<BindableAction>([
    BindableAction.Move,
    BindableAction.CameraOrbit,
]);

/**
 * True when the action is driven by a two-axis analog input; false for button
 * actions.
 */
export function isAxisAction(action: BindableAction): boolean {
    return AXIS_ACTIONS.has(action);
}

/**
 * The mapping used when the developer has not configured one. Binds inputs to
 * actions exactly as documented in the requirements.
 * _Requirements: 18.5_
 */
export const DEFAULT_XR_INPUT_MAPPING: XRInputMapping = {
    [BindableAction.Move]: BindableInput.LeftThumbstickAxes,
    [BindableAction.FastModifier]: BindableInput.LeftThumbstickPress,
    [BindableAction.Jump]: BindableInput.LeftTrigger,
    [BindableAction.CameraOrbit]: BindableInput.RightThumbstickAxes,
    [BindableAction.CameraDollyIn]: BindableInput.RightBButton,
    [BindableAction.CameraDollyOut]: BindableInput.RightAButton,
    [BindableAction.DollyToAvatarToggle]: BindableInput.LeftXButton,
    [BindableAction.LocomotionModeToggle]: BindableInput.LeftAButton,
    [BindableAction.Teleport]: null,
};

/**
 * Standard WebXR component ids used to resolve a live controller component.
 */
export const XR_COMPONENT_THUMBSTICK = "xr-standard-thumbstick";
export const XR_COMPONENT_TRIGGER = "xr-standard-trigger";
export const XR_COMPONENT_SQUEEZE = "xr-standard-squeeze";
export const XR_COMPONENT_A_BUTTON = "a-button";
export const XR_COMPONENT_B_BUTTON = "b-button";
export const XR_COMPONENT_X_BUTTON = "x-button";
export const XR_COMPONENT_Y_BUTTON = "y-button";

/**
 * Which hand a {@link BindableInput} belongs to.
 */
export type Handedness = "left" | "right";

/**
 * The (handedness + component id) needed to resolve a live controller component
 * for a {@link BindableInput}.
 */
export interface InputResolution {
    handedness: Handedness;
    componentId: string;
}

/**
 * Maps each {@link BindableInput} to the handedness and standard WebXR component
 * id that resolves it. Thumbstick axes and press both resolve to the thumbstick
 * component for their hand; triggers to the trigger component; face buttons to
 * their corresponding button component.
 * _Requirements: 18.5_
 */
export const INPUT_RESOLUTION: Record<BindableInput, InputResolution> = {
    [BindableInput.LeftThumbstickAxes]: { handedness: "left", componentId: XR_COMPONENT_THUMBSTICK },
    [BindableInput.LeftThumbstickPress]: { handedness: "left", componentId: XR_COMPONENT_THUMBSTICK },
    [BindableInput.RightThumbstickAxes]: { handedness: "right", componentId: XR_COMPONENT_THUMBSTICK },
    [BindableInput.RightThumbstickPress]: { handedness: "right", componentId: XR_COMPONENT_THUMBSTICK },
    [BindableInput.LeftTrigger]: { handedness: "left", componentId: XR_COMPONENT_TRIGGER },
    [BindableInput.RightTrigger]: { handedness: "right", componentId: XR_COMPONENT_TRIGGER },
    [BindableInput.LeftGrip]: { handedness: "left", componentId: XR_COMPONENT_SQUEEZE },
    [BindableInput.RightGrip]: { handedness: "right", componentId: XR_COMPONENT_SQUEEZE },
    [BindableInput.LeftAButton]: { handedness: "left", componentId: XR_COMPONENT_A_BUTTON },
    [BindableInput.LeftBButton]: { handedness: "left", componentId: XR_COMPONENT_B_BUTTON },
    [BindableInput.LeftXButton]: { handedness: "left", componentId: XR_COMPONENT_X_BUTTON },
    [BindableInput.LeftYButton]: { handedness: "left", componentId: XR_COMPONENT_Y_BUTTON },
    [BindableInput.RightAButton]: { handedness: "right", componentId: XR_COMPONENT_A_BUTTON },
    [BindableInput.RightBButton]: { handedness: "right", componentId: XR_COMPONENT_B_BUTTON },
    [BindableInput.RightXButton]: { handedness: "right", componentId: XR_COMPONENT_X_BUTTON },
    [BindableInput.RightYButton]: { handedness: "right", componentId: XR_COMPONENT_Y_BUTTON },
};

/**
 * Overlay a partial mapping onto {@link DEFAULT_XR_INPUT_MAPPING}. Actions the
 * partial does not specify retain their default binding. An explicit `null` in
 * the partial unbinds that action.
 *
 * This is a pure overlay only - it performs no validation. Callers that need a
 * validated result should pass the merged mapping to
 * {@link validateXRInputMapping}.
 *
 * _Requirements: 18.6, 18.9_
 */
export function mergeXRInputMapping(partial: Partial<XRInputMapping>): XRInputMapping {
    const merged: XRInputMapping = { ...DEFAULT_XR_INPUT_MAPPING };
    if (partial) {
        for (const key of Object.keys(partial) as BindableAction[]) {
            // Only overlay keys that are genuinely present on the partial so that
            // an unspecified action keeps its default (rather than being clobbered
            // by an `undefined` value).
            if (Object.prototype.hasOwnProperty.call(partial, key)) {
                merged[key] = partial[key] as BindableInput | null;
            }
        }
    }
    return merged;
}

const ALL_ACTIONS: ReadonlySet<string> = new Set<string>(Object.values(BindableAction));
const ALL_INPUTS: ReadonlySet<string> = new Set<string>(Object.values(BindableInput));

/**
 * Validate a complete candidate mapping.
 *
 * Rejects when:
 *  - any key is not a member of {@link BindableAction}, or any non-null value is
 *    not a member of {@link BindableInput} (R18.11);
 *  - a single input is bound to two or more (conflicting) actions (R18.12);
 *  - an {@link AXIS_ACTIONS axis action} is bound to a button input, or a button
 *    action is bound to an {@link AXIS_INPUTS axis input} (R18.13).
 *
 * Returns `{ applied: true, rejected: false }` when the mapping is valid,
 * otherwise `{ applied: false, rejected: true, reason }`.
 *
 * _Requirements: 18.11, 18.12, 18.13_
 */
export function validateXRInputMapping(mapping: XRInputMapping): MappingResult {
    if (mapping == null || typeof mapping !== "object") {
        return { applied: false, rejected: true, reason: "Mapping must be an object" };
    }

    const seen: Partial<Record<BindableInput, BindableAction>> = {};

    for (const key of Object.keys(mapping) as BindableAction[]) {
        // R18.11: reject unknown action keys.
        if (!ALL_ACTIONS.has(key)) {
            return { applied: false, rejected: true, reason: `Unknown action: ${String(key)}` };
        }

        const input = mapping[key];

        // A null binding intentionally leaves the action unbound; nothing to check.
        if (input === null || input === undefined) {
            continue;
        }

        // R18.11: reject unknown input values.
        if (!ALL_INPUTS.has(input as unknown as string)) {
            return { applied: false, rejected: true, reason: `Unknown input for action ${key}: ${String(input)}` };
        }

        // R18.13: axis/button type mismatch between action and input.
        const actionIsAxis = isAxisAction(key);
        const inputIsAxis = isAxisInput(input);
        if (actionIsAxis && !inputIsAxis) {
            return {
                applied: false,
                rejected: true,
                reason: `Axis action ${key} cannot be bound to button input ${input}`,
            };
        }
        if (!actionIsAxis && inputIsAxis) {
            return {
                applied: false,
                rejected: true,
                reason: `Button action ${key} cannot be bound to axis input ${input}`,
            };
        }

        // R18.12: a single input bound to two or more actions is a conflict.
        const priorAction = seen[input];
        if (priorAction !== undefined) {
            return {
                applied: false,
                rejected: true,
                reason: `Input ${input} is bound to conflicting actions ${priorAction} and ${key}`,
            };
        }
        seen[input] = key;
    }

    return { applied: true, rejected: false };
}
