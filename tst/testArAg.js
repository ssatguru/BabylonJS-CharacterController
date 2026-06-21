
let ar;
window.onload = function ()
{
  const queryString = this.document.location.search
  const urlParams = new URLSearchParams(queryString);
  const animType = urlParams.get("animType"); 
  if (animType == "ar") ar = true; else ar=false;
  setUI(ar);
  main(ar);

};


let animPaused = false;
let ellipsoid = true;
let cc;
let scene;

function setUI(ar)
{
  let animType = document.getElementById("animType");
  if (!ar) animType.innerHTML = "Animation Group";
  let turnToButton = document.getElementById("turnTo"); 
  let moveToButton = document.getElementById("moveTo"); 
  let pauseButton = document.getElementById("pause");
  let ellButton = document.getElementById("ell");
  let helpButton = document.getElementById("help");
  let closeButton = document.getElementById("closehelp");
  
  let el = document.getElementById("overlay");

  let canvasElement = document.getElementById("renderCanvas");

  turnToButton.onclick = () =>
  {
    cc.turnTo(box);
  }

  moveToButton.onclick = () =>
  {
    cc.moveTo(box);
  }

  helpButton.onclick = closeButton.onclick = () =>
  {
    el.style.visibility = el.style.visibility == "visible" ? "hidden" : "visible";
  };

  ellButton.onclick = () =>
  {
    ellipsoid = ! ellipsoid;
    cc.showEllipsoid(ellipsoid);
  };
  pauseButton.onclick = () =>
  {
    if (animPaused)
    {
      cc.resumeAnim();
      cc.enableKeyBoard(true);
      pauseButton.innerHTML = "Pause";
      canvasElement.focus();
    } 
    else
    {
      cc.pauseAnim();
      cc.enableKeyBoard(false);
      pauseButton.innerHTML = "Resume";
      canvasElement.focus();
    }
    animPaused = !animPaused;
  };
}

async function main(ar)
{
  var canvas = document.querySelector("#renderCanvas");
  var engine = new BABYLON.Engine(canvas, true, { audioEngine: true });
  scene = new BABYLON.Scene(engine);
  scene.debugLayer.show({ showExplorer: true, embedMode: true });
  scene.useRightHandedSystem = true;

  setScene(scene);

  window.addEventListener("resize", function ()
  {
    engine.resize();
  });

  //load and set the player
  let result;
  if (ar)
  {
    console.log("loading babylon");
    result = await BABYLON.ImportMeshAsync("player/Vincent-frontFacing.babylon", scene);
  } else
  {
    console.log("loading glb");
    result = await BABYLON.ImportMeshAsync("player/Vincent-frontFacing.glb", scene);
  }

  let player = result.meshes[0];
  setPlayer(player);

  //create and set the camera
  let arcRotateCamera = createCamera(player, scene);
  arcRotateCamera.attachControl(canvas, false);

  //create a CharacterController and set it

  if (!ar)
  {
    //stop all animations
    //also lets print to console the list of animation groups we have in this file, to help map them properly
    let allAGs = scene.animationGroups;
    for (i = 0; i < allAGs.length; i++)
    {
      allAGs[i].stop();
      console.log(i + "," + allAGs[i].name);
    }
    // below  is an alternate way one can create a CharacterController for animation groups 
    // by passing a map of action name to ag group

    // let agMap = createAGmap(allAGs,scene);
    // cc = new CharacterController(player, arcRotateCamera, scene, agMap);
  }

  cc = new CharacterController(player, arcRotateCamera, scene);
  setCharacterController(cc, scene, ar);
  cc.start();

  engine.runRenderLoop(function ()
  {
    scene.render();
  });

  canvas.focus();
}

