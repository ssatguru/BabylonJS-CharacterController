import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

describe("Test framework setup", () => {
  it("vitest runs correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("fast-check is available", () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      })
    );
  });
});
