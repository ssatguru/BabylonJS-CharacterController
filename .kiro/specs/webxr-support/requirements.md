# Requirements Document

## Introduction

This feature adds WebXR (immersive VR and AR) support directly to the CharacterController library. Today the controller drives a third-person/first-person avatar (mode 0) or a top-down/isometric avatar (mode 1) using an `ArcRotateCamera` plus keyboard or programmatic commands. This feature absorbs a set of WebXR avatar, locomotion, and camera behaviors that were proven in a consuming application so that the application can delete its own XR code and rely on the library instead.

The design centers on two decisions.

First, **pass-or-create XR camera**. A developer enables XR either by passing an existing WebXR experience or WebXR camera, in which case the Character_Controller adopts it, or by passing nothing, in which case the Character_Controller lazily creates its own default XR experience (and therefore its own WebXR camera) and uses that. Creation is asynchronous, and success or failure is reported through a resolved boolean rather than a thrown error.

Second, **mirror the follow camera**. The Character_Controller keeps driving its existing follow `ArcRotateCamera` exactly as it does on the desktop. Each frame during an XR session it mirrors that `ArcRotateCamera` transform onto the WebXR camera via `setTransformationFromNonVRCamera(arcCamera, true)` and then re-applies the `ArcRotateCamera`'s Y (because the mirror forces the XR camera's `position.y` to zero). This carries the third-person follow experience into the headset without reimplementing follow math.

Locomotion inside a session is **thumbstick-primary**. The left thumbstick moves the Avatar (walk / walk-back / strafe) through the existing movement methods using dominant-axis gating so the Avatar never drifts sideways while backing up; clicking the left thumbstick engages the fast/run variant of the active direction. The left trigger jumps. The right thumbstick orbits the follow `ArcRotateCamera` (alpha/beta) and the right B / A face buttons dolly it (radius) â€” the camera controls never rotate the Avatar. The first-/third-person Locomotion_Mode is a camera-coupling choice applied via `setNoFirstPerson`, not a movement mechanism or a camera offset. Teleport and point-to-move remain available as secondary mechanisms but are not the active movement path.

This document defines what the Character_Controller must do. Consuming-application concerns â€” entry-point buttons and their gating UI, render-pipeline toggling (SSAO2/prepass/depth renderer), click-sensor routing specifics, any in-headset HUD, and persistence of sensitivity settings â€” are out of scope and remain the responsibility of the application. Support-detection results are exposed so an application can build such UI, but no UI is required here.

## Glossary

