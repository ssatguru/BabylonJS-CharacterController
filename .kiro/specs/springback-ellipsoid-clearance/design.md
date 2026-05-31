# Springback Ellipsoid Clearance Bugfix Design

## Overview

The elastic camera system in `_handleObstruction()` positions the camera relative to obstruction pick points without accounting for the camera's collision ellipsoid. During push-in, the camera decelerates toward the pick-point surface and stops when within 0.1 units — but the camera's ellipsoid volume extends beyond its center point, causing it to clip into or get stuck inside obstruction meshes. During springback, the system checks whether obstructions block the path using raw pick-point distances, again without subtracting the ellipsoid radius, allowing the camera to spring back into a position where its ellipsoid intersects geometry.

The fix offsets all push-in targets and springback limits by the camera's ellipsoid radius (the maximum of the X and Z ellipsoid components), ensuring the camera's full collision volume remains clear of obstructions. This offset is applied universally regardless of the `camera.checkCollisions` setting.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when the elastic camera system positions the camera relative to an obstruction pick point without offsetting for the camera's ellipsoid radius
- **Property (P)**: The desired behavior — the camera center shall maintain at least one ellipsoid radius of clearance from any obstruction pick point
- **Preservation**: Existing behavior that must remain unchanged — no-obstruction paths, disabled elasticity, springback formula, and default-configuration visual similarity
- **`_handleObstruction()`**: The method in `src/CharacterController.ts` that implements the elastic camera push-in and springback logic
- **`_cameraSkin`**: An existing but unused private field (value 0.5) that was intended to provide clearance but is never applied in the obstruction logic
- **`_elasticSteps`**: The number of deceleration steps for push-in movement (default 10)
- **`_springbackSteps`**: The number of steps for springback recovery movement (default 50)
- **`_originalRadius`**: The stored camera radius before the first push-in, used as the springback recovery target
- **Ellipsoid radius**: The lateral clearance radius needed to prevent the camera volume from intersecting obstructions. Resolved as `Math.max(vol.x, vol.z)` where `vol` is `camera.ellipsoid` (for `FreeCamera` and subclasses) or `camera.collisionRadius` (for `ArcRotateCamera`). Falls back to 0 if neither property exists.
- **Pick point**: The 3D point where a ray from the avatar to the camera intersects an obstruction mesh

## Bug Details

### Bug Condition

The bug manifests when the elastic camera system is active and an obstruction is detected between the avatar and the camera. The `_handleObstruction()` method computes the vector from the camera position to the pick point (`c2p`) and uses its raw length to determine the push-in step size and stopping threshold. It also uses raw pick-point distances during springback to determine whether the path is blocked. In both cases, the camera's ellipsoid volume is not considered.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ElasticCameraState
  OUTPUT: boolean
  
  // Resolve collision volume: FreeCamera uses ellipsoid, ArcRotateCamera uses collisionRadius
  LET vol = input.camera.ellipsoid OR input.camera.collisionRadius OR Vector3(0, 0, 0)
  LET ellipsoidRadius = max(vol.x, vol.z)
  
  RETURN input.cameraElastic = true
     AND ellipsoidRadius > 0
     AND (
       // Push-in case: obstruction detected, camera moving toward avatar
       (input.obstructionDetected = true
        AND input.pickPoint IS NOT NULL
        AND distance(input.camera.position, input.pickPoint) < ellipsoidRadius)
       OR
       // Springback case: camera recovering outward with obstruction along path
       (input.originalRadius IS NOT NULL
        AND input.camera.radius < input.originalRadius
        AND input.obstructionAlongSpringbackPath = true
        AND pickPointDistance - ellipsoidRadius <= currentCameraDistance)
     )
