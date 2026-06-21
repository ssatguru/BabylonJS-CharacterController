# Requirements Document

## Introduction

This feature adds high-level navigation APIs (`moveTo()` and `turnTo()`) to the CharacterController. These APIs provide goal-oriented movement and rotation that build on the existing low-level command APIs (`walk()`, `run()`, `turnLeft()`, `turnRight()`, `idle()`). They work for both avatars (player-controlled characters with keyboard input) and NPCs (programmatically controlled characters without keyboard input). The character automatically navigates towards a target position or orientation each frame, handling obstruction detection, target tracking, and arrival detection. For avatars with keyboard input enabled, any keyboard press during an active moveTo or turnTo operation immediately cancels the operation and yields control back to keyboard input.

## Glossary

- **Character_Controller**: The `CharacterController` class that manages character movement, animation, and collision handling
- **Character**: A mesh controlled by the Character_Controller; may be either an Avatar or an NPC
- **Avatar**: A player-controlled character with keyboard input enabled (`enableKeyBoard(true)`)
- **NPC**: A non-player character controlled programmatically with keyboard input disabled (`enableKeyBoard(false)`)
- **Keyboard_Input**: The keyboard event handling system within the Character_Controller, enabled or disabled via `enableKeyBoard()`
- **Target_Position**: A `Vector3` world-space coordinate that the Character should move towards or face
- **Target_Node**: A `TransformNode` whose world position the Character tracks continuously
- **Obstruction_Threshold**: A configurable minimum distance the Character must move per evaluation period to be considered making progress
- **Arrival_Distance**: A configurable distance from the target at which the Character is considered to have arrived
- **Turn_Target**: A position (`Vector3`), a `TransformNode`, or an angle (number in radians) that the Character should rotate towards
- **Angular_Tolerance**: A configurable angular threshold (in radians) used to determine when a turnTo operation has reached its target orientation; the Character stops turning when the remaining angular difference is less than or equal to this value

## Requirements

### Requirement 1: Move to a Static Position

**User Story:** As a game developer, I want to command a Character to move towards a world position, so that the Character autonomously navigates to a destination.

#### Acceptance Criteria

1. WHEN `moveTo()` is called with a `Vector3` target position, THE Character_Controller SHALL use the existing `walk()` API to move the Character towards the Target_Position each frame until arrival
2. WHEN `moveTo()` is called with a `Vector3` target position and the run parameter set to true, THE Character_Controller SHALL use the existing `run()` API instead of `walk()` to move the Character towards the Target_Position each frame until arrival
3. WHEN the Character reaches within the Arrival_Distance (default 0.5 units) of the Target_Position, THE Character_Controller SHALL call `idle()` and stop the moveTo operation
4. WHILE a moveTo operation is active, THE Character_Controller SHALL orient the Character to face the Target_Position each frame using smooth rotation toward the target direction
5. WHEN `moveTo()` is called while a previous moveTo operation is active, THE Character_Controller SHALL replace the previous Target_Position with the new Target_Position and continue movement toward the new target
6. WHEN `moveToStop()` is called while a moveTo operation is active, THE Character_Controller SHALL call `idle()` and cancel the current moveTo operation immediately
7. IF `moveTo()` is called and the Character is already within the Arrival_Distance of the Target_Position, THEN THE Character_Controller SHALL call `idle()` and not initiate movement

### Requirement 2: Move to a TransformNode (Follow)

**User Story:** As a game developer, I want to command a Character to follow a TransformNode, so that the Character continuously tracks a moving target.

#### Acceptance Criteria

1. WHEN `moveTo()` is called with a `TransformNode` target, THE Character_Controller SHALL move the Character towards the current world position of the Target_Node continuously, using the configured walk speed
2. WHEN the Target_Node changes position while the Character is in follow mode, THE Character_Controller SHALL adjust the Character heading to move towards the updated Target_Node world position within the next frame update
3. WHEN the Character reaches within the Arrival_Distance (default: 0.5 units) of the Target_Node, THE Character_Controller SHALL stop movement and play the idle animation
4. WHILE the Character is idle within Arrival_Distance of the Target_Node, WHEN the Target_Node moves beyond the Arrival_Distance, THE Character_Controller SHALL resume movement towards the Target_Node
5. WHEN `moveTo()` is called with a `TransformNode` target, THE Character_Controller SHALL continue the follow behavior (moving when beyond Arrival_Distance, idling when within) until `moveToStop()` is called explicitly
6. WHEN `moveToStop()` is called while the Character is in follow mode, THE Character_Controller SHALL stop movement, play the idle animation, and cease tracking the Target_Node
7. IF `moveTo()` is called with a Target_Node that has been disposed, THEN THE Character_Controller SHALL not move the Character and shall revert to idle state