- **Character_Controller**: The `CharacterController` class that manages Avatar movement, animation, camera following, and collision handling.
- **Avatar**: The mesh (and its hierarchy) driven by the Character_Controller.
- **ArcRotate_Mode**: The controller's existing desktop operating mode driven by the follow `ArcRotateCamera`, comprising camera mode 0 (third/first person) and camera mode 1 (top-down/isometric).
- **Follow_Camera**: The existing `ArcRotateCamera` the Character_Controller drives to follow and orbit the Avatar. It remains the authoritative camera whose transform is mirrored onto the XR_Camera during a session.
- **XR_Experience**: A BabylonJS WebXR experience (`WebXRDefaultExperience` or its base helper) owning the XR_Camera, feature manager, and input sources.
- **XR_Camera**: The `WebXRCamera` actually rendered to the headset during a session, whose transform is set each frame from the Follow_Camera.
- **XR_Session**: An active immersive WebXR session (VR or AR) within an XR_Experience, with an entered/exited lifecycle.
- **XR_Mode**: The Character_Controller operating state in effect while an XR_Session is active, during which the Avatar is driven by XR input rather than keyboard input.
- **isInXR**: The Character_Controller query that reports `true` only while an XR_Session is active.
- **VR_Mode** / **AR_Mode**: An `immersive-vr` XR_Session and an `immersive-ar` (passthrough) XR_Session, respectively.
- **XR_Support_State**: The pair of booleans `{ vrSupported, arSupported }` describing whether the current device/browser supports each session type.
- **HMD**: The head-mounted display whose tracked pose the WebXR runtime reports.
- **XR_Controller**: A tracked WebXR input source exposing thumbstick axes and buttons, identified by handedness (left/right).
- **Locomotion_Mode**: The in-session first/third-person sub-mode, either `firstPerson` or `thirdPerson`. With thumbstick locomotion this mode selects camera coupling only, not the movement mechanism.
- **First_Person_Mode**: A Locomotion_Mode in which the Follow_Camera is allowed to pull in to the Avatar, configured via `setNoFirstPerson(false)`.
- **Third_Person_Mode**: A Locomotion_Mode in which the Follow_Camera is held at the third-person offset behind/above the Avatar, configured via `setNoFirstPerson(true)`.
- **No_First_Person**: The existing `CCSettings.noFirstPerson` flag on the Character_Controller; when `true`, First_Person_Mode is not permitted.
- **Can_First_Person**: The capability flag passed to the toggle operation, derived as the logical negation of No_First_Person.
- **Toggle_Result**: The value returned by the locomotion toggle operation: `{ mode, changed, blocked }`.
- **Thumbstick_Locomotion**: The primary movement model: the left thumbstick drives the Avatar each frame; the right thumbstick and right face buttons control the Follow_Camera.
- **Stick_Input**: The raw left-thumbstick axes `{ leftX, leftY }` sampled from the XR_Controller and fed to the pure mapper.
- **Move_Intent**: The set of continuous translation flags `{ walk, walkBack, strafeLeft, strafeRight }` derived from Stick_Input by the pure mapper.
- **Stick_Deadzone**: The threshold (default `0.15`) below which a raw stick axis is treated as zero.
- **Dominant_Axis_Gating**: The rule that at most one axis of a stick drives an action per frame â€” the axis with the larger raw magnitude wins and the other is forced off. Applied to the left stick (forward/back vs strafe; ties resolve to forward/back) and the right stick (orbit alpha vs beta; ties resolve to alpha).
- **Edge_Triggered**: Invoking a Character_Controller movement method only on the frame a direction's active state changes (`falseâ†’true` and `trueâ†’false`), not every frame.
- **Fast_Movement**: The run/fast variant (`run`, `walkBackFast`, `strafeLeftFast`, `strafeRightFast`) engaged while the left thumbstick is pressed (clicked), matched to the active direction. Hold-to-go-fast.
- **Jump**: A rising-edge press of the left XR_Controller trigger that calls `jump()`.
- **Camera_Orbit**: Adjustment of the Follow_Camera's `alpha` (azimuth) and `beta` (elevation) from the right thumbstick, orbiting the camera around the Avatar without rotating the Avatar.
- **Camera_Dolly**: Adjustment of the Follow_Camera's `radius` (distance from the Avatar) â€” continuously via the right B / A face buttons, or by the left X-button dolly-to-Avatar toggle.
- **Sensitivity_Rate**: One of three tunable rates â€” `alphaRate`, `betaRate` (Camera_Orbit, radians/frame at full deflection), and `radiusRate` (Camera_Dolly, radius units/frame while a button is held). Defaults `0.0075` / `0.003` / `0.05`; orbit maximum `0.02`, radius maximum `0.2`.
- **Teleport**: A retained BabylonJS WebXR teleportation capability, available but not the active movement path.
- **Point_to_Move**: A retained helper that drives the Avatar to a valid picked ground point via `moveTo`, available for reuse but not routed by the active flow.
- **Pointer_Selection**: The BabylonJS WebXR pointer-selection feature that emits pointer/pick events and renders controller rays and selection rings.
- **Reference_Space**: The WebXR reference space used for the session; `local-floor` here.
- **XR_Input_Mapping**: The configurable set of bindings from Bindable_Input values to Bindable_Action values that determines which XR_Controller inputs drive which Character_Controller functions during an XR_Session.
- **Bindable_Action**: A member of the defined enumeration of XR-driven Character_Controller functions that can be bound to an input: `Move`, `FastModifier`, `Jump`, `CameraOrbit`, `CameraDollyIn`, `CameraDollyOut`, `DollyToAvatarToggle`, `LocomotionModeToggle`, and `Teleport`.
- **Axis_Action**: A Bindable_Action driven by a two-axis analog input, namely `Move` and `CameraOrbit`.
- **Button_Action**: A Bindable_Action driven by a digital press input, namely `FastModifier`, `Jump`, `CameraDollyIn`, `CameraDollyOut`, `DollyToAvatarToggle`, `LocomotionModeToggle`, and `Teleport`.
- **Bindable_Input**: A member of the defined enumeration of XR_Controller inputs identified by handedness plus component: `left-thumbstick-axes`, `right-thumbstick-axes`, `left-thumbstick-press`, `right-thumbstick-press`, `left-trigger`, `right-trigger`, and the named face buttons `left-a-button`, `left-b-button`, `left-x-button`, `left-y-button`, `right-a-button`, `right-b-button`, `right-x-button`, `right-y-button`, and the grip (squeeze) buttons `left-grip`, `right-grip` (each resolved via the standard WebXR `xr-standard-squeeze` component).
- **Axis_Input**: A Bindable_Input that supplies a two-axis analog value, namely `left-thumbstick-axes` and `right-thumbstick-axes`.
- **Button_Input**: A Bindable_Input that supplies a digital pressed/released value, namely every Bindable_Input other than an Axis_Input.
- **Default_Mapping**: The XR_Input_Mapping used when the developer has not configured one, binding inputs to actions exactly as documented in Requirements 5â€“10: left-thumbstick-axesâ†’Move, left-thumbstick-pressâ†’FastModifier, left-triggerâ†’Jump, left-x-buttonâ†’DollyToAvatarToggle, right-thumbstick-axesâ†’CameraOrbit, right-b-buttonâ†’CameraDollyIn, right-a-buttonâ†’CameraDollyOut, and the A/X face buttonâ†’LocomotionModeToggle.
- **Effective_Mapping**: The XR_Input_Mapping actually in force, formed by overlaying any developer-supplied partial mapping onto the Default_Mapping so that unspecified actions retain their default bindings.
- **Mapping_Result**: The value returned by the set-mapping operation: `{ applied, rejected, reason }`, reporting whether the supplied mapping was accepted and, when rejected, why.

