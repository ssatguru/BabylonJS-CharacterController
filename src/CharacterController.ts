import {
    Skeleton,
    ArcRotateCamera,
    Vector3,
    Mesh,
    Node,
    Scene,
    Ray,
    PickingInfo,
    AnimationGroup,
    TransformNode,
    Matrix
} from "babylonjs"

export class CharacterController {

    private _avatar: Mesh;
    private _skeleton: Skeleton;
    private _camera: ArcRotateCamera;
    private _scene: Scene;
    public getScene(): Scene {
        return this._scene;
    }


    private _gravity: number = 9.8;
    //slopeLimit in degrees
    private _minSlopeLimit: number = 30;
    private _maxSlopeLimit: number = 45;
    //slopeLimit in radians
    private _sl1: number = Math.PI * this._minSlopeLimit / 180;
    private _sl2: number = Math.PI * this._maxSlopeLimit / 180;

    //The av will step up a stair only if it is closer to the ground than the indicated value.
    private _stepOffset: number = 0.25;
    //toal amount by which the av has moved up
    private _vMoveTot: number = 0;
    //position of av when it started moving up
    private _vMovStartPos: Vector3 = Vector3.Zero();


    private _actionMap: _ActionMap = new _ActionMap();

    private _cameraElastic: boolean = true;
    private _cameraTarget: Vector3 = Vector3.Zero();
    //should we go into first person view when camera is near avatar (radius is lowerradius limit)
    private _noFirstPerson: boolean = false;



    public setSlopeLimit(minSlopeLimit: number, maxSlopeLimit: number) {
        this._minSlopeLimit = minSlopeLimit;
        this._maxSlopeLimit = maxSlopeLimit;

        this._sl1 = Math.PI * this._minSlopeLimit / 180;
        this._sl2 = Math.PI * this._maxSlopeLimit / 180;
    }

    /**
     * The av will step up a stair only if it is closer to the ground than the indicated value.
     * Default value is 0.25 m
     */
    public setStepOffset(stepOffset: number) {
        this._stepOffset = stepOffset;
    }

    public setWalkSpeed(n: number) {
        this._actionMap.walk._speed = n;
    }
    public setRunSpeed(n: number) {
        this._actionMap.run._speed = n;
    }
    public setBackSpeed(n: number) {
        this._actionMap.walkBack._speed = n;
    }
    public setBackFastSpeed(n: number) {
        this._actionMap.walkBackFast._speed = n;
    }
    public setJumpSpeed(n: number) {
        this._actionMap.idleJump._speed = n;
        this._actionMap.runJump._speed = n;
    }
    public setLeftSpeed(n: number) {
        this._actionMap.strafeLeft._speed = n;
    }
    public setLeftFastSpeed(n: number) {
        this._actionMap.strafeLeftFast._speed = n;
    }
    public setRightSpeed(n: number) {
        this._actionMap.strafeRight._speed = n;
    }
    public setRightFastSpeed(n: number) {
        this._actionMap.strafeLeftFast._speed = n;
    }
    // get turnSpeed in degrees per second.
    // store in radians per second
    public setTurnSpeed(n: number) {
        this._actionMap.turnLeft._speed = n * Math.PI / 180;
        this._actionMap.turnRight._speed = n * Math.PI / 180;
    }
    public setTurnFastSpeed(n: number) {
        this._actionMap.turnLeftFast._speed = n * Math.PI / 180;
        this._actionMap.turnRightFast._speed = n * Math.PI / 180;
    }
    public setGravity(n: number) {
        this._gravity = n;
    }

    /**
     * Use this to provide animationGroups to the character controller.
     * Provide the AnimationGroups using a Map
     * In this Map the key would be the character controller animation name and
     * the key value would be the animationGroup.
     * Example:
     * let myWalkAnimationGroup:AnimationGroup = ...;
     * let agMap:{} = {
     *  "walk":myWalkAnimationGroup,
     *  "run" : {"ag":myRunAnimationGroup,"rate":1},
     *  "idle" : {"ag":myIdleAnimationGroup,"loop":true,"rate":1},
     *  ....
     *   ....
     * }
     * 
     * @param agMap a map of character controller animation name to animationGroup
     */
    public setAnimationGroups(agMap: {}) {
        if (this._prevAnim != null && this._prevAnim._exist) this._prevAnim._ag.stop();
        this._isAG = true;
        this.setActionData(agMap);
    }

    /**
     * Use this to provide AnimationRanges to the character controller.
     * Provide the AnimationRanges using a Map
     * In this Map the key would be the character controller animation name and
     * the key value would be the animation range name or an object with animation range data.
     * example:
     * let arMap = {
     *  "walk":"myWalk",
     *  "run" : {"name":"myRun","rate":1},
     *  "idle" : {"name":"myIdle","loop":true,"rate":1},
     *  ....
     * }
     * 
     * @param arMap a map of character controller animation name to animationRange data
     */

    public setAnimationRanges(arMap: {}) {
        this._isAG = false;
        this.setActionData(arMap);
    }

    /**
     * sets the action data.
     * 
     * return "ar" or "ag" depending on if the data provided
     * was animation range or animation group data respt.
     * 
     * TODO should validate provided data.
     * In other words if animation range provided make sure
     * the range exist in the skeleton
     * or if animation group provided make sure the animation group
     * can be played on this avataor
     * 
     * @param actmap 
     * @returns 
     */
    public setActionData(actmap: {}): string {
        let agMap: boolean = false;
        let actData: {};
        let keys: string[] = Object.keys(this._actionMap);
        for (let key of keys) {
            let act = this._actionMap[key];
            if (!(act instanceof _ActionData)) continue;
            act._exist = false;
            actData = actmap[act._id];
            if (actData != null) {
                this._hasAnims = true;
                act._exist = true;
                if (actData instanceof AnimationGroup) {
                    act._ag = actData;
                    act._name = act._ag.name
                    agMap = true;
                } else {
                    if (actData instanceof Object) {
                        if (actData["ag"]) {
                            act._ag = actData["ag"];
                            agMap = true;
                        }
                        if (actData["name"]) {
                            act._name = actData["name"];
                        }
                        if (actData["loop"] != null) act._loop = actData["loop"];
                        if (actData["rate"]) act._rate = actData["rate"];
                        if (actData["speed"]) act._speed = actData["speed"];
                        if (actData["key"]) act._speed = actData["key"];
                        if (actData["sound"]) act._speed = actData["sound"];
                    } else {
                        act._name = actData;
                    }

                }
            }
        }
        this._checkFastAnims();
        //force to play new anims
        this._prevAnim = null;
        if (agMap) return "ag"; else return "ar";
    }

