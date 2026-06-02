## 06/01/2026 0.4.7-alpha7

### test page improvements 
combine testAnimationRange.html and testAnimationGroup.html into one page namely testArAg.html

## 05/31/2026 0.4.7-alpha6

### turn direction & animation fix
- fixed NPC turn direction: `turnLeft`/`turnRight` now rotate relative to the character itself, independent of camera position and face-forward setting
- fixed NPC turn animation in right-handed scenes: animation selection accounts for `_rhsSign` so the correct animation plays in both LHS and RHS
- fixed mode 0 avatar turn animation in right-handed scenes: animation now flips with `_rhsSign` to match the reversed visual direction
- fixed navigation mode (turnTo) animation: `turnLeft` command plays `turnRight` animation (and vice versa) to match the actual visual rotation direction
- added `tests/turn-direction-animation.test.ts` with 35 tests covering all four turn branches (NPC, mode 0, mode 1 avatar, navigation)

### test page improvements 
added npc to tst/testCommandControl. deleted the separate test page for npc.

## 05/30/2026 0.4.7-alpha5

### camera elastic springback — alpha/beta angle restoration
- springback now restores camera alpha (horizontal) and beta (vertical) angles after an obstruction clears, not just radius
- angles are captured on first obstruction push-in and restored using the same step-based deceleration formula (`remaining / steps`)
- concurrent mode: when avatar is stationary and obstruction clears, angles and radius restore simultaneously
- angle-priority mode: when avatar moves forward while camera is displaced, angles restore first; radius restoration begins only after a ray cast confirms the restored angle position is clear
- if the restored angle position is blocked, angle targets are cleared and radius-only springback continues
- new obstruction during angle restoration pauses angle steps, applies push-in, and resumes restoration when clear
- user angle changes during springback are detected and update the restoration target to the user's new preferred angles
- new API: `setSpringbackAngleRestore(b)` / `isSpringbackAngleRestore()` — independent toggle for angle restoration (default: enabled)
- toggling off during active recovery stops angle steps immediately; toggling on resumes toward stored targets
- angle restoration requires radius springback (`_springback`) to also be enabled
- `springbackAngleRestore` added to CCSettings for save/restore via getSettings()/setSettings()


### onComplete callbacks for moveTo / turnTo
- added `onComplete` option to `MoveToOptions` — callback fires when character arrives at target
- added `onComplete` option to `TurnToOptions` — callback fires when character finishes rotating
- in node-follow/track mode, callback fires each time the character reaches the node (re-arms when movement resumes)
- callbacks are NOT invoked on cancellation (keyboard, manual command, or explicit stop)
- `moveToStop()` and `turnToStop()` now invoke the onComplete callback before clearing state

### turnTo mode 1 fix
- fixed turnTo direction in mode 1: navigation now bypasses camera-relative sign logic so turnLeft/turnRight commands produce correct rotation direction

### keyboard cancel improvement
- keyboard press now only cancels navigation if moveTo or turnTo is actually active (avoids unnecessary action resets)
- added `_act.reset()` call after cancellation to clear stale action state

### cancel state cleanup
- `_cancelMoveTo()` and `_cancelTurnTo()` now fully reset state: clear onComplete callback, completeFired flag, and restore saved mode

### turnTo rotation normalization
- avatar rotation.y is now normalized to [-π, π] before computing shortest-arc delta, preventing unbounded drift from repeated turn commands

### camera elastic springback — ellipsoid-based clearance
- elastic camera movement now accounts for camera ellipsoid size (uses `Math.max(ellipsoid.x, ellipsoid.z)` as clearance radius)
- camera stops moving when within ellipsoidRadius of target (instead of hardcoded 0.1)
- elastic step distance subtracts ellipsoidRadius to prevent camera from clipping into obstructions
- springback obstruction check subtracts ellipsoidRadius from pick distance for accurate clearance comparison

### test page improvements (tst/testCommandControl)
- boxes renamed with colors (red-box, green-box, yellow-box, blue-box) and given colored materials
- button toggle logic refactored: only one movement action active at a time (mutual exclusion)
- camera radius increased from 5 to 12 for better visibility
- lighting adjusted for better scene visibility
- `turnTo` button now demonstrates `onComplete` callback (logs rotation.y)

### README updates
- documented `onComplete` option for both `moveTo()` and `turnTo()` with examples and parameter tables

## 05/29/2026 0.4.7-alpha4

### documentation improvement

### bug fix. 
- In case of animation groups, set action api (like setIdleAnim) wasn't working
- es vs umd issues fixed. now consumer has to add /es or/umd to import of charactercontroller

## 05/26/2026 0.4.7-alpha3