## Requirements

### Requirement 1: Enable XR by Adopting or Creating an XR Camera

**User Story:** As a game developer, I want to enable XR by passing my own WebXR experience or camera, or by letting the controller create one, so that I can integrate XR with or without an existing WebXR setup.

#### Acceptance Criteria

1. WHEN the developer calls the XR enable method with a provided XR_Experience or XR_Camera, THE Character_Controller SHALL adopt the provided XR_Experience or XR_Camera, register for XR_Session state changes, and resolve to boolean `true`.
2. WHEN the developer calls the XR enable method with no XR argument, THE Character_Controller SHALL lazily create a default XR_Experience via `createDefaultXRExperienceAsync`, adopt the created XR_Experience and its XR_Camera, register for XR_Session state changes, and resolve to boolean `true`.
3. THE Character_Controller SHALL perform XR enablement asynchronously and SHALL report the outcome through a resolved boolean rather than raising an error.
4. IF creating or adopting the XR_Experience or XR_Camera fails, THEN THE Character_Controller SHALL leave XR support disabled, make no change to any stored reference or registration, and resolve to boolean `false`.
5. WHEN the developer calls the XR enable method WHILE XR support is already enabled, THE Character_Controller SHALL replace the stored XR_Experience or XR_Camera reference, re-register for XR_Session state changes, and resolve to boolean `true`.
6. WHEN the developer calls the XR disable method WHILE no XR_Session is active, THE Character_Controller SHALL release the stored XR_Experience or XR_Camera reference and unregister from XR_Session state changes.
7. WHEN the developer calls the XR disable method WHILE an XR_Session is active, THE Character_Controller SHALL first restore ArcRotate_Mode behavior, then release the stored XR_Experience or XR_Camera reference, then unregister from XR_Session state changes.
8. IF the developer calls the XR disable method WHILE XR support is not enabled, THEN THE Character_Controller SHALL take no action and SHALL leave XR support disabled without raising an error.
9. WHERE XR support has not been enabled, THE Character_Controller SHALL operate identically to its behavior without this feature.