### Requirement 3: Obstruction Detection During moveTo

**User Story:** As a game developer, I want the Character to stop when obstructed, so that the Character does not get stuck walking into a wall indefinitely.

#### Acceptance Criteria

1. WHILE the Character is executing a `moveTo()` operation, THE Character_Controller SHALL compute the horizontal (XZ-plane) distance between the Character's position at the start and end of each frame
2. WHILE the Character is executing a `moveTo()` operation, WHEN the horizontal position change per frame has been less than the Obstruction_Threshold for 3 or more consecutive frames, THE Character_Controller SHALL call `idle()` and stop the moveTo operation (equivalent to calling `moveToStop()`)
3. THE Character_Controller SHALL accept an optional Obstruction_Threshold parameter in the `moveTo()` call, specified in world units, with a default value of 0.001
4. IF the moveTo operation is stopped due to obstruction detection, THEN THE Character_Controller SHALL clear the moveTo target so that no further movement toward that target is attempted

### Requirement 4: Stop moveTo Operation

**User Story:** As a game developer, I want to explicitly stop a moveTo operation, so that I can cancel navigation at any time.

#### Acceptance Criteria

1. WHEN `moveToStop()` is called, THE Character_Controller SHALL call `idle()` on the Character and cease all movement towards the Target_Position or Target_Node on the same frame
2. WHEN `moveToStop()` is called, THE Character_Controller SHALL clear the tracked Target_Position or Target_Node so that no further navigation occurs on subsequent frames
3. IF `moveToStop()` is called while no moveTo operation is active, THEN THE Character_Controller SHALL not alter the Character's current state or animation

### Requirement 5: Turn to a Static Position

**User Story:** As a game developer, I want to command a Character to turn towards a world position, so that the Character faces a point of interest.

#### Acceptance Criteria

1. WHEN `turnTo()` is called with a `Vector3` target position and the fast parameter is false or not provided, THE Character_Controller SHALL determine the shortest-arc direction to the Target_Position and call the existing `turnLeft(true)` or `turnRight(true)` API to rotate the Character towards the Target_Position
2. WHEN `turnTo()` is called with a `Vector3` target position and the fast parameter is true, THE Character_Controller SHALL determine the shortest-arc direction to the Target_Position and call the existing `turnLeftFast(true)` or `turnRightFast(true)` API to rotate the Character towards the Target_Position
3. WHEN the Character's forward direction is within the Angular_Tolerance of the direction to the Target_Position, THE Character_Controller SHALL call `idle()` and stop the turnTo operation
4. IF `turnTo()` is called and the Character is already facing the Target_Position within the Angular_Tolerance, THEN THE Character_Controller SHALL not initiate rotation and SHALL remain in its current state
5. IF `turnToStop()` is called while a turnTo operation is in progress, THEN THE Character_Controller SHALL call `idle()` and cancel the in-progress rotation immediately

### Requirement 6: Turn to a TransformNode (Track)

**User Story:** As a game developer, I want to command a Character to continuously face a TransformNode, so that the Character tracks a moving target's orientation.

#### Acceptance Criteria

1. WHEN `turnTo()` is called with a `TransformNode` target and the fast parameter is false or not provided, THE Character_Controller SHALL rotate the Character each frame so that the Character forward direction points toward the current world position of the Target_Node, using `turnLeft(true)` or `turnRight(true)` to interpolate the rotation
2. WHEN `turnTo()` is called with a `TransformNode` target and the fast parameter is true, THE Character_Controller SHALL rotate the Character each frame so that the Character forward direction points toward the current world position of the Target_Node, using `turnLeftFast(true)` or `turnRightFast(true)` to interpolate the rotation
3. WHILE the Character_Controller is tracking a Target_Node, WHEN the Target_Node world position changes between frames, THE Character_Controller SHALL recalculate the desired facing direction and continue rotating the Character toward the updated position
4. WHILE the Character_Controller is tracking a Target_Node, WHEN the angular difference between the Character forward direction and the direction to the Target_Node is less than or equal to the Angular_Tolerance, THE Character_Controller SHALL hold the current rotation until the Target_Node moves again
5. WHEN `turnToStop()` is called, THE Character_Controller SHALL stop tracking the Target_Node and cease updating the Character rotation, leaving the Character at its current orientation
6. IF `turnTo()` is called with a null or undefined target, THEN THE Character_Controller SHALL ignore the call and not alter the current rotation or tracking state