END FUNCTION
```

### Examples

- **Push-in clipping**: Camera ellipsoid is (0.5, 1, 0.5), obstruction pick point is 3.0 units from avatar. Camera decelerates and stops at 0.1 units from pick point (2.9 units from avatar). The ellipsoid extends 0.5 units beyond the camera center, clipping 0.4 units into the obstruction mesh. **Expected**: Camera stops at 3.0 - 0.5 = 2.5 units from avatar (pick point minus ellipsoid radius).

- **Push-in stuck**: Camera with `checkCollisions = true` and ellipsoid (0.5, 1, 0.5) is pushed toward a wall. The camera center reaches the pick-point surface but the ellipsoid collides with the wall geometry, causing the camera to get stuck and unable to move further. **Expected**: Camera stops 0.5 units before the pick point, keeping its ellipsoid clear.

- **Springback overshoot**: Camera is at radius 2.0, original radius is 5.0. An obstruction pick point exists at distance 4.0 from avatar along the springback path. The system sees `pickDist (4.0) > currentDist (2.0)` and blocks springback. But if the camera were at radius 3.8, the system would allow springback since `pickDist (4.0) > currentDist (3.8)` — yet the camera's ellipsoid (radius 0.5) at position 3.8 extends to 4.3, intersecting the obstruction at 4.0. **Expected**: Springback is blocked when `pickDist - ellipsoidRadius (3.5) <= currentDist`.

- **Zero ellipsoid (no-op)**: Camera ellipsoid is (0, 0, 0). The ellipsoid radius is 0, so no offset is applied. Behavior is identical to the current unfixed code. **Expected**: No change in behavior.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When no obstruction exists between the camera and the avatar, no push-in occurs and no ellipsoid offset is applied
- When no obstruction exists between the camera and the original radius during springback, springback proceeds normally toward the full original radius
- When `setCameraElasticity(false)` is called, no push-in or springback occurs regardless of obstructions
- The step-based deceleration formula (`remainingDistance / steps`) continues to be used for per-frame movement calculation
- The `_originalRadius` capture-on-first-push-in and user-scroll-detection logic remains unchanged
- The mesh visibility toggling for obstructions (`_makeInvisible`) remains unchanged
- The first-person mode entry/exit logic remains unchanged

**Scope:**
All inputs where `isBugCondition` is false should be completely unaffected by this fix. This includes:
- Scenarios with no obstructions detected
- Scenarios where elasticity is disabled
- Scenarios where the camera ellipsoid is zero (degenerate case)
- User-initiated radius changes (scroll wheel)
- First-person mode transitions

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing ellipsoid offset in push-in stopping threshold**: The push-in logic uses `c2p.length() <= 0.1` as the stopping condition. This positions the camera center 0.1 units from the pick point, but the camera's ellipsoid extends beyond the center by up to `max(ellipsoid.x, ellipsoid.z)` units, causing intersection with the obstruction mesh.

2. **Missing ellipsoid offset in push-in target distance**: The push-in step calculation uses the full `c2p.length()` as the distance to travel. The target should be `c2p.length() - ellipsoidRadius` so the camera stops with its ellipsoid clear of the surface.

3. **Missing ellipsoid offset in springback blocking check**: The springback path-clear check compares `pickDist > currentDist` to determine if an obstruction blocks the path. It should compare `pickDist - ellipsoidRadius > currentDist` to account for the camera volume that extends beyond its center point.

4. **`_cameraSkin` declared but never used**: The field `_cameraSkin = 0.5` exists with a comment "should move camera away from things by a value of cameraSkin" but is never referenced in the actual obstruction logic. This suggests the clearance was intended but never implemented.

## Correctness Properties

Property 1: Bug Condition - Ellipsoid Clearance During Push-In

_For any_ elastic camera state where an obstruction is detected and the camera is being pushed toward the avatar, the fixed `_handleObstruction` function SHALL position the camera such that the distance between the camera center and the obstruction pick point is at least `max(camera.ellipsoid.x, camera.ellipsoid.z)`, ensuring the camera's ellipsoid volume does not intersect the obstruction mesh.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Ellipsoid Clearance During Springback

_For any_ elastic camera state where the camera is springing back toward the original radius and an obstruction exists along the springback path, the fixed `_handleObstruction` function SHALL limit the springback target such that the camera center remains at least `max(camera.ellipsoid.x, camera.ellipsoid.z)` units away from the nearest obstruction pick point along the path.

**Validates: Requirements 2.3, 2.4**

Property 3: Preservation - No-Obstruction Behavior Unchanged

_For any_ elastic camera state where no obstruction is detected (push-in path is clear and springback path is clear), the fixed function SHALL produce exactly the same camera position and radius as the original function, preserving all existing no-obstruction behavior including normal springback recovery.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 4: Preservation - Default Configuration Visual Similarity

_For any_ elastic camera state with the default camera ellipsoid (0.5, 1, 0.5), the ellipsoid radius offset (0.5) SHALL produce comparable clearance to the existing `_cameraSkin` value (0.5), maintaining visually similar behavior for default configurations.

**Validates: Requirements 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/CharacterController.ts`

**Function**: `_handleObstruction()`

**Specific Changes**:

1. **Compute ellipsoid radius at the start of the elastic block**: After entering the `if (this._cameraElastic)` block, resolve the camera's collision volume and compute the lateral clearance radius. `ArcRotateCamera` uses `collisionRadius` while `FreeCamera` uses `ellipsoid`, so both must be checked:
   ```typescript
   const _ellipsoid = (this._camera as any).ellipsoid || (this._camera as any).collisionRadius;
   const ellipsoidRadius: number = _ellipsoid ? Math.max(_ellipsoid.x, _ellipsoid.z) : 0;
   ```

2. **Offset push-in stopping threshold**: Replace the `if (l <= 0.1)` check with `if (l <= ellipsoidRadius + 0.1)` (or simply `if (l <= ellipsoidRadius)` if the 0.1 was only a proximity heuristic). The camera should stop when the distance from camera to pick point is within the ellipsoid radius.

3. **Offset push-in step target distance**: When computing the step, subtract the ellipsoid radius from the travel distance so the camera decelerates toward a point that is `ellipsoidRadius` units away from the pick point:
   ```typescript
   const targetDist = Math.max(l - ellipsoidRadius, 0);
   const step = targetDist / this._elasticSteps;
   ```

