import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * **Validates: Requirements 2.1, 2.3, 2.4**
 *
 * Property 3: ESM output contains only external references to @babylonjs/core
 *
 * For any import statement in the ESM bundle output
 * (`dist/CharacterController.es.js`), the import source SHALL match
 * the pattern `@babylonjs/core/*` and SHALL NOT reference the
 * monolithic `babylonjs` package.
 */

// --- Helpers ---

function extractEsmImportSources(): string[] {
  const esmPath = path.resolve(
    __dirname,
    "../dist/CharacterController.es.js"
  );
  const content = fs.readFileSync(esmPath, "utf-8");

  // Match all import statements and extract the source path
  const importSourceRegex = /import\s+.+\s+from\s+["']([^"']+)["']/g;
  const sources: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = importSourceRegex.exec(content)) !== null) {
    sources.push(match[1]);
  }

  return sources;
}

// --- Tests ---

describe("ESM output external references (Property 3)", () => {
  const importSources = extractEsmImportSources();

  it("ESM output has at least one import statement", () => {
    expect(importSources.length).toBeGreaterThan(0);
  });

  /**
   * **Validates: Requirements 2.1, 2.3**
   *
   * Every import source in the ESM output must match the
   * `@babylonjs/core/...` pattern.
   */
  it("every import source matches @babylonjs/core/* pattern", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...importSources),
        (source) => {
          expect(source).toMatch(/^@babylonjs\/core\//);
        }
      ),
      { numRuns: importSources.length }
    );
  });

  /**
   * **Validates: Requirements 2.3, 2.4**
   *
   * No import source in the ESM output references the monolithic
   * `babylonjs` package (without the `@` prefix).
   */
  it("no import source equals the monolithic 'babylonjs' package", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...importSources),
        (source) => {
          expect(source).not.toMatch(/^babylonjs(\/|$)/);
        }
      ),
      { numRuns: importSources.length }
    );
  });
});
