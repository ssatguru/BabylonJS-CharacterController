window.onload = function ()
{
  main();
};

var canvas;
var cc, cc1, cc2;
var box, box4;
var player;

async function main()
{
  setControls();
  /*
   * The scene
   */
  canvas = document.querySelector("#renderCanvas");
  var engine = new BABYLON.Engine(canvas, true, { audioEngine: true });
  var scene = new BABYLON.Scene(engine);
  scene.useRightHandedSystem = false;
  scene.clearColor = new BABYLON.Color3(0.75, 0.75, 0.75);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  scene.debugLayer.show({ showExplorer: true, embedMode: true });

  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.5;

  var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(1, -1, 1), scene);
  light2.position = new BABYLON.Vector3(0, 128, 0);
  light2.intensity = 0.7;

  //boxes to check camera elasticity and making obstructions invisibile checks
  createBoxes(scene);

  let groundMaterial = createGroundMaterial(scene);
  var ground = createGround(scene, groundMaterial);

  //load and set the player
  //const result = await BABYLON.ImportMeshAsync("player/Vincent-frontFacing.babylon", scene);
  const result = await BABYLON.ImportMeshAsync("player/Animated Base Character.glb", scene);
  let player = result.meshes[0];

  setPlayer(player);
   // Stop all animation groups
  scene.animationGroups.forEach((group) => {
      group.stop();
  });
  

  //create and set the camera
  let arcRotateCamera = createCamera(player, scene);
  arcRotateCamera.attachControl(canvas, false);

  //create a CharacterController and set it
  cc1 = new CharacterController(player, arcRotateCamera, scene);
  //setCharacterController(cc1, scene);
  setCharacterController2(cc1, scene);
  cc1.start();
  cc = cc1;

  loadNPC(scene, engine, canvas);

  window.addEventListener("resize", function ()
  {
    engine.resize();
  });

  engine.runRenderLoop(() => { scene.render(); });

  showControls();
  canvas.focus();

}


//boxes to check camera elasticity and making obstructions invisibile checks
function createBoxes(scene)
{
  var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
  myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // red

  box = BABYLON.Mesh.CreateBox("red-box", 2, scene);
  box.checkCollisions = true;
  box.position = new BABYLON.Vector3(0, 8, 5);
  box.material = myMaterial;

  var box2 = BABYLON.Mesh.CreateBox("green-box", 2, scene);
  box2.checkCollisions = true;
  box2.position = new BABYLON.Vector3(-5, 8, 7);
  box2.material = myMaterial.clone("green");
  box2.material.diffuseColor = new BABYLON.Color3(0, 1, 0);

  let box3 = BABYLON.Mesh.CreateBox("yellow-box", 2, scene);
  box3.position = new BABYLON.Vector3(0, 8, -7);
  box3.checkCollisions = true;
  box3.material = myMaterial.clone("yellow");
  box3.material.diffuseColor = new BABYLON.Color3(1, 1, 0);

  box4 = BABYLON.Mesh.CreateBox("blue-box", 2, scene);
  box4.position = new BABYLON.Vector3(15, 11, 26);
  box4.checkCollisions = false;
  box4.material = myMaterial.clone("blue");
  box4.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
}


function setPlayer(player)
{
  player.position = new BABYLON.Vector3(0, 12, 0);
  player.checkCollisions = false;
  player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
  player.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
}

function createCamera(player, scene)
{
  //rotate the camera behind the player
  //player.rotation.y = Math.PI / 4;
  //var alpha = -(Math.PI / 2 + player.rotation.y);
  var alpha = -2.5;
  var beta = 1.25;
  var target = new BABYLON.Vector3(player.position.x, player.position.y + 1.5, player.position.z);

  var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", alpha, beta, 12, target, scene);

  //standard camera setting
  camera.wheelPrecision = 15;
  camera.checkCollisions = false;
  //make sure the keyboard keys controlling camera are different from those controlling player
  //here we will not use any keyboard keys to control camera
  camera.keysLeft = [];
  camera.keysRight = [];
  camera.keysUp = [];
  camera.keysDown = [];
  //how close can the camera come to player
  camera.lowerRadiusLimit = 2;
  //how far can the camera go from the player
  camera.upperRadiusLimit = 200;

  return camera;
}

