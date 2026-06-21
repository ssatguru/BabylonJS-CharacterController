# BabylonJS 9.x Upgrade Risk Analysis

This document captures the risks and migration considerations for upgrading
babylonjs-charactercontroller from BabylonJS 8.x (`^8.56.2`) to BabylonJS 9.x.

**Current state:** BabylonJS 9.x is the latest major version (released March 2026, currently at ~9.8).
The latest stable on npm is `babylonjs@9.x` (UMD) and `@babylonjs/core@9.x` (ESM).

---

## Version Gap

| Dependency | Current | Target |
|---|---|---|
| `babylonjs` (devDependency) | ^8.56.2 | ^9.x |
| `@babylonjs/core` (peer) | ^8.0.0 | ^8.0.0 \|\| ^9.0.0 |
| `babylonjs` (peer) | ^8.0.0 | ^8.0.0 \|\| ^9.0.0 |
| TypeScript | ~6.0.3 | ~6.0.3 (already aligned) |

---

## BabylonJS APIs Used by This Library

The library imports and uses the following BabylonJS types:

| Type | Sub-path (`@babylonjs/core`) | Usage |
|---|---|---|
| `ArcRotateCamera` | Cameras/arcRotateCamera | Camera management, elasticity, springback |
| `Vector3` | Maths/math.vector | Movement, displacement, distance calculation |
| `Quaternion` | Maths/math.vector | Avatar rotation (RHS support) |
| `Matrix` | Maths/math.vector | Coordinate transforms |
| `Mesh` | Meshes/mesh | Avatar mesh, ellipsoid visualization |
| `AbstractMesh` | Meshes/abstractMesh | Picking, visibility control |
| `TransformNode` | Meshes/transformNode | Node-based moveTo/turnTo targets |
| `InstancedMesh` | Meshes/instancedMesh | Visibility map handling |
| `MeshBuilder` | Meshes/meshBuilder | Ellipsoid debug visualization |
| `LinesMesh` | Meshes/linesMesh | Ray debug visualization |
| `Scene` | scene | Scene reference, render loop |
| `Node` | node | Hierarchy traversal |
| `Skeleton` | Bones/skeleton | AnimationRange-based animations |
| `AnimationGroup` | Animations/animationGroup | AnimationGroup-based animations |
| `TargetedAnimation` | Animations/animationGroup | AG introspection |
| `AnimationRange` | Animations/animationRange | Skeleton animation ranges |
| `Animatable` | Animations/animatable | Animation playback control |
| `AnimationEvent` | Animations/animationEvent | (imported, minimal use) |
| `Ray` | Culling/ray | Ground detection, obstruction raycasting |
| `PickingInfo` | Collisions/pickingInfo | Ray pick results |
| `Sound` | Audio/sound | Footstep sound playback |
| `PlaySoundAction` | Actions/directActions | (imported, minimal direct use) |
| `Color3` | Maths/math.color | Debug line color |
| `DeepImmutable` | types | Type utility |
| `int` | types | Type alias |

Key runtime APIs used:
- `mesh.moveWithCollisions(displacement)` — core movement mechanism (3 call sites)
- `scene.pickWithRay(ray, predicate)` — ground detection
- `scene.multiPickWithRay(ray, predicate)` — obstruction detection, springback verification
- `skeleton.beginAnimation(name, loop, rate)` — skeleton-driven animations
- `animationGroup.start(loop, rate)` / `.stop()` — AG-driven animations
- `sound.play()` / `sound.attachToMesh(mesh)` — footstep audio
- `camera.alpha`, `camera.beta`, `camera.radius` — camera positioning
- `camera.lowerRadiusLimit` — first-person threshold

---

## Risk Categories

### HIGH RISK

#### 1. Audio Engine Overhaul

