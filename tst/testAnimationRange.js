window.onload = function () {
  main();
};

let animPaused = false;
let cc;
let scene;
let skeleton;

function main() {
  let helpButton = document.getElementById("help");
  let closeButton = document.getElementById("closehelp");
  let pauseButton = document.getElementById("pause");
  let el = document.getElementById("overlay");

  let canvasElement = document.getElementById("renderCanvas");

  helpButton.onclick = closeButton.onclick = () => {
    el.style.visibility = el.style.visibility == "visible" ? "hidden" : "visible";
  };

  pauseButton.onclick = () => {
    if (animPaused) {
      pauseButton.innerHTML = "Pause";
      scene.stopAnimation(skeleton);
      cc.enableKeyBoard(true);
      cc.resumeAnim();
      canvasElement.focus();
    } else {
      cc.pauseAnim();
      cc.enableKeyBoard(false);
      pauseButton.innerHTML = "Resume";
      skeleton.beginAnimation("sit", false, 1);
      canvasElement.focus();
    }
    animPaused = !animPaused;
  };

  /*
   * The scene
   */
  var canvas = document.querySelector("#renderCanvas");
  var engine = new BABYLON.Engine(canvas, true);
  scene = new BABYLON.Scene(engine);

  scene.clearColor = new BABYLON.Color3(0.75, 0.75, 0.75);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  scene.debugLayer.show({ showExplorer: true, embedMode: true });

  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.3;

  var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -1, -1), scene);
  light2.position = new BABYLON.Vector3(0, 128, 0);
  light2.intensity = 0.7;

  let groundMaterial = createGroundMaterial(scene);
  var ground = createGround(scene, groundMaterial);

  loadPlayer(scene, engine, canvas);

  //box to test view obstruction
  var box = BABYLON.Mesh.CreateBox("box", 2, scene);
  box.checkCollisions = true;
  box.position = new BABYLON.Vector3(0, 8, 5);

  window.addEventListener("resize", function () {
    engine.resize();
  });
}

function loadPlayer(scene, engine, canvas) {
  BABYLON.SceneLoader.ImportMesh("", "player/", "Vincent-frontFacing.babylon", scene, (meshes, particleSystems, skeletons) => {
    var player = meshes[0];
    skeleton = skeletons[0];
    player.skeleton = skeleton;

    skeleton.enableBlending(0.1);

    //if the skeleton does not have any animation ranges then set them as below
    // setAnimationRanges(skeleton);

    var sm = player.material;
    if (sm.diffuseTexture != null) {
      sm.backFaceCulling = true;
      sm.ambientColor = new BABYLON.Color3(1, 1, 1);
    }

    player.position = new BABYLON.Vector3(0, 12, 0);
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
    player.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

    //rotate the camera behind the player
    //player.rotation.y = Math.PI / 4;
    var alpha = -(Math.PI / 2 + player.rotation.y);
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

    camera.attachControl(canvas, false);

    cc = new CharacterController(player, camera, scene);

    cc.setFaceForward(true);
    cc.setMode(0);

    //below makes the controller point the camera at the player head which is approx
    //1.5m above the player origin
    cc.setCameraTarget(new BABYLON.Vector3(0, 1.5, 0));

    //if the camera comes close to the player we want to enter first person mode.
    cc.setNoFirstPerson(false);
    //the height of steps which the player can climb
    cc.setStepOffset(0.4);
    //the minimum and maximum slope the player can go up
    //between the two the player will start sliding down if it stops
    cc.setSlopeLimit(30, 60);

    //tell controller
    // - which animation range should be used for which player animation
    // - rate at which to play that animation range
    // - wether the animation range should be looped
    //use this if name, rate or looping is different from default
    cc.setIdleAnim("idle", 1, true);
    cc.setTurnLeftAnim("turnLeft", 0.5, true);
    cc.setTurnRightAnim("turnRight", 0.5, true);
    cc.setWalkBackAnim("walkBack", 0.5, true);
    cc.setIdleJumpAnim("idleJump", 0.5, false);
    cc.setRunJumpAnim("runJump", 0.6, false);
    cc.setFallAnim("fall", 2, false);
    cc.setSlideBackAnim("slideBack", 1, false);

    //let's set footstep sound
    //this sound will be played for all actions except idle.
    //the sound will be played twice per cycle of the animation
    //the rate will be set automatically based on frames and fps of animation
    let sound = new BABYLON.Sound(
      "footstep",
      "./sounds/footstep_carpet_000.ogg",
      scene,
      () => {
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

    cc.start();

    engine.runRenderLoop(function () {
      scene.render();
    });
  });
}

//this is how you might set the animation ranges for a skeleton
function setAnimationRanges(skel) {
  delAnimRanges(skel);

  skel.createAnimationRange("fall", 0, 16);
  skel.createAnimationRange("idle", 21, 65);
  skel.createAnimationRange("jump", 70, 94);
  skel.createAnimationRange("run", 100, 121);
  skel.createAnimationRange("slideBack", 125, 129);
  skel.createAnimationRange("strafeLeft", 135, 179);
  skel.createAnimationRange("strafeRight", 185, 229);
  skel.createAnimationRange("turnLeft", 240, 262);
  skel.createAnimationRange("turnRight", 270, 292);
  skel.createAnimationRange("walk", 300, 335);
  skel.createAnimationRange("walkBack", 340, 366);
}
/*
 * delete all existing ranges
 * @param {type} skel
 * @returns {undefined}
 */
function delAnimRanges(skel) {
  let ars = skel.getAnimationRanges();
  let l = ars.length;
  for (let i = 0; i < l; i++) {
    let ar = ars[i];
    console.log(ar.name + "," + ar.from + "," + ar.to);
    skel.deleteAnimationRange(ar.name, false);
  }
}

function createGround(scene, groundMaterial) {
  BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "ground/ground_heightMap.png",
    {
      width: 128,
      height: 128,
      minHeight: 0,
      maxHeight: 10,
      subdivisions: 32,
      onReady: (grnd) => {
        grnd.material = groundMaterial;
        grnd.checkCollisions = true;
        grnd.isPickable = true;
        grnd.freezeWorldMatrix();
      },
    },
    scene
  );
}

function createGroundMaterial(scene) {
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
