window.onload = function () {
  main();
};

function main() {
  var helpButton = document.getElementById("help");
  var showHelp = function () {
    var el = document.getElementById("overlay");
    el.style.visibility = el.style.visibility == "visible" ? "hidden" : "visible";
  };
  helpButton.onclick = showHelp;
  /*
   * The scene
   */
  var canvas = document.querySelector("#renderCanvas");
  var engine = new BABYLON.Engine(canvas, true);
  var scene = new BABYLON.Scene(engine);

  //scene.useRightHandedSystem = true;

  scene.clearColor = new BABYLON.Color3(0.75, 0.75, 0.75);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  scene.debugLayer.show({ showExplorer: true, overlay: true });

  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.3;

  var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -1, -1), scene);
  light2.position = new BABYLON.Vector3(0, 128, 0);
  light2.intensity = 0.7;

  var groundMaterial = createGroundMaterial(scene);
  var ground = createGround(scene, groundMaterial);

  //   var steps = BABYLON.MeshBuilder.CreateBox(
  //     "Steps",
  //     { width: 5, height: 0.25, depth: 5 },
  //     scene
  //   );
  //   steps.position = new BABYLON.Vector3(0, 6.25, 5);
  //   steps.checkCollisions = true;
  //   steps.material = groundMaterial;

  //   var step2 = steps.createInstance("step2");
  //   step2.checkCollisions = true;
  //   console.log(step2);
  //   step2.scaling.x = 0.5;
  //   step2.scaling.z = 0.5;
  //   step2.scaling.y = 6;
  //   step2.position.y = 6.5;
  loadPlayer(scene, engine, canvas);

  window.addEventListener("resize", function () {
    engine.resize();
  });
}

function loadPlayer(scene, engine, canvas) {
  BABYLON.SceneLoader.ImportMesh("", "player/", "Vincent.glb", scene, (meshes, particleSystems, skeletons) => {
    var player = meshes[0];

    player.position = new BABYLON.Vector3(0, 12, 0);
    player.checkCollisions = true;
    player.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
    player.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
    // character controller  needs rotation in euler.
    // if your mesh has rotation in quaternion then convert that to euler.
    // NOTE: The GLTF/GLB files have rotation in quaternion
    player.rotation = player.rotationQuaternion.toEulerAngles();
    player.rotationQuaternion = null;

    //rotate the camera behind the player
    //.glbs are RHS
    player.rotation.y = Math.PI / 4;
    var alpha = Math.PI / 2 - player.rotation.y;
    var beta = Math.PI / 2.5;
    var target = new BABYLON.Vector3(player.position.x, player.position.y + 1.5, player.position.z);

    var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", alpha, beta, 5, target, scene);

    // make sure the keyboard keys controlling camera are different from those controlling player
    // here we will not use any keyboard keys to control camera
    camera.keysLeft = [];
    camera.keysRight = [];
    camera.keysUp = [];
    camera.keysDown = [];

    // Below are all standard camera settings.
    // Nothing specific to charcter controller
    camera.wheelPrecision = 15;
    camera.checkCollisions = false;
    // how close can the camera come to player
    camera.lowerRadiusLimit = 2;
    // how far can the camera go from the player
    camera.upperRadiusLimit = 20;
    camera.attachControl(canvas, false);

    // provide all your animation groups as a map to the character controller
    // the map should have a key whose value is the name of the character controller  aniamtion
    // and the value is the AnimationGroup corresponding to that animation.
    // In our example the name of the AnimationGroup is the same as the name of name of the character controller  aniamtion
    // so the following will work.
    var agMap = {};
    var allAGs = scene.animationGroups;
    for (i = 0; i < allAGs.length; i++) {
      agMap[allAGs[i].name] = allAGs[i];
    }
    allAGs[0].stop();

    var cc = new CharacterController(player, camera, scene, agMap, true);
    cc.setMode(1);
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
    // - which animation range/ animation group should be used for which player animation
    // - rate at which to play that animation range
    // - wether the animation range should be looped
    //use this if name, rate or looping is different from default
    //set the animation range name to "null" to not prevent the controller from playing
    //set a parm to null if you donot want to change that
    cc.setIdleAnim(null, 1, true);
    cc.setTurnLeftAnim(null, 0.5, true);
    cc.setTurnRightAnim(null, 0.5, true);
    cc.setWalkBackAnim(null, 0.5, true);
    cc.setIdleJumpAnim(null, 0.5, false);
    cc.setRunJumpAnim(null, 0.6, false);
    cc.setFallAnim(null, 2, false);
    cc.setSlideBackAnim(null, 1, false);

    cc.enableBlending(0.05);

    cc.start();

    engine.runRenderLoop(function () {
      scene.render();
    });
  });
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