    public getActionMap(): {} {
        let map = {};

        let keys: string[] = Object.keys(this._actionMap);
        for (let key of keys) {
            let act = this._actionMap[key];
            if (!(act instanceof _ActionData)) continue;

            let data = {};

            if (this._isAG) data["ag"] = act._ag;
            else data["name"] = act._name;

            data["loop"] = act._loop;
            data["rate"] = act._rate;
            data["speed"] = act._speed;
            data["key"] = act._key;
            data["sound"] = act._sound;
            data["exists"] = act._exist;

            map[act._id] = data;

        }

        return map;
    }

    public getSettings(): CCSettings {
        let ccs: CCSettings = new CCSettings();
        ccs.cameraRotate = this.getMode() == 0 ? true : false;
        ccs.cameraTarget = this._cameraTarget.clone();
        ccs.cameraElastic = this._cameraElastic;
        ccs.gravity = this._gravity;
        ccs.keyboard = this._ekb;
        ccs.maxSlopeLimit = this._maxSlopeLimit;
        ccs.minSlopeLimit = this._minSlopeLimit;
        ccs.noFirstPerson = this._noFirstPerson;
        ccs.stepOffset = this._stepOffset;
        ccs.turningOff = this.isTurningOff();
        return ccs;
    }

    public setSettings(ccs: CCSettings) {
        this.setMode(ccs.cameraRotate ? 0 : 1);
        this.setCameraTarget(ccs.cameraTarget);
        this.setCameraElasticity(ccs.cameraElastic);
        this.setGravity(ccs.gravity);
        this.enableKeyBoard(ccs.keyboard);
        this.setSlopeLimit(ccs.minSlopeLimit, ccs.maxSlopeLimit);
        this.setNoFirstPerson(ccs.noFirstPerson);
        this.setStepOffset(ccs.stepOffset);
        this.setTurningOff(ccs.turningOff);
    }



    private _setAnim(anim: _ActionData, rangeName?: string | AnimationGroup, rate?: number, loop?: boolean) {
        if (!this._isAG && this._skeleton == null) return;
        if (loop != null) anim._loop = loop;
        if (!this._isAG) {
            if (rangeName != null) anim._name = <string>rangeName;
            if (rate != null) anim._rate = rate;
            if (this._skeleton.getAnimationRange(anim._name) != null) {
                anim._exist = true;
            } else {
                anim._exist = false;
            }
        } else {
            if (rangeName != null) {
                anim._ag = <AnimationGroup>rangeName;
                anim._exist = true;
            }
            if (rate != null && anim._exist) {
                anim._rate = rate;
                anim._ag.speedRatio = rate;
            }
        }
    }

    public enableBlending(n: number) {
        if (this._isAG) {
            let keys: string[] = Object.keys(this._actionMap);
            for (let key of keys) {
                let act = this._actionMap[key];
                if (!(act instanceof _ActionData)) continue;
                if (act._exist) {
                    let ar: AnimationGroup = act._ag;
                    for (let ta of ar.targetedAnimations) {
                        ta.animation.enableBlending = true;
                        ta.animation.blendingSpeed = n;
                    }
                }
            }
        } else {
            this._skeleton.enableBlending(n);
        }
    }

    public disableBlending() {
        if (this._isAG) {
            let keys: string[] = Object.keys(this._actionMap);
            for (let key of keys) {
                let anim = this._actionMap[key];
                if (!(anim instanceof _ActionData)) continue;
                if (anim._exist) {
                    let ar: AnimationGroup = anim._ag;
                    for (let ta of ar.targetedAnimations) {
                        ta.animation.enableBlending = false;
                    }
                }
            }
        }
    }