function setCharacterController(c, scene)
{

  c.setFaceForward(false);
  c.setMode(0);
  c.setTurnSpeed(45);
  //below makes the controller point the camera at the player head which is approx
  //1.5m above the player origin
  c.setCameraTarget(new BABYLON.Vector3(0, 1.5, 0));

  //if the camera comes close to the player we want to enter first person mode.
  c.setNoFirstPerson(false);
  //the height of steps which the player can climb
  c.setStepOffset(0.4);
  //the minimum and maximum slope the player can go up
  //between the two the player will start sliding down if it stops
  c.setSlopeLimit(30, 60);

  //tell controller
  // - which animation range should be played for which player action
  // - rate at which to play that animation range
  // - wether the animation range should be looped
  //use this if name, rate or looping is different from default
  c.setIdleAnim("idle", 1, true);
  c.setTurnLeftAnim("turnLeft", 0.5, true);
  c.setTurnRightAnim("turnRight", 0.5, true);
  c.setWalkBackAnim("walkBack", 0.5, true);
  c.setIdleJumpAnim("idleJump", 0.5, false);
  c.setRunJumpAnim("runJump", 0.6, false);
  c.setFallAnim("fall", 2, false);
  c.setSlideBackAnim("slideBack", 1, false);

  // to make player trun instantly
  // cc.setSmoothTurnSpeed(0);

  let walkSound = new BABYLON.Sound(
    "walk",
    "./sounds/footstep_carpet_000.ogg",
    scene,
    () =>
    {
      c.setSound(walkSound);
    },
    { loop: false }
  );

  var ua = window.navigator.userAgent;
  var isIE = /MSIE|Trident/.test(ua);
  if (isIE)
  {
    //IE specific code goes here
    c.setJumpKey("spacebar");
  }

  c.setCameraElasticity(true);
  c.makeObstructionInvisible(false);

}

