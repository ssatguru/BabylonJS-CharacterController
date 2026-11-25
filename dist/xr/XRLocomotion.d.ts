export type LocomotionMode = "firstPerson" | "thirdPerson";
export interface ToggleResult {
    mode: LocomotionMode;
    changed: boolean;
    blocked: boolean;
}
export declare class XRLocomotion {
    private _mode;
    constructor(initial?: LocomotionMode);
    getMode(): LocomotionMode;
    setMode(mode: LocomotionMode, canFirstPerson: boolean): ToggleResult;
    toggle(canFirstPerson: boolean): ToggleResult;
}
export declare const DEFAULT_STICK_DEADZONE = 0.15;
export interface StickInput {
    leftX: number;
    leftY: number;
}
export interface MoveIntent {
    walk: boolean;
    walkBack: boolean;
    strafeLeft: boolean;
    strafeRight: boolean;
}
export declare function neutralMoveIntent(): MoveIntent;
export declare function mapStickToIntent(input: StickInput, deadzone?: number): MoveIntent;