    //setters for animations
    public setWalkAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.walk, rangeName, rate, loop);
    }
    public setRunAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.run, rangeName, rate, loop);
    }
    public setWalkBackAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.walkBack, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.walkBackFast, this._actionMap.walkBack);
    }
    public setWalkBackFastAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.walkBackFast, rangeName, rate, loop);
    }
    public setSlideBackAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.slideBack, rangeName, rate, loop);
    }
    public setIdleAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.idle, rangeName, rate, loop);
    }
    public setTurnRightAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.turnRight, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.turnRightFast, this._actionMap.turnRight);
    }
    public setTurnRightFastAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.turnRightFast, rangeName, rate, loop);
    }
    public setTurnLeftAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.turnLeft, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.turnLeftFast, this._actionMap.turnLeft);
    }
    public setTurnLeftFastAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.turnLeftFast, rangeName, rate, loop);
    }
    public setStrafeRightAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.strafeRight, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.strafeRightFast, this._actionMap.strafeRight);
    }
    public setStrafeRightFastAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.strafeRightFast, rangeName, rate, loop);
    }
    public setStrafeLeftAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.strafeLeft, rangeName, rate, loop);
        this._copySlowAnims(this._actionMap.strafeLeftFast, this._actionMap.strafeLeft);
    }
    public setStrafeLeftFastAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.strafeLeftFast, rangeName, rate, loop);
    }
    public setIdleJumpAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.idleJump, rangeName, rate, loop);
    }
    public setRunJumpAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.runJump, rangeName, rate, loop);
    }
    public setFallAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this._setAnim(this._actionMap.fall, rangeName, rate, loop);
    }

    // setters for keys
    public setWalkKey(key: string) {
        this._actionMap.walk._key = key.toLowerCase();
    }
    public setWalkBackKey(key: string) {
        this._actionMap.walkBack._key = key.toLowerCase();
    }
    public setTurnLeftKey(key: string) {
        this._actionMap.turnLeft._key = key.toLowerCase();
    }
    public setTurnRightKey(key: string) {
        this._actionMap.turnRight._key = key.toLowerCase();
    }
    public setStrafeLeftKey(key: string) {
        this._actionMap.strafeLeft._key = key.toLowerCase();
    }
    public setStrafeRightKey(key: string) {
        this._actionMap.strafeRight._key = key.toLowerCase();
    }
    public setJumpKey(key: string) {
        this._actionMap.idleJump._key = key.toLowerCase();
    }

    public setCameraElasticity(b: boolean) {
        this._cameraElastic = b;
    }
    public setCameraTarget(v: Vector3) {
        this._cameraTarget.copyFrom(v);
    }


    /**
     * user should call this whenever the user changes the camera checkCollision 
     * property
     * 
     */
    public cameraCollisionChanged() {
        this._savedCameraCollision = this._camera.checkCollisions;
    }
    public setNoFirstPerson(b: boolean) {
        this._noFirstPerson = b;
    }

    /**
     * if av has the required anim (walk, run etc) then 
     * mark that anim as existing
     * 
     * @param skel 
     */

    private _checkAnimRanges(skel: Skeleton) {
        let keys: string[] = Object.keys(this._actionMap);
        for (let key of keys) {
            let anim = this._actionMap[key];
            if (!(anim instanceof _ActionData)) continue;
            if (skel != null) {
                if (skel.getAnimationRange(anim._id) != null) {
                    anim._name = anim._id;
                    anim._exist = true;
                    this._hasAnims = true;
                }
            } else {
                anim._exist = false;
            }
        }
        this._checkFastAnims();
    }

    /**
     * if fast anims do not exist then use their slow counterpart as them but double the rate at which they play
     */
    private _checkFastAnims() {
        this._copySlowAnims(this._actionMap.walkBackFast, this._actionMap.walkBack)
        this._copySlowAnims(this._actionMap.turnRightFast, this._actionMap.turnRight);
        this._copySlowAnims(this._actionMap.turnLeftFast, this._actionMap.turnLeft);
        this._copySlowAnims(this._actionMap.strafeRightFast, this._actionMap.strafeRight);
        this._copySlowAnims(this._actionMap.strafeLeftFast, this._actionMap.strafeLeft);
    }

    private _copySlowAnims(f: _ActionData, s: _ActionData) {
        if (f._exist) return;
        if (!s._exist) return;
        f._exist = true;
        f._ag = s._ag;
        f._name = s._name;
        f._rate = s._rate * 2;
    }

    /**
     * Use this to make the  character controller suitable for a isometeric/top down games or  fps/third person game.
     * 1 In isometric/top down games the camera direction has no bearing on avatar movement.
     * 0 In fps/third person game rotating the camera around the avatar , rotates the avatr too.
     */
    private _mode = 0;
    private _saveMode = 0;
    public setMode(n: number) {
        this._mode = n;
        this._saveMode = n;
    }
    public getMode() {
        return this._mode;
    }
    /**
     * Use this to set  turning off.
     * When turining is off 
     * a) turn left or turn right keys result in avatar facing and moving left or right with respect to camera.
     * b) walkback/runback key results in avatar facing back and walking/running towards camera.
     * 
     * This setting has no effect when mode is 1.
     * 
     * @param b 
     */
    public setTurningOff(b: boolean) {
        this._noRot = b;
    }
    public isTurningOff() {
        return this._noRot;
    }

    /**
        * checks if a have left hand , right hand issue.
        * In other words if a mesh is a LHS mesh in RHS system or 
        * a RHS mesh in LHS system
        * The X axis will be reversed in such cases.
        * thus Cross product of X and Y should be inverse of Z.
        * BABYLONJS GLB models are RHS and exhibit this behavior
        * 
        */
    private _isRHS = false;
    private _signRHS = -1;
    private _setRHS(mesh: TransformNode) {
        const meshMatrix: Matrix = mesh.getWorldMatrix();
        const _localX = Vector3.FromFloatArray(meshMatrix.m, 0);
        const _localY = Vector3.FromFloatArray(meshMatrix.m, 4);
        const _localZ = Vector3.FromFloatArray(meshMatrix.m, 8);
        const actualZ = Vector3.Cross(_localX, _localY);
        //same direction or opposite direction of Z
        if (Vector3.Dot(actualZ, _localZ) < 0) {
            this._isRHS = true;
            this._signRHS = 1;
        }
        else {
            this._isRHS = false;
            this._signRHS = -1;
        }
    }

    /**
     * Use setFaceForward(true|false) to indicate that the avatar face  faces forward (true) or backward (false).
     * The avatar face faces forward if its face points to positive local Z axis direction
     */
    private _ffSign: number;
    private _ff: boolean;
    //in mode 0, av2cam is used to align avatar with camera , with camera always facing avatar's back
    //note:camera alpha is measured anti-clockwise , avatar rotation is measured clockwise 
    private _av2cam;
    public setFaceForward(b: boolean) {
        this._ff = b;
        if (this._isRHS) {
            this._av2cam = b ? Math.PI / 2 : 3 * Math.PI / 2;
            this._ffSign = b ? 1 : -1;
        } else {
            this._av2cam = b ? 3 * Math.PI / 2 : Math.PI / 2;
            this._ffSign = b ? -1 : 1;
        }
    }
    public isFaceForward() {
        return this._ff;
    }

    private checkAGs(agMap: {}) {
        let keys: string[] = Object.keys(this._actionMap);
        for (let key of keys) {
            let anim = this._actionMap[key];
            if (!(anim instanceof _ActionData)) continue;
            if (agMap[anim._name] != null) {
                anim._ag = agMap[anim._name];
                anim._exist = true;
            }
        }
    }

    private _started: boolean = false;
    public start() {
        if (this._started) return;
        this._started = true;
        this._act.reset();
        this._movFallTime = 0;
        //first time we enter render loop, delta time is zero
        this._idleFallTime = 0.001;
        this._grounded = false;
        this._updateTargetValue();
        this.enableKeyBoard(true);
        this._scene.registerBeforeRender(this._renderer);
    }

    public stop() {
        if (!this._started) return;
        this._started = false;
        this._scene.unregisterBeforeRender(this._renderer);
        this.enableKeyBoard(false);
        this._prevAnim = null;
    }

    /**
     * use pauseAnim to stop the charactere controller from playing
     * any animation on the character
     * use this when you want to play your animation instead
     * see also resumeAnim()
     */
    private _stopAnim: boolean = false;
    public pauseAnim() {
        this._stopAnim = true;
    }

    /**
     * use resumeAnim to resume the character controller playing
     * animations on the character.
     * see also pauseAnim()
     */
    public resumeAnim() {
        this._stopAnim = false;
    }

    private _prevAnim: _ActionData = null;
    private _avStartPos: Vector3 = Vector3.Zero();
    private _grounded: boolean = false;
    //distance by which AV would move down if in freefall
    private _freeFallDist: number = 0;

    //how many minimum contiguos frames should the AV have been in free fall
    //before we assume AV is in big freefall.
    //we will use this to remove animation flicker during move down a slope (fall, move, fall move etc)
    //TODO: base this on slope - large slope large count
    private _fallFrameCountMin: number = 50;
    private _fallFrameCount: number = 0;

    private _inFreeFall: boolean = false;
    private _wasWalking: boolean = false;
    private _wasRunning: boolean = false;
    private _moveVector: Vector3;

    //used only in mode 1
    //value 1 or -1 , -1 if avatar is facing camera
    //private _notFacingCamera = 1;

    private _isAvFacingCamera(): number {
        if (Vector3.Dot(this._avatar.forward, this._avatar.position.subtract(this._camera.position)) < 0) return 1
        else return -1;
    }

    private _moveAVandCamera() {
        this._avStartPos.copyFrom(this._avatar.position);
        let anim: _ActionData = null;
        const dt: number = this._scene.getEngine().getDeltaTime() / 1000;

        if (this._act._jump && !this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            anim = this._doJump(dt);
        } else if (this.anyMovement() || this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            anim = this._doMove(dt);
        } else if (!this._inFreeFall) {
            anim = this._doIdle(dt);
        }
        if (!this._stopAnim && this._hasAnims && anim != null) {
            if (this._prevAnim !== anim) {
                if (anim._exist) {
                    if (this._isAG) {
                        if (this._prevAnim != null && this._prevAnim._exist) this._prevAnim._ag.stop();
                        //TODO use start instead of play ?
                        //anim._ag.play(anim._loop);
                        //anim._ag.speedRatio = anim._rate;
                        anim._ag.start(anim._loop, anim._rate);
                    } else {
                        this._skeleton.beginAnimation(anim._name, anim._loop, anim._rate);
                    }
                }
                this._prevAnim = anim;
            }
        }
        this._updateTargetValue();
        return;
    }

    //verical position of AV when it is about to start a jump
    private _jumpStartPosY: number = 0;
    //for how long the AV has been in the jump
    private _jumpTime: number = 0;
    private _doJump(dt: number): _ActionData {

        let anim: _ActionData = null;
        anim = this._actionMap.runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
        }

        this._jumpTime = this._jumpTime + dt;

        let forwardDist: number = 0;
        let jumpDist: number = 0;
        let disp: Vector3;
        if (this._mode != 1 && !this._noRot) this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        if (this._wasRunning || this._wasWalking) {
            if (this._wasRunning) {
                forwardDist = this._actionMap.run._speed * dt;
            } else if (this._wasWalking) {
                forwardDist = this._actionMap.walk._speed * dt;
            }
            //find out in which horizontal direction the AV was moving when it started the jump
            disp = this._moveVector.clone();
            disp.y = 0;
            disp = disp.normalize();
            disp.scaleToRef(forwardDist, disp);
            jumpDist = this._calcJumpDist(this._actionMap.runJump._speed, dt);
            disp.y = jumpDist;
        } else {
            jumpDist = this._calcJumpDist(this._actionMap.idleJump._speed, dt);
            disp = new Vector3(0, jumpDist, 0);
            anim = this._actionMap.idleJump;
            //this.avatar.ellipsoid.y=this._ellipsoid.y/2;
        }
        //moveWithCollision only seems to happen if length of displacment is atleast 0.001
        this._avatar.moveWithCollisions(disp);
        if (jumpDist < 0) {
            //this.avatar.ellipsoid.y=this._ellipsoid.y;
            //check if going up a slope or back on flat ground 
            if ((this._avatar.position.y > this._avStartPos.y) || ((this._avatar.position.y === this._avStartPos.y) && (disp.length() > 0.001))) {
                this._endJump();
            } else if (this._avatar.position.y < this._jumpStartPosY) {
                //the avatar is below the point from where it started the jump
                //so it is either in free fall or is sliding along a downward slope
                //
                //if the actual displacemnt is same as the desired displacement then AV is in freefall
                //else it is on a slope
                const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
                if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                    //AV is on slope
                    //Should AV continue to slide or stop?
                    //if slope is less steeper than acceptable then stop else slide
                    if (this._verticalSlope(actDisp) <= this._sl1) {
                        this._endJump();
                    }
                } else {
                    anim = this._actionMap.fall;
                }
            }
        }
        return anim;
    }

    private _calcJumpDist(speed: number, dt: number): number {
        //up velocity at the begining of the lastt frame (v=u+at)
        let js: number = speed - this._gravity * this._jumpTime;
        //distance travelled up since last frame to this frame (s=ut+1/2*at^2)
        let jumpDist: number = js * dt - 0.5 * this._gravity * dt * dt;
        return jumpDist;
    }

    /**
     * does cleanup at the end of a jump
     */
    private _endJump() {
        this._act._jump = false;
        this._jumpTime = 0;
        this._wasWalking = false;
        this._wasRunning = false;
    }

    /**
     * checks if two vectors v1 and v2 are equal within a precision of p
     */
    private _areVectorsEqual(v1: Vector3, v2: Vector3, p: number) {
        return ((Math.abs(v1.x - v2.x) < p) && (Math.abs(v1.y - v2.y) < p) && (Math.abs(v1.z - v2.z) < p));
    }

    /*
     * returns the slope (in radians) of a vector in the vertical plane
     */
    private _verticalSlope(v: Vector3): number {
        return Math.atan(Math.abs(v.y / Math.sqrt(v.x * v.x + v.z * v.z)));
    }

    //for how long has the av been falling while moving
    private _movFallTime: number = 0;
    private _sign = 1;
    private _isTurning = false;
    private _noRot = false;
    private _doMove(dt: number): _ActionData {

        //initial down velocity
        const u: number = this._movFallTime * this._gravity
        //calculate the distance by which av should fall down since last frame
        //assuming it is in freefall
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;

        this._movFallTime = this._movFallTime + dt;

        let moving: boolean = false;
        let anim: _ActionData = null;

        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        } else {
            this._wasWalking = false;
            this._wasRunning = false;

            let sign: number;
            let horizDist: number = 0;
            switch (true) {
                case (this._act._stepLeft):
                    sign = this._signRHS * this._isAvFacingCamera();
                    horizDist = this._actionMap.strafeLeft._speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.strafeLeftFast._speed * dt;
                        anim = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeftFast : this._actionMap.strafeRightFast;
                    } else {
                        anim = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeft : this._actionMap.strafeRight;
                    }

                    this._moveVector = this._avatar.calcMovePOV(sign * horizDist, -this._freeFallDist, 0);
                    moving = true;
                    break;
                case (this._act._stepRight):
                    sign = -this._signRHS * this._isAvFacingCamera();
                    horizDist = this._actionMap.strafeRight._speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.strafeRightFast._speed * dt;
                        anim = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeftFast : this._actionMap.strafeRightFast;
                    } else {
                        anim = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeft : this._actionMap.strafeRight;
                    }
                    this._moveVector = this._avatar.calcMovePOV(sign * horizDist, -this._freeFallDist, 0);
                    moving = true;
                    break;
                case (this._act._walk || (this._noRot && this._mode == 0)):
                    if (this._act._speedMod) {
                        this._wasRunning = true;
                        horizDist = this._actionMap.run._speed * dt;
                        anim = this._actionMap.run;
                    } else {
                        this._wasWalking = true;
                        horizDist = this._actionMap.walk._speed * dt;
                        anim = this._actionMap.walk;
                    }
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, this._ffSign * horizDist);
                    moving = true;
                    break;
                case (this._act._walkback):
                    horizDist = this._actionMap.walkBack._speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.walkBackFast._speed * dt;
                        anim = this._actionMap.walkBackFast;
                    } else {
                        anim = this._actionMap.walkBack;
                    }
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._ffSign * horizDist);
                    moving = true;
                    break;

            }

        }

        if (!(this._noRot && this._mode == 0) && (!this._act._stepLeft && !this._act._stepRight) && (this._act._turnLeft || this._act._turnRight)) {
            let turnAngle = this._actionMap.turnLeft._speed * dt;
            if (this._act._speedMod) {
                turnAngle = 2 * turnAngle;
            }
            if (this._mode == 1) {
                // while turining, the avatar could start facing away from camera and end up facing camera.
                // we should not switch turning direction during this transition
                if (!this._isTurning) {
                    // if (this._act.name != this._act.prevName) {
                    // this._act.prevName = this._act.name;
                    this._sign = -this._ffSign * this._isAvFacingCamera();
                    if (this._isRHS) this._sign = - this._sign;
                    this._isTurning = true;
                }
                let a = this._sign;
                if (this._act._turnLeft) {
                    if (this._act._walk) { }
                    else if (this._act._walkback) a = -this._sign;
                    else {
                        anim = (this._sign > 0) ? this._actionMap.turnRight : this._actionMap.turnLeft;
                    }
                } else {
                    if (this._act._walk) a = -this._sign;
                    else if (this._act._walkback) { }
                    else {
                        a = -this._sign;
                        anim = (this._sign > 0) ? this._actionMap.turnLeft : this._actionMap.turnRight;
                    }
                }
                this._avatar.rotation.y = this._avatar.rotation.y + turnAngle * a;
            } else {
                let a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback) a = -1;
                    if (!moving) anim = this._actionMap.turnLeft;
                } else {
                    if (this._act._walk) a = -1;
                    if (!moving) { a = -1; anim = this._actionMap.turnRight; }
                }
                this._camera.alpha = this._camera.alpha + turnAngle * a;
            }
        }

        if (this._mode != 1) {
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
            } else {
                this._avatar.rotation.y = this._av2cam - this._camera.alpha;
            }
        } else {

        }

        if (moving) {
            if (this._moveVector.length() > 0.001) {
                this._avatar.moveWithCollisions(this._moveVector);
                //walking up a slope
                if (this._avatar.position.y > this._avStartPos.y) {
                    const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
                    const _slp: number = this._verticalSlope(actDisp);
                    if (_slp >= this._sl2) {
                        //this._climbingSteps=true;
                        //is av trying to go up steps
                        if (this._stepOffset > 0) {
                            if (this._vMoveTot == 0) {
                                //if just started climbing note down the position
                                this._vMovStartPos.copyFrom(this._avStartPos);
                            }
                            this._vMoveTot = this._vMoveTot + (this._avatar.position.y - this._avStartPos.y);
                            if (this._vMoveTot > this._stepOffset) {
                                //move av back to its position at begining of steps
                                this._vMoveTot = 0;
                                this._avatar.position.copyFrom(this._vMovStartPos);
                                this._endFreeFall();
                            }
                        } else {
                            //move av back to old position
                            this._avatar.position.copyFrom(this._avStartPos);
                            this._endFreeFall();
                        }
                    } else {
                        this._vMoveTot = 0;
                        if (_slp > this._sl1) {
                            //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                            this._fallFrameCount = 0;
                            this._inFreeFall = false;
                        } else {
                            //continue walking
                            this._endFreeFall();
                        }
                    }
                } else if ((this._avatar.position.y) < this._avStartPos.y) {
                    const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
                    if (!(this._areVectorsEqual(actDisp, this._moveVector, 0.001))) {
                        //AV is on slope
                        //Should AV continue to slide or walk?
                        //if slope is less steeper than acceptable then walk else slide
                        if (this._verticalSlope(actDisp) <= this._sl1) {
                            this._endFreeFall();
                        } else {
                            //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                            this._fallFrameCount = 0;
                            this._inFreeFall = false;
                        }
                    } else {
                        this._inFreeFall = true;
                        this._fallFrameCount++;
                        //AV could be running down a slope which mean freefall,run,frefall run ...
                        //to remove anim flicker, check if AV has been falling down continously for last few consecutive frames
                        //before changing to free fall animation
                        if (this._fallFrameCount > this._fallFrameCountMin) {
                            anim = this._actionMap.fall;
                        }
                    }
                } else {
                    this._endFreeFall();
                }
            }
        }
        return anim;
    }

    private _endFreeFall(): void {
        this._movFallTime = 0;
        this._fallFrameCount = 0;
        this._inFreeFall = false;
    }

    //for how long has the av been falling while idle (not moving)
    private _idleFallTime: number = 0;
    private _doIdle(dt: number): _ActionData {
        if (this._grounded) {
            return this._actionMap.idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        let anim: _ActionData = this._actionMap.idle;
        this._fallFrameCount = 0;


        if (dt === 0) {
            this._freeFallDist = 5;
        } else {
            const u: number = this._idleFallTime * this._gravity
            this._freeFallDist = u * dt + this._gravity * dt * dt / 2;
            this._idleFallTime = this._idleFallTime + dt;
        }
        //if displacement is less than 0.01(? need to verify further) then 
        //moveWithDisplacement down against a surface seems to push the AV up by a small amount!!
        if (this._freeFallDist < 0.01) return anim;
        const disp: Vector3 = new Vector3(0, -this._freeFallDist, 0);
        if (this._mode != 1 && !this._noRot) this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        this._avatar.moveWithCollisions(disp);
        if ((this._avatar.position.y > this._avStartPos.y) || (this._avatar.position.y === this._avStartPos.y)) {
            //                this.grounded = true;
            //                this.idleFallTime = 0;
            this._groundIt();
        } else if (this._avatar.position.y < this._avStartPos.y) {
            //AV is going down. 
            //AV is either in free fall or is sliding along a downward slope
            //
            //if the actual displacemnt is same as the desired displacement then AV is in freefall
            //else it is on a slope
            const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
            if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                //AV is on slope
                //Should AV continue to slide or stop?
                //if slope is less steeper than accebtable then stop else slide
                if (this._verticalSlope(actDisp) <= this._sl1) {
                    //                        this.grounded = true;
                    //                        this.idleFallTime = 0;
                    this._groundIt();
                    this._avatar.position.copyFrom(this._avStartPos);
                } else {
                    this._unGroundIt();
                    anim = this._actionMap.slideBack;
                }
            }
        }
        return anim;
    }

    private _groundFrameCount = 0;
    private _groundFrameMax = 10;
    /**
     * donot ground immediately
     * wait few more frames
     */
    private _groundIt(): void {
        this._groundFrameCount++;
        if (this._groundFrameCount > this._groundFrameMax) {
            this._grounded = true;
            this._idleFallTime = 0;
        }
    }
    private _unGroundIt() {
        this._grounded = false;
        this._groundFrameCount = 0;
    }

    private _savedCameraCollision: boolean = true;
    private _inFP = false;
    private _updateTargetValue() {
        //donot move camera if av is trying to clinb steps
        if (this._vMoveTot == 0)
            this._avatar.position.addToRef(this._cameraTarget, this._camera.target);

        if (this._camera.radius > this._camera.lowerRadiusLimit) { if (this._cameraElastic) this._snapCamera(); }

        if (this._camera.radius <= this._camera.lowerRadiusLimit) {
            if (!this._noFirstPerson && !this._inFP) {
                this._avatar.visibility = 0;
                this._camera.checkCollisions = false;
                this._saveMode = this._mode;
                this._mode = 0;
                this._inFP = true;
            }
        } else {
            this._inFP = false;
            this._mode = this._saveMode;
            this._avatar.visibility = 1;
            this._camera.checkCollisions = this._savedCameraCollision;
        }
    }

    private _ray: Ray = new Ray(Vector3.Zero(), Vector3.One(), 1);
    private _rayDir: Vector3 = Vector3.Zero();
    //camera seems to get stuck into things
    //should move camera away from things by a value of cameraSkin
    private _cameraSkin: number = 0.5;
    private _skip: number = 0;
    private _snapCamera() {
        //            if(this.skip<120) {
        //                this.skip++;
        //                return;
        //            }
        //            this.skip=0;
        //get vector from av (camera.target) to camera
        this._camera.position.subtractToRef(this._camera.target, this._rayDir);
        //start ray from av to camera
        this._ray.origin = this._camera.target;
        this._ray.length = this._rayDir.length();
        this._ray.direction = this._rayDir.normalize();

        const pi: PickingInfo = this._scene.pickWithRay(this._ray, (mesh) => {
            //if(mesh==this.avatar||!mesh.isPickable||!mesh.checkCollisions) return false;
            if (mesh == this._avatar || !mesh.checkCollisions) return false;
            else return true;
        }, true);

        if (pi.hit) {
            //postion the camera in front of the mesh that is obstructing camera
            if (this._camera.checkCollisions) {
                const newPos: Vector3 = this._camera.target.subtract(pi.pickedPoint).normalize().scale(this._cameraSkin);
                pi.pickedPoint.addToRef(newPos, this._camera.position);
            } else {
                const nr: number = pi.pickedPoint.subtract(this._camera.target).length();
                this._camera.radius = nr - this._cameraSkin;
            }
        }
    }

    private _move: boolean = false;
    public anyMovement(): boolean {
        return (this._act._walk || this._act._walkback || this._act._turnLeft || this._act._turnRight || this._act._stepLeft || this._act._stepRight);
    }

    private _onKeyDown(e: KeyboardEvent) {
        if (!e.key) return;
        if (e.repeat) return;
        switch (e.key.toLowerCase()) {
            case this._actionMap.idleJump._key:
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
            case this._actionMap.walk._key:
                this._act._walk = true;
                break;
            case "left":
            case "arrowleft":
            case this._actionMap.turnLeft._key:
                this._act._turnLeft = true;
                break;
            case "right":
            case "arrowright":
            case this._actionMap.turnRight._key:
                this._act._turnRight = true;
                break;
            case "down":
            case "arrowdown":
            case this._actionMap.walkBack._key:
                this._act._walkback = true;
                break;
            case this._actionMap.strafeLeft._key:
                this._act._stepLeft = true;
                break;
            case this._actionMap.strafeRight._key:
                this._act._stepRight = true;
                break;
        }
        this._move = this.anyMovement();
    }

    private _onKeyUp(e: KeyboardEvent) {
        if (!e.key) return;
        switch (e.key.toLowerCase()) {
            case "shift":
                this._act._speedMod = false;
                break;
            case "up":
            case "arrowup":
            case this._actionMap.walk._key:
                this._act._walk = false;
                break;
            case "left":
            case "arrowleft":
            case this._actionMap.turnLeft._key:
                this._act._turnLeft = false;
                this._isTurning = false;
                break;
            case "right":
            case "arrowright":
            case this._actionMap.turnRight._key:
                this._act._turnRight = false;
                this._isTurning = false;
                break;
            case "down":
            case "arrowdown":
            case this._actionMap.walkBack._key:
                this._act._walkback = false;
                break;
            case this._actionMap.strafeLeft._key:
                this._act._stepLeft = false;
                break;
            case this._actionMap.strafeRight._key:
                this._act._stepRight = false;
                break;
        }
        this._move = this.anyMovement();
    }

    private _ekb: boolean;
    public enableKeyBoard(b: boolean) {
        this._ekb = b;
        let canvas: HTMLCanvasElement = this._scene.getEngine().getRenderingCanvas();
        if (b) {
            canvas.addEventListener("keyup", this._handleKeyUp, false);
            canvas.addEventListener("keydown", this._handleKeyDown, false);
        } else {
            canvas.removeEventListener("keyup", this._handleKeyUp, false);
            canvas.removeEventListener("keydown", this._handleKeyDown, false);
        }
    }

    // control movement by commands rather than keyboard.
    public walk(b: boolean) {
        this._act._walk = b;
    }
    public walkBack(b: boolean) {
        this._act._walkback = b;
    }
    public walkBackFast(b: boolean) {
        this._act._walkback = b;
        this._act._speedMod = b;
    }
    public run(b: boolean) {
        this._act._walk = b;
        this._act._speedMod = b;
    }
    public turnLeft(b: boolean) {
        this._act._turnLeft = b;
        if (!b) this._isTurning = b;
    }
    public turnLeftFast(b: boolean) {
        this._act._turnLeft = b;
        if (!b) this._isTurning = b;
        this._act._speedMod = b;
    }
    public turnRight(b: boolean) {
        this._act._turnRight = b;
        if (!b) this._isTurning = b;
    }
    public turnRightFast(b: boolean) {
        this._act._turnRight = b;
        if (!b) this._isTurning = b;
        this._act._speedMod = b;
    }
    public strafeLeft(b: boolean) {
        this._act._stepLeft = b;
    }
    public strafeLeftFast(b: boolean) {
        this._act._stepLeft = b;
        this._act._speedMod = b;
    }
    public strafeRight(b: boolean) {
        this._act._stepRight = b;
    }
    public strafeRightFast(b: boolean) {
        this._act._stepRight = b;
        this._act._speedMod = b;
    }
    public jump() {
        this._act._jump = true;
    }
    public idle() {
        this._act.reset();
    }

    private _act: _Action;
    private _renderer: () => void;
    private _handleKeyUp: (e) => void;
    private _handleKeyDown: (e) => void;
    private _isAG: boolean = false;
    public isAg() {
        return this._isAG;
    }




    private _findSkel(n: Node): Skeleton {
        let root = this._root(n);

        if (root instanceof Mesh && root.skeleton) return root.skeleton;

        //find all child meshes which have skeletons
        let ms = root.getChildMeshes(
            false,
            (cm) => {
                if (cm instanceof Mesh) {
                    if (cm.skeleton) {
                        return true;
                    }
                }
                return false;
            });

        //return the skeleton of the first child mesh
        if (ms.length > 0) return ms[0].skeleton; else return null;

    }

    private _root(tn: Node): Node {
        if (tn.parent == null) return tn;
        return this._root(tn.parent);
    }

    public setAvatar(avatar: Mesh, faceForward: boolean = false): boolean {

        let rootNode = this._root(avatar);
        if (rootNode instanceof Mesh) {
            this._avatar = rootNode;
        } else {
            console.error("Cannot move this mesh. The root node of the mesh provided is not a mesh");
            return false;
        }


        this._skeleton = this._findSkel(avatar);
        //skeletons animated by animation groups seem to have "overrideMesh" property
        if (this._skeleton != null && this._skeleton.overrideMesh) this._isAG = true; else this._isAG = false;

        this._actionMap.reset();

        //animation ranges
        if (!this._isAG && this._skeleton != null) this._checkAnimRanges(this._skeleton);

        this._setRHS(avatar);
        this.setFaceForward(faceForward);

        return true;
    }

    public getAvatar() {
        return this._avatar;
    }

    // force a skeleton to be the avatar skeleton
    // should not be calling this normally
    public setAvatarSkeleton(skeleton: Skeleton) {
        this._skeleton = skeleton;

        //skeletons animated by animation groups seem to have "overrideMesh" property
        if (this._skeleton != null && this._skeleton.overrideMesh) this._isAG = true; else this._isAG = false;

        if (!this._isAG && this._skeleton != null) this._checkAnimRanges(this._skeleton);
    }

    public getSkeleton() {
        return this._skeleton;
    }

    // does this character have any animations ?
    // remember we can use meshes without anims as characters too
    private _hasAnims: boolean = false;

    /**
     * The avatar/character can be made up of multiple meshes arranged in a hierarchy.
     * As such we will pick the root of the hierarchy as the avatar.
     * The root should be a mesh as otherwise we cannot move it with moveWithCollision() method.
     * 
     * Mutiple meshes in the hierarchy may have skeletons (if two or more meshes have skeleton then
     * the skeleton will mostly likely be the same). 
     * So we will pick as avatar skeleton, the  skeleton of the first mesh in the hierachy which has
     * a skeleton 
     * 
     * @param avatar 
     * @param camera 
     * @param scene 
     * @param actionData - maps actions to animations and other data like speed,sound etc
     * @param faceForward 
     */
    constructor(avatar: Mesh, camera: ArcRotateCamera, scene: Scene, actionData?: {}, faceForward = false) {

        let success = this.setAvatar(avatar, faceForward);
        if (!success) {
            console.error("unable to set avatar");
        }

        this._scene = scene;

        let dataType: string = null;
        if (actionData != null) {
            dataType = this.setActionData(actionData);
        }

        //try to use the existing avatar animations

        //animation ranges
        if (!this._isAG && this._skeleton != null) this._checkAnimRanges(this._skeleton);
        //animation groups
        if (this._isAG) {

        }

        this._camera = camera;
        this._savedCameraCollision = this._camera.checkCollisions;

        this._act = new _Action();

        this._renderer = () => { this._moveAVandCamera() };
        this._handleKeyUp = (e) => { this._onKeyUp(e) };
        this._handleKeyDown = (e) => { this._onKeyDown(e) };
    }
}



class _Action {

    public _walk: boolean = false;
    public _walkback: boolean = false;
    public _turnRight: boolean = false;
    public _turnLeft: boolean = false;
    public _stepRight: boolean = false;
    public _stepLeft: boolean = false;
    public _jump: boolean = false;

    // speed modifier - changes speed of movement
    public _speedMod: boolean = false;


    constructor() {
        this.reset();
    }

    reset() {
        this._walk = false;
        this._walkback = false;
        this._turnRight = false;
        this._turnLeft = false;
        this._stepRight = false;
        this._stepLeft = false;
        this._jump = false;
        this._speedMod = false;
    }
}

class _ActionData {
    public _id: string;
    public _speed: number;
    //_ds default speed.  speed is set to this on reset
    public _ds: number;
    public _sound: string;
    public _key: string;
    //_dk defailt key
    public _dk: string;

    //animation data
    //if _ag is null then _name will be used to play animationrange
    public _name: string = "";
    public _ag: AnimationGroup;
    public _loop: boolean = true;
    public _rate: number = 1;

    public _exist: boolean = false;

    public constructor(id: string, speed = 1, key: string) {
        this._id = id;
        this._speed = speed;
        this._ds = speed;
        this._key = key;
        this._dk = key;
    }

    public reset() {
        this._name = "";
        this._speed = this._ds;
        this._key = this._dk;
        this._loop = true;
        this._rate = 1;
        this._sound = "";
        this._exist = false;
    }

}

class _ActionMap {
    public walk = new _ActionData("walk", 3, "w");
    public walkBack = new _ActionData("walkBack", 1.5, "s");
    public walkBackFast = new _ActionData("walkBackFast", 3, "na");
    public idle = new _ActionData("idle", 0, "na");
    public idleJump = new _ActionData("idleJump", 6, " ");
    public run = new _ActionData("run", 6, "na");
    public runJump = new _ActionData("runJump", 6, "na");
    public fall = new _ActionData("fall", 0, "na");
    public turnLeft = new _ActionData("turnLeft", Math.PI / 8, "a");
    public turnLeftFast = new _ActionData("turnLeftFast", Math.PI / 4, "na");
    public turnRight = new _ActionData("turnRight", Math.PI / 8, "d");
    public turnRightFast = new _ActionData("turnRightFast", Math.PI / 4, "na");
    public strafeLeft = new _ActionData("strafeLeft", 1.5, "q");
    public strafeLeftFast = new _ActionData("strafeLeftFast", 3, "na");
    public strafeRight = new _ActionData("strafeRight", 1.5, "e");
    public strafeRightFast = new _ActionData("strafeRightFast", 3, "na");
    public slideBack = new _ActionData("slideBack", 0, "na");

    public reset() {
        let keys: string[] = Object.keys(this);
        for (let key of keys) {
            let act = this[key];
            if (!(act instanceof _ActionData)) continue;
            act.reset()
        }
    }
};

export class CCSettings {
    public gravity: number;
    public minSlopeLimit: number;
    public maxSlopeLimit: number;
    public stepOffset: number;
    public cameraElastic: boolean = true;
    public cameraTarget: Vector3 = Vector3.Zero();
    public noFirstPerson: boolean = false;
    public turningOff: boolean = true;
    public cameraRotate: boolean = true;
    public keyboard: boolean = true;
}
