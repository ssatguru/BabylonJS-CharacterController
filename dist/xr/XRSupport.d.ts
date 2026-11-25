export interface XRSupportState {
    vrSupported: boolean;
    arSupported: boolean;
}
export type ProbeOutcome = boolean | "error";
export declare function computeXRSupportResult(vr: ProbeOutcome, ar: ProbeOutcome): XRSupportState;
export declare function detectXRSupport(): Promise<XRSupportState>;
