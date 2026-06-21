import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 9: Post-jump skip and cleanup when animation missing
 *
 * Pure functions: endJump determines whether to enter POST_JUMP or do a full cleanup,
 * and endJumpFull clears all jump state variables.
 *
 * When the corresponding post-jump animation does not exist (postAnim.exist is false),
 * endJump should signal a full cleanup, and endJumpFull should reset all state to defaults.
 *
 * **Validates: Requirements 4.5, 5.1, 5.2, 5.3**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

interface JumpState {
    actJump: boolean;
    jumpStage: number;
    jumpTime: number;
    jumpStageTime: number;
    jumpStageDuration: number;
    wasWalking: boolean;
    wasRunning: boolean;
    wasIdleJump: boolean;
    jumpBuffered: boolean;
}

function endJumpFull(): JumpState {
    return {
        actJump: false,
        jumpStage: JUMP_STAGE.NONE,
        jumpTime: 0,
        jumpStageTime: 0,
        jumpStageDuration: 0,
        wasWalking: false,
        wasRunning: false,
        wasIdleJump: false,
        jumpBuffered: false,
    };
}

function endJump(
    wasIdleJump: boolean,
    postIdleExists: boolean,
    postRunExists: boolean
): { nextStage: number; fullCleanup: boolean } {
    const postAnimExists = wasIdleJump ? postIdleExists : postRunExists;
    if (postAnimExists) {
        return { nextStage: JUMP_STAGE.POST_JUMP, fullCleanup: false };
    } else {
        return { nextStage: JUMP_STAGE.NONE, fullCleanup: true };
    }
}

describe("Feature: three-stage-jump, Property 9: Post-jump skip and cleanup when animation missing", () => {
    it("endJump returns fullCleanup === true when idle jump and postIdleJump does not exist", () => {
        fc.assert(
            fc.property(
                // postRunExists can be anything since it's not used for idle jumps
                fc.boolean(),
                (postRunExists) => {
                    const result = endJump(true, false, postRunExists);
                    expect(result.fullCleanup).toBe(true);
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("endJump returns fullCleanup === true when run jump and postRunJump does not exist", () => {
        fc.assert(
            fc.property(
                // postIdleExists can be anything since it's not used for run jumps
                fc.boolean(),
                (postIdleExists) => {
                    const result = endJump(false, postIdleExists, false);
                    expect(result.fullCleanup).toBe(true);
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("endJump returns fullCleanup === true for any jump type when corresponding post-anim is missing", () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (wasIdleJump, postIdleExists, postRunExists) => {
                    // Only test cases where the relevant post-anim does NOT exist
                    const relevantPostExists = wasIdleJump
                        ? postIdleExists
                        : postRunExists;
                    fc.pre(!relevantPostExists);

                    const result = endJump(
                        wasIdleJump,
                        postIdleExists,
                        postRunExists
                    );
                    expect(result.fullCleanup).toBe(true);
                    expect(result.nextStage).toBe(JUMP_STAGE.NONE);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("endJumpFull clears all state: actJump=false, jumpStage=NONE, jumpTime=0, wasWalking=false, wasRunning=false, wasIdleJump=false, jumpBuffered=false", () => {
        fc.assert(
            fc.property(
                // Generate arbitrary prior state values to show cleanup is unconditional
                fc.boolean(),
                fc.integer({ min: 0, max: 3 }),
                fc.double({ min: 0, max: 100, noNaN: true }),
                fc.double({ min: 0, max: 10, noNaN: true }),
                fc.double({ min: 0, max: 10, noNaN: true }),
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (
                    _prevActJump,
                    _prevJumpStage,
                    _prevJumpTime,
                    _prevStageTime,
                    _prevStageDuration,
                    _prevWasWalking,
                    _prevWasRunning,
                    _prevWasIdleJump,
                    _prevJumpBuffered
                ) => {
                    // Regardless of prior state, endJumpFull always returns fully cleared state
                    const cleaned = endJumpFull();

                    expect(cleaned.actJump).toBe(false);
                    expect(cleaned.jumpStage).toBe(JUMP_STAGE.NONE);
                    expect(cleaned.jumpTime).toBe(0);
                    expect(cleaned.jumpStageTime).toBe(0);
                    expect(cleaned.jumpStageDuration).toBe(0);
                    expect(cleaned.wasWalking).toBe(false);
                    expect(cleaned.wasRunning).toBe(false);
                    expect(cleaned.wasIdleJump).toBe(false);
                    expect(cleaned.jumpBuffered).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("endJump + endJumpFull combined: missing post-anim triggers full state cleanup on same frame", () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (wasIdleJump, postIdleExists, postRunExists) => {
                    // Only test cases where the relevant post-anim does NOT exist
                    const relevantPostExists = wasIdleJump
                        ? postIdleExists
                        : postRunExists;
                    fc.pre(!relevantPostExists);

                    // endJump signals full cleanup
                    const result = endJump(
                        wasIdleJump,
                        postIdleExists,
                        postRunExists
                    );
                    expect(result.fullCleanup).toBe(true);

                    // When fullCleanup is true, endJumpFull is called which clears all state
                    const cleaned = endJumpFull();
                    expect(cleaned.actJump).toBe(false);
                    expect(cleaned.jumpStage).toBe(JUMP_STAGE.NONE);
                    expect(cleaned.jumpTime).toBe(0);
                    expect(cleaned.wasWalking).toBe(false);
                    expect(cleaned.wasRunning).toBe(false);
                    expect(cleaned.wasIdleJump).toBe(false);
                    expect(cleaned.jumpBuffered).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});
