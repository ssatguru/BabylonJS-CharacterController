# Requirements Document

## Introduction

This feature extends the existing elastic camera springback system to restore not only the camera radius but also the alpha (horizontal angle) and beta (vertical angle) of the ArcRotateCamera after an obstruction clears. Currently, when the camera springs forward in front of an obstruction, only the radius is restored upon clearance. This enhancement stores the pre-obstruction alpha and beta values and attempts to restore them as part of the recovery process. When the avatar moves forward while the camera is displaced, the system prioritizes restoring alpha and beta first, and only attempts radius restoration once the new angle position clears the obstruction.

## Glossary

- **Character_Controller**: The `CharacterController` class that manages avatar movement, animation, and camera behavior
- **Elastic_Camera**: The ArcRotateCamera orbital behavior that moves the camera closer to the avatar when an obstruction is detected between the avatar and the camera
- **Springback**: The behavior where the camera moves back toward its original radius, alpha, and beta after an obstruction is cleared
- **Obstruction**: Any pickable mesh positioned between the avatar (camera target) and the camera that blocks the line of sight
- **Original_Radius**: The camera radius that was in effect before the camera was pushed closer by an obstruction; the radius the camera attempts to recover to during springback
- **Original_Alpha**: The camera alpha (horizontal rotation angle in radians) that was in effect before the camera was pushed closer by an obstruction
- **Original_Beta**: The camera beta (vertical rotation angle in radians) that was in effect before the camera was pushed closer by an obstruction
- **Alpha**: The horizontal rotation angle of the ArcRotateCamera around its target, measured in radians
- **Beta**: The vertical rotation angle of the ArcRotateCamera from the positive Y axis, measured in radians
- **Camera_Skin**: A small offset distance that prevents the camera from getting stuck at the exact pick point of an obstruction
- **Angle_Restoration**: The process of moving the camera alpha and beta back toward their pre-obstruction values during springback recovery

## Requirements

### Requirement 1: Track Original Alpha and Beta

**User Story:** As a developer using the Character Controller, I want the system to remember the camera's alpha and beta angles before an obstruction pushes the camera closer, so that the camera knows what angles to return to.

#### Acceptance Criteria

1. WHEN the _handleObstruction method reduces the camera radius due to an obstruction and no Original_Alpha is currently stored (value is null), THE Character_Controller SHALL store the current camera alpha as the Original_Alpha and the current camera beta as the Original_Beta at the same point that Original_Radius is stored, before applying the radius reduction
2. WHILE the Original_Alpha is not null, THE Character_Controller SHALL retain the stored Original_Alpha and Original_Beta values unchanged across frames regardless of further obstruction-driven radius reductions
3. WHEN the Original_Radius is cleared (set to null) by the existing springback recovery logic (radius within 0.01 units of Original_Radius, or avatar movement restoring distance, or camera at/beyond original radius), THE Character_Controller SHALL also set the stored Original_Alpha and Original_Beta to null at the same time
4. IF the user changes the camera alpha or beta via input (detected as a per-frame angular delta exceeding 0.01 radians that is not attributable to system-driven springback interpolation) while the Original_Alpha is not null, THEN THE Character_Controller SHALL update the stored Original_Alpha to the current camera alpha and the stored Original_Beta to the current camera beta
5. WHEN the user scrolls to reduce the camera radius (triggering the existing user-scroll detection that clears Original_Radius), THE Character_Controller SHALL also set Original_Alpha and Original_Beta to null

### Requirement 2: Angle Restoration During Springback

**User Story:** As a player, I want the camera to smoothly return to its original viewing angles after an obstruction clears, so that I regain my preferred camera perspective without manual adjustment.

#### Acceptance Criteria

1. WHEN the Elastic_Camera detects no obstruction between the avatar and the camera AND the Original_Alpha is not null, THE Character_Controller SHALL move the camera alpha toward the Original_Alpha and the camera beta toward the Original_Beta using the step-based deceleration formula
2. THE Character_Controller SHALL use the same springback steps configuration for angle restoration as for radius restoration, where the step size for alpha equals (Original_Alpha minus current alpha) divided by the configured springback steps, and the step size for beta equals (Original_Beta minus current beta) divided by the configured springback steps
3. WHEN the absolute value of (Original_Alpha minus current camera alpha) is less than or equal to 0.005 radians AND the absolute value of (Original_Beta minus current camera beta) is less than or equal to 0.005 radians, THE Character_Controller SHALL snap the camera alpha to the Original_Alpha and the camera beta to the Original_Beta
4. WHILE the camera is performing springback recovery (Original_Radius is not null), THE Character_Controller SHALL perform angle restoration concurrently with radius restoration, applying both angle steps and radius steps in the same frame

