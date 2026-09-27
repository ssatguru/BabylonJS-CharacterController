export declare enum BindableAction {
    Move = "Move",
    FastModifier = "FastModifier",
    Jump = "Jump",
    CameraOrbit = "CameraOrbit",
    CameraDollyIn = "CameraDollyIn",
    CameraDollyOut = "CameraDollyOut",
    DollyToAvatarToggle = "DollyToAvatarToggle",
    LocomotionModeToggle = "LocomotionModeToggle",
    Teleport = "Teleport"
}
export declare enum BindableInput {
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
    RightYButton = "right-y-button"
}
export type XRInputMapping = Record<BindableAction, BindableInput | null>;
export interface MappingResult {
    applied: boolean;
    rejected: boolean;
    reason?: string;
}
export declare const AXIS_INPUTS: ReadonlySet<BindableInput>;
export declare function isAxisInput(input: BindableInput): boolean;
export declare const AXIS_ACTIONS: ReadonlySet<BindableAction>;
export declare function isAxisAction(action: BindableAction): boolean;
export declare const DEFAULT_XR_INPUT_MAPPING: XRInputMapping;
export declare const XR_COMPONENT_THUMBSTICK = "xr-standard-thumbstick";
export declare const XR_COMPONENT_TRIGGER = "xr-standard-trigger";
export declare const XR_COMPONENT_SQUEEZE = "xr-standard-squeeze";
export declare const XR_COMPONENT_A_BUTTON = "a-button";
export declare const XR_COMPONENT_B_BUTTON = "b-button";
export declare const XR_COMPONENT_X_BUTTON = "x-button";
export declare const XR_COMPONENT_Y_BUTTON = "y-button";
export type Handedness = "left" | "right";
export interface InputResolution {
    handedness: Handedness;
    componentId: string;
}
export declare const INPUT_RESOLUTION: Record<BindableInput, InputResolution>;
export declare function mergeXRInputMapping(partial: Partial<XRInputMapping>): XRInputMapping;
export declare function validateXRInputMapping(mapping: XRInputMapping): MappingResult;
