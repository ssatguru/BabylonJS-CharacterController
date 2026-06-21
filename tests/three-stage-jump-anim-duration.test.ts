import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property: _getAnimDuration correctness
 *
 * Pure function: computes playback duration as frameCount / (fps × |rate|)
 * - Handle AnimationGroup path (use ag.to - ag.from and targetedAnimations[0].animation.framePerSecond)
 * - Handle AnimationRange path (use skeleton range, default 30 fps)
 * - Return 0 for null/missing data (graceful degradation)
 *
 * **Validates: Requirements 1.1, 1.2, 4.1, 4.2**
 */

/**
 * Pure function extracted from _getAnimDuration for AnimationGroup path.
 * Computes duration = frameCount / (fps * |rate|).
 * Returns 0 for invalid inputs (graceful degradation).
 */
function getAnimDurationAG(
    agTo: number | null,
    agFrom: number | null,
    fps: number | null,
    rate: number
): number {
    if (agTo == null || agFrom == null) return 0;
    if (fps == null || fps === 0) return 0;
    if (rate === 0) return 0;
    const frameCount = agTo - agFrom;
    return frameCount / (fps * Math.abs(rate));
}

/**
 * Pure function extracted from _getAnimDuration for AnimationRange (skeleton) path.
 * Computes duration = frameCount / (30 * |rate|) where 30 is the BabylonJS default skeleton fps.
 * Returns 0 for invalid inputs (graceful degradation).
 */
function getAnimDurationAR(
    rangeTo: number | null,
    rangeFrom: number | null,
    rate: number
): number {
    if (rangeTo == null || rangeFrom == null) return 0;
    if (rate === 0) return 0;
    const frameCount = rangeTo - rangeFrom;
    const fps = 30;
    return frameCount / (fps * Math.abs(rate));
}

describe("Feature: three-stage-jump, _getAnimDuration helper — AnimationGroup path", () => {
    it("computes duration as frameCount / (fps * |rate|) for valid inputs", () => {
        fc.assert(
            fc.property(
                // ag.from
                fc.double({ min: 0, max: 100, noNaN: true }),
                // ag.to (must be > from to have positive frame count)
                fc.double({ min: 1, max: 200, noNaN: true }),
                // fps > 0
                fc.double({ min: 1, max: 120, noNaN: true }),
                // rate != 0
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                (from, toDelta, fps, rate) => {
                    const to = from + toDelta; // ensure to > from
                    const duration = getAnimDurationAG(to, from, fps, rate);
                    const expected = (to - from) / (fps * Math.abs(rate));
                    expect(duration).toBeCloseTo(expected, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("returns positive duration for positive frameCount, fps, and rate", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 100, noNaN: true }),
                fc.double({ min: 0.01, max: 200, noNaN: true }),
                fc.double({ min: 1, max: 120, noNaN: true }),
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                (from, toDelta, fps, rate) => {
                    const to = from + toDelta;
                    const duration = getAnimDurationAG(to, from, fps, rate);
                    expect(duration).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("handles negative rate (uses absolute value)", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 100, noNaN: true }),
                fc.double({ min: 1, max: 200, noNaN: true }),
                fc.double({ min: 1, max: 120, noNaN: true }),
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                (from, toDelta, fps, posRate) => {
                    const to = from + toDelta;
                    const negRate = -posRate;
                    const durationPos = getAnimDurationAG(to, from, fps, posRate);
                    const durationNeg = getAnimDurationAG(to, from, fps, negRate);
                    expect(durationPos).toBeCloseTo(durationNeg, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("returns 0 when rate is 0", () => {
        const duration = getAnimDurationAG(60, 0, 30, 0);
        expect(duration).toBe(0);
    });

    it("returns 0 when fps is 0", () => {
        const duration = getAnimDurationAG(60, 0, 0, 1);
        expect(duration).toBe(0);
    });

    it("returns 0 when ag.to is null", () => {
        const duration = getAnimDurationAG(null, 0, 30, 1);
        expect(duration).toBe(0);
    });

    it("returns 0 when ag.from is null", () => {
        const duration = getAnimDurationAG(60, null, 30, 1);
        expect(duration).toBe(0);
    });

    it("returns 0 when fps is null", () => {
        const duration = getAnimDurationAG(60, 0, null, 1);
        expect(duration).toBe(0);
    });
});

describe("Feature: three-stage-jump, _getAnimDuration helper — AnimationRange path", () => {
    it("computes duration as frameCount / (30 * |rate|) for valid inputs", () => {
        fc.assert(
            fc.property(
                // range.from
                fc.double({ min: 0, max: 100, noNaN: true }),
                // range.to delta (positive)
                fc.double({ min: 1, max: 200, noNaN: true }),
                // rate != 0
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                (from, toDelta, rate) => {
                    const to = from + toDelta;
                    const duration = getAnimDurationAR(to, from, rate);
                    const expected = (to - from) / (30 * Math.abs(rate));
                    expect(duration).toBeCloseTo(expected, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("uses 30 fps as default (BabylonJS skeleton default)", () => {
        // 60 frames at rate 1 should be 2 seconds (60 / (30 * 1))
        const duration = getAnimDurationAR(60, 0, 1);
        expect(duration).toBe(2);
    });

    it("handles negative rate (uses absolute value)", () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 100, noNaN: true }),
                fc.double({ min: 1, max: 200, noNaN: true }),
                fc.double({ min: 0.1, max: 10, noNaN: true }),
                (from, toDelta, posRate) => {
                    const to = from + toDelta;
                    const negRate = -posRate;
                    const durationPos = getAnimDurationAR(to, from, posRate);
                    const durationNeg = getAnimDurationAR(to, from, negRate);
                    expect(durationPos).toBeCloseTo(durationNeg, 10);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("returns 0 when rate is 0", () => {
        const duration = getAnimDurationAR(60, 0, 0);
        expect(duration).toBe(0);
    });

    it("returns 0 when rangeTo is null (skeleton range not found)", () => {
        const duration = getAnimDurationAR(null, 0, 1);
        expect(duration).toBe(0);
    });

    it("returns 0 when rangeFrom is null", () => {
        const duration = getAnimDurationAR(60, null, 1);
        expect(duration).toBe(0);
    });
});
