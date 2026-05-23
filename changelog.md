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
