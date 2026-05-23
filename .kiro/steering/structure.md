# Project Structure

```
├── src/
│   └── CharacterController.ts    # Entire library in a single file
├── dist/                          # Build output (committed)
│   ├── CharacterController.js     # Production (minified)
│   ├── CharacterController.max.js # Development (unminified)
│   └── CharacterController.d.ts   # TypeScript declarations
├── tst/                           # Manual test pages
│   ├── test.html                  # Default dev server page
│   ├── testAnimationGroup.html/js # Tests with AnimationGroup (.glb)
│   ├── testAnimationRange.html/js # Tests with AnimationRange (.babylon)
│   ├── testCommandControl.html/js # Tests for programmatic control
│   ├── testNPC.html/js            # Tests for NPC (no camera) mode
│   ├── player/                    # Avatar models (.babylon, .glb, .blend)
│   ├── ground/                    # Terrain textures and heightmaps
│   └── sounds/                    # Footstep audio files
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
