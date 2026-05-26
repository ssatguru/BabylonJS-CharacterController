# Implementation Plan: Dual Module Format Support

## Overview

Add ES6 module output to the build pipeline alongside the existing UMD output. This involves creating an import map module, extending the webpack config to produce both UMD and ESM bundles, and updating package.json entry points and peer dependencies.

## Tasks

- [x] 1. Create the ES6 externals import map module
  - [x] 1.1 Create `webpack.es-externals.js` with the BabylonJS type-to-subpath mapping
    - Create a new file `webpack.es-externals.js` at the project root
    - Define a `BABYLONJS_ES6_MAP` object mapping each of the 25 BabylonJS type names imported in `src/CharacterController.ts` to their corresponding `@babylonjs/core` sub-path
    - Export the map and a helper function that webpack's externals can call to resolve a requested import
    - The map must cover: Skeleton, ArcRotateCamera, Vector3, Mesh, Node, Scene, Ray, PickingInfo, AnimationGroup, TransformNode, TargetedAnimation, Matrix, DeepImmutable, AbstractMesh, PlaySoundAction, InstancedMesh, Sound, AnimationRange, Animatable, AnimationEvent, int, LinesMesh, MeshBuilder, Color3, Quaternion
    - _Requirements: 2.1, 2.2, 5.2_

  - [x] 1.2 Write property test for import map completeness
    - **Property 1: Import map completeness**
    - Parse `src/CharacterController.ts` imports and verify every named import from `"babylonjs"` has a corresponding entry in the import map
    - Verify each map value matches the pattern `@babylonjs/core/...`
    - **Validates: Requirements 2.1, 2.2**

- [x] 2. Extend webpack configuration for dual output
  - [x] 2.1 Refactor `webpack.config.js` to export an array of configurations
    - Convert the existing single-config export to an array with two entries
    - First entry: the existing UMD configuration (unchanged behavior)
    - Second entry: new ESM configuration with:
      - `experiments: { outputModule: true }`
      - `output.library.type: "module"`
      - `output.module: true`
      - `output.filename: "CharacterController.es.js"`
      - `externalsType: "module"`
      - `externals`: function using the import map from `webpack.es-externals.js` to rewrite `babylonjs` imports to `@babylonjs/core` sub-paths
      - No TerserPlugin (ESM consumers tree-shake themselves)
      - No declaration generation (shared with UMD output)
    - Ensure UMD config still produces `CharacterController.js` (prod) and `CharacterController.max.js` (dev)
    - Ensure UMD config still generates `CharacterController.d.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 5.4_

  - [x] 2.2 Write unit tests for webpack configuration structure
    - Verify UMD config has `libraryTarget: "umd"` and correct externals shape
    - Verify ESM config has `experiments.outputModule: true` and `output.library.type: "module"`
    - Verify ESM config uses function-based externals
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 3.1, 3.2_

- [x] 3. Update package.json entry points and peer dependencies
  - [x] 3.1 Add `module`, `exports`, `peerDependencies`, and `peerDependenciesMeta` fields to `package.json`
    - Add `"module": "dist/CharacterController.es.js"`
    - Add `"exports"` field with `"."` entry containing `types`, `import`, and `require` conditions
    - Add `"peerDependencies"` declaring both `babylonjs` and `@babylonjs/core` at `^8.0.0`
    - Add `"peerDependenciesMeta"` marking both as optional
    - Ensure `"main"` and `"types"` fields remain unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4_

  - [x] 3.2 Write property test for package entry point consistency
    - **Property 2: Package entry point consistency**
    - After a build, verify that every file path referenced in `main`, `module`, `types`, and `exports` conditions resolves to an existing file in `dist/`
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 4. Checkpoint - Verify build produces both outputs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integration verification
  - [x] 5.1 Write integration tests verifying ESM output correctness
    - Verify `dist/CharacterController.es.js` exists after build
    - Verify ESM output contains `import` statements from `@babylonjs/core` sub-paths
    - Verify ESM output does NOT reference the monolithic `babylonjs` package
    - Verify UMD output (`dist/CharacterController.js`) still references `BABYLON` global
    - Verify `dist/CharacterController.d.ts` exists
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 3.3, 3.5_

  - [x] 5.2 Write property test for ESM output external references
    - **Property 3: ESM output contains only external references to @babylonjs/core**
    - Parse all import statements in `dist/CharacterController.es.js`
    - Verify every import source matches `@babylonjs/core/*` pattern
    - Verify no import references `babylonjs` (without the `@` prefix)
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The source file (`src/CharacterController.ts`) requires no modifications — all changes are in build config and package metadata
- The existing UMD build behavior must remain identical (backward compatibility)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["1.2", "2.2", "3.2"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2"] }
  ]
}
```