### Requirement 2: XR Session Lifecycle

**User Story:** As a game developer, I want entering and exiting XR to be reliable and repeatable, so that the avatar remains usable across immersive and desktop contexts.

#### Acceptance Criteria

1. WHEN an XR_Session is first requested, THE Character_Controller SHALL create a single default XR_Experience and SHALL reuse that XR_Experience for subsequent sessions.
2. WHEN an XR_Session starts, THE Character_Controller SHALL create the session with the `local-floor` Reference_Space.
3. THE Character_Controller SHALL expose the current session state such that `isInXR` returns `true` only while an XR_Session is active.
4. WHEN an XR_Session ends via an exit request or via HMD/session termination, THE Character_Controller SHALL exit XR_Mode, stop XR-driven movement, and restore the recorded pre-session state.
5. WHEN the developer requests exit WHILE no XR_Session is active, THE Character_Controller SHALL perform no destructive action and SHALL leave the desktop state unchanged.
6. WHEN the developer exits and later re-enters XR, THE Character_Controller SHALL start a functioning XR_Session without requiring a page reload.
7. WHEN an XR_Session is entered WHILE XR support is disabled, THE Character_Controller SHALL remain in ArcRotate_Mode.

### Requirement 3: Locomotion Sub-Mode State Machine

**User Story:** As a game developer, I want a well-defined first/third-person state that respects the avatar configuration, so that switching modes behaves predictably.

#### Acceptance Criteria

1. THE Character_Controller SHALL maintain a Locomotion_Mode that is either `firstPerson` or `thirdPerson`.
2. THE Character_Controller SHALL provide a toggle operation that accepts a Can_First_Person capability flag and returns a Toggle_Result describing the resulting mode, whether the mode changed, and whether the toggle was blocked.
3. WHEN a toggle is requested toward `firstPerson` AND Can_First_Person is false, THE Character_Controller SHALL keep the Locomotion_Mode at its current value, report the toggle as blocked, and report the mode as unchanged.
4. WHEN a toggle is requested toward `firstPerson` AND Can_First_Person is true, THE Character_Controller SHALL set the Locomotion_Mode to `firstPerson` and SHALL report the mode as changed when it differs from the prior mode.
5. WHEN a toggle is requested toward `thirdPerson`, THE Character_Controller SHALL set the Locomotion_Mode to `thirdPerson` regardless of Can_First_Person and SHALL never report that transition as blocked.
6. FOR ANY sequence of toggle operations in which every operation supplies Can_First_Person as false, THE Locomotion_Mode SHALL never become `firstPerson`.
7. WHEN an XR_Session starts AND No_First_Person is false, THE Character_Controller SHALL default the Locomotion_Mode to `firstPerson`.
8. WHEN an XR_Session starts AND No_First_Person is true, THE Character_Controller SHALL default the Locomotion_Mode to `thirdPerson`.

### Requirement 4: Locomotion Mode Selects Camera Coupling

**User Story:** As a user, I want the first/third-person mode to change how the camera frames my avatar, so that I can choose a first-person or over-the-shoulder view while moving with the sticks.

#### Acceptance Criteria

1. WHEN the Locomotion_Mode is applied or changed to `firstPerson`, THE Character_Controller SHALL configure the camera coupling via `setNoFirstPerson(false)`.
2. WHEN the Locomotion_Mode is applied or changed to `thirdPerson`, THE Character_Controller SHALL configure the camera coupling via `setNoFirstPerson(true)`.
3. WHEN any Locomotion_Mode is applied, THE Character_Controller SHALL ensure the Teleport capability is not active, because Thumbstick_Locomotion is the movement mechanism.
4. WHERE the Locomotion_Mode changes, THE Character_Controller SHALL leave the movement mechanism (thumbstick-driven walk/strafe) unchanged, altering only camera coupling.

### Requirement 5: In-Session Locomotion Toggle Control

