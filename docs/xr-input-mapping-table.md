# WebXR Controller Input Mapping Table

This table describes what functionality each input from the left and right VR controllers is mapped to in the BabylonJS Character Controller's XRController implementation.

## Default Input Mapping (Default XR Input Configuration)

| Controller | Input Component      | Button/Action Name        | Functionality                           |
|------------|---------------------|---------------------------|----------------------------------------|
| **Left**   | Thumbstick (Axes)   | Move                      | Character movement (forward/back, left/right strafe) |
| **Left**   | Squeeze Button      | Fast Modifier             | Toggle fast modifier mode (R8.1)       |
| **Left**   | Trigger Button      | Jump                      | Perform jump action                    |
| **Right**  | Thumbstick (Axes)   | Camera Orbit              | Rotate camera around character (yaw/roll) |
| **Right-B**| B Button            | Camera Dolly In           | Move camera closer to avatar           |
| **Right-A**| A Button            | Camera Dolly Out          | Move camera further from avatar        |
| **Left-X** | X Button            | Dolly To Avatar Toggle    | Toggle camera dolly-to-avatar mode     |
| **Left-A** | A Button            | Locomotion Mode Toggle    | Toggle locomotion mode (R4.3)          |
| **Both**   | None                | Teleport                  | Unbound (null) - teleportation disabled when locomotion mode active (R4.3) |

---

## Input Component Types

### Analog Inputs (Two-Axis Stick Values)
- Supply continuous values in range [-1, 1] on X and Y axes
- Mapped to movement/orbit actions

### Button Inputs (Digital On/Off)
- Pressed state = true, released = false
- Used for toggles and discrete actions

---

## Controller Handedness

| Hand   | Component Type              | Face Buttons Available     |
|--------|----------------------------|---------------------------|
| Left   | Thumbstick, Trigger, Squeeze| A, B, X, Y               |
| Right  | Thumbstick, Trigger, Squeeze| A, B, X, Y               |

---

## WebXR Component IDs Used

- `xr-standard-thumbstick` - Analog thumbstick (axes + press)
- `xr-standard-trigger` - Pull trigger button
- `xr-standard-squeeze` - Grip/squeeze button
- `a-button` / `b-button` / `x-button` / `y-button` - Face buttons

---

## Notes

1. **Move** action uses left thumbstick axes for analog movement control
2. **Jump** uses left trigger (pulling up on the controller)
3. Camera controls are on the right hand for natural 360° orbit manipulation
4. Dolly-in/out uses face buttons on right controller
5. Teleportation is intentionally unbound when locomotion mode is active
6. All mappings can be customized via mergeXRInputMapping()

---

*Source: XRInputMapping.ts - DEFAULT_XR_INPUT_MAPPING constant*