let box;
function setScene(scene){
  scene.clearColor = new BABYLON.Color3(0.7, 0.5, 0.5);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.3;

  var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(1, -1, 1), scene);
  light2.position = new BABYLON.Vector3(0, 128, 0);
  light2.intensity = 0.7;

  let groundMaterial = createGroundMaterial(scene);
  var ground = createGround(scene, groundMaterial);

  var slope1 = BABYLON.Mesh.CreateBox("unwalkable-steep-slope", 2, scene);
  slope1.checkCollisions = true;
  slope1.position = new BABYLON.Vector3(-6, 7, 14);
  slope1.scaling = new BABYLON.Vector3(1, .1, 5);
  slope1.rotation = new BABYLON.Vector3(-65 * Math.PI / 180, 0, 0);

  slope2 = BABYLON.Mesh.CreateBox("walkable-steep-slope", 2, scene);
  slope2.checkCollisions = true;
  slope2.position = new BABYLON.Vector3(6, 7, 14);
  slope2.scaling = new BABYLON.Vector3(1, .1, 5);
  slope2.rotation = new BABYLON.Vector3(-35 * Math.PI / 180, 0, 0);

  var slope3 = BABYLON.Mesh.CreateBox("walkable-slope", 2, scene);
  slope3.checkCollisions = true;
  slope3.position = new BABYLON.Vector3(12, 7, 14);
  slope3.scaling = new BABYLON.Vector3(1, .1, 5);
  slope3.rotation = new BABYLON.Vector3(-25 * Math.PI / 180, 0, 0);

  //steps
  var step = 0.5;
  var steplength = 1;
  var xpos = -0.5;
  var ypos = 5.5;
  var stepId;
  var aStep;
  for (var stps = 0; stps < 10; stps++)
  {
    stepId = "high-step-" + stps;
    aStep = BABYLON.Mesh.CreateBox(stepId, 2, scene);
    aStep.checkCollisions = true;
    aStep.position = new BABYLON.Vector3(xpos + stps * steplength, ypos + stps * step, 4.5);
    aStep.scaling = new BABYLON.Vector3(1, 1, 2);
  }

  //red box
  box = BABYLON.Mesh.CreateBox("box", 2, scene);
  box.position = new BABYLON.Vector3(28, 10, 9);
  box.rotation.y = Math.PI/4;
  var redMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
  redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // red
  box.material = redMaterial;

}


function setPlayer(player)
{
  // player position point is the feet
  player.position = new BABYLON.Vector3(-8, 7, 9);

  if (ar) player.rotation.y = (1/2)*Math.PI;
  else player.rotationQuaternion  = BABYLON.Quaternion.FromEulerAngles(0,-(1/2)*Math.PI,0);

  player.checkCollisions = true;

  //player's ellipsoid should be the size of the player - thus around 1.75m tall
  player.ellipsoid = new BABYLON.Vector3(0.25, 0.875, 0.25);

  //the ellipsoidoffset positions the center of ellipsoid relative to the player position point
  //we want the top of ellipsoid to be at the head of the player
  //and the bottom of ellipsoid to be at the feet of the player
  player.ellipsoidOffset = new BABYLON.Vector3(0, 0.875, 0);
}

function createCamera(player, scene)
{
  //rotate the camera behind the player
  let alpha;
  if (ar) alpha = -(Math.PI / 2 + player.rotation.y);
  else alpha = -(Math.PI / 2 - player.rotationQuaternion.toEulerAngles().y);

  var beta = Math.PI / 2.5;
  var target = new BABYLON.Vector3(player.position.x, player.position.y + 1.5, player.position.z);

  var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", alpha, beta, 5, target, scene);

  //make sure the keyboard keys controlling camera are different from those controlling player
  //here we will not use any keyboard keys to control camera
  camera.keysLeft = [];
  camera.keysRight = [];
  camera.keysUp = [];
  camera.keysDown = [];

  // below are all standard camera settings.
  // nothing specific to character controller
  camera.wheelPrecision = 15;
  camera.checkCollisions = false;
  //how close can the camera come to player
  camera.lowerRadiusLimit = 2;
  //how far can the camera go from the player
  camera.upperRadiusLimit = 20;

  return camera;
}