**User Story:** As a user, I want to switch between first- and third-person camera coupling at any time with a controller button, so that I can choose my view without leaving XR.

#### Acceptance Criteria

1. THE Character_Controller SHALL bind the XR_Controller A/X face button to request a Locomotion_Mode toggle during an XR_Session, and SHALL NOT bind the toggle to the trigger.
2. WHEN the toggle control is activated, THE Character_Controller SHALL derive Can_First_Person as the logical negation of No_First_Person and SHALL pass it to the toggle operation.
3. WHEN a toggle results in a changed Locomotion_Mode, THE Character_Controller SHALL reconfigure the camera coupling to match the new mode.
4. IF a toggle toward `firstPerson` is blocked because No_First_Person is true, THEN THE Character_Controller SHALL remain in `thirdPerson` and SHALL provide lightweight feedback via a best-effort haptic pulse on the requesting XR_Controller.
5. THE Character_Controller SHALL allow the toggle control to be activated repeatedly within a single XR_Session.

### Requirement 6: Thumbstick Movement (Left Stick)

**User Story:** As a VR user, I want to move my avatar by pushing the left thumbstick, so that I can walk and strafe naturally through the world in XR.

#### Acceptance Criteria

1. WHILE an XR_Session is active, THE Character_Controller SHALL sample the bound left thumbstick each render frame and map its axes to a Move_Intent via a pure mapper that applies the Stick_Deadzone.
2. WHEN the left thumbstick is pushed forward (`leftY < -deadzone`), THE Character_Controller SHALL drive the Avatar forward via `walk`; WHEN pulled back (`leftY > deadzone`), THE Character_Controller SHALL drive the Avatar backward via `walkBack`.
3. WHEN the left thumbstick is pushed right (`leftX > deadzone`), THE Character_Controller SHALL strafe the Avatar right via `strafeRight`; WHEN pushed left (`leftX < -deadzone`), THE Character_Controller SHALL strafe the Avatar left via `strafeLeft`.
4. WHEN mapping the left thumbstick, THE Character_Controller SHALL apply Dominant_Axis_Gating so that at most one of {forward/back} or {strafe} is active per frame, choosing the axis with the larger raw magnitude and resolving ties to the forward/back axis.
5. WHILE any raw left-stick axis is within the Stick_Deadzone, THE Character_Controller SHALL treat that axis as zero so resting drift produces no movement.
6. THE Character_Controller SHALL invoke a movement method Edge_Triggered, only on the frame a direction's active state changes, rather than every frame.
7. WHEN an XR_Session ends WHILE a movement is active, THE Character_Controller SHALL apply a neutral Move_Intent so the Avatar is not left moving under ArcRotate_Mode.
8. THE Character_Controller SHALL provide a method to set the Stick_Deadzone, defaulting to `0.15`, and IF a value outside `[0, 1]` is provided, THEN THE Character_Controller SHALL clamp the value to the nearest bound within `[0, 1]`.

### Requirement 7: Fast Movement

**User Story:** As a VR user, I want to move faster while I hold the thumbstick pressed, so that I can cover distance quickly without a separate mode.

#### Acceptance Criteria

1. WHILE the left thumbstick is pressed (clicked) AND a movement direction is active, THE Character_Controller SHALL drive the Avatar using the Fast_Movement variant matching that direction (`run` for forward, `walkBackFast`, `strafeLeftFast`, or `strafeRightFast`).
2. WHEN the left thumbstick is released from pressed WHILE a direction remains active, THE Character_Controller SHALL switch that direction from its Fast_Movement variant back to its normal variant.
3. WHEN the Fast_Movement state changes for an active direction, THE Character_Controller SHALL stop the previous-speed movement method and start the new-speed method so both are never active at once.

### Requirement 8: Jump (Left Trigger)

**User Story:** As a VR user, I want to jump with the left trigger, so that I can navigate vertical obstacles in XR.

#### Acceptance Criteria

