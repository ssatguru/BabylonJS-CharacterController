# Bugfix Requirements Document

## Introduction

The elastic camera system positions the camera relative to obstruction pick points without accounting for the camera's collision volume. This causes the camera to get stuck inside obstruction meshes because the camera's collision volume extends beyond the pick-point surface into the obstruction geometry.

The fix applies collision-volume clearance universally — regardless of the `camera.checkCollisions` setting — so that the camera's final position always ensures its collision volume is clear of obstructions. This provides consistent behavior whether collisions are enabled or not.

**Camera type compatibility**: `FreeCamera` (and subclasses like `UniversalCamera`) exposes its collision volume via the `ellipsoid` property (default `(0.5, 1, 0.5)`). `ArcRotateCamera` uses `collisionRadius` instead (default `(0.5, 0.5, 0.5)`). The fix checks both properties with a fallback to 0 when neither is defined.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an obstruction is detected between the avatar and the camera, THEN the system moves the camera toward the avatar using the vector from camera position to the obstruction pick point, positioning the camera at or near the pick-point surface without offsetting for the camera's ellipsoid radius

1.2 WHEN the push-in deceleration brings the camera within 0.1 units of the pick point, THEN the system stops movement with the camera center at the pick-point surface, but the camera's ellipsoid extends into the obstruction mesh

1.3 WHEN the camera is springing back toward the original radius AND an obstruction exists along the springback path, THEN the system uses the raw pick-point distance to determine whether the path is blocked, without subtracting the camera's ellipsoid radius for clearance

1.4 WHEN the springback moves the camera away from the avatar along the avatar-to-camera vector, THEN the system can position the camera where its ellipsoid intersects with obstruction geometry along the path

### Expected Behavior (Correct)

2.1 WHEN an obstruction is detected between the avatar and the camera, THEN the system SHALL offset the push-in target by the camera's ellipsoid radius along the avatar-to-camera direction, so the camera stops with its ellipsoid volume entirely clear of the obstruction surface

2.2 WHEN the push-in positions the camera near an obstruction, THEN the system SHALL ensure the minimum distance between the camera center and the obstruction pick point is at least the camera's ellipsoid radius, preventing the ellipsoid from intersecting the obstruction mesh

2.3 WHEN the camera is springing back toward the original radius AND an obstruction exists along the springback path, THEN the system SHALL treat the obstruction as blocking if the pick-point distance minus the camera's ellipsoid radius is less than or equal to the current camera distance from the avatar

2.4 WHEN the springback determines the path is clear up to a certain distance, THEN the system SHALL limit the springback target distance to no more than the nearest obstruction pick-point distance minus the camera's ellipsoid radius, ensuring the camera's ellipsoid does not intersect the obstruction mesh

### Unchanged Behavior (Regression Prevention)

3.1 WHEN no obstruction exists between the camera and the avatar during push-in, THEN the system SHALL CONTINUE TO not apply any elastic camera adjustment (no push-in occurs without an obstruction)

3.2 WHEN no obstruction exists between the camera and the original radius position during springback, THEN the system SHALL CONTINUE TO perform springback normally toward the full original radius without any reduction

3.3 WHEN the elastic camera system is disabled via `setCameraElasticity(false)`, THEN the system SHALL CONTINUE TO not perform any push-in or springback regardless of obstructions

3.4 WHEN the step-based deceleration formula is applied for push-in or springback movement, THEN the system SHALL CONTINUE TO use the same `remainingDistance / steps` formula for per-frame step size calculation

3.5 WHEN the camera's ellipsoid is at its default value (0.5, 1, 0.5), THEN the system SHALL produce comparable clearance to the existing `_cameraSkin` value (0.5), maintaining visually similar behavior for default configurations

### Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ElasticCameraState
  OUTPUT: boolean
  
  // Returns true when the camera is being positioned relative to an obstruction
  // (either push-in or springback) and the ellipsoid is not accounted for
  RETURN X.elasticEnabled = true
     AND (
       // Push-in: obstruction detected, camera moving toward avatar
       (X.obstructionDetected = true AND X.pickPoint is not null)
       OR
       // Springback: camera moving away from avatar with obstruction along path
       (X.originalRadius is not null AND X.camera.radius < X.originalRadius
        AND X.obstructionExistsBetweenCameraAndOriginalRadius = true)
     )
END FUNCTION
```

### Fix Property

```pascal
// Property: Fix Checking - Ellipsoid Clearance During Push-In
FOR ALL X WHERE isBugCondition(X) AND X.obstructionDetected DO
  result ← pushIn'(X)
  cameraDistFromPickPoint ← distance(result.camera.position, X.pickPoint)
  // Resolve collision volume: FreeCamera uses ellipsoid, ArcRotateCamera uses collisionRadius
  vol ← X.camera.ellipsoid OR X.camera.collisionRadius OR Vector3(0, 0, 0)
  ellipsoidRadius ← max(vol.x, vol.z)
  ASSERT cameraDistFromPickPoint >= ellipsoidRadius
END FOR

// Property: Fix Checking - Ellipsoid Clearance During Springback
FOR ALL X WHERE isBugCondition(X) AND X.springingBack DO
  result ← springback'(X)
  cameraDistFromTarget ← distance(result.camera.position, result.camera.target)
  nearestObstructionDist ← distance(nearestPickPoint, result.camera.target)
  vol ← X.camera.ellipsoid OR X.camera.collisionRadius OR Vector3(0, 0, 0)
  ellipsoidRadius ← max(vol.x, vol.z)
  ASSERT cameraDistFromTarget <= nearestObstructionDist - ellipsoidRadius
END FOR
```

### Preservation Property

```pascal
// Property: Preservation Checking - No-obstruction behavior unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT elasticCamera(X) = elasticCamera'(X)
END FOR
```