**What changed:** BabylonJS deprecated the legacy audio engine starting in 7.52. The new V2 audio
engine is the default from 8.x onward. In 9.x, the legacy `Sound` class has been reimplemented on
top of the new engine (PR #17457), but behavior differs.

**Impact on this library:**
- `setSound(sound: Sound)` attaches a Sound instance to the avatar and calls `sound.play()` on interval for footsteps
- `PlaySoundAction` is imported (though barely used directly)
- Overlapping playback semantics have changed — repeated `.play()` on the same Sound instance no longer overlaps (requires cloning)
- The Sound class still exists but is now a wrapper around `StaticSound`

**Migration work:**
- Test footstep playback thoroughly — the interval-based `.play()` pattern may need adjustment
- Consider migrating to `StaticSound` from the new V2 API, or document that consumers must enable legacy audio via `{ audioEngine: true }` in their engine constructor
- `PlaySoundAction` may need replacement with direct sound calls
- Sound overlap behavior requires testing: if footstep interval fires while previous sound is still playing, the behavior may differ

**Estimated effort:** Medium-high. The audio surface area is relatively contained (`setSound()` method + interval playback) but the behavioral differences need careful testing with actual audio files.

---

#### 2. UMD `babylonjs` Package Instability

**What changed:** In BabylonJS 9.5.0, the build system switched from Webpack to Rollup for UMD packages. This broke namespace attachment order, causing errors like `ShadersStore undefined` and `Vector2 is not a constructor` when loading `babylonjs-*` companion packages. A fix was merged (PR #18414 — "Fix UMD Rollup namespace exports") but the instability signals reduced focus on UMD.

**Impact on this library:**
- The UMD build externalizes `babylonjs` as `{ commonjs: "babylonjs", commonjs2: "babylonjs", amd: "babylonjs", root: "BABYLON" }`
- Consumers using `<script>` tags with the `babylonjs` CDN bundle rely on the BABYLON global being populated correctly
- Loading order is critical — this library must load after `babylonjs`

**Migration work:**
- Test script-tag loading with specific 9.x patch versions (avoid 9.5.0, use 9.6+ after the fix)
- Verify the BABYLON global is fully populated before CharacterController code executes
- May need to add a version recommendation in README

**Estimated effort:** Low code changes, but requires manual testing with HTML pages (`tst/test.html`, `tst/testArAg.html`).

---

#### 3. `@babylonjs/core` Sub-Path Restructuring

**What changed:** BabylonJS 9.8+ introduced a "pure barrel" restructuring (PR #18441) adding ~699 new `.pure.js` implementation files and reorganizing the internal module layout. The goal is better tree-shaking. The existing deep sub-path imports (e.g., `@babylonjs/core/Maths/math.vector`) should continue to work, but the internal layout has shifted.

**Impact on this library:**
- `webpack.es-externals.js` maps 26 BabylonJS type names to specific `@babylonjs/core` sub-paths
- `src/_babylonjs-esm-bridge.js` re-exports those types for the ESM bundle
- If any sub-path gets moved, renamed, or stops re-exporting the expected symbol, the ESM output breaks at consumer bundle time

**Migration work:**
- Run the existing `esm-import-map-completeness` test against BabylonJS 9.x
- Verify each entry in `webpack.es-externals.js` still resolves correctly
- May need to update sub-paths if BabylonJS reorganized any module locations
- The `esm-output-externals` and `esm-output-integration` tests will catch issues

**Estimated effort:** Low-medium. Mostly verification; updates are mechanical if paths change.

---

### MEDIUM RISK

#### 4. ArcRotateCamera Right-Handed Scene Fix (8.10.1+)

**What changed:** Setting `rotation` or `rotationQuaternion` on a TargetCamera derivative in right-handed scenes was 180° rotated on Y-axis compared to the view/world matrix. This was fixed in 8.10.1.

**Impact on this library:**
- The library manipulates `camera.alpha`, `camera.beta`, `camera.radius` (not `camera.rotation`/`camera.rotationQuaternion` directly)
- Only affects right-handed scenes — most BabylonJS projects use left-handed (default)
- The springback angle-restore feature stores and restores `camera.alpha`/`camera.beta`, which should be unaffected

**Migration work:**
- Test with a right-handed scene if any consumers use one
- The alpha/beta/radius API is separate from the rotation property, so risk is low

**Estimated effort:** Low. Likely no code change needed.

---

#### 5. `moveWithCollisions` Multi-Call Per Frame

**What changed:** This is not new in 9.x but is a known limitation. The `moveWithCollisions` method uses the mesh position at the start of the frame, not the position after the previous call in the same frame. Calling it twice in one frame means the second call ignores the first call's displacement for collision purposes.

**Impact on this library:**
- `_doJump()` calls `moveWithCollisions` for vertical jump displacement
- `_doMove()` calls `moveWithCollisions` for horizontal movement
- During jump + lateral movement in the same frame, collision detection on the second call may be slightly inaccurate

**Migration work:**
- Consider combining vertical and horizontal displacement into a single `moveWithCollisions` call
- Or accept the existing behavior (has worked adequately to date)
- Test jump-while-moving scenarios for collision regressions

**Estimated effort:** Medium if fixing, zero if accepting current behavior.

---

#### 6. SceneLoader API Changes (7.34.0)

**What changed:** `SceneLoader.Load`, `SceneLoader.Append`, `SceneLoader.ImportMesh` no longer return the plugin synchronously.

**Impact on this library:**
- The library does NOT use SceneLoader directly — consumers load meshes themselves and pass them to `setAvatar()`
- No direct impact on library code

**Migration work:** None for library code. Document for consumers if relevant.

---

### LOW RISK

#### 7. Ray / PickingInfo / Raycasting APIs

**Status:** `Ray`, `scene.pickWithRay()`, `scene.multiPickWithRay()`, and `PickingInfo` all remain in BabylonJS 9.x with no deprecation or breaking changes. The file `packages/dev/core/src/Culling/ray.ts` exists on master.

**Impact:** None expected. The library's heavy raycasting usage (ground detection in `_isNearGround`, obstruction detection in `_handleObstruction`, springback verification) should continue to work.

---

#### 8. Core Mesh and Animation APIs

**Status:** `Mesh`, `TransformNode`, `AbstractMesh`, `AnimationGroup`, `AnimationRange`, `Skeleton`, `MeshBuilder`, `Vector3`, `Matrix`, `Quaternion` — all foundational APIs with no breaking changes in 9.x.

**Impact:** None expected. The entire movement, rotation, and animation system should work unchanged.

---

#### 9. PBR / Material / Rendering Changes

**Status:** Multiple PBR-related breaking changes exist in 7.x–9.x (translucency fixes, rough metals, transparency mode).

**Impact:** None. This library does not create, modify, or interact with materials in any way.

---

## Recommended Migration Sequence

1. **[DONE]** Upgrade TypeScript to ~6.0.3 (aligns with BabylonJS 9.x)
2. Bump `babylonjs` devDependency to `^9.0.0`
3. Run `npx tsc --noEmit` — fix any type errors from updated `.d.ts` files
4. Run `npm run build` — verify both UMD and ESM outputs compile
5. Run `npm test` — the `esm-import-map-completeness`, `esm-output-externals`, and `package-entry-points` tests will catch sub-path issues
6. Update `webpack.es-externals.js` and `src/_babylonjs-esm-bridge.js` if any sub-paths changed
7. Test audio: load `tst/test.html`, trigger footstep sounds, verify playback
8. Test UMD: load `tst/test.html` via script tags with BabylonJS 9.x CDN bundle
9. Test ESM: verify a consumer project importing from `babylonjs-charactercontroller/es` builds correctly
10. Update `peerDependencies` to `"^8.0.0 || ^9.0.0"` (or `">=8.0.0"`)
11. Update README with version compatibility notes

## Open Questions

- Should we drop support for BabylonJS 8.x consumers, or maintain dual compatibility?
- Should we migrate from legacy `Sound` to V2 `StaticSound`, or keep using `Sound` (which is now a compatibility wrapper)?
- The `PlaySoundAction` import — is it actively used, or can it be removed?
- Should the library eventually drop the UMD build in favor of ESM-only, given the UMD package's instability?