### Requirement 7: Turn by an Angle

**User Story:** As a game developer, I want to command a Character to turn by a specific angle, so that I can rotate the Character by a precise amount.

#### Acceptance Criteria

1. WHEN `turnTo()` is called with a positive numeric angle (in radians) and the fast parameter is false or not provided, THE Character_Controller SHALL call the existing `turnRight()` API to rotate the Character rightward by the specified angle relative to its current facing direction
2. WHEN `turnTo()` is called with a positive numeric angle (in radians) and the fast parameter is true, THE Character_Controller SHALL call the existing `turnRightFast()` API to rotate the Character rightward by the specified angle relative to its current facing direction
3. WHEN `turnTo()` is called with a negative numeric angle (in radians) and the fast parameter is false or not provided, THE Character_Controller SHALL call the existing `turnLeft()` API to rotate the Character leftward by the absolute value of the specified angle relative to its current facing direction
4. WHEN `turnTo()` is called with a negative numeric angle (in radians) and the fast parameter is true, THE Character_Controller SHALL call the existing `turnLeftFast()` API to rotate the Character leftward by the absolute value of the specified angle relative to its current facing direction
5. WHEN the Character has rotated by the specified angle (within the Angular_Tolerance), THE Character_Controller SHALL call `idle()` and stop the turnTo operation (equivalent to calling `turnToStop()`)
6. IF `turnTo()` is called while a previous turnTo operation is still in progress, THEN THE Character_Controller SHALL cancel the previous operation and begin rotating toward the new target angle
7. IF `turnTo()` is called with an angle of zero, THEN THE Character_Controller SHALL call `idle()` immediately without initiating any rotation

### Requirement 8: Stop turnTo Operation

**User Story:** As a game developer, I want to explicitly stop a turnTo operation, so that I can cancel rotation tracking at any time.

#### Acceptance Criteria

1. WHEN `turnToStop()` is called while a turnTo operation is active, THE Character_Controller SHALL call `idle()` on the Character
2. WHEN `turnToStop()` is called, THE Character_Controller SHALL stop tracking the Turn_Target and cease Character rotation
3. IF `turnToStop()` is called while no turnTo operation is active, THEN THE Character_Controller SHALL return without calling `idle()`, without throwing an error, and without modifying the Character's current state

### Requirement 9: moveTo and turnTo Parameter Defaults

**User Story:** As a game developer, I want sensible defaults for optional parameters, so that the API is easy to use without extensive configuration.

#### Acceptance Criteria

1. THE Character_Controller SHALL default the run parameter of `moveTo()` to false (walk mode)
2. THE Character_Controller SHALL default the Obstruction_Threshold to 0.001 units per frame
3. THE Character_Controller SHALL default the Arrival_Distance to 0.5 units
4. THE Character_Controller SHALL default the fast parameter of `turnTo()` to false (normal turn speed)
5. THE Character_Controller SHALL default the Angular_Tolerance to 0.035 radians (approximately 2 degrees)
6. IF the caller provides an Obstruction_Threshold value less than or equal to 0, THEN THE Character_Controller SHALL ignore the provided value and use the default Obstruction_Threshold of 0.001 units per frame
7. IF the caller provides an Arrival_Distance value less than or equal to 0, THEN THE Character_Controller SHALL ignore the provided value and use the default Arrival_Distance of 0.5 units
8. IF the caller provides an Angular_Tolerance value less than or equal to 0, THEN THE Character_Controller SHALL ignore the provided value and use the default Angular_Tolerance of 0.035 radians

### Requirement 10: Mutual Exclusivity of moveTo and turnTo with Keyboard Input

**User Story:** As a game developer, I want moveTo and turnTo to integrate cleanly with existing APIs and keyboard input, so that there are no conflicting movement commands and players can always regain control.

#### Acceptance Criteria

