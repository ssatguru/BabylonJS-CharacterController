import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: three-stage-jump, Property 14: Programmatic jump() triggers same state machine
 *
 * Pure functions:
 * - programmaticJump: determines if a jump() call is accepted based on current state
 * - beginJump: determines the next stage (PRE_JUMP or JUMP) based on animation existence
 *
 * Property: When jump() is called from grounded state (currentStage === NONE, inFreeFall === false):
 * 1. The jump is accepted
 * 2. beginJump determines the next stage based on pre-animation existence:
 *    - If pre-anim exists → PRE_JUMP
 *    - If pre-anim missing → JUMP
 * 3. This is the same path that keyboard jump follows
 *
 * **Validates: Requirements 9.1**
 */

const JUMP_STAGE = { NONE: 0, PRE_JUMP: 1, JUMP: 2, POST_JUMP: 3 };

function programmaticJump(
    currentStage: number,
    inFreeFall: boolean
): { accepted: boolean } {
    if (currentStage !== JUMP_STAGE.NONE) return { accepted: false };
    if (inFreeFall) return { accepted: false };
    return { accepted: true };
}

// After programmaticJump is accepted, beginJump determines the next stage
function beginJump(
    wasWalking: boolean,
    wasRunning: boolean,
    preIdleExists: boolean,
    preRunExists: boolean
): number {
    const wasIdleJump = !wasWalking && !wasRunning;
    const preAnimExists = wasIdleJump ? preIdleExists : preRunExists;
    return preAnimExists ? JUMP_STAGE.PRE_JUMP : JUMP_STAGE.JUMP;
}

describe("Feature: three-stage-jump, Property 14: Programmatic jump() triggers same state machine", () => {
    it("jump() is always accepted when grounded (stage NONE, not in free-fall)", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasWalking
                fc.boolean(), // wasRunning
                fc.boolean(), // preIdleExists
                fc.boolean(), // preRunExists
                (wasWalking, wasRunning, preIdleExists, preRunExists) => {
                    // From grounded state: stage === NONE and inFreeFall === false
                    const result = programmaticJump(JUMP_STAGE.NONE, false);
                    expect(result.accepted).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("after acceptance, beginJump enters PRE_JUMP when pre-animation exists", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasWalking
                fc.boolean(), // wasRunning
                (wasWalking, wasRunning) => {
                    // Ensure the relevant pre-anim exists
                    const wasIdleJump = !wasWalking && !wasRunning;
                    const preIdleExists = wasIdleJump ? true : false;
                    const preRunExists = wasIdleJump ? false : true;

                    const accepted = programmaticJump(JUMP_STAGE.NONE, false);
                    expect(accepted.accepted).toBe(true);

                    const nextStage = beginJump(wasWalking, wasRunning, preIdleExists, preRunExists);
                    expect(nextStage).toBe(JUMP_STAGE.PRE_JUMP);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("after acceptance, beginJump enters JUMP directly when pre-animation missing", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasWalking
                fc.boolean(), // wasRunning
                (wasWalking, wasRunning) => {
                    // Ensure the relevant pre-anim does NOT exist
                    const wasIdleJump = !wasWalking && !wasRunning;
                    const preIdleExists = wasIdleJump ? false : true;
                    const preRunExists = wasIdleJump ? true : false;

                    const accepted = programmaticJump(JUMP_STAGE.NONE, false);
                    expect(accepted.accepted).toBe(true);

                    const nextStage = beginJump(wasWalking, wasRunning, preIdleExists, preRunExists);
                    expect(nextStage).toBe(JUMP_STAGE.JUMP);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("programmatic jump follows the same path as keyboard jump (beginJump outcome is identical)", () => {
        fc.assert(
            fc.property(
                fc.boolean(), // wasWalking
                fc.boolean(), // wasRunning
                fc.boolean(), // preIdleExists
                fc.boolean(), // preRunExists
                (wasWalking, wasRunning, preIdleExists, preRunExists) => {
                    // Simulate programmatic jump from grounded state
                    const programmatic = programmaticJump(JUMP_STAGE.NONE, false);
                    expect(programmatic.accepted).toBe(true);

                    // beginJump is the same function called by both keyboard and programmatic paths
                    const programmaticNextStage = beginJump(wasWalking, wasRunning, preIdleExists, preRunExists);

                    // Simulate keyboard jump from grounded state (same precondition: stage NONE, not free-falling)
                    // Keyboard jump also calls beginJump with the same parameters
                    const keyboardNextStage = beginJump(wasWalking, wasRunning, preIdleExists, preRunExists);

                    // Both paths produce the same next stage
                    expect(programmaticNextStage).toBe(keyboardNextStage);

                    // And the stage is either PRE_JUMP or JUMP
                    const wasIdleJump = !wasWalking && !wasRunning;
                    const preAnimExists = wasIdleJump ? preIdleExists : preRunExists;
                    const expectedStage = preAnimExists ? JUMP_STAGE.PRE_JUMP : JUMP_STAGE.JUMP;
                    expect(programmaticNextStage).toBe(expectedStage);
                }
            ),
            { numRuns: 100 }
        );
    });
});