function setCharacterController2(c, scene)
{

  c.setFaceForward(false);
  c.setMode(0);
  c.setTurnSpeed(45);
  //below makes the controller point the camera at the player head which is approx
  //1.5m above the player origin
  c.setCameraTarget(new BABYLON.Vector3(0, 1.5, 0));

  //if the camera comes close to the player we want to enter first person mode.
  c.setNoFirstPerson(false);
  //the height of steps which the player can climb
  c.setStepOffset(0.4);
  //the minimum and maximum slope the player can go up
  //between the two the player will start sliding down if it stops
  c.setSlopeLimit(30, 60);

  //tell controller
  // - which animation range should be played for which player action
  // - rate at which to play that animation range
  // - wether the animation range should be looped
  //use this if name, rate or looping is different from default
  c.setIdleAnim(scene.getAnimationGroupByName("Rig|Idle_Loop"), 1, true);
  // c.setTurnLeftAnim(scene.getAnimationGroupByName("turnLeft"), 0.5, true);
  // c.setTurnRightAnim(scene.getAnimationGroupByName("turnRight"), 0.5, true);
  // c.setStrafeLeftAnim(scene.getAnimationGroupByName("strafeLeft"), 1, true);
  // c.setStrafeRightAnim(scene.getAnimationGroupByName("strafeRight"), 1, true);
  c.setWalkAnim(scene.getAnimationGroupByName("Rig|Walk_Loop"), 1, true);
   c.setWalkBackAnim(scene.getAnimationGroupByName("Rig|Walk_Loop"), -0.5, true);
  c.setPreIdleJumpAnim(scene.getAnimationGroupByName("Rig|Jump_Land"), -2, false);
  c.setIdleJumpAnim(scene.getAnimationGroupByName("Rig|Jump_Loop"), 1, false);
  c.setPostIdleJumpAnim(scene.getAnimationGroupByName("Rig|Jump_Land"), 2 , false);
  c.setRunAnim(scene.getAnimationGroupByName("Rig|Sprint_Loop"), 1, true);
  c.setRunJumpAnim(scene.getAnimationGroupByName("Rig|Jump_Loop"), 0.6, false);
  c.setFallAnim(scene.getAnimationGroupByName("Rig|Jump_Loop"), 2, false);
  // c.setSlideBackAnim(scene.getAnimationGroupByName("slideBack"), 1, false);

  c.enableBlending(0.1);
  // to make player trun instantly
  c.setSmoothTurnSpeed(360);

  let walkSound = new BABYLON.Sound(
    "walk",
    "./sounds/footstep_carpet_000.ogg",
    scene,
    () =>
    {
      c.setSound(walkSound);
    },
    { loop: false }
  );

  var ua = window.navigator.userAgent;
  var isIE = /MSIE|Trident/.test(ua);
  if (isIE)
  {
    //IE specific code goes here
    c.setJumpKey("spacebar");
  }

  c.setCameraElasticity(true);
  c.makeObstructionInvisible(false);

}
async function loadNPC(scene, engine, canvas)
{
    const result = await BABYLON.ImportMeshAsync("player/starterAvatars.babylon", scene);

    var player = result.meshes[0];
    player.skeleton.enableBlending(0.1);

    var sm = player.material;
    if (sm.diffuseTexture != null)
    {
      sm.backFaceCulling = true;
      sm.ambientColor = new BABYLON.Color3(1, 1, 1);
    }

    player.position = new BABYLON.Vector3(3, 12, 1);
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
    player.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

    //camera null for npc
    cc2 = new CharacterController(player, null, scene);
    cc2.setFaceForward(false);
    cc2.setMode(0);
    cc2.setTurnSpeed(45);

    cc2.setStepOffset(0.4);
    cc2.setSlopeLimit(30, 60);

    cc2.setIdleAnim("idle", 1, true);
    cc2.setTurnLeftAnim("turnLeft", 0.5, true);
    cc2.setTurnRightAnim("turnRight", 0.5, true);
    cc2.setWalkBackAnim("walkBack", 0.5, true);
    cc2.setIdleJumpAnim("idleJump", 0.5, false);
    cc2.setRunJumpAnim("runJump", 0.6, false);
    cc2.setFallAnim("fall", 2, false);
    cc2.setSlideBackAnim("slideBack", 1, false);

    let walkSound = new BABYLON.Sound(
      "walk",
      "./sounds/footstep_carpet_000.ogg",
      scene,
      () =>
      {
        cc2.setSound(walkSound);
      },
      { loop: false }
    );

    var ua = window.navigator.userAgent;
    var isIE = /MSIE|Trident/.test(ua);
    if (isIE)
    {
      //IE specific code goes here
      cc2.setJumpKey("spacebar");
    }

    cc2.enableKeyBoard(false);
    cc2.start();
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
      onReady: function (grnd)
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

var showHelp = function ()
{
  var el = document.getElementById("overlay");
  el.style.visibility = el.style.visibility == "visible" ? "hidden" : "visible";
  canvas.focus();
};

function showControls()
{
  var el = document.getElementById("controls");
  el.style.visibility = "visible";
}

var mvt,tnt = false;

let activeElement = null;
let activeClass = "w3-pale-green";
let inActiveClass = "w3-pale-red";

function toggleClass(e, action)
{
  e.target.classList.toggle(inActiveClass);
  e.target.classList.toggle(activeClass);
  if (e.target.classList.contains(activeClass))
  {
    if (activeElement != null)
    {
      activeElement.classList.toggle(inActiveClass);
      activeElement.classList.toggle(activeClass)
    }
    if (action) cc[action](true);
    activeElement = e.target;
  } else
  {
    if (action) cc[action](false);
    activeElement = null;
  }
  canvas.focus();
}

function setUIValues()
{

  document.getElementById("tp").checked = cc.getMode() == 0 ? true : false;
  document.getElementById("td").checked = cc.getMode() == 1 ? true : false;
  document.getElementById("toff").checked = cc.isTurningOff();
  document.getElementById("kb").checked = cc.isKeyBoardEnabled();

  //for npc third person mode is always disabled.
  document.getElementById("tp").disabled = (cc == cc2);
  document.getElementById("toff").disabled = (cc == cc2);
}



function setControls()
{
  const x = document.getElementsByTagName("button");

  for (i = 0; i < x.length; i++)
  {
    x[i].className = "w3-btn w3-border w3-round w3-pale-red";
  }

  document.getElementById("pc").onclick = function (e)
  {
    cc = cc1;
    setUIValues();
    canvas.focus();
  };

  document.getElementById("npc").onclick = function (e)
  {
    cc = cc2;
    setUIValues();
    canvas.focus();
  };

  document.getElementById("pl").onclick = function (e)
  {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock || false;
    if (canvas.requestPointerLock)
    {
      canvas.requestPointerLock();
    }
    canvas.focus();
  };

  document.getElementById("w").onclick = function (e)
  {
    toggleClass(e, "walk");
  };
  document.getElementById("wb").onclick = function (e)
  {
    toggleClass(e, "walkBack");
  };
  document.getElementById("wbf").onclick = function (e)
  {
    toggleClass(e, "walkBackFast");
  };
  document.getElementById("r").onclick = function (e)
  {
    toggleClass(e, "run");
  };
  document.getElementById("j").onclick = function (e)
  {
    cc.jump();
    canvas.focus();
  };
  document.getElementById("tl").onclick = function (e)
  {
    toggleClass(e, "turnLeft");
  };
  document.getElementById("tlf").onclick = function (e)
  {
    toggleClass(e, "turnLeftFast");
  };
  document.getElementById("tr").onclick = function (e)
  {
    toggleClass(e, "turnRight");
  };
  document.getElementById("trf").onclick = function (e)
  {
    toggleClass(e, "turnRightFast");
  };
  document.getElementById("sl").onclick = function (e)
  {
    toggleClass(e, "strafeLeft");
  };
  document.getElementById("slf").onclick = function (e)
  {
    toggleClass(e, "strafeLeftFast");
  };
  document.getElementById("sr").onclick = function (e)
  {
    toggleClass(e, "strafeRight");
  };
  document.getElementById("srf").onclick = function (e)
  {
    toggleClass(e, "strafeRightFast");
  };
  document.getElementById("mvt").onclick = function (e)
  {
    if (mvt)
    {
      cc.moveToStop()
    } else
    {
      cc.moveTo(box4, { onComplete: () => { cc.moveToStop(); toggleClass(e, null); console.log("moveTo complete"); mvt = !mvt; } });
    }
    mvt = !mvt;
    toggleClass(e, null);
  };

  document.getElementById("tnt").onclick = function (e)
  {
    if (tnt)
    {
      console.log("turning stop");
      cc.turnToStop();
    } else
    {
      console.log("turning");
      cc.turnTo(box, { onComplete: () => { cc.turnToStop(); toggleClass(e, null); console.log("turning complete"); tnt = !tnt; } });
    }
    tnt = !tnt;
    toggleClass(e, null);
  };

  document.getElementById("tp").onclick = function (e)
  {
    cc.setMode(0);
    canvas.focus();
  };
  document.getElementById("td").onclick = function (e)
  {
    cc.setMode(1);
    canvas.focus();
  };
  document.getElementById("toff").onclick = function (e)
  {
    cc.setTurningOff(e.target.checked);
    canvas.focus();
  };
  document.getElementById("kb").onclick = function (e)
  {
    cc.enableKeyBoard(e.target.checked);
    canvas.focus();
  };

  document.getElementById("elp").onclick = function (e)
  {
    cc.showEllipsoid(e.target.checked);
    canvas.focus();
  };

  document.getElementById("help").onclick = showHelp;
  document.getElementById("closehelp").onclick = showHelp;

  // let animPaused = false;
  // document.getElementById("help").onclick = (e) => {
  //   if (animPaused) {
  //     cc.resumeAnim();
  //   } else {
  //     cc.pauseAnim();
  //   }
  //   animPaused = !animPaused;
  // };
}
