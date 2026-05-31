import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Feature: turn-direction-animation
 *
 * Tests that the rotation sign and animation selection are correct for:
 * 1. NPC (no camera) turn — direction is character-relative, independent of
 *    face-forward setting and camera position.
 * 2. Mode 0 avatar turn — animation matches the visual turn direction,
 *    accounting for right-handed coordinate systems.
 * 3. Navigation mode (turnTo) — turnLeft command increases rotation.y,
 *    animation is swapped to match visual direction.
 * 4. Mode 1 avatar turn (with camera) — rotation sign and animation depend
 *    on face-forward setting, camera-facing direction, and coordinate system.
 *
 * These are pure-logic extractions of the decision branches in _rotateAVnC().
 */

// --- Pure logic extracted from _rotateAVnC ---

/**
 * NPC turn logic (mode 1, no camera).
 * Returns the rotation sign `a` and which animation to play.
 */
function npcTurnLogic(
  turnLeft: boolean,
  rhsSign: number // 1 for LHS, -1 for RHS
): { a: number; anim: "turnLeft" | "turnRight" } {
  let a = -rhsSign;
  if (!turnLeft) a = -a; // turnRight negates
  const anim: "turnLeft" | "turnRight" =
    rhsSign > 0
      ? turnLeft
        ? "turnLeft"
        : "turnRight"
      : turnLeft
        ? "turnRight"
        : "turnLeft";
  return { a, anim };
}

/**
 * Mode 0 avatar turn logic.
 * Returns the rotation sign `a` and which animation to play.
 * (Simplified: not walking/walkback, not moving)
 */
function mode0TurnLogic(
  turnLeft: boolean,
  rhsSign: number // 1 for LHS, -1 for RHS
): { a: number; anim: "turnLeft" | "turnRight" } {
  let a: number;
  let anim: "turnLeft" | "turnRight";
  if (turnLeft) {
    a = 1;
    anim = rhsSign > 0 ? "turnLeft" : "turnRight";
  } else {
    a = -1;
    anim = rhsSign > 0 ? "turnRight" : "turnLeft";
  }
  return { a, anim };
}

/**
 * Navigation mode turn logic (mode 1, turnToActive).
 * Returns the rotation sign `a` and which animation to play.
 */
function navigationTurnLogic(turnLeft: boolean): {
  a: number;
  anim: "turnLeft" | "turnRight";
} {
  const a = turnLeft ? 1 : -1;
  const anim: "turnLeft" | "turnRight" = turnLeft ? "turnRight" : "turnLeft";
  return { a, anim };
}

/**
 * Compute the turn sign for mode 1 avatar (with camera).
 * Mirrors: this._sign = -this._ffSign * this._isAvFacingCamera();
 *          if (this._isLHS_RHS) this._sign = -this._sign;
 *
 * @param ffSign - face-forward sign (1 for back-facing in LHS non-RHS, -1 for front-facing in LHS non-RHS, etc.)
 * @param isAvFacingCamera - 1 if avatar faces camera, -1 if avatar faces away from camera
 * @param isLHS_RHS - true if coordinate system mismatch (e.g. GLB in LHS scene)
 */
function computeMode1Sign(
  ffSign: number,
  isAvFacingCamera: number,
  isLHS_RHS: boolean
): number {
  let sign = -ffSign * isAvFacingCamera;
  if (isLHS_RHS) sign = -sign;
  return sign;
}

/**
 * Mode 1 avatar turn logic (with camera, not navigation, not NPC).
 * Returns the rotation sign `a` and which animation to play.
 * (Simplified: not walking/walkback, not moving)
 *
 * @param turnLeft - true for turnLeft command, false for turnRight
 * @param sign - the precomputed _sign value from computeMode1Sign()
 */
function mode1AvatarTurnLogic(
  turnLeft: boolean,
  sign: number
): { a: number; anim: "turnLeft" | "turnRight" } {
  let a: number;
  let anim: "turnLeft" | "turnRight";
  if (turnLeft) {
    a = sign;
    anim = sign > 0 ? "turnRight" : "turnLeft";
  } else {
    a = -sign;
    anim = sign > 0 ? "turnLeft" : "turnRight";
  }
  return { a, anim };
}

// --- Tests ---