4. **Offset springback blocking check**: In the springback path-clear verification, subtract the ellipsoid radius from the pick-point distance before comparing to the current camera distance:
   ```typescript
   if ((pickDist - ellipsoidRadius) > currentDist) {
       springBlocked = true;
       break;
   }
   ```

5. **Remove or repurpose `_cameraSkin`**: Since the ellipsoid radius now provides the clearance that `_cameraSkin` was intended to provide, the `_cameraSkin` field can be removed or left as-is (it's unused). No functional change needed here.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Extract the push-in and springback logic into pure functions that accept camera state (position, radius, ellipsoid, pick point) and return the new camera state. Run these functions with inputs where the ellipsoid should provide clearance and assert that the camera clips into the obstruction (demonstrating the bug on unfixed code).

**Test Cases**:
1. **Push-in clipping test**: Simulate push-in with ellipsoid (0.5, 1, 0.5) and verify camera center ends up within 0.5 units of pick point (will fail on unfixed code — camera clips)
2. **Push-in stopping threshold test**: Simulate push-in until `l <= 0.1` and verify camera ellipsoid intersects obstruction (will fail on unfixed code)
3. **Springback overshoot test**: Simulate springback with obstruction at distance D and verify camera springs to within ellipsoid radius of obstruction (will fail on unfixed code)
4. **Large ellipsoid test**: Use ellipsoid (2.0, 2.0, 2.0) to amplify the bug — camera should stop 2.0 units from pick point but stops at 0.1 (will fail on unfixed code)

**Expected Counterexamples**:
- Camera center positioned closer to pick point than ellipsoid radius
- Springback allowing camera to reach a position where ellipsoid intersects obstruction
- Possible causes: no ellipsoid offset in stopping threshold, no ellipsoid offset in step target, no ellipsoid offset in springback blocking check

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) AND input.obstructionDetected DO
  result := pushIn_fixed(input)
  cameraToPickDist := distance(result.cameraPosition, input.pickPoint)
  ellipsoidRadius := max(input.camera.ellipsoid.x, input.camera.ellipsoid.z)
  ASSERT cameraToPickDist >= ellipsoidRadius
END FOR

FOR ALL input WHERE isBugCondition(input) AND input.springingBack DO
  result := springback_fixed(input)
  cameraDistFromTarget := distance(result.cameraPosition, input.cameraTarget)
  nearestPickDist := distance(input.nearestPickPoint, input.cameraTarget)
  ellipsoidRadius := max(input.camera.ellipsoid.x, input.camera.ellipsoid.z)
  ASSERT cameraDistFromTarget <= nearestPickDist - ellipsoidRadius
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleObstruction_original(input) = handleObstruction_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (varying radii, ellipsoid sizes, obstruction distances)
- It catches edge cases that manual unit tests might miss (e.g., zero ellipsoid, very large radius, obstruction exactly at ellipsoid boundary)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for no-obstruction scenarios and disabled-elasticity scenarios, then write property-based tests capturing that behavior.

**Test Cases**:
1. **No-obstruction preservation**: Verify that when no obstruction is detected, push-in does not occur and springback proceeds identically to unfixed code
2. **Disabled elasticity preservation**: Verify that when `_cameraElastic = false`, no push-in or springback occurs regardless of ellipsoid size
3. **Zero ellipsoid preservation**: Verify that when ellipsoid is (0, 0, 0), behavior is identical to unfixed code (no offset applied)
4. **User scroll preservation**: Verify that user-initiated radius changes (scroll wheel) continue to clear `_originalRadius` and reset expected radius

### Unit Tests

- Test push-in with various ellipsoid sizes verifying camera stops at ellipsoid-radius distance from pick point
- Test push-in stopping threshold accounts for ellipsoid radius
- Test springback blocking check subtracts ellipsoid radius from pick-point distance
- Test edge case: ellipsoid radius larger than distance to pick point (camera should not overshoot past avatar)
- Test edge case: zero ellipsoid produces same behavior as unfixed code

### Property-Based Tests

- Generate random camera states (radius, ellipsoid, pick-point distance) and verify push-in always maintains ellipsoid clearance
- Generate random springback scenarios (current radius, original radius, obstruction distance, ellipsoid size) and verify springback never positions camera where ellipsoid intersects obstruction
- Generate random no-obstruction states and verify fixed function produces identical output to original function

### Integration Tests

- Test full push-in cycle: obstruction detected → camera decelerates → camera stops with ellipsoid clear
- Test full springback cycle: obstruction clears → camera springs back → new obstruction detected → camera stops with ellipsoid clear of new obstruction
- Test transition between push-in and springback with ellipsoid clearance maintained throughout
- Test with `checkCollisions = true` (position-based movement) and `checkCollisions = false` (radius-based movement) both maintaining ellipsoid clearance
