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

// -----------------------------------------------------------------------------
// DESKTOP-VISIBLE self-diagnostics mirror.
//
// A developer wearing a Meta Quest 3 has no browser console, and the in-VR panel
// itself may be invisible (which is exactly what we're diagnosing). So we mirror
// the same status/values onto the DESKTOP monitor via an on-page element
// (`#xrDebugMirror`, a <pre> appended to the #controls div) as well as the
// console. This lets us confirm which failure mode we're in — "?debug=1 not
// set", "GUI MISSING", "created OK" + live values, or "not in XR" — just by
// looking at the desktop screen. Every DOM write is guarded so it can never
// throw into the render loop or setup path.
// -----------------------------------------------------------------------------

// Create the on-page mirror element once (idempotent). Appended to the #controls
// div, styled small monospace so it doesn't dominate the page. Guarded: any DOM
// failure is swallowed.
function ensureDbgMirrorEl()
{
  try
  {
    let el = document.getElementById("xrDebugMirror");
    if (el) return el;
    let controls = document.getElementById("controls");
    if (!controls) return null;
    el = document.createElement("pre");
    el.id = "xrDebugMirror";
    el.style.fontSize = "11px";
    el.style.whiteSpace = "pre";
    el.style.maxWidth = "260px";
    el.style.background = "rgba(255, 255, 255, 0.85)";
    el.style.padding = "4px";
    el.style.margin = "4px 0 0 0";
    el.style.overflow = "auto";
    controls.appendChild(el);
    return el;
  }
  catch (e)
  {
    return null;
  }
}

// Write a status string to BOTH the on-page mirror element and the console.
// Fully guarded — never throws.
function dbgMirror(msg)
{
  try
  {
    let el = document.getElementById("xrDebugMirror");
    if (!el) el = ensureDbgMirrorEl();
    if (el) el.textContent = msg;
  }
  catch (e)
  {
    /* never throw from a diagnostic write */
  }
  try
  {
    console.log("[XR debug] " + msg);
  }
  catch (e) { }
}

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

  // ALWAYS-ON diagnostic panel (see setupXRDebugPanel). The panel is now created
  // unconditionally so it renders in front of the DESKTOP ArcRotateCamera on a
  // plain browser load (no ?debug, no headset) — this proves the GUI / plane /
  // material / text code works before ever entering XR. When an XR session
  // starts, the same panel re-anchors to the XR head camera.
  setupXRDebugPanel(cc, arcRotateCamera, player);

  engine.runRenderLoop(function ()
  {
    scene.render();
  });

  canvas.focus();
}