1. WHEN the left XR_Controller trigger transitions to pressed (rising edge) during an XR_Session, THE Character_Controller SHALL call `jump()` once.
2. WHEN the right XR_Controller trigger is pressed, THE Character_Controller SHALL NOT trigger a jump, because jump is bound only to the left XR_Controller.
3. WHEN an XR_Session ends, THE Character_Controller SHALL detach the left-trigger jump observers so repeated enter/exit cycles do not accumulate handlers.

### Requirement 9: Camera Orbit (Right Stick)

**User Story:** As a VR user, I want to orbit the camera around my avatar with the right thumbstick, so that I can look around without turning the avatar.

#### Acceptance Criteria

1. WHILE an XR_Session is active, WHEN the right thumbstick X axis is beyond the Stick_Deadzone, THE Character_Controller SHALL change the Follow_Camera's `alpha` by `alphaRate` scaled by the raw axis value.
2. WHILE an XR_Session is active, WHEN the right thumbstick Y axis is beyond the Stick_Deadzone, THE Character_Controller SHALL change the Follow_Camera's `beta` by `betaRate` scaled by the raw axis value, decreasing `beta` for forward (`rightY < 0`) and increasing it for back, then clamp `beta` within the camera's beta limits or a pole-avoiding fallback range.
3. WHEN applying Camera_Orbit, THE Character_Controller SHALL apply Dominant_Axis_Gating so that only one of `alpha` or `beta` changes per frame, choosing the axis with the larger raw magnitude and resolving ties to `alpha`.
4. WHILE applying Camera_Orbit, THE Character_Controller SHALL NOT rotate the Avatar.

### Requirement 10: Camera Dolly (Right B / A Buttons and Left X Button)

**User Story:** As a VR user, I want to move the camera closer to or farther from my avatar, so that I can frame the view I want.

#### Acceptance Criteria

1. WHILE the right XR_Controller B face button is held during an XR_Session, THE Character_Controller SHALL decrease the Follow_Camera's `radius` by `radiusRate` each frame.
2. WHILE the right XR_Controller A face button is held during an XR_Session, THE Character_Controller SHALL increase the Follow_Camera's `radius` by `radiusRate` each frame.
3. WHEN a Camera_Dolly changes `radius`, THE Character_Controller SHALL clamp `radius` within the Follow_Camera's `lowerRadiusLimit` and `upperRadiusLimit` when present.
4. WHEN the left XR_Controller X face button transitions to pressed (rising edge), THE Character_Controller SHALL toggle the Follow_Camera between a dollied-to-Avatar state (snapping `radius` to `lowerRadiusLimit`, or `0` when no limit, and remembering the prior `radius`) and a restored state (returning `radius` to the remembered value).
5. THE Character_Controller SHALL capture the right B / A dolly button components only on the right XR_Controller by handedness, and SHALL clear those captures when the XR_Session ends.

### Requirement 11: XR Camera Follows the Avatar

**User Story:** As a VR user, I want the headset view to follow and orbit my avatar as I move and adjust the camera, so that the third-person follow experience carries into XR.

#### Acceptance Criteria

1. WHILE an XR_Session is active, THE Character_Controller SHALL, each render frame, mirror the Follow_Camera's transform onto the XR_Camera via `setTransformationFromNonVRCamera(arcCamera, true)`.
2. WHEN the per-frame mirror forces the XR_Camera's `position.y` to zero, THE Character_Controller SHALL then set the XR_Camera's `position.y` to the Follow_Camera's current Y so camera height driven by `beta` is preserved.
3. THE Character_Controller SHALL perform the per-frame follow after sampling the sticks so the headset view reflects the same-frame Follow_Camera pose.
4. WHEN an XR_Session ends, THE Character_Controller SHALL detach the per-frame render observer so repeated enter/exit cycles do not accumulate render callbacks.

### Requirement 12: Sensitivity Rates

**User Story:** As a game developer, I want to adjust orbit and dolly sensitivity through the controller, so that I can tune navigation feel for my game.

#### Acceptance Criteria

