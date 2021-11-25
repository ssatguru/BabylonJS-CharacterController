(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define(["babylonjs"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("babylonjs")) : factory(root["BABYLON"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(window, function(__WEBPACK_EXTERNAL_MODULE_babylonjs__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/CharacterController.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/CharacterController.ts":
/*!************************************!*\
  !*** ./src/CharacterController.ts ***!
  \************************************/
/*! exports provided: CharacterController */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CharacterController", function() { return CharacterController; });
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs */ "babylonjs");
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs__WEBPACK_IMPORTED_MODULE_0__);

var CharacterController = (function () {
    function CharacterController(avatar, camera, scene, agMap, faceForward) {
        var _this = this;
        if (faceForward === void 0) { faceForward = false; }
        this._gravity = 9.8;
        this._minSlopeLimit = 30;
        this._maxSlopeLimit = 45;
        this._sl1 = Math.PI * this._minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
        this._stepOffset = 0.25;
        this._vMoveTot = 0;
        this._vMovStartPos = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
        this._actMap = new _ActMap();
        this._walkKey = "w";
        this._walkBackKey = "s";
        this._turnLeftKey = "a";
        this._turnRightKey = "d";
        this._strafeLeftKey = "q";
        this._strafeRightKey = "e";
        this._jumpKey = " ";
        this._elasticCamera = true;
        this._cameraTarget = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
        this._noFirstPerson = false;
        this.mode = 0;
        this._saveMode = 0;
        this._isRHS = false;
        this._signRHS = -1;
        this._started = false;
        this._stopAnim = false;
        this._prevAnim = null;
        this._avStartPos = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
        this._grounded = false;
        this._freeFallDist = 0;
        this._fallFrameCountMin = 50;
        this._fallFrameCount = 0;
        this._inFreeFall = false;
        this._wasWalking = false;
        this._wasRunning = false;
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
        this._ray = new babylonjs__WEBPACK_IMPORTED_MODULE_0__["Ray"](babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].One(), 1);
        this._rayDir = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
        this._cameraSkin = 0.5;
        this._skip = 0;
        this._move = false;
        this._isAG = false;
        this._hasAnims = false;
        this._avatar = avatar;
        this._setRHS(avatar);
        this.setFaceForward(faceForward);
        this._scene = scene;
        if (agMap != null) {
            this._isAG = true;
            this.setAnimationGroups(agMap);
        }
        if (this._isAG || this._skeleton !== null) {
            this._hasAnims = true;
        }
        if (!this._isAG)
            this._skeleton = avatar.skeleton;
        if (!this._isAG && this._skeleton != null)
            this.checkAnims(this._skeleton);
        this._camera = camera;
        this._savedCameraCollision = this._camera.checkCollisions;
        this._act = new _Action();
        this._renderer = function () { _this._moveAVandCamera(); };
        this._handleKeyUp = function (e) { _this._onKeyUp(e); };
        this._handleKeyDown = function (e) { _this._onKeyDown(e); };
    }
    CharacterController.prototype.setAvatar = function (avatar, faceForward) {
        if (faceForward === void 0) { faceForward = false; }
        this._avatar = avatar;
        this._setRHS(avatar);
        this.setFaceForward(faceForward);
    };
    CharacterController.prototype.setAvatarSkeleton = function (skeleton) {
        this._skeleton = skeleton;
        this.checkAnims(skeleton);
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
        this._actMap.walk._speed = n;
    };
    CharacterController.prototype.setRunSpeed = function (n) {
        this._actMap.run._speed = n;
    };
    CharacterController.prototype.setBackSpeed = function (n) {
        this._actMap.walkBack._speed = n;
    };
    CharacterController.prototype.setBackFastSpeed = function (n) {
        this._actMap.walkBackFast._speed = n;
    };
    CharacterController.prototype.setJumpSpeed = function (n) {
        this._actMap.idleJump._speed = n;
        this._actMap.runJump._speed = n;
    };
    CharacterController.prototype.setLeftSpeed = function (n) {
        this._actMap.strafeLeft._speed = n;
    };
    CharacterController.prototype.setLeftFastSpeed = function (n) {
        this._actMap.strafeLeftFast._speed = n;
    };
    CharacterController.prototype.setRightSpeed = function (n) {
        this._actMap.strafeRight._speed = n;
    };
    CharacterController.prototype.setRightFastSpeed = function (n) {
        this._actMap.strafeLeftFast._speed = n;
    };
    CharacterController.prototype.setTurnSpeed = function (n) {
        this._actMap.turnLeft._speed = n * Math.PI / 180;
        this._actMap.turnRight._speed = n * Math.PI / 180;
    };
    CharacterController.prototype.setTurnFastSpeed = function (n) {
        this._actMap.turnLeftFast._speed = n * Math.PI / 180;
        this._actMap.turnRightFast._speed = n * Math.PI / 180;
    };
    CharacterController.prototype.setGravity = function (n) {
        this._gravity = n;
    };
    CharacterController.prototype.setAnimationGroups = function (agMap) {
        if (this._prevAnim != null && this._prevAnim._exist)
            this._prevAnim._ag.stop();
        this._isAG = true;
        var agData;
        var keys = Object.keys(this._actMap);
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            var anim = this._actMap[key];
            if (!(anim instanceof _AnimData))
                continue;
            anim._exist = false;
            agData = agMap[anim._id];
            if (agData != null) {
                if (agData instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__["AnimationGroup"]) {
                    anim._ag = agData;
                    anim._name = anim._ag.name;
                    anim._exist = true;
                }
                else {
                    if (agData["ag"]) {
                        anim._ag = agData["ag"];
                        if (agData["loop"] != null)
                            anim._loop = agData["loop"];
                        if (agData["rate"])
                            anim._rate = agData["rate"];
                        if (agData["speed"])
                            anim._speed = agData["speed"];
                        anim._exist = true;
                    }
                }
            }
        }
        this._checkFastAnims();
        this._prevAnim = null;
    };
    CharacterController.prototype.setAnimationRanges = function (arMap) {
        this._isAG = false;
        var arData;
        var keys = Object.keys(this._actMap);
        for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
            var key = keys_2[_i];
            var anim = this._actMap[key];
            if (!(anim instanceof _AnimData))
                continue;
            anim._exist = false;
            arData = arMap[anim._id];
            if (arData != null) {
                if (arData instanceof Object) {
                    if (arData["name"]) {
                        anim._name = arData["name"];
                        if (arData["loop"] != null)
                            anim._loop = arData["loop"];
                        if (arData["rate"])
                            anim._rate = arData["rate"];
                        if (arData["speed"])
                            anim._speed = arData["speed"];
                        anim._exist = true;
                    }
                }
                else {
                    anim._name = arData;
                    anim._exist = true;
                }
            }
        }
        this._checkFastAnims();
        this._prevAnim = null;
    };
    CharacterController.prototype.getAnimationMap = function () {
        var map = {};
        var keys = Object.keys(this._actMap);
        for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
            var key = keys_3[_i];
            var anim = this._actMap[key];
            if (!(anim instanceof _AnimData))
                continue;
            if (anim._exist) {
                var data = {};
                if (this._isAG)
                    data["ag"] = anim._ag;
                else
                    data["name"] = anim._name;
                data["loop"] = anim._loop;
                data["rate"] = anim._rate;
                data["speed"] = anim._speed;
                map[anim._id] = data;
            }
        }
        return map;
    };
    CharacterController.prototype._setAnim = function (anim, rangeName, rate, loop) {
        if (!this._isAG && this._skeleton == null)
            return;
        if (loop != null)
            anim._loop = loop;
        if (!this._isAG) {
            if (rangeName != null)
                anim._name = rangeName;
            if (rate != null)
                anim._rate = rate;
            if (this._skeleton.getAnimationRange(anim._name) != null) {
                anim._exist = true;
            }
            else {
                anim._exist = false;
            }
        }
        else {
            if (rangeName != null) {
                anim._ag = rangeName;
                anim._exist = true;
            }
            if (rate != null && anim._exist) {
                anim._rate = rate;
                anim._ag.speedRatio = rate;
            }
        }
    };
    CharacterController.prototype.enableBlending = function (n) {
        if (this._isAG) {
            var keys = Object.keys(this._actMap);
            for (var _i = 0, keys_4 = keys; _i < keys_4.length; _i++) {
                var key = keys_4[_i];
                var act = this._actMap[key];
                if (!(act instanceof _AnimData))
                    continue;
                if (act._exist) {
                    var ar = act._ag;
                    for (var _a = 0, _b = ar.targetedAnimations; _a < _b.length; _a++) {
                        var ta = _b[_a];
                        ta.animation.enableBlending = true;
                        ta.animation.blendingSpeed = n;
                    }
                }
            }
        }
        else {
            this._skeleton.enableBlending(n);
        }
    };
    CharacterController.prototype.disableBlending = function () {
        if (this._isAG) {
            var keys = Object.keys(this._actMap);
            for (var _i = 0, keys_5 = keys; _i < keys_5.length; _i++) {
                var key = keys_5[_i];
                var anim = this._actMap[key];
                if (!(anim instanceof _AnimData))
                    continue;
                if (anim._exist) {
                    var ar = anim._ag;
                    for (var _a = 0, _b = ar.targetedAnimations; _a < _b.length; _a++) {
                        var ta = _b[_a];
                        ta.animation.enableBlending = false;
                    }
                }
            }
        }
    };
    CharacterController.prototype.setWalkAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.walk, rangeName, rate, loop);
    };
    CharacterController.prototype.setRunAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.run, rangeName, rate, loop);
    };
    CharacterController.prototype.setWalkBackAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.walkBack, rangeName, rate, loop);
        this._copySlowAnims(this._actMap.walkBackFast, this._actMap.walkBack);
    };
    CharacterController.prototype.setWalkBackFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.walkBackFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setSlideBackAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.slideBack, rangeName, rate, loop);
    };
    CharacterController.prototype.setIdleAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.idle, rangeName, rate, loop);
    };
    CharacterController.prototype.setTurnRightAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.turnRight, rangeName, rate, loop);
        this._copySlowAnims(this._actMap.turnRightFast, this._actMap.turnRight);
    };
    CharacterController.prototype.setTurnRightFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.turnRightFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setTurnLeftAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.turnLeft, rangeName, rate, loop);
        this._copySlowAnims(this._actMap.turnLeftFast, this._actMap.turnLeft);
    };
    CharacterController.prototype.setTurnLeftFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.turnLeftFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setStrafeRightAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.strafeRight, rangeName, rate, loop);
        this._copySlowAnims(this._actMap.strafeRightFast, this._actMap.strafeRight);
    };
    CharacterController.prototype.setStrafeRightFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.strafeRightFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setStrafeLeftAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.strafeLeft, rangeName, rate, loop);
        this._copySlowAnims(this._actMap.strafeLeftFast, this._actMap.strafeLeft);
    };
    CharacterController.prototype.setStrafeLeftFastAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.strafeLeftFast, rangeName, rate, loop);
    };
    CharacterController.prototype.setIdleJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.idleJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setRunJumpAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.runJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setFallAnim = function (rangeName, rate, loop) {
        this._setAnim(this._actMap.fall, rangeName, rate, loop);
    };
    CharacterController.prototype.setWalkKey = function (key) {
        this._walkKey = key.toLowerCase();
    };
    CharacterController.prototype.setWalkBackKey = function (key) {
        this._walkBackKey = key.toLowerCase();
    };
    CharacterController.prototype.setTurnLeftKey = function (key) {
        this._turnLeftKey = key.toLowerCase();
    };
    CharacterController.prototype.setTurnRightKey = function (key) {
        this._turnRightKey = key.toLowerCase();
    };
    CharacterController.prototype.setStrafeLeftKey = function (key) {
        this._strafeLeftKey = key.toLowerCase();
    };
    CharacterController.prototype.setStrafeRightKey = function (key) {
        this._strafeRightKey = key.toLowerCase();
    };
    CharacterController.prototype.setJumpKey = function (key) {
        this._jumpKey = key.toLowerCase();
    };
    CharacterController.prototype.setCameraElasticity = function (b) {
        this._elasticCamera = b;
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
    CharacterController.prototype.checkAnims = function (skel) {
        var keys = Object.keys(this._actMap);
        for (var _i = 0, keys_6 = keys; _i < keys_6.length; _i++) {
            var key = keys_6[_i];
            var anim = this._actMap[key];
            if (!(anim instanceof _AnimData))
                continue;
            if (skel != null) {
                if (skel.getAnimationRange(anim._name) != null)
                    anim._exist = true;
            }
            else {
                anim._exist = false;
            }
        }
        this._checkFastAnims();
    };
    CharacterController.prototype._checkFastAnims = function () {
        this._copySlowAnims(this._actMap.walkBackFast, this._actMap.walkBack);
        this._copySlowAnims(this._actMap.turnRightFast, this._actMap.turnRight);
        this._copySlowAnims(this._actMap.turnLeftFast, this._actMap.turnLeft);
        this._copySlowAnims(this._actMap.strafeRightFast, this._actMap.strafeRight);
        this._copySlowAnims(this._actMap.strafeLeftFast, this._actMap.strafeLeft);
    };
    CharacterController.prototype._copySlowAnims = function (f, s) {
        if (f._exist)
            return;
        if (!s._exist)
            return;
        f._exist = true;
        f._ag = s._ag;
        f._name = s._name;
        f._rate = s._rate * 2;
    };
    CharacterController.prototype.setMode = function (n) {
        this.mode = n;
        this._saveMode = n;
    };
    CharacterController.prototype.setTurningOff = function (b) {
        this._noRot = b;
    };
    CharacterController.prototype._setRHS = function (mesh) {
        var meshMatrix = mesh.getWorldMatrix();
        var _localX = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromFloatArray(meshMatrix.m, 0);
        var _localY = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromFloatArray(meshMatrix.m, 4);
        var _localZ = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromFloatArray(meshMatrix.m, 8);
        var actualZ = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Cross(_localX, _localY);
        if (babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Dot(actualZ, _localZ) < 0) {
            this._isRHS = true;
            this._signRHS = 1;
        }
        else {
            this._isRHS = false;
            this._signRHS = -1;
        }
    };
    CharacterController.prototype.setFaceForward = function (b) {
        if (this._isRHS) {
            this._av2cam = b ? Math.PI / 2 : 3 * Math.PI / 2;
            this._ffSign = b ? 1 : -1;
        }
        else {
            this._av2cam = b ? 3 * Math.PI / 2 : Math.PI / 2;
            this._ffSign = b ? -1 : 1;
        }
    };
    CharacterController.prototype.checkAGs = function (agMap) {
        var keys = Object.keys(this._actMap);
        for (var _i = 0, keys_7 = keys; _i < keys_7.length; _i++) {
            var key = keys_7[_i];
            var anim = this._actMap[key];
            if (!(anim instanceof _AnimData))
                continue;
            if (agMap[anim._name] != null) {
                anim._ag = agMap[anim._name];
                anim._exist = true;
            }
        }
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
        this.enableKeyBoard(true);
        this._scene.registerBeforeRender(this._renderer);
    };
    CharacterController.prototype.stop = function () {
        if (!this._started)
            return;
        this._started = false;
        this._scene.unregisterBeforeRender(this._renderer);
        this.enableKeyBoard(false);
        this._prevAnim = null;
    };
    CharacterController.prototype.pauseAnim = function () {
        this._stopAnim = true;
    };
    CharacterController.prototype.resumeAnim = function () {
        this._stopAnim = false;
    };
    CharacterController.prototype._isAvFacingCamera = function () {
        if (babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Dot(this._avatar.forward, this._avatar.position.subtract(this._camera.position)) < 0)
            return 1;
        else
            return -1;
    };
    CharacterController.prototype._moveAVandCamera = function () {
        this._avStartPos.copyFrom(this._avatar.position);
        var anim = null;
        var dt = this._scene.getEngine().getDeltaTime() / 1000;
        if (this._act._jump && !this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            anim = this._doJump(dt);
        }
        else if (this.anyMovement() || this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            anim = this._doMove(dt);
        }
        else if (!this._inFreeFall) {
            anim = this._doIdle(dt);
        }
        if (!this._stopAnim && this._hasAnims && anim != null) {
            if (this._prevAnim !== anim) {
                if (anim._exist) {
                    if (this._isAG) {
                        if (this._prevAnim != null && this._prevAnim._exist)
                            this._prevAnim._ag.stop();
                        anim._ag.start(anim._loop, anim._rate);
                    }
                    else {
                        this._skeleton.beginAnimation(anim._name, anim._loop, anim._rate);
                    }
                }
                this._prevAnim = anim;
            }
        }
        this._updateTargetValue();
        return;
    };
    CharacterController.prototype._doJump = function (dt) {
        var anim = null;
        anim = this._actMap.runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
        }
        this._jumpTime = this._jumpTime + dt;
        var forwardDist = 0;
        var jumpDist = 0;
        var disp;
        if (this.mode != 1 && !this._noRot)
            this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        if (this._wasRunning || this._wasWalking) {
            if (this._wasRunning) {
                forwardDist = this._actMap.run._speed * dt;
            }
            else if (this._wasWalking) {
                forwardDist = this._actMap.walk._speed * dt;
            }
            disp = this._moveVector.clone();
            disp.y = 0;
            disp = disp.normalize();
            disp.scaleToRef(forwardDist, disp);
            jumpDist = this._calcJumpDist(this._actMap.runJump._speed, dt);
            disp.y = jumpDist;
        }
        else {
            jumpDist = this._calcJumpDist(this._actMap.idleJump._speed, dt);
            disp = new babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"](0, jumpDist, 0);
            anim = this._actMap.idleJump;
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
                    anim = this._actMap.fall;
                }
            }
        }
        return anim;
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
        var anim = null;
        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        }
        else {
            this._wasWalking = false;
            this._wasRunning = false;
            var sign = void 0;
            var horizDist = 0;
            switch (true) {
                case (this._act._stepLeft):
                    sign = this._signRHS * this._isAvFacingCamera();
                    horizDist = this._actMap.strafeLeft._speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actMap.strafeLeftFast._speed * dt;
                        anim = (-this._ffSign * sign > 0) ? this._actMap.strafeLeftFast : this._actMap.strafeRightFast;
                    }
                    else {
                        anim = (-this._ffSign * sign > 0) ? this._actMap.strafeLeft : this._actMap.strafeRight;
                    }
                    this._moveVector = this._avatar.calcMovePOV(sign * horizDist, -this._freeFallDist, 0);
                    moving = true;
                    break;
                case (this._act._stepRight):
                    sign = -this._signRHS * this._isAvFacingCamera();
                    horizDist = this._actMap.strafeRight._speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actMap.strafeRightFast._speed * dt;
                        anim = (-this._ffSign * sign > 0) ? this._actMap.strafeLeftFast : this._actMap.strafeRightFast;
                    }
                    else {
                        anim = (-this._ffSign * sign > 0) ? this._actMap.strafeLeft : this._actMap.strafeRight;
                    }
                    this._moveVector = this._avatar.calcMovePOV(sign * horizDist, -this._freeFallDist, 0);
                    moving = true;
                    break;
                case (this._act._walk || (this._noRot && this.mode == 0)):
                    if (this._act._speedMod) {
                        this._wasRunning = true;
                        horizDist = this._actMap.run._speed * dt;
                        anim = this._actMap.run;
                    }
                    else {
                        this._wasWalking = true;
                        horizDist = this._actMap.walk._speed * dt;
                        anim = this._actMap.walk;
                    }
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, this._ffSign * horizDist);
                    moving = true;
                    break;
                case (this._act._walkback):
                    horizDist = this._actMap.walkBack._speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actMap.walkBackFast._speed * dt;
                        anim = this._actMap.walkBackFast;
                    }
                    else {
                        anim = this._actMap.walkBack;
                    }
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._ffSign * horizDist);
                    moving = true;
                    break;
            }
        }
        if (!(this._noRot && this.mode == 0) && (!this._act._stepLeft && !this._act._stepRight) && (this._act._turnLeft || this._act._turnRight)) {
            var turnAngle = this._actMap.turnLeft._speed * dt;
            if (this._act._speedMod) {
                turnAngle = 2 * turnAngle;
            }
            if (this.mode == 1) {
                if (!this._isTurning) {
                    this._sign = -this._ffSign * this._isAvFacingCamera();
                    if (this._isRHS)
                        this._sign = -this._sign;
                    this._isTurning = true;
                }
                var a = this._sign;
                if (this._act._turnLeft) {
                    if (this._act._walk) { }
                    else if (this._act._walkback)
                        a = -this._sign;
                    else {
                        anim = (this._sign > 0) ? this._actMap.turnRight : this._actMap.turnLeft;
                    }
                }
                else {
                    if (this._act._walk)
                        a = -this._sign;
                    else if (this._act._walkback) { }
                    else {
                        a = -this._sign;
                        anim = (this._sign > 0) ? this._actMap.turnLeft : this._actMap.turnRight;
                    }
                }
                this._avatar.rotation.y = this._avatar.rotation.y + turnAngle * a;
            }
            else {
                var a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback)
                        a = -1;
                    if (!moving)
                        anim = this._actMap.turnLeft;
                }
                else {
                    if (this._act._walk)
                        a = -1;
                    if (!moving) {
                        a = -1;
                        anim = this._actMap.turnRight;
                    }
                }
                this._camera.alpha = this._camera.alpha + turnAngle * a;
            }
        }
        if (this.mode != 1) {
            if (this._noRot) {
                switch (true) {
                    case (this._act._walk && this._act._turnRight):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + Math.PI / 4;
                        break;
                    case (this._act._walk && this._act._turnLeft):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha - Math.PI / 4;
                        break;
                    case (this._act._walkback && this._act._turnRight):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + 3 * Math.PI / 4;
                        break;
                    case (this._act._walkback && this._act._turnLeft):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha - 3 * Math.PI / 4;
                        break;
                    case (this._act._walk):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha;
                        break;
                    case (this._act._walkback):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + Math.PI;
                        break;
                    case (this._act._turnRight):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + Math.PI / 2;
                        break;
                    case (this._act._turnLeft):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha - Math.PI / 2;
                        break;
                }
            }
            else {
                this._avatar.rotation.y = this._av2cam - this._camera.alpha;
            }
        }
        else {
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
                            anim = this._actMap.fall;
                        }
                    }
                }
                else {
                    this._endFreeFall();
                }
            }
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
            return this._actMap.idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        var anim = this._actMap.idle;
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
        var disp = new babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"](0, -this._freeFallDist, 0);
        if (this.mode != 1 && !this._noRot)
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
                    anim = this._actMap.slideBack;
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
        if (this._vMoveTot == 0)
            this._avatar.position.addToRef(this._cameraTarget, this._camera.target);
        if (this._camera.radius > this._camera.lowerRadiusLimit) {
            if (this._elasticCamera)
                this._snapCamera();
        }
        if (this._camera.radius <= this._camera.lowerRadiusLimit) {
            if (!this._noFirstPerson && !this._inFP) {
                this._avatar.visibility = 0;
                this._camera.checkCollisions = false;
                this._saveMode = this.mode;
                this.mode = 0;
                this._inFP = true;
            }
        }
        else {
            this._inFP = false;
            this.mode = this._saveMode;
            this._avatar.visibility = 1;
            this._camera.checkCollisions = this._savedCameraCollision;
        }
    };
    CharacterController.prototype._snapCamera = function () {
        var _this = this;
        this._camera.position.subtractToRef(this._camera.target, this._rayDir);
        this._ray.origin = this._camera.target;
        this._ray.length = this._rayDir.length();
        this._ray.direction = this._rayDir.normalize();
        var pi = this._scene.pickWithRay(this._ray, function (mesh) {
            if (mesh == _this._avatar || !mesh.checkCollisions)
                return false;
            else
                return true;
        }, true);
        if (pi.hit) {
            if (this._camera.checkCollisions) {
                var newPos = this._camera.target.subtract(pi.pickedPoint).normalize().scale(this._cameraSkin);
                pi.pickedPoint.addToRef(newPos, this._camera.position);
            }
            else {
                var nr = pi.pickedPoint.subtract(this._camera.target).length();
                this._camera.radius = nr - this._cameraSkin;
            }
        }
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
            case this._jumpKey:
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
            case this._walkKey:
                this._act._walk = true;
                break;
            case "left":
            case "arrowleft":
            case this._turnLeftKey:
                this._act._turnLeft = true;
                break;
            case "right":
            case "arrowright":
            case this._turnRightKey:
                this._act._turnRight = true;
                break;
            case "down":
            case "arrowdown":
            case this._walkBackKey:
                this._act._walkback = true;
                break;
            case this._strafeLeftKey:
                this._act._stepLeft = true;
                break;
            case this._strafeRightKey:
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
            case this._walkKey:
                this._act._walk = false;
                break;
            case "left":
            case "arrowleft":
            case this._turnLeftKey:
                this._act._turnLeft = false;
                this._isTurning = false;
                break;
            case "right":
            case "arrowright":
            case this._turnRightKey:
                this._act._turnRight = false;
                this._isTurning = false;
                break;
            case "down":
            case "arrowdown":
            case this._walkBackKey:
                this._act._walkback = false;
                break;
            case this._strafeLeftKey:
                this._act._stepLeft = false;
                break;
            case this._strafeRightKey:
                this._act._stepRight = false;
                break;
        }
        this._move = this.anyMovement();
    };
    CharacterController.prototype.enableKeyBoard = function (b) {
        var canvas = this._scene.getEngine().getRenderingCanvas();
        if (b) {
            canvas.addEventListener("keyup", this._handleKeyUp, false);
            canvas.addEventListener("keydown", this._handleKeyDown, false);
        }
        else {
            canvas.removeEventListener("keyup", this._handleKeyUp, false);
            canvas.removeEventListener("keydown", this._handleKeyDown, false);
        }
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
    return CharacterController;
}());

