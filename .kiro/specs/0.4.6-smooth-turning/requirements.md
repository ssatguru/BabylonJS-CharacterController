# Requirements Document

## Introduction

This feature replaces the instant avatar rotation behavior in mode 0 with `turningOff` enabled. Currently, when `turningOff` is true and the player presses left, right, or back keys, the avatar snaps instantly to face the corresponding direction. This feature introduces smooth (gradual) rotation toward the target direction at a configurable speed, providing a more natural-looking turning animation.

## Glossary

- **Character_Controller**: The main `CharacterController` class that manages avatar movement, rotation, and animation in the BabylonJS scene.
- **Avatar**: The 3D mesh representing the player character, controlled by the Character_Controller.
- **Mode_0**: The third-person/first-person camera mode where camera direction influences avatar orientation.
- **Turning_Off**: A boolean setting (`_noRot`) that, when true, causes directional keys (left, right, back) to orient the avatar to face the movement direction rather than rotating the camera.
- **Smooth_Turn_Speed**: A configurable parameter (in degrees per second) that controls how fast the avatar rotates toward the target direction when Turning_Off is enabled in Mode_0.
- **Target_Angle**: The desired final rotation angle for the avatar based on the directional key pressed (e.g., 90° left, 90° right, 180° for back).
- **Delta_Time**: The elapsed time between consecutive render frames, used to calculate incremental rotation amounts.

## Requirements

### Requirement 1: Smooth Turn Speed Parameter

**User Story:** As a game developer, I want to configure the speed at which the avatar turns toward the target direction, so that I can tune the turning feel to match my game's style.

#### Acceptance Criteria

1. THE Character_Controller SHALL expose a `setSmoothTurnSpeed(speed: number)` method that accepts a speed value in degrees per second.
2. THE Character_Controller SHALL expose a `getSmoothTurnSpeed(): number` method that returns the current smooth turn speed in degrees per second.
3. THE Character_Controller SHALL store the smooth turn speed internally in radians per second by converting the input value using the formula `speed * Math.PI / 180`.
4. WHEN `setSmoothTurnSpeed` is called with a positive finite number, THE Character_Controller SHALL use that value as the rotation rate for smooth turning.
5. IF `setSmoothTurnSpeed` is called with a value that is zero, negative, NaN, or Infinity, THEN THE Character_Controller SHALL ignore the call and retain the previous smooth turn speed value.
6. THE Character_Controller SHALL default the smooth turn speed to 120 degrees per second (equivalent to 2π/3 radians per second).

### Requirement 2: Smooth Rotation Toward Target Direction

**User Story:** As a player, I want the avatar to rotate smoothly toward the direction I press, so that movement looks natural rather than snapping instantly.

#### Acceptance Criteria

1. WHILE Turning_Off is true and Mode_0 is active and a directional key is pressed, THE Character_Controller SHALL recalculate the Target_Angle based on the current camera-relative forward direction each frame and rotate the Avatar toward it incrementally using the formula: `rotation_step = Smooth_Turn_Speed * Delta_Time`.
2. WHEN the absolute angular difference along the shortest arc between the Avatar's current rotation and the Target_Angle is less than or equal to the rotation step for the current frame, THE Character_Controller SHALL set the Avatar's rotation directly to the Target_Angle to prevent overshooting.
3. WHILE Turning_Off is true and Mode_0 is active, THE Character_Controller SHALL rotate the Avatar along the shortest arc (clockwise or counter-clockwise) toward the Target_Angle.
4. WHEN the shortest-arc angular difference between the Avatar's current rotation and the Target_Angle is exactly 180 degrees (±π radians), THE Character_Controller SHALL always rotate clockwise (viewed from above) regardless of avatar facing direction or coordinate system handedness, to prevent positional drift from alternating rotation directions.
5. WHEN the forward key is pressed alone, THE Character_Controller SHALL set the Target_Angle to 0 degrees from the camera-relative forward direction (i.e., facing the same direction the camera is looking along the ground plane).
6. WHEN the left key is pressed alone, THE Character_Controller SHALL set the Target_Angle to 90 degrees left of the camera-relative forward direction.
7. WHEN the right key is pressed alone, THE Character_Controller SHALL set the Target_Angle to 90 degrees right of the camera-relative forward direction.
8. WHEN the back key is pressed alone, THE Character_Controller SHALL set the Target_Angle to 180 degrees from the camera-relative forward direction.
9. WHEN the forward key and left key are pressed together, THE Character_Controller SHALL set the Target_Angle to 45 degrees left of the camera-relative forward direction.
10. WHEN the forward key and right key are pressed together, THE Character_Controller SHALL set the Target_Angle to 45 degrees right of the camera-relative forward direction.
11. WHEN the back key and left key are pressed together, THE Character_Controller SHALL set the Target_Angle to 135 degrees left of the camera-relative forward direction.
12. WHEN the back key and right key are pressed together, THE Character_Controller SHALL set the Target_Angle to 135 degrees right of the camera-relative forward direction.

