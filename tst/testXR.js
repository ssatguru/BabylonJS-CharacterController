// testXR.js
//
// Manual test page for the CharacterController's WebXR support.
//
// This mirrors testArAg.js (same scene, avatar, animations, and character
// controller wiring) but adds a WebXR layer on top: it probes for immersive
// VR/AR support, enables XR on the CharacterController, and exposes buttons to
// enter/exit an immersive session. Once in-session the avatar is driven by the
// left thumbstick (walk/strafe), left-stick press (run), left trigger (jump),
// and the right thumbstick / face buttons orbit and dolly the follow camera.
//
// WebXR requires a secure context (HTTPS or localhost) and a compatible headset
// or the browser's WebXR emulator devtools extension. Serve via `npm run dev`
// (webpack-dev-server on localhost) and open /tst/testXR.html.
//
// Query string:
//   ?animType=ar  -> load the .babylon avatar and use AnimationRanges
//   (anything else / omitted) -> load the .glb avatar and use AnimationGroups

let ar;
window.onload = function ()
{
  const queryString = this.document.location.search;
  const urlParams = new URLSearchParams(queryString);
  const animType = urlParams.get("animType");
  if (animType == "ar") ar = true; else ar = false;
  setUI(ar);
  main(ar);
};

let animPaused = false;
let ellipsoid = true;
let cc;
let scene;
let inXR = false;

