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
        this._walkSpeed = 3;
        this._runSpeed = this._walkSpeed * 2;
        this._backSpeed = this._walkSpeed / 2;
        this._jumpSpeed = this._walkSpeed * 2;
        this._leftSpeed = this._walkSpeed / 2;
        this._rightSpeed = this._walkSpeed / 2;
        this._turnSpeed = Math.PI;
        this._gravity = 9.8;
        this._minSlopeLimit = 30;
        this._maxSlopeLimit = 45;
        this._sl = Math.PI * this._minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
        this._stepOffset = 0.25;
        this._vMoveTot = 0;
        this._vMovStartPos = babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
        this._walk = new _AnimData("walk");
        this._walkBack = new _AnimData("walkBack");
        this._idle = new _AnimData("idle");
        this._idleJump = new _AnimData("idleJump");
        this._run = new _AnimData("run");
        this._runJump = new _AnimData("runJump");
        this._fall = new _AnimData("fall");
        this._turnLeft = new _AnimData("turnLeft");
        this._turnRight = new _AnimData("turnRight");
        this._strafeLeft = new _AnimData("strafeLeft");
        this._strafeRight = new _AnimData("strafeRight");
        this._slideBack = new _AnimData("slideBack");
        this._anims = [this._walk, this._walkBack, this._idle, this._idleJump, this._run, this._runJump, this._fall, this._turnLeft, this._turnRight, this._strafeLeft, this._strafeRight, this._slideBack];
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
        this._turning = false;
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
    CharacterController.prototype.setAvatar = function (avatar) {
        this._avatar = avatar;
    };
    CharacterController.prototype.setAvatarSkeleton = function (skeleton) {
        this._skeleton = skeleton;
        this.checkAnims(skeleton);
    };
    CharacterController.prototype.setSlopeLimit = function (minSlopeLimit, maxSlopeLimit) {
        this._minSlopeLimit = minSlopeLimit;
        this._maxSlopeLimit = maxSlopeLimit;
        this._sl = Math.PI * minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
    };
    CharacterController.prototype.setStepOffset = function (stepOffset) {
        this._stepOffset = stepOffset;
    };
    CharacterController.prototype.setWalkSpeed = function (n) {
        this._walkSpeed = n;
    };
    CharacterController.prototype.setRunSpeed = function (n) {
        this._runSpeed = n;
    };
    CharacterController.prototype.setBackSpeed = function (n) {
        this._backSpeed = n;
    };
    CharacterController.prototype.setJumpSpeed = function (n) {
        this._jumpSpeed = n;
    };
    CharacterController.prototype.setLeftSpeed = function (n) {
        this._leftSpeed = n;
    };
    CharacterController.prototype.setRightSpeed = function (n) {
        this._rightSpeed = n;
    };
    CharacterController.prototype.setTurnSpeed = function (n) {
        this._turnSpeed = n * Math.PI / 180;
    };
    CharacterController.prototype.setGravity = function (n) {
        this._gravity = n;
    };
    CharacterController.prototype.setAnimationGroups = function (agMap) {
        this._isAG = true;
        for (var _i = 0, _a = this._anims; _i < _a.length; _i++) {
            var anim = _a[_i];
            if (agMap[anim._name] != null) {
                anim._ag = agMap[anim._name];
                anim._exist = true;
            }
        }
    };
    CharacterController.prototype.setAnimationRanges = function (arMap) {
        this._isAG = false;
        var arData;
        for (var _i = 0, _a = this._anims; _i < _a.length; _i++) {
            var anim = _a[_i];
            arData = arMap[anim._name];
            if (arData != null) {
                if (arData instanceof Object) {
                    if (arData["name"])
                        anim._name = arData["name"];
                    if (arData["loop"])
                        anim._loop = arData["loop"];
                    if (arData["rate"])
                        anim._loop = arData["rate"];
                }
                else {
                    anim._name = arData;
                }
                anim._exist = true;
            }
        }
    };
    CharacterController.prototype.setAnim = function (anim, rangeName, rate, loop) {
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
            for (var _i = 0, _a = this._anims; _i < _a.length; _i++) {
                var anim = _a[_i];
                if (anim._exist) {
                    var ar = anim._ag;
                    for (var _b = 0, _c = ar.targetedAnimations; _b < _c.length; _b++) {
                        var ta = _c[_b];
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
            for (var _i = 0, _a = this._anims; _i < _a.length; _i++) {
                var anim = _a[_i];
                if (anim._exist) {
                    var ar = anim._ag;
                    for (var _b = 0, _c = ar.targetedAnimations; _b < _c.length; _b++) {
                        var ta = _c[_b];
                        ta.animation.enableBlending = false;
                    }
                }
            }
        }
    };
    CharacterController.prototype.setWalkAnim = function (rangeName, rate, loop) {
        this.setAnim(this._walk, rangeName, rate, loop);
    };
    CharacterController.prototype.setRunAnim = function (rangeName, rate, loop) {
        this.setAnim(this._run, rangeName, rate, loop);
    };
    CharacterController.prototype.setWalkBackAnim = function (rangeName, rate, loop) {
        this.setAnim(this._walkBack, rangeName, rate, loop);
    };
    CharacterController.prototype.setSlideBackAnim = function (rangeName, rate, loop) {
        this.setAnim(this._slideBack, rangeName, rate, loop);
    };
    CharacterController.prototype.setIdleAnim = function (rangeName, rate, loop) {
        this.setAnim(this._idle, rangeName, rate, loop);
    };
    CharacterController.prototype.setTurnRightAnim = function (rangeName, rate, loop) {
        this.setAnim(this._turnRight, rangeName, rate, loop);
    };
    CharacterController.prototype.setTurnLeftAnim = function (rangeName, rate, loop) {
        this.setAnim(this._turnLeft, rangeName, rate, loop);
    };
    CharacterController.prototype.setStrafeRightAnim = function (rangeName, rate, loop) {
        this.setAnim(this._strafeRight, rangeName, rate, loop);
    };
    CharacterController.prototype.setStrafeLeftAnim = function (rangeName, rate, loop) {
        this.setAnim(this._strafeLeft, rangeName, rate, loop);
    };
    CharacterController.prototype.setIdleJumpAnim = function (rangeName, rate, loop) {
        this.setAnim(this._idleJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setRunJumpAnim = function (rangeName, rate, loop) {
        this.setAnim(this._runJump, rangeName, rate, loop);
    };
    CharacterController.prototype.setFallAnim = function (rangeName, rate, loop) {
        this.setAnim(this._fall, rangeName, rate, loop);
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
        for (var _i = 0, _a = this._anims; _i < _a.length; _i++) {
            var anim = _a[_i];
            if (skel != null) {
                if (skel.getAnimationRange(anim._name) != null)
                    anim._exist = true;
            }
            else {
                anim._exist = false;
            }
        }
    };
    CharacterController.prototype.setMode = function (n) {
        this.mode = n;
        this._saveMode = n;
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
        for (var _i = 0, _a = this._anims; _i < _a.length; _i++) {
            var anim = _a[_i];
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
                        anim._ag.play(anim._loop);
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
        anim = this._runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
        }
        var js = this._jumpSpeed - this._gravity * this._jumpTime;
        var jumpDist = js * dt - 0.5 * this._gravity * dt * dt;
        this._jumpTime = this._jumpTime + dt;
        var forwardDist = 0;
        var disp;
        if (this.mode != 1)
            this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        if (this._wasRunning || this._wasWalking) {
            if (this._wasRunning) {
                forwardDist = this._runSpeed * dt;
            }
            else if (this._wasWalking) {
                forwardDist = this._walkSpeed * dt;
            }
            disp = this._moveVector.clone();
            disp.y = 0;
            disp = disp.normalize();
            disp.scaleToRef(forwardDist, disp);
            disp.y = jumpDist;
        }
        else {
            disp = new babylonjs__WEBPACK_IMPORTED_MODULE_0__["Vector3"](0, jumpDist, 0);
            anim = this._idleJump;
        }
        this._avatar.moveWithCollisions(disp);
        if (jumpDist < 0) {
            if ((this._avatar.position.y > this._avStartPos.y) || ((this._avatar.position.y === this._avStartPos.y) && (disp.length() > 0.001))) {
                this._endJump();
            }
            else if (this._avatar.position.y < this._jumpStartPosY) {
                var actDisp = this._avatar.position.subtract(this._avStartPos);
                if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                    if (this._verticalSlope(actDisp) <= this._sl) {
                        this._endJump();
                    }
                }
                else {
                    anim = this._fall;
                }
            }
        }
        return anim;
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
            if (this.mode != 1) {
                this._avatar.rotation.y = this._av2cam - this._camera.alpha;
            }
            var sign = void 0;
            switch (true) {
                case (this._act._walk):
                    var forwardDist = 0;
                    if (this._act._walkMod) {
                        this._wasRunning = true;
                        forwardDist = this._runSpeed * dt;
                        anim = this._run;
                    }
                    else {
                        this._wasWalking = true;
                        forwardDist = this._walkSpeed * dt;
                        anim = this._walk;
                    }
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, this._ffSign * forwardDist);
                    moving = true;
                    break;
                case (this._act._walkback):
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._ffSign * (this._backSpeed * dt));
                    anim = this._walkBack;
                    moving = true;
                    break;
                case (this._act._stepLeft):
                    sign = this._signRHS * this._isAvFacingCamera();
                    this._moveVector = this._avatar.calcMovePOV(sign * (this._leftSpeed * dt), -this._freeFallDist, 0);
                    anim = (-this._ffSign * sign > 0) ? this._strafeLeft : this._strafeRight;
                    moving = true;
                    break;
                case (this._act._stepRight):
                    sign = -this._signRHS * this._isAvFacingCamera();
                    this._moveVector = this._avatar.calcMovePOV(sign * (this._rightSpeed * dt), -this._freeFallDist, 0);
                    anim = (-this._ffSign * sign > 0) ? this._strafeLeft : this._strafeRight;
                    moving = true;
            }
        }
        if ((!this._act._stepLeft && !this._act._stepRight) && (this._act._turnLeft || this._act._turnRight)) {
            if (this.mode == 1) {
                if (!this._turning) {
                    this._sign = -this._ffSign * this._isAvFacingCamera();
                    if (this._isRHS)
                        this._sign = -this._sign;
                    this._turning = true;
                }
                var a = this._sign;
                if (this._act._turnLeft) {
                    if (this._act._walk) { }
                    else if (this._act._walkback)
                        a = -this._sign;
                    else {
                        anim = (this._sign > 0) ? this._turnRight : this._turnLeft;
                    }
                }
                else {
                    if (this._act._walk)
                        a = -this._sign;
                    else if (this._act._walkback) { }
                    else {
                        a = -this._sign;
                        anim = (this._sign > 0) ? this._turnLeft : this._turnRight;
                    }
                }
                this._avatar.rotation.y = this._avatar.rotation.y + this._turnSpeed * dt * a;
            }
            else {
                var a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback)
                        a = -1;
                    if (!moving)
                        anim = this._turnLeft;
                }
                else {
                    if (this._act._walk)
                        a = -1;
                    if (!moving) {
                        a = -1;
                        anim = this._turnRight;
                    }
                }
                this._camera.alpha = this._camera.alpha + a * this._turnSpeed * dt;
                this._avatar.rotation.y = this._av2cam - this._camera.alpha;
            }
        }
        if (moving) {
            if (this._moveVector.length() > 0.001) {
                this._avatar.moveWithCollisions(this._moveVector);
                if (this._avatar.position.y > this._avStartPos.y) {
                    var actDisp = this._avatar.position.subtract(this._avStartPos);
                    var _sl = this._verticalSlope(actDisp);
                    if (_sl >= this._sl2) {
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
                        if (_sl > this._sl) {
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
                        if (this._verticalSlope(actDisp) <= this._sl) {
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
                            anim = this._fall;
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
            return this._idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        var anim = this._idle;
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
        if (this.mode != 1)
            this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        this._avatar.moveWithCollisions(disp);
        if ((this._avatar.position.y > this._avStartPos.y) || (this._avatar.position.y === this._avStartPos.y)) {
            this._groundIt();
        }
        else if (this._avatar.position.y < this._avStartPos.y) {
            var actDisp = this._avatar.position.subtract(this._avStartPos);
            if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                if (this._verticalSlope(actDisp) <= this._sl) {
                    this._groundIt();
                    this._avatar.position.copyFrom(this._avStartPos);
                }
                else {
                    this._unGroundIt();
                    anim = this._slideBack;
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
                this._act._walkMod = !this._act._walkMod;
                break;
            case "shift":
                this._act._walkMod = true;
                break;
            case "arrowup":
            case this._walkKey:
                this._act._walk = true;
                break;
            case "arrowleft":
            case this._turnLeftKey:
                this._act._turnLeft = true;
                break;
            case "arrowright":
            case this._turnRightKey:
                this._act._turnRight = true;
                break;
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
                this._act._walkMod = false;
                break;
            case "arrowup":
            case this._walkKey:
                this._act._walk = false;
                break;
            case "arrowleft":
            case this._turnLeftKey:
                this._act._turnLeft = false;
                this._turning = false;
                break;
            case "arrowright":
            case this._turnRightKey:
                this._act._turnRight = false;
                this._turning = false;
                break;
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
    CharacterController.prototype.run = function (b) {
        this._act._walk = b;
        this._act._walkMod = b;
    };
    CharacterController.prototype.turnLeft = function (b) {
        this._act._turnLeft = b;
        if (!b)
            this._turning = b;
    };
    CharacterController.prototype.turnRight = function (b) {
        this._act._turnRight = b;
        if (!b)
            this._turning = b;
    };
    CharacterController.prototype.strafeLeft = function (b) {
        this._act._stepLeft = b;
    };
    CharacterController.prototype.strafeRight = function (b) {
        this._act._stepRight = b;
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
    function _AnimData(name) {
        this._loop = true;
        this._rate = 1;
        this._exist = false;
        this._name = name;
    }
    return _AnimData;
}());
var _Action = (function () {
    function _Action() {
        this._walk = false;
        this._walkback = false;
        this._walkMod = false;
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
        this._walkMod = false;
    };
    return _Action;
}());


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