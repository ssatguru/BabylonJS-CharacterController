# Requirements Document

## Introduction

This feature enhances the existing idle jump and run jump functionality in the BabylonJS CharacterController library by introducing a three-stage jump sequence: pre-jump, jump, and post-jump. Each stage is driven by the presence of corresponding animations. When a pre-jump or post-jump animation exists, the controller plays it before or after the actual jump. When it does not exist, the controller skips that stage and proceeds directly to the next. This allows avatar designers to add anticipation and recovery animations to jumps without requiring code changes from consumers.

## Glossary

- **CharacterController**: The main controller class that manages avatar movement, animation, and collision in the BabylonJS scene
- **Jump_Key**: The keyboard key configured to trigger a jump (default: spacebar)
- **Pre_Jump_Animation**: An optional animation played before the avatar leaves the ground (e.g., a crouch or wind-up)
- **Post_Jump_Animation**: An optional animation played after the avatar lands on the ground (e.g., a recovery or impact absorption)
- **Idle_Jump**: A jump performed while the avatar is stationary
- **Run_Jump**: A jump performed while the avatar is moving (walking or running)
- **Jump_Stage**: One of the three sequential phases of a jump: pre-jump, jump, or post-jump
- **Animation_Completion**: The event that occurs when a non-looping animation reaches its final frame
- **Landing**: The moment the avatar's vertical position returns to or below ground level during the descent phase of a jump
- **ActionData**: The internal data structure that holds animation metadata (name, rate, loop, existence flag) for a given action

## Requirements

### Requirement 1: Pre-Jump Stage Initiation

**User Story:** As a game developer, I want the avatar to play a pre-jump animation before leaving the ground, so that jumps look more natural with an anticipation pose.

#### Acceptance Criteria

1. WHEN the Jump_Key is pressed while the avatar is idle AND a preIdleJump animation exists, THE CharacterController SHALL play the preIdleJump animation and keep the avatar grounded until that animation completes
2. WHEN the Jump_Key is pressed while the avatar is moving AND a preRunJump animation exists, THE CharacterController SHALL play the preRunJump animation and keep the avatar grounded until that animation completes
3. WHEN the pre-jump animation completes, THE CharacterController SHALL transition to the jump stage
4. WHILE the pre-jump animation is playing, THE CharacterController SHALL prevent additional jump inputs from interrupting the sequence

### Requirement 2: Pre-Jump Stage Skipping

**User Story:** As a game developer, I want the jump to proceed directly to the airborne phase when no pre-jump animation is configured, so that the feature is backward-compatible and gracefully handles missing animations.

#### Acceptance Criteria

1. WHEN the Jump_Key is pressed while the avatar is idle AND the preIdleJump ActionData has its exist flag set to false, THE CharacterController SHALL begin the jump stage within the same render frame, applying vertical displacement and playing the idleJump animation with no intermediate grounded frames
2. WHEN the Jump_Key is pressed while the avatar is moving AND the preRunJump ActionData has its exist flag set to false, THE CharacterController SHALL begin the jump stage within the same render frame, applying vertical and horizontal displacement and playing the runJump animation with no intermediate grounded frames
3. WHEN neither preIdleJump nor preRunJump animations exist, THE CharacterController SHALL produce jump behavior identical to the existing implementation where no three-stage jump sequence is configured

### Requirement 3: Jump Stage Execution

**User Story:** As a game developer, I want the actual airborne jump to behave the same as the current implementation once the pre-jump stage completes, so that physics and movement are unchanged.

#### Acceptance Criteria

1. WHEN the jump stage begins and the character was idle (neither walking nor running) before jumping, THE CharacterController SHALL apply only vertical displacement using the idleJump speed and play the idleJump animation
2. WHEN the jump stage begins and the character was walking before jumping, THE CharacterController SHALL apply vertical displacement using the runJump speed, apply horizontal displacement at the walk speed in the direction of the last movement vector, and play the runJump animation
3. WHEN the jump stage begins and the character was running before jumping, THE CharacterController SHALL apply vertical displacement using the runJump speed, apply horizontal displacement at the run speed in the direction of the last movement vector, and play the runJump animation
4. THE CharacterController SHALL compute vertical jump displacement each frame as: (jumpSpeed − gravity × jumpTime) × dt − 0.5 × gravity × dt², where jumpSpeed is the relevant action speed, gravity is the configured gravity value, jumpTime is the elapsed time since jump start, and dt is the frame delta time in seconds
5. WHEN the computed vertical jump displacement becomes negative and the avatar contacts a surface at or above its jump start height, THE CharacterController SHALL end the jump stage, reset jumpTime to zero, and clear the walking and running state flags

### Requirement 4: Post-Jump Stage Initiation

**User Story:** As a game developer, I want the avatar to play a landing animation after touching the ground, so that jumps look more realistic with a recovery pose.

#### Acceptance Criteria

1. WHEN the avatar lands after an idle jump AND a postIdleJump animation exists in the ActionMap, THE CharacterController SHALL play the postIdleJump animation to completion before returning to idle state
2. WHEN the avatar lands after a run jump AND a postRunJump animation exists in the ActionMap, THE CharacterController SHALL play the postRunJump animation to completion before returning to the movement state the avatar was in before the jump
3. WHILE the post-jump animation is playing, THE CharacterController SHALL keep the jump flag active, prevent new jump inputs from being processed, and suppress transitions to idle or movement animations
4. WHEN the post-jump animation completes, THE CharacterController SHALL clear the jump flag and resume normal idle or movement processing based on current input state
5. IF no post-jump animation exists in the ActionMap for the completed jump type, THEN THE CharacterController SHALL end the jump sequence immediately and return to idle or movement processing without playing a landing animation

