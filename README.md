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
- idleJump
- walk
- walkBack
- run
- runJump
- fall
- turnRight
- turnLeft
- strafeLeft
- strafeRight
- slideDown

It supports constraining avatar from traversing slopes inclined at certain angles.

It also supports camera "elasticity". In other words if a mesh comes between the camera and avatar/player, the camera snaps to
a position in front of the mesh. This way the avatar/player is always in view.

It can also enter first person view if the camera comes very close to the avatar/player

### Breaking change with 0.2.0

Instead of "jump" animation it expects "idleJump" and "runJump" animations.

Version 0.2.0 converts the project from a plain vanilla JavaScript project to a module based JavaScript project.  
With this change, the way to load the application has changed.  
In JavaScript, instead of

```
var CharacterControl = org.ssatguru.babylonjs.component.CharacterController;
var characterControl = new CharacterControl(player,camera,scene);
```

now do

```
var characterControl = new CharacterController(player,camera,scene);
```

In TypeScript, instead of

```
import CharacterController = org.ssatguru.babylonjs.component.CharacterController;
```

now do

```
import {CharacterController} from "babaylonjs-charactercontroller";
```

See below for more details.

## Quick start

1. add the following dependencies

```
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="CharacterController.js"></script>
```

See INSTALL below to find where you can get "CharacterController.js".

2. if your mesh rotation is in quaternion then switch to euler.  
   NOTE: The GLTF/GLB files have rotation in quaternion

```
// character controller  needs rotation in euler.
// if your mesh has rotation in quaternion then convert that to euler.
player.rotation = player.rotationQuaternion.toEulerAngles();
player.rotationQuaternion = null;

```

3. instantiate charcater controller and start it.

```
  //------------------Character Controller -------------------------------------------------
  //fourth parm agMap is optional and is used when animation groups rather than animation ranges
  //are used.
  var cc = new CharacterController(player,camera,scene,agMap);
  cc.start();
```

