import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 *
 * Property 2: Package entry point consistency
 * After a build, verify that every file path referenced in `main`, `module`,
 * `types`, and `exports` conditions resolves to an existing file in `dist/`.
 */
describe("Property 2: Package entry point consistency", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(projectRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Collect all entry point paths from package.json
  const topLevelPaths: { field: string; filePath: string }[] = [];

  if (pkg.main) topLevelPaths.push({ field: "main", filePath: pkg.main });
  if (pkg.module) topLevelPaths.push({ field: "module", filePath: pkg.module });
  if (pkg.types) topLevelPaths.push({ field: "types", filePath: pkg.types });

  const exportsPaths: { field: string; filePath: string }[] = [];

  if (pkg.exports && pkg.exports["."]) {
    const dot = pkg.exports["."];
    if (dot.types) exportsPaths.push({ field: 'exports["."].types', filePath: dot.types });
    if (dot.import) exportsPaths.push({ field: 'exports["."].import', filePath: dot.import });
    if (dot.require) exportsPaths.push({ field: 'exports["."].require', filePath: dot.require });
  }

  const allPaths = [...topLevelPaths, ...exportsPaths];

  it("all entry point paths resolve to existing files", () => {
    // Property: for any entry point path in package.json, the file must exist
    fc.assert(
      fc.property(
        fc.constantFrom(...allPaths),
        ({ field, filePath }) => {
          // Normalize the path (remove leading ./ if present)
          const resolved = path.resolve(projectRoot, filePath);
          const exists = fs.existsSync(resolved);
          expect(exists, `${field} → "${filePath}" does not resolve to an existing file`).toBe(true);
        }
      ),
      { numRuns: allPaths.length * 5 }
    );
  });

  it("`main` points to a .js file", () => {
    expect(pkg.main).toBeDefined();
    expect(pkg.main).toMatch(/\.js$/);
  });

  it("`module` points to a .js file", () => {
    expect(pkg.module).toBeDefined();
    expect(pkg.module).toMatch(/\.js$/);
  });

  it("`types` points to a .d.ts file", () => {
    expect(pkg.types).toBeDefined();
    expect(pkg.types).toMatch(/\.d\.ts$/);
  });

  it("exports['.'].types resolves to an existing .d.ts file", () => {
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["."].types).toBeDefined();
    expect(pkg.exports["."].types).toMatch(/\.d\.ts$/);
    const resolved = path.resolve(projectRoot, pkg.exports["."].types);
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it("exports['.'].import resolves to an existing file", () => {
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["."].import).toBeDefined();
    const resolved = path.resolve(projectRoot, pkg.exports["."].import);
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it("exports['.'].require resolves to an existing file", () => {
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["."].require).toBeDefined();
    const resolved = path.resolve(projectRoot, pkg.exports["."].require);
    expect(fs.existsSync(resolved)).toBe(true);
  });
});
