# Project Structure

```
├── src/
│   ├── CharacterController.ts    # Entire library in a single file
│   └── _babylonjs-esm-bridge.js  # ESM bridge: re-exports BabylonJS types from @babylonjs/core sub-paths
├── dist/                          # Build output (committed)
│   ├── CharacterController.js     # UMD production (minified)
│   ├── CharacterController.max.js # UMD development (unminified)
│   ├── CharacterController.es.js  # ES module (unminified, tree-shakeable)
│   └── CharacterController.d.ts   # TypeScript declarations (shared)
├── tests/                         # Automated tests (vitest + fast-check)
│   ├── setup.test.ts
│   ├── rotation-convergence.test.ts
│   ├── shortest-arc-direction.test.ts
│   ├── key-release-stops-rotation.test.ts
│   ├── mode0-instant-rotation.test.ts
│   ├── mode-turningoff-mid-rotation.test.ts
│   ├── movement-direction-during-turn.test.ts
│   ├── elastic-springback-step-formula.test.ts
│   ├── elastic-springback-state-tracking.test.ts
│   ├── elastic-springback-modes.test.ts
│   ├── elastic-springback-settings.test.ts
│   ├── esm-import-map-completeness.test.ts
│   ├── esm-output-externals.test.ts
│   ├── esm-output-integration.test.ts
│   ├── package-entry-points.test.ts
│   └── webpack-config-structure.test.ts
├── tst/                           # Manual test pages
│   ├── test.html                  # Default dev server page
│   ├── testAnimationGroup.html/js # Tests with AnimationGroup (.glb)
│   ├── testAnimationRange.html/js # Tests with AnimationRange (.babylon)
│   ├── testCommandControl.html/js # Tests for programmatic control
│   ├── testNPC.html/js            # Tests for NPC (no camera) mode
│   ├── player/                    # Avatar models (.babylon, .glb, .blend)
│   ├── ground/                    # Terrain textures and heightmaps
│   └── sounds/                    # Footstep audio files
├── webpack.es-externals.js        # Import map: BabylonJS type → @babylonjs/core sub-path
├── vitest.config.ts
├── webpack.config.js              # Multi-config: UMD + ESM
├── tsconfig.json
├── package.json
└── changelog.md
```

## Architecture Notes

- The library is a single-file architecture: all classes live in `src/CharacterController.ts`
- Exported classes: `CharacterController`, `ActionData`, `ActionMap`, `CCSettings`
- Internal class: `_Action` (prefixed with underscore, mangled in UMD production)
- Private members use `_` prefix convention (mangled by Terser in UMD production builds only)
- Public API uses setter/getter methods (e.g., `setWalkSpeed()`, `getMode()`)
- No physics engine dependency — uses kinematic equations and `moveWithCollisions()`
- BabylonJS types are imported individually from the `"babylonjs"` package in source
- The build system rewrites these to `@babylonjs/core` sub-paths for the ESM output via a bridge module and import map