function setCharacterController(cc, scene, ar)
{
  cc.setFaceForward(true);
  cc.setMode(0);

  //below makes the controller point the camera at the player head which is approx
  //1.5m above the player origin
  cc.setCameraTarget(new BABYLON.Vector3(0, 1.5, 0));

  //if the camera comes close to the player we want to enter first person mode.
  cc.setNoFirstPerson(false);

  //the height of steps which the player can climb
  cc.setStepOffset(0.5);

  //the minimum and maximum slope the player can go up
  //between the two the player will start sliding down if it stops
  cc.setSlopeLimit(30, 60);

  //tell controller
  // - which "animation range name" or "animation group object" should be used for which player action
  // - rate at which to play that animation
  // - wether the animation should be looped
  //
  //set a parameter to null if you want to use the default value for that
  if (ar)
  {
    cc.setIdleAnim("idle", 1, true);
    cc.setTurnLeftAnim("turnLeft", 0.5, true);
    cc.setTurnRightAnim("turnRight", 0.5, true);
    cc.setStrafeLeftAnim("strafeLeft", 1, true);
    cc.setStrafeRightAnim("strafeRight", 1, true);
    cc.setWalkAnim("walk", 1, true);
    cc.setWalkBackAnim("walkBack", 0.5, true);
    cc.setIdleJumpAnim("idleJump", 0.25, false);
    cc.setRunAnim("run", 1, true);
    cc.setRunJumpAnim("runJump", 0.6, false);
    cc.setFallAnim("fall", 2, false);
    cc.setSlideBackAnim("slideBack", 1, false);
  } else
  {
    cc.setIdleAnim(scene.getAnimationGroupByName("idle"), 1, true);
    cc.setTurnLeftAnim(scene.getAnimationGroupByName("turnLeft"), 0.5, true);
    cc.setTurnRightAnim(scene.getAnimationGroupByName("turnRight"), 0.5, true);
    cc.setStrafeLeftAnim(scene.getAnimationGroupByName("strafeLeft"), 1, true);
    cc.setStrafeRightAnim(scene.getAnimationGroupByName("strafeRight"), 1, true);
    cc.setWalkAnim(scene.getAnimationGroupByName("walk"), 1, true);
    cc.setWalkBackAnim(scene.getAnimationGroupByName("walkBack"), 0.5, true);
    cc.setIdleJumpAnim(scene.getAnimationGroupByName("idleJump"), 0.25, false);
    cc.setRunAnim(scene.getAnimationGroupByName("run"), 1, true);
    cc.setRunJumpAnim(scene.getAnimationGroupByName("runJump"), 0.6, false);
    cc.setFallAnim(scene.getAnimationGroupByName("fall"), 2, false);
    cc.setSlideBackAnim(scene.getAnimationGroupByName("slideBack"), 1, false);
  }
  cc.setTurningOff(false);

  //let's set footstep sound
  //this sound will be played for all actions except idle.
  //the sound will be played twice per cycle of the animation
  //the rate will be set automatically based on frames and fps of animation
  let sound = new BABYLON.Sound(
    "footstep",
    "./sounds/footstep_carpet_000.ogg",
    scene,
    () =>
    {
      cc.setSound(sound);
    },
    { loop: false }
  );

  //set how smmothly should we transition from one animation to another
  cc.enableBlending(0.05);

  //if somehting comes between camera and avatar move camera in front of the obstruction?
  cc.setCameraElasticity(true);
  //if somehting comes between camera and avatar make the obstruction invisible?
  cc.makeObstructionInvisible(false);

  //show the player's ellipsoid for debugging
  cc.showEllipsoid(true);

  cc.setGravity(9.8);//default value

}

//lets map ag groups to the character controller actions.
function createAGmap(allAGs, scene)
{
  let agMap = {
    idle: scene.getAnimationGroupByName("idle"),
    strafeLeft: scene.getAnimationGroupByName("strafeLeft"),
    strafeRight: scene.getAnimationGroupByName("strafeRight"),
    turnLeft: scene.getAnimationGroupByName("turnLeft"),
    turnRight: scene.getAnimationGroupByName("turnRight"),
    walk: scene.getAnimationGroupByName("walk"),
    fall: scene.getAnimationGroupByName("fall"),
    slideBack: scene.getAnimationGroupByName("slideBack"),
    runJump: scene.getAnimationGroupByName("runJump"),
    walkBack: scene.getAnimationGroupByName("walkBack"),
    run: scene.getAnimationGroupByName("run"),
    idleJump: scene.getAnimationGroupByName("idleJump")
  };
  return agMap;
}


function createGround(scene, groundMaterial)
{
  BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "ground/ground_heightMap.png",
    {
      width: 128,
      height: 128,
      minHeight: 0,
      maxHeight: 10,
      subdivisions: 32,
      onReady: (grnd) =>
      {
        grnd.material = groundMaterial;
        grnd.checkCollisions = true;
        grnd.isPickable = true;
        grnd.freezeWorldMatrix();
      },
    },
    scene
  );
}

function createGroundMaterial(scene)
{
  let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
  groundMaterial.diffuseTexture = new BABYLON.Texture("ground/ground.jpg", scene);
  groundMaterial.diffuseTexture.uScale = 4.0;
  groundMaterial.diffuseTexture.vScale = 4.0;

  groundMaterial.bumpTexture = new BABYLON.Texture("ground/ground-normal.png", scene);
  groundMaterial.bumpTexture.uScale = 12.0;
  groundMaterial.bumpTexture.vScale = 12.0;

  groundMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.6, 0.4);
  groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  return groundMaterial;
}
