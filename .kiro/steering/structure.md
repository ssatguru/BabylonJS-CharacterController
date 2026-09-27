# Project Structure

```
├── src/
│   ├── CharacterController.ts    # Core library: CharacterController, ActionData, ActionMap, CCSettings, _Action, pure navigation helpers
│   ├── xr/                        # WebXR support modules (imported by CharacterController.ts)
│   │   ├── XRController.ts         # BabylonJS-facing XR glue: session lifecycle, stick sampling, camera orbit/dolly/follow, controller binding, ray mgmt, preserve/restore
│   │   ├── XRLocomotion.ts         # Pure: first/third-person state machine + mapStickToIntent + MoveIntent/StickInput/LocomotionMode/ToggleResult types
│   │   ├── XRSupport.ts            # Pure: detectXRSupport + computeXRSupportResult + XRSupportState
│   │   └── XRInputMapping.ts       # Pure: BindableAction/BindableInput enums, XRInputMapping, DEFAULT_XR_INPUT_MAPPING, merge/validate, WebXR component-id constants
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
│   ├── turn-direction-animation.test.ts
│   ├── elastic-springback-step-formula.test.ts
│   ├── elastic-springback-state-tracking.test.ts
│   ├── elastic-springback-modes.test.ts
│   ├── elastic-springback-settings.test.ts
│   ├── elastic-springback-ellipsoid-clearance-bug.test.ts
│   ├── elastic-springback-ellipsoid-preservation.test.ts
│   ├── moveto-distance-reduction.test.ts
│   ├── moveto-arrival-detection.test.ts
│   ├── moveto-obstruction-detection.test.ts
│   ├── moveto-follow-resume.test.ts
│   ├── moveto-manual-cancel.test.ts
│   ├── moveto-facing-convergence.test.ts
│   ├── moveto-turnto-independence.test.ts
│   ├── turnto-shortest-arc.test.ts
│   ├── turnto-angular-arrival.test.ts
│   ├── turnto-manual-cancel.test.ts
│   ├── navigation-parameter-clamping.test.ts
│   ├── navigation-keyboard-cancel.test.ts
│   ├── navigation-keyboard-disabled.test.ts
│   ├── navigation-stop-noop.test.ts
│   ├── three-stage-jump-anim-duration.test.ts
│   ├── three-stage-jump-pre-jump-grounded.test.ts
│   ├── three-stage-jump-pre-jump-completion.test.ts
│   ├── three-stage-jump-pre-jump-skip.test.ts
│   ├── three-stage-jump-backward-compat.test.ts
│   ├── three-stage-jump-displacement-formula.test.ts
│   ├── three-stage-jump-speed-components.test.ts
│   ├── three-stage-jump-landing-detection.test.ts
│   ├── three-stage-jump-post-jump-entry.test.ts
│   ├── three-stage-jump-post-jump-skip.test.ts
│   ├── three-stage-jump-input-ignored.test.ts
│   ├── three-stage-jump-movement-ignored.test.ts
│   ├── three-stage-jump-buffering.test.ts
│   ├── three-stage-jump-post-jump-completion.test.ts
│   ├── three-stage-jump-programmatic-jump.test.ts
│   ├── three-stage-jump-jump-ignored.test.ts
│   ├── esm-import-map-completeness.test.ts
│   ├── esm-output-externals.test.ts
│   ├── esm-output-integration.test.ts
│   ├── package-entry-points.test.ts
│   └── webpack-config-structure.test.ts
├── tst/                           # Manual test pages
│   ├── test.html                  # Default dev server page
│   ├── testArAg.html/js           # Tests with AnimationRange + AnimationGroup
│   ├── testCommandControl.html/js # Tests for programmatic control
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

- The library core lives in `src/CharacterController.ts`. Historically the entire library was a single file; larger features are now allowed to live in their own modules under `src/` (e.g. `src/xr/` for WebXR). Prefer keeping the existing core classes in `CharacterController.ts` and introducing new cohesive features as separate modules rather than growing the single file further.
- Exported classes: `CharacterController`, `ActionData`, `ActionMap`, `CCSettings` (in `CharacterController.ts`)
- Internal class: `_Action` (prefixed with underscore, mangled in UMD production)
- WebXR support is modularized under `src/xr/`: `XRController.ts` (BabylonJS-facing glue owned by a `CharacterController` instance) plus three pure, scene-free modules — `XRLocomotion.ts`, `XRSupport.ts`, `XRInputMapping.ts`. `CharacterController` imports `XRController`, owns one instance, and re-exports the public XR types/enums/functions so consumers import them from the library entry point.
- Module split guidance: keep BabylonJS-touching glue separate from pure logic. Pure modules (no BabylonJS scene) are imported directly by their property/unit tests, mirroring the existing pure-helper testing pattern.
- Private members use `_` prefix convention (mangled by Terser in UMD production builds only). A new feature module's class no longer needs an underscore-prefixed NAME for file scoping, but its private MEMBERS still use the `_` prefix.
- Public API uses setter/getter methods (e.g., `setWalkSpeed()`, `getMode()`)
- No physics engine dependency — uses kinematic equations and `moveWithCollisions()`
- BabylonJS types are imported individually from the `"babylonjs"` package in source (in `CharacterController.ts` and any `src/xr/*.ts` module that needs them)
- The build system rewrites these to `@babylonjs/core` sub-paths for the ESM output via a bridge module and import map
- Build shape is unaffected by the module split: webpack bundles everything reachable from the single entry point `src/CharacterController.ts` into the same dual UMD/ESM outputs, and `tsconfig` already compiles all `src/**/*.ts`, so adding modules under `src/` needs no webpack/tsconfig entry change.