1. THE Character_Controller SHALL hold the three Sensitivity_Rate values (`alphaRate`, `betaRate`, `radiusRate`) as adjustable instance state, initialized to their defaults (`0.0075`, `0.003`, `0.05`).
2. THE Character_Controller SHALL provide setters for `alphaRate` and `betaRate` that clamp the value to the range `0â€¦0.02`.
3. THE Character_Controller SHALL provide a setter for `radiusRate` that clamps the value to the range `0â€¦0.2`.
4. WHERE a Sensitivity_Rate setter receives a non-finite value, THE Character_Controller SHALL leave the corresponding rate unchanged.

### Requirement 13: Controller Ray Management

**User Story:** As a VR user, I want the controller pointer feedback to make sense for how the controllers are used, so that pointing is clear and never hidden behind other geometry.

#### Acceptance Criteria

1. WHILE an XR_Session is active, THE Character_Controller SHALL hide the left XR_Controller's Pointer_Selection laser ray and selection ring, because the left trigger is bound to jump.
2. WHILE an XR_Session is active, THE Character_Controller SHALL raise the right XR_Controller's Pointer_Selection ring and laser above other geometry's rendering group so they remain visible.
3. WHERE the Pointer_Selection meshes are created asynchronously after an XR_Controller is added, THE Character_Controller SHALL retry the hide and the raise each render frame until they succeed, then SHALL stop retrying.
4. WHEN an XR_Session ends, THE Character_Controller SHALL reset the ray-hide and ring-raise state so the next session re-applies them to its controllers.

### Requirement 14: Retained Teleport and Point-to-Move

**User Story:** As a game developer, I want teleport and point-to-move preserved as available mechanisms, so that I can offer alternative movement even though thumbstick locomotion is primary.

#### Acceptance Criteria

1. THE Character_Controller SHALL retain a Teleport-capable path as an available mechanism, and SHALL NOT enable it as the active movement path during a session.
2. WHERE the Point_to_Move helper is invoked with a valid picked ground point, THE Character_Controller SHALL drive the Avatar to that point via `moveTo`.
3. WHERE the Point_to_Move helper is invoked with no valid picked point, THE Character_Controller SHALL NOT invoke `moveTo`.
4. THE Character_Controller SHALL NOT route XR_Controller select through the Point_to_Move helper during the active session, because Thumbstick_Locomotion is the movement mechanism.

### Requirement 15: Desktop and Controller State Preservation

**User Story:** As a game developer, I want the controller and desktop behavior to be exactly as they were before XR after a session ends, so that immersive preview never disrupts subsequent use.

#### Acceptance Criteria

1. WHEN an XR_Session starts, THE Character_Controller SHALL keep the Character_Controller running WHILE disabling only its keyboard input, recording the prior keyboard-enabled and running state.
2. WHEN an XR_Session ends, THE Character_Controller SHALL restore the recorded keyboard-enabled and running state.
3. WHEN an XR_Session ends, THE Character_Controller SHALL restore ArcRotate_Mode as the active rendered camera behavior.
4. WHEN an XR_Session ends, THE Character_Controller SHALL detach or clear the observers, listeners, and component captures it added for the session so that repeated enter/exit cycles do not accumulate handlers.
5. WHILE entering, running, and exiting an XR_Session, THE Character_Controller SHALL NOT alter its existing collision handling, slope limits, or animation behavior beyond the documented camera and input changes.

### Requirement 16: XR Session Support Detection

**User Story:** As a game developer, I want to know whether immersive VR and AR are available, so that I can present appropriate UI to the user.

#### Acceptance Criteria

1. WHEN the developer queries XR_Support_State, THE Character_Controller SHALL determine support by querying WebXR session support for `immersive-vr` and `immersive-ar` independently.
2. IF the WebXR API is unavailable (no `navigator.xr`), THEN THE Character_Controller SHALL resolve XR_Support_State to `{ vrSupported: false, arSupported: false }` without raising an error.
3. IF a support query for a given session type rejects or throws, THEN THE Character_Controller SHALL treat that session type as unsupported rather than propagating the error.
4. IF XR support has not been enabled, THEN THE Character_Controller SHALL resolve to boolean `false` for both immersive VR and immersive AR support queries.
5. THE Character_Controller SHALL expose XR_Support_State so a consuming application can gate its own entry-point UI.

### Requirement 17: Movement and Animation Consistency in XR

**User Story:** As a VR user, I want my avatar to animate and collide the same way it does on desktop, so that XR movement feels consistent with the rest of the game.

#### Acceptance Criteria

1. WHILE an XR_Session is active, THE Character_Controller SHALL apply Avatar movement through the existing `moveWithCollisions()`-based movement so XR movement respects collisions and slope limits.
2. WHILE an XR_Session is active, THE Character_Controller SHALL play movement and idle animations consistent with the Avatar's current action.
3. WHEN a Jump is requested WHILE a movement is active, THE Character_Controller SHALL exhibit mutually exclusive jump-and-move behavior, because `jump()` resets the movement action state; simultaneous move-and-jump is a known limitation.

### Requirement 18: Configurable XR Input Mapping

**User Story:** As a game developer, I want to configure which XR controller inputs drive which Character_Controller functions, so that I am not locked to the default bindings and can match my game's control scheme.

#### Acceptance Criteria

1. THE Character_Controller SHALL expose a set-mapping operation that accepts an XR_Input_Mapping binding Bindable_Input values to Bindable_Action values and returns a Mapping_Result reporting whether the mapping was applied or rejected and, when rejected, the reason.
2. THE Character_Controller SHALL define the bindable actions as the Bindable_Action enumeration (`Move`, `FastModifier`, `Jump`, `CameraOrbit`, `CameraDollyIn`, `CameraDollyOut`, `DollyToAvatarToggle`, `LocomotionModeToggle`, `Teleport`).
3. THE Character_Controller SHALL define the bindable inputs as the Bindable_Input enumeration, each value identifying an XR_Controller input by handedness plus component (thumbstick axes, thumbstick press, trigger, grip/squeeze, and the a/b/x/y face buttons for each hand).
4. WHERE the developer has not configured an XR_Input_Mapping, THE Character_Controller SHALL use the Default_Mapping so that behavior is identical to Requirements 5 through 10.
5. WHEN the developer queries the Default_Mapping, THE Character_Controller SHALL return the documented default bindings.
6. WHEN the developer queries the Effective_Mapping, THE Character_Controller SHALL return the bindings currently in force, formed by overlaying any developer-supplied partial mapping onto the Default_Mapping.
7. WHEN the developer sets a valid XR_Input_Mapping, THE Character_Controller SHALL apply the specified bindings on the next XR_Session entry and SHALL report the Mapping_Result as applied.
8. WHEN the developer sets a valid XR_Input_Mapping WHILE an XR_Session is active, THE Character_Controller SHALL provide a re-apply operation that rebinds the active session's inputs to the newly set mapping without requiring session exit.
9. WHERE a supplied XR_Input_Mapping specifies bindings for only some Bindable_Action values, THE Character_Controller SHALL retain the Default_Mapping binding for each unspecified Bindable_Action.
10. WHERE a Bindable_Action is left unbound in the Effective_Mapping, THE Character_Controller SHALL leave that action inactive so it does not fire during an XR_Session.
11. IF a supplied XR_Input_Mapping references an action outside the Bindable_Action enumeration or an input outside the Bindable_Input enumeration, THEN THE Character_Controller SHALL reject the entire mapping, retain the previously effective mapping, and report the Mapping_Result as rejected with the reason.
12. IF a supplied XR_Input_Mapping binds a single Bindable_Input to two or more conflicting Bindable_Action values, THEN THE Character_Controller SHALL reject the entire mapping, retain the previously effective mapping, and report the Mapping_Result as rejected with the reason.
13. IF a supplied XR_Input_Mapping binds an Axis_Action to a Button_Input or binds a Button_Action to an Axis_Input, THEN THE Character_Controller SHALL reject the entire mapping, retain the previously effective mapping, and report the Mapping_Result as rejected with the reason.
14. WHEN a set-mapping operation is rejected for any reason, THE Character_Controller SHALL leave the Effective_Mapping unchanged from its value before the operation.
