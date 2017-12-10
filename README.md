# BabylonJS-CharacterController
A 3rd person CharacterController for use in [BabylonJS](http://www.babylonjs.com/) (a 3D HTML Webgl framework)  applications.  
For demo - <a href="https://ssatguru.github.io/BabylonJS-CharacterController/demo/" target="_blank">https://ssatguru.github.io/BabylonJS-CharacterController/demo/</a>

## About
It currently supports  
* walk 
* walkback
* run 
* jump
* fall
* turn right 
* turn left
* strafe left
* strafe right
* slide down 

It also supports camera "elasticity". In other words if a mesh comes between the camera and avatar/player the camera snaps to
a position in front of the mesh. This way the avatar/player os always in view.  
It can also enter first person view if the camera comes close to the avatar/player

## Quick start

1) add the following dependencies 
 ```
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="CharacterController.min.js"></script>
```
See INSTALL below to find where you can get "CharacterController.min.js".  

2) a small javascript code snippet to get you up and running
```
  //------------------Character Controller -------------------------------------------------
  var CharacterController = org.ssatguru.babylonjs.component.CharacterController;
  var cc = new CharacterControl(player,camera,scene);
  cc.start();
```

see index.html in "demo" folder for a working example  
[https://github.com/ssatguru/BabylonJS-CharacterController/blob/master/demo/index.html](https://github.com/ssatguru/BabylonJS-CharacterController/blob/master/demo/index.html)

## INSTALL

You can find the "CharacterController.min.js" from its git repository "dist" folder or "releases" section  
[https://github.com/ssatguru/BabylonJS-CharacterController/tree/master/dist](https://github.com/ssatguru/BabylonJS-CharacterController/tree/master/dist)  
[https://github.com/ssatguru/BabylonJS-CharacterController/releases](https://github.com/ssatguru/BabylonJS-CharacterController/releases)  

You can also install it from npm  
```
npm install babylonjs-charactercontroller (TODO)
```

## API
#### To Instantiate
```
// JavaScript
var CharacterController = org.ssatguru.babylonjs.component.CharacterController;
var cc = new CharacterController(player,camera,scene);
```
```
// TypeScript
import CharacterController = org.ssatguru.babylonjs.component.CharacterController;
let cc = new CharacterControl(player,camera,scene);
```
Takes three parms
* player - the player mesh containing a skeleton with appropriate animations listed below
* camera - arc rotate camera
* scene - scene

The player skeleton should have the following animation ranges
* walk 
* walkBack
* run 
* jump
* fall
* turnRight 
* turnLeft
* strafeLeft
* strafeRight
* slideDown

If your animation range is named differently from those mentioned above then use the setWalkAnim(..),setWalkBackAnim(..) etc API to specify your animation range name.

#### To start/stop controller
```
cc.start();
cc.stop();
```
#### To change animation range name or other parameters
```
cc.setWalkAnim(name :string, playback rate:number,loop:boolean);
cc.setWalkBackAnim(name :string, playback rate:number,loop:boolean);
cc.setRunAnim(name :string, playback rate:number,loop:boolean);
cc.setJumpAnim(name :string, playback rate:number,loop:boolean);
cc.setFallAnim(name :string, playback rate:number,loop:boolean);
cc.setTurnRightAnim(name :string, playback rate:number,loop:boolean);
cc.setTurnLeftAnim(name :string, playback rate:number,loop:boolean);
cc.setStrafeRightAnim(name :string, playback rate:number,loop:boolean);
cc.setStrafeLeftAnim(name :string, playback rate:number,loop:boolean);
cc.setSlideBackAnim(name :string, playback rate:number,loop:boolean);
```
So lets say your walk animation is called "myWalk" and you want to play it at half speed and loop it continuoulsy then
```
cc.setWalkAnim("myWalk",0.5,true);
```
#### To change key binding
By default the controller uses WASDQE, space and arrow keys to controll your player/avatar.
W-walk forward
shit+W-run
S-walk backward
A-turn left
D-turn right
Q-strafe left
E-strafe right.
space - jump
To change these use
```
cc.setWalkKey(string:key); or cc.setWalkCode(number:keyCode);
cc.setWalkBackKey(string:key); or cc.setWalkBackCode(number:keyCode);
cc.setTurnLeftKey(string:key); or cc.setTurnLefttCode(number:keyCode);
cc.setTurnRightKey(string:key); or cc.setTurnRightCode(number:keyCode);
cc.setStrafeLeftKey(string:key); or cc.setStrafeLefttCode(number:keyCode);
cc.setStrafeRightKey(string:key); or cc.setStrafeRightCode(number:keyCode);
```
#### To change speed at which avatar/player is moved or gravity

Speed is specified in meters/second
```
setWalkSpeed(n: number);  //default 3 m/s
setRunSpeed(n: number);   //default 6 m/s
setBackSpeed(n: number);  //default 3 m/s
setJumpSpeed(n: number);  //default 6 m/s
setLeftSpeed(n: number);  //default 3 m/s
setRightSpeed(n: number); //default 3 m/s
setGravity(n: number);    //default 9.8 m/s^2  
```
#### To change avatar  or skeleton at 
```
setAvatar(avatar: Mesh);
setAvatarSkeleton(skeleton: Skeleton);
```
#### To change camera behavior
By default the camera focuses on the avatar/player origin. To change toa differen position on the avatar/player use
```
setCameraTarget(v: Vector3);
```
Lets say your avatar origin is at the feet. Instead of focusing on the feet you want  the camera to focus on the head which is say
1.5m above ground then do
```
cc.setCameraTarget(new BABAYLON.Vector3(0,1.5,0);
```
By default the camera behaves "elastically". In other words if something comes between the camera and avatar the camera snaps to
a position in front of that something. This way the avatar/player os always in view.
To turn this off use
```
setCameraElastic(false);
```
You can use the arc rotate camera lowerRadiusLimit and upperRadiusLimit property to controll how close or how far from the avatar can the camera get.  
Example setting
```
camera.lowerRadiusLimit=2;
camera.upperRadiusLimit=20;
``
will restrict the camera between 2 and 20m from the avatar/player.  
When the camera comes to the "lowerRadiusLimit" the controller switches to first person view.In other words the avatar/player becomes invisible and the camera collision is disabled. Pulling camera back restores the third person view.
To prevent this use
```
setNoFirstPerson(true);
```

## Build
If not already installed, install node js and typescript.  
Switch to the project folder.  
Run "npm install", once, to install all the dependencies (these, for now, are babylonjs and uglify).  
To build anytime  
Run "npm run compile" - this will compile the typescript file and store the javascript file in the "dist" folder.  
Run "npm run min" - this will minify the javascript file and store the minified version in the "dist" folder.  
Run "npm run build" - this will both compile and minify. 
Use the "test.html" in demo folder to test your changes.  


