import {
    Skeleton,
    ArcRotateCamera,
    Vector3,
    Mesh,
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

    //avatar speed in meters/second
    private _walkSpeed: number = 3;
    private _runSpeed: number = this._walkSpeed * 2;
    private _backSpeed: number = this._walkSpeed / 2;
    private _jumpSpeed: number = this._walkSpeed * 2;
    private _leftSpeed: number = this._walkSpeed / 2;
    private _rightSpeed: number = this._walkSpeed / 2;
    //trun speed in radian per second (equivalent to 180 degree/second by default)
    private _turnSpeed: number = Math.PI;
    private _gravity: number = 9.8;
    //slopeLimit in degrees
    private _minSlopeLimit: number = 30;
    private _maxSlopeLimit: number = 45;
    //slopeLimit in radians
    private _sl: number = Math.PI * this._minSlopeLimit / 180;
    private _sl2: number = Math.PI * this._maxSlopeLimit / 180;

    //The av will step up a stair only if it is closer to the ground than the indicated value.
    private _stepOffset: number = 0.25;
    //toal amount by which the av has moved up
    private _vMoveTot: number = 0;
    //position of av when it started moving up
    private _vMovStartPos: Vector3 = Vector3.Zero();

    //animations
    private _walk: _AnimData = new _AnimData("walk");
    private _walkBack: _AnimData = new _AnimData("walkBack");
    private _idle: _AnimData = new _AnimData("idle");
    private _idleJump: _AnimData = new _AnimData("idleJump");
    private _run: _AnimData = new _AnimData("run");
    private _runJump: _AnimData = new _AnimData("runJump");
    private _fall: _AnimData = new _AnimData("fall");
    private _turnLeft: _AnimData = new _AnimData("turnLeft");
    private _turnRight: _AnimData = new _AnimData("turnRight");
    private _strafeLeft: _AnimData = new _AnimData("strafeLeft");
    private _strafeRight: _AnimData = new _AnimData("strafeRight");
    private _slideBack: _AnimData = new _AnimData("slideBack");

    private _anims: _AnimData[] = [this._walk, this._walkBack, this._idle, this._idleJump, this._run, this._runJump, this._fall, this._turnLeft, this._turnRight, this._strafeLeft, this._strafeRight, this._slideBack];

    //move keys
    private _walkKey: string = "w";
    private _walkBackKey: string = "s";
    private _turnLeftKey: string = "a";
    private _turnRightKey: string = "d";
    private _strafeLeftKey: string = "q";
    private _strafeRightKey: string = "e";
    private _jumpKey: string = " ";

    private _elasticCamera: boolean = true;
    private _cameraTarget: Vector3 = Vector3.Zero();
    //should we go into first person view when camera is near avatar (radius is lowerradius limit)
    private _noFirstPerson: boolean = false;

    public setAvatar(avatar: Mesh) {
        this._avatar = avatar;
    }

    public setAvatarSkeleton(skeleton: Skeleton) {
        this._skeleton = skeleton;
        this.checkAnims(skeleton);
    }

    public setSlopeLimit(minSlopeLimit: number, maxSlopeLimit: number) {
        this._minSlopeLimit = minSlopeLimit;
        this._maxSlopeLimit = maxSlopeLimit;

        this._sl = Math.PI * minSlopeLimit / 180;
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
        this._walkSpeed = n;
    }
    public setRunSpeed(n: number) {
        this._runSpeed = n;
    }
    public setBackSpeed(n: number) {
        this._backSpeed = n;
    }
    public setJumpSpeed(n: number) {
        this._jumpSpeed = n;
    }
    public setLeftSpeed(n: number) {
        this._leftSpeed = n;
    }
    public setRightSpeed(n: number) {
        this._rightSpeed = n;
    }
    // get turnSpeed in degrees per second.
    // store in radians per second
    public setTurnSpeed(n: number) {
        this._turnSpeed = n * Math.PI / 180;
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
     *   ....
     * }
     * 
     * @param agMap a map of character controller animation name to animationGroup
     */
    public setAnimationGroups(agMap: {}) {
        this._isAG = true;
        for (let anim of this._anims) {
            if (agMap[anim._name] != null) {
                anim._ag = agMap[anim._name];
                anim._exist = true;
            }
        }
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
        let arData: string | {};
        for (let anim of this._anims) {
            arData = arMap[anim._name];
            if (arData != null) {
                if (arData instanceof Object) {
                    if (arData["name"]) anim._name = arData["name"];
                    if (arData["loop"]) anim._loop = arData["loop"];
                    if (arData["rate"]) anim._loop = arData["rate"];
                } else {
                    anim._name = arData;
                }
                anim._exist = true;
            }
        }
    }

    private setAnim(anim: _AnimData, rangeName?: string | AnimationGroup, rate?: number, loop?: boolean) {
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
            for (let anim of this._anims) {
                if (anim._exist) {
                    let ar: AnimationGroup = anim._ag;
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
            for (let anim of this._anims) {
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
        this.setAnim(this._walk, rangeName, rate, loop);
    }
    public setRunAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._run, rangeName, rate, loop);
    }
    public setWalkBackAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._walkBack, rangeName, rate, loop);
    }
    public setSlideBackAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._slideBack, rangeName, rate, loop);
    }
    public setIdleAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._idle, rangeName, rate, loop);
    }
    public setTurnRightAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._turnRight, rangeName, rate, loop);
    }
    public setTurnLeftAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._turnLeft, rangeName, rate, loop);
    }
    public setStrafeRightAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._strafeRight, rangeName, rate, loop);
    }
    public setStrafeLeftAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._strafeLeft, rangeName, rate, loop);
    }
    public setIdleJumpAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._idleJump, rangeName, rate, loop);
    }
    public setRunJumpAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._runJump, rangeName, rate, loop);
    }
    public setFallAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
        this.setAnim(this._fall, rangeName, rate, loop);
    }

    // setters for keys
    public setWalkKey(key: string) {
        this._walkKey = key.toLowerCase();
    }
    public setWalkBackKey(key: string) {
        this._walkBackKey = key.toLowerCase();
    }
    public setTurnLeftKey(key: string) {
        this._turnLeftKey = key.toLowerCase();
    }
    public setTurnRightKey(key: string) {
        this._turnRightKey = key.toLowerCase();
    }
    public setStrafeLeftKey(key: string) {
        this._strafeLeftKey = key.toLowerCase();
    }
    public setStrafeRightKey(key: string) {
        this._strafeRightKey = key.toLowerCase();
    }
    public setJumpKey(key: string) {
        this._jumpKey = key.toLowerCase();
    }

    public setCameraElasticity(b: boolean) {
        this._elasticCamera = b;
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


    private checkAnims(skel: Skeleton) {
        for (let anim of this._anims) {
            if (skel != null) {
                if (skel.getAnimationRange(anim._name) != null) anim._exist = true;
            } else {
                anim._exist = false;
            }
        }
    }

    /**
     * Use this to make the  character controller suitable for a isometeric/top down games or  fps/third person game.
     * 1 In isometric/top down games the camera direction has no bearing on avatar movement.
     * 0 In fps/third person game rotating the camera around the avatar , rotates the avatr too.
     */
    private mode = 0;
    private _saveMode = 0;
    public setMode(n: number) {
        this.mode = n;
        this._saveMode = n;
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
    private _ffSign;
    //in mode 0, av2cam is used to align avatar with camera , with camera always facing avatar's back
    //note:camera alpha is measured anti-clockwise , avatar rotation is measured clockwise 
    private _av2cam;
    public setFaceForward(b: boolean) {
        if (this._isRHS) {
            this._av2cam = b ? Math.PI / 2 : 3 * Math.PI / 2;
            this._ffSign = b ? 1 : -1;
        } else {
            this._av2cam = b ? 3 * Math.PI / 2 : Math.PI / 2;
            this._ffSign = b ? -1 : 1;
        }
    }

    private checkAGs(agMap: {}) {
        for (let anim of this._anims) {
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

    private _prevAnim: _AnimData = null;
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
        let anim: _AnimData = null;
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
                        anim._ag.play(anim._loop);
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
    private _doJump(dt: number): _AnimData {

        let anim: _AnimData = null;
        anim = this._runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
        }
        //up velocity at the begining of the lastt frame (v=u+at)
        const js: number = this._jumpSpeed - this._gravity * this._jumpTime;
        //distance travelled up since last frame to this frame (s=ut+1/2*at^2)
        const jumpDist: number = js * dt - 0.5 * this._gravity * dt * dt;
        this._jumpTime = this._jumpTime + dt;

        let forwardDist: number = 0;
        let disp: Vector3;
        if (this.mode != 1) this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        if (this._wasRunning || this._wasWalking) {
            if (this._wasRunning) {
                forwardDist = this._runSpeed * dt;
            } else if (this._wasWalking) {
                forwardDist = this._walkSpeed * dt;
            }
            //find out in which horizontal direction the AV was moving when it started the jump
            disp = this._moveVector.clone();
            disp.y = 0;
            disp = disp.normalize();
            disp.scaleToRef(forwardDist, disp);
            disp.y = jumpDist;
        } else {
            disp = new Vector3(0, jumpDist, 0);
            anim = this._idleJump;
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
                    if (this._verticalSlope(actDisp) <= this._sl) {
                        this._endJump();
                    }
                } else {
                    anim = this._fall;
                }
            }
        }
        return anim;
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
    private _turning = false;
    private _doMove(dt: number): _AnimData {

        //initial down velocity
        const u: number = this._movFallTime * this._gravity
        //calculate the distance by which av should fall down since last frame
        //assuming it is in freefall
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;

        this._movFallTime = this._movFallTime + dt;

        let moving: boolean = false;
        let anim: _AnimData = null;

        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        } else {
            this._wasWalking = false;
            this._wasRunning = false;

            let sign: number;
            switch (true) {
                case (this._act._walk):
                    let forwardDist: number = 0;
                    if (this._act._walkMod) {
                        this._wasRunning = true;
                        forwardDist = this._runSpeed * dt;
                        anim = this._run;
                    } else {
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
                // while turining, the avatar could start facing away from camera and end up facing camera.
                // we should not switch turning direction during this transition
                if (!this._turning) {
                    // if (this._act.name != this._act.prevName) {
                    // this._act.prevName = this._act.name;
                    this._sign = -this._ffSign * this._isAvFacingCamera();
                    if (this._isRHS) this._sign = - this._sign;
                    this._turning = true;
                }
                let a = this._sign;
                if (this._act._turnLeft) {
                    if (this._act._walk) { }
                    else if (this._act._walkback) a = -this._sign;
                    else {
                        anim = (this._sign > 0) ? this._turnRight : this._turnLeft;
                    }
                } else {
                    if (this._act._walk) a = -this._sign;
                    else if (this._act._walkback) { }
                    else {
                        a = -this._sign;
                        anim = (this._sign > 0) ? this._turnLeft : this._turnRight;
                    }
                }
                this._avatar.rotation.y = this._avatar.rotation.y + this._turnSpeed * dt * a;
            } else {
                let a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback) a = -1;
                    if (!moving) anim = this._turnLeft;
                } else {
                    if (this._act._walk) a = -1;
                    if (!moving) { a = -1; anim = this._turnRight; }
                }
                this._camera.alpha = this._camera.alpha + a * this._turnSpeed * dt;
            }
        }

        if (this.mode != 1) {
            this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        }

        if (moving) {
            if (this._moveVector.length() > 0.001) {
                this._avatar.moveWithCollisions(this._moveVector);
                //walking up a slope
                if (this._avatar.position.y > this._avStartPos.y) {
                    const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
                    const _sl: number = this._verticalSlope(actDisp);
                    if (_sl >= this._sl2) {
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
                        if (_sl > this._sl) {
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
                        if (this._verticalSlope(actDisp) <= this._sl) {
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
                            anim = this._fall;
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
    private _doIdle(dt: number): _AnimData {
        if (this._grounded) {
            return this._idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        let anim: _AnimData = this._idle;
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
        if (this.mode != 1) this._avatar.rotation.y = this._av2cam - this._camera.alpha;
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
                if (this._verticalSlope(actDisp) <= this._sl) {
                    //                        this.grounded = true;
                    //                        this.idleFallTime = 0;
                    this._groundIt();
                    this._avatar.position.copyFrom(this._avStartPos);
                } else {
                    this._unGroundIt();
                    anim = this._slideBack;
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

        if (this._camera.radius > this._camera.lowerRadiusLimit) { if (this._elasticCamera) this._snapCamera(); }

        if (this._camera.radius <= this._camera.lowerRadiusLimit) {
            if (!this._noFirstPerson && !this._inFP) {
                this._avatar.visibility = 0;
                this._camera.checkCollisions = false;
                this._saveMode = this.mode;
                this.mode = 0;
                this._inFP = true;
            }
        } else {
            this._inFP = false;
            this.mode = this._saveMode;
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
    }

    private _onKeyUp(e: KeyboardEvent) {
        if (!e.key) return;
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
    }


    // public disableKeyBoard() {
    //     let canvas: HTMLCanvasElement = this._scene.getEngine().getRenderingCanvas();
    //     canvas.removeEventListener("keyup", this._handleKeyUp, false);
    //     canvas.removeEventListener("keydown", this._handleKeyDown, false);
    // }

    public enableKeyBoard(b: boolean) {
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
    public run(b: boolean) {
        this._act._walk = b;
        this._act._walkMod = b;
    }
    public turnLeft(b: boolean) {
        this._act._turnLeft = b;
        if (!b) this._turning = b;
    }
    public turnRight(b: boolean) {
        this._act._turnRight = b;
        if (!b) this._turning = b;
    }
    public strafeLeft(b: boolean) {
        this._act._stepLeft = b;
    }
    public strafeRight(b: boolean) {
        this._act._stepRight = b;
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
    private _hasAnims: boolean = false;
    /**
     * 
     * @param avatar 
     * @param camera 
     * @param scene 
     * @param agMap map of animationRange name to animationRange
	 * @param faceForward 
     */
    constructor(avatar: Mesh, camera: ArcRotateCamera, scene: Scene, agMap?: {}, faceForward = false) {

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

        if (!this._isAG) this._skeleton = avatar.skeleton;

        if (!this._isAG && this._skeleton != null) this.checkAnims(this._skeleton);
        this._camera = camera;
        this._savedCameraCollision = this._camera.checkCollisions;

        this._act = new _Action();

        this._renderer = () => { this._moveAVandCamera() };
        this._handleKeyUp = (e) => { this._onKeyUp(e) };
        this._handleKeyDown = (e) => { this._onKeyDown(e) };
    }
}

class _AnimData {
    public _name: string;
    public _loop: boolean = true;
    public _rate: number = 1;
    public _ag: AnimationGroup;
    public _exist: boolean = false;

    public constructor(name: string) {
        this._name = name;
    }
}

class _Action {
    public _walk: boolean = false;
    public _walkback: boolean = false;
    // walk modifier - modifies walk to run
    public _walkMod: boolean = false;
    public _turnRight: boolean = false;
    public _turnLeft: boolean = false;
    public _stepRight: boolean = false;
    public _stepLeft: boolean = false;
    public _jump: boolean = false;


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
        this._walkMod = false;
    }
}