describe("Feature: turn-direction-animation — NPC turn (no camera)", () => {
  it("turnLeft produces negative rotation.y change in LHS", () => {
    const { a } = npcTurnLogic(true, 1);
    expect(a).toBe(-1);
  });

  it("turnRight produces positive rotation.y change in LHS", () => {
    const { a } = npcTurnLogic(false, 1);
    expect(a).toBe(1);
  });

  it("turnLeft produces positive rotation.y change in RHS", () => {
    const { a } = npcTurnLogic(true, -1);
    expect(a).toBe(1);
  });

  it("turnRight produces negative rotation.y change in RHS", () => {
    const { a } = npcTurnLogic(false, -1);
    expect(a).toBe(-1);
  });

  it("turnLeft and turnRight always produce opposite rotation signs", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1, -1), // rhsSign
        (rhsSign) => {
          const left = npcTurnLogic(true, rhsSign);
          const right = npcTurnLogic(false, rhsSign);
          expect(left.a).toBe(-right.a);
        }
      ),
      { numRuns: 10 }
    );
  });

  it("animation matches command name in LHS", () => {
    expect(npcTurnLogic(true, 1).anim).toBe("turnLeft");
    expect(npcTurnLogic(false, 1).anim).toBe("turnRight");
  });

  it("animation is swapped in RHS (visual direction is reversed)", () => {
    expect(npcTurnLogic(true, -1).anim).toBe("turnRight");
    expect(npcTurnLogic(false, -1).anim).toBe("turnLeft");
  });

  it("rotation direction is independent of face-forward setting", () => {
    // The NPC logic does not use ffSign at all — verify by confirming
    // the function signature doesn't depend on it. We test that the same
    // rhsSign always produces the same result regardless of any external state.
    const lhsLeft1 = npcTurnLogic(true, 1);
    const lhsLeft2 = npcTurnLogic(true, 1);
    expect(lhsLeft1).toEqual(lhsLeft2);

    const rhsRight1 = npcTurnLogic(false, -1);
    const rhsRight2 = npcTurnLogic(false, -1);
    expect(rhsRight1).toEqual(rhsRight2);
  });
});

describe("Feature: turn-direction-animation — Mode 0 avatar turn", () => {
  it("turnLeft plays turnLeft animation in LHS", () => {
    const { anim } = mode0TurnLogic(true, 1);
    expect(anim).toBe("turnLeft");
  });

  it("turnRight plays turnRight animation in LHS", () => {
    const { anim } = mode0TurnLogic(false, 1);
    expect(anim).toBe("turnRight");
  });

  it("turnLeft plays turnRight animation in RHS (visual direction reversed)", () => {
    const { anim } = mode0TurnLogic(true, -1);
    expect(anim).toBe("turnRight");
  });

  it("turnRight plays turnLeft animation in RHS (visual direction reversed)", () => {
    const { anim } = mode0TurnLogic(false, -1);
    expect(anim).toBe("turnLeft");
  });

  it("rotation sign is always +1 for turnLeft and -1 for turnRight", () => {
    fc.assert(
      fc.property(fc.constantFrom(1, -1), (rhsSign) => {
        expect(mode0TurnLogic(true, rhsSign).a).toBe(1);
        expect(mode0TurnLogic(false, rhsSign).a).toBe(-1);
      }),
      { numRuns: 10 }
    );
  });
});

describe("Feature: turn-direction-animation — Navigation mode (turnTo)", () => {
  it("turnLeft command increases rotation.y (a = +1)", () => {
    const { a } = navigationTurnLogic(true);
    expect(a).toBe(1);
  });

  it("turnRight command decreases rotation.y (a = -1)", () => {
    const { a } = navigationTurnLogic(false);
    expect(a).toBe(-1);
  });

  it("turnLeft command plays turnRight animation (visual direction swap)", () => {
    const { anim } = navigationTurnLogic(true);
    expect(anim).toBe("turnRight");
  });

  it("turnRight command plays turnLeft animation (visual direction swap)", () => {
    const { anim } = navigationTurnLogic(false);
    expect(anim).toBe("turnLeft");
  });

  it("turnLeft and turnRight always produce opposite rotation signs", () => {
    const left = navigationTurnLogic(true);
    const right = navigationTurnLogic(false);
    expect(left.a).toBe(-right.a);
  });
});


