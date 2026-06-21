[![npm](https://img.shields.io/npm/v/babylonjs-charactercontroller.svg)](https://npmjs.org/package/babylonjs-charactercontroller)
[![npm](https://img.shields.io/npm/dm/babylonjs-charactercontroller.svg)](https://npmjs.org/package/babylonjs-charactercontroller)

# BabylonJS-CharacterController

A 3rd person CharacterController for use in [BabylonJS](http://www.babylonjs.com/) (a 3D HTML Webgl framework) applications.  
It uses the collider and moveWithCollision() function to move the character around. It uses physics kinematic equations to calculate movements like jump, fall, slide. It does not use any physics engine. It does not react to forces but does apply forces to other physics object. The force applied cannot be controlled.  
For demo see  
<a href="https://ssatguru.github.io/BabylonJS-CharacterController-Samples/demo/" target="_blank">https://ssatguru.github.io/BabylonJS-CharacterController-Samples/demo/</a>

## About

It currently supports

- idle
- preIdleJump
- idleJump
- postIdleJump
- walk
- walkBack
- walkBackFast
- run
- preRunJump
- runJump
- postRunJump
- fall
- turnRight
- turnRightFast
- turnLeft
- turnLeftFast
- strafeLeft
- strafeLeftFast
- strafeRight
- strafeRightFast
- slideBack
- moveTo (goal-oriented movement toward a position or TransformNode)
- turnTo (goal-oriented rotation toward a position, TransformNode, or angle)

It supports two modes or ways of moving the character.  
Mode 0, suitable for third/first person kind of game. Here the camera follows and turns with the character or turns the character.  
Mode 1, suitable for top down isometric kind of game. The camera follows the character but doesn't turn with or turn the character.  

Further within Mode  0, the third/first person mode, two turning modes are supported.  
In "turning on" mode, the left and right keys make the character turn left or right and the back key makes the character walk backward with back facing the camera.  
In "turning off" mode, the left and right keys make the character face and move left or right and the back keys makes the character turn around and move towards the camera.  

See "setMode" and "Turning On/Off" below.  

Further it supports constraining character from traversing slopes inclined at certain angles.

It also supports camera "elasticity". In other words if a mesh comes between the camera and character, the camera snaps to
a position in front of the mesh. This way the character is always in view.

It can also enter first person view if the camera comes very close to the character/character

## Quick start

1. add the following dependencies

    ```
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="CharacterController.js"></script>
    ```

    See INSTALL below to find where you can get "CharacterController.js".

2. instantiate character controller and start it.

    ```
      //------------------Character Controller -------------------------------------------------
      // fourth parm actionMap is optional and is used to map actions to animation groups or
      // animation ranges and other action data like speed, sound, key bindings etc.
      var cc = new CharacterController(character, camera, scene, actionMap);
      cc.start();
    ```

see "BabylonJS-CharacterController-Samples" [https://github.com/ssatguru/BabylonJS-CharacterController-Samples](https://github.com/ssatguru/BabylonJS-CharacterController-Samples) for a few simple samples to help you get going

## INSTALL

You can get the "CharacterController.js" from its git repository "dist" folder or "releases" section  
[https://github.com/ssatguru/BabylonJS-CharacterController/tree/master/dist](https://github.com/ssatguru/BabylonJS-CharacterController/tree/master/dist)  
[https://github.com/ssatguru/BabylonJS-CharacterController/releases](https://github.com/ssatguru/BabylonJS-CharacterController/releases)

You can also install it from npm

```
npm install babylonjs-charactercontroller
```

## Usage

This library supports two module formats:

- **UMD** — for use with the `babylonjs` package (script tags, CommonJS, AMD)
- **ES module** — for use with `@babylonjs/core` (tree-shakeable, modern bundlers)

Install the package:

```
npm install babylonjs-charactercontroller
```

Then install the BabylonJS package that matches your project's module style:

```
# If using the UMD/global style:
npm install babylonjs

# If using the ES module style:
npm install @babylonjs/core
```

You only need one — the package declares both as optional peer dependencies.

---

### ES Module usage (with `@babylonjs/core`)

If your project uses `@babylonjs/core` with individual sub-path imports, use the `/es` subpath export:

```typescript
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { CharacterController } from "babylonjs-charactercontroller/es";

const engine = new Engine(canvas, true);
const scene = new Scene(engine);
const camera = new ArcRotateCamera("cam", 0, 1, 10, Vector3.Zero(), scene);

const cc = new CharacterController(character, camera, scene);
cc.start();
```

The `/es` build imports from `@babylonjs/core` sub-paths internally, so your bundler can tree-shake unused BabylonJS modules.

---

### UMD usage (with `babylonjs`)

If your project uses the `babylonjs` UMD package, use the bare import:

```typescript
import { Engine, Scene, ArcRotateCamera, Vector3 } from "babylonjs";
import { CharacterController } from "babylonjs-charactercontroller";
```

This also works with the explicit `/umd` subpath:

```typescript
import { CharacterController } from "babylonjs-charactercontroller/umd";
```

---

### Import paths summary

| Import path | Resolves to | Requires |
|---|---|---|
| `"babylonjs-charactercontroller"` | UMD build | `babylonjs` |
| `"babylonjs-charactercontroller/es"` | ES module build | `@babylonjs/core` |
| `"babylonjs-charactercontroller/umd"` | UMD build | `babylonjs` |

---

Project "BabylonJS-CharacterController-Samples" [https://github.com/ssatguru/BabylonJS-CharacterController-Samples](https://github.com/ssatguru/BabylonJS-CharacterController-Samples) has a
collection of sample projects to show how to use this from TypeScript, NodeJs, AMD or plain vanilla JavaScript applications.

Below is a quick summary of how you can use this as other UMD module types.

CommonJS/NodeJS Module

```
let BABYLON = require("babylonjs");
let CharacterController = require("babylonjs-CharacterController").CharacterController;
...
let engine = new BABYLON.Engine(canvas, true);
...
let characterController = new CharacterController(character, camera, scene);
...

```

AMD Module

```
<script src="./lib/require.js"></script>
<script>
	require.config({
		baseUrl: ".",
		paths: {
			"babylonjs": "./lib/babylon",
			"cc": "./lib/CharacterController"
		}
	});

	require(['babylonjs', 'cc'], function (BABYLON, cc) {
		let CharacterController = cc.CharacterController;
		...
		let engine = new BABYLON.Engine(canvas, true);
		...
		let characterController = new CharacterController(character, camera, scene);
		...
	});
</script>
```

Global Module

```
<script src="./lib/babylon.js"></script>
<script src="./lib/CharacterController.js"></script>
<script>
...
let engine = new BABYLON.Engine(canvas, true);
...
let characterController = new CharacterController(character, camera, scene);
...
</script>
```

## Exports

The package exports the following:

- `CharacterController` — the main controller class
- `ActionData` — class representing a single action's configuration (animation, speed, key, sound)
- `ActionMap` — class holding all action definitions with their defaults
- `Actions` — constant object with action name strings (e.g., `Actions.WALK`, `Actions.RUN`)
- `CCSettings` — serializable settings class for saving/restoring controller configuration
- `MoveToOptions` — interface for `moveTo()` optional parameters (`run`, `arrivalDistance`, `obstructionThreshold`, `onComplete`)
- `TurnToOptions` — interface for `turnTo()` optional parameters (`fast`, `angularTolerance`, `onComplete`)

## API ( version 0.4.7 )

#### To Instantiate

Multiple ways
```
// import statement if using typescript
import {CharacterController, ActionMap, ActionData, Actions} from "babylonjs-charactercontroller";

// basic - no animation information provided here. You would need to provide those seperately using other apis.
// if using animation ranges, the controller will try to auto-map actions to anims as described later down below
let cc = new CharacterController(character, camera, scene);

// with optional full animation information, namely an action map which maps action to animation-group/animation-range name,  animation rate, action speed,whetherlooping, keyboard key, sound
let cc = new CharacterController(character, camera, scene, actionMap);

// if using animation groups (.glb files use animation groups) you can provide an optional simple agMap which just maps action name to AnimationGroup object
let cc = new CharacterController(character, camera, scene, agMap);

// with an optional fourth paramater to indicate if the character face is forward facing (positive Z direction) or not
let cc = new CharacterController(character, camera, scene, actionMap, true);
```

Takes five parms

- character - the character mesh containing a skeleton with appropriate animations as listed below. The controller supports both quaternion and euler rotation on the character mesh. You do NOT need to convert quaternion to euler as required previosuly.
- camera - arc rotate camera. If camera is set to null then the camera will not follow the character and keyboard will not control the character. You can use this for an NPC which you can move around programmatically. See the section on "Controlling Character programmatically".
- scene - scene
- agMap or actionMap - This is optional. It can be:
  - An animation group map (for backward compatibility): maps animation names to AnimationGroup objects
  - A full action map: maps animation names to objects with `ag`, `name`, `rate`, `loop`, `speed`, `sound` properties

  Example - animation group map

  ```
  let myWalkAnimationGroup:AnimationGroup = scene.getAnimationGroupByName("the_walk");
  let myRunAnimationGroup:AnimationGroup = scene.getAnimationGroupByName("the_run");
  let agMap:{} = {
        "walk": myWalkAnimationGroup,
        "run": myRunAnimationGroup,
  }
  ```

  Example - full action map with additional data

  ```
  let actionMap = {
      "walk": {"ag": scene.getAnimationGroupByName("the_walk"), "rate": 1, "loop": true, "speed": 3},
      "run": {"ag": scene.getAnimationGroupByName("the_run"), "rate": 1, "loop": true, "speed": 6},
  }

  // if using animation ranges
  let actionMap = {
      "walk": {"name": "myWalk", "rate": 1, "loop": true, "speed": 3},
      "run": {"name": "myRun", "rate": 1, "loop": true, "speed": 6},
  }
  ```

- forwardFacing - Optional. If the character's face is forward facing (positive Z direction) set this to true. By default it is false.


The controller supports the following actions.

- idle
- idleJump
- walk
- walkBack
- walkBackFast
- run
- runJump
- fall
- turnRight
- turnRightFast
- turnLeft
- turnLeftFast
- strafeLeft
- strafeLeftFast
- strafeRight
- strafeRightFast
- slideBack

If the character uses animation ranges and the animation ranges have names, same as the above actions then the controller will map those anims to the corresponding actions.
Now if your animation range is named differently from those mentioned above then use the setWalkAnim(..), setWalkBackAnim(..) etc API to map your animation range to those actions.

If instead of animation ranges you have animation groups then you will have to provide a map of action name to animation group object as explained above or use setWalkAnim(..), setWalkBackAnim(..) etc API.
Unlike aniamtion ranges , currently the controller doesn't try to auto map actions to animation groups.

Now if a action is not mapped to an animation then for that action, the controller will play the animation it was playing just before for the previous action.  

Note that if no animations are provided then no animations will be played. This, thus, can be used to move a non skeleton based mesh around.  

Note that there are some actions with name ending with string "Fast".
If no animations are mapped to these then the controller will play the non-fast version but at twice the rate.  
So for example lets say you provided animation for "strafeLeft" but not "strafeLeftFast" then the controller will play the "strafeLeft" animation whenever it has to play the "strafeLeftFast" but at twice the speed of "strafeLeft".

The "Fast" animations are played when the user presses the "mod" key (usually "shift key) along with the normal key.
Example: to play "strafeLeft" if the key is set to "q" then to play "strafeLeftFast" the key would be "q" and "shift".


#### To start/stop controller

```
cc.start();
cc.stop();
```

#### To pause playing any animations

Sometimes you might want to stop the character controller from playing
any animation on the character and instead play your animation instead.
Example: instead of idle animation you might want to play a shoot animation.
Use the following to pause or resume

```
cc.pauseAnim();
cc.resumeAnim();
```

#### To Change Mode

The CharacterController can run in one of two modes - 0 or 1.

- Mode 0 is the default mode.  
  This is suitable for First Person and Third Person kind of games.  
  Here the camera follows the movement and rotation of the Character.  
  Rotating the camera around the Character also rotates the Character.
- Mode 1 is suitable for top down, isometric type of games.  
  Here the camera just follows the movement of the Character.  
  It is not effected by or effects the rotation of the Character

```
cc.setMode(n: number); // 0 or 1
cc.getMode(): number;  // returns current mode
```

##### Turning on/off

Use this to set turning on/off.  
When turning is off  
a) turn left or turn right keys result in character facing and moving left or right with respect to camera rather than just turning left or right  
b) walkback/runback key results in character facing back, towards the camera and walking/running towards camera rather than walking backwards with back to the camera

This setting has no effect when mode is 1.

```
cc.setTurningOff(true/false);  //default: false
cc.isTurningOff(): boolean;
```

default is false

#### To set/change animation groups or ranges after construction

You can provide or replace animations after the controller has been constructed:

```
// Set animation groups
cc.setAnimationGroups(agMap);

// Set animation ranges
cc.setAnimationRanges(arMap);

// Set a full action map (supports both ag and ar, plus speed/key/sound data)
cc.setActionMap(actionMap): string;  // returns "ag" or "ar"

// Get the current action map
cc.getActionMap(): ActionMap;
```

#### To change animation range name / animation group and their parameters

Takes three parms

- aniamtion range name or animation group Object
- rate - rate of speed at which to play the animation
- loop - whether the animation should be looped or stop at end.

To leave any parameter unchanged set its value to null.

```
cc.setIdleAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setIdleJumpAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setWalkAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setWalkBackAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setWalkBackFastAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setRunAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setRunJumpAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setFallAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setTurnRightAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setTurnLeftAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setTurnRightFastAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setTurnLeftFastAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setStrafeRightAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setStrafeLeftAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setStrafeRightFastAnim(name: string|AnimationGroup, rate: number, loop: boolean);
cc.setStrafeLeftFastAnim(name: string|AnimationGroup, rate: number, loop: boolean);

cc.setSlideBackAnim(name: string|AnimationGroup, rate: number, loop: boolean);
```

So lets say your walk animation range is called "myWalk" and you want to play it at half speed and loop it continuously then

```
cc.setWalkAnim("myWalk", 0.5, true);

```

if animation Group

```
cc.setWalkAnim(scene.getAnimationGroupByName("the_walk"), 0.5, true);
```

if do not want to change any of the parameter then set them to null.    
so below  name or the rate will not change just the looping.  

```
cc.setWalkAnim(null, null, true);
```

#### Animation blending

```
cc.enableBlending(n: number);  // enable blending with speed n
cc.disableBlending();           // disable blending
```

#### To change key binding

By default the controller uses WASDQE, space, Capslock and arrow keys to control your Character.

| KEY/KEYS          | ACTION                                                   |
| ----------------- | -------------------------------------------------------- |
| w and up arrow    | walk forward                                             |
| Shift + w         | run                                                      |
| CapsLock          | locks the Shift key and thus pressing "w" results in run |
| s and down Arrow  | walk backward                                            |
| a and left Arrow  | turn left                                                |
| d and right Arrow | turn right                                               |
| q                 | strafe left                                              |
| e                 | strafe right                                             |
| " "               | jump                                                     |

To change these use

```
cc.setWalkKey(key: string);
cc.setWalkBackKey(key: string);
cc.setTurnLeftKey(key: string);
cc.setTurnRightKey(key: string);
cc.setStrafeLeftKey(key: string);
cc.setStrafeRightKey(key: string);
cc.setJumpKey(key: string);
```

Example: To use "x" key to walkback do

```
cc.setWalkBackKey("x");
```

To specify spacebar key use " ". Example cc.setJumpKey(" ")

Note: Currently you cannot reassign Shift, Capslock or Arrow Keys to other actions. This is on TODO list

#### Controlling Character programmatically

In addition to keyboard, as shown above, the Character's movement can also be controlled from script using the following methods.  
You might use these to control movement using say UI, Mouse Clicks, Touch Controllers etc.

```
cc.walk(b: boolean);
cc.walkBack(b: boolean);
cc.walkBackFast(b: boolean);
cc.run(b: boolean);
cc.turnLeft(b: boolean);
cc.turnLeftFast(b: boolean);
cc.turnRight(b: boolean);
cc.turnRightFast(b: boolean);
cc.strafeLeft(b: boolean);
cc.strafeLeftFast(b: boolean);
cc.strafeRight(b: boolean);
cc.strafeRightFast(b: boolean);
cc.jump();
cc.fall();
cc.idle();
```

Example:

```
cc.walk(true);  // will start walking the Character.
cc.walk(false); // will stop walking the Character.
```

A word about cc.fall(). The CharacterController doesn't constantly check if the user is "grounded". This is to prevent needless computation. Once the Character is on a ground/floor it assumes the Character will continue to stand on that ground/floor until the user uses keys to move the Character.
In some use cases the ground/floor might move away and thus leave the Character hanging in mid air. In such cases use cc.fall() to force the Character to fall to the next ground/floor below.

#### Checking movement state

```
cc.anyMovement(): boolean;  // returns true if any movement key/command is active
```

#### Enabling/Disabling the Keyboard control

Sometimes, when you are controlling the movement of the Character programmatically as shown above, you might want to disable the keyboard.  
Use the following method to enable/disable the keyboard.

```
cc.enableKeyBoard(b: boolean);
cc.isKeyBoardEnabled(): boolean;
```

cc.enableKeyBoard(true) enables the keyboard  
cc.enableKeyBoard(false) disables the keyboard

#### To change gravity or speed at which character/character is moved

Speed is specified in meters/second

```
cc.setGravity(n: number);        //default 9.8 m/s^2
cc.setWalkSpeed(n: number);      //default 3 m/s
cc.setRunSpeed(n: number);       //default 6 m/s
cc.setBackSpeed(n: number);      //default 1.5 m/s
cc.setBackFastSpeed(n: number);  //default 3 m/s
cc.setJumpSpeed(n: number);      //default 6 m/s
cc.setLeftSpeed(n: number);      //default 1.5 m/s
cc.setLeftFastSpeed(n: number);  //default 3 m/s
cc.setRightSpeed(n: number);     //default 1.5 m/s
cc.setRightFastSpeed(n: number); //default 3 m/s
cc.setTurnSpeed(n: number);      //default 22.5 degrees/s (PI/8 rad/s)
cc.setTurnFastSpeed(n: number);  //default 45 degrees/s (PI/4 rad/s)
```

#### To change the slope the character can traverse

```
cc.setSlopeLimit(minSlopeLimit: number, maxSlopeLimit: number); //the slope is specified in degrees
```

Example

```
cc.setSlopeLimit(45, 55);
```

Here if the character is on a slope with angle between 45 and 55 degrees then it will start sliding back when it stops moving.  
If the slope is 55 or more then character will not be able to move up on it.

Default: minSlopeLimit = 30, maxSlopeLimit = 45

#### To change the height of steps the character can climb

```
cc.setStepOffset(stepOffset: number);  //default: 0.25
```

Example

```
cc.setStepOffset(0.5);
```

The character can only move up a step if the height of the step is less than or equal to the "stepOffset".  
By default the value is 0.25.

#### To set/change the footstep sound

```
cc.setSound(sound: Sound);
```

Example

```
 let sound = new BABYLON.Sound(
      "footstep",
      "./sounds/footstep_carpet_000.ogg",
      scene,
      () => {
        cc.setSound(sound);
      },
      { loop: false }
    );
```

The above will load sound from file "footstep_carpet_000.ogg" and when loaded will set the Character step sound to that.   
This sound will be played for all actions except idle, fall, and slideBack.  
The sound will be played twice per cycle of the animation.  
The rate will be set automatically based on frames and fps of animation.

#### To change character or skeleton

```
cc.setCharacter(character: Mesh, faceForward?: boolean): boolean;
cc.getCharacter(): Mesh;
cc.setCharacterSkeleton(skeleton: Skeleton);
cc.getSkeleton(): Skeleton;
```

#### Face forward

Use setFaceForward(true|false) to indicate that the character's face points forward (positive local Z axis direction) or backward.

```
cc.setFaceForward(b: boolean);
cc.isFaceForward(): boolean;
```

#### To change camera behavior

1. By default the camera focuses on the character/character origin. To focus on a different position on the character/character use

    ```
    cc.setCameraTarget(v: Vector3);
    ```

    Lets say your character origin is at its feet but instead of focusing on its feet you would like camera to focus on its head then, assuming the head is 1.8m above ground, you would do

    ```
    cc.setCameraTarget(new BABYLON.Vector3(0, 1.8, 0));
    ```

2. By default the camera behaves "elastically". In other words if something comes between the camera and character the camera snaps to
a position in front of that something. This way the character/character is always in view.
    To turn this off use

    ```
    cc.setCameraElasticity(false);  //default: true
    ```

    You can control the number of steps used for elastic camera movement:

    ```
    cc.setElasticSteps(n: number);  //default: 10
    ```

    Camera Springback  
    When the camera is pushed closer to the character by an obstruction, it can automatically recover to its original distance once the obstruction clears. The camera holds its world position while the character moves away, naturally restoring the distance.

    ```
    cc.setCameraElasticSpringback(b: boolean);   // enable/disable springback (default: true)
    cc.isCameraElasticSpringback(): boolean;     // check if springback is enabled
    cc.setSpringbackSteps(n: number);            // deceleration steps (default: 50, range: 1–1000)
    ```

    Behavior:
    - When an obstruction pushes the camera closer, the original radius is remembered
    - Once the obstruction clears, the camera holds its position while the character moves away
    - The distance naturally restores as the character walks forward
    - If the user scrolls or rotates the camera, springback is cancelled — user always has priority
    - Works through first-person mode transitions

    Example:

    ```
    cc.setCameraElasticSpringback(true);  // enable (default)
    cc.setSpringbackSteps(30);            // faster recovery
    cc.setSpringbackSteps(100);           // slower, smoother recovery
    ```

3. You can make obstructing meshes invisible instead of moving the camera:

    ```
    cc.makeObstructionInvisible(b: boolean);  //default: false
    ```

4. You can use the arc rotate camera's "lowerRadiusLimit" and "upperRadiusLimit" property to control how close or how far away from the character the camera can get.  
    Example setting

    ```
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 20;
    ```

    will restrict the camera between 2 and 20m from the character/character.  

5. When the camera comes to the "lowerRadiusLimit" the controller switches to first person view. In other words it makes the character/character invisible and the camera collision is disabled. Pulling camera back restores the third person view.
    To prevent this use

    ```
    cc.setNoFirstPerson(true);  //default: false
    ```
6. If you change the camera's checkCollisions property directly, notify the controller:

    ```
    cc.cameraCollisionChanged();
    ```

#### Smooth Turning

When turning is off (see `setTurningOff`), the character can rotate gradually toward the target direction instead of snapping instantly. This uses shortest-arc interpolation with frame-rate-independent stepping.

```
cc.setSmoothTurnSpeed(degreesPerSecond: number);  // default 360
cc.getSmoothTurnSpeed(): number;
```

Example:

```
cc.setSmoothTurnSpeed(90);  // slower, more cinematic rotation
cc.setSmoothTurnSpeed(240); // faster, snappier rotation
```

Set to 0 to disable smooth turning and do instant rotation instead.

When the angular difference is exactly 180° (e.g., pressing back while facing forward), the rotation always goes clockwise (viewed from above) regardless of avatar facing or coordinate system handedness.

In first-person mode, smooth turn speed is automatically set to 0 (instant rotation). When the camera pulls back to third-person, the previous smooth turn speed is restored.

##### Turn in Place

By default, the character does not move forward/backward while smooth turning is in progress — it rotates on the spot until facing the target direction. This prevents the character from arcing away from its starting position during turns.

```
cc.setTurnInPlace(b: boolean);  // default: true
cc.isTurnInPlace(): boolean;
```

Set to `false` to allow the character to move forward along its current facing while rotating (arc movement).

#### Navigation: moveTo / turnTo

High-level navigation APIs for goal-oriented movement and rotation. These call the existing public command methods (`walk`, `run`, `turnLeft`, `turnRight`, `idle`) each frame via a separate render observer — they work exactly as if controlled by external code.

`moveTo` and `turnTo` are **mutually exclusive** — calling one cancels the other. During navigation, the CC mode is temporarily switched to mode 1 (top-down) to prevent camera rotation interference. The original mode is restored when navigation stops.

For characters with keyboard input enabled, any keyboard press immediately cancels the active navigation and yields control back to the character.

```
cc.moveTo(target: Vector3 | TransformNode, options?: MoveToOptions);
cc.moveToStop();
cc.turnTo(target: Vector3 | TransformNode | number, options?: TurnToOptions);
cc.turnToStop();
```

##### moveTo

Moves the character toward a target position or follows a TransformNode.

```
cc.moveTo(target);
cc.moveTo(target, { run: true });
cc.moveTo(target, { arrivalDistance: 1.0, obstructionThreshold: 0.01 });
cc.moveTo(target, { onComplete: () => console.log("Arrived!") });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `Vector3 \| TransformNode` | World-space position to move toward, or a TransformNode to follow continuously |
| `options.run` | `boolean` | Use run speed instead of walk. **Default: `false`** |
| `options.arrivalDistance` | `number` | Distance from target at which the character stops (world units). **Default: `0.5`** |
| `options.obstructionThreshold` | `number` | Minimum distance the character must move per frame to be considered making progress. If movement is below this for 3 consecutive frames, navigation stops. **Default: `0.001`** |
| `options.onComplete` | `() => void` | Callback invoked when the character arrives at the target. For node-follow mode, fires each time the character reaches the node. Not called on cancellation (keyboard, manual command, or explicit stop). **Default: `undefined`** |

**Behavior:**
- If target is a `Vector3`: character moves to that position and stops
- If target is a `TransformNode`: character follows the node continuously — idles when within arrival distance, resumes when node moves away
- If the TransformNode is disposed during follow, navigation stops automatically
- If already within arrival distance when called, `idle()` is called immediately
- Invalid parameter values (≤ 0) are silently replaced with defaults

##### moveToStop

Cancels the active moveTo operation. Calls `idle()` and restores the original CC mode.

```
cc.moveToStop();  // no-op if no moveTo is active
```

##### turnTo

Rotates the character toward a target direction.

```
cc.turnTo(targetPosition);                    // face a world position
cc.turnTo(targetNode);                        // track a TransformNode
cc.turnTo(Math.PI / 2);                       // rotate 90° to the right (positive = right)
cc.turnTo(-Math.PI / 4);                      // rotate 45° to the left (negative = left)
cc.turnTo(targetPosition, { fast: true });    // use fast turn speed
cc.turnTo(targetNode, { angularTolerance: 0.1 });
cc.turnTo(Math.PI, { onComplete: () => console.log("Turn complete") });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `Vector3 \| TransformNode \| number` | A world position to face, a TransformNode to track, or an angle in radians to rotate by (positive = right, negative = left) |
| `options.fast` | `boolean` | Use fast turn speed instead of normal. **Default: `false`** |
| `options.angularTolerance` | `number` | Angular threshold (radians) at which rotation is considered complete. **Default: `0.035` (~2°)** |
| `options.onComplete` | `() => void` | Callback invoked when the character finishes rotating to the target. For node-tracking mode, fires each time the character faces the node. Not called on cancellation (keyboard, manual command, or explicit stop). **Default: `undefined`** |

**Behavior:**
- If target is a `Vector3`: character rotates to face that position, then stops
- If target is a `TransformNode`: character continuously tracks the node — holds when facing it, resumes when node moves
- If target is a `number`: character rotates by that angle relative to current facing (positive = right, negative = left), then stops
- If target is `null` or `undefined`: the call is ignored
- If target is `0`: `idle()` is called immediately without rotation
- If the TransformNode is disposed during tracking, navigation stops automatically
- If already facing the target within angular tolerance, no rotation is initiated
- Invalid angular tolerance values (≤ 0) are silently replaced with the default

##### turnToStop

Cancels the active turnTo operation. Calls `idle()` and restores the original CC mode.

```
cc.turnToStop();  // no-op if no turnTo is active
```

#### Settings serialization

You can save and restore all controller settings:

```
let settings: CCSettings = cc.getSettings();
// ... later ...
cc.setSettings(settings);
```

The CCSettings object includes all configurable properties including `smoothTurnSpeed`, `springback`, and `springbackSteps`. Properties not present in a restored settings object are left unchanged (backward compatible).

#### Debug visualization

Show/hide the collision ellipsoid for debugging:

```
cc.showEllipsoid(show: boolean);
```

#### Utility methods

```
cc.getScene(): Scene;
cc.isAg(): boolean;  // true if using animation groups, false if using animation ranges
```

## Build

If not already installed, install node js.  
Switch to the project folder.  
Run "npm install", once, to install all the dependencies.

### To build

1. Run "npm run build"  
   Production build. Produces **both** UMD and ES module outputs:
   - `dist/CharacterController.js` — UMD bundle (minified, private `_` properties mangled)
   - `dist/CharacterController.es.js` — ES module bundle (unminified, tree-shakeable)
   - `dist/CharacterController.d.ts` — TypeScript declarations (shared by both formats)

2. Run "npm run build-dev"  
   Development build. Produces only the UMD output:
   - `dist/CharacterController.max.js` — UMD bundle (unminified, for debugging)

### How the dual build works

The webpack config (`webpack.config.js`) exports an array of two configurations from the same entry point (`src/CharacterController.ts`):

- **UMD config** — externalizes `babylonjs` as a CommonJS/AMD/global (`BABYLON`) dependency. Uses TerserPlugin to minify and mangle `_`-prefixed properties.
- **ESM config** — uses a bridge module (`src/_babylonjs-esm-bridge.js`) that re-exports each BabylonJS type from its individual `@babylonjs/core` sub-path. Webpack treats each sub-path as an external module, producing individual `import` statements in the output. Not minified (consumer bundlers handle that).

The mapping from BabylonJS type names to `@babylonjs/core` sub-paths is defined in `webpack.es-externals.js`.

### Keeping the import map up to date

If you add a new BabylonJS import to `src/CharacterController.ts`, you must update two files:

1. **`webpack.es-externals.js`** — add the type name and its `@babylonjs/core` sub-path to the `BABYLONJS_ES6_MAP` object
2. **`src/_babylonjs-esm-bridge.js`** — add a re-export line for the new type from its sub-path

If the import map is out of date, the production build will fail with an error like:

```
Module not found: Error: Can't resolve '@babylonjs/core/...' in '...'
```

or the ESM output will bundle the BabylonJS code inline instead of externalizing it, resulting in a much larger file size.

Run `npm test` to catch this — the `esm-import-map-completeness` test parses the source file and verifies every `babylonjs` import has a corresponding entry in the map.

### To test

Run `npm test` to execute all automated tests (vitest).

Two ways to test manually:

1. using the webpack-dev-server.  
   Start the development server  
   "npm run dev"  
   This will start the live dev server on port 8080 (could be different if this port is already in use) and open the browser pointing at http://localhost:8080/tst/test.html.  
   The dev server will live recompile your code any time you make changes.  
   Note: The dev server does not write the build to disk, instead it just builds and serves from memory. In our case it builds "CharacterController.max.js" in memory and serves it from url http://localhost:8080/dist. (see "devserver.devMiddleware.publicPath" in webpack.config.js file).

2. using any other http server.  
   Start the server, say http-server, from the project root folder (not from within "/tst" folder).  
   Goto http://localhost:8080/tst/test.html (assuming the server was started on port 8080).  
   Every time you make changes you will have to build using "npm run build-dev".