### moveTo / turnTo navigation APIs
- added `moveTo(target, options?)` — move character toward a Vector3 position or follow a TransformNode
- added `moveToStop()` — cancel active moveTo operation
- added `turnTo(target, options?)` — rotate character toward a Vector3, TransformNode, or by a numeric angle (radians)
- added `turnToStop()` — cancel active turnTo operation
- moveTo supports walk/run mode, configurable arrival distance, and obstruction detection (stops after 3 stalled frames)
- turnTo supports normal/fast turn speed and configurable angular tolerance
- TransformNode targets are tracked continuously (follow/track mode) until explicitly stopped
- moveTo and turnTo are mutually exclusive — calling one cancels the other
- navigation temporarily switches CC to mode 1 to prevent camera rotation interference, restores original mode on stop
- keyboard input cancels active navigation immediately (avatars with keyboard enabled)
- navigation uses a separate `beforeRender` observer that calls public command methods — no internal coupling to the CC render loop
- added `MoveToOptions` and `TurnToOptions` exported interfaces
- added 14 property-based tests validating navigation correctness properties

## 05/26/2026 0.4.7-alpha2
### dual module format support
- added ES6 module output (`dist/CharacterController.es.js`) alongside the existing UMD output
- ESM bundle imports from `@babylonjs/core` sub-paths, enabling tree-shaking for consumers using the ES6 BabylonJS packages
- webpack config now exports an array of two configurations (UMD + ESM) from the same source
- added `src/_babylonjs-esm-bridge.js` — bridge module that re-exports BabylonJS types from their individual `@babylonjs/core` sub-paths
- added `webpack.es-externals.js` — import map defining the type-to-subpath mapping for all 25 BabylonJS types used
- added `module`, `exports`, `peerDependencies`, and `peerDependenciesMeta` fields to `package.json`
- both `babylonjs` and `@babylonjs/core` declared as optional peer dependencies at `^8.0.0`
- no changes to the source file — single `src/CharacterController.ts` still imports from `"babylonjs"`
- UMD output unchanged (fully backward compatible)
- added tests: import map completeness, webpack config structure, package entry points, ESM output integration, ESM externals property test

## 05/25/2026 0.4.7-alpha1
- test command control ui improved

## 05/23/2026 0.4.6
### smooth turning
- added smooth turning: avatar now rotates gradually toward the target direction when turningOff is enabled in mode 0, instead of snapping instantly
- new API: `setSmoothTurnSpeed(degreesPerSecond)` / `getSmoothTurnSpeed()` to configure rotation speed (default 360°/s)
- `smoothTurnSpeed` added to CCSettings for save/restore via getSettings()/setSettings()
- smooth rotation uses shortest-arc interpolation with frame-rate-independent step and snap-to-target on convergence
### improved camera springback
- added elastic camera springback: camera automatically recovers to its pre-obstruction radius once an obstruction clears
- camera holds its world position while displaced — avatar walks away and distance restores naturally
- springback uses step-based deceleration (remainingDistance / steps) for smooth motion
- forward ray check prevents jitter by verifying the path is clear before springing back
- smooth stop at obstruction point (no snap) eliminates jitter when camera hits obstructions
- user scroll immediately cancels springback — user always has manual control priority
- springback works through first-person mode: camera holds position and exits FP as avatar moves away
- new API: `setCameraElasticSpringback(b)` / `isCameraElasticSpringback()` to enable/disable springback (default: enabled)
- new API: `setSpringbackSteps(n)` to configure springback deceleration speed (default 50, clamped to [1, 1000])
- `springback` and `springbackSteps` added to CCSettings for save/restore
- added test framework: Vitest + fast-check with property-based tests for rotation correctness
- added `npm test` script

## 05/22/2026 0.4.5
- updated readme. added missing api.
- updated demo and tst html to load inspector from cdn and enabled audio engine v1

## 02/17/2026 0.4.4-alpha.13
- the avatar can now have quaternion rotation. The app can now handle both quaternion or euler rotation

## 01/23/2026 0.4.4-alpha.12
- fixed issue with npc faceforward issue.
- serialize animation blending value (set with enableBlending())
- serialize avatar ellipsoid and ellipsoid offset
- fixed bug in showEllipsoid wherein calling show true multiple times would result in multiple ellipsoids

## 07/20/2025 0.4.4-alpha.11
- steps detection issues resolved
- removed lots of dead code related to free fall and going down steep slope
- automated step creation in tesfile

## 07/20/2025 0.4.4-alpha.10
- optimized pickray (for step and slope detecion) drawing for debug.  
  is turnd on or off by call to showEllipsoid
- steps detection improvement but still buggy
- some test file refactoring
