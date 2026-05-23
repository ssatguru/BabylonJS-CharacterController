# Requirements Document

## Introduction

This feature enhances the existing elastic camera obstruction behavior. Currently, when the camera encounters an obstruction it moves closer to the avatar but remains at that closer distance after the obstruction clears. The springback feature adds automatic recovery: once the obstruction is no longer present, the camera smoothly returns toward its original (pre-obstruction) radius, stopping if it encounters a new obstruction along the way.

## Glossary

- **Character_Controller**: The `CharacterController` class that manages avatar movement, animation, and camera behavior
- **Elastic_Camera**: The ArcRotateCamera orbital behavior that moves the camera closer to the avatar when an obstruction is detected between the avatar and the camera
- **Springback**: The behavior where the camera moves back toward its original radius after an obstruction is cleared
- **Obstruction**: Any pickable mesh positioned between the avatar (camera target) and the camera that blocks the line of sight
- **Original_Radius**: The camera radius that was in effect before the camera was pushed closer by an obstruction; the radius the camera attempts to recover to during springback
- **Camera_Skin**: A small offset distance that prevents the camera from getting stuck at the exact pick point of an obstruction

## Requirements

### Requirement 1: Track Original Radius

**User Story:** As a developer using the Character Controller, I want the system to remember the camera's radius before an obstruction pushes it closer, so that the camera knows what distance to return to.

#### Acceptance Criteria

1. WHEN the _handleObstruction method reduces the camera radius due to an obstruction and no Original_Radius is currently stored (value is null), THE Character_Controller SHALL store the current camera radius as the Original_Radius before applying the reduction
2. WHILE the Original_Radius is not null, THE Character_Controller SHALL retain the stored Original_Radius value unchanged across frames regardless of further obstruction-driven radius reductions
3. WHEN the camera radius is within 0.01 units of the Original_Radius, THE Character_Controller SHALL set the stored Original_Radius to null to indicate no displacement
4. IF the user changes the camera radius via input (e.g., scroll wheel) while the Original_Radius is not null, THEN THE Character_Controller SHALL update the stored Original_Radius to the new user-requested radius

### Requirement 2: Springback Movement

**User Story:** As a player, I want the camera to smoothly return to its original distance after an obstruction clears, so that I regain my preferred viewing distance without manual adjustment.

#### Acceptance Criteria

1. WHEN the Elastic_Camera detects no obstruction between the avatar and the camera AND the camera radius is less than the Original_Radius, THE Character_Controller SHALL move the camera away from the avatar toward the Original_Radius, where Original_Radius is the camera radius recorded at the moment the most recent push-in began
2. THE Character_Controller SHALL use a step-based approach for springback movement where the step size equals the remaining distance divided by the configured springback steps (default 50, minimum 1), producing decelerating motion as each frame reduces the remaining distance by a progressively smaller amount
3. WHEN the remaining distance between the current radius and the Original_Radius is less than or equal to 1 unit, THE Character_Controller SHALL snap the camera radius to the Original_Radius
4. IF an obstruction is detected during springback movement, THEN THE Character_Controller SHALL immediately stop the springback and apply the push-in behavior, updating the Original_Radius only if the camera had fully returned to it before this new push-in

### Requirement 3: Springback Interrupted by New Obstruction

**User Story:** As a player, I want the camera to stop moving back if it encounters a new obstruction during springback, so that my view of the avatar is never blocked.

#### Acceptance Criteria

1. WHILE the camera is performing springback movement toward the Original_Radius, IF a new obstruction is detected between the avatar and the camera, THEN THE Character_Controller SHALL cancel the springback and move the camera closer to the avatar using the same step-based elastic behavior used by _handleObstruction()
2. WHEN a new obstruction interrupts springback, THE Character_Controller SHALL retain the previously stored Original_Radius as the recovery target for future springback
3. WHEN the interrupting obstruction is no longer detected between the avatar and the camera, THE Character_Controller SHALL resume springback movement toward the stored Original_Radius

### Requirement 4: Configurable Springback Speed

**User Story:** As a developer using the Character Controller, I want to configure how quickly the camera springs back, so that I can tune the feel independently from the obstruction-approach speed.

#### Acceptance Criteria

1. THE Character_Controller SHALL expose a public setter method named setSpringbackSteps that accepts a number parameter and stores it for use during camera springback
2. THE Character_Controller SHALL default the springback steps to 50
3. IF the springback steps setter is called with a value less than 1, THEN THE Character_Controller SHALL clamp the stored value to 1
4. WHEN the camera radius is less than the Original_Radius and no obstruction is detected between the avatar and the Original_Radius position, THE Character_Controller SHALL divide the remaining distance to the Original_Radius by the springback steps value to determine the per-frame step size

### Requirement 5: Dual Mode Support

**User Story:** As a developer, I want springback to work regardless of whether camera collisions are enabled, so that the feature is consistent across both camera modes.

#### Acceptance Criteria

1. WHILE camera checkCollisions is true, WHEN the obstruction is cleared, THE Character_Controller SHALL perform springback by moving the camera position toward the stored pre-obstruction position along the avatar-to-camera vector
2. WHILE camera checkCollisions is false, WHEN the obstruction is cleared, THE Character_Controller SHALL perform springback by increasing the camera radius toward the stored pre-obstruction radius value
3. THE Character_Controller SHALL use the same step-based deceleration formula for both modes, where each frame the step size equals the remaining distance divided by the configured elasticSteps value
4. IF the remaining distance to the springback target is less than or equal to 1 unit, THEN THE Character_Controller SHALL snap the camera to the final target position offset by the cameraSkin value

### Requirement 6: Springback Enable/Disable

**User Story:** As a developer, I want to enable or disable the springback behavior independently, so that I can use the existing elastic push-in without automatic recovery if desired.

#### Acceptance Criteria

1. THE Character_Controller SHALL expose a public setter method `setCameraElasticSpringback(b: boolean)` and a corresponding getter method `isCameraElasticSpringback(): boolean` to enable or disable springback behavior
2. THE Character_Controller SHALL default the springback private member `_springback` to `true`
3. WHILE springback is disabled AND elastic camera behavior is enabled, THE Character_Controller SHALL keep the camera at the pushed-in radius established during obstruction and not automatically recover toward the original camera radius when the obstruction clears
4. IF elastic camera behavior is disabled via `setCameraElasticity(false)`, THEN THE Character_Controller SHALL not perform springback recovery regardless of the springback setting

### Requirement 7: Settings Persistence

**User Story:** As a developer, I want springback settings to be saved and restored with other Character Controller settings, so that scene state is preserved consistently.

#### Acceptance Criteria

1. WHEN settings are saved via the CCSettings object, THE Character_Controller SHALL include the springback enabled state as a boolean property and the springback steps value as a numeric property on the CCSettings object
2. WHEN settings are restored from a CCSettings object, THE Character_Controller SHALL apply the springback enabled state and springback steps value such that the controller behavior matches the state at the time of saving
3. IF a CCSettings object being restored does not contain springback properties, THEN THE Character_Controller SHALL retain its current springback enabled state and springback steps value unchanged
4. THE Character_Controller SHALL constrain the springback steps value to an integer in the range 1 to 1000 inclusive when saving and restoring settings