### Requirement 3: Angle Restoration Priority During Avatar Forward Movement

**User Story:** As a player, I want the camera to try restoring its viewing angles first when my avatar moves forward while the camera is displaced, so that the camera finds a clear line of sight before attempting to restore distance.

#### Acceptance Criteria

1. WHEN the avatar moves forward while the camera is displaced in front of an obstruction AND the Original_Alpha is not null, THE Character_Controller SHALL attempt to restore the alpha and beta angles toward their original values while suppressing radius restoration until angle restoration completes or is abandoned
2. WHILE the camera alpha and beta have not yet reached the Original_Alpha and Original_Beta (within 0.005 radians), THE Character_Controller SHALL apply angle restoration steps each frame using the step-based deceleration formula and SHALL NOT apply radius restoration steps during this phase
3. WHEN the camera alpha is within 0.005 radians of the Original_Alpha AND the camera beta is within 0.005 radians of the Original_Beta, THE Character_Controller SHALL verify whether the new angular position clears the obstruction by casting a ray from the camera target to the Original_Radius along the restored angle direction
4. IF the ray cast at the restored alpha and beta angles detects no obstruction up to the Original_Radius distance, THEN THE Character_Controller SHALL proceed with radius restoration toward the Original_Radius using the step-based deceleration formula
5. IF the ray cast at the restored alpha and beta angles detects an obstruction before the Original_Radius distance, THEN THE Character_Controller SHALL hold the camera at the current radius, clear the Original_Alpha and Original_Beta values, and retain the Original_Radius so that radius-only springback may resume when the obstruction clears

### Requirement 4: Obstruction Detection at Restored Angles

**User Story:** As a developer, I want the system to verify that the restored angle position is clear of obstructions before restoring radius, so that the camera does not spring back into a blocked position.

#### Acceptance Criteria

1. WHEN the Character_Controller performs angle restoration and the camera alpha is within 0.005 radians of the Original_Alpha AND the camera beta is within 0.005 radians of the Original_Beta, THE Character_Controller SHALL cast a ray from the camera target in the direction defined by the restored alpha and beta angles with a length equal to the Original_Radius
2. THE Character_Controller SHALL use the same obstruction detection logic (multiPickWithRay excluding avatar children, checking isPickable meshes) for the angle-restored ray cast as used in the existing obstruction detection, and SHALL apply the same ellipsoid radius offset when comparing pick distances
3. IF the angle-restored ray cast detects a mesh that is visible (per the _isSeeAble check) or has checkCollisions enabled at a pick distance minus the ellipsoid radius that is greater than the current camera-to-target distance, THEN THE Character_Controller SHALL hold the camera at its current radius, clear the stored Original_Alpha and Original_Beta to null, and not perform radius restoration
4. IF the angle-restored ray cast detects no such obstruction between the current camera-to-target distance and the Original_Radius, THEN THE Character_Controller SHALL proceed with radius springback toward the Original_Radius using the step-based deceleration formula (remaining distance divided by springback steps)

### Requirement 5: Angle Restoration Interrupted by New Obstruction

**User Story:** As a player, I want the camera to stop restoring angles if a new obstruction appears during the restoration process, so that my view of the avatar remains unblocked.

#### Acceptance Criteria

1. WHILE the camera is performing angle restoration toward the Original_Alpha and Original_Beta, IF an obstruction is detected between the avatar and the camera at the camera's current radius and angular position, THEN THE Character_Controller SHALL stop applying angle restoration steps for the current frame and apply the push-in behavior to reduce the camera radius toward the obstruction
2. WHEN an obstruction interrupts angle restoration, THE Character_Controller SHALL retain the previously stored Original_Alpha and Original_Beta unchanged as the recovery targets for future restoration
3. WHEN the obstruction that interrupted angle restoration is no longer detected by the existing ray cast from the camera target toward the camera's current position at the current radius, THE Character_Controller SHALL resume angle restoration toward the stored Original_Alpha and Original_Beta using the step-based deceleration formula with the remaining angular distance at the point of resumption
4. IF an obstruction is detected during angle restoration AND the push-in behavior stores a new Original_Radius (because Original_Radius was previously null), THEN THE Character_Controller SHALL not overwrite the existing Original_Alpha and Original_Beta values