// -----------------------------------------------------------------------------
// TEMPORARY in-VR debug panel.
//
// A developer wearing a Meta Quest 3 has no browser console, so this draws a
// world-space heads-up panel that prints live camera values every frame. Its
// purpose is to diagnose the "XR camera targets a point above the avatar head"
// issue by letting us compare, in-headset:
//   - the ArcRotateCamera follow eye (position/target/radius),
//   - the XR camera rig base (xrCam.position),
//   - the actual rendered eye (xrCam.globalPosition), and
//   - the derived head offset (globalPosition - position, "eye-base").
// against the avatar's own position.
//
// PROVEN APPROACH (mirrors Vishva's XRManager.positionPlaneInFront, which shows
// a working in-headset HUD on a Quest 3): the panel is an UNPARENTED top-level
// world-space plane, repositioned + reoriented every frame from the TRUE LIVE
// head pose carried by the RIG (per-eye) cameras `xrCam.rigCameras[0]`.
//
// Why NOT parent to the WebXR camera: parenting follows head POSITION but not
// head ROTATION, and the base WebXR camera transform is OVERWRITTEN every frame
// by setTransformationFromNonVRCamera(arc, true) (the follow mirror), which also
// grounds position.y to 0. A parented / base-camera-read plane therefore gets a
// wrong/grounded pose and appears missing or misplaced. The rig cameras carry
// the true head transform regardless, so we read from rigCameras[0].
//
// This is purely additive test-harness scaffolding and can be deleted once the
// camera-offset investigation is done.
// -----------------------------------------------------------------------------
function setupXRDebugPanel(cc, arcRotateCamera, player)
{
  // FAIL-SAFE: the entire setup is wrapped in try/catch. This panel is
  // diagnostic scaffolding suspected of blacking out the XR view, so any
  // failure here (GUI namespace missing, mesh/material/texture creation error)
  // must never prevent engine.runRenderLoop or blank the scene. On any error we
  // console.warn and return, leaving the scene untouched.
  // DESKTOP milestone: record that setup was actually called (before the GUI
  // guard) so we can confirm the code path from the desktop monitor.
  dbgMirror("panel: setup called");

  try
  {
    // Guard that the GUI namespace is actually loaded before using it.
    if (!BABYLON.GUI || !BABYLON.GUI.AdvancedDynamicTexture)
    {
      console.warn("[XR debug] BABYLON.GUI.AdvancedDynamicTexture unavailable; skipping debug panel.");
      dbgMirror("panel: GUI MISSING (BABYLON.GUI undefined)");
      return;
    }

    // Number/vector formatting helpers: never throw on null/undefined.
    const f = (n) => (typeof n === "number" ? n.toFixed(2) : "?");
    const v = (p) => p ? `(${f(p.x)}, ${f(p.y)}, ${f(p.z)})` : "null";

    // UNPARENTED top-level world-space plane. Created ONCE. It is NOT parented
    // to the XR camera (see header) — it is repositioned per frame from the rig
    // head pose. DOUBLESIDE so it is visible regardless of facing ambiguity.
    const dbgPlane = BABYLON.MeshBuilder.CreatePlane(
      "xrDebugPlane",
      { width: 1.4, height: 1.0, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
      scene
    );
    dbgPlane.isPickable = false;
    // PROVEN DETAIL #1 from Vishva's working HUD (createDiagHud): render the
    // panel in rendering group 1. We had removed this earlier on a misdiagnosis
    // — the earlier black screen was actually caused by the plane being parented
    // on the eyes at z=1.6, not by the rendering group. Do NOT parent it to
    // anything (per-frame head-locked placement stays below).
    dbgPlane.renderingGroupId = 1;

    // Emissive unlit material so the panel is readable regardless of scene
    // lighting: white emissive, lighting disabled, no back-face culling.
    const dbgMat = new BABYLON.StandardMaterial("xrDebugMat", scene);
    dbgMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    dbgMat.disableLighting = true;
    dbgMat.backFaceCulling = false;
    dbgPlane.material = dbgMat;

    // GUI drawn ONTO the world-space plane (CreateForMesh, exactly like Vishva —
    // NOT CreateFullscreenUI). Semi-transparent dark background + a white
    // top-left TextBlock.
    const dbgTex = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(dbgPlane, 1024, 768);

    // PROVEN DETAIL #2 from Vishva's working HUD (createDiagHud): use a solid
    // GUI Rectangle added to the ADT as the panel background (rather than
    // setting adt.background), and put the TextBlock INSIDE that Rectangle.
    const dbgPanel = new BABYLON.GUI.Rectangle("xrDebugRect");
    dbgPanel.width = 1;
    dbgPanel.height = 1;
    dbgPanel.thickness = 0;
    dbgPanel.background = "black";
    dbgPanel.alpha = 0.4;
    dbgPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    dbgPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    dbgTex.addControl(dbgPanel);

    const dbgText = new BABYLON.GUI.TextBlock();
    dbgText.text = "XR debug";
    dbgText.color = "white";
    dbgText.fontSize = 30;
    dbgText.textWrapping = true;
    dbgText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    dbgText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    dbgText.paddingLeft = "24px";
    dbgText.paddingTop = "24px";
    // TextBlock goes INTO the Rectangle (not directly on the ADT).
    dbgPanel.addControl(dbgText);

    // DESKTOP milestone: plane + ADT + text all created without throwing.
    dbgMirror("panel: created OK");

    // Per-frame update. Registered ONCE; the whole observer body is wrapped in
    // try/catch so it can NEVER throw out of the render loop (a throw here would
    // blank the scene). It does BOTH placement and text update each frame.
    scene.onBeforeRenderObservable.add(() =>
    {
      try
      {
        // (a) ALWAYS keep the plane enabled — it is a diagnostic and must render
        // both on the desktop and in XR. Never setEnabled(false).
        dbgPlane.setEnabled(true);

        // (b) Choose the anchor camera. In XR, use the live XR head camera; on
        // the plain desktop (no XR session / no XR camera) fall back to the
        // ArcRotateCamera so the panel floats in front of the browser view.
        const sessionActive = !!(cc && typeof cc.isInXR === "function" && cc.isInXR());
        const xrCam = (sessionActive && cc && typeof cc.getXRCamera === "function") ? cc.getXRCamera() : null;
        const inXR = !!(sessionActive && xrCam);

        // (c) HEAD POSE. In XR, read from the RIG camera (mirrors
        // Vishva.positionPlaneInFront): rigCameras[0] carries the TRUE live head
        // pose; the base camera is clobbered by the follow mirror. On desktop,
        // the ArcRotateCamera is the head camera — it also supports
        // getFrontPosition/getDirection/globalPosition/computeWorldMatrix, so the
        // same placement code path below works unchanged.
        let headCam;
        let rig = null;
        if (inXR)
        {
          rig = xrCam.rigCameras;
          headCam = (Array.isArray(rig) && rig.length > 0) ? rig[0] : xrCam;
        }
        else
        {
          headCam = arcRotateCamera;
        }
        if (!headCam) return;

        // A value is a finite Vector3 only when x/y/z are all finite numbers.
        // Rejects NaN/undefined poses that would fling the panel out of view.
        const isFiniteVec = (vec) =>
          !!vec &&
          Number.isFinite(vec.x) &&
          Number.isFinite(vec.y) &&
          Number.isFinite(vec.z);

        // Force the head camera's world matrix current so getFrontPosition /
        // getDirection / globalPosition reflect THIS frame's transform.
        if (typeof headCam.computeWorldMatrix === "function")
        {
          headCam.computeWorldMatrix(true);
        }

        // Head world position: prefer globalPosition when finite, else local.
        let headPos = headCam.globalPosition;
        if (!isFiniteVec(headPos)) headPos = headCam.position;

        // Placement constants (world-space meters — top-level, not parented).
        const DISTANCE = 3;                 // meters ahead of the head
        const UP_OFFSET = inXR ? -0.5 : 0;  // XR: sit slightly down; desktop: centered
        const LEFT_OFFSET = 0;              // centered horizontally

        // Preferred anchor: a world-space point DISTANCE meters directly in
        // front of the head. getFrontPosition avoids forward-sign mistakes.
        let pos = null;
        if (typeof headCam.getFrontPosition === "function")
        {
          const front = headCam.getFrontPosition(DISTANCE);
          let up = (typeof headCam.getDirection === "function")
            ? headCam.getDirection(BABYLON.Vector3.Up())
            : BABYLON.Vector3.Up();
          let right = (typeof headCam.getDirection === "function")
            ? headCam.getDirection(BABYLON.Vector3.Right())
            : BABYLON.Vector3.Right();
          if (isFiniteVec(front) && isFiniteVec(up) && isFiniteVec(right))
          {
            pos = front.add(up.scale(UP_OFFSET)).add(right.scale(-LEFT_OFFSET));
          }
        }
        else if (typeof headCam.getDirection === "function" && isFiniteVec(headPos))
        {
          // Fallback: build the anchor from head position + forward*DISTANCE and
          // the up/right offset, all via getDirection.
          const forward = headCam.getDirection(BABYLON.Vector3.Forward());
          const up = headCam.getDirection(BABYLON.Vector3.Up());
          const right = headCam.getDirection(BABYLON.Vector3.Right());
          if (isFiniteVec(forward) && isFiniteVec(up) && isFiniteVec(right))
          {
            pos = headPos
              .add(forward.scale(DISTANCE))
              .add(up.scale(UP_OFFSET))
              .add(right.scale(-LEFT_OFFSET));
          }
        }

        // No usable / finite pose: do NOT move the plane this frame (leave it at
        // its last good position, never fling to NaN), but still update text.
        if (pos != null && isFiniteVec(pos))
        {
          dbgPlane.position.copyFrom(pos);
          // Orient to FACE the head each frame (only toward a finite head pose).
          if (isFiniteVec(headPos) && typeof dbgPlane.lookAt === "function")
          {
            dbgPlane.lookAt(headPos);
          }
        }

        // (e) TEXT: updated every frame regardless of XR. XR-only fields read
        // "n/a" on the desktop where there is no XR camera.
        // Derived head offset: rendered eye minus rig base (XR only).
        let eyeBase = null;
        if (inXR && isFiniteVec(xrCam.globalPosition) && isFiniteVec(xrCam.position))
        {
          eyeBase = xrCam.globalPosition.subtract(xrCam.position);
        }

        const avatar = (player && player.position) ? player.position : arcRotateCamera.target;
        const rigCount = (rig && rig.length) ? rig.length : 0;

        const fieldText =
          "mode: " + (inXR ? "XR" : "desktop") + "\n" +
          "arc.pos    = " + v(arcRotateCamera.position) + "\n" +
          "arc.tgt    = " + v(arcRotateCamera.target) + "\n" +
          "arc.radius = " + f(arcRotateCamera.radius) + "\n" +
          "xr.pos     = " + (inXR ? v(xrCam.position) : "n/a") + "\n" +
          "xr.global  = " + (inXR ? v(xrCam.globalPosition) : "n/a") + "\n" +
          "eye-base   = " + (inXR ? v(eyeBase) : "n/a") + "\n" +
          "avatar     = " + v(avatar) + "\n" +
          "head.pos   = " + v(headPos) + "\n" +
          "rig        = " + rigCount;

        // In-scene panel text.
        dbgText.text = fieldText;

        // ALSO mirror the same live values to the DESKTOP monitor every frame so
        // they're readable even if the in-scene plane is invisible. Prefixed so
        // the milestone context is clear on the desktop box. Guarded via dbgMirror.
        dbgMirror("panel: " + (inXR ? "in XR" : "desktop") + " (live)\n" + fieldText);
      }
      catch (frameErr)
      {
        // Never let a per-frame error escape into the render loop.
        console.warn("[XR debug] per-frame update failed.", frameErr);
      }
    });
  }
  catch (err)
  {
    console.warn("[XR debug] setup failed; debug panel skipped (rendering unaffected).", err);
    return;
  }
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
  cc.setCameraElasticity(false); // TEMP DIAGNOSTIC: testing whether camera elastic/springback causes the first-person dolly-out pause. Revert to true afterward.
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
