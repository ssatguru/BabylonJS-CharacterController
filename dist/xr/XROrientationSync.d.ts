export interface HeadsetOrientation {
    yaw: number;
    pitch: number;
}
export interface BetaLimits {
    lower: number;
    upper: number;
}
export interface ArcAngles {
    alpha: number;
    beta: number;
}
export declare function deriveArcAngles(orientation: HeadsetOrientation, limits: BetaLimits): ArcAngles;
export declare function clampBetaValue(beta: number, limits: BetaLimits): number;
export declare function deriveAvatarYaw(alpha: number, facingOffset: number): number;
