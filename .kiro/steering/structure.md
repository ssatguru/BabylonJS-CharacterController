# Project Structure

```
├── src/
│   └── CharacterController.ts    # Entire library in a single file
├── dist/                          # Build output (committed)
│   ├── CharacterController.js     # Production (minified)
│   ├── CharacterController.max.js # Development (unminified)
│   └── CharacterController.d.ts   # TypeScript declarations
├── tests/                         # Automated property-based tests (vitest + fast-check)
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
│   └── elastic-springback-settings.test.ts
├── tst/                           # Manual test pages
│   ├── test.html                  # Default dev server page
│   ├── testAnimationGroup.html/js # Tests with AnimationGroup (.glb)
│   ├── testAnimationRange.html/js # Tests with AnimationRange (.babylon)
│   ├── testCommandControl.html/js # Tests for programmatic control
│   ├── testNPC.html/js            # Tests for NPC (no camera) mode
│   ├── player/                    # Avatar models (.babylon, .glb, .blend)
│   ├── ground/                    # Terrain textures and heightmaps
│   └── sounds/                    # Footstep audio files
├── vitest.config.ts
├── webpack.config.js
├── tsconfig.json
├── package.json
└── changelog.md
```

## Architecture Notes

- The library is a single-file architecture: all classes live in `src/CharacterController.ts`
- Exported classes: `CharacterController`, `ActionData`, `ActionMap`, `CCSettings`
- Internal class: `_Action` (prefixed with underscore, mangled in production)
- Private members use `_` prefix convention (mangled by Terser in production builds)
- Public API uses setter/getter methods (e.g., `setWalkSpeed()`, `getMode()`)
- No physics engine dependency — uses kinematic equations and `moveWithCollisions()`
- BabylonJS types are imported individually from the `"babylonjs"` package