function setUI(ar)
{
  let animType = document.getElementById("animType");
  if (!ar) animType.innerHTML = "Animation Group";

  let enterVRButton = document.getElementById("enterVR");
  let enterARButton = document.getElementById("enterAR");
  let exitXRButton = document.getElementById("exitXR");
  let turnToButton = document.getElementById("turnTo");
  let moveToButton = document.getElementById("moveTo");
  let pauseButton = document.getElementById("pause");
  let ellButton = document.getElementById("ell");
  let helpButton = document.getElementById("help");
  let closeButton = document.getElementById("closehelp");

  let el = document.getElementById("overlay");
  let canvasElement = document.getElementById("renderCanvas");

  enterVRButton.onclick = async () =>
  {
    if (cc == null) return;
    await cc.enterXR("vr");
    updateXRUI();
  };

  enterARButton.onclick = async () =>
  {
    if (cc == null) return;
    await cc.enterXR("ar");
    updateXRUI();
  };

  exitXRButton.onclick = async () =>
  {
    if (cc == null) return;
    await cc.exitXR();
    updateXRUI();
  };

  turnToButton.onclick = () =>
  {
    cc.turnTo(box);
  };

  moveToButton.onclick = () =>
  {
    cc.moveTo(box);
  };

  helpButton.onclick = closeButton.onclick = () =>
  {
    el.style.visibility = el.style.visibility == "visible" ? "hidden" : "visible";
  };

  ellButton.onclick = () =>
  {
    ellipsoid = !ellipsoid;
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

// Reflect current XR support/session state into the button enabled/disabled
// state and the status line.
function updateXRUI()
{
  let enterVRButton = document.getElementById("enterVR");
  let enterARButton = document.getElementById("enterAR");
  let exitXRButton = document.getElementById("exitXR");
  let status = document.getElementById("xrStatus");

  if (cc == null) return;

  inXR = cc.isInXR();

  if (inXR)
  {
    enterVRButton.disabled = true;
    enterARButton.disabled = true;
    exitXRButton.disabled = false;
    status.innerHTML = "In XR session";
  }
  else
  {
    exitXRButton.disabled = true;
    status.innerHTML = "Ready";
  }
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
    let allAGs = scene.animationGroups;
    for (i = 0; i < allAGs.length; i++)
    {
      allAGs[i].stop();
      console.log(i + "," + allAGs[i].name);
    }
  }

  cc = new CharacterController(player, arcRotateCamera, scene);
  setCharacterController(cc, scene, ar);
  cc.start();

  //enable WebXR on the character controller and probe support.
  await setupXR(cc);

  engine.runRenderLoop(function ()
  {
    scene.render();
  });

  canvas.focus();
}

// Enable XR on the CharacterController and probe immersive VR/AR support.
// Enables the matching enter button only for a supported session type.
async function setupXR(cc)
{
  let enterVRButton = document.getElementById("enterVR");
  let enterARButton = document.getElementById("enterAR");
  let status = document.getElementById("xrStatus");

  // start with everything disabled until we know what is supported.
  enterVRButton.disabled = true;
  enterARButton.disabled = true;
  document.getElementById("exitXR").disabled = true;

  if (!navigator.xr)
  {
    status.innerHTML = "WebXR not available in this browser";
    return;
  }

  try
  {
    // enableXR lazily creates a default WebXR experience (teleport disabled)
    // and wires the controller's XR locomotion/camera/session lifecycle.
    let enabled = await cc.enableXR();
    if (!enabled)
    {
      status.innerHTML = "Failed to enable WebXR";
      return;
    }

    // OPTIONAL: tune XR locomotion/camera sensitivity.
    // cc.setXRStickDeadzone(0.15);
    // cc.setXROrbitAlphaRate(0.0075);
    // cc.setXROrbitBetaRate(0.003);
    // cc.setXRDollyRate(0.05);

    // OPTIONAL: customise the controller input mapping (partial overlay onto
    // the documented default). Rejected mappings keep the previous mapping.
    // let res = cc.setXRInputMapping({ Jump: BABYLON /* BindableInput enum */ });
    // console.log("mapping result", res);

    // Probe immersive VR/AR support. `detectXRSupport` is the pure detector
    // re-exported from the library entry point (available as a UMD global
    // alongside `CharacterController`); it is the reliable source of truth for
    // which session types the current device/browser supports. `cc.isXRSupported()`
    // is also available and returns the same `{ vrSupported, arSupported }` shape.
    let support = await detectXRSupport();
    console.log("XR support:", support);

    enterVRButton.disabled = !support.vrSupported;
    enterARButton.disabled = !support.arSupported;

    if (!support.vrSupported && !support.arSupported)
    {
      status.innerHTML = "No immersive VR/AR device detected (try the WebXR emulator)";
    }
    else
    {
      status.innerHTML = "Ready" +
        (support.vrSupported ? " · VR" : "") +
        (support.arSupported ? " · AR" : "");
    }
  }
  catch (e)
  {
    console.error("XR setup failed", e);
    status.innerHTML = "XR setup error (see console)";
  }
}

let box;
function setScene(scene)
{
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
  box.rotation.y = Math.PI / 4;
  var redMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
  redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // red
  box.material = redMaterial;
}

function setPlayer(player)
{
  // player position point is the feet
  player.position = new BABYLON.Vector3(-8, 7, 9);

  if (ar) player.rotation.y = (1 / 2) * Math.PI;
  else player.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, -(1 / 2) * Math.PI, 0);

  player.checkCollisions = true;

  //player's ellipsoid should be the size of the player - thus around 1.75m tall
  player.ellipsoid = new BABYLON.Vector3(0.25, 0.875, 0.25);

  //the ellipsoidoffset positions the center of ellipsoid relative to the player position point
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
  camera.keysLeft = [];
  camera.keysRight = [];
  camera.keysUp = [];
  camera.keysDown = [];

  camera.wheelPrecision = 15;
  camera.checkCollisions = false;
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 20;

  return camera;
}

function setCharacterController(cc, scene, ar)
{
  cc.setFaceForward(true);
  cc.setMode(0);

  cc.setCameraTarget(new BABYLON.Vector3(0, 1.5, 0));
  cc.setNoFirstPerson(false);
  cc.setStepOffset(0.5);
  cc.setSlopeLimit(30, 60);

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

  //footstep sound
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

  cc.enableBlending(0.05);
  cc.setCameraElasticity(true);
  cc.makeObstructionInvisible(false);
  cc.showEllipsoid(true);
  cc.setGravity(9.8);
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