### Requirement 3: Movement During Smooth Turning

**User Story:** As a player, I want the avatar to move in the pressed direction while turning, so that movement feels responsive even before the turn completes.

#### Acceptance Criteria

1. WHILE the Avatar is rotating toward the Target_Angle, THE Character_Controller SHALL move the Avatar in the direction the Avatar is currently facing each frame at the walk speed, or at the run speed if the speed modifier key is held.
2. WHEN the directional key is released before the Avatar reaches the Target_Angle, THE Character_Controller SHALL stop both the rotation and the movement, and leave the Avatar at its current orientation.
3. WHILE the Avatar is rotating toward the Target_Angle and moving, THE Character_Controller SHALL play the walk animation, or the run animation if the speed modifier key is held.
4. WHILE the Avatar is rotating toward the Target_Angle and moving, THE Character_Controller SHALL continue to apply gravity to the Avatar's vertical displacement each frame.

### Requirement 4: Integration with Existing Settings

**User Story:** As a game developer, I want the smooth turn speed to integrate with the existing settings API, so that I can save and restore it alongside other controller settings.

#### Acceptance Criteria

1. THE CCSettings class SHALL include a `smoothTurnSpeed` property of type number representing the smooth turn speed in degrees per second.
2. WHEN `getSettings()` is called, THE Character_Controller SHALL set the `smoothTurnSpeed` property of the returned CCSettings object to the current smooth turn speed value in degrees per second.
3. WHEN `setSettings(ccs)` is called with a CCSettings object containing a `smoothTurnSpeed` value, THE Character_Controller SHALL apply that value as the smooth turn speed by passing it to `setSmoothTurnSpeed`.
4. WHEN `getSettings()` is called after `setSettings(ccs)` has been called with a `smoothTurnSpeed` value of N, THE Character_Controller SHALL return a CCSettings object whose `smoothTurnSpeed` property equals N.

### Requirement 5: No Effect Outside Mode 0 with Turning Off

**User Story:** As a game developer, I want smooth turning to only apply when turningOff is enabled in mode 0, so that other modes remain unaffected.

#### Acceptance Criteria

1. WHILE Mode_0 is active and Turning_Off is false, THE Character_Controller SHALL instantly set the Avatar's rotation to the camera-relative forward direction each frame (rotation = av2cam - camera.alpha) without applying Smooth_Turn_Speed interpolation.
2. WHILE mode 1 (top-down/isometric) is active, THE Character_Controller SHALL rotate the Avatar using the sign-based turn logic driven by the facing-camera direction, regardless of the Smooth_Turn_Speed value.
3. IF the mode is changed from 0 to 1 or Turning_Off is changed from true to false while the Avatar is mid-rotation toward a Target_Angle, THEN THE Character_Controller SHALL immediately stop the smooth rotation and apply the rotation logic appropriate to the new mode or Turning_Off state.
