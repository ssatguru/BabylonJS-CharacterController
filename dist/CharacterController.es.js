import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Bones_skeleton_a9849001__ from "@babylonjs/core/Bones/skeleton";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Cameras_arcRotateCamera_0781b36c__ from "@babylonjs/core/Cameras/arcRotateCamera";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Maths_math_vector_1ba8de41__ from "@babylonjs/core/Maths/math.vector";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_mesh_ba75fcb2__ from "@babylonjs/core/Meshes/mesh";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_node_e4fda84d__ from "@babylonjs/core/node";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_scene_d99a7a29__ from "@babylonjs/core/scene";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Culling_ray_3eadb030__ from "@babylonjs/core/Culling/ray";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Collisions_pickingInfo_361ed131__ from "@babylonjs/core/Collisions/pickingInfo";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Animations_animationGroup_034e4036__ from "@babylonjs/core/Animations/animationGroup";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_transformNode_3e1c6b2b__ from "@babylonjs/core/Meshes/transformNode";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_abstractMesh_f1121356__ from "@babylonjs/core/Meshes/abstractMesh";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Actions_directActions_1ad6426a__ from "@babylonjs/core/Actions/directActions";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_instancedMesh_88581260__ from "@babylonjs/core/Meshes/instancedMesh";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Audio_sound_4f9e4ba7__ from "@babylonjs/core/Audio/sound";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Animations_animationRange_54bf21b2__ from "@babylonjs/core/Animations/animationRange";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Animations_animatable_b5aa3fc3__ from "@babylonjs/core/Animations/animatable";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Animations_animationEvent_a00f62ce__ from "@babylonjs/core/Animations/animationEvent";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_linesMesh_7d898ddc__ from "@babylonjs/core/Meshes/linesMesh";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_meshBuilder_ab461561__ from "@babylonjs/core/Meshes/meshBuilder";
import * as __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Maths_math_color_5b180e7c__ from "@babylonjs/core/Maths/math.color";
/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Yf": () => (/* binding */ ActionData),
  "Cn": () => (/* binding */ ActionMap),
  "eX": () => (/* binding */ Actions),
  "ni": () => (/* binding */ CCSettings),
  "BM": () => (/* binding */ CharacterController)
});