var _AnimData = (function () {
    function _AnimData(id, speed) {
        if (speed === void 0) { speed = 1; }
        this._loop = true;
        this._rate = 1;
        this._exist = false;
        this._id = id;
        this._name = id;
        this._speed = speed;
    }
    return _AnimData;
}());
var _Action = (function () {
    function _Action() {
        this._walk = false;
        this._walkback = false;
        this._speedMod = false;
        this._turnRight = false;
        this._turnLeft = false;
        this._stepRight = false;
        this._stepLeft = false;
        this._jump = false;
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
var _ActMap = (function () {
    function _ActMap() {
        this._walkSpeed = 3;
        this.walk = new _AnimData("walk", 3);
        this.walkBack = new _AnimData("walkBack", this._walkSpeed / 2);
        this.walkBackFast = new _AnimData("walkBackFast", this._walkSpeed);
        this.idle = new _AnimData("idle", 0);
        this.idleJump = new _AnimData("idleJump", this._walkSpeed * 2);
        this.run = new _AnimData("run", this._walkSpeed * 2);
        this.runJump = new _AnimData("runJump", this._walkSpeed * 2);
        this.fall = new _AnimData("fall", 0);
        this.turnLeft = new _AnimData("turnLeft", Math.PI / 8);
        this.turnLeftFast = new _AnimData("turnLeftFast", Math.PI / 4);
        this.turnRight = new _AnimData("turnRight", Math.PI / 8);
        this.turnRightFast = new _AnimData("turnRightFast", Math.PI / 4);
        this.strafeLeft = new _AnimData("strafeLeft", this._walkSpeed / 2);
        this.strafeLeftFast = new _AnimData("strafeLeftFast", this._walkSpeed);
        this.strafeRight = new _AnimData("strafeRight", this._walkSpeed / 2);
        this.strafeRightFast = new _AnimData("strafeRightFast", this._walkSpeed);
        this.slideBack = new _AnimData("slideBack", 0);
    }
    return _ActMap;
}());
;


/***/ }),

/***/ "babylonjs":
/*!****************************************************************************************************!*\
  !*** external {"commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs","root":"BABYLON"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs__;

/***/ })

/******/ });
});
//# sourceMappingURL=CharacterController.max.js.map