# Requirements Document

## Introduction

The character controller supports a first-person mode (camera mode 0 with the `ArcRotateCamera` pulled in close to the avatar) that is available both outside XR and inside an active WebXR session. This feature makes first-person facing behavior consistent across those two modes and corrects the orientation coupling in XR.

Two coupled behaviors are specified:

1. **XR headset drives the arc camera (XR-scoped).** While an immersive WebXR session is active and first-person coupling is engaged, the rendered headset (`WebXRCamera`) orientation drives the owned `ArcRotateCamera` — the headset's horizontal direction (yaw) drives the arc camera's `alpha` and the headset's vertical direction (pitch) drives the arc camera's `beta`. This reverses the current per-frame follow, which mirrors the arc camera onto the XR camera (arc drives XR) and therefore leaves `alpha`/`beta` stale as the user physically turns their head.

2. **Avatar yaw follows the arc camera in first person (XR and non-XR).** Whenever the controller is in first-person mode, the avatar's horizontal facing continuously follows the `ArcRotateCamera`'s `alpha` (yaw), regardless of whether movement keys are pressed. Today the avatar aligns to the camera only along the movement/turn code path (that is, only while movement keys are held), so in non-XR first person the avatar does not rotate to match the arc camera direction. Making this alignment continuous produces identical first-person facing behavior in both XR and non-XR: in XR the arc `alpha` is driven by the headset (behavior 1); in non-XR the arc `alpha` is driven by the existing camera controls.

Behavior outside first-person mode and in third-person / camera mode 1 is unchanged.

## Glossary

- **Character_Controller**: The core controller (`CharacterController` in `src/CharacterController.ts`) that owns the avatar, the `ArcRotateCamera`, and (via composition) the `XR_Controller`.
- **XR_Controller**: The WebXR glue (`XRController` in `src/xr/XRController.ts`) owned by the `Character_Controller`, responsible for session lifecycle and the per-frame camera synchronization.
- **Arc_Camera**: The `ArcRotateCamera` owned by the `Character_Controller`, used in camera mode 0. Its orientation is expressed by `alpha` (horizontal angle / yaw, measured anti-clockwise) and `beta` (vertical angle / pitch).
- **XR_Camera**: The rendered `WebXRCamera` for the active immersive session, returned by `getXRCamera()`. Its orientation reflects the physical headset pose.
- **Headset_Yaw**: The horizontal component of the `XR_Camera` orientation, projected onto the world horizontal plane.
- **Headset_Pitch**: The vertical component of the `XR_Camera` orientation.
- **XR_Session_Active**: The state reported by `XR_Controller.isInXR()` — true only while an immersive XR session is running.
- **First_Person_Mode**: The camera-coupling state (tracked by `_inFP` in the `Character_Controller`) in which first-person mode is active: entered when the `Arc_Camera` radius is at or below its `lowerRadiusLimit` while `No_First_Person` is disabled, forcing camera mode 0. This state is independent of XR and can hold both inside and outside an XR session.
- **No_First_Person**: The gate (`_noFirstPerson`, set via `setNoFirstPerson`) that, when enabled, prevents entry into First_Person_Mode.
- **XR_First_Person_Coupling**: The compound condition that is true exactly when `XR_Session_Active` is true AND `First_Person_Mode` is active (with `XR_Controller.canFirstPerson()` permitting first person).
- **Avatar_Yaw**: The horizontal facing direction (`rotation.y`, measured clockwise) of the avatar mesh owned by the `Character_Controller`.
- **Facing_Offset**: The `Character_Controller` internal offset (`_av2cam`) relating `Avatar_Yaw` to `Arc_Camera` `alpha`, such that the aligned `Avatar_Yaw` equals `Facing_Offset - alpha`. Its value depends on the `faceForward` setting and the scene handedness.
- **Camera_Sync_Update**: The per-frame synchronization step performed by the `XR_Controller` (extending the current `_updateXRCameraFollow` responsibility).
- **Avatar_Follow_Update**: The per-frame step in the `Character_Controller` that continuously aligns `Avatar_Yaw` to the `Arc_Camera` `alpha` while in First_Person_Mode.

## Requirements

### Requirement 1

**User Story:** As a user in a first-person XR session, I want the arc camera's horizontal angle to follow my headset's horizontal direction, so that the camera frame stays aligned with where I am looking.

#### Acceptance Criteria

1. WHILE XR_First_Person_Coupling is true, THE XR_Controller SHALL set the Arc_Camera `alpha` to the value derived from the Headset_Yaw of the XR_Camera.
2. WHILE XR_First_Person_Coupling is true, WHEN the Headset_Yaw changes between frames, THE XR_Controller SHALL update the Arc_Camera `alpha` to reflect the new Headset_Yaw on the same frame the change is observed.
3. WHILE XR_First_Person_Coupling is true, THE Camera_Sync_Update SHALL derive the Arc_Camera `alpha` from the XR_Camera orientation rather than mirroring the Arc_Camera orientation onto the XR_Camera.

### Requirement 2

**User Story:** As a user in a first-person XR session, I want the arc camera's vertical angle to follow my headset's vertical direction, so that looking up and down matches the rendered camera framing.

#### Acceptance Criteria

1. WHILE XR_First_Person_Coupling is true, THE XR_Controller SHALL set the Arc_Camera `beta` to the value derived from the Headset_Pitch of the XR_Camera.
2. WHILE XR_First_Person_Coupling is true, WHEN the Headset_Pitch changes between frames, THE XR_Controller SHALL update the Arc_Camera `beta` to reflect the new Headset_Pitch on the same frame the change is observed.
3. WHILE XR_First_Person_Coupling is true, THE XR_Controller SHALL constrain the derived Arc_Camera `beta` to the valid `ArcRotateCamera` beta range so the assigned value remains within the camera's accepted bounds.

### Requirement 3

**User Story:** As a user in first-person mode, I want the avatar to keep facing the same horizontal direction as the arc camera at all times, so that first-person facing is consistent whether or not I am moving and whether or not I am in XR.

#### Acceptance Criteria

1. WHILE First_Person_Mode is active, THE Character_Controller SHALL set the Avatar_Yaw to `Facing_Offset - alpha` of the Arc_Camera on every frame, independent of whether any movement key is pressed.
2. WHILE First_Person_Mode is active, WHEN the Arc_Camera `alpha` changes between frames, THE Character_Controller SHALL update the Avatar_Yaw to reflect the new `alpha` on the same frame the change is observed.
3. WHILE First_Person_Mode is active AND XR_Session_Active is false, THE Character_Controller SHALL align the Avatar_Yaw to the Arc_Camera `alpha` driven by the existing camera controls.
4. WHILE First_Person_Mode is active AND XR_Session_Active is true, THE Character_Controller SHALL align the Avatar_Yaw to the Arc_Camera `alpha` driven by the XR_Camera per Requirement 1.

### Requirement 4

**User Story:** As a developer using the controller outside first person or in third person, I want the existing arc camera and avatar behavior preserved, so that adding this feature does not regress non-first-person, third-person, or camera-mode-1 use.

#### Acceptance Criteria

1. WHILE XR_Session_Active is false, THE XR_Controller SHALL leave the Arc_Camera `alpha` and `beta` unchanged by the Camera_Sync_Update.
2. WHILE XR_Session_Active is true AND First_Person_Mode is inactive, THE XR_Controller SHALL leave the Arc_Camera `alpha` and `beta` unchanged by the Camera_Sync_Update.
3. WHILE First_Person_Mode is inactive, THE Character_Controller SHALL leave the Avatar_Yaw unchanged by the Avatar_Follow_Update.
4. WHEN First_Person_Mode transitions from active to inactive, THE Character_Controller SHALL stop applying the Avatar_Follow_Update on subsequent frames.
5. WHEN First_Person_Mode transitions from active to inactive WHILE XR_Session_Active is true, THE XR_Controller SHALL stop driving the Arc_Camera orientation from the XR_Camera on subsequent frames.

### Requirement 5

**User Story:** As a developer running the controller inside the render loop, I want the synchronization to be robust and correctly ordered, so that a missing or mocked camera never throws and facing reflects the current-frame pose.

#### Acceptance Criteria

1. IF the XR_Camera is absent, THEN THE XR_Controller SHALL complete the Camera_Sync_Update without throwing and SHALL leave the Arc_Camera orientation unchanged.
2. IF the Arc_Camera is absent, THEN THE Character_Controller SHALL complete the Avatar_Follow_Update without throwing and SHALL leave the Avatar_Yaw unchanged.
3. WHILE XR_First_Person_Coupling is true, WHEN the Camera_Sync_Update runs each frame, THE XR_Controller SHALL perform the synchronization after the per-frame stick sampling so the assigned Arc_Camera orientation reflects the same-frame XR_Camera pose.
4. WHILE First_Person_Mode is active, WHEN the Avatar_Follow_Update runs each frame, THE Character_Controller SHALL apply the update after the Arc_Camera `alpha` has been set for the frame so the Avatar_Yaw reflects the same-frame `alpha`.

### Requirement 6

**User Story:** As a maintainer, I want the orientation derivations implemented as pure, testable logic, so that they can be property-tested without instantiating a BabylonJS scene.

#### Acceptance Criteria

1. THE Character_Controller SHALL expose the Headset_Yaw and Headset_Pitch derivation from an XR_Camera orientation as a pure function that takes orientation input and returns `alpha` and `beta` values without referencing a BabylonJS scene.
2. THE Character_Controller SHALL expose the Avatar_Yaw derivation from an Arc_Camera `alpha` and the Facing_Offset as a pure function that takes those inputs and returns the aligned Avatar_Yaw value without referencing a BabylonJS scene.
3. WHERE a new BabylonJS type is imported into a library source file for this feature, THE Character_Controller build SHALL include the corresponding entries in the ESM import map (`webpack.es-externals.js`) and the ESM bridge (`src/_babylonjs-esm-bridge.js`).