;// CONCATENATED MODULE: external "@babylonjs/core/Bones/skeleton"
var x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var y = x => () => x
const skeleton_namespaceObject = x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Cameras/arcRotateCamera"
var arcRotateCamera_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var arcRotateCamera_y = x => () => x
const arcRotateCamera_namespaceObject = arcRotateCamera_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Maths/math.vector"
var math_vector_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var math_vector_y = x => () => x
const math_vector_namespaceObject = math_vector_x({ ["Quaternion"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Maths_math_vector_1ba8de41__.Quaternion, ["Vector3"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Maths_math_vector_1ba8de41__.Vector3 });
;// CONCATENATED MODULE: external "@babylonjs/core/Meshes/mesh"
var mesh_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var mesh_y = x => () => x
const mesh_namespaceObject = mesh_x({ ["Mesh"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_mesh_ba75fcb2__.Mesh });
;// CONCATENATED MODULE: external "@babylonjs/core/node"
var node_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var node_y = x => () => x
const node_namespaceObject = node_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/scene"
var scene_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var scene_y = x => () => x
const scene_namespaceObject = scene_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Culling/ray"
var ray_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var ray_y = x => () => x
const ray_namespaceObject = ray_x({ ["Ray"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Culling_ray_3eadb030__.Ray });
;// CONCATENATED MODULE: external "@babylonjs/core/Collisions/pickingInfo"
var pickingInfo_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var pickingInfo_y = x => () => x
const pickingInfo_namespaceObject = pickingInfo_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Animations/animationGroup"
var animationGroup_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var animationGroup_y = x => () => x
const animationGroup_namespaceObject = animationGroup_x({ ["AnimationGroup"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Animations_animationGroup_034e4036__.AnimationGroup });
;// CONCATENATED MODULE: external "@babylonjs/core/Meshes/transformNode"
var transformNode_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var transformNode_y = x => () => x
const transformNode_namespaceObject = transformNode_x({ ["TransformNode"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_transformNode_3e1c6b2b__.TransformNode });
;// CONCATENATED MODULE: external "@babylonjs/core/Meshes/abstractMesh"
var abstractMesh_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var abstractMesh_y = x => () => x
const abstractMesh_namespaceObject = abstractMesh_x({ ["AbstractMesh"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_abstractMesh_f1121356__.AbstractMesh });
;// CONCATENATED MODULE: external "@babylonjs/core/Actions/directActions"
var directActions_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var directActions_y = x => () => x
const directActions_namespaceObject = directActions_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Meshes/instancedMesh"
var instancedMesh_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var instancedMesh_y = x => () => x
const instancedMesh_namespaceObject = instancedMesh_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Audio/sound"
var sound_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var sound_y = x => () => x
const sound_namespaceObject = sound_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Animations/animationRange"
var animationRange_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var animationRange_y = x => () => x
const animationRange_namespaceObject = animationRange_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Animations/animatable"
var animatable_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var animatable_y = x => () => x
const animatable_namespaceObject = animatable_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Animations/animationEvent"
var animationEvent_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var animationEvent_y = x => () => x
const animationEvent_namespaceObject = animationEvent_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Meshes/linesMesh"
var linesMesh_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var linesMesh_y = x => () => x
const linesMesh_namespaceObject = linesMesh_x({  });
;// CONCATENATED MODULE: external "@babylonjs/core/Meshes/meshBuilder"
var meshBuilder_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var meshBuilder_y = x => () => x
const meshBuilder_namespaceObject = meshBuilder_x({ ["MeshBuilder"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Meshes_meshBuilder_ab461561__.MeshBuilder });
;// CONCATENATED MODULE: external "@babylonjs/core/Maths/math.color"
var math_color_x = y => { var x = {}; __webpack_require__.d(x, y); return x; }
var math_color_y = x => () => x
const math_color_namespaceObject = math_color_x({ ["Color3"]: () => __WEBPACK_EXTERNAL_MODULE__babylonjs_core_Maths_math_color_5b180e7c__.Color3 });
;// CONCATENATED MODULE: ./src/_babylonjs-esm-bridge.js
/**
 * ESM bridge module for the webpack ESM build.
 *
 * This file is used as a resolve alias for "babylonjs" in the ESM webpack config.
 * It re-exports each BabylonJS type from its individual @babylonjs/core sub-path,
 * allowing webpack to generate individual import statements in the ESM output.
 *
 * This file is NOT included in the UMD build or published to npm.
 */





















;// CONCATENATED MODULE: ./src/CharacterController.ts

function horizontalDistance(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}
function directionAngle(source, target, faceForward, isLHS_RHS) {
    var dx = target.x - source.x;
    var dz = target.z - source.z;
    var angle = Math.atan2(dx, dz);
    var effectiveFaceForward = isLHS_RHS ? !faceForward : faceForward;
    if (!effectiveFaceForward) {
        angle += Math.PI;
    }
    while (angle > Math.PI)
        angle -= 2 * Math.PI;
    while (angle < -Math.PI)
        angle += 2 * Math.PI;
    return angle;
}
function shortestArcDelta(current, target) {
    var delta = target - current;
    while (delta > Math.PI)
        delta -= 2 * Math.PI;
    while (delta < -Math.PI)
        delta += 2 * Math.PI;
    return delta;
}
function turnDirection(current, target) {
    var delta = shortestArcDelta(current, target);
    return delta >= 0 ? 'left' : 'right';
}
function isWithinArrival(distance, arrivalDistance) {
    return distance <= arrivalDistance;
}
function isWithinAngularTolerance(delta, tolerance) {
    return Math.abs(delta) <= tolerance;
}
function updateObstructionCount(frameDistance, threshold, currentCount) {
    return frameDistance < threshold ? currentCount + 1 : 0;
}
function clampPositive(value, defaultValue) {
    return value > 0 ? value : defaultValue;
}
var CharacterController = (function () {
    function CharacterController(avatar, camera, scene, actionMap, faceForward) {
        if (faceForward === void 0) { faceForward = false; }
        var _this = this;
        this._avatar = null;
        this._skeleton = null;
        this._gravity = 9.8;
        this._minSlopeLimit = 30;
        this._maxSlopeLimit = 45;
        this._sl1 = Math.PI * this._minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
        this._stepOffset = 0.25;
        this._actionMap = new ActionMap();
        this._cameraElastic = true;
        this._cameraTarget = math_vector_namespaceObject.Vector3.Zero();
        this._noFirstPerson = false;
        this._down = math_vector_namespaceObject.Vector3.DownReadOnly;
        this._mode = 0;
        this._saveMode = 0;
        this._saveSmoothTurnSpeed = 0;
        this._isLHS_RHS = false;
        this._signLHS_RHS = -1;
        this._started = false;
        this._stopAnim = false;
        this._prevActData = null;
        this._avStartPos = math_vector_namespaceObject.Vector3.Zero();
        this._prevPickY = 0;
        this._grounded = false;
        this._freeFallDist = 0;
        this._inFreeFall = false;
        this._wasWalking = false;
        this._wasRunning = false;
        this._jumpStage = 0;
        this._jumpStageTime = 0;
        this._jumpStageDuration = 0;
        this._jumpBuffered = false;
        this._wasIdleJump = false;
        this._moveVector = math_vector_namespaceObject.Vector3.Zero();
        this._soundLoopTime = 700;
        this._sndId = null;
        this._jumpStartPosY = 0;
        this._jumpTime = 0;
        this._movFallTime = 0;
        this._sign = 1;
        this._isTurning = false;
        this._noRot = false;
        this._smoothTurnSpeed = 2 * Math.PI;
        this._smoothTurning = false;
        this._turnInPlace = true;
        this._steps = true;
        this._stepHigh = false;
        this._rayLine = null;
        this._lineOptions = {};
        this._idleFallTime = 0;
        this._groundFrameCount = 0;
        this._groundFrameMax = 10;
        this._savedCameraCollision = true;
        this._inFP = false;
        this._visiblityMap = new Map();
        this._ray = new ray_namespaceObject.Ray(math_vector_namespaceObject.Vector3.Zero(), math_vector_namespaceObject.Vector3.One(), 1);
        this._rayDir = math_vector_namespaceObject.Vector3.Zero();
        this._cameraSkin = 0.5;
        this._pickedMeshes = new Array();
        this._makeInvisible = false;
        this._elasticSteps = 10;
        this._springback = true;
        this._springbackSteps = 50;
        this._originalRadius = null;
        this._expectedRadius = null;
        this._originalAlpha = null;
        this._originalBeta = null;
        this._springbackAngleRestore = true;
        this._expectedAlpha = null;
        this._expectedBeta = null;
        this._angleRestorationActive = false;
        this._move = false;
        this._ekb = true;
        this._isAG = false;
        this._moveToTarget = null;
        this._moveToNode = null;
        this._moveToRun = false;
        this._moveToArrivalDist = 0.5;
        this._moveToObstructionThreshold = 0.001;
        this._moveToObstructionCount = 0;
        this._moveToActive = false;
        this._moveToLastPos = null;
        this._moveToOnComplete = null;
        this._moveToCompleteFired = false;
        this._turnToTarget = null;
        this._turnToNode = null;
        this._turnToAngle = null;
        this._turnToTargetAngle = null;
        this._turnToFast = false;
        this._turnToAngularTolerance = 0.035;
        this._turnToActive = false;
        this._turnToOnComplete = null;
        this._turnToCompleteFired = false;
        this._navRenderer = null;
        this._ellipsoid = null;
        this._hasAnims = false;
        this._hasCam = true;
        this._camera = camera;
        if (this._camera == null) {
            this._hasCam = false;
            this.setMode(1);
        }
        this._scene = scene;
        var success = this.setAvatar(avatar, faceForward);
        if (!success) {
            console.error("unable to set avatar");
        }
        var dataType = null;
        if (actionMap != null) {
            dataType = this.setActionMap(actionMap);
        }
        if (!this._isAG && this._skeleton != null)
            this._checkAnimRanges(this._skeleton);
        if (this._isAG) {
        }
        if (this._hasCam)
            this._savedCameraCollision = this._camera.checkCollisions;
        this._act = new _Action();
        this._renderer = function () { _this._moveAVandCamera(); };
        this._handleKeyUp = function (e) { _this._onKeyUp(e); };
        this._handleKeyDown = function (e) { _this._onKeyDown(e); };
    }
    CharacterController.prototype.getScene = function () {
        return this._scene;
    };
    CharacterController.prototype.setSlopeLimit = function (minSlopeLimit, maxSlopeLimit) {
        this._minSlopeLimit = minSlopeLimit;
        this._maxSlopeLimit = maxSlopeLimit;
        this._sl1 = Math.PI * this._minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
    };
    CharacterController.prototype.setStepOffset = function (stepOffset) {
        this._stepOffset = stepOffset;
    };
    CharacterController.prototype.setWalkSpeed = function (n) {
        this._actionMap.walk.speed = n;
    };
    CharacterController.prototype.setRunSpeed = function (n) {
        this._actionMap.run.speed = n;
    };
    CharacterController.prototype.setBackSpeed = function (n) {
        this._actionMap.walkBack.speed = n;
    };
    CharacterController.prototype.setBackFastSpeed = function (n) {
        this._actionMap.walkBackFast.speed = n;
    };
    CharacterController.prototype.setJumpSpeed = function (n) {
        this._actionMap.idleJump.speed = n;
        this._actionMap.runJump.speed = n;
    };
    CharacterController.prototype.setLeftSpeed = function (n) {
        this._actionMap.strafeLeft.speed = n;
    };
    CharacterController.prototype.setLeftFastSpeed = function (n) {
        this._actionMap.strafeLeftFast.speed = n;
    };
    CharacterController.prototype.setRightSpeed = function (n) {
        this._actionMap.strafeRight.speed = n;
    };
    CharacterController.prototype.setRightFastSpeed = function (n) {
        this._actionMap.strafeLeftFast.speed = n;
    };
    CharacterController.prototype.setTurnSpeed = function (n) {
        this._actionMap.turnLeft.speed = n * Math.PI / 180;
        this._actionMap.turnRight.speed = n * Math.PI / 180;
    };
    CharacterController.prototype.setTurnFastSpeed = function (n) {
        this._actionMap.turnLeftFast.speed = n * Math.PI / 180;
        this._actionMap.turnRightFast.speed = n * Math.PI / 180;
    };
    CharacterController.prototype.setSmoothTurnSpeed = function (speed) {
        if (!isFinite(speed) || speed < 0)
            return;
        this._smoothTurnSpeed = speed * Math.PI / 180;
    };
    CharacterController.prototype.getSmoothTurnSpeed = function () {
        return this._smoothTurnSpeed * 180 / Math.PI;
    };
    CharacterController.prototype.setTurnInPlace = function (b) {
        this._turnInPlace = b;
    };
    CharacterController.prototype.isTurnInPlace = function () {
        return this._turnInPlace;
    };
    CharacterController.prototype.setGravity = function (n) {
        this._gravity = n;
    };
    CharacterController.prototype.setAnimationGroups = function (agMap) {
        if (this._prevActData != null && this._prevActData.exist)
            this._prevActData.ag.stop();
        this._isAG = true;
        this.setActionMap(agMap);
    };
    CharacterController.prototype.setAnimationRanges = function (arMap) {
        this._isAG = false;
        this.setActionMap(arMap);
    };
    CharacterController.prototype.setActionMap = function (inActMap) {
        var agMap = false;
        var inActData;
        var ccActionNames = Object.keys(this._actionMap);
        for (var _i = 0, ccActionNames_1 = ccActionNames; _i < ccActionNames_1.length; _i++) {
            var ccActionName = ccActionNames_1[_i];
            var ccActData = this._actionMap[ccActionName];
            if (!(ccActData instanceof ActionData))
                continue;
            ccActData.exist = false;
            inActData = inActMap[ccActData.id];
            if (inActData != null) {
                if (inActData instanceof animationGroup_namespaceObject.AnimationGroup) {
                    ccActData.ag = inActData;
                    ccActData.name = ccActData.ag.name;
                    ccActData.exist = true;
                    agMap = true;
                    this._hasAnims = true;
                }
                else if (inActData.exist) {
                    this._hasAnims = true;
                    ccActData.exist = true;
                    if (inActData instanceof Object) {
                        if (inActData.ag) {
                            ccActData.ag = inActData.ag;
                            agMap = true;
                        }
                        if (inActData.name) {
                            ccActData.name = inActData.name;
                        }
                        if (inActData.loop != null)
                            ccActData.loop = inActData.loop;
                        if (inActData.rate)
                            ccActData.rate = inActData.rate;
                        if (inActData.speed)
                            ccActData.speed = inActData.speed;
                        if (inActData.key)
                            ccActData.key = inActData.key;
                        if (inActData.sound)
                            ccActData.sound = inActData.sound;
                    }
                    else {
                        ccActData.name = inActData;
                    }
                }
            }
        }
        this._checkFastAnims();
        this._prevActData = null;
        if (agMap)
            return "ag";
        else
            return "ar";
    };
    CharacterController.prototype.getActionMap = function () {
        var map = new ActionMap();
        var keys = Object.keys(this._actionMap);
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            var actDataI = this._actionMap[key];
            if (!(actDataI instanceof ActionData))
                continue;
            if (!actDataI.exist)
                continue;
            var actDataO = map[actDataI.id];
            actDataO.ag = actDataI.ag;
            actDataO.name = actDataI.name;
            actDataO.loop = actDataI.loop;
            actDataO.rate = actDataI.rate;
            actDataO.speed = actDataI.speed;
            actDataO.key = actDataI.key;
            actDataO.sound = actDataI.sound;
            actDataO.exist = actDataI.exist;
        }
        return map;
    };
    CharacterController.prototype.getSettings = function () {
        var ccs = new CCSettings();
        ccs.faceForward = this.isFaceForward();
        ccs.topDown = this.getMode() == 1 ? true : false;
        ccs.turningOff = this.isTurningOff();
        ccs.cameraTarget = this._cameraTarget.clone();
        ccs.cameraElastic = this._cameraElastic;
        ccs.elasticSteps = this._elasticSteps;
        ccs.makeInvisble = this._makeInvisible;
        ccs.gravity = this._gravity;
        ccs.keyboard = this._ekb;
        ccs.maxSlopeLimit = this._maxSlopeLimit;
        ccs.minSlopeLimit = this._minSlopeLimit;
        ccs.noFirstPerson = this._noFirstPerson;
        ccs.stepOffset = this._stepOffset;
        ccs.sound = this._stepSound;
        ccs.animBlend = this._animBlend;
        ccs.ellipsoid = this._avatar.ellipsoid;
        ccs.ellipsoidOffset = this._avatar.ellipsoidOffset;
        ccs.smoothTurnSpeed = this.getSmoothTurnSpeed();
        ccs.turnInPlace = this._turnInPlace;
        ccs.springback = this._springback;
        ccs.springbackSteps = Math.floor(Math.min(1000, Math.max(1, this._springbackSteps)));
        ccs.springbackAngleRestore = this._springbackAngleRestore;
        return ccs;
    };
    CharacterController.prototype.setSettings = function (ccs) {
        this.setFaceForward(ccs.faceForward);
        this.setMode(ccs.topDown ? 1 : 0);
        this.setTurningOff(ccs.turningOff);
        this.setCameraTarget(ccs.cameraTarget);
        this.setCameraElasticity(ccs.cameraElastic);
        this.setElasticiSteps(ccs.elasticSteps);
        this.makeObstructionInvisible(ccs.makeInvisble);
        this.setGravity(ccs.gravity);
        this.enableKeyBoard(ccs.keyboard);
        this.setSlopeLimit(ccs.minSlopeLimit, ccs.maxSlopeLimit);
        this.setNoFirstPerson(ccs.noFirstPerson);
        this.setStepOffset(ccs.stepOffset);
        this.setSound(ccs.sound);
        this.enableBlending(ccs.animBlend);
        this._avatar.ellipsoid = ccs.ellipsoid;
        this._avatar.ellipsoidOffset = ccs.ellipsoidOffset;
        this.setSmoothTurnSpeed(ccs.smoothTurnSpeed);
        if (ccs.turnInPlace !== undefined) {
            this._turnInPlace = ccs.turnInPlace;
        }
        if (ccs.springback !== undefined) {
            this._springback = ccs.springback;
        }
        if (ccs.springbackSteps !== undefined) {
            this._springbackSteps = Math.floor(Math.min(1000, Math.max(1, ccs.springbackSteps)));
        }
        if (ccs.springbackAngleRestore !== undefined) {
            this.setSpringbackAngleRestore(ccs.springbackAngleRestore);
        }
    };
    CharacterController.prototype._setAnim = function (anim, animName, rate, loop) {
        if (!this._isAG && this._skeleton == null)
            return;
        if (animName != null) {
            if (this._isAG) {
                if (!(animName instanceof animationGroup_namespaceObject.AnimationGroup))
                    return;
                anim.ag = animName;
                anim.exist = true;
            }
            else {
                if (this._skeleton.getAnimationRange(anim.name) != null) {
                    anim.name = animName;
                    anim.exist = true;
                }
                else {
                    anim.exist = false;
                    return;
                }
            }
        }
        if (loop != null)
            anim.loop = loop;
        if (rate != null)
            anim.rate = rate;
        this._hasAnims = true;
    };
    CharacterController.prototype.enableBlending = function (n) {
        if (this._isAG) {
            var keys = Object.keys(this._actionMap);
            for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                var key = keys_2[_i];
                var act = this._actionMap[key];
                if (!(act instanceof ActionData))
                    continue;
                if (act.exist) {
                    var ar = act.ag;
                    this._animBlend = n;
                    for (var _a = 0, _b = ar.targetedAnimations; _a < _b.length; _a++) {
                        var ta = _b[_a];
                        ta.animation.enableBlending = true;
                        ta.animation.blendingSpeed = n;
                    }
                }
            }
        }
        else {
            if (this._skeleton !== null) {
                this._skeleton.enableBlending(n);
                this._animBlend = n;
            }
        }
    };
    CharacterController.prototype.disableBlending = function () {
        if (this._isAG) {
            var keys = Object.keys(this._actionMap);
            for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
                var key = keys_3[_i];
                var anim = this._actionMap[key];
                if (!(anim instanceof ActionData))
                    continue;
                if (anim.exist) {
                    var ar = anim.ag;
                    for (var _a = 0, _b = ar.targetedAnimations; _a < _b.length; _a++) {
                        var ta = _b[_a];
                        ta.animation.enableBlending = false;
                    }
                }
            }
        }
    };
    CharacterController.prototype.setWalkAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.walk, rangeName, rate, loop);
    };
    CharacterController.prototype.setRunAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.run, rangeName, rate, loop);
    };
    CharacterController.prototype.setWalkBackAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.walkBack, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.walkBackFast, this._actionMap.walkBack);
    };
    CharacterController.prototype.setWalkBackFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.walkBackFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setSlideBackAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.slideBack, rangeName, rate, loop);
    };
    CharacterController.prototype.setIdleAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.idle, rangeName, rate, loop);
    };
    CharacterController.prototype.setTurnRightAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.turnRight, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.turnRightFast, this._actionMap.turnRight);
    };
    CharacterController.prototype.setTurnRightFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.turnRightFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setTurnLeftAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.turnLeft, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.turnLeftFast, this._actionMap.turnLeft);
    };
    CharacterController.prototype.setTurnLeftFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.turnLeftFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setStrafeRightAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.strafeRight, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.strafeRightFast, this._actionMap.strafeRight);
    };
    CharacterController.prototype.setStrafeRightFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.strafeRightFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setStrafeLeftAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.strafeLeft, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.strafeLeftFast, this._actionMap.strafeLeft);
    };
    CharacterController.prototype.setStrafeLeftFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.strafeLeftFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setIdleJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.idleJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setRunJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.runJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setPreIdleJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.preIdleJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setPostIdleJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.postIdleJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setPreRunJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.preRunJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setPostRunJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.postRunJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setFallAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actionMap.fall, rangeName, rate, loop);
    };
    CharacterController.prototype.setSound = function (sound) {
        if (sound == null)
            return;
        this._stepSound = sound;
        var ccActionNames = Object.keys(this._actionMap);
        sound.loop = false;
        for (var _i = 0, ccActionNames_2 = ccActionNames; _i < ccActionNames_2.length; _i++) {
            var ccActionName = ccActionNames_2[_i];
            var ccActData = this._actionMap[ccActionName];
            if (!(ccActData instanceof ActionData))
                continue;
            ccActData.sound = sound;
            ccActData.sound.attachToMesh(this._avatar);
        }
        this._actionMap.idle.sound = null;
        this._actionMap.fall.sound = null;
        this._actionMap.slideBack.sound = null;
        this._actionMap.preIdleJump.sound = null;
        this._actionMap.postIdleJump.sound = null;
        this._actionMap.preRunJump.sound = null;
        this._actionMap.postRunJump.sound = null;
        this._actionMap.idleJump.sound = null;
        this._actionMap.runJump.sound = null;
    };
    CharacterController.prototype.setWalkKey = function (key) {
        this._actionMap.walk.key = key.toLowerCase();
    };
    CharacterController.prototype.setWalkBackKey = function (key) {
        this._actionMap.walkBack.key = key.toLowerCase();
    };
    CharacterController.prototype.setTurnLeftKey = function (key) {
        this._actionMap.turnLeft.key = key.toLowerCase();
    };
    CharacterController.prototype.setTurnRightKey = function (key) {
        this._actionMap.turnRight.key = key.toLowerCase();
    };
    CharacterController.prototype.setStrafeLeftKey = function (key) {
        this._actionMap.strafeLeft.key = key.toLowerCase();
    };
    CharacterController.prototype.setStrafeRightKey = function (key) {
        this._actionMap.strafeRight.key = key.toLowerCase();
    };
    CharacterController.prototype.setJumpKey = function (key) {
        this._actionMap.idleJump.key = key.toLowerCase();
    };
    CharacterController.prototype.setCameraElasticity = function (b) {
        this._cameraElastic = b;
        if (!b) {
            this._originalRadius = null;
            this._originalAlpha = null;
            this._originalBeta = null;
            this._expectedAlpha = null;
            this._expectedBeta = null;
            this._angleRestorationActive = false;
        }
    };
    CharacterController.prototype.setElasticiSteps = function (n) {
        this._elasticSteps = n;
    };
    CharacterController.prototype.setCameraElasticSpringback = function (b) {
        this._springback = b;
    };
    CharacterController.prototype.isCameraElasticSpringback = function () {
        return this._springback;
    };
    CharacterController.prototype.setSpringbackSteps = function (n) {
        n = Math.floor(n);
        if (n < 1)
            n = 1;
        if (n > 1000)
            n = 1000;
        this._springbackSteps = n;
    };
    CharacterController.prototype.setSpringbackAngleRestore = function (b) {
        this._springbackAngleRestore = b;
        if (b) {
            if (this._originalAlpha !== null) {
                this._angleRestorationActive = true;
            }
        }
        else {
            this._angleRestorationActive = false;
        }
    };
    CharacterController.prototype.isSpringbackAngleRestore = function () {
        return this._springbackAngleRestore;
    };
    CharacterController.prototype.makeObstructionInvisible = function (b) {
        this._makeInvisible = b;
    };
    CharacterController.prototype.setCameraTarget = function (v) {
        this._cameraTarget.copyFrom(v);
    };
    CharacterController.prototype.cameraCollisionChanged = function () {
        this._savedCameraCollision = this._camera.checkCollisions;
    };
    CharacterController.prototype.setNoFirstPerson = function (b) {
        this._noFirstPerson = b;
    };
    CharacterController.prototype._checkAnimRanges = function (skel) {
        var keys = Object.keys(this._actionMap);
        for (var _i = 0, keys_4 = keys; _i < keys_4.length; _i++) {
            var key = keys_4[_i];
            var anim = this._actionMap[key];
            if (!(anim instanceof ActionData))
                continue;
            if (anim.exist)
                continue;
            if (skel != null) {
                if (skel.getAnimationRange(anim.id) != null) {
                    anim.name = anim.id;
                    anim.exist = true;
                    this._hasAnims = true;
                }
            }
            else {
                anim.exist = false;
            }
        }
        this._checkFastAnims();
    };
    CharacterController.prototype._checkFastAnims = function () {
        this._copySlowAnims(this._actionMap.walkBackFast, this._actionMap.walkBack);
        this._copySlowAnims(this._actionMap.turnRightFast, this._actionMap.turnRight);
        this._copySlowAnims(this._actionMap.turnLeftFast, this._actionMap.turnLeft);
        this._copySlowAnims(this._actionMap.strafeRightFast, this._actionMap.strafeRight);
        this._copySlowAnims(this._actionMap.strafeLeftFast, this._actionMap.strafeLeft);
    };
    CharacterController.prototype._copySlowAnims = function (f, s) {
        if (f.exist)
            return;
        if (!s.exist)
            return;
        f.exist = true;
        f.ag = s.ag;
        f.name = s.name;
        f.rate = s.rate * 2;
    };
    CharacterController.prototype.setMode = function (n) {
        if (this._hasCam) {
            this._mode = n;
            this._saveMode = n;
        }
        else {
            this._mode = 1;
            this._saveMode = 1;
        }
    };
    CharacterController.prototype.getMode = function () {
        return this._mode;
    };
    CharacterController.prototype.setTurningOff = function (b) {
        this._noRot = b;
    };
    CharacterController.prototype.isTurningOff = function () {
        return this._noRot;
    };
    CharacterController.prototype._getAvatarRotationY = function () {
        if (this._avatar.rotationQuaternion) {
            return this._avatar.rotationQuaternion.toEulerAngles().y;
        }
        return this._avatar.rotation.y;
    };
    CharacterController.prototype._setAvatarRotationY = function (angle) {
        if (this._avatar.rotationQuaternion) {
            var euler = this._avatar.rotationQuaternion.toEulerAngles();
            euler.y = angle;
            this._avatar.rotationQuaternion = math_vector_namespaceObject.Quaternion.RotationYawPitchRoll(euler.y, euler.x, euler.z);
        }
        else {
            this._avatar.rotation.y = angle;
        }
    };
    CharacterController.prototype._addToAvatarRotationY = function (angle) {
        if (this._avatar.rotationQuaternion) {
            var euler = this._avatar.rotationQuaternion.toEulerAngles();
            euler.y += angle;
            this._avatar.rotationQuaternion = math_vector_namespaceObject.Quaternion.RotationYawPitchRoll(euler.y, euler.x, euler.z);
        }
        else {
            this._avatar.rotation.y += angle;
        }
    };
    CharacterController.prototype._setRHS = function (mesh) {
        var meshMatrix = mesh.getWorldMatrix();
        var _localX = math_vector_namespaceObject.Vector3.FromArray(meshMatrix.m, 0);
        var _localY = math_vector_namespaceObject.Vector3.FromArray(meshMatrix.m, 4);
        var _localZ = math_vector_namespaceObject.Vector3.FromArray(meshMatrix.m, 8);
        var actualZ = math_vector_namespaceObject.Vector3.Cross(_localX, _localY);
        if (math_vector_namespaceObject.Vector3.Dot(actualZ, _localZ) < 0) {
            this._isLHS_RHS = true;
            this._signLHS_RHS = 1;
        }
        else {
            this._isLHS_RHS = false;
            this._signLHS_RHS = -1;
        }
    };
    CharacterController.prototype.setFaceForward = function (b) {
        this._ff = b;
        this._rhsSign = this._scene.useRightHandedSystem ? -1 : 1;
        if (this._isLHS_RHS) {
            this._av2cam = b ? Math.PI / 2 : 3 * Math.PI / 2;
            this._ffSign = b ? 1 : -1;
        }
        else {
            this._av2cam = b ? 3 * Math.PI / 2 : Math.PI / 2;
            this._ffSign = b ? -1 : 1;
        }
        if (!this._hasCam) {
            this._av2cam = 0;
            return;
        }
    };
    CharacterController.prototype.isFaceForward = function () {
        return this._ff;
    };
    CharacterController.prototype.checkAGs = function (agMap) {
        var keys = Object.keys(this._actionMap);
        for (var _i = 0, keys_5 = keys; _i < keys_5.length; _i++) {
            var key = keys_5[_i];
            var anim = this._actionMap[key];
            if (!(anim instanceof ActionData))
                continue;
            if (anim.exist)
                continue;
            if (agMap[anim.name] != null) {
                anim.ag = agMap[anim.name];
                anim.exist = true;
            }
        }
    };
    CharacterController.prototype._containsAG = function (node, ags, fromRoot) {
        var r;
        var ns;
        if (fromRoot) {
            r = this._getRoot(node);
            ns = r.getChildren(function (n) { return (n instanceof transformNode_namespaceObject.TransformNode); }, false);
        }
        else {
            r = node;
            ns = [r];
        }
        for (var _i = 0, ags_1 = ags; _i < ags_1.length; _i++) {
            var ag = ags_1[_i];
            var tas = ag.targetedAnimations;
            for (var _a = 0, tas_1 = tas; _a < tas_1.length; _a++) {
                var ta = tas_1[_a];
                if (ns.indexOf(ta.target) > -1) {
                    return true;
                }
            }
        }
        return false;
    };
    CharacterController.prototype._getRoot = function (tn) {
        if (tn.parent == null)
            return tn;
        return this._getRoot(tn.parent);
    };
    CharacterController.prototype.start = function () {
        if (this._started)
            return;
        this._started = true;
        this._act.reset();
        this._movFallTime = 0;
        this._idleFallTime = 0.001;
        this._grounded = false;
        this._updateTargetValue();
        if (this._ekb)
            this._addkeylistener();
        this._scene.registerBeforeRender(this._renderer);
    };
    CharacterController.prototype.stop = function () {
        if (!this._started)
            return;
        this._started = false;
        this._scene.unregisterBeforeRender(this._renderer);
        this._removekeylistener();
        this._prevActData = null;
    };
    CharacterController.prototype.pauseAnim = function () {
        this._stopAnim = true;
        if (this._prevActData != null && this._prevActData.exist) {
            if (this._isAG) {
                this._prevActData.ag.stop();
            }
            else {
                this._scene.stopAnimation(this._skeleton);
            }
            if (this._prevActData.sound != null) {
                this._prevActData.sound.stop();
            }
            clearInterval(this._sndId);
            this._scene.unregisterBeforeRender(this._renderer);
        }
    };
    CharacterController.prototype.resumeAnim = function () {
        this._stopAnim = false;
        this._prevActData = null;
        this._scene.registerBeforeRender(this._renderer);
    };
    CharacterController.prototype._isAvFacingCamera = function () {
        if (!this._hasCam)
            return -1;
        if (math_vector_namespaceObject.Vector3.Dot(this._avatar.forward, this._avatar.position.subtract(this._camera.position)) < 0)
            return 1;
        else
            return -1;
    };
    CharacterController.prototype._moveAVandCamera = function () {
        this._avStartPos.copyFrom(this._avatar.position);
        var actData = null;
        var dt = this._scene.getEngine().getDeltaTime() / 1000;
        if (this._act._jump && !this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            actData = this._doJump(dt);
        }
        else if (this.anyMovement() || this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            actData = this._doMove(dt);
        }
        else if (!this._inFreeFall) {
            actData = this._doIdle(dt);
        }
        if (!this._stopAnim && this._hasAnims && actData != null) {
            if (this._prevActData !== actData) {
                if (actData.exist) {
                    var c = void 0;
                    var fps = 30;
                    if (this._isAG) {
                        if (this._prevActData != null && this._prevActData.exist)
                            this._prevActData.ag.stop();
                        actData.ag.start(actData.loop, actData.rate);
                        fps = actData.ag.targetedAnimations[0].animation.framePerSecond;
                        c = (actData.ag.to - actData.ag.from);
                    }
                    else {
                        var a = this._skeleton.beginAnimation(actData.name, actData.loop, actData.rate);
                        fps = a.getAnimations()[0].animation.framePerSecond;
                        c = this._skeleton.getAnimationRange(actData.name).to - this._skeleton.getAnimationRange(actData.name).from;
                    }
                    if (this._prevActData != null && this._prevActData.sound != null) {
                        this._prevActData.sound.stop();
                    }
                    clearInterval(this._sndId);
                    if (actData.sound != null) {
                        actData.sound.play();
                        this._sndId = setInterval(function () { actData.sound.play(); }, c * 1000 / (fps * Math.abs(actData.rate) * 2));
                    }
                }
                this._prevActData = actData;
            }
        }
        this._updateTargetValue();
        return;
    };
    CharacterController.prototype._doJump = function (dt) {
        switch (this._jumpStage) {
            case 0:
                return this._beginJump(dt);
            case 1:
                return this._doPreJump(dt);
            case 2:
                return this._doJumpAirborne(dt);
            case 3:
                return this._doPostJump(dt);
        }
    };
    CharacterController.prototype._doJumpAirborne = function (dt) {
        var actData = null;
        actData = this._actionMap.runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
            if (this._stepSound != null) {
                this._stepSound.play();
            }
        }
        this._jumpTime = this._jumpTime + dt;
        var forwardDist = 0;
        var jumpDist = 0;
        var disp;
        if (this._wasRunning || this._wasWalking) {
            if (this._wasRunning) {
                forwardDist = this._actionMap.run.speed * dt;
            }
            else if (this._wasWalking) {
                forwardDist = this._actionMap.walk.speed * dt;
            }
            disp = this._moveVector.clone();
            disp.y = 0;
            disp = disp.normalize();
            disp.scaleToRef(forwardDist, disp);
            jumpDist = this._calcJumpDist(this._actionMap.runJump.speed, dt);
            disp.y = jumpDist;
        }
        else {
            jumpDist = this._calcJumpDist(this._actionMap.idleJump.speed, dt);
            disp = new math_vector_namespaceObject.Vector3(0, jumpDist, 0);
            actData = this._actionMap.idleJump;
        }
        this._avatar.moveWithCollisions(disp);
        if (jumpDist < 0) {
            if ((this._avatar.position.y > this._avStartPos.y) || ((this._avatar.position.y === this._avStartPos.y) && (disp.length() > 0.001))) {
                this._endJump();
            }
            else if (this._avatar.position.y < this._jumpStartPosY) {
                var actDisp = this._avatar.position.subtract(this._avStartPos);
                if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                    var _ng = this._isNearGround(actDisp);
                    if (_ng.slope <= this._sl1) {
                        this._endJump();
                    }
                }
                else {
                    actData = this._actionMap.fall;
                }
            }
        }
        return actData;
    };
    CharacterController.prototype._calcJumpDist = function (speed, dt) {
        var js = speed - this._gravity * this._jumpTime;
        var jumpDist = js * dt - 0.5 * this._gravity * dt * dt;
        return jumpDist;
    };
    CharacterController.prototype._getAnimDuration = function (actData) {
        if (actData == null || actData.rate === 0)
            return 0;
        if (this._isAG) {
            var ag = actData.ag;
            if (ag == null)
                return 0;
            if (ag.targetedAnimations == null || ag.targetedAnimations.length === 0)
                return 0;
            var frameCount = ag.to - ag.from;
            var fps = ag.targetedAnimations[0].animation.framePerSecond;
            if (fps === 0)
                return 0;
            return frameCount / (fps * Math.abs(actData.rate));
        }
        else {
            if (this._skeleton == null)
                return 0;
            var range = this._skeleton.getAnimationRange(actData.name);
            if (range == null)
                return 0;
            var frameCount = range.to - range.from;
            var fps = 30;
            return frameCount / (fps * Math.abs(actData.rate));
        }
    };
    CharacterController.prototype._beginJump = function (dt) {
        this._wasIdleJump = !this._wasWalking && !this._wasRunning;
        var preAnim = this._wasIdleJump
            ? this._actionMap.preIdleJump
            : this._actionMap.preRunJump;
        if (preAnim.exist) {
            this._jumpStage = 1;
            this._jumpStageTime = 0;
            this._jumpStageDuration = this._getAnimDuration(preAnim);
            return preAnim;
        }
        else {
            this._jumpStage = 2;
            return this._doJumpAirborne(dt);
        }
    };
    CharacterController.prototype._doPreJump = function (dt) {
        this._jumpStageTime += dt;
        var preAnim = this._wasIdleJump
            ? this._actionMap.preIdleJump
            : this._actionMap.preRunJump;
        if (this._jumpStageTime >= this._jumpStageDuration) {
            this._jumpStage = 2;
            this._jumpStageTime = 0;
            return this._doJumpAirborne(dt);
        }
        return preAnim;
    };
    CharacterController.prototype._doPostJump = function (dt) {
        this._jumpStageTime += dt;
        var postAnim = this._wasIdleJump
            ? this._actionMap.postIdleJump
            : this._actionMap.postRunJump;
        if (this._jumpStageTime >= this._jumpStageDuration) {
            var buffered = this._jumpBuffered;
            this._endJumpFull();
            if (buffered) {
                this._act._jump = true;
            }
            return null;
        }
        return postAnim;
    };
    CharacterController.prototype._endJumpFull = function () {
        this._act._jump = false;
        this._jumpStage = 0;
        this._jumpStageTime = 0;
        this._jumpStageDuration = 0;
        this._jumpTime = 0;
        this._wasWalking = false;
        this._wasRunning = false;
        this._wasIdleJump = false;
        this._jumpBuffered = false;
    };
    CharacterController.prototype._endJump = function () {
        if (this._stepSound != null) {
            this._stepSound.play();
        }
        var postAnim = this._wasIdleJump
            ? this._actionMap.postIdleJump
            : this._actionMap.postRunJump;
        if (postAnim.exist) {
            this._jumpStage = 3;
            this._jumpStageTime = 0;
            this._jumpStageDuration = this._getAnimDuration(postAnim);
        }
        else {
            this._endJumpFull();
        }
    };
    CharacterController.prototype._areVectorsEqual = function (v1, v2, p) {
        return ((Math.abs(v1.x - v2.x) < p) && (Math.abs(v1.y - v2.y) < p) && (Math.abs(v1.z - v2.z) < p));
    };
    CharacterController.prototype._verticalSlope = function (v) {
        return Math.atan(Math.abs(v.y / Math.sqrt(v.x * v.x + v.z * v.z)));
    };
    CharacterController.prototype._doMove = function (dt) {
        var u = this._gravity * this._movFallTime;
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;
        this._movFallTime = this._movFallTime + dt;
        var moving = false;
        var actdata = null;
        this._moveVector.x = 0;
        this._moveVector.y = 0;
        this._moveVector.z = 0;
        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        }
        this._rotateAV2C();
        actdata = this._rotateAVnC(actdata, moving, dt);
        if (!this._inFreeFall) {
            this._wasWalking = false;
            this._wasRunning = false;
            var sign = void 0;
            var horizDist = 0;
            switch (true) {
                case (this._act._stepLeft):
                    sign = this._signLHS_RHS * this._isAvFacingCamera();
                    horizDist = this._actionMap.strafeLeft.speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.strafeLeftFast.speed * dt;
                        actdata = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeftFast : this._actionMap.strafeRightFast;
                    }
                    else {
                        actdata = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeft : this._actionMap.strafeRight;
                    }
                    this._moveVector = this._avatar.calcMovePOV(sign * horizDist, -this._freeFallDist, 0);
                    moving = true;
                    break;
                case (this._act._stepRight):
                    sign = -this._signLHS_RHS * this._isAvFacingCamera();
                    horizDist = this._actionMap.strafeRight.speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.strafeRightFast.speed * dt;
                        actdata = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeftFast : this._actionMap.strafeRightFast;
                    }
                    else {
                        actdata = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeft : this._actionMap.strafeRight;
                    }
                    this._moveVector = this._avatar.calcMovePOV(sign * horizDist, -this._freeFallDist, 0);
                    moving = true;
                    break;
                case (this._act._walk || (this._noRot && this._mode == 0)):
                    if (this._act._speedMod) {
                        this._wasRunning = true;
                        horizDist = this._actionMap.run.speed * dt;
                        actdata = this._actionMap.run;
                    }
                    else {
                        this._wasWalking = true;
                        horizDist = this._actionMap.walk.speed * dt;
                        actdata = this._actionMap.walk;
                    }
                    if (this._turnInPlace && this._smoothTurning)
                        horizDist = 0;
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, this._ffSign * horizDist);
                    moving = true;
                    break;
                case (this._act._walkback):
                    horizDist = this._actionMap.walkBack.speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.walkBackFast.speed * dt;
                        actdata = this._actionMap.walkBackFast;
                    }
                    else {
                        actdata = this._actionMap.walkBack;
                    }
                    if (this._turnInPlace && this._smoothTurning)
                        horizDist = 0;
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._ffSign * horizDist);
                    moving = true;
                    break;
            }
        }
        if (moving) {
            if (this._moveVector.length() > 0.001) {
                this._avatar.moveWithCollisions(this._moveVector);
                var actDisp = this._avatar.position.subtract(this._avStartPos);
                var _ng = this._isNearGround(actDisp);
                if (this._avatar.position.y - this._avStartPos.y > 0.01) {
                    if (_ng.hit && _ng.slope == 0) {
                        if (this._stepOffset > 0) {
                            var stepHeight = _ng.y - this._avStartPos.y;
                            if (stepHeight > this._stepOffset) {
                                this._stepHigh = true;
                            }
                            else {
                                this._stepHigh = false;
                            }
                            if (this._stepHigh) {
                                this._avatar.position.copyFrom(this._avStartPos);
                            }
                            else {
                                this._avatar.position.y = _ng.y;
                                this._movFallTime = 0;
                            }
                        }
                    }
                    else {
                        var _slp = _ng.slope;
                        if (_slp >= this._sl2 && _ng.y > this._prevPickY) {
                            this._avatar.position.copyFrom(this._avStartPos);
                            this._endFreeFall();
                            this._prevPickY = 0;
                        }
                        else {
                            this._prevPickY = _ng.y;
                            if (_slp > this._sl1) {
                                this._inFreeFall = false;
                            }
                            else {
                                this._endFreeFall();
                            }
                        }
                    }
                }
                else if (this._avatar.position.y < this._avStartPos.y) {
                    var actDisp_1 = this._avatar.position.subtract(this._avStartPos);
                    if (this._areVectorsEqual(actDisp_1, this._moveVector, 0.001) && !_ng.hit) {
                        this._inFreeFall = true;
                        actdata = this._actionMap.fall;
                    }
                    else {
                        if (_ng.slope <= this._sl1) {
                            this._inFreeFall = false;
                        }
                        else {
                            this._inFreeFall = false;
                        }
                    }
                }
                else {
                    this._inFreeFall = false;
                }
            }
        }
        return actdata;
    };
    CharacterController.prototype._isNearGround = function (actDisp) {
        var _this = this;
        var upDist = this._avatar.position.y - this._avStartPos.y;
        var up = true;
        if (Math.abs(upDist) < 0.006) {
            up = true;
        }
        else {
            up = (upDist > 0.01) ? true : false;
        }
        var fwd;
        actDisp.y = 0;
        if (actDisp.x == 0 && actDisp.z == 0) {
            fwd = true;
        }
        else {
            var cosTheta = math_vector_namespaceObject.Vector3.Dot(this._avatar.forward, actDisp.normalize());
            fwd = (cosTheta >= 0) ? true : false;
        }
        var fact = (up && fwd) || (!up && !fwd) ? 1 : -1;
        this._avatar.forward.scaleToRef(this._avatar.ellipsoid.x * fact, this._ray.origin);
        this._ray.origin.addToRef(this._avatar.position, this._ray.origin);
        this._ray.origin.addToRef(this._avatar.ellipsoidOffset, this._ray.origin);
        this._ray.length = this._avatar.ellipsoid.y * 2;
        this._ray.direction = this._down;
        if (this._ellipsoid != null) {
            this._drawLines(this._ray.origin, this._ray.origin.add(new math_vector_namespaceObject.Vector3(0, -this._ray.length, 0)));
        }
        var pi = this._scene.pickWithRay(this._ray, function (mesh) {
            if (_this._avChildren.includes(mesh))
                return false;
            if (mesh.checkCollisions)
                return true;
            return false;
        });
        if (pi != null && pi.hit) {
            var n = pi.getNormal(true, true);
            var slope = Math.PI / 2 - Math.asin(Math.abs(n.y));
            return { "name": pi.pickedMesh.name, "ground": true, "slope": slope, "y": pi.pickedPoint.y, "hit": true };
        }
        else
            return { "name": "", "ground": false, "slope": 0, "y": 0, "hit": false };
    };
    CharacterController.prototype._isNearGround_old = function () {
        var _this = this;
        this._avatar.position.addToRef(this._avatar.ellipsoidOffset, this._ray.origin);
        this._ray.origin.y = this._ray.origin.y - this._avatar.ellipsoid.y;
        this._ray.length = this._avatar.ellipsoid.y / 2;
        this._ray.direction = this._down;
        var pis = this._scene.multiPickWithRay(this._ray, function (mesh) {
            if (mesh == _this._avatar)
                return false;
            if (mesh.checkCollisions)
                return true;
            else
                return false;
        });
        if (pis.length > 0) {
            var pi = pis[0];
            var n = pi.getNormal(true, true);
            var slope = Math.PI / 2 - Math.asin(Math.abs(n.y));
            return { "name": pi.pickedMesh.name, "ground": true, "slope": slope };
        }
        else
            return { "name": "", "ground": false, "slope": 0 };
    };
    CharacterController.prototype._drawLines = function (pt1, pt2) {
        if (this._rayLine == null) {
            var myPoints = [pt1, pt2];
            this._lineOptions = {
                points: myPoints,
                updatable: true
            };
            this._rayLine = meshBuilder_namespaceObject.MeshBuilder.CreateLines("lines", this._lineOptions);
        }
        else {
            this._lineOptions.points[0] = pt1;
            this._lineOptions.points[1] = pt2;
            this._lineOptions.instance = this._rayLine;
            this._rayLine = meshBuilder_namespaceObject.MeshBuilder.CreateLines("lines", this._lineOptions);
        }
    };
    CharacterController.prototype._rotateAV2C = function () {
        if (this._hasCam)
            if (this._mode != 1) {
                var ca = (this._hasCam) ? (this._av2cam - this._camera.alpha) : 0;
                if (this._noRot) {
                    var targetAngle = null;
                    switch (true) {
                        case (this._act._walk && this._act._turnRight):
                            targetAngle = ca + this._rhsSign * Math.PI / 4;
                            break;
                        case (this._act._walk && this._act._turnLeft):
                            targetAngle = ca - this._rhsSign * Math.PI / 4;
                            break;
                        case (this._act._walkback && this._act._turnRight):
                            targetAngle = ca + this._rhsSign * 3 * Math.PI / 4;
                            break;
                        case (this._act._walkback && this._act._turnLeft):
                            targetAngle = ca - this._rhsSign * 3 * Math.PI / 4;
                            break;
                        case (this._act._walk):
                            targetAngle = ca;
                            break;
                        case (this._act._walkback):
                            targetAngle = ca + Math.PI;
                            break;
                        case (this._act._turnRight):
                            targetAngle = ca + this._rhsSign * Math.PI / 2;
                            break;
                        case (this._act._turnLeft):
                            targetAngle = ca - this._rhsSign * Math.PI / 2;
                            break;
                    }
                    if (targetAngle !== null) {
                        var dt = this._scene.getEngine().getDeltaTime() / 1000;
                        var current = this._getAvatarRotationY();
                        var delta = targetAngle - current;
                        while (delta > Math.PI)
                            delta -= 2 * Math.PI;
                        while (delta < -Math.PI)
                            delta += 2 * Math.PI;
                        if (Math.abs(delta) === Math.PI)
                            delta = this._rhsSign * Math.PI;
                        var step = this._smoothTurnSpeed === 0 ? Math.abs(delta) : Math.min(Math.abs(delta), this._smoothTurnSpeed * dt);
                        if (Math.abs(delta) <= step) {
                            this._setAvatarRotationY(targetAngle);
                            this._smoothTurning = false;
                        }
                        else {
                            var sign = delta > 0 ? 1 : -1;
                            this._setAvatarRotationY(current + step * sign);
                            this._smoothTurning = true;
                        }
                    }
                }
                else {
                    if (this._hasCam)
                        this._setAvatarRotationY(ca);
                }
            }
    };
    CharacterController.prototype._rotateAVnC = function (anim, moving, dt) {
        if (!(this._noRot && this._mode == 0) && (!this._act._stepLeft && !this._act._stepRight) && (this._act._turnLeft || this._act._turnRight)) {
            var turnAngle = this._actionMap.turnLeft.speed * dt;
            if (this._act._speedMod) {
                turnAngle = 2 * turnAngle;
            }
            var a = void 0;
            if (this._mode == 1) {
                if (this._turnToActive) {
                    a = this._act._turnLeft ? 1 : -1;
                    if (!moving) {
                        anim = this._act._turnLeft ? this._actionMap.turnRight : this._actionMap.turnLeft;
                    }
                }
                else if (!this._hasCam) {
                    a = -this._rhsSign;
                    if (this._act._turnRight)
                        a = -a;
                    if (!moving) {
                        if (this._rhsSign > 0) {
                            anim = this._act._turnLeft ? this._actionMap.turnLeft : this._actionMap.turnRight;
                        }
                        else {
                            anim = this._act._turnLeft ? this._actionMap.turnRight : this._actionMap.turnLeft;
                        }
                    }
                }
                else {
                    if (!this._isTurning) {
                        this._sign = -this._ffSign * this._isAvFacingCamera();
                        if (this._isLHS_RHS)
                            this._sign = -this._sign;
                        this._isTurning = true;
                    }
                    a = this._sign;
                    if (this._act._turnLeft) {
                        if (this._act._walk) { }
                        else if (this._act._walkback)
                            a = -this._sign;
                        else {
                            anim = (this._sign > 0) ? this._actionMap.turnRight : this._actionMap.turnLeft;
                        }
                    }
                    else {
                        if (this._act._walk)
                            a = -this._sign;
                        else if (this._act._walkback) { }
                        else {
                            a = -this._sign;
                            anim = (this._sign > 0) ? this._actionMap.turnLeft : this._actionMap.turnRight;
                        }
                    }
                }
            }
            else {
                a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback)
                        a = -1;
                    if (!moving)
                        anim = (this._rhsSign > 0) ? this._actionMap.turnLeft : this._actionMap.turnRight;
                }
                else {
                    if (this._act._walk)
                        a = -1;
                    if (!moving) {
                        a = -1;
                        anim = (this._rhsSign > 0) ? this._actionMap.turnRight : this._actionMap.turnLeft;
                    }
                }
                if (this._hasCam)
                    this._camera.alpha = this._camera.alpha + this._rhsSign * turnAngle * a;
            }
            this._addToAvatarRotationY(turnAngle * a);
        }
        return anim;
    };
    CharacterController.prototype._endFreeFall = function () {
        this._movFallTime = 0;
        this._inFreeFall = false;
    };
    CharacterController.prototype._doIdle = function (dt) {
        if (this._grounded) {
            return this._actionMap.idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        var anim = this._actionMap.idle;
        if (dt === 0) {
            this._freeFallDist = 5;
        }
        else {
            var u = this._idleFallTime * this._gravity;
            this._freeFallDist = u * dt + this._gravity * dt * dt / 2;
            this._idleFallTime = this._idleFallTime + dt;
        }
        if (this._freeFallDist < 0.01)
            return anim;
        var disp = new math_vector_namespaceObject.Vector3(0, -this._freeFallDist, 0);
        this._avatar.moveWithCollisions(disp);
        if ((this._avatar.position.y > this._avStartPos.y) || (this._avatar.position.y === this._avStartPos.y)) {
            var actDisp = this._avatar.position.subtract(this._avStartPos);
            var ng = this._isNearGround(actDisp);
            if (ng.slope <= this._sl1) {
                this._groundIt();
                this._avatar.position.copyFrom(this._avStartPos);
            }
            else {
                this._unGroundIt();
                anim = this._actionMap.slideBack;
            }
        }
        else if (this._avatar.position.y < this._avStartPos.y) {
            var actDisp = this._avatar.position.subtract(this._avStartPos);
            if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                var ng = this._isNearGround(actDisp);
                if (ng.slope <= this._sl1) {
                    this._groundIt();
                    this._avatar.position.copyFrom(this._avStartPos);
                }
                else {
                    this._unGroundIt();
                    anim = this._actionMap.slideBack;
                }
            }
            else {
                anim = this._actionMap.fall;
            }
        }
        return anim;
    };
    CharacterController.prototype._groundIt = function () {
        this._groundFrameCount++;
        if (this._groundFrameCount > this._groundFrameMax) {
            this._grounded = true;
            this._idleFallTime = 0;
        }
    };
    CharacterController.prototype._unGroundIt = function () {
        this._grounded = false;
        this._groundFrameCount = 0;
    };
    CharacterController.prototype._updateTargetValue = function () {
        var _this = this;
        if (!this._hasCam)
            return;
        var holdCameraPos = null;
        if (this._originalRadius !== null && this._springback && this._cameraElastic && !this._inFP) {
            holdCameraPos = this._camera.position.clone();
        }
        var fpHoldPos = null;
        if (this._originalRadius !== null && this._springback && this._cameraElastic && this._inFP) {
            fpHoldPos = this._camera.position.clone();
        }
        this._avatar.position.addToRef(this._cameraTarget, this._camera.target);
        if (holdCameraPos !== null) {
            var newDist = math_vector_namespaceObject.Vector3.Distance(holdCameraPos, this._camera.target);
            if (newDist >= this._originalRadius) {
                this._originalRadius = null;
                this._originalAlpha = null;
                this._originalBeta = null;
                this._expectedAlpha = null;
                this._expectedBeta = null;
                this._angleRestorationActive = false;
                this._expectedRadius = this._camera.radius;
            }
            else if (newDist > this._camera.radius) {
                this._camera.position.copyFrom(holdCameraPos);
                this._camera.rebuildAnglesAndRadius();
                if (this._originalAlpha !== null && this._springbackAngleRestore && this._springback) {
                    var alphaDiff = this._originalAlpha - this._camera.alpha;
                    var betaDiff = this._originalBeta - this._camera.beta;
                    if (Math.abs(alphaDiff) <= 0.005 && Math.abs(betaDiff) <= 0.005) {
                        this._camera.alpha = this._originalAlpha;
                        this._camera.beta = this._originalBeta;
                        var restoredDir = new math_vector_namespaceObject.Vector3(Math.sin(this._originalBeta) * Math.sin(this._originalAlpha), Math.cos(this._originalBeta), Math.sin(this._originalBeta) * Math.cos(this._originalAlpha));
                        this._ray.origin = this._camera.target;
                        this._ray.direction = restoredDir;
                        this._ray.length = this._originalRadius;
                        var verifyPis = this._scene.multiPickWithRay(this._ray, function (mesh) {
                            if (_this._avChildren.includes(mesh))
                                return false;
                            return mesh.isPickable;
                        });
                        var _ellipsoid = this._camera.ellipsoid || this._camera.collisionRadius;
                        var ellipsoidRadius = _ellipsoid ? Math.max(_ellipsoid.x, _ellipsoid.z) : 0;
                        var currentDist = math_vector_namespaceObject.Vector3.Distance(this._camera.position, this._camera.target);
                        var pathBlocked = false;
                        for (var i = 0; i < verifyPis.length; i++) {
                            var pm = verifyPis[i].pickedMesh;
                            if (this._isSeeAble(pm) || pm.checkCollisions) {
                                var pickDist = math_vector_namespaceObject.Vector3.Distance(verifyPis[i].pickedPoint, this._camera.target);
                                if ((pickDist - ellipsoidRadius) < this._originalRadius && (pickDist - ellipsoidRadius) > currentDist) {
                                    pathBlocked = true;
                                    break;
                                }
                            }
                        }
                        if (!pathBlocked) {
                            this._angleRestorationActive = false;
                        }
                        else {
                            this._originalAlpha = null;
                            this._originalBeta = null;
                            this._expectedAlpha = null;
                            this._expectedBeta = null;
                            this._angleRestorationActive = false;
                        }
                    }
                    else {
                        this._angleRestorationActive = true;
                        var alphaStep = alphaDiff / this._springbackSteps;
                        var betaStep = betaDiff / this._springbackSteps;
                        this._camera.alpha += alphaStep;
                        this._camera.beta += betaStep;
                    }
                    this._expectedAlpha = this._camera.alpha;
                    this._expectedBeta = this._camera.beta;
                }
                this._expectedRadius = this._camera.radius;
            }
        }
        if (this._camera.radius > this._camera.lowerRadiusLimit) {
            if (this._cameraElastic || this._makeInvisible)
                this._handleObstruction();
        }
        if (this._camera.radius <= this._camera.lowerRadiusLimit) {
            if (!this._noFirstPerson && !this._inFP) {
                this._makeMeshInvisible(this._avatar);
                this._camera.checkCollisions = false;
                this._saveMode = this._mode;
                this._saveSmoothTurnSpeed = this._smoothTurnSpeed;
                this._mode = 0;
                this._smoothTurnSpeed = 0;
                this._inFP = true;
            }
            if (this._inFP && fpHoldPos !== null) {
                var distToTarget = math_vector_namespaceObject.Vector3.Distance(fpHoldPos, this._camera.target);
                if (distToTarget > this._camera.lowerRadiusLimit) {
                    if (distToTarget >= this._originalRadius) {
                        this._originalRadius = null;
                        this._originalAlpha = null;
                        this._originalBeta = null;
                        this._expectedAlpha = null;
                        this._expectedBeta = null;
                        this._angleRestorationActive = false;
                        this._expectedRadius = this._camera.radius;
                    }
                    else {
                        this._camera.position.copyFrom(fpHoldPos);
                        this._camera.rebuildAnglesAndRadius();
                        this._expectedRadius = this._camera.radius;
                    }
                }
            }
        }
        else {
            if (this._inFP) {
                this._inFP = false;
                this._mode = this._saveMode;
                this._smoothTurnSpeed = this._saveSmoothTurnSpeed;
                this._restoreVisiblity(this._avatar);
                this._camera.checkCollisions = this._savedCameraCollision;
                this._expectedRadius = this._camera.radius;
            }
        }
    };
    CharacterController.prototype._makeMeshInvisible = function (mesh) {
        var _this = this;
        this._visiblityMap.set(mesh, mesh.visibility);
        mesh.visibility = 0;
        mesh.getChildMeshes(false, function (n) {
            if (n instanceof mesh_namespaceObject.Mesh) {
                _this._visiblityMap.set(n, n.visibility);
                n.visibility = 0;
            }
            return false;
        });
    };
    CharacterController.prototype._restoreVisiblity = function (mesh) {
        var _this = this;
        mesh.visibility = this._visiblityMap.get(mesh);
        mesh.getChildMeshes(false, function (n) {
            if (n instanceof mesh_namespaceObject.Mesh)
                n.visibility = _this._visiblityMap.get(n);
            return false;
        });
    };
    ;
    CharacterController.prototype._handleObstruction = function () {
        var _this = this;
        var userScrolled = false;
        if (this._expectedRadius !== null) {
            var radiusDelta = this._camera.radius - this._expectedRadius;
            var absDelta = Math.abs(radiusDelta);
            if (radiusDelta < -0.01 && this._originalRadius !== null) {
                userScrolled = true;
                this._originalRadius = null;
                this._originalAlpha = null;
                this._originalBeta = null;
                this._expectedAlpha = null;
                this._expectedBeta = null;
                this._angleRestorationActive = false;
                this._expectedRadius = this._camera.radius;
            }
            else {
                var maxPushInStep = this._camera.radius / this._elasticSteps;
                var remainingToOriginal = this._originalRadius !== null ? Math.abs(this._originalRadius - this._camera.radius) : 0;
                var maxSpringbackStep = remainingToOriginal / this._springbackSteps;
                var maxExpectedStep = Math.max(maxPushInStep, maxSpringbackStep, 0.01);
                if (absDelta > maxExpectedStep) {
                    userScrolled = true;
                    this._originalRadius = null;
                    this._originalAlpha = null;
                    this._originalBeta = null;
                    this._expectedAlpha = null;
                    this._expectedBeta = null;
                    this._angleRestorationActive = false;
                    this._expectedRadius = this._camera.radius;
                }
            }
        }
        this._camera.position.subtractToRef(this._camera.target, this._rayDir);
        this._ray.origin = this._camera.target;
        this._ray.length = this._rayDir.length();
        this._ray.direction = this._rayDir.normalize();
        var pis = this._scene.multiPickWithRay(this._ray, function (mesh) {
            if (_this._avChildren.includes(mesh))
                return false;
            if (mesh.isPickable) {
                return true;
            }
            else {
                return false;
            }
        });
        if (this._makeInvisible) {
            this._prevPickedMeshes = this._pickedMeshes;
            if (pis.length > 0) {
                this._pickedMeshes = new Array();
                for (var _i = 0, pis_1 = pis; _i < pis_1.length; _i++) {
                    var pi = pis_1[_i];
                    if (pi.pickedMesh.isVisible || this._prevPickedMeshes.includes(pi.pickedMesh)) {
                        pi.pickedMesh.isVisible = false;
                        this._pickedMeshes.push(pi.pickedMesh);
                    }
                }
                for (var _a = 0, _b = this._prevPickedMeshes; _a < _b.length; _a++) {
                    var pm = _b[_a];
                    if (!this._pickedMeshes.includes(pm)) {
                        pm.isVisible = true;
                    }
                }
            }
            else {
                for (var _c = 0, _d = this._prevPickedMeshes; _c < _d.length; _c++) {
                    var pm = _d[_c];
                    pm.isVisible = true;
                }
                this._prevPickedMeshes.length = 0;
            }
        }
        if (this._cameraElastic) {
            var _ellipsoid = this._camera.ellipsoid || this._camera.collisionRadius;
            var ellipsoidRadius = _ellipsoid ? Math.max(_ellipsoid.x, _ellipsoid.z) : 0;
            if (pis.length > 0) {
                if ((pis.length == 1 && !this._isSeeAble(pis[0].pickedMesh)) && (!pis[0].pickedMesh.checkCollisions || !this._camera.checkCollisions))
                    return;
                var pp = null;
                for (var i = 0; i < pis.length; i++) {
                    var pm = pis[i].pickedMesh;
                    if (this._isSeeAble(pm)) {
                        pp = pis[i].pickedPoint;
                        break;
                    }
                    else if (pm.checkCollisions) {
                        pp = pis[i].pickedPoint;
                        break;
                    }
                }
                if (pp == null)
                    return;
                if (this._originalRadius === null) {
                    this._originalRadius = this._camera.radius;
                }
                if (this._springbackAngleRestore && this._originalAlpha === null) {
                    this._originalAlpha = this._camera.alpha;
                    this._originalBeta = this._camera.beta;
                }
                if (this._angleRestorationActive) {
                    this._angleRestorationActive = false;
                }
                var c2p = this._camera.position.subtract(pp);
                var l = c2p.length();
                if (l <= Math.max(ellipsoidRadius, 0.1)) {
                }
                else if (this._camera.checkCollisions) {
                    var targetDist = Math.max(l - ellipsoidRadius, 0);
                    var step = c2p.normalize().scaleInPlace(targetDist / this._elasticSteps);
                    this._camera.position = this._camera.position.subtract(step);
                }
                else {
                    var targetDist = Math.max(l - ellipsoidRadius, 0);
                    var step = targetDist / this._elasticSteps;
                    this._camera.radius = this._camera.radius - step;
                }
            }
            else {
                if (this._originalRadius !== null && this._springback) {
                    var remainingDistance = this._originalRadius - this._camera.radius;
                    if (remainingDistance > 0) {
                        var springDir = this._camera.position.subtract(this._camera.target).normalize();
                        this._ray.origin = this._camera.target;
                        this._ray.direction = springDir;
                        this._ray.length = this._originalRadius;
                        var springPis = this._scene.multiPickWithRay(this._ray, function (mesh) {
                            if (_this._avChildren.includes(mesh))
                                return false;
                            return mesh.isPickable;
                        });
                        var springBlocked = false;
                        var currentDist = math_vector_namespaceObject.Vector3.Distance(this._camera.position, this._camera.target);
                        for (var i = 0; i < springPis.length; i++) {
                            var pm = springPis[i].pickedMesh;
                            if (this._isSeeAble(pm) || pm.checkCollisions) {
                                var pickDist = math_vector_namespaceObject.Vector3.Distance(springPis[i].pickedPoint, this._camera.target);
                                if ((pickDist - ellipsoidRadius) > currentDist) {
                                    springBlocked = true;
                                    break;
                                }
                            }
                        }
                        if (!springBlocked) {
                            if (this._expectedAlpha !== null && this._expectedBeta !== null && !this._angleRestorationActive) {
                                var actualAlpha = this._camera.alpha;
                                var actualBeta = this._camera.beta;
                                var alphaDelta = Math.abs(actualAlpha - this._expectedAlpha);
                                var betaDelta = Math.abs(actualBeta - this._expectedBeta);
                                var alphaThreshold = this._originalAlpha !== null
                                    ? Math.max(Math.abs(this._originalAlpha - actualAlpha) / this._springbackSteps, 0.001)
                                    : 0.001;
                                var betaThreshold = this._originalBeta !== null
                                    ? Math.max(Math.abs(this._originalBeta - actualBeta) / this._springbackSteps, 0.001)
                                    : 0.001;
                                if (alphaDelta > alphaThreshold || betaDelta > betaThreshold) {
                                    if (this._originalAlpha !== null) {
                                        this._originalAlpha = this._camera.alpha;
                                        this._originalBeta = this._camera.beta;
                                    }
                                }
                            }
                            if (remainingDistance <= 0.1) {
                                this._originalRadius = null;
                                this._originalAlpha = null;
                                this._originalBeta = null;
                                this._expectedAlpha = null;
                                this._expectedBeta = null;
                                this._angleRestorationActive = false;
                            }
                            else if (this._camera.checkCollisions) {
                                var dir = this._camera.position.subtract(this._camera.target).normalize();
                                var step = remainingDistance / this._springbackSteps;
                                var stepVec = dir.scaleInPlace(step);
                                this._camera.position = this._camera.position.add(stepVec);
                            }
                            else {
                                var step = remainingDistance / this._springbackSteps;
                                this._camera.radius = this._camera.radius + step;
                            }
                            if (this._springbackAngleRestore && this._originalAlpha !== null && this._springback) {
                                var alphaStep = (this._originalAlpha - this._camera.alpha) / this._springbackSteps;
                                var betaStep = (this._originalBeta - this._camera.beta) / this._springbackSteps;
                                if (Math.abs(this._originalAlpha - this._camera.alpha) <= 0.005 && Math.abs(this._originalBeta - this._camera.beta) <= 0.005) {
                                    this._camera.alpha = this._originalAlpha;
                                    this._camera.beta = this._originalBeta;
                                    this._originalAlpha = null;
                                    this._originalBeta = null;
                                    this._angleRestorationActive = false;
                                }
                                else {
                                    this._camera.alpha += alphaStep;
                                    this._camera.beta += betaStep;
                                    this._angleRestorationActive = true;
                                }
                                this._expectedAlpha = this._camera.alpha;
                                this._expectedBeta = this._camera.beta;
                            }
                            if (this._originalRadius !== null && Math.abs(this._camera.radius - this._originalRadius) <= 0.01) {
                                this._originalRadius = null;
                                this._originalAlpha = null;
                                this._originalBeta = null;
                                this._expectedAlpha = null;
                                this._expectedBeta = null;
                                this._angleRestorationActive = false;
                            }
                        }
                    }
                    else {
                        this._originalRadius = null;
                        this._originalAlpha = null;
                        this._originalBeta = null;
                        this._expectedAlpha = null;
                        this._expectedBeta = null;
                        this._angleRestorationActive = false;
                    }
                }
            }
        }
        this._expectedRadius = this._camera.radius;
        if (this._originalAlpha !== null && this._expectedAlpha === null) {
            this._expectedAlpha = this._camera.alpha;
            this._expectedBeta = this._camera.beta;
        }
    };
    CharacterController.prototype._isSeeAble = function (mesh) {
        if (!mesh.isVisible)
            return false;
        if (mesh.visibility == 0)
            return false;
        if (mesh.material != null && mesh.material.alphaMode != 0 && mesh.material.alpha == 0)
            return false;
        return true;
    };
    CharacterController.prototype.anyMovement = function () {
        return (this._act._walk || this._act._walkback || this._act._turnLeft || this._act._turnRight || this._act._stepLeft || this._act._stepRight);
    };
    CharacterController.prototype._onKeyDown = function (e) {
        if (!e.key)
            return;
        if (e.repeat)
            return;
        if (this._ekb) {
            if (this._moveToActive || this._turnToActive) {
                this._cancelMoveTo();
                this._cancelTurnTo();
                this._act.reset();
            }
        }
        switch (e.key.toLowerCase()) {
            case this._actionMap.idleJump.key:
                if (this._jumpStage === 0) {
                    this._act._jump = true;
                }
                else if (this._jumpStage === 3) {
                    this._jumpBuffered = true;
                }
                break;
            case "capslock":
                this._act._speedMod = !this._act._speedMod;
                break;
            case "shift":
                this._act._speedMod = true;
                break;
            case "up":
            case "arrowup":
            case this._actionMap.walk.key:
                if (this._jumpStage === 1 || this._jumpStage === 3)
                    break;
                this._act._walk = true;
                break;
            case "left":
            case "arrowleft":
            case this._actionMap.turnLeft.key:
                if (this._jumpStage === 1 || this._jumpStage === 3)
                    break;
                this._act._turnLeft = true;
                break;
            case "right":
            case "arrowright":
            case this._actionMap.turnRight.key:
                if (this._jumpStage === 1 || this._jumpStage === 3)
                    break;
                this._act._turnRight = true;
                break;
            case "down":
            case "arrowdown":
            case this._actionMap.walkBack.key:
                if (this._jumpStage === 1 || this._jumpStage === 3)
                    break;
                this._act._walkback = true;
                break;
            case this._actionMap.strafeLeft.key:
                if (this._jumpStage === 1 || this._jumpStage === 3)
                    break;
                this._act._stepLeft = true;
                break;
            case this._actionMap.strafeRight.key:
                if (this._jumpStage === 1 || this._jumpStage === 3)
                    break;
                this._act._stepRight = true;
                break;
        }
        this._move = this.anyMovement();
    };
    CharacterController.prototype._onKeyUp = function (e) {
        if (!e.key)
            return;
        switch (e.key.toLowerCase()) {
            case "shift":
                this._act._speedMod = false;
                break;
            case "up":
            case "arrowup":
            case this._actionMap.walk.key:
                this._act._walk = false;
                break;
            case "left":
            case "arrowleft":
            case this._actionMap.turnLeft.key:
                this._act._turnLeft = false;
                this._isTurning = false;
                break;
            case "right":
            case "arrowright":
            case this._actionMap.turnRight.key:
                this._act._turnRight = false;
                this._isTurning = false;
                break;
            case "down":
            case "arrowdown":
            case this._actionMap.walkBack.key:
                this._act._walkback = false;
                break;
            case this._actionMap.strafeLeft.key:
                this._act._stepLeft = false;
                break;
            case this._actionMap.strafeRight.key:
                this._act._stepRight = false;
                break;
        }
        this._move = this.anyMovement();
    };
    CharacterController.prototype.isKeyBoardEnabled = function () {
        return this._ekb;
    };
    CharacterController.prototype.enableKeyBoard = function (b) {
        this._ekb = b;
        if (b) {
            this._addkeylistener();
        }
        else {
            this._removekeylistener();
        }
    };
    CharacterController.prototype._addkeylistener = function () {
        var canvas = this._scene.getEngine().getRenderingCanvas();
        canvas.addEventListener("keyup", this._handleKeyUp, false);
        canvas.addEventListener("keydown", this._handleKeyDown, false);
    };
    CharacterController.prototype._removekeylistener = function () {
        var canvas = this._scene.getEngine().getRenderingCanvas();
        canvas.removeEventListener("keyup", this._handleKeyUp, false);
        canvas.removeEventListener("keydown", this._handleKeyDown, false);
    };
    CharacterController.prototype._cancelMoveTo = function () {
        if (!this._moveToActive)
            return;
        this._moveToTarget = null;
        this._moveToNode = null;
        this._moveToActive = false;
        this._moveToObstructionCount = 0;
        this._moveToLastPos = null;
        this._moveToOnComplete = null;
        this._moveToCompleteFired = false;
        this.setMode(this._moveToSaveMode);
        this._stopNavRenderer();
    };
    CharacterController.prototype._cancelTurnTo = function () {
        if (!this._turnToActive)
            return;
        this._turnToTarget = null;
        this._turnToNode = null;
        this._turnToAngle = null;
        this._turnToTargetAngle = null;
        this._turnToActive = false;
        this._turnToOnComplete = null;
        this._turnToCompleteFired = false;
        this.setMode(this._turnToSaveMode);
        this._stopNavRenderer();
    };
    CharacterController.prototype.walk = function (b) {
        this._act.reset();
        this._act._walk = b;
    };
    CharacterController.prototype.walkBack = function (b) {
        this._act.reset();
        this._act._walkback = b;
    };
    CharacterController.prototype.walkBackFast = function (b) {
        this._act.reset();
        this._act._walkback = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.run = function (b) {
        this._act.reset();
        this._act._walk = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.turnLeft = function (b) {
        this._act.reset();
        this._act._turnLeft = b;
        if (!b)
            this._isTurning = b;
    };
    CharacterController.prototype.turnLeftFast = function (b) {
        this._act.reset();
        this._act._turnLeft = b;
        if (!b)
            this._isTurning = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.turnRight = function (b) {
        this._act.reset();
        this._act._turnRight = b;
        if (!b)
            this._isTurning = b;
    };
    CharacterController.prototype.turnRightFast = function (b) {
        this._act.reset();
        this._act._turnRight = b;
        if (!b)
            this._isTurning = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.strafeLeft = function (b) {
        this._act.reset();
        this._act._stepLeft = b;
    };
    CharacterController.prototype.strafeLeftFast = function (b) {
        this._act.reset();
        this._act._stepLeft = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.strafeRight = function (b) {
        this._act.reset();
        this._act._stepRight = b;
    };
    CharacterController.prototype.strafeRightFast = function (b) {
        this._act.reset();
        this._act._stepRight = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.jump = function () {
        if (this._jumpStage !== 0)
            return;
        if (this._inFreeFall)
            return;
        this._act.reset();
        this._act._jump = true;
    };
    CharacterController.prototype.fall = function () {
        this._act.reset();
        this._grounded = false;
    };
    CharacterController.prototype.idle = function () {
        this._act.reset();
    };
    CharacterController.prototype.turnTo = function (target, options) {
        var _a, _b, _c;
        if (target == null)
            return;
        var fast = (_a = options === null || options === void 0 ? void 0 : options.fast) !== null && _a !== void 0 ? _a : false;
        var angularTolerance = clampPositive((_b = options === null || options === void 0 ? void 0 : options.angularTolerance) !== null && _b !== void 0 ? _b : 0.035, 0.035);
        var onComplete = (_c = options === null || options === void 0 ? void 0 : options.onComplete) !== null && _c !== void 0 ? _c : null;
        this._turnToTarget = null;
        this._turnToNode = null;
        this._turnToAngle = null;
        this._turnToTargetAngle = null;
        this._turnToActive = false;
        if (typeof target === 'number') {
            if (target === 0) {
                this.idle();
                return;
            }
            var currentY = this._getAvatarRotationY();
            this._turnToTargetAngle = currentY + target;
            this._turnToAngle = target;
        }
        else if (target instanceof transformNode_namespaceObject.TransformNode) {
            if (target.isDisposed()) {
                this.idle();
                return;
            }
            this._turnToNode = target;
            var charPos = this._avatar.position;
            var targetPos = target.getAbsolutePosition();
            this._turnToTargetAngle = directionAngle(charPos, targetPos, this.isFaceForward(), this._isLHS_RHS);
        }
        else {
            this._turnToTarget = target;
            var charPos = this._avatar.position;
            this._turnToTargetAngle = directionAngle(charPos, target, this.isFaceForward(), this._isLHS_RHS);
        }
        if (this._turnToTargetAngle != null) {
            var currentY = this._getAvatarRotationY();
            var delta = shortestArcDelta(currentY, this._turnToTargetAngle);
            if (isWithinAngularTolerance(delta, angularTolerance)) {
                this._turnToTargetAngle = null;
                this._turnToTarget = null;
                this._turnToNode = null;
                this._turnToAngle = null;
                return;
            }
        }
        this._turnToFast = fast;
        this._turnToAngularTolerance = angularTolerance;
        this._turnToActive = true;
        this._turnToOnComplete = onComplete;
        this._turnToCompleteFired = false;
        this.moveToStop();
        this._turnToSaveMode = this.getMode();
        this.setMode(1);
        this._startNavRenderer();
    };
    CharacterController.prototype.turnToStop = function () {
        if (!this._turnToActive)
            return;
        this.idle();
        this._turnToTarget = null;
        this._turnToNode = null;
        this._turnToAngle = null;
        this._turnToTargetAngle = null;
        this._turnToActive = false;
        this._turnToOnComplete = null;
        this._turnToCompleteFired = false;
        this.setMode(this._turnToSaveMode);
        this._stopNavRenderer();
    };
    CharacterController.prototype.isAg = function () {
        return this._isAG;
    };
    CharacterController.prototype._startNavRenderer = function () {
        var _this = this;
        if (this._navRenderer != null)
            return;
        this._navRenderer = function () { _this._navUpdate(); };
        this._scene.registerBeforeRender(this._navRenderer);
    };
    CharacterController.prototype._stopNavRenderer = function () {
        if (this._moveToActive || this._turnToActive)
            return;
        if (this._navRenderer == null)
            return;
        this._scene.unregisterBeforeRender(this._navRenderer);
        this._navRenderer = null;
    };
    CharacterController.prototype._navUpdate = function () {
        if (this._moveToActive) {
            this._navUpdateMoveTo();
        }
        if (this._turnToActive) {
            this._navUpdateTurnTo();
        }
    };
    CharacterController.prototype._navUpdateMoveTo = function () {
        if (this._moveToNode != null) {
            if (this._moveToNode.isDisposed()) {
                this.moveToStop();
                return;
            }
            if (!this._moveToTarget.equals(this._moveToNode.getAbsolutePosition())) {
                this._moveToTarget = this._moveToNode.getAbsolutePosition().clone();
            }
        }
        if (this._moveToTarget == null)
            return;
        var charPos = this._avatar.position;
        var dist = horizontalDistance(charPos, this._moveToTarget);
        if (isWithinArrival(dist, this._moveToArrivalDist)) {
            if (this._moveToNode != null) {
                this.idle();
                this._moveToLastPos = null;
                this._moveToObstructionCount = 0;
                if (this._moveToOnComplete && !this._moveToCompleteFired) {
                    this._moveToCompleteFired = true;
                    this._moveToOnComplete();
                }
            }
            else {
                var cb = this._moveToOnComplete;
                this.moveToStop();
                if (cb)
                    cb();
            }
            return;
        }
        this._moveToCompleteFired = false;
        if (!this._turnToActive) {
            var targetAngle = directionAngle(charPos, this._moveToTarget, this.isFaceForward(), this._isLHS_RHS);
            this._setAvatarRotationY(targetAngle);
        }
        if (this._moveToRun) {
            this.run(true);
        }
        else {
            this.walk(true);
        }
        if (this._moveToLastPos != null) {
            var frameDistance = horizontalDistance(this._moveToLastPos, charPos);
            this._moveToObstructionCount = updateObstructionCount(frameDistance, this._moveToObstructionThreshold, this._moveToObstructionCount);
            if (this._moveToObstructionCount >= 3) {
                this.moveToStop();
                return;
            }
        }
        this._moveToLastPos = charPos.clone();
    };
    CharacterController.prototype._navUpdateTurnTo = function () {
        if (this._turnToNode != null) {
            if (this._turnToNode.isDisposed()) {
                this.turnToStop();
                return;
            }
            var charPos = this._avatar.position;
            var nodePos = this._turnToNode.getAbsolutePosition();
            this._turnToTargetAngle = directionAngle(charPos, nodePos, this.isFaceForward(), this._isLHS_RHS);
        }
        else if (this._turnToTarget != null) {
            var charPos = this._avatar.position;
            this._turnToTargetAngle = directionAngle(charPos, this._turnToTarget, this.isFaceForward(), this._isLHS_RHS);
        }
        if (this._turnToTargetAngle == null)
            return;
        var currentY = this._getAvatarRotationY();
        var delta = shortestArcDelta(currentY, this._turnToTargetAngle);
        if (isWithinAngularTolerance(delta, this._turnToAngularTolerance)) {
            if (this._turnToNode != null) {
                this.idle();
                if (this._turnToOnComplete && !this._turnToCompleteFired) {
                    this._turnToCompleteFired = true;
                    this._turnToOnComplete();
                }
            }
            else {
                var cb = this._turnToOnComplete;
                this.turnToStop();
                if (cb)
                    cb();
            }
            return;
        }
        this._turnToCompleteFired = false;
        if (delta > 0) {
            if (this._turnToFast) {
                this.turnLeftFast(true);
            }
            else {
                this.turnLeft(true);
            }
        }
        else {
            if (this._turnToFast) {
                this.turnRightFast(true);
            }
            else {
                this.turnRight(true);
            }
        }
    };
    CharacterController.prototype.moveTo = function (target, options) {
        var _a, _b, _c, _d;
        var run = (_a = options === null || options === void 0 ? void 0 : options.run) !== null && _a !== void 0 ? _a : false;
        var arrivalDist = clampPositive((_b = options === null || options === void 0 ? void 0 : options.arrivalDistance) !== null && _b !== void 0 ? _b : 0.5, 0.5);
        var obstructionThreshold = clampPositive((_c = options === null || options === void 0 ? void 0 : options.obstructionThreshold) !== null && _c !== void 0 ? _c : 0.001, 0.001);
        var onComplete = (_d = options === null || options === void 0 ? void 0 : options.onComplete) !== null && _d !== void 0 ? _d : null;
        var targetPos;
        var targetNode = null;
        if (target instanceof transformNode_namespaceObject.TransformNode) {
            if (target.isDisposed()) {
                this.idle();
                return;
            }
            targetNode = target;
            targetPos = target.getAbsolutePosition().clone();
        }
        else {
            targetPos = target;
        }
        var charPos = this._avatar.position;
        if (isWithinArrival(horizontalDistance(charPos, targetPos), arrivalDist)) {
            this.idle();
            return;
        }
        this._moveToTarget = targetPos;
        this._moveToNode = targetNode;
        this._moveToRun = run;
        this._moveToArrivalDist = arrivalDist;
        this._moveToObstructionThreshold = obstructionThreshold;
        this._moveToObstructionCount = 0;
        this._moveToActive = true;
        this._moveToOnComplete = onComplete;
        this._moveToCompleteFired = false;
        this.turnToStop();
        this._moveToSaveMode = this.getMode();
        this.setMode(1);
        this._startNavRenderer();
    };
    CharacterController.prototype.moveToStop = function () {
        if (!this._moveToActive)
            return;
        this.idle();
        this._moveToTarget = null;
        this._moveToNode = null;
        this._moveToActive = false;
        this._moveToObstructionCount = 0;
        this._moveToLastPos = null;
        this._moveToOnComplete = null;
        this._moveToCompleteFired = false;
        this.setMode(this._moveToSaveMode);
        this._stopNavRenderer();
    };
    CharacterController.prototype._findSkel = function (n) {
        var root = this._root(n);
        if (root instanceof mesh_namespaceObject.Mesh && root.skeleton)
            return root.skeleton;
        var ms = root.getChildMeshes(false, function (cm) {
            if (cm instanceof mesh_namespaceObject.Mesh) {
                if (cm.skeleton) {
                    return true;
                }
            }
            return false;
        });
        if (ms.length > 0)
            return ms[0].skeleton;
        else
            return null;
    };
    CharacterController.prototype._root = function (tn) {
        if (tn.parent == null)
            return tn;
        return this._root(tn.parent);
    };
    CharacterController.prototype._getAbstractMeshChildren = function (tn) {
        var ms = new Array();
        if (tn instanceof abstractMesh_namespaceObject.AbstractMesh)
            ms.push(tn);
        tn.getChildren(function (cm) {
            if (cm instanceof abstractMesh_namespaceObject.AbstractMesh)
                ms.push(cm);
            return false;
        }, false);
        return ms;
    };
    CharacterController.prototype.setAvatar = function (avatar, faceForward) {
        if (faceForward === void 0) { faceForward = false; }
        var rootNode = this._root(avatar);
        if (rootNode instanceof mesh_namespaceObject.Mesh) {
            this._avatar = rootNode;
        }
        else {
            console.error("Cannot move this mesh. The root node of the mesh provided is not a mesh");
            return false;
        }
        this._avChildren = this._getAbstractMeshChildren(rootNode);
        this._skeleton = this._findSkel(avatar);
        this._isAG = this._containsAG(avatar, this._scene.animationGroups, true);
        this._actionMap.reset();
        if (!this._isAG && this._skeleton != null)
            this._checkAnimRanges(this._skeleton);
        this._setRHS(avatar);
        this.setFaceForward(faceForward);
        return true;
    };
    CharacterController.prototype.showEllipsoid = function (show) {
        if (!show) {
            if (this._ellipsoid != null)
                this._ellipsoid.dispose();
            this._ellipsoid = null;
            if (this._rayLine != null) {
                this._rayLine.dispose();
                this._rayLine = null;
            }
            return;
        }
        if (this._ellipsoid !== null)
            return;
        var ellipsoid = new transformNode_namespaceObject.TransformNode("ellipsoid", this._scene);
        var a = this._avatar.ellipsoid.x;
        var b = this._avatar.ellipsoid.y;
        var points = [];
        for (var theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
            points.push(new BABYLON.Vector3(0, b * Math.sin(theta), a * Math.cos(theta)));
        }
        var ellipse = [];
        ellipse[0] = meshBuilder_namespaceObject.MeshBuilder.CreateLines("e", { points: points }, this._scene);
        ellipse[0].color = math_color_namespaceObject.Color3.Red();
        ellipse[0].parent = ellipsoid;
        ellipse[0].isPickable = false;
        var steps = 12;
        var dTheta = 2 * Math.PI / steps;
        for (var i = 1; i < steps; i++) {
            ellipse[i] = ellipse[0].clone("el" + i);
            ellipse[i].parent = ellipsoid;
            ellipse[i].rotation.y = i * dTheta;
            ellipse[i].isPickable = false;
        }
        ellipsoid.parent = this._avatar;
        ellipsoid.position = this._avatar.ellipsoidOffset;
        this._ellipsoid = ellipsoid;
    };
    CharacterController.prototype.getAvatar = function () {
        return this._avatar;
    };
    CharacterController.prototype.setAvatarSkeleton = function (skeleton) {
        this._skeleton = skeleton;
        if (this._skeleton != null && this._skelDrivenByAG(skeleton))
            this._isAG = true;
        else
            this._isAG = false;
        if (!this._isAG && this._skeleton != null)
            this._checkAnimRanges(this._skeleton);
    };
    CharacterController.prototype._skelDrivenByAG = function (skeleton) {
        var _this = this;
        return skeleton.animations.some(function (sa) { return _this._scene.animationGroups.some(function (ag) { return ag.children.some(function (ta) { return ta.animation == sa; }); }); });
    };
    CharacterController.prototype.getSkeleton = function () {
        return this._skeleton;
    };
    return CharacterController;
}());

var _Action = (function () {
    function _Action() {
        this._walk = false;
        this._walkback = false;
        this._turnRight = false;
        this._turnLeft = false;
        this._stepRight = false;
        this._stepLeft = false;
        this._jump = false;
        this._speedMod = false;
        this.reset();
    }
    _Action.prototype.reset = function () {
        this._walk = false;
        this._walkback = false;
        this._turnRight = false;
        this._turnLeft = false;
        this._stepRight = false;
        this._stepLeft = false;
        this._jump = false;
        this._speedMod = false;
    };
    return _Action;
}());
var ActionData = (function () {
    function ActionData(id, speed, key) {
        if (speed === void 0) { speed = 1; }
        this.name = "";
        this.loop = true;
        this.rate = 1;
        this.exist = false;
        this.id = id;
        this.speed = speed;
        this.ds = speed;
        this.key = key;
        this.dk = key;
    }
    ActionData.prototype.reset = function () {
        this.name = "";
        this.speed = this.ds;
        this.key = this.dk;
        this.loop = true;
        this.rate = 1;
        this.sound = null;
        this.exist = false;
    };
    return ActionData;
}());

var Actions = {
    WALK: "walk",
    WALKBACK: "walkBack",
    WALKBACKFAST: "walkBackFast",
    IDLE: "idle",
    IDLEJUMP: "idleJump",
    RUN: "run",
    RUNJUMP: "runJump",
    FALL: "fall",
    TURNLEFT: "turnLeft",
    TURNLEFTFAST: "turnLeftFast",
    TURNRIGHT: "turnRight",
    TURNRIGHTFAST: "turnRightFast",
    STRAFELEFT: "strafeLeft",
    STRAFELEFTFAST: "strafeLeftFast",
    STRAFERIGHT: "strafeRight",
    STRAFERIGHTFAST: "strafeRightFast",
    SLIDEBACK: "slideBack",
    PREIDLEJUMP: "preIdleJump",
    POSTIDLEJUMP: "postIdleJump",
    PRERUNJUMP: "preRunJump",
    POSTRUNJUMP: "postRunJump",
    getAll: function () { return Object.values(Actions).filter(function (v) { return typeof v === "string"; }); }
};
var ActionMap = (function () {
    function ActionMap() {
        this.walk = new ActionData(Actions.WALK, 3, "w");
        this.walkBack = new ActionData(Actions.WALKBACK, 1.5, "s");
        this.walkBackFast = new ActionData(Actions.WALKBACKFAST, 3, "na");
        this.idle = new ActionData(Actions.IDLE, 0, "na");
        this.idleJump = new ActionData(Actions.IDLEJUMP, 6, " ");
        this.run = new ActionData(Actions.RUN, 6, "na");
        this.runJump = new ActionData(Actions.RUNJUMP, 6, "na");
        this.fall = new ActionData(Actions.FALL, 0, "na");
        this.turnLeft = new ActionData(Actions.TURNLEFT, Math.PI / 8, "a");
        this.turnLeftFast = new ActionData(Actions.TURNLEFTFAST, Math.PI / 4, "na");
        this.turnRight = new ActionData(Actions.TURNRIGHT, Math.PI / 8, "d");
        this.turnRightFast = new ActionData(Actions.TURNRIGHTFAST, Math.PI / 4, "na");
        this.strafeLeft = new ActionData(Actions.STRAFELEFT, 1.5, "q");
        this.strafeLeftFast = new ActionData(Actions.STRAFELEFTFAST, 3, "na");
        this.strafeRight = new ActionData(Actions.STRAFERIGHT, 1.5, "e");
        this.strafeRightFast = new ActionData(Actions.STRAFERIGHTFAST, 3, "na");
        this.slideBack = new ActionData(Actions.SLIDEBACK, 0, "na");
        this.preIdleJump = new ActionData(Actions.PREIDLEJUMP, 0, "na");
        this.postIdleJump = new ActionData(Actions.POSTIDLEJUMP, 0, "na");
        this.preRunJump = new ActionData(Actions.PRERUNJUMP, 0, "na");
        this.postRunJump = new ActionData(Actions.POSTRUNJUMP, 0, "na");
    }
    ActionMap.prototype.reset = function () {
        var keys = Object.keys(this);
        for (var _i = 0, keys_6 = keys; _i < keys_6.length; _i++) {
            var key = keys_6[_i];
            var act = this[key];
            if (!(act instanceof ActionData))
                continue;
            act.reset();
        }
    };
    ActionMap.prototype.actionNames = function () {
        var ids = new Array();
        var keys = Object.keys(this);
        for (var _i = 0, keys_7 = keys; _i < keys_7.length; _i++) {
            var key = keys_7[_i];
            var act = this[key];
            if (!(act instanceof ActionData))
                continue;
            ids.push(act.id);
        }
        return ids;
    };
    return ActionMap;
}());

;
var CCSettings = (function () {
    function CCSettings() {
        this.cameraElastic = true;
        this.makeInvisble = true;
        this.cameraTarget = math_vector_namespaceObject.Vector3.Zero();
        this.noFirstPerson = false;
        this.topDown = true;
        this.turningOff = true;
        this.keyboard = true;
    }
    return CCSettings;
}());


var __webpack_exports__ActionData = __webpack_exports__.Yf;
var __webpack_exports__ActionMap = __webpack_exports__.Cn;
var __webpack_exports__Actions = __webpack_exports__.eX;
var __webpack_exports__CCSettings = __webpack_exports__.ni;
var __webpack_exports__CharacterController = __webpack_exports__.BM;
export { __webpack_exports__ActionData as ActionData, __webpack_exports__ActionMap as ActionMap, __webpack_exports__Actions as Actions, __webpack_exports__CCSettings as CCSettings, __webpack_exports__CharacterController as CharacterController };

//# sourceMappingURL=CharacterController.es.js.map