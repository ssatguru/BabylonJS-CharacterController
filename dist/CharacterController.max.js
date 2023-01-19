(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define(["babylonjs"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("babylonjs")) : factory(root["BABYLON"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(self, (__WEBPACK_EXTERNAL_MODULE_babylonjs__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "babylonjs":
/*!****************************************************************************************************!*\
  !*** external {"commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs","root":"BABYLON"} ***!
  \****************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!************************************!*\
  !*** ./src/CharacterController.ts ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ActionData": () => (/* binding */ ActionData),
/* harmony export */   "ActionMap": () => (/* binding */ ActionMap),
/* harmony export */   "CCSettings": () => (/* binding */ CCSettings),
/* harmony export */   "CharacterController": () => (/* binding */ CharacterController)
/* harmony export */ });
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs */ "babylonjs");
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs__WEBPACK_IMPORTED_MODULE_0__);

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
        this._vMoveTot = 0;
        this._vMovStartPos = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
        this._actionMap = new ActionMap();
        this._cameraElastic = true;
        this._cameraTarget = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
        this._noFirstPerson = false;
        this._mode = 0;
        this._saveMode = 0;
        this._isLHS_RHS = false;
        this._signLHS_RHS = -1;
        this._started = false;
        this._stopAnim = false;
        this._prevActData = null;
        this._avStartPos = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
        this._grounded = false;
        this._freeFallDist = 0;
        this._fallFrameCountMin = 50;
        this._fallFrameCount = 0;
        this._inFreeFall = false;
        this._wasWalking = false;
        this._wasRunning = false;
        this._soundLoopTime = 700;
        this._sndId = null;
        this._jumpStartPosY = 0;
        this._jumpTime = 0;
        this._movFallTime = 0;
        this._sign = 1;
        this._isTurning = false;
        this._noRot = false;
        this._idleFallTime = 0;
        this._groundFrameCount = 0;
        this._groundFrameMax = 10;
        this._savedCameraCollision = true;
        this._inFP = false;
        this._ray = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Ray(babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero(), babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.One(), 1);
        this._rayDir = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
        this._cameraSkin = 0.5;
        this._pickedMeshes = new Array();
        this._makeInvisible = false;
        this._elasticSteps = 50;
        this._move = false;
        this._ekb = true;
        this._isAG = false;
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
    ;
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
                if (inActData instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.AnimationGroup) {
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
    };
    CharacterController.prototype._setAnim = function (anim, animName, rate, loop) {
        if (!this._isAG && this._skeleton == null)
            return;
        if (animName != null) {
            if (this._isAG) {
                if (!(animName instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.AnimationGroup))
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
                    for (var _a = 0, _b = ar.targetedAnimations; _a < _b.length; _a++) {
                        var ta = _b[_a];
                        ta.animation.enableBlending = true;
                        ta.animation.blendingSpeed = n;
                    }
                }
            }
        }
        else {
            if (this._skeleton !== null)
                this._skeleton.enableBlending(n);
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
    };
    CharacterController.prototype.setElasticiSteps = function (n) {
        this._elasticSteps = n;
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
    CharacterController.prototype._setRHS = function (mesh) {
        var meshMatrix = mesh.getWorldMatrix();
        var _localX = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.FromArray(meshMatrix.m, 0);
        var _localY = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.FromArray(meshMatrix.m, 4);
        var _localZ = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.FromArray(meshMatrix.m, 8);
        var actualZ = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Cross(_localX, _localY);
        if (babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Dot(actualZ, _localZ) < 0) {
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
        if (!this._hasCam) {
            this._av2cam = 0;
            this._ffSign = 1;
            return;
        }
        if (this._isLHS_RHS) {
            this._av2cam = b ? Math.PI / 2 : 3 * Math.PI / 2;
            this._ffSign = b ? 1 : -1;
        }
        else {
            this._av2cam = b ? 3 * Math.PI / 2 : Math.PI / 2;
            this._ffSign = b ? -1 : 1;
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
            ns = r.getChildren(function (n) { return (n instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.TransformNode); }, false);
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
            return 1;
        if (babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Dot(this._avatar.forward, this._avatar.position.subtract(this._camera.position)) < 0)
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
        var actData = null;
        actData = this._actionMap.runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
        }
        this._jumpTime = this._jumpTime + dt;
        var forwardDist = 0;
        var jumpDist = 0;
        var disp;
        if (this._hasCam && this._mode != 1 && !this._noRot)
            this._avatar.rotation.y = this._av2cam - this._camera.alpha;
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
            disp = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, jumpDist, 0);
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
                    if (this._verticalSlope(actDisp) <= this._sl1) {
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
    CharacterController.prototype._endJump = function () {
        this._act._jump = false;
        this._jumpTime = 0;
        this._wasWalking = false;
        this._wasRunning = false;
    };
    CharacterController.prototype._areVectorsEqual = function (v1, v2, p) {
        return ((Math.abs(v1.x - v2.x) < p) && (Math.abs(v1.y - v2.y) < p) && (Math.abs(v1.z - v2.z) < p));
    };
    CharacterController.prototype._verticalSlope = function (v) {
        return Math.atan(Math.abs(v.y / Math.sqrt(v.x * v.x + v.z * v.z)));
    };
    CharacterController.prototype._doMove = function (dt) {
        var u = this._movFallTime * this._gravity;
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;
        this._movFallTime = this._movFallTime + dt;
        var moving = false;
        var actdata = null;
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
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._ffSign * horizDist);
                    moving = true;
                    break;
            }
        }
        if (moving) {
            if (this._moveVector.length() > 0.001) {
                this._avatar.moveWithCollisions(this._moveVector);
                if (this._avatar.position.y > this._avStartPos.y) {
                    var actDisp = this._avatar.position.subtract(this._avStartPos);
                    var _slp = this._verticalSlope(actDisp);
                    if (_slp >= this._sl2) {
                        if (this._stepOffset > 0) {
                            if (this._vMoveTot == 0) {
                                this._vMovStartPos.copyFrom(this._avStartPos);
                            }
                            this._vMoveTot = this._vMoveTot + (this._avatar.position.y - this._avStartPos.y);
                            if (this._vMoveTot > this._stepOffset) {
                                this._vMoveTot = 0;
                                this._avatar.position.copyFrom(this._vMovStartPos);
                                this._endFreeFall();
                            }
                        }
                        else {
                            this._avatar.position.copyFrom(this._avStartPos);
                            this._endFreeFall();
                        }
                    }
                    else {
                        this._vMoveTot = 0;
                        if (_slp > this._sl1) {
                            this._fallFrameCount = 0;
                            this._inFreeFall = false;
                        }
                        else {
                            this._endFreeFall();
                        }
                    }
                }
                else if ((this._avatar.position.y) < this._avStartPos.y) {
                    var actDisp = this._avatar.position.subtract(this._avStartPos);
                    if (!(this._areVectorsEqual(actDisp, this._moveVector, 0.001))) {
                        if (this._verticalSlope(actDisp) <= this._sl1) {
                            this._endFreeFall();
                        }
                        else {
                            this._fallFrameCount = 0;
                            this._inFreeFall = false;
                        }
                    }
                    else {
                        this._inFreeFall = true;
                        this._fallFrameCount++;
                        if (this._fallFrameCount > this._fallFrameCountMin) {
                            actdata = this._actionMap.fall;
                        }
                    }
                }
                else {
                    this._endFreeFall();
                }
            }
        }
        return actdata;
    };
    CharacterController.prototype._rotateAV2C = function () {
        if (this._hasCam)
            if (this._mode != 1) {
                var ca = (this._hasCam) ? (this._av2cam - this._camera.alpha) : 0;
                if (this._noRot) {
                    switch (true) {
                        case (this._act._walk && this._act._turnRight):
                            this._avatar.rotation.y = ca + this._rhsSign * Math.PI / 4;
                            break;
                        case (this._act._walk && this._act._turnLeft):
                            this._avatar.rotation.y = ca - this._rhsSign * Math.PI / 4;
                            break;
                        case (this._act._walkback && this._act._turnRight):
                            this._avatar.rotation.y = ca + this._rhsSign * 3 * Math.PI / 4;
                            break;
                        case (this._act._walkback && this._act._turnLeft):
                            this._avatar.rotation.y = ca - this._rhsSign * 3 * Math.PI / 4;
                            break;
                        case (this._act._walk):
                            this._avatar.rotation.y = ca;
                            break;
                        case (this._act._walkback):
                            this._avatar.rotation.y = ca + Math.PI;
                            break;
                        case (this._act._turnRight):
                            this._avatar.rotation.y = ca + this._rhsSign * Math.PI / 2;
                            break;
                        case (this._act._turnLeft):
                            this._avatar.rotation.y = ca - this._rhsSign * Math.PI / 2;
                            break;
                    }
                }
                else {
                    if (this._hasCam)
                        this._avatar.rotation.y = ca;
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
            else {
                a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback)
                        a = -1;
                    if (!moving)
                        anim = this._actionMap.turnLeft;
                }
                else {
                    if (this._act._walk)
                        a = -1;
                    if (!moving) {
                        a = -1;
                        anim = this._actionMap.turnRight;
                    }
                }
                if (this._hasCam)
                    this._camera.alpha = this._camera.alpha + this._rhsSign * turnAngle * a;
            }
            this._avatar.rotation.y = this._avatar.rotation.y + turnAngle * a;
        }
        return anim;
    };
    CharacterController.prototype._endFreeFall = function () {
        this._movFallTime = 0;
        this._fallFrameCount = 0;
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
        this._fallFrameCount = 0;
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
        var disp = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, -this._freeFallDist, 0);
        if (this._hasCam && this._mode != 1 && !this._noRot)
            this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        this._avatar.moveWithCollisions(disp);
        if ((this._avatar.position.y > this._avStartPos.y) || (this._avatar.position.y === this._avStartPos.y)) {
            this._groundIt();
        }
        else if (this._avatar.position.y < this._avStartPos.y) {
            var actDisp = this._avatar.position.subtract(this._avStartPos);
            if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                if (this._verticalSlope(actDisp) <= this._sl1) {
                    this._groundIt();
                    this._avatar.position.copyFrom(this._avStartPos);
                }
                else {
                    this._unGroundIt();
                    anim = this._actionMap.slideBack;
                }
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
        if (!this._hasCam)
            return;
        if (this._vMoveTot == 0)
            this._avatar.position.addToRef(this._cameraTarget, this._camera.target);
        if (this._camera.radius > this._camera.lowerRadiusLimit) {
            if (this._cameraElastic || this._makeInvisible)
                this._handleObstruction();
        }
        if (this._camera.radius <= this._camera.lowerRadiusLimit) {
            if (!this._noFirstPerson && !this._inFP) {
                this._avatar.visibility = 0;
                this._camera.checkCollisions = false;
                this._saveMode = this._mode;
                this._mode = 0;
                this._inFP = true;
            }
        }
        else {
            this._inFP = false;
            this._mode = this._saveMode;
            this._avatar.visibility = 1;
            this._camera.checkCollisions = this._savedCameraCollision;
        }
    };
    ;
    CharacterController.prototype._handleObstruction = function () {
        var _this = this;
        this._camera.position.subtractToRef(this._camera.target, this._rayDir);
        this._ray.origin = this._camera.target;
        this._ray.length = this._rayDir.length();
        this._ray.direction = this._rayDir.normalize();
        var pis = this._scene.multiPickWithRay(this._ray, function (mesh) {
            if (mesh == _this._avatar)
                return false;
            else
                return true;
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
                var c2p = this._camera.position.subtract(pp);
                var l = c2p.length();
                if (this._camera.checkCollisions) {
                    var step = void 0;
                    if (l <= 1) {
                        step = c2p.addInPlace(c2p.normalizeToNew().scaleInPlace(this._cameraSkin));
                    }
                    else {
                        step = c2p.normalize().scaleInPlace(l / this._elasticSteps);
                    }
                    this._camera.position = this._camera.position.subtract(step);
                }
                else {
                    var step = void 0;
                    if (l <= 1)
                        step = l + this._cameraSkin;
                    else
                        step = l / this._elasticSteps;
                    this._camera.radius = this._camera.radius - (step);
                }
            }
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
        switch (e.key.toLowerCase()) {
            case this._actionMap.idleJump.key:
                this._act._jump = true;
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
                this._act._walk = true;
                break;
            case "left":
            case "arrowleft":
            case this._actionMap.turnLeft.key:
                this._act._turnLeft = true;
                break;
            case "right":
            case "arrowright":
            case this._actionMap.turnRight.key:
                this._act._turnRight = true;
                break;
            case "down":
            case "arrowdown":
            case this._actionMap.walkBack.key:
                this._act._walkback = true;
                break;
            case this._actionMap.strafeLeft.key:
                this._act._stepLeft = true;
                break;
            case this._actionMap.strafeRight.key:
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
    CharacterController.prototype.walk = function (b) {
        this._act._walk = b;
    };
    CharacterController.prototype.walkBack = function (b) {
        this._act._walkback = b;
    };
    CharacterController.prototype.walkBackFast = function (b) {
        this._act._walkback = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.run = function (b) {
        this._act._walk = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.turnLeft = function (b) {
        this._act._turnLeft = b;
        if (!b)
            this._isTurning = b;
    };
    CharacterController.prototype.turnLeftFast = function (b) {
        this._act._turnLeft = b;
        if (!b)
            this._isTurning = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.turnRight = function (b) {
        this._act._turnRight = b;
        if (!b)
            this._isTurning = b;
    };
    CharacterController.prototype.turnRightFast = function (b) {
        this._act._turnRight = b;
        if (!b)
            this._isTurning = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.strafeLeft = function (b) {
        this._act._stepLeft = b;
    };
    CharacterController.prototype.strafeLeftFast = function (b) {
        this._act._stepLeft = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.strafeRight = function (b) {
        this._act._stepRight = b;
    };
    CharacterController.prototype.strafeRightFast = function (b) {
        this._act._stepRight = b;
        this._act._speedMod = b;
    };
    CharacterController.prototype.jump = function () {
        this._act._jump = true;
    };
    CharacterController.prototype.idle = function () {
        this._act.reset();
    };
    CharacterController.prototype.isAg = function () {
        return this._isAG;
    };
    CharacterController.prototype._findSkel = function (n) {
        var root = this._root(n);
        if (root instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.Mesh && root.skeleton)
            return root.skeleton;
        var ms = root.getChildMeshes(false, function (cm) {
            if (cm instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.Mesh) {
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
    CharacterController.prototype.setAvatar = function (avatar, faceForward) {
        if (faceForward === void 0) { faceForward = false; }
        var rootNode = this._root(avatar);
        if (rootNode instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.Mesh) {
            this._avatar = rootNode;
        }
        else {
            console.error("Cannot move this mesh. The root node of the mesh provided is not a mesh");
            return false;
        }
        this._skeleton = this._findSkel(avatar);
        this._isAG = this._containsAG(avatar, this._scene.animationGroups, true);
        this._actionMap.reset();
        if (!this._isAG && this._skeleton != null)
            this._checkAnimRanges(this._skeleton);
        this._setRHS(avatar);
        this.setFaceForward(faceForward);
        return true;
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

var ActionMap = (function () {
    function ActionMap() {
        this.walk = new ActionData("walk", 3, "w");
        this.walkBack = new ActionData("walkBack", 1.5, "s");
        this.walkBackFast = new ActionData("walkBackFast", 3, "na");
        this.idle = new ActionData("idle", 0, "na");
        this.idleJump = new ActionData("idleJump", 6, " ");
        this.run = new ActionData("run", 6, "na");
        this.runJump = new ActionData("runJump", 6, "na");
        this.fall = new ActionData("fall", 0, "na");
        this.turnLeft = new ActionData("turnLeft", Math.PI / 8, "a");
        this.turnLeftFast = new ActionData("turnLeftFast", Math.PI / 4, "na");
        this.turnRight = new ActionData("turnRight", Math.PI / 8, "d");
        this.turnRightFast = new ActionData("turnRightFast", Math.PI / 4, "na");
        this.strafeLeft = new ActionData("strafeLeft", 1.5, "q");
        this.strafeLeftFast = new ActionData("strafeLeftFast", 3, "na");
        this.strafeRight = new ActionData("strafeRight", 1.5, "e");
        this.strafeRightFast = new ActionData("strafeRightFast", 3, "na");
        this.slideBack = new ActionData("slideBack", 0, "na");
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
    return ActionMap;
}());

;
var CCSettings = (function () {
    function CCSettings() {
        this.cameraElastic = true;
        this.makeInvisble = true;
        this.cameraTarget = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
        this.noFirstPerson = false;
        this.topDown = true;
        this.turningOff = true;
        this.keyboard = true;
    }
    return CCSettings;
}());


})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=CharacterController.max.js.map