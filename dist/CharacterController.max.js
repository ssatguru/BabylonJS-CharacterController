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

/***/ "./src/xr/XRController.ts":
/*!********************************!*\
  !*** ./src/xr/XRController.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "XRController": () => (/* binding */ XRController)
/* harmony export */ });
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs */ "babylonjs");
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _XRLocomotion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./XRLocomotion */ "./src/xr/XRLocomotion.ts");
/* harmony import */ var _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./XRInputMapping */ "./src/xr/XRInputMapping.ts");
/* harmony import */ var _XRSupport__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./XRSupport */ "./src/xr/XRSupport.ts");
/* harmony import */ var _XROrientationSync__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./XROrientationSync */ "./src/xr/XROrientationSync.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};





var DEFAULT_ALPHA_RATE = 0.0075;
var DEFAULT_BETA_RATE = 0.003;
var DEFAULT_RADIUS_RATE = 0.05;
var MAX_ORBIT_RATE = 0.02;
var MAX_RADIUS_RATE = 0.2;
var BETA_MIN_FALLBACK = 0.05;
var BETA_MAX_FALLBACK = Math.PI - 0.05;
var ENTRY_BLEND_FRAMES = 90;
var TELEPORTATION_FEATURE_NAME = "xr-controller-teleportation";
var POINTER_SELECTION_FEATURE_NAME = "xr-controller-pointer-selection";
var RIGHT_RAY_RENDERING_GROUP = 2;
var XRController = (function () {
    function XRController(cc, camera, scene) {
        this._alphaRate = DEFAULT_ALPHA_RATE;
        this._betaRate = DEFAULT_BETA_RATE;
        this._radiusRate = DEFAULT_RADIUS_RATE;
        this._stickDeadzone = _XRLocomotion__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_STICK_DEADZONE;
        this._entryBlendFrame = ENTRY_BLEND_FRAMES;
        this._xrExperience = null;
        this._xrCamera = null;
        this._enabled = false;
        this._stateObserver = null;
        this._renderObserver = null;
        this._triggerObservers = [];
        this._controllerAddedObservers = [];
        this._motionControllerInitObservers = [];
        this._toggleObservers = [];
        this._moveAxesComponent = null;
        this._orbitAxesComponent = null;
        this._fastModifierComponent = null;
        this._lastToggleController = null;
        this._leftRayHidden = false;
        this._rightRingRaised = false;
        this._leftControllerForRay = null;
        this._rightControllerForRay = null;
        this._initialPoseObserver = null;
        this._inXR = false;
        this._sessionType = null;
        this._priorKeyboardEnabled = true;
        this._priorRunning = true;
        this._lastIntent = null;
        this._lastFast = false;
        this._fastModifierPressed = false;
        this._entryBlendOffsetX = 0;
        this._entryBlendOffsetY = 0;
        this._entryBlendOffsetZ = 0;
        this._dollyInComponent = null;
        this._dollyOutComponent = null;
        this._dollyToAvatarActive = false;
        this._dollyToAvatarPriorRadius = 0;
        this._cc = cc;
        this._camera = camera;
        this._scene = scene;
        this._locomotion = new _XRLocomotion__WEBPACK_IMPORTED_MODULE_1__.XRLocomotion();
        this._effectiveMapping = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_XR_INPUT_MAPPING;
        this._alphaRate = DEFAULT_ALPHA_RATE;
        this._betaRate = DEFAULT_BETA_RATE;
        this._radiusRate = DEFAULT_RADIUS_RATE;
        this._stickDeadzone = _XRLocomotion__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_STICK_DEADZONE;
        this._entryBlendFrame = ENTRY_BLEND_FRAMES;
    }
    XRController.prototype.isInXR = function () {
        return this._inXR === true;
    };
    XRController.prototype.enter = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var support, supported, base, sessionMode, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this._enabled) {
                            return [2];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        return [4, (0,_XRSupport__WEBPACK_IMPORTED_MODULE_3__.detectXRSupport)()];
                    case 2:
                        support = _c.sent();
                        supported = type === "ar" ? support.arSupported === true : support.vrSupported === true;
                        if (!supported) {
                            return [2];
                        }
                        base = (_b = this._xrExperience) === null || _b === void 0 ? void 0 : _b.baseExperience;
                        if (base == null || typeof base.enterXRAsync !== "function") {
                            return [2];
                        }
                        this._sessionType = type;
                        sessionMode = type === "ar" ? "immersive-ar" : "immersive-vr";
                        return [4, base.enterXRAsync(sessionMode, "local")];
                    case 3:
                        _c.sent();
                        return [3, 5];
                    case 4:
                        _a = _c.sent();
                        return [3, 5];
                    case 5: return [2];
                }
            });
        });
    };
    XRController.prototype.exit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var base, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this._inXR) {
                            return [2];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        base = (_b = this._xrExperience) === null || _b === void 0 ? void 0 : _b.baseExperience;
                        if (!(base != null && typeof base.exitXRAsync === "function")) return [3, 3];
                        return [4, base.exitXRAsync()];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3: return [3, 5];
                    case 4:
                        _a = _c.sent();
                        return [3, 5];
                    case 5: return [2];
                }
            });
        });
    };
    XRController.prototype.onSessionStart = function (type) {
        try {
            this._sessionType = type;
            this.disableDesktopController();
            this._entryBlendFrame = 0;
            this._entryBlendOffsetX = 0;
            this._entryBlendOffsetY = 0;
            this._entryBlendOffsetZ = 0;
            this._lastIntent = null;
            this._lastFast = false;
            this._fastModifierPressed = false;
            this._triggerObservers = [];
            this._controllerAddedObservers = [];
            this._motionControllerInitObservers = [];
            this._toggleObservers = [];
            this._moveAxesComponent = null;
            this._orbitAxesComponent = null;
            this._fastModifierComponent = null;
            this._lastToggleController = null;
            this._leftRayHidden = false;
            this._rightRingRaised = false;
            this._leftControllerForRay = null;
            this._rightControllerForRay = null;
            this._initialPoseObserver = null;
            this._dollyToAvatarActive = false;
            this._dollyToAvatarPriorRadius = 0;
            this._registerInitialPoseHook();
            var noFirstPerson = this._readNoFirstPerson();
            var mode = noFirstPerson === false ? "firstPerson" : "thirdPerson";
            var canFirstPerson = noFirstPerson === false;
            try {
                this._locomotion.setMode(mode, canFirstPerson);
            }
            catch (_a) {
            }
            this.applyLocomotionMode(mode);
            this._buildEffectiveMapping();
            this._bindInputs(this._xrExperience);
            this._startRenderObserver();
        }
        catch (_b) {
        }
    };
    XRController.prototype.onSessionEnd = function () {
        if (!this._inXR) {
            return;
        }
        try {
            this._stopAllMovement();
            this.detachSessionObservers();
            this._clearSessionCaptures();
            this.restoreDesktopController();
            this.restoreArcRotateMode();
        }
        catch (_a) {
        }
    };
    XRController.prototype.disableDesktopController = function () {
        var _a, _b, _c, _d;
        try {
            this._priorKeyboardEnabled = ((_b = (_a = this._cc).isKeyBoardEnabled) === null || _b === void 0 ? void 0 : _b.call(_a)) === true;
        }
        catch (_e) {
            this._priorKeyboardEnabled = true;
        }
        this._priorRunning = true;
        try {
            (_d = (_c = this._cc).enableKeyBoard) === null || _d === void 0 ? void 0 : _d.call(_c, false);
        }
        catch (_f) {
        }
    };
    XRController.prototype.restoreDesktopController = function () {
        var _a, _b;
        try {
            (_b = (_a = this._cc).enableKeyBoard) === null || _b === void 0 ? void 0 : _b.call(_a, this._priorKeyboardEnabled);
        }
        catch (_c) {
        }
        void this._priorRunning;
    };
    XRController.prototype.enable = function (xr) {
        return __awaiter(this, void 0, void 0, function () {
            var experience, camera, adopted, observer, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        experience = null;
                        camera = null;
                        if (!(xr != null)) return [3, 1];
                        adopted = this._adoptProvided(xr);
                        experience = adopted.experience;
                        camera = adopted.camera;
                        return [3, 3];
                    case 1: return [4, this._createDefaultExperience()];
                    case 2:
                        experience = _b.sent();
                        camera = this._extractCameraFromExperience(experience);
                        _b.label = 3;
                    case 3:
                        if (experience == null && camera == null) {
                            return [2, false];
                        }
                        observer = this._registerStateObserver(experience);
                        if (this._enabled) {
                            this._unregisterStateObserver();
                        }
                        this._xrExperience = experience;
                        this._xrCamera = camera;
                        this._stateObserver = observer;
                        this._enabled = true;
                        return [2, true];
                    case 4:
                        _a = _b.sent();
                        return [2, false];
                    case 5: return [2];
                }
            });
        });
    };
    XRController.prototype.disable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this._enabled) {
                    return [2];
                }
                try {
                    if (this._inXR) {
                        this.restoreArcRotateMode();
                    }
                }
                finally {
                    this._unregisterStateObserver();
                    this._xrExperience = null;
                    this._xrCamera = null;
                    this._inXR = false;
                    this._enabled = false;
                }
                return [2];
            });
        });
    };
    XRController.prototype._adoptProvided = function (xr) {
        var _a;
        try {
            var asExperience = xr;
            if (asExperience != null && asExperience.baseExperience != null) {
                return {
                    experience: asExperience,
                    camera: this._extractCameraFromExperience(asExperience),
                };
            }
            return { experience: null, camera: (_a = xr) !== null && _a !== void 0 ? _a : null };
        }
        catch (_b) {
            return { experience: null, camera: null };
        }
    };
    XRController.prototype._createDefaultExperience = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scene, experience, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        scene = this._scene;
                        if (scene == null || typeof scene.createDefaultXRExperienceAsync !== "function") {
                            return [2, null];
                        }
                        return [4, scene.createDefaultXRExperienceAsync({ disableTeleportation: true })];
                    case 1:
                        experience = _b.sent();
                        return [2, experience !== null && experience !== void 0 ? experience : null];
                    case 2:
                        _a = _b.sent();
                        return [2, null];
                    case 3: return [2];
                }
            });
        });
    };
    XRController.prototype._extractCameraFromExperience = function (experience) {
        var _a;
        try {
            var base = experience === null || experience === void 0 ? void 0 : experience.baseExperience;
            return (_a = base === null || base === void 0 ? void 0 : base.camera) !== null && _a !== void 0 ? _a : null;
        }
        catch (_b) {
            return null;
        }
    };
    XRController.prototype._registerStateObserver = function (experience) {
        var _this = this;
        var _a, _b;
        try {
            var observable = (_a = experience === null || experience === void 0 ? void 0 : experience.baseExperience) === null || _a === void 0 ? void 0 : _a.onStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return null;
            }
            return (_b = observable.add(function (state) { return _this._onStateChanged(state); })) !== null && _b !== void 0 ? _b : null;
        }
        catch (_c) {
            return null;
        }
    };
    XRController.prototype._unregisterStateObserver = function () {
        var _a, _b;
        try {
            var observable = (_b = (_a = this._xrExperience) === null || _a === void 0 ? void 0 : _a.baseExperience) === null || _b === void 0 ? void 0 : _b.onStateChangedObservable;
            if (observable != null && typeof observable.remove === "function" && this._stateObserver != null) {
                observable.remove(this._stateObserver);
            }
        }
        catch (_c) {
        }
        finally {
            this._stateObserver = null;
        }
    };
    XRController.prototype._onStateChanged = function (state) {
        var _a;
        try {
            if (state === babylonjs__WEBPACK_IMPORTED_MODULE_0__.WebXRState.IN_XR) {
                this._inXR = true;
                this.onSessionStart((_a = this._sessionType) !== null && _a !== void 0 ? _a : "vr");
            }
            else if (state === babylonjs__WEBPACK_IMPORTED_MODULE_0__.WebXRState.NOT_IN_XR) {
                this.onSessionEnd();
                this._inXR = false;
            }
        }
        catch (_b) {
        }
    };
    XRController.prototype._readNoFirstPerson = function () {
        var _a, _b;
        try {
            var settings = (_b = (_a = this._cc).getSettings) === null || _b === void 0 ? void 0 : _b.call(_a);
            return (settings === null || settings === void 0 ? void 0 : settings.noFirstPerson) === true;
        }
        catch (_c) {
            return false;
        }
    };
    XRController.prototype._registerInitialPoseHook = function () {
        var _this = this;
        var _a;
        try {
            var base = (_a = this._xrExperience) === null || _a === void 0 ? void 0 : _a.baseExperience;
            var poseObservable = base === null || base === void 0 ? void 0 : base.onInitialXRPoseSetObservable;
            if (poseObservable != null && typeof poseObservable.add === "function") {
                var observer = poseObservable.add(function () {
                    try {
                        _this._seedXRCameraOntoFollowPose();
                    }
                    catch (_a) {
                    }
                    finally {
                        _this._removeInitialPoseObserver();
                    }
                });
                this._initialPoseObserver = { observable: poseObservable, observer: observer };
                return;
            }
            this._seedXRCameraOntoFollowPose();
        }
        catch (_b) {
        }
    };
    XRController.prototype._seedXRCameraOntoFollowPose = function () {
        var _a;
        try {
            var xr = this._xrCamera;
            if (xr == null) {
                return;
            }
            var arc = this._camera;
            if (typeof xr.setTransformationFromNonVRCamera === "function") {
                xr.setTransformationFromNonVRCamera(this._camera, true);
            }
            var arcY = typeof ((_a = arc === null || arc === void 0 ? void 0 : arc.position) === null || _a === void 0 ? void 0 : _a.y) === "number" ? arc.position.y : 0;
            var rwh = typeof xr.realWorldHeight === "number" && isFinite(xr.realWorldHeight) ? xr.realWorldHeight : 0;
            if (xr.position != null && typeof xr.position.y === "number") {
                xr.position.y = arcY - rwh;
            }
        }
        catch (_b) {
        }
    };
    XRController.prototype._removeInitialPoseObserver = function () {
        try {
            var entry = this._initialPoseObserver;
            if (entry != null) {
                var observable = entry.observable;
                if (observable != null && typeof observable.remove === "function" && entry.observer != null) {
                    observable.remove(entry.observer);
                }
            }
        }
        catch (_a) {
        }
        finally {
            this._initialPoseObserver = null;
        }
    };
    XRController.prototype.canFirstPerson = function () {
        return this._readNoFirstPerson() === false;
    };
    XRController.prototype._xrFirstPersonCoupled = function () {
        try {
            return this.isInXR() && this.canFirstPerson() && this._readInFirstPerson();
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype._syncArcFromXRCamera = function () {
        try {
            if (!this._xrFirstPersonCoupled()) {
                return;
            }
            var xr = this._xrCamera;
            if (xr == null) {
                return;
            }
            var orientation_1 = this._readHeadsetOrientation(xr);
            if (orientation_1 == null) {
                return;
            }
            var arc = this._camera;
            if (arc == null) {
                return;
            }
            var limits = this._resolveBetaLimits(arc);
            var _a = (0,_XROrientationSync__WEBPACK_IMPORTED_MODULE_4__.deriveArcAngles)(orientation_1, limits), alpha = _a.alpha, beta = _a.beta;
            arc.alpha = alpha;
            arc.beta = beta;
        }
        catch (_b) {
        }
    };
    XRController.prototype._readInFirstPerson = function () {
        var _a, _b;
        try {
            return ((_b = (_a = this._cc).isInFirstPerson) === null || _b === void 0 ? void 0 : _b.call(_a)) === true;
        }
        catch (_c) {
            return false;
        }
    };
    XRController.prototype._readHeadsetOrientation = function (xr) {
        try {
            var cam = xr;
            var quat = cam === null || cam === void 0 ? void 0 : cam.rotationQuaternion;
            if (quat == null || typeof quat.toEulerAngles !== "function") {
                return null;
            }
            var euler = quat.toEulerAngles();
            if (euler == null) {
                return null;
            }
            var yaw = euler.y;
            var pitch = euler.x;
            if (typeof yaw !== "number" || typeof pitch !== "number") {
                return null;
            }
            return { yaw: yaw, pitch: pitch };
        }
        catch (_a) {
            return null;
        }
    };
    XRController.prototype._resolveBetaLimits = function (arc) {
        var lower = typeof arc.lowerBetaLimit === "number" && isFinite(arc.lowerBetaLimit)
            ? arc.lowerBetaLimit
            : BETA_MIN_FALLBACK;
        var upper = typeof arc.upperBetaLimit === "number" && isFinite(arc.upperBetaLimit)
            ? arc.upperBetaLimit
            : BETA_MAX_FALLBACK;
        return { lower: lower, upper: upper };
    };
    XRController.prototype.applyLocomotionMode = function (mode) {
        var _a, _b;
        this._disableTeleportation();
        try {
            (_b = (_a = this._cc).setNoFirstPerson) === null || _b === void 0 ? void 0 : _b.call(_a, mode !== "firstPerson");
        }
        catch (_c) {
        }
    };
    XRController.prototype.disableTeleportation = function (fm) {
        try {
            if (fm != null && typeof fm.disableFeature === "function") {
                fm.disableFeature(TELEPORTATION_FEATURE_NAME);
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype._disableTeleportation = function () {
        var _a, _b;
        try {
            var fm = (_b = (_a = this._xrExperience) === null || _a === void 0 ? void 0 : _a.baseExperience) === null || _b === void 0 ? void 0 : _b.featuresManager;
            this.disableTeleportation(fm);
        }
        catch (_c) {
        }
    };
    XRController.prototype.handleSelect = function (pick) {
        var _a, _b;
        try {
            if (pick == null) {
                return;
            }
            if ("hit" in pick && !pick.hit) {
                return;
            }
            var point = pick.pickedPoint;
            if (point == null) {
                return;
            }
            var x = point.x, y = point.y, z = point.z;
            if (typeof x !== "number" ||
                typeof y !== "number" ||
                typeof z !== "number" ||
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(z)) {
                return;
            }
            (_b = (_a = this._cc).moveTo) === null || _b === void 0 ? void 0 : _b.call(_a, point);
        }
        catch (_c) {
        }
    };
    XRController.prototype._buildEffectiveMapping = function () {
        try {
            if (this._effectiveMapping == null) {
                this._effectiveMapping = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_XR_INPUT_MAPPING;
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype._bindInputs = function (experience) {
        try {
            this.bindInputs(experience);
        }
        catch (_a) {
        }
    };
    XRController.prototype.bindInputs = function (experience) {
        var _this = this;
        try {
            var input = experience === null || experience === void 0 ? void 0 : experience.input;
            if (input == null) {
                return;
            }
            var existing = Array.isArray(input.controllers) ? input.controllers : [];
            for (var _i = 0, existing_1 = existing; _i < existing_1.length; _i++) {
                var controller = existing_1[_i];
                this._onControllerAdded(controller);
            }
            var observable = input.onControllerAddedObservable;
            if (observable != null && typeof observable.add === "function") {
                var observer = observable.add(function (controller) {
                    try {
                        _this._onControllerAdded(controller);
                    }
                    catch (_a) {
                    }
                });
                this._controllerAddedObservers.push({ observable: observable, observer: observer });
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype.rebindActiveSession = function () {
        try {
            if (!this._inXR) {
                return;
            }
            this._detachBindingObservers();
            this._clearSessionCaptures();
            this.bindInputs(this._xrExperience);
        }
        catch (_a) {
        }
    };
    XRController.prototype._onControllerAdded = function (controller) {
        var _this = this;
        try {
            if (controller == null) {
                return;
            }
            var c = controller;
            if (c.motionController != null) {
                this._wireController(controller, c.motionController);
                return;
            }
            var observable = c.onMotionControllerInitObservable;
            if (observable != null && typeof observable.add === "function") {
                var observer = observable.add(function (mc) {
                    try {
                        _this._wireController(controller, mc);
                    }
                    catch (_a) {
                    }
                });
                this._motionControllerInitObservers.push({ observable: observable, observer: observer });
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype._wireController = function (controller, motionController) {
        try {
            var handedness = this._resolveHandedness(controller, motionController);
            if (handedness == null) {
                return;
            }
            this.bindJump(motionController, handedness);
            this.captureRightDollyButtons(motionController, handedness);
            this._wireMoveAxes(motionController, handedness);
            this._wireOrbitAxes(motionController, handedness);
            this._wireFastModifier(motionController, handedness);
            this._wireToggle(motionController, handedness, _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.DollyToAvatarToggle);
            this._wireToggle(motionController, handedness, _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.LocomotionModeToggle);
            try {
                if (handedness === "left") {
                    this.rememberLeftControllerAndHideRay(controller);
                }
                else if (handedness === "right") {
                    this._rightControllerForRay = controller;
                    this.retryRaiseRightSelectionRing();
                }
            }
            catch (_a) {
            }
        }
        catch (_b) {
        }
    };
    XRController.prototype._resolveHandedness = function (controller, motionController) {
        var _a;
        try {
            var fromMc = motionController === null || motionController === void 0 ? void 0 : motionController.handedness;
            var fromController = (_a = controller === null || controller === void 0 ? void 0 : controller.inputSource) === null || _a === void 0 ? void 0 : _a.handedness;
            var raw = fromMc !== null && fromMc !== void 0 ? fromMc : fromController;
            if (raw === "left" || raw === "right") {
                return raw;
            }
            return null;
        }
        catch (_b) {
            return null;
        }
    };
    XRController.prototype._wireMoveAxes = function (motionController, handedness) {
        var component = this._resolveAxesComponent(motionController, handedness, _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.Move);
        if (component != null) {
            this._moveAxesComponent = component;
        }
    };
    XRController.prototype._wireOrbitAxes = function (motionController, handedness) {
        var component = this._resolveAxesComponent(motionController, handedness, _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.CameraOrbit);
        if (component != null) {
            this._orbitAxesComponent = component;
        }
    };
    XRController.prototype._resolveAxesComponent = function (motionController, handedness, action) {
        var _a, _b, _c;
        try {
            var boundInput = (_a = this._effectiveMapping) === null || _a === void 0 ? void 0 : _a[action];
            if (boundInput == null) {
                return null;
            }
            var resolution = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return null;
            }
            if (resolution.handedness !== handedness || resolution.componentId !== _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.XR_COMPONENT_THUMBSTICK) {
                return null;
            }
            var mc = motionController;
            return (_c = (_b = mc === null || mc === void 0 ? void 0 : mc.getComponent) === null || _b === void 0 ? void 0 : _b.call(mc, resolution.componentId)) !== null && _c !== void 0 ? _c : null;
        }
        catch (_d) {
            return null;
        }
    };
    XRController.prototype._wireFastModifier = function (motionController, handedness) {
        var _this = this;
        var _a, _b;
        try {
            var boundInput = (_a = this._effectiveMapping) === null || _a === void 0 ? void 0 : _a[_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.FastModifier];
            if (boundInput == null) {
                return;
            }
            var resolution = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return;
            }
            if (resolution.handedness !== handedness || resolution.componentId !== _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.XR_COMPONENT_THUMBSTICK) {
                return;
            }
            var mc = motionController;
            var component = (_b = mc === null || mc === void 0 ? void 0 : mc.getComponent) === null || _b === void 0 ? void 0 : _b.call(mc, resolution.componentId);
            this._fastModifierComponent = component !== null && component !== void 0 ? component : null;
            var observable = component === null || component === void 0 ? void 0 : component.onButtonStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }
            var observer = observable.add(function (changed) {
                try {
                    _this._fastModifierPressed = (changed === null || changed === void 0 ? void 0 : changed.pressed) === true;
                }
                catch (_a) {
                }
            });
            this._toggleObservers.push({ observable: observable, observer: observer });
        }
        catch (_c) {
        }
    };
    XRController.prototype._wireToggle = function (motionController, handedness, action) {
        var _this = this;
        var _a, _b;
        try {
            var boundInput = (_a = this._effectiveMapping) === null || _a === void 0 ? void 0 : _a[action];
            if (boundInput == null) {
                return;
            }
            var resolution = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return;
            }
            if (resolution.handedness !== handedness) {
                return;
            }
            var mc = motionController;
            var component = (_b = mc === null || mc === void 0 ? void 0 : mc.getComponent) === null || _b === void 0 ? void 0 : _b.call(mc, resolution.componentId);
            var observable = component === null || component === void 0 ? void 0 : component.onButtonStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }
            var wasPressed_1 = false;
            var observer = observable.add(function (changed) {
                try {
                    var pressed = (changed === null || changed === void 0 ? void 0 : changed.pressed) === true;
                    if (pressed && !wasPressed_1) {
                        if (action === _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.DollyToAvatarToggle) {
                            _this.toggleDollyToAvatar();
                        }
                        else if (action === _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.LocomotionModeToggle) {
                            _this._lastToggleController = motionController;
                            _this.handleToggleRequest();
                        }
                    }
                    wasPressed_1 = pressed;
                }
                catch (_a) {
                }
            });
            this._toggleObservers.push({ observable: observable, observer: observer });
        }
        catch (_c) {
        }
    };
    XRController.prototype.handleToggleRequest = function () {
        try {
            var canFirstPerson = this.canFirstPerson();
            var result = this._locomotion.toggle(canFirstPerson);
            if (result == null) {
                return;
            }
            if (result.changed === true) {
                this.applyLocomotionMode(result.mode);
            }
            if (result.blocked === true) {
                this.emitToggleBlockedFeedback(this._lastToggleController);
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype.emitToggleBlockedFeedback = function (controller) {
        try {
            var haptic = controller;
            if (haptic == null || typeof haptic.pulse !== "function") {
                return;
            }
            var result = haptic.pulse(0.5, 100);
            var thenable = result;
            if (thenable != null && typeof thenable.then === "function") {
                thenable.then(function () { }, function (err) {
                    try {
                        console.log("XRController: blocked-toggle haptic pulse failed", err);
                    }
                    catch (_a) {
                    }
                });
            }
        }
        catch (err) {
            try {
                console.log("XRController: blocked-toggle haptic pulse unavailable", err);
            }
            catch (_a) {
            }
        }
    };
    XRController.prototype._detachBindingObservers = function () {
        this._detachObserverStream(this._controllerAddedObservers);
        this._controllerAddedObservers = [];
        this._detachObserverStream(this._motionControllerInitObservers);
        this._motionControllerInitObservers = [];
        this._detachObserverStream(this._toggleObservers);
        this._toggleObservers = [];
        this._detachTriggerObservers();
    };
    XRController.prototype._detachObserverStream = function (stream) {
        try {
            for (var _i = 0, stream_1 = stream; _i < stream_1.length; _i++) {
                var entry = stream_1[_i];
                try {
                    var observable = entry === null || entry === void 0 ? void 0 : entry.observable;
                    if (observable != null && typeof observable.remove === "function" && entry.observer != null) {
                        observable.remove(entry.observer);
                    }
                }
                catch (_a) {
                }
            }
        }
        catch (_b) {
        }
    };
    XRController.prototype.bindJump = function (motionController, handedness) {
        var _this = this;
        var _a, _b;
        try {
            var boundInput = (_a = this._effectiveMapping) === null || _a === void 0 ? void 0 : _a[_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.Jump];
            if (boundInput == null) {
                return;
            }
            var resolution = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return;
            }
            if (resolution.handedness !== handedness || resolution.componentId !== _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.XR_COMPONENT_TRIGGER) {
                return;
            }
            var mc = motionController;
            var component = (_b = mc === null || mc === void 0 ? void 0 : mc.getComponent) === null || _b === void 0 ? void 0 : _b.call(mc, resolution.componentId);
            var observable = component === null || component === void 0 ? void 0 : component.onButtonStateChangedObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }
            var wasPressed_2 = false;
            var observer = observable.add(function (changed) {
                var _a, _b;
                try {
                    var pressed = (changed === null || changed === void 0 ? void 0 : changed.pressed) === true;
                    if (pressed && !wasPressed_2) {
                        (_b = (_a = _this._cc).jump) === null || _b === void 0 ? void 0 : _b.call(_a);
                    }
                    wasPressed_2 = pressed;
                }
                catch (_c) {
                }
            });
            this._triggerObservers.push({ observable: observable, observer: observer });
        }
        catch (_c) {
        }
    };
    XRController.prototype._detachTriggerObservers = function () {
        try {
            for (var _i = 0, _a = this._triggerObservers; _i < _a.length; _i++) {
                var entry = _a[_i];
                try {
                    var observable = entry === null || entry === void 0 ? void 0 : entry.observable;
                    if (observable != null && typeof observable.remove === "function" && entry.observer != null) {
                        observable.remove(entry.observer);
                    }
                }
                catch (_b) {
                }
            }
        }
        catch (_c) {
        }
        finally {
            this._triggerObservers = [];
        }
    };
    XRController.prototype._startRenderObserver = function () {
        try {
            this.startStickSampler();
        }
        catch (_a) {
        }
    };
    XRController.prototype.startStickSampler = function () {
        var _this = this;
        var _a, _b;
        try {
            this.stopStickSampler();
            var observable = (_a = this._scene) === null || _a === void 0 ? void 0 : _a.onBeforeRenderObservable;
            if (observable == null || typeof observable.add !== "function") {
                return;
            }
            this._renderObserver =
                (_b = observable.add(function () {
                    _this.sampleSticks();
                    if (_this._xrFirstPersonCoupled() && !_this._anyStickActive() && !_this._dollyActive()) {
                        _this._syncArcFromXRCamera();
                    }
                    else {
                        _this._updateXRCameraFollow();
                    }
                    _this._retryRayManagement();
                })) !== null && _b !== void 0 ? _b : null;
        }
        catch (_c) {
        }
    };
    XRController.prototype.stopStickSampler = function () {
        var _a;
        try {
            var observable = (_a = this._scene) === null || _a === void 0 ? void 0 : _a.onBeforeRenderObservable;
            if (observable != null && typeof observable.remove === "function" && this._renderObserver != null) {
                observable.remove(this._renderObserver);
            }
        }
        catch (_b) {
        }
        finally {
            this._renderObserver = null;
        }
    };
    XRController.prototype.sampleSticks = function () {
        try {
            var left = this._readLeftStickInput();
            var intent = (0,_XRLocomotion__WEBPACK_IMPORTED_MODULE_1__.mapStickToIntent)(left, this._stickDeadzone);
            var fast = this._readFastModifier();
            this.applyIntent(intent, fast);
            var right = this._readRightStickInput();
            this.applyCameraOrbit(right.leftX, right.leftY);
            this._applyButtonDolly();
        }
        catch (_a) {
        }
    };
    XRController.prototype.applyIntent = function (intent, fast) {
        var _a;
        try {
            var prev = (_a = this._lastIntent) !== null && _a !== void 0 ? _a : (0,_XRLocomotion__WEBPACK_IMPORTED_MODULE_1__.neutralMoveIntent)();
            var prevFast = this._lastFast === true;
            this.applyMovementDirection(prev, prevFast, intent, fast);
            this._lastIntent = {
                walk: intent.walk === true,
                walkBack: intent.walkBack === true,
                strafeLeft: intent.strafeLeft === true,
                strafeRight: intent.strafeRight === true,
            };
            this._lastFast = fast === true;
        }
        catch (_b) {
        }
    };
    XRController.prototype.applyMovementDirection = function (prev, prevFast, next, nextFast) {
        var _this = this;
        this._edgeCall(prev.walk === true && !prevFast, next.walk === true && !nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).walk) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.walk === true && prevFast, next.walk === true && nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).run) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.walkBack === true && !prevFast, next.walkBack === true && !nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).walkBack) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.walkBack === true && prevFast, next.walkBack === true && nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).walkBackFast) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.strafeLeft === true && !prevFast, next.strafeLeft === true && !nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).strafeLeft) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.strafeLeft === true && prevFast, next.strafeLeft === true && nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).strafeLeftFast) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.strafeRight === true && !prevFast, next.strafeRight === true && !nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).strafeRight) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
        this._edgeCall(prev.strafeRight === true && prevFast, next.strafeRight === true && nextFast, function (b) { var _a, _b; return (_b = (_a = _this._cc).strafeRightFast) === null || _b === void 0 ? void 0 : _b.call(_a, b); });
    };
    XRController.prototype._edgeCall = function (prev, next, call) {
        if (prev === next) {
            return;
        }
        try {
            call(next);
        }
        catch (_a) {
        }
    };
    XRController.prototype.stopAllMovement = function () {
        try {
            this.applyIntent((0,_XRLocomotion__WEBPACK_IMPORTED_MODULE_1__.neutralMoveIntent)(), false);
        }
        catch (_a) {
        }
    };
    XRController.prototype.setStickDeadzone = function (v) {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._stickDeadzone = v < 0 ? 0 : v > 1 ? 1 : v;
        }
        catch (_a) {
        }
    };
    XRController.prototype.setAlphaRate = function (v) {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._alphaRate = v < 0 ? 0 : v > MAX_ORBIT_RATE ? MAX_ORBIT_RATE : v;
        }
        catch (_a) {
        }
    };
    XRController.prototype.setBetaRate = function (v) {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._betaRate = v < 0 ? 0 : v > MAX_ORBIT_RATE ? MAX_ORBIT_RATE : v;
        }
        catch (_a) {
        }
    };
    XRController.prototype.setRadiusRate = function (v) {
        try {
            if (typeof v !== "number" || !isFinite(v)) {
                return;
            }
            this._radiusRate = v < 0 ? 0 : v > MAX_RADIUS_RATE ? MAX_RADIUS_RATE : v;
        }
        catch (_a) {
        }
    };
    XRController.prototype._stopAllMovement = function () {
        try {
            this.stopAllMovement();
            this._lastIntent = null;
            this._lastFast = false;
        }
        catch (_a) {
        }
    };
    XRController.prototype._readLeftStickInput = function () {
        return this._readAxesComponent(this._moveAxesComponent);
    };
    XRController.prototype._readAxesComponent = function (component) {
        try {
            var axes = component === null || component === void 0 ? void 0 : component.axes;
            var x = typeof (axes === null || axes === void 0 ? void 0 : axes.x) === "number" && isFinite(axes.x) ? axes.x : 0;
            var y = typeof (axes === null || axes === void 0 ? void 0 : axes.y) === "number" && isFinite(axes.y) ? axes.y : 0;
            return { leftX: x, leftY: y };
        }
        catch (_a) {
            return { leftX: 0, leftY: 0 };
        }
    };
    XRController.prototype._readRightStickInput = function () {
        return this._readAxesComponent(this._orbitAxesComponent);
    };
    XRController.prototype._anyStickActive = function () {
        try {
            var dz = this._stickDeadzone;
            var dz2 = dz * dz;
            var left = this._readLeftStickInput();
            if (left.leftX * left.leftX + left.leftY * left.leftY > dz2) {
                return true;
            }
            var right = this._readRightStickInput();
            if (right.leftX * right.leftX + right.leftY * right.leftY > dz2) {
                return true;
            }
            return false;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype._dollyActive = function () {
        try {
            return this._isComponentPressed(this._dollyInComponent) || this._isComponentPressed(this._dollyOutComponent);
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype._readFastModifier = function () {
        try {
            return this._fastModifierPressed === true;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype.applyCameraOrbit = function (rightX, rightY) {
        try {
            var arc = this._camera;
            if (arc == null) {
                return;
            }
            var x = typeof rightX === "number" && isFinite(rightX) ? rightX : 0;
            var y = typeof rightY === "number" && isFinite(rightY) ? rightY : 0;
            var dz = this._stickDeadzone;
            var alphaWins = Math.abs(x) >= Math.abs(y);
            var changed = false;
            if (alphaWins) {
                if (Math.abs(x) > dz && typeof arc.alpha === "number") {
                    arc.alpha += this._alphaRate * x;
                    changed = true;
                }
            }
            else {
                if (Math.abs(y) > dz && typeof arc.beta === "number") {
                    arc.beta += this._betaRate * y;
                    this.clampBeta();
                    changed = true;
                }
            }
            if (changed && typeof arc.computeWorldMatrix === "function") {
                arc.computeWorldMatrix(true);
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype.clampBeta = function () {
        try {
            var arc = this._camera;
            if (arc == null || typeof arc.beta !== "number") {
                return;
            }
            var lower = typeof arc.lowerBetaLimit === "number" && isFinite(arc.lowerBetaLimit)
                ? arc.lowerBetaLimit
                : BETA_MIN_FALLBACK;
            var upper = typeof arc.upperBetaLimit === "number" && isFinite(arc.upperBetaLimit)
                ? arc.upperBetaLimit
                : BETA_MAX_FALLBACK;
            if (arc.beta < lower) {
                arc.beta = lower;
            }
            else if (arc.beta > upper) {
                arc.beta = upper;
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype._applyButtonDolly = function () {
        try {
            var arc = this._camera;
            if (arc == null || typeof arc.radius !== "number") {
                return;
            }
            var dollyInHeld = this._isComponentPressed(this._dollyInComponent);
            var dollyOutHeld = this._isComponentPressed(this._dollyOutComponent);
            var changed = false;
            if (dollyInHeld) {
                arc.radius -= this._radiusRate;
                changed = true;
            }
            if (dollyOutHeld) {
                arc.radius += this._radiusRate;
                changed = true;
            }
            if (changed) {
                if (typeof arc.lowerRadiusLimit === "number" &&
                    isFinite(arc.lowerRadiusLimit) &&
                    arc.radius < arc.lowerRadiusLimit) {
                    arc.radius = arc.lowerRadiusLimit;
                }
                if (typeof arc.upperRadiusLimit === "number" &&
                    isFinite(arc.upperRadiusLimit) &&
                    arc.radius > arc.upperRadiusLimit) {
                    arc.radius = arc.upperRadiusLimit;
                }
                if (typeof arc.computeWorldMatrix === "function") {
                    arc.computeWorldMatrix(true);
                }
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype._isComponentPressed = function (component) {
        try {
            return (component === null || component === void 0 ? void 0 : component.pressed) === true;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype.toggleDollyToAvatar = function () {
        try {
            var arc = this._camera;
            if (arc == null || typeof arc.radius !== "number") {
                return;
            }
            if (!this._dollyToAvatarActive) {
                this._dollyToAvatarPriorRadius = arc.radius;
                var lower = typeof arc.lowerRadiusLimit === "number" && isFinite(arc.lowerRadiusLimit)
                    ? arc.lowerRadiusLimit
                    : 0;
                arc.radius = lower;
                this._dollyToAvatarActive = true;
            }
            else {
                arc.radius = this._dollyToAvatarPriorRadius;
                this._dollyToAvatarActive = false;
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype.captureRightDollyButtons = function (motionController, handedness) {
        try {
            if (handedness !== "right") {
                return;
            }
            var mc = motionController;
            if (mc == null || typeof mc.getComponent !== "function") {
                return;
            }
            this._dollyInComponent = this._resolveRightDollyComponent(mc, _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.CameraDollyIn);
            this._dollyOutComponent = this._resolveRightDollyComponent(mc, _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction.CameraDollyOut);
        }
        catch (_a) {
        }
    };
    XRController.prototype._resolveRightDollyComponent = function (mc, action) {
        var _a, _b, _c;
        try {
            var boundInput = (_a = this._effectiveMapping) === null || _a === void 0 ? void 0 : _a[action];
            if (boundInput == null) {
                return null;
            }
            var resolution = _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.INPUT_RESOLUTION[boundInput];
            if (resolution == null) {
                return null;
            }
            if (resolution.handedness !== "right" ||
                (resolution.componentId !== _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.XR_COMPONENT_A_BUTTON &&
                    resolution.componentId !== _XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.XR_COMPONENT_B_BUTTON)) {
                return null;
            }
            return (_c = (_b = mc.getComponent) === null || _b === void 0 ? void 0 : _b.call(mc, resolution.componentId)) !== null && _c !== void 0 ? _c : null;
        }
        catch (_d) {
            return null;
        }
    };
    XRController.prototype._retryRayManagement = function () {
        try {
            this.retryHideLeftControllerRay();
            this.retryRaiseRightSelectionRing();
        }
        catch (_a) {
        }
    };
    XRController.prototype._resolvePointerSelection = function () {
        var _a, _b;
        try {
            var exp = this._xrExperience;
            if (exp == null) {
                return null;
            }
            var fm = (_a = exp.baseExperience) === null || _a === void 0 ? void 0 : _a.featuresManager;
            if (fm != null && typeof fm.getEnabledFeature === "function") {
                try {
                    var feature = fm.getEnabledFeature(POINTER_SELECTION_FEATURE_NAME);
                    if (feature != null) {
                        return feature;
                    }
                }
                catch (_c) {
                }
            }
            return (_b = exp.pointerSelection) !== null && _b !== void 0 ? _b : null;
        }
        catch (_d) {
            return null;
        }
    };
    XRController.prototype._findControllerEntry = function (feature, controller) {
        try {
            if (feature == null || controller == null) {
                return null;
            }
            var controllersMap = feature === null || feature === void 0 ? void 0 : feature._controllers;
            if (controllersMap == null || typeof controllersMap !== "object") {
                return null;
            }
            var uniqueId = controller === null || controller === void 0 ? void 0 : controller.uniqueId;
            if (uniqueId != null) {
                var byKey = controllersMap[String(uniqueId)];
                if (byKey != null) {
                    return byKey;
                }
            }
            for (var _i = 0, _a = Object.keys(controllersMap); _i < _a.length; _i++) {
                var key = _a[_i];
                var entry = controllersMap[key];
                var xrController = entry === null || entry === void 0 ? void 0 : entry.xrController;
                if (xrController != null && xrController === controller) {
                    return entry;
                }
            }
            return null;
        }
        catch (_b) {
            return null;
        }
    };
    XRController.prototype._entryMeshes = function (entry) {
        var meshes = [];
        try {
            var e = entry;
            if (e == null) {
                return meshes;
            }
            if (e.selectionMesh != null) {
                meshes.push(e.selectionMesh);
            }
            if (e.laserPointer != null) {
                meshes.push(e.laserPointer);
            }
        }
        catch (_a) {
        }
        return meshes;
    };
    XRController.prototype.rememberLeftControllerAndHideRay = function (controller) {
        try {
            this._leftControllerForRay = controller;
            this.retryHideLeftControllerRay();
        }
        catch (_a) {
        }
    };
    XRController.prototype.retryHideLeftControllerRay = function () {
        try {
            if (this._leftRayHidden === true) {
                return;
            }
            if (this.hideLeftControllerRay()) {
                this._leftRayHidden = true;
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype.hideLeftControllerRay = function () {
        try {
            var controller = this._leftControllerForRay;
            if (controller == null) {
                return false;
            }
            var feature = this._resolvePointerSelection();
            if (feature == null) {
                return false;
            }
            var entry = this._findControllerEntry(feature, controller);
            if (entry == null) {
                return false;
            }
            var meshes = this._entryMeshes(entry);
            if (meshes.length === 0) {
                return false;
            }
            var hidAny = false;
            for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                var mesh = meshes_1[_i];
                if (this._hideMesh(mesh)) {
                    hidAny = true;
                }
            }
            return hidAny;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype._hideMesh = function (mesh) {
        try {
            var m = mesh;
            if (m == null) {
                return false;
            }
            var applied = false;
            if ("isVisible" in m) {
                m.isVisible = false;
                applied = true;
            }
            if (typeof m.setEnabled === "function") {
                m.setEnabled(false);
                applied = true;
            }
            return applied;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype.retryRaiseRightSelectionRing = function () {
        try {
            if (this._rightRingRaised === true) {
                return;
            }
            if (this.raiseRightSelectionRingRenderingGroup()) {
                this._rightRingRaised = true;
            }
        }
        catch (_a) {
        }
    };
    XRController.prototype.raiseRightSelectionRingRenderingGroup = function () {
        try {
            var controller = this._rightControllerForRay;
            if (controller == null) {
                return false;
            }
            var feature = this._resolvePointerSelection();
            if (feature == null) {
                return false;
            }
            var entry = this._findControllerEntry(feature, controller);
            if (entry == null) {
                return false;
            }
            var meshes = this._entryMeshes(entry);
            if (meshes.length === 0) {
                return false;
            }
            var raisedAny = false;
            for (var _i = 0, meshes_2 = meshes; _i < meshes_2.length; _i++) {
                var mesh = meshes_2[_i];
                if (this._raiseMesh(mesh)) {
                    raisedAny = true;
                }
            }
            return raisedAny;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype._raiseMesh = function (mesh) {
        try {
            var m = mesh;
            if (m == null) {
                return false;
            }
            if ("renderingGroupId" in m) {
                m.renderingGroupId = RIGHT_RAY_RENDERING_GROUP;
                return true;
            }
            return false;
        }
        catch (_a) {
            return false;
        }
    };
    XRController.prototype.resetRayState = function () {
        try {
            this._leftRayHidden = false;
            this._rightRingRaised = false;
            this._leftControllerForRay = null;
            this._rightControllerForRay = null;
        }
        catch (_a) {
        }
    };
    XRController.prototype.getXRCamera = function () {
        return this._xrCamera;
    };
    XRController.prototype._updateXRCameraFollow = function () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            var xr = this._xrCamera;
            if (xr == null) {
                return;
            }
            var arc = this._camera;
            var captureEntryPose = this._entryBlendFrame === 0;
            var entryX = captureEntryPose && typeof ((_a = xr.position) === null || _a === void 0 ? void 0 : _a.x) === "number" ? xr.position.x : 0;
            var entryY = captureEntryPose && typeof ((_b = xr.position) === null || _b === void 0 ? void 0 : _b.y) === "number" ? xr.position.y : 0;
            var entryZ = captureEntryPose && typeof ((_c = xr.position) === null || _c === void 0 ? void 0 : _c.z) === "number" ? xr.position.z : 0;
            if (typeof xr.setTransformationFromNonVRCamera === "function") {
                xr.setTransformationFromNonVRCamera(this._camera, true);
            }
            var arcY = typeof ((_d = arc === null || arc === void 0 ? void 0 : arc.position) === null || _d === void 0 ? void 0 : _d.y) === "number" ? arc.position.y : 0;
            var rwh = typeof xr.realWorldHeight === "number" && isFinite(xr.realWorldHeight) ? xr.realWorldHeight : 0;
            if (xr.position != null && typeof xr.position.y === "number") {
                xr.position.y = arcY - rwh;
            }
            if (this._entryBlendFrame >= ENTRY_BLEND_FRAMES) {
                return;
            }
            var targetX = typeof ((_e = xr.position) === null || _e === void 0 ? void 0 : _e.x) === "number" ? xr.position.x : 0;
            var targetY = typeof ((_f = xr.position) === null || _f === void 0 ? void 0 : _f.y) === "number" ? xr.position.y : 0;
            var targetZ = typeof ((_g = xr.position) === null || _g === void 0 ? void 0 : _g.z) === "number" ? xr.position.z : 0;
            if (captureEntryPose) {
                this._entryBlendOffsetX = entryX - targetX;
                this._entryBlendOffsetY = entryY - targetY;
                this._entryBlendOffsetZ = entryZ - targetZ;
            }
            var progress = (this._entryBlendFrame + 1) / ENTRY_BLEND_FRAMES;
            var ease = this._smoothstep(1 - progress);
            if (xr.position != null) {
                if (typeof xr.position.x === "number") {
                    xr.position.x = targetX + this._entryBlendOffsetX * ease;
                }
                if (typeof xr.position.y === "number") {
                    xr.position.y = targetY + this._entryBlendOffsetY * ease;
                }
                if (typeof xr.position.z === "number") {
                    xr.position.z = targetZ + this._entryBlendOffsetZ * ease;
                }
            }
            this._entryBlendFrame += 1;
        }
        catch (_h) {
        }
    };
    XRController.prototype._smoothstep = function (t) {
        var x = typeof t === "number" && isFinite(t) ? (t < 0 ? 0 : t > 1 ? 1 : t) : 0;
        return x * x * (3 - 2 * x);
    };
    XRController.prototype.detachSessionObservers = function () {
        this._detachSessionObservers();
    };
    XRController.prototype._detachSessionObservers = function () {
        try {
            this.stopStickSampler();
            this._detachBindingObservers();
            this._removeInitialPoseObserver();
            this.resetRayState();
        }
        catch (_a) {
        }
    };
    XRController.prototype._clearSessionCaptures = function () {
        try {
            this._dollyInComponent = null;
            this._dollyOutComponent = null;
            this._moveAxesComponent = null;
            this._orbitAxesComponent = null;
            this._fastModifierComponent = null;
            this._lastToggleController = null;
            this._dollyToAvatarActive = false;
            this._dollyToAvatarPriorRadius = 0;
        }
        catch (_a) {
        }
    };
    XRController.prototype.restoreArcRotateMode = function () {
        this._restoreArcRotateMode();
    };
    XRController.prototype._restoreArcRotateMode = function () {
        var _a, _b, _c;
        try {
            var scene = this._scene;
            if (scene == null || this._camera == null) {
                return;
            }
            scene.activeCamera = this._camera;
            var attach = this._camera.attachControl;
            if (typeof attach === "function") {
                var canvas = (_c = (_a = scene.getEngine) === null || _a === void 0 ? void 0 : (_b = _a.call(scene)).getRenderingCanvas) === null || _c === void 0 ? void 0 : _c.call(_b);
                attach.call(this._camera, canvas, true);
            }
        }
        catch (_d) {
        }
    };
    return XRController;
}());



/***/ }),

/***/ "./src/xr/XRInputMapping.ts":
/*!**********************************!*\
  !*** ./src/xr/XRInputMapping.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AXIS_ACTIONS": () => (/* binding */ AXIS_ACTIONS),
/* harmony export */   "AXIS_INPUTS": () => (/* binding */ AXIS_INPUTS),
/* harmony export */   "BindableAction": () => (/* binding */ BindableAction),
/* harmony export */   "BindableInput": () => (/* binding */ BindableInput),
/* harmony export */   "DEFAULT_XR_INPUT_MAPPING": () => (/* binding */ DEFAULT_XR_INPUT_MAPPING),
/* harmony export */   "INPUT_RESOLUTION": () => (/* binding */ INPUT_RESOLUTION),
/* harmony export */   "XR_COMPONENT_A_BUTTON": () => (/* binding */ XR_COMPONENT_A_BUTTON),
/* harmony export */   "XR_COMPONENT_B_BUTTON": () => (/* binding */ XR_COMPONENT_B_BUTTON),
/* harmony export */   "XR_COMPONENT_SQUEEZE": () => (/* binding */ XR_COMPONENT_SQUEEZE),
/* harmony export */   "XR_COMPONENT_THUMBSTICK": () => (/* binding */ XR_COMPONENT_THUMBSTICK),
/* harmony export */   "XR_COMPONENT_TRIGGER": () => (/* binding */ XR_COMPONENT_TRIGGER),
/* harmony export */   "XR_COMPONENT_X_BUTTON": () => (/* binding */ XR_COMPONENT_X_BUTTON),
/* harmony export */   "XR_COMPONENT_Y_BUTTON": () => (/* binding */ XR_COMPONENT_Y_BUTTON),
/* harmony export */   "isAxisAction": () => (/* binding */ isAxisAction),
/* harmony export */   "isAxisInput": () => (/* binding */ isAxisInput),
/* harmony export */   "mergeXRInputMapping": () => (/* binding */ mergeXRInputMapping),
/* harmony export */   "validateXRInputMapping": () => (/* binding */ validateXRInputMapping)
/* harmony export */ });
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a, _b;
var BindableAction;
(function (BindableAction) {
    BindableAction["Move"] = "Move";
    BindableAction["FastModifier"] = "FastModifier";
    BindableAction["Jump"] = "Jump";
    BindableAction["CameraOrbit"] = "CameraOrbit";
    BindableAction["CameraDollyIn"] = "CameraDollyIn";
    BindableAction["CameraDollyOut"] = "CameraDollyOut";
    BindableAction["DollyToAvatarToggle"] = "DollyToAvatarToggle";
    BindableAction["LocomotionModeToggle"] = "LocomotionModeToggle";
    BindableAction["Teleport"] = "Teleport";
})(BindableAction || (BindableAction = {}));
var BindableInput;
(function (BindableInput) {
    BindableInput["LeftThumbstickAxes"] = "left-thumbstick-axes";
    BindableInput["RightThumbstickAxes"] = "right-thumbstick-axes";
    BindableInput["LeftThumbstickPress"] = "left-thumbstick-press";
    BindableInput["RightThumbstickPress"] = "right-thumbstick-press";
    BindableInput["LeftTrigger"] = "left-trigger";
    BindableInput["RightTrigger"] = "right-trigger";
    BindableInput["LeftGrip"] = "left-grip";
    BindableInput["RightGrip"] = "right-grip";
    BindableInput["LeftAButton"] = "left-a-button";
    BindableInput["LeftBButton"] = "left-b-button";
    BindableInput["LeftXButton"] = "left-x-button";
    BindableInput["LeftYButton"] = "left-y-button";
    BindableInput["RightAButton"] = "right-a-button";
    BindableInput["RightBButton"] = "right-b-button";
    BindableInput["RightXButton"] = "right-x-button";
    BindableInput["RightYButton"] = "right-y-button";
})(BindableInput || (BindableInput = {}));
var AXIS_INPUTS = new Set([
    BindableInput.LeftThumbstickAxes,
    BindableInput.RightThumbstickAxes,
]);
function isAxisInput(input) {
    return AXIS_INPUTS.has(input);
}
var AXIS_ACTIONS = new Set([
    BindableAction.Move,
    BindableAction.CameraOrbit,
]);
function isAxisAction(action) {
    return AXIS_ACTIONS.has(action);
}
var DEFAULT_XR_INPUT_MAPPING = (_a = {},
    _a[BindableAction.Move] = BindableInput.LeftThumbstickAxes,
    _a[BindableAction.FastModifier] = BindableInput.LeftThumbstickPress,
    _a[BindableAction.Jump] = BindableInput.LeftTrigger,
    _a[BindableAction.CameraOrbit] = BindableInput.RightThumbstickAxes,
    _a[BindableAction.CameraDollyIn] = BindableInput.RightBButton,
    _a[BindableAction.CameraDollyOut] = BindableInput.RightAButton,
    _a[BindableAction.DollyToAvatarToggle] = BindableInput.LeftXButton,
    _a[BindableAction.LocomotionModeToggle] = BindableInput.LeftAButton,
    _a[BindableAction.Teleport] = null,
    _a);
var XR_COMPONENT_THUMBSTICK = "xr-standard-thumbstick";
var XR_COMPONENT_TRIGGER = "xr-standard-trigger";
var XR_COMPONENT_SQUEEZE = "xr-standard-squeeze";
var XR_COMPONENT_A_BUTTON = "a-button";
var XR_COMPONENT_B_BUTTON = "b-button";
var XR_COMPONENT_X_BUTTON = "x-button";
var XR_COMPONENT_Y_BUTTON = "y-button";
var INPUT_RESOLUTION = (_b = {},
    _b[BindableInput.LeftThumbstickAxes] = { handedness: "left", componentId: XR_COMPONENT_THUMBSTICK },
    _b[BindableInput.LeftThumbstickPress] = { handedness: "left", componentId: XR_COMPONENT_THUMBSTICK },
    _b[BindableInput.RightThumbstickAxes] = { handedness: "right", componentId: XR_COMPONENT_THUMBSTICK },
    _b[BindableInput.RightThumbstickPress] = { handedness: "right", componentId: XR_COMPONENT_THUMBSTICK },
    _b[BindableInput.LeftTrigger] = { handedness: "left", componentId: XR_COMPONENT_TRIGGER },
    _b[BindableInput.RightTrigger] = { handedness: "right", componentId: XR_COMPONENT_TRIGGER },
    _b[BindableInput.LeftGrip] = { handedness: "left", componentId: XR_COMPONENT_SQUEEZE },
    _b[BindableInput.RightGrip] = { handedness: "right", componentId: XR_COMPONENT_SQUEEZE },
    _b[BindableInput.LeftAButton] = { handedness: "left", componentId: XR_COMPONENT_A_BUTTON },
    _b[BindableInput.LeftBButton] = { handedness: "left", componentId: XR_COMPONENT_B_BUTTON },
    _b[BindableInput.LeftXButton] = { handedness: "left", componentId: XR_COMPONENT_X_BUTTON },
    _b[BindableInput.LeftYButton] = { handedness: "left", componentId: XR_COMPONENT_Y_BUTTON },
    _b[BindableInput.RightAButton] = { handedness: "right", componentId: XR_COMPONENT_A_BUTTON },
    _b[BindableInput.RightBButton] = { handedness: "right", componentId: XR_COMPONENT_B_BUTTON },
    _b[BindableInput.RightXButton] = { handedness: "right", componentId: XR_COMPONENT_X_BUTTON },
    _b[BindableInput.RightYButton] = { handedness: "right", componentId: XR_COMPONENT_Y_BUTTON },
    _b);
function mergeXRInputMapping(partial) {
    var merged = __assign({}, DEFAULT_XR_INPUT_MAPPING);
    if (partial) {
        for (var _i = 0, _a = Object.keys(partial); _i < _a.length; _i++) {
            var key = _a[_i];
            if (Object.prototype.hasOwnProperty.call(partial, key)) {
                merged[key] = partial[key];
            }
        }
    }
    return merged;
}
var ALL_ACTIONS = new Set(Object.values(BindableAction));
var ALL_INPUTS = new Set(Object.values(BindableInput));
function validateXRInputMapping(mapping) {
    if (mapping == null || typeof mapping !== "object") {
        return { applied: false, rejected: true, reason: "Mapping must be an object" };
    }
    var seen = {};
    for (var _i = 0, _a = Object.keys(mapping); _i < _a.length; _i++) {
        var key = _a[_i];
        if (!ALL_ACTIONS.has(key)) {
            return { applied: false, rejected: true, reason: "Unknown action: ".concat(String(key)) };
        }
        var input = mapping[key];
        if (input === null || input === undefined) {
            continue;
        }
        if (!ALL_INPUTS.has(input)) {
            return { applied: false, rejected: true, reason: "Unknown input for action ".concat(key, ": ").concat(String(input)) };
        }
        var actionIsAxis = isAxisAction(key);
        var inputIsAxis = isAxisInput(input);
        if (actionIsAxis && !inputIsAxis) {
            return {
                applied: false,
                rejected: true,
                reason: "Axis action ".concat(key, " cannot be bound to button input ").concat(input),
            };
        }
        if (!actionIsAxis && inputIsAxis) {
            return {
                applied: false,
                rejected: true,
                reason: "Button action ".concat(key, " cannot be bound to axis input ").concat(input),
            };
        }
        var priorAction = seen[input];
        if (priorAction !== undefined) {
            return {
                applied: false,
                rejected: true,
                reason: "Input ".concat(input, " is bound to conflicting actions ").concat(priorAction, " and ").concat(key),
            };
        }
        seen[input] = key;
    }
    return { applied: true, rejected: false };
}


/***/ }),

/***/ "./src/xr/XRLocomotion.ts":
/*!********************************!*\
  !*** ./src/xr/XRLocomotion.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEFAULT_STICK_DEADZONE": () => (/* binding */ DEFAULT_STICK_DEADZONE),
/* harmony export */   "XRLocomotion": () => (/* binding */ XRLocomotion),
/* harmony export */   "mapStickToIntent": () => (/* binding */ mapStickToIntent),
/* harmony export */   "neutralMoveIntent": () => (/* binding */ neutralMoveIntent)
/* harmony export */ });
var XRLocomotion = (function () {
    function XRLocomotion(initial) {
        this._mode = initial !== null && initial !== void 0 ? initial : "thirdPerson";
    }
    XRLocomotion.prototype.getMode = function () {
        return this._mode;
    };
    XRLocomotion.prototype.setMode = function (mode, canFirstPerson) {
        var prior = this._mode;
        if (mode === "firstPerson" && canFirstPerson !== true) {
            return { mode: prior, changed: false, blocked: true };
        }
        this._mode = mode;
        return { mode: this._mode, changed: this._mode !== prior, blocked: false };
    };
    XRLocomotion.prototype.toggle = function (canFirstPerson) {
        var target = this._mode === "thirdPerson" ? "firstPerson" : "thirdPerson";
        return this.setMode(target, canFirstPerson);
    };
    return XRLocomotion;
}());

var DEFAULT_STICK_DEADZONE = 0.15;
function neutralMoveIntent() {
    return { walk: false, walkBack: false, strafeLeft: false, strafeRight: false };
}
function mapStickToIntent(input, deadzone) {
    if (deadzone === void 0) { deadzone = DEFAULT_STICK_DEADZONE; }
    var leftX = input.leftX, leftY = input.leftY;
    var forwardBackWins = Math.abs(leftY) >= Math.abs(leftX);
    if (forwardBackWins) {
        if (Math.abs(leftY) <= deadzone) {
            return neutralMoveIntent();
        }
        return {
            walk: leftY < -deadzone,
            walkBack: leftY > deadzone,
            strafeLeft: false,
            strafeRight: false,
        };
    }
    if (Math.abs(leftX) <= deadzone) {
        return neutralMoveIntent();
    }
    return {
        walk: false,
        walkBack: false,
        strafeLeft: leftX < -deadzone,
        strafeRight: leftX > deadzone,
    };
}


/***/ }),

/***/ "./src/xr/XROrientationSync.ts":
/*!*************************************!*\
  !*** ./src/xr/XROrientationSync.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clampBetaValue": () => (/* binding */ clampBetaValue),
/* harmony export */   "deriveArcAngles": () => (/* binding */ deriveArcAngles),
/* harmony export */   "deriveAvatarYaw": () => (/* binding */ deriveAvatarYaw)
/* harmony export */ });
function deriveArcAngles(orientation, limits) {
    var alpha = deriveAlphaFromYaw(orientation.yaw);
    var rawBeta = deriveBetaFromPitch(orientation.pitch);
    var beta = clampBetaValue(rawBeta, limits);
    return { alpha: alpha, beta: beta };
}
function clampBetaValue(beta, limits) {
    if (!(beta >= limits.lower))
        return limits.lower;
    if (beta > limits.upper)
        return limits.upper;
    return beta;
}
function deriveAvatarYaw(alpha, facingOffset) {
    return facingOffset - alpha;
}
function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}
function deriveAlphaFromYaw(yaw) {
    return normalizeAngle(-yaw + Math.PI / 2);
}
function deriveBetaFromPitch(pitch) {
    return pitch + Math.PI / 2;
}


/***/ }),

/***/ "./src/xr/XRSupport.ts":
/*!*****************************!*\
  !*** ./src/xr/XRSupport.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computeXRSupportResult": () => (/* binding */ computeXRSupportResult),
/* harmony export */   "detectXRSupport": () => (/* binding */ detectXRSupport)
/* harmony export */ });
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs */ "babylonjs");
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs__WEBPACK_IMPORTED_MODULE_0__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

function computeXRSupportResult(vr, ar) {
    return {
        vrSupported: vr === true,
        arSupported: ar === true,
    };
}
function probeSession(mode) {
    return __awaiter(this, void 0, void 0, function () {
        var supported, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4, babylonjs__WEBPACK_IMPORTED_MODULE_0__.WebXRSessionManager.IsSessionSupportedAsync(mode)];
                case 1:
                    supported = _b.sent();
                    return [2, supported === true];
                case 2:
                    _a = _b.sent();
                    return [2, "error"];
                case 3: return [2];
            }
        });
    });
}
function detectXRSupport() {
    return __awaiter(this, void 0, void 0, function () {
        var nav, hasXR, _a, vr, ar;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    nav = typeof navigator !== "undefined" ? navigator : undefined;
                    hasXR = !!nav && !!nav.xr;
                    if (!hasXR) {
                        return [2, computeXRSupportResult(false, false)];
                    }
                    return [4, Promise.all([probeSession("immersive-vr"), probeSession("immersive-ar")])];
                case 1:
                    _a = _b.sent(), vr = _a[0], ar = _a[1];
                    return [2, computeXRSupportResult(vr, ar)];
            }
        });
    });
}


/***/ }),

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
/* harmony export */   "Actions": () => (/* binding */ Actions),
/* harmony export */   "BindableAction": () => (/* reexport safe */ _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableAction),
/* harmony export */   "BindableInput": () => (/* reexport safe */ _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.BindableInput),
/* harmony export */   "CCSettings": () => (/* binding */ CCSettings),
/* harmony export */   "CharacterController": () => (/* binding */ CharacterController),
/* harmony export */   "DEFAULT_XR_INPUT_MAPPING": () => (/* reexport safe */ _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_XR_INPUT_MAPPING),
/* harmony export */   "XRLocomotion": () => (/* reexport safe */ _xr_XRLocomotion__WEBPACK_IMPORTED_MODULE_4__.XRLocomotion),
/* harmony export */   "detectXRSupport": () => (/* reexport safe */ _xr_XRSupport__WEBPACK_IMPORTED_MODULE_5__.detectXRSupport),
/* harmony export */   "mapStickToIntent": () => (/* reexport safe */ _xr_XRLocomotion__WEBPACK_IMPORTED_MODULE_4__.mapStickToIntent),
/* harmony export */   "mergeXRInputMapping": () => (/* reexport safe */ _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.mergeXRInputMapping),
/* harmony export */   "validateXRInputMapping": () => (/* reexport safe */ _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.validateXRInputMapping)
/* harmony export */ });
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs */ "babylonjs");
/* harmony import */ var babylonjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _xr_XRController__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./xr/XRController */ "./src/xr/XRController.ts");
/* harmony import */ var _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./xr/XRInputMapping */ "./src/xr/XRInputMapping.ts");
/* harmony import */ var _xr_XROrientationSync__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./xr/XROrientationSync */ "./src/xr/XROrientationSync.ts");
/* harmony import */ var _xr_XRLocomotion__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./xr/XRLocomotion */ "./src/xr/XRLocomotion.ts");
/* harmony import */ var _xr_XRSupport__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./xr/XRSupport */ "./src/xr/XRSupport.ts");
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};








var FP_MIN_RADIUS = 0.01;
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
        this._xr = null;
        this._xrEffectiveMapping = __assign({}, _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_XR_INPUT_MAPPING);
        this._gravity = 9.8;
        this._minSlopeLimit = 30;
        this._maxSlopeLimit = 45;
        this._sl1 = Math.PI * this._minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
        this._stepOffset = 0.25;
        this._actionMap = new ActionMap();
        this._cameraElastic = true;
        this._cameraTarget = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
        this._noFirstPerson = false;
        this._down = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.DownReadOnly;
        this._mode = 0;
        this._saveMode = 0;
        this._saveSmoothTurnSpeed = 0;
        this._isLHS_RHS = false;
        this._signLHS_RHS = -1;
        this._started = false;
        this._stopAnim = false;
        this._prevActData = null;
        this._activeActData = null;
        this._avStartPos = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
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
        this._moveVector = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
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
        this._fpSavedRadius = null;
        this._fpSavedLowerRadiusLimit = null;
        this._fpExitThreshold = null;
        this._visiblityMap = new Map();
        this._ray = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Ray(babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero(), babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.One(), 1);
        this._rayDir = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Zero();
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
        var success = this.setCharacter(avatar, faceForward);
        if (!success) {
            console.error("unable to set character");
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
    CharacterController.prototype.getActiveActions = function () {
        var actions = [];
        var fast = this._act._speedMod;
        if (this._act._jump)
            actions.push(Actions.IDLEJUMP);
        if (this._act._walk)
            actions.push(fast ? Actions.RUN : Actions.WALK);
        if (this._act._walkback)
            actions.push(fast ? Actions.WALKBACKFAST : Actions.WALKBACK);
        if (this._act._turnLeft)
            actions.push(fast ? Actions.TURNLEFTFAST : Actions.TURNLEFT);
        if (this._act._turnRight)
            actions.push(fast ? Actions.TURNRIGHTFAST : Actions.TURNRIGHT);
        if (this._act._stepLeft)
            actions.push(fast ? Actions.STRAFELEFTFAST : Actions.STRAFELEFT);
        if (this._act._stepRight)
            actions.push(fast ? Actions.STRAFERIGHTFAST : Actions.STRAFERIGHT);
        if (this._activeActData != null) {
            var id = this._activeActData.id;
            if ((id === Actions.FALL || id === Actions.SLIDEBACK) && actions.indexOf(id) < 0) {
                actions.push(id);
            }
        }
        if (actions.length === 0)
            actions.push(Actions.IDLE);
        return actions;
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
            this._avatar.rotationQuaternion = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Quaternion.RotationYawPitchRoll(euler.y, euler.x, euler.z);
        }
        else {
            this._avatar.rotation.y = angle;
        }
    };
    CharacterController.prototype._addToAvatarRotationY = function (angle) {
        if (this._avatar.rotationQuaternion) {
            var euler = this._avatar.rotationQuaternion.toEulerAngles();
            euler.y += angle;
            this._avatar.rotationQuaternion = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Quaternion.RotationYawPitchRoll(euler.y, euler.x, euler.z);
        }
        else {
            this._avatar.rotation.y += angle;
        }
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
            return -1;
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
        this._activeActData = actData;
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
        this._followArcInFirstPerson();
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
            var cosTheta = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Dot(this._avatar.forward, actDisp.normalize());
            fwd = (cosTheta >= 0) ? true : false;
        }
        var fact = (up && fwd) || (!up && !fwd) ? 1 : -1;
        this._avatar.forward.scaleToRef(this._avatar.ellipsoid.x * fact, this._ray.origin);
        this._ray.origin.addToRef(this._avatar.position, this._ray.origin);
        this._ray.origin.addToRef(this._avatar.ellipsoidOffset, this._ray.origin);
        this._ray.length = this._avatar.ellipsoid.y * 2;
        this._ray.direction = this._down;
        if (this._ellipsoid != null) {
            this._drawLines(this._ray.origin, this._ray.origin.add(new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, -this._ray.length, 0)));
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
            this._rayLine = babylonjs__WEBPACK_IMPORTED_MODULE_0__.MeshBuilder.CreateLines("lines", this._lineOptions);
        }
        else {
            this._lineOptions.points[0] = pt1;
            this._lineOptions.points[1] = pt2;
            this._lineOptions.instance = this._rayLine;
            this._rayLine = babylonjs__WEBPACK_IMPORTED_MODULE_0__.MeshBuilder.CreateLines("lines", this._lineOptions);
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
        var disp = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3(0, -this._freeFallDist, 0);
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
            var newDist = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(holdCameraPos, this._camera.target);
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
                        var restoredDir = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3(Math.sin(this._originalBeta) * Math.sin(this._originalAlpha), Math.cos(this._originalBeta), Math.sin(this._originalBeta) * Math.cos(this._originalAlpha));
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
                        var currentDist = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(this._camera.position, this._camera.target);
                        var pathBlocked = false;
                        for (var i = 0; i < verifyPis.length; i++) {
                            var pm = verifyPis[i].pickedMesh;
                            if (this._isSeeAble(pm) || pm.checkCollisions) {
                                var pickDist = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(verifyPis[i].pickedPoint, this._camera.target);
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
        var fpThreshold = (this._inFP && this._fpExitThreshold !== null) ? this._fpExitThreshold : this._camera.lowerRadiusLimit;
        if (this._camera.radius > fpThreshold) {
            if (this._cameraElastic || this._makeInvisible)
                this._handleObstruction();
        }
        if (this._camera.radius <= fpThreshold) {
            if (!this._noFirstPerson && !this._inFP) {
                this._makeMeshInvisible(this._avatar);
                this._camera.checkCollisions = false;
                this._saveMode = this._mode;
                this._saveSmoothTurnSpeed = this._smoothTurnSpeed;
                this._mode = 0;
                this._smoothTurnSpeed = 0;
                this._inFP = true;
                this._fpSavedRadius = this._camera.radius;
                this._fpSavedLowerRadiusLimit = this._camera.lowerRadiusLimit;
                this._fpExitThreshold = this._camera.lowerRadiusLimit;
                this._camera.lowerRadiusLimit = FP_MIN_RADIUS;
                this._camera.radius = FP_MIN_RADIUS;
                this._expectedRadius = this._camera.radius;
            }
            if (this._inFP && fpHoldPos !== null) {
                var distToTarget = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(fpHoldPos, this._camera.target);
                if (distToTarget > fpThreshold) {
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
                if (this._fpSavedLowerRadiusLimit !== null) {
                    this._camera.lowerRadiusLimit = this._fpSavedLowerRadiusLimit;
                }
                this._fpSavedLowerRadiusLimit = null;
                this._fpExitThreshold = null;
                this._fpSavedRadius = null;
                this._expectedRadius = this._camera.radius;
            }
        }
    };
    CharacterController.prototype._makeMeshInvisible = function (mesh) {
        var _this = this;
        this._visiblityMap.set(mesh, mesh.visibility);
        mesh.visibility = 0;
        mesh.getChildMeshes(false, function (n) {
            if (n instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.Mesh) {
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
            if (n instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.Mesh)
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
                        var currentDist = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(this._camera.position, this._camera.target);
                        for (var i = 0; i < springPis.length; i++) {
                            var pm = springPis[i].pickedMesh;
                            if (this._isSeeAble(pm) || pm.checkCollisions) {
                                var pickDist = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(springPis[i].pickedPoint, this._camera.target);
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
    CharacterController.prototype.isInFirstPerson = function () {
        return this._inFP;
    };
    CharacterController.prototype._followArcInFirstPerson = function () {
        if (!this._inFP)
            return;
        if (this._mode == 1)
            return;
        if (!this._hasCam || this._camera == null)
            return;
        this._setAvatarRotationY((0,_xr_XROrientationSync__WEBPACK_IMPORTED_MODULE_3__.deriveAvatarYaw)(this._camera.alpha, this._av2cam));
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
        this._act._jump = true;
    };
    CharacterController.prototype.fall = function () {
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
        else if (target instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.TransformNode) {
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
        if (target instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.TransformNode) {
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
    CharacterController.prototype._getAbstractMeshChildren = function (tn) {
        var ms = new Array();
        if (tn instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.AbstractMesh)
            ms.push(tn);
        tn.getChildren(function (cm) {
            if (cm instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.AbstractMesh)
                ms.push(cm);
            return false;
        }, false);
        return ms;
    };
    CharacterController.prototype.setCharacter = function (character, faceForward) {
        if (faceForward === void 0) { faceForward = false; }
        var rootNode = this._root(character);
        if (rootNode instanceof babylonjs__WEBPACK_IMPORTED_MODULE_0__.Mesh) {
            this._avatar = rootNode;
        }
        else {
            console.error("Cannot move this mesh. The root node of the mesh provided is not a mesh");
            return false;
        }
        this._avChildren = this._getAbstractMeshChildren(rootNode);
        this._skeleton = this._findSkel(character);
        this._isAG = this._containsAG(character, this._scene.animationGroups, true);
        this._actionMap.reset();
        if (!this._isAG && this._skeleton != null)
            this._checkAnimRanges(this._skeleton);
        this._setRHS(character);
        this.setFaceForward(faceForward);
        return true;
    };
    CharacterController.prototype.setAvatar = function (avatar, faceForward) {
        if (faceForward === void 0) { faceForward = false; }
        return this.setCharacter(avatar, faceForward);
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
        var ellipsoid = new babylonjs__WEBPACK_IMPORTED_MODULE_0__.TransformNode("ellipsoid", this._scene);
        var a = this._avatar.ellipsoid.x;
        var b = this._avatar.ellipsoid.y;
        var points = [];
        for (var theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
            points.push(new BABYLON.Vector3(0, b * Math.sin(theta), a * Math.cos(theta)));
        }
        var ellipse = [];
        ellipse[0] = babylonjs__WEBPACK_IMPORTED_MODULE_0__.MeshBuilder.CreateLines("e", { points: points }, this._scene);
        ellipse[0].color = babylonjs__WEBPACK_IMPORTED_MODULE_0__.Color3.Red();
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
    CharacterController.prototype.getCharacter = function () {
        return this._avatar;
    };
    CharacterController.prototype.getAvatar = function () {
        return this.getCharacter();
    };
    CharacterController.prototype.setCharacterSkeleton = function (skeleton) {
        this._skeleton = skeleton;
        if (this._skeleton != null && this._skelDrivenByAG(skeleton))
            this._isAG = true;
        else
            this._isAG = false;
        if (!this._isAG && this._skeleton != null)
            this._checkAnimRanges(this._skeleton);
    };
    CharacterController.prototype.setAvatarSkeleton = function (skeleton) {
        this.setCharacterSkeleton(skeleton);
    };
    CharacterController.prototype._skelDrivenByAG = function (skeleton) {
        var _this = this;
        return skeleton.animations.some(function (sa) { return _this._scene.animationGroups.some(function (ag) { return ag.children.some(function (ta) { return ta.animation == sa; }); }); });
    };
    CharacterController.prototype.getSkeleton = function () {
        return this._skeleton;
    };
    CharacterController.prototype.enableXR = function (xr) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this._xr == null) {
                    this._xr = new _xr_XRController__WEBPACK_IMPORTED_MODULE_1__.XRController(this, this._camera, this._scene);
                    this._applyXRMappingToController(this._xrEffectiveMapping);
                }
                return [2, this._xr.enable(xr)];
            });
        });
    };
    CharacterController.prototype.disableXR = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._xr == null) {
                            return [2];
                        }
                        return [4, this._xr.disable()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    CharacterController.prototype.enterXR = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._xr == null) {
                            return [2];
                        }
                        return [4, this._xr.enter(type)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    CharacterController.prototype.exitXR = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._xr == null) {
                            return [2];
                        }
                        return [4, this._xr.exit()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    CharacterController.prototype.isInXR = function () {
        if (this._xr == null) {
            return false;
        }
        return this._xr.isInXR();
    };
    CharacterController.prototype.getXRCamera = function () {
        if (this._xr == null) {
            return null;
        }
        return this._xr.getXRCamera();
    };
    CharacterController.prototype.isXRSupported = function () {
        return __awaiter(this, void 0, void 0, function () {
            var xr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this._xr == null) {
                            return [2, { vrSupported: false, arSupported: false }];
                        }
                        xr = this._xr;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        if (!(typeof xr.isXRSupported === "function")) return [3, 3];
                        return [4, xr.isXRSupported()];
                    case 2: return [2, _b.sent()];
                    case 3: return [3, 5];
                    case 4:
                        _a = _b.sent();
                        return [3, 5];
                    case 5: return [2, { vrSupported: false, arSupported: false }];
                }
            });
        });
    };
    CharacterController.prototype.setXRStickDeadzone = function (v) {
        if (this._xr == null) {
            return;
        }
        this._xr.setStickDeadzone(v);
    };
    CharacterController.prototype.setXROrbitAlphaRate = function (v) {
        this._callXRSetter("setAlphaRate", v);
    };
    CharacterController.prototype.setXROrbitBetaRate = function (v) {
        this._callXRSetter("setBetaRate", v);
    };
    CharacterController.prototype.setXRDollyRate = function (v) {
        this._callXRSetter("setRadiusRate", v);
    };
    CharacterController.prototype.setXRInputMapping = function (mapping) {
        var merged = (0,_xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.mergeXRInputMapping)(mapping);
        var result = (0,_xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.validateXRInputMapping)(merged);
        if (result.applied) {
            this._xrEffectiveMapping = merged;
            this._applyXRMappingToController(merged);
        }
        return result;
    };
    CharacterController.prototype.getDefaultXRInputMapping = function () {
        return __assign({}, _xr_XRInputMapping__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_XR_INPUT_MAPPING);
    };
    CharacterController.prototype.getEffectiveXRInputMapping = function () {
        return __assign({}, this._xrEffectiveMapping);
    };
    CharacterController.prototype._applyXRMappingToController = function (mapping) {
        if (this._xr == null) {
            return;
        }
        var xr = this._xr;
        try {
            if (typeof xr.setInputMapping === "function") {
                xr.setInputMapping(mapping);
                if (typeof xr.rebindActiveSession === "function") {
                    xr.rebindActiveSession();
                }
            }
        }
        catch (_a) {
        }
    };
    CharacterController.prototype._callXRSetter = function (method, v) {
        if (this._xr == null) {
            return;
        }
        var xr = this._xr;
        try {
            var fn = xr[method];
            if (typeof fn === "function") {
                fn.call(this._xr, v);
            }
        }
        catch (_a) {
        }
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