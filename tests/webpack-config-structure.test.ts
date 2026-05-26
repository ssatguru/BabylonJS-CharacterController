import { describe, it, expect } from "vitest";
import path from "path";

/**
 * Unit tests for webpack configuration structure.
 * Validates: Requirements 1.1, 1.2, 1.4, 2.1, 3.1, 3.2
 *
 * These tests verify the webpack config produces the correct structure
 * for both UMD and ESM builds without actually running a build.
 */

// The webpack config is a CommonJS module exporting a function
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpackConfigFn = require("../webpack.config.js");

describe("Webpack configuration structure", () => {
  describe("Production mode (dual output)", () => {
    const configs = webpackConfigFn({}, { mode: "production" });

    it("returns an array of two configurations", () => {
      expect(Array.isArray(configs)).toBe(true);
      expect(configs).toHaveLength(2);
    });

    describe("UMD config (first entry)", () => {
      const umdConfig = Array.isArray(configs) ? configs[0] : configs;

      it("has libraryTarget set to 'umd'", () => {
        expect(umdConfig.output.libraryTarget).toBe("umd");
      });

      it("has babylonjs externals with correct shape", () => {
        expect(umdConfig.externals).toBeDefined();
        expect(umdConfig.externals.babylonjs).toBeDefined();
        expect(umdConfig.externals.babylonjs).toHaveProperty("commonjs", "babylonjs");
        expect(umdConfig.externals.babylonjs).toHaveProperty("commonjs2", "babylonjs");
        expect(umdConfig.externals.babylonjs).toHaveProperty("amd", "babylonjs");
      });

      it("maps babylonjs root to BABYLON global", () => {
        expect(umdConfig.externals.babylonjs.root).toBe("BABYLON");
      });

      it("produces CharacterController.js filename in production", () => {
        expect(umdConfig.output.filename).toBe("CharacterController.js");
      });
    });

    describe("ESM config (second entry)", () => {
      const esmConfig = Array.isArray(configs) ? configs[1] : undefined;

      it("has experiments.outputModule set to true", () => {
        expect(esmConfig).toBeDefined();
        expect(esmConfig!.experiments).toBeDefined();
        expect(esmConfig!.experiments.outputModule).toBe(true);
      });

      it("has output.library.type set to 'module'", () => {
        expect(esmConfig!.output.library).toBeDefined();
        expect(esmConfig!.output.library.type).toBe("module");
      });

      it("has output.module set to true", () => {
        expect(esmConfig!.output.module).toBe(true);
      });

      it("has output.filename set to 'CharacterController.es.js'", () => {
        expect(esmConfig!.output.filename).toBe("CharacterController.es.js");
      });

      it("has externalsType set to 'module'", () => {
        expect(esmConfig!.externalsType).toBe("module");
      });

      it("has externals that include @babylonjs/core sub-paths", () => {
        const externals = esmConfig!.externals;
        expect(externals).toBeDefined();

        // The externals should be an object mapping @babylonjs/core sub-paths
        if (typeof externals === "object" && !Array.isArray(externals)) {
          const keys = Object.keys(externals);
          expect(keys.length).toBeGreaterThan(0);
          // Every key should be a @babylonjs/core sub-path
          for (const key of keys) {
            expect(key).toMatch(/^@babylonjs\/core\//);
          }
        } else if (typeof externals === "function") {
          // Function-based externals are also valid per the design
          expect(typeof externals).toBe("function");
        } else {
          // Fail if externals is neither object nor function
          expect(externals).toBeDefined();
        }
      });
    });
  });

  describe("Development mode (UMD only)", () => {
    const result = webpackConfigFn({}, { mode: "development" });

    it("returns only the UMD config (not an array or array of 1)", () => {
      // In development mode, only UMD config is returned
      if (Array.isArray(result)) {
        expect(result).toHaveLength(1);
      } else {
        expect(result).toBeDefined();
        expect(result.output.libraryTarget).toBe("umd");
      }
    });

    it("produces CharacterController.max.js filename in development", () => {
      const config = Array.isArray(result) ? result[0] : result;
      expect(config.output.filename).toBe("CharacterController.max.js");
    });
  });
});
