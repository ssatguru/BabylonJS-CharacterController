import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * **Validates: Requirements 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 3.3, 3.5**
 *
 * Integration tests verifying ESM and UMD output correctness after build.
 * These tests read the actual dist/ files and verify their content.
 */
describe("ESM output integration", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const distDir = path.join(projectRoot, "dist");

  const esmPath = path.join(distDir, "CharacterController.es.js");
  const umdPath = path.join(distDir, "CharacterController.js");
  const dtsPath = path.join(distDir, "CharacterController.d.ts");

  describe("ESM bundle existence and format", () => {
    it("dist/CharacterController.es.js exists", () => {
      expect(fs.existsSync(esmPath)).toBe(true);
    });

    it("ESM output contains import statements from @babylonjs/core sub-paths", () => {
      const content = fs.readFileSync(esmPath, "utf-8");
      // Match import statements referencing @babylonjs/core sub-paths
      const importRegex = /import\s+.+\s+from\s+["']@babylonjs\/core\/.+["']/g;
      const matches = content.match(importRegex);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(0);
    });

    it("ESM output does NOT reference the monolithic babylonjs package", () => {
      const content = fs.readFileSync(esmPath, "utf-8");
      // Check for imports from "babylonjs" (without the @ prefix)
      // This regex matches import/require of "babylonjs" but NOT "@babylonjs/core"
      const monolithicImportRegex = /from\s+["']babylonjs["']/g;
      const monolithicRequireRegex = /require\s*\(\s*["']babylonjs["']\s*\)/g;
      expect(content.match(monolithicImportRegex)).toBeNull();
      expect(content.match(monolithicRequireRegex)).toBeNull();
    });

    it("all ESM import sources match @babylonjs/core/* pattern", () => {
      const content = fs.readFileSync(esmPath, "utf-8");
      // Extract all import source paths
      const importSourceRegex = /from\s+["']([^"']+)["']/g;
      let match: RegExpExecArray | null;
      const sources: string[] = [];
      while ((match = importSourceRegex.exec(content)) !== null) {
        sources.push(match[1]);
      }
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source).toMatch(/^@babylonjs\/core\//);
      }
    });
  });

  describe("UMD bundle backward compatibility", () => {
    it("dist/CharacterController.js exists", () => {
      expect(fs.existsSync(umdPath)).toBe(true);
    });

    it("UMD output references BABYLON global", () => {
      const content = fs.readFileSync(umdPath, "utf-8");
      // UMD wrapper maps babylonjs external to the BABYLON global (t.BABYLON or root.BABYLON)
      expect(content).toContain("BABYLON");
    });
  });

  describe("TypeScript declarations", () => {
    it("dist/CharacterController.d.ts exists", () => {
      expect(fs.existsSync(dtsPath)).toBe(true);
    });
  });
});