### Requirement 5: Post-Jump Stage Skipping

**User Story:** As a game developer, I want the jump to end immediately upon landing when no post-jump animation is configured, so that the feature remains backward-compatible.

#### Acceptance Criteria

1. WHEN the avatar lands after an idle jump AND the postIdleJump ActionData exist flag is false, THE CharacterController SHALL end the jump sequence on the same frame as landing detection without entering the post-jump stage, and return to normal idle processing on the next frame
2. WHEN the avatar lands after a run jump AND the postRunJump ActionData exist flag is false, THE CharacterController SHALL end the jump sequence on the same frame as landing detection without entering the post-jump stage, and return to normal movement processing on the next frame
3. WHEN the jump sequence ends due to a missing post-jump animation, THE CharacterController SHALL clear the jump state flags (_act._jump, _jumpTime, _wasWalking, _wasRunning) identically to the existing _endJump behavior

### Requirement 6: Animation Registration API

**User Story:** As a game developer, I want to register pre-jump and post-jump animations through the same patterns used for other animations, so that the API remains consistent.

#### Acceptance Criteria

1. THE CharacterController SHALL provide a setPreIdleJumpAnim method that accepts a rangeName (string or AnimationGroup), rate (number), and loop (boolean) parameter, following the same signature as setIdleJumpAnim
2. THE CharacterController SHALL provide a setPostIdleJumpAnim method that accepts a rangeName (string or AnimationGroup), rate (number), and loop (boolean) parameter, following the same signature as setIdleJumpAnim
3. THE CharacterController SHALL provide a setPreRunJumpAnim method that accepts a rangeName (string or AnimationGroup), rate (number), and loop (boolean) parameter, following the same signature as setRunJumpAnim
4. THE CharacterController SHALL provide a setPostRunJumpAnim method that accepts a rangeName (string or AnimationGroup), rate (number), and loop (boolean) parameter, following the same signature as setRunJumpAnim
5. WHEN animations are set via the ActionMap, THE CharacterController SHALL store the animation data for preIdleJump, postIdleJump, preRunJump, and postRunJump action names using the same ActionData storage mechanism as other actions (accessible via getActionMap)
6. IF no pre-jump or post-jump animation has been registered, THEN THE CharacterController SHALL skip that animation phase and proceed directly to the main jump animation without error
7. THE ActionMap class SHALL declare preIdleJump, postIdleJump, preRunJump, and postRunJump as public ActionData properties, and the Actions constant SHALL include corresponding PREIDLEJUMP, POSTIDLEJUMP, PRERUNJUMP, and POSTRUNJUMP entries

### Requirement 7: Animation Auto-Detection

**User Story:** As a game developer, I want pre-jump and post-jump animations to be automatically detected from the skeleton or animation groups, so that I do not need to register them manually when they use standard names.

#### Acceptance Criteria

1. WHEN a skeleton is set AND it contains animation ranges named "preIdleJump", "postIdleJump", "preRunJump", or "postRunJump", THE CharacterController SHALL set the corresponding ActionData entry's exist property to true and use that animation range name for playback
2. WHEN animation groups are set AND the scene contains AnimationGroups whose name property matches "preIdleJump", "postIdleJump", "preRunJump", or "postRunJump" and that target the avatar's mesh hierarchy, THE CharacterController SHALL set the corresponding ActionData entry's exist property to true and assign that AnimationGroup for playback
3. IF a pre-jump or post-jump animation has already been registered manually via the registration API before skeleton or animation group detection runs, THEN THE CharacterController SHALL preserve the manually registered animation and not override it with auto-detected values

### Requirement 8: Input Handling During Jump Stages

**User Story:** As a game developer, I want the jump sequence to be uninterruptible once started, so that animation integrity is maintained throughout all three stages.

#### Acceptance Criteria

1. WHILE the avatar is in the pre-jump stage (from jump key press until the avatar leaves the ground), THE CharacterController SHALL ignore additional jump key presses
2. WHILE the avatar is in the airborne stage (from leaving the ground until landing), THE CharacterController SHALL ignore additional jump key presses
3. WHILE the avatar is in the pre-jump stage, THE CharacterController SHALL ignore movement key inputs that would change the movement state (walk, run, strafe)
4. WHILE the avatar is in the post-jump stage (from landing until the post-jump animation completes), THE CharacterController SHALL store at most 1 jump request IF the jump key is pressed, and execute it after the post-jump animation completes
5. WHILE the avatar is in the post-jump stage, THE CharacterController SHALL ignore movement key inputs that would change the movement state (walk, run, strafe)

### Requirement 9: Programmatic Jump API Compatibility

**User Story:** As a game developer, I want the programmatic jump() method to also trigger the three-stage jump sequence, so that NPC and UI-driven jumps benefit from the same behavior.

#### Acceptance Criteria

1. WHEN the jump() method is called programmatically while the character is grounded, THE CharacterController SHALL initiate the same jump sequence (pre-jump, ascent, descent, post-jump) as when the jump key is pressed via keyboard
2. IF the jump() method is called while a jump is already in progress (_jumpTime > 0 or pre/post-jump animation is playing), THEN THE CharacterController SHALL ignore the call and preserve the current jump state unchanged
3. IF the jump() method is called while the character is in free-fall, THEN THE CharacterController SHALL ignore the call and preserve the current free-fall state unchanged