### Requirement 6: User Angle Change Detection

**User Story:** As a developer, I want the system to detect when the user manually changes the camera angles during springback, so that the recovery target updates to reflect the user's intent.

#### Acceptance Criteria

1. WHEN the camera alpha or beta changes by more than the expected angle restoration step size in a single frame AND no obstruction-driven angle change is in progress, THE Character_Controller SHALL treat the change as user-initiated
2. IF a user-initiated angle change is detected while the stored Original_Alpha is not null, THEN THE Character_Controller SHALL update the stored Original_Alpha to the current camera alpha and the stored Original_Beta to the current camera beta, so that subsequent springback targets the user's new angles
3. THE Character_Controller SHALL compute the expected angle step threshold as the remaining angular distance divided by the springback steps (where springback steps is an integer between 1 and 1000 inclusive), using a minimum threshold of 0.001 radians to avoid false positives from floating-point drift
4. IF a user-initiated angle change is detected while the stored Original_Alpha is null (no angle springback is in progress), THEN THE Character_Controller SHALL not store or modify any angle recovery state
5. WHEN the Character_Controller evaluates whether an angle change is user-initiated, THE Character_Controller SHALL compare the absolute difference between the current camera angle and the expected camera angle independently for alpha and beta, treating the change as user-initiated if either axis exceeds the threshold

### Requirement 7: Angle Restoration Enable/Disable

**User Story:** As a developer, I want to enable or disable angle restoration independently from radius springback, so that I can use radius-only springback if desired.

#### Acceptance Criteria

1. THE Character_Controller SHALL expose a public setter method `setSpringbackAngleRestore(b: boolean)` and a corresponding getter method `isSpringbackAngleRestore(): boolean` to enable or disable angle restoration behavior
2. THE Character_Controller SHALL default the angle restoration private member `_springbackAngleRestore` to `true`
3. WHEN an obstruction pushes the camera inward and `_springbackAngleRestore` is `true`, THE Character_Controller SHALL store the camera's current alpha and beta values alongside the original radius so that they serve as the restoration target during springback recovery
4. WHILE angle restoration is disabled AND radius springback is enabled, THE Character_Controller SHALL perform radius-only springback without modifying the camera's alpha or beta properties during the springback recovery cycle
5. WHILE angle restoration is enabled AND radius springback is enabled, THE Character_Controller SHALL restore the camera's alpha and beta toward the stored original values using the same decelerating step formula used for radius springback (remaining difference divided by `_springbackSteps`)
6. WHILE angle restoration is enabled AND radius springback is disabled, THE Character_Controller SHALL not perform angle restoration (angle restoration requires springback to be enabled)
7. IF `setSpringbackAngleRestore` is called during an active springback recovery, THEN THE Character_Controller SHALL apply the new setting immediately: if disabled, alpha and beta restoration stops at their current values; if enabled, restoration resumes toward the previously stored original angles

### Requirement 8: Settings Persistence for Angle Restoration

**User Story:** As a developer, I want angle restoration settings to be saved and restored with other Character Controller settings, so that scene state is preserved consistently.

#### Acceptance Criteria

1. WHEN settings are saved via the CCSettings object, THE Character_Controller SHALL include the angle restoration enabled state as an optional boolean property named `springbackAngleRestore` on the CCSettings object, where the value equals the current return value of `isSpringbackAngleRestore()`
2. WHEN settings are restored from a CCSettings object that contains the `springbackAngleRestore` property, THE Character_Controller SHALL set the internal angle restoration state such that `isSpringbackAngleRestore()` returns the same boolean value that was stored in the CCSettings object
3. IF a CCSettings object being restored does not contain the `springbackAngleRestore` property, THEN THE Character_Controller SHALL retain its current angle restoration enabled state unchanged, such that `isSpringbackAngleRestore()` returns the same value as before the restore call
4. WHEN a CCSettings object that does not contain the `springbackAngleRestore` property is restored, THE Character_Controller SHALL apply all other settings without throwing an error and without modifying the angle restoration enabled state
5. WHEN settings are saved and then immediately restored onto a controller with a different angle restoration state, THE Character_Controller SHALL produce an `isSpringbackAngleRestore()` return value identical to the value at the time of saving (round-trip fidelity)
