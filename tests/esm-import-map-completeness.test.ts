import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * **Validates: Requirements 2.1, 2.2**
 *
 * Property 1: Import map completeness
 *
 * For any named import of a BabylonJS type in the source file
 * `src/CharacterController.ts`, the import map SHALL contain a
 * corresponding entry mapping that type name to a valid
 * `@babylonjs/core` sub-path.
 */

// --- Helpers ---

function extractBabylonjsImports(): string[] {
  const srcPath = path.resolve(__dirname, "../src/CharacterController.ts");
  const source = fs.readFileSync(srcPath, "utf-8");

  // Match the import block: import { ... } from "babylonjs";
  const importBlockRegex = /import\s*\{([^}]+)\}\s*from\s*["']babylonjs["']/g;
  const names: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = importBlockRegex.exec(source)) !== null) {
    const block = match[1];
    for (const token of block.split(",")) {
      const trimmed = token.trim();
      if (trimmed.length > 0) {
        names.push(trimmed);
      }
    }
  }

  return names;
}

function loadImportMap(): Record<string, string> {
  const mapPath = path.resolve(__dirname, "../webpack.es-externals.js");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BABYLONJS_ES6_MAP } = require(mapPath);
  return BABYLONJS_ES6_MAP;
}

// --- Tests ---

describe("ESM import map completeness (Property 1)", () => {
  const sourceImports = extractBabylonjsImports();
  const importMap = loadImportMap();

  it("source file has at least one babylonjs import", () => {
    expect(sourceImports.length).toBeGreaterThan(0);
  });

  /**
   * **Validates: Requirements 2.1, 2.2**
   *
   * For every named import from "babylonjs" in the source,
   * the import map must contain a corresponding key.
   */
  it("every source import has a corresponding entry in the import map", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...sourceImports),
        (importName) => {
          expect(importMap).toHaveProperty(importName);
        }
      ),
      { numRuns: sourceImports.length }
    );
  });

  /**
   * **Validates: Requirements 2.1, 2.2**
   *
   * Every value in the import map must be a valid @babylonjs/core sub-path.
   */
  it("every import map value starts with @babylonjs/core/", () => {
    const mapEntries = Object.entries(importMap);

    fc.assert(
      fc.property(
        fc.constantFrom(...mapEntries),
        ([typeName, subPath]) => {
          expect(subPath).toMatch(/^@babylonjs\/core\//);
        }
      ),
      { numRuns: mapEntries.length }
    );
  });
});