1. WHEN `moveTo()` is called while a previous `moveTo()` operation is active, THE Character_Controller SHALL cancel the previous operation by stopping movement toward the previous target and begin movement toward the new target
2. WHEN `turnTo()` is called while a previous `turnTo()` operation is active, THE Character_Controller SHALL cancel the previous operation by stopping rotation toward the previous target angle and begin rotation toward the new target angle
3. WHEN `moveTo()` is called while a `turnTo()` operation is active, THE Character_Controller SHALL cancel the active `turnTo()` operation and begin movement toward the new target
4. WHEN `turnTo()` is called while a `moveTo()` operation is active, THE Character_Controller SHALL cancel the active `moveTo()` operation and begin rotation toward the new target
5. WHEN a `moveTo()` or `turnTo()` operation is cancelled, THE Character_Controller SHALL stop the Character at its current position and orientation without applying additional momentum or interpolation
6. WHEN `moveTo()` or `turnTo()` is called, THE Character_Controller SHALL save the current CC mode and switch to mode 1 (top-down) to prevent camera rotation interference, and SHALL restore the original mode when `moveToStop()` or `turnToStop()` is called
7. WHILE Keyboard_Input is enabled on the Character_Controller, WHEN any keyboard key is pressed while a `moveTo()` operation is active, THE Character_Controller SHALL cancel the active `moveTo()` operation and immediately yield control to the keyboard input handler
8. WHILE Keyboard_Input is enabled on the Character_Controller, WHEN any keyboard key is pressed while a `turnTo()` operation is active, THE Character_Controller SHALL cancel the active `turnTo()` operation and immediately yield control to the keyboard input handler

### Requirement 11: Keyboard Interrupt Behavior for Avatars

**User Story:** As a game developer, I want keyboard input to immediately override moveTo and turnTo operations on avatars, so that players always feel in control of their character.

#### Acceptance Criteria

1. WHILE Keyboard_Input is enabled and a `moveTo()` operation is active, WHEN the Character_Controller detects a keydown event for any bound movement or turn key, THE Character_Controller SHALL cancel the `moveTo()` operation on the same frame as the key press is detected
2. WHILE Keyboard_Input is enabled and a `turnTo()` operation is active, WHEN the Character_Controller detects a keydown event for any bound movement or turn key, THE Character_Controller SHALL cancel the `turnTo()` operation on the same frame as the key press is detected
3. WHEN a moveTo or turnTo operation is cancelled by keyboard input, THE Character_Controller SHALL process the keyboard input normally as if no moveTo or turnTo operation had been active
4. WHILE Keyboard_Input is disabled on the Character_Controller, WHEN a keyboard key is pressed during an active `moveTo()` or `turnTo()` operation, THE Character_Controller SHALL not cancel the operation and SHALL ignore the keyboard input
5. WHEN `moveTo()` or `turnTo()` is called on a Character that has Keyboard_Input enabled, THE Character_Controller SHALL accept the call and begin the operation normally, overriding any current keyboard-driven movement
6. WHILE both a `moveTo()` and a `turnTo()` operation are active on an Avatar, WHEN a keyboard key is pressed, THE Character_Controller SHALL cancel both operations simultaneously and yield control to the keyboard input handler

### Requirement 12: Completion Callback

**User Story:** As a game developer, I want to provide a callback that executes when a moveTo or turnTo operation completes, so that I can chain actions or trigger events upon arrival.

#### Acceptance Criteria

1. THE `MoveToOptions` interface SHALL accept an optional `onComplete` property of type `() => void`
2. THE `TurnToOptions` interface SHALL accept an optional `onComplete` property of type `() => void`
3. WHEN a `moveTo()` operation reaches the Target_Position within the Arrival_Distance, THE Character_Controller SHALL invoke the `onComplete` callback if one was provided
4. WHEN a `moveTo()` operation is following a Target_Node and the Character reaches within the Arrival_Distance, THE Character_Controller SHALL invoke the `onComplete` callback each time arrival occurs
5. WHEN a `turnTo()` operation completes rotation within the Angular_Tolerance, THE Character_Controller SHALL invoke the `onComplete` callback if one was provided
6. WHEN a `turnTo()` operation is tracking a Target_Node and the Character faces the node within the Angular_Tolerance, THE Character_Controller SHALL invoke the `onComplete` callback each time the facing goal is reached
7. WHEN a `moveTo()` or `turnTo()` operation is cancelled (by keyboard input, manual command, mutual exclusivity, or explicit stop), THE Character_Controller SHALL NOT invoke the `onComplete` callback
8. IF `onComplete` is not provided or is `undefined`, THEN THE Character_Controller SHALL not attempt to invoke any callback upon completion