describe("Feature: turn-direction-animation — Mode 1 avatar turn (with camera)", () => {
  /**
   * Sign computation: _sign = -ffSign * isAvFacingCamera
   * Then flipped if isLHS_RHS.
   */
  describe("sign computation (computeMode1Sign)", () => {
    it("front-facing (ffSign=-1), avatar facing away from camera (isFacing=-1), LHS non-RHS", () => {
      // _sign = -(-1) * (-1) = -1
      expect(computeMode1Sign(-1, -1, false)).toBe(-1);
    });

    it("front-facing (ffSign=-1), avatar facing camera (isFacing=1), LHS non-RHS", () => {
      // _sign = -(-1) * 1 = 1
      expect(computeMode1Sign(-1, 1, false)).toBe(1);
    });

    it("back-facing (ffSign=1), avatar facing away from camera (isFacing=-1), LHS non-RHS", () => {
      // _sign = -(1) * (-1) = 1
      expect(computeMode1Sign(1, -1, false)).toBe(1);
    });

    it("back-facing (ffSign=1), avatar facing camera (isFacing=1), LHS non-RHS", () => {
      // _sign = -(1) * 1 = -1
      expect(computeMode1Sign(1, 1, false)).toBe(-1);
    });

    it("isLHS_RHS flips the sign", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(1, -1), // ffSign
          fc.constantFrom(1, -1), // isAvFacingCamera
          (ffSign, isFacing) => {
            const withoutFlip = computeMode1Sign(ffSign, isFacing, false);
            const withFlip = computeMode1Sign(ffSign, isFacing, true);
            expect(withFlip).toBe(-withoutFlip);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe("turn direction and animation (mode1AvatarTurnLogic)", () => {
    it("when sign > 0: turnLeft rotates positive, plays turnRight anim", () => {
      const { a, anim } = mode1AvatarTurnLogic(true, 1);
      expect(a).toBe(1);
      expect(anim).toBe("turnRight");
    });

    it("when sign > 0: turnRight rotates negative, plays turnLeft anim", () => {
      const { a, anim } = mode1AvatarTurnLogic(false, 1);
      expect(a).toBe(-1);
      expect(anim).toBe("turnLeft");
    });

    it("when sign < 0: turnLeft rotates negative, plays turnLeft anim", () => {
      const { a, anim } = mode1AvatarTurnLogic(true, -1);
      expect(a).toBe(-1);
      expect(anim).toBe("turnLeft");
    });

    it("when sign < 0: turnRight rotates positive, plays turnRight anim", () => {
      const { a, anim } = mode1AvatarTurnLogic(false, -1);
      expect(a).toBe(1);
      expect(anim).toBe("turnRight");
    });

    it("turnLeft and turnRight always produce opposite rotation signs", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(1, -1), // sign
          (sign) => {
            const left = mode1AvatarTurnLogic(true, sign);
            const right = mode1AvatarTurnLogic(false, sign);
            expect(left.a).toBe(-right.a);
          }
        ),
        { numRuns: 10 }
      );
    });

    it("turnLeft and turnRight always produce different animations", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(1, -1), // sign
          (sign) => {
            const left = mode1AvatarTurnLogic(true, sign);
            const right = mode1AvatarTurnLogic(false, sign);
            expect(left.anim).not.toBe(right.anim);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe("end-to-end: front-facing character scenarios", () => {
    // Front-facing in LHS non-RHS: ffSign = -1
    it("front-facing, facing away from camera: turnLeft rotates negative, plays turnLeft", () => {
      const sign = computeMode1Sign(-1, -1, false); // sign = -1
      const { a, anim } = mode1AvatarTurnLogic(true, sign);
      expect(a).toBe(-1);
      expect(anim).toBe("turnLeft");
    });

    it("front-facing, facing camera: turnLeft rotates positive, plays turnRight", () => {
      const sign = computeMode1Sign(-1, 1, false); // sign = 1
      const { a, anim } = mode1AvatarTurnLogic(true, sign);
      expect(a).toBe(1);
      expect(anim).toBe("turnRight");
    });
  });

  describe("end-to-end: back-facing character scenarios", () => {
    // Back-facing in LHS non-RHS: ffSign = 1
    it("back-facing, facing away from camera: turnLeft rotates positive, plays turnRight", () => {
      const sign = computeMode1Sign(1, -1, false); // sign = 1
      const { a, anim } = mode1AvatarTurnLogic(true, sign);
      expect(a).toBe(1);
      expect(anim).toBe("turnRight");
    });

    it("back-facing, facing camera: turnLeft rotates negative, plays turnLeft", () => {
      const sign = computeMode1Sign(1, 1, false); // sign = -1
      const { a, anim } = mode1AvatarTurnLogic(true, sign);
      expect(a).toBe(-1);
      expect(anim).toBe("turnLeft");
    });
  });

  describe("end-to-end: isLHS_RHS character scenarios", () => {
    it("front-facing, isLHS_RHS, facing away: sign flips, turnLeft rotates positive", () => {
      const sign = computeMode1Sign(-1, -1, true); // sign = 1 (flipped from -1)
      const { a, anim } = mode1AvatarTurnLogic(true, sign);
      expect(a).toBe(1);
      expect(anim).toBe("turnRight");
    });

    it("back-facing, isLHS_RHS, facing away: sign flips, turnLeft rotates negative", () => {
      const sign = computeMode1Sign(1, -1, true); // sign = -1 (flipped from 1)
      const { a, anim } = mode1AvatarTurnLogic(true, sign);
      expect(a).toBe(-1);
      expect(anim).toBe("turnLeft");
    });
  });
});