see "BabylonJS-CharacterController-Samples" [https://github.com/ssatguru/BabylonJS-CharacterController-Samples](https://github.com/ssatguru/BabylonJS-CharacterController-Samples) for a few simple samples to help you get going

## INSTALL

You can get the "CharacterController.min.js" from its git repository "dist" folder or "releases" section  
[https://github.com/ssatguru/BabylonJS-CharacterController/tree/master/dist](https://github.com/ssatguru/BabylonJS-CharacterController/tree/master/dist)  
[https://github.com/ssatguru/BabylonJS-CharacterController/releases](https://github.com/ssatguru/BabylonJS-CharacterController/releases)

You can also install it from npm

```
npm install babylonjs-charactercontroller
```

## Usage

This has been built as an UMD module which means you can use it as a CommonJS/NodeJS module, AMD module or as a global object
loaded using the script tag.

Project "BabylonJS-CharacterController-Samples" [https://github.com/ssatguru/BabylonJS-CharacterController-Samples](https://github.com/ssatguru/BabylonJS-CharacterController-Samples) has a
collection of sample projects to show how to use this from TypeScript, NodeJs, AMD or plain vanilla JavaScript applications.

Below is a quick summary of how you can use this as different module types.

TypeScript

```
// TypeScript
import * as BABYLON from "babylonjs";
import {CharacterController} from "babylonjs-charactercontroller";
...
let engine = new BABYLON.Engine(canvas, true);
...
let cc = new CharacterController(player,camera,scene);
```

CommonJS/NodeJS Module

```
let BABYLON = require("babylonjs");
let CharacterController = require("babylonjs-CharacterController").CharacterController;
...
let engine = new BABYLON.Engine(canvas, true);
...
let characterController = new CharacterController(player,camera,scene);
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
			"ec": "./lib/CharacterController"
		}
	});

	require(['babylonjs', 'cc'], function (BABYLON, cc) {
		let CharacterController = ec.CharacterController;
    ...
		let engine = new BABYLON.Engine(canvas, true);
		...
		let characterController = new CharacterController(player,camera,scene);
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
	let characterController = new CharacterController(player,camera,scene);
	...
</script>
```

## API ( version 0.4.0 )

#### To Instantiate

```
// JavaScript

// if using animation ranges
var cc = new CharacterController(player,camera,scene);

// if using animation groups
var cc = new CharacterController(player,camera,scene,agMap);
//agMap is a Map of animation name to animationGroup
```

```
// TypeScript

import {CharacterController} from "babylonjs-charactercontroller";

// if using animation ranges
let cc = new CharacterController(player,camera,scene);

// if using animation groups (.glb files use animation groups)
var cc = new CharacterController(player,camera,scene,agMap);

// if the avatar face is forward facing (positive Z direction)
var cc = new CharacterController(player,camera,scene,agMap,true);
```

Takes five parms

- player - the player mesh containing a skeleton with appropriate animations as listed below
- camera - arc rotate camera
- scene - scene
- agMap - This is optional and is only needed if using animation groups instead of animation ranges. ".glb" files have animation groups.  
  It is a Map of animation name to animationGroup object.  
  In this Map the key would be the character controller animation name and
  the key value would be the animationGroup.  
   example:

```
   	let myWalkAnimationGroup:AnimationGroup = ...;

    let agMap:{} = {
    	"walk":myWalkAnimationGroup,
     	"run": ...,
    }
```

- forwardFacing - Optional. If the avatar's face is forward facing (positive Z direction) set this to true. By default it is false.

If using animation ranges the player skeleton is expected to have the following animation ranges named as follows

- idle
- idleJump
- walk
- walkBack
- run
- runJump
- fall
- turnRight
- turnLeft
- strafeLeft
- strafeRight
- slideDown

If an animation is not resent the controller will not play that animation and will continue playing the animation it was playing just before.

If your animation range is named differently from those mentioned above then use the setWalkAnim(..),setWalkBackAnim(..) etc API to specify your animation range name.

If instead of animation ranges you have animation groups then you will have to provide a map of animation name to animation group. This is explained further down below.

NOTE :
If your mesh rotation is in quaternion then switch to euler before creating character controller.
The GLTF/GLB files have rotation in quaternion.

```
player.rotation = player.rotationQuaternion.toEulerAngles();
player.rotationQuaternion = null;
```

#### To start/stop controller

```
cc.start();
cc.stop();
```

#### To pause playing any animations

Sometimes you might want to stop the character controller from playing
any animation on the character and instead play your animation instead
Example instead of idle animation you might want to play a shoot animation.
Use the following to pause or resume

```
cc.pauseAnim();
cc.resumeAnim();
```

#### To Change Mode

The CharacterController can run in one of two modes - 0 or 1.

- Mode 0 is the default mode.  
  This is suitable for First Person and Third Person kind of games.  
  Here the camera follows the movement and rotation of the Avatar.  
  Rotating the camera around the Avatar also rotates the Avatar.
- Mode 1 is suitable for top down, isometric type of games.  
  Here the camera just follows the movement of the Avatar.  
  It is not effected by or effects the rotation of the Avatar

```
cc.setMode(n:number); // 0 or 1
```

#### To change animation range name / animation group and their parameters

Takes three parms

- rangeName or Animation group Object
- rate - rate of speed at which to play the aniamtion
- loop - whether the animation should be looped or stop at end.

To leave any parameter unchanged set its value to null.

```
cc.setIdleAnim(rangeName: string|AnimationGroup ,rate: number,loop: boolean);
cc.setIdleJumpAnim(rangeName: string,rate: number,loop: boolean);

cc.setWalkAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);
cc.setWalkBackAnim(name :string, playback rate:number,loop:boolean);

cc.setRunAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);
cc.setRunJumpAnim(rangeName: string,rate: number,loop: boolean)

cc.setFallAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);

cc.setTurnRightAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);
cc.setTurnLeftAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);

cc.setStrafeRightAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);
cc.setStrafeLeftAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);

cc.setSlideBackAnim(name :string|AnimationGroup , playback rate:number,loop:boolean);
```

So lets say your walk animation range is called "myWalk" and you want to play it at half speed and loop it continuoulsy then

```
cc.setWalkAnim("myWalk",0.5,true);
//if you donot want to change the name or the rate then use below instead
cc.setWalkAnim(null,null,true);
```

If animation Group

```
let myWalkAnimationGroup:AnimationGroup = ...;
cc.setWalkAnim(myWalkAnimationGroup,0.5,true);
```

#### To change key binding

By default the controller uses WASDQE, space, Capslock and arrow keys to controll your Avatar.

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
cc.setWalkKey(string:key);
cc.setWalkBackKey(string:key);
cc.setTurnLeftKey(string:key);
cc.setTurnRightKey(string:key);
cc.setStrafeLeftKey(string:key);
cc.setStrafeRightKey(string:key);
cc.setJumpKey(string:key);
```

Example: To use "x" key to walkback do

```
cc.setWalkBackKey("x");
```

Note: Currently you cannot reassign Shift, Capslock or Arrow Keys to other actions. This is on TODO list

#### Controlling Avatar programmatically

In addition to keyboard, as show above, the Avatar's movement can also be controlled from script using the following methods.  
You might use these to controll movement using say UI, Mouse Clicks, Touch Controllers etc.

```
cc.walk(b:boolean);
cc.walkBack(b:boolean);
cc.run(b:boolean);
cc.turnLeft(b:boolean);
cc.turnRight(b:boolean);
cc.strafeLeft(b:boolean);
cc.strafeRight(b:boolean);
cc.jump(b:boolean);
```

Example:

```
cc.walk(true);  // will start walking the Avatar.
cc.walk(false); // will stop walking the Avatar.
```

#### Enabling/Disabling the KeyBoard controll

Sometime when you are controlling the movement of the Avatar programmatically as shown above you might want to disable the keyboard.  
Use the following methods to enable disable the keyboard.

```
cc.enableKeyBoard();
cc.disableKeyBoard();
```

#### To change gravity or speed at which avatar/player is moved

Speed is specified in meters/second

```
setGravity(n: number);    //default 9.8 m/s^2
setWalkSpeed(n: number);  //default 3 m/s
setRunSpeed(n: number);   //default 6 m/s
setBackSpeed(n: number);  //default 3 m/s
setJumpSpeed(n: number);  //default 6 m/s
setLeftSpeed(n: number);  //default 3 m/s
setRightSpeed(n: number); //default 3 m/s
```

#### To change the slope the avatar can traverse

```
setSlopeLimit(minSlopeLimit: number,maxSlopeLimit: number); //the slope is specified in degrees
```

Example

```
setSlopeLimit(45,55);
```

Here if the avatar is on a slope with angle between 45 and 55 degrees then it will start sliding back when it stops moving.  
If the slope is 55 or more then avatar will not be able to move up on it.

#### To change the height of steps the avatar can climb

```
setStepOffset(stepOffset: number);
```

Example

```
setStepOffset(0.5);
```

The avatar can only move up a step if the height of the step is less than or equal to the "stepOffset".  
By default the value is 0.25.

#### To change avatar or skeleton at

```
setAvatar(avatar: Mesh);
setAvatarSkeleton(skeleton: Skeleton);
```

#### To change camera behavior

By default the camera focuses on the avatar/player origin. To focus on a different position on the avatar/player use

```
setCameraTarget(v: Vector3);
```

Lets say your avatar origin is at its feet but instead of focusing on its feet you would like camera to focus on its head then, assuming the the head is 1.5m above ground, you would do

```
cc.setCameraTarget(new BABAYLON.Vector3(0,1.5,0);
```

By default the camera behaves "elastically". In other words if something comes between the camera and avatar the camera snaps to
a position in front of that something. This way the avatar/player is always in view.
To turn this off use

```
setCameraElasticity(false);
```

You can use the arc rotate camera's "lowerRadiusLimit" and "upperRadiusLimit" property to controll how close or how far away from the avatar the camera can get.  
Example setting

```
camera.lowerRadiusLimit=2;
camera.upperRadiusLimit=20;
```

will restrict the camera between 2 and 20m from the avatar/player.  
When the camera comes to the "lowerRadiusLimit" the controller switches to first person view. In other words it makes the avatar/player invisible and the camera collision is disabled. Pulling camera back restores the third person view.
To prevent this use

```
setNoFirstPerson(true);
```

## Build

If not already installed, install node js.  
Switch to the project folder.  
Run "npm install", once, to install all the dependencies.

### To build

1. Run "npm build"  
   This will create a production build.
   This will both compile, minify and store the build called CharacterController.js in "dist" folder.
2. Run "npm run build-dev"  
   This will create a development build.
   This will compile and create a non minified build called CharacterController.max.js in "dist" folder.

### To test

Start the development server  
"npm run start"  
This will start the live dev server on port 8080 and open the browser with the file http://localhost:8080/index.html.  
This "index.html" in turn would redirect the browser to tst/test.html.  
The dev server will live compile your code any time you make changes and make "CharacterController.max.js" available at http://localhost:8080.  
All the "test\*.html" thus point to http://localhost:8080/CharacterController.max.js to pick up CharacterController
