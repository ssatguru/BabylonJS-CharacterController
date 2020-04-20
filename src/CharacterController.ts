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
    private _vMovStartPos: Vector3 = new Vector3(0, 0, 0);

    //animations
    private _walk: AnimData = new AnimData("walk");
    private _walkBack: AnimData = new AnimData("walkBack");
    private _idle: AnimData = new AnimData("idle");
    private _idleJump: AnimData = new AnimData("idleJump");
    private _run: AnimData = new AnimData("run");
    private _runJump: AnimData = new AnimData("runJump");
    private _fall: AnimData = new AnimData("fall");
    private _turnLeft: AnimData = new AnimData("turnLeft");
    private _turnRight: AnimData = new AnimData("turnRight");
    private _strafeLeft: AnimData = new AnimData("strafeLeft");
    private _strafeRight: AnimData = new AnimData("strafeRight");
    private _slideBack: AnimData = new AnimData("slideBack");

    private _anims: AnimData[] = [this._walk, this._walkBack, this._idle, this._idleJump, this._run, this._runJump, this._fall, this._turnLeft, this._turnRight, this._strafeLeft, this._strafeRight, this._slideBack];

    //move keys
    private _walkKey: string = "W";
    private _walkBackKey: string = "S";
    private _turnLeftKey: string = "A";
    private _turnRightKey: string = "D";
    private _strafeLeftKey: string = "Q";
    private _strafeRightKey: string = "E";
    private _jumpKey: string = "32";
    private _walkCode: number = 38;
    private _walkBackCode: number = 40;
    private _turnLeftCode: number = 37;
    private _turnRightCode: number = 39;
    private _strafeLeftCode: number = 0;
    private _strafeRightCode: number = 0;
    private _jumpCode: number = 32;

    private _elasticCamera: boolean = true;
    private _cameraTarget: Vector3 = new Vector3(0, 0, 0);
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
            if (agMap[anim.name] != null) {
                anim.ag = agMap[anim.name];
                anim.exist = true;
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
            arData = arMap[anim.name];
            if (arData != null) {
                if (arData instanceof Object) {
                    if (arData["name"]) anim.name = arData["name"];
                    if (arData["loop"]) anim.loop = arData["loop"];
                    if (arData["rate"]) anim.loop = arData["rate"];
                } else {
                    anim.name = arData;
                }
                anim.exist = true;
            }
        }
    }

    private setAnim(anim: AnimData, rangeName?: string | AnimationGroup, rate?: number, loop?: boolean) {
        if (!this._isAG && this._skeleton == null) return;
        if (loop != null) anim.loop = loop;
        if (!this._isAG) {
            if (rangeName != null) anim.name = <string>rangeName;
            if (rate != null) anim.rate = rate;
            if (this._skeleton.getAnimationRange(anim.name) != null) {
                anim.exist = true;
            } else {
                anim.exist = false;
            }
        } else {
            if (rangeName != null) {
                anim.ag = <AnimationGroup>rangeName;
                anim.exist = true;
            }
            if (rate != null && anim.exist) {
                anim.rate = rate;
                anim.ag.speedRatio = rate;
            }
        }
    }

    public enableBlending(n: number) {
        if (this._isAG) {
            for (let anim of this._anims) {
                if (anim.exist) {
                    let ar: AnimationGroup = anim.ag;
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
                if (anim.exist) {
                    let ar: AnimationGroup = anim.ag;
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
    public setSrafeLeftAnim(rangeName: string | AnimationGroup, rate: number, loop: boolean) {
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
        this._walkKey = key
    }
    public setWalkBackKey(key: string) {
        this._walkBackKey = key
    }
    public setTurnLeftKey(key: string) {
        this._turnLeftKey = key
    }
    public setTurnRightKey(key: string) {
        this._turnRightKey = key
    }
    public setStrafeLeftKey(key: string) {
        this._strafeLeftKey = key
    }
    public setStrafeRightKey(key: string) {
        this._strafeRightKey = key
    }
    public setJumpKey(key: string) {
        this._jumpKey = key
    }

    public setWalkCode(code: number) {
        this._walkCode = code
    }
    public setWalkBackCode(code: number) {
        this._walkBackCode = code
    }
    public setTurnLeftCode(code: number) {
        this._turnLeftCode = code
    }
    public setTurnRightCode(code: number) {
        this._turnRightCode = code
    }
    public setStrafeLeftCode(code: number) {
        this._strafeLeftCode = code
    }
    public setStrafeRightCode(code: number) {
        this._strafeRightCode = code
    }
    public setJumpCode(code: number) {
        this._jumpCode = code
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
                if (skel.getAnimationRange(anim.name) != null) anim.exist = true;
            } else {
                anim.exist = false;
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
        * 
        * BABYLONJS GLB models are RHS and exhibit this behavior
        * 
        */
    private _isRHS = false;
    private _signRHS = -1;
    private _setRHS(mesh: TransformNode) {

        let meshMatrix: Matrix = mesh.getWorldMatrix();
        let _localX = Vector3.FromFloatArray(meshMatrix.m, 0);
        let _localY = Vector3.FromFloatArray(meshMatrix.m, 4);
        let _localZ = Vector3.FromFloatArray(meshMatrix.m, 8);

        let actualZ = Vector3.Cross(_localX, _localY);
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
    private _faceForward = -1;
    public setFaceForward(b: boolean) {
        b ? this._faceForward = -1 : 1;
        if (this._isRHS && b) {
            this._degree270 = - this._degree270;
            this._faceForward = 1;
        }
    }

    private checkAGs(agMap: {}) {
        for (let anim of this._anims) {
            if (agMap[anim.name] != null) {
                anim.ag = agMap[anim.name];
                anim.exist = true;
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

        window.addEventListener("keyup", this._handleKeyUp, false);
        window.addEventListener("keydown", this._handleKeyDown, false);

        this._scene.registerBeforeRender(this._renderer);
        this._scene
    }

    public stop() {
        if (!this._started) return;
        this._started = false;
        this._scene.unregisterBeforeRender(this._renderer);
        window.removeEventListener("keyup", this._handleKeyUp, false);
        window.removeEventListener("keydown", this._handleKeyDown, false);

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

    private _prevAnim: AnimData = null;

    private _avStartPos: Vector3 = new Vector3(0, 0, 0);
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
        let anim: AnimData = null;
        let dt: number = this._scene.getEngine().getDeltaTime() / 1000;

        if (this._act.jump && !this._inFreeFall) {
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
                if (anim.exist) {
                    if (this._isAG) {
                        if (this._prevAnim != null && this._prevAnim.exist) this._prevAnim.ag.stop();
                        anim.ag.play(anim.loop);
                    } else {
                        this._skeleton.beginAnimation(anim.name, anim.loop, anim.rate);
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
    private _doJump(dt: number): AnimData {

        let anim: AnimData = null;
        anim = this._runJump;
        if (this._jumpTime === 0) {
            this._jumpStartPosY = this._avatar.position.y;
        }
        //up velocity at the begining of the lastt frame (v=u+at)
        let js: number = this._jumpSpeed - this._gravity * this._jumpTime;
        //distance travelled up since last frame to this frame (s=ut+1/2*at^2)
        let jumpDist: number = js * dt - 0.5 * this._gravity * dt * dt;
        this._jumpTime = this._jumpTime + dt;

        let forwardDist: number = 0;
        let disp: Vector3;
        if (this.mode != 1) this._avatar.rotation.y = this._degree270 - this._camera.alpha;
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
            //anim=this.fall;
            //check if going up a slope or back on flat ground 
            if ((this._avatar.position.y > this._avStartPos.y) || ((this._avatar.position.y === this._avStartPos.y) && (disp.length() > 0.001))) {
                this._endJump();
            } else if (this._avatar.position.y < this._jumpStartPosY) {
                //the avatar is below the point from where it started the jump
                //so it is either in free fall or is sliding along a downward slope
                //
                //if the actual displacemnt is same as the desired displacement then AV is in freefall
                //else it is on a slope
                let actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
                if (!(this._areVectorsEqual(actDisp, disp, 0.001))) {
                    //AV is on slope
                    //Should AV continue to slide or stop?
                    //if slope is less steeper than acceptable then stop else slide
                    if (this._verticalSlope(actDisp) <= this._sl) {
                        this._endJump();
                    }
                }
            }
        }
        return anim;
    }

    /**
     * does cleanup at the end of a jump
     */
    private _endJump() {
        this._act.jump = false;
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
    private _turnedBack = false;
    private _turnedForward = true;
    // private _degree270 = -4.69;
    private _degree270 = 3 * (Math.PI / 2);

    private _doMove(dt: number): AnimData {

        //initial down velocity
        let u: number = this._movFallTime * this._gravity
        //calculate the distance by which av should fall down since last frame
        //assuming it is in freefall
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;

        this._movFallTime = this._movFallTime + dt;

        let moving: boolean = false;
        let anim: AnimData = null;

        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        } else {
            this._wasWalking = false;
            this._wasRunning = false;

            if (this._act.forward) {
                let forwardDist: number = 0;
                if (this._act.shift) {
                    this._wasRunning = true;
                    forwardDist = this._runSpeed * dt;
                    anim = this._run;
                } else {
                    this._wasWalking = true;
                    forwardDist = this._walkSpeed * dt;
                    anim = this._walk;
                }
                if (this.mode != 1) {
                    this._avatar.rotation.y = this._degree270 - this._camera.alpha;
                } else {
                    if (!this._turnedForward) {
                        this._turnedForward = true;
                        this._turnedBack = false;
                        //this.avatar.rotation.y -= 3.14;
                    }
                }
                this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, this._faceForward * forwardDist);
                moving = true;
            } else if (this._act.backward) {
                this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._faceForward * (this._backSpeed * dt));
                anim = this._walkBack;
                moving = true;
            } else if (this._act.stepLeft) {
                anim = this._strafeLeft;
                this._moveVector = this._avatar.calcMovePOV(this._signRHS * (this._leftSpeed * dt) * this._isAvFacingCamera(), -this._freeFallDist, 0);
                moving = true;
            } else if (this._act.stepRight) {
                anim = this._strafeRight;
                this._moveVector = this._avatar.calcMovePOV(-this._signRHS * (this._rightSpeed * dt) * this._isAvFacingCamera(), -this._freeFallDist, 0);
                moving = true;
            }
        }

        if ((!this._act.stepLeft && !this._act.stepRight) && (this._act.turnLeft || this._act.turnRight)) {

            if (this.mode == 1) {
                // while turining, the avatar could start facing away from camera and end up facing camera.
                // we should not switch turning direction during this transition
                if (this._act.name != this._act.prevName) {
                    this._act.prevName = this._act.name;
                    this._sign = this._isAvFacingCamera();
                }
                if (this._act.turnLeft) {
                    if (this._act.forward) this._avatar.rotation.y += this._turnSpeed * dt * this._sign;
                    else if (this._act.backward) this._avatar.rotation.y -= this._turnSpeed * dt * this._sign;
                    else {
                        this._avatar.rotation.y += this._turnSpeed * dt * this._sign;
                        anim = this._turnLeft;
                    }
                } else {
                    if (this._act.forward) this._avatar.rotation.y -= this._turnSpeed * dt * this._sign;
                    else if (this._act.backward) this._avatar.rotation.y += this._turnSpeed * dt * this._sign;
                    else {
                        this._avatar.rotation.y -= this._turnSpeed * dt * this._sign;
                        anim = this._turnRight;
                    }
                }
            } else {
                if (this._act.turnLeft) {
                    this._camera.alpha = this._camera.alpha + this._turnSpeed * dt;
                    if (!moving) anim = this._turnLeft;
                } else {
                    this._camera.alpha = this._camera.alpha - this._turnSpeed * dt;
                    if (!moving) anim = this._turnRight;
                }
                this._avatar.rotation.y = this._degree270 - this._camera.alpha;
            }
        }

        if (moving) {
            //if (this.mode != 1) this._avatar.rotation.y = this._degree270 - this._camera.alpha;
            if (this._moveVector.length() > 0.001) {
                this._avatar.moveWithCollisions(this._moveVector);
                //walking up a slope
                if (this._avatar.position.y > this._avStartPos.y) {
                    let actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
                    let _sl: number = this._verticalSlope(actDisp);
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
                    let actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
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
    private _doIdle(dt: number): AnimData {
        if (this._grounded) {
            return this._idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        let anim: AnimData = this._idle;
        this._fallFrameCount = 0;


        if (dt === 0) {
            this._freeFallDist = 5;
        } else {
            let u: number = this._idleFallTime * this._gravity
            this._freeFallDist = u * dt + this._gravity * dt * dt / 2;
            this._idleFallTime = this._idleFallTime + dt;
        }
        //if displacement is less than 0.01(? need to verify further) then 
        //moveWithDisplacement down against a surface seems to push the AV up by a small amount!!
        if (this._freeFallDist < 0.01) return anim;
        let disp: Vector3 = new Vector3(0, -this._freeFallDist, 0);;
        if (this.mode != 1) this._avatar.rotation.y = this._degree270 - this._camera.alpha;
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
            let actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
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

        let pi: PickingInfo = this._scene.pickWithRay(this._ray, (mesh) => {
            //if(mesh==this.avatar||!mesh.isPickable||!mesh.checkCollisions) return false;
            if (mesh == this._avatar || !mesh.checkCollisions) return false;
            else return true;
        }, true);

        if (pi.hit) {
            //postion the camera in front of the mesh that is obstructing camera
            if (this._camera.checkCollisions) {
                let newPos: Vector3 = this._camera.target.subtract(pi.pickedPoint).normalize().scale(this._cameraSkin);
                pi.pickedPoint.addToRef(newPos, this._camera.position);
            } else {
                let nr: number = pi.pickedPoint.subtract(this._camera.target).length();
                this._camera.radius = nr - this._cameraSkin;
            }
        }
    }

    private _move: boolean = false;
    public anyMovement(): boolean {
        return (this._act.forward || this._act.backward || this._act.turnLeft || this._act.turnRight || this._act.stepLeft || this._act.stepRight);
    }

    private _onKeyDown(e: Event) {
        let event: KeyboardEvent = <KeyboardEvent>e;
        let code: number = event.keyCode;
        let chr: string = String.fromCharCode(code);

        if ((chr === this._jumpKey) || (code === this._jumpCode)) this._act.jump = true;
        else if (code === 16) this._act.shift = true;
        //WASD or arrow keys
        else if ((chr === this._walkKey) || (code === this._walkCode)) this._act.forward = true;
        else if ((chr === this._turnLeftKey) || (code === this._turnLeftCode)) { this._act.turnLeft = true; this._act.name = "tl" }
        else if ((chr === this._turnRightKey) || (code === this._turnRightCode)) { this._act.turnRight = true; this._act.name = "tr" }
        else if ((chr === this._walkBackKey) || (code === this._walkBackCode)) this._act.backward = true;
        else if ((chr === this._strafeLeftKey) || (code === this._strafeLeftCode)) this._act.stepLeft = true;
        else if ((chr === this._strafeRightKey) || (code === this._strafeRightCode)) this._act.stepRight = true;
        this._move = this.anyMovement();
    }

    private _onKeyUp(e: Event) {
        let event: KeyboardEvent = <KeyboardEvent>e;
        let code: number = event.keyCode;
        let chr: string = String.fromCharCode(code);

        if (code === 16) { this._act.shift = false; }
        //WASD or arrow keys
        else if ((chr === this._walkKey) || (code === this._walkCode)) this._act.forward = false;
        else if ((chr === this._turnLeftKey) || (code === this._turnLeftCode)) { this._act.turnLeft = false; this._act.name = ""; this._act.prevName = "" }
        else if ((chr === this._turnRightKey) || (code === this._turnRightCode)) { this._act.turnRight = false; this._act.name = ""; this._act.prevName = "" }
        else if ((chr === this._walkBackKey) || (code === this._walkBackCode)) this._act.backward = false;
        else if ((chr === this._strafeLeftKey) || (code === this._strafeLeftCode)) this._act.stepLeft = false;
        else if ((chr === this._strafeRightKey) || (code === this._strafeRightCode)) this._act.stepRight = false;

        this._move = this.anyMovement();
    }

    // control movement by commands rather than keyboard.
    public disableKeyBoard() {
        window.removeEventListener("keyup", this._handleKeyUp, false);
        window.removeEventListener("keydown", this._handleKeyDown, false);
    }

    public enableKeyBoard() {
        window.addEventListener("keyup", this._handleKeyUp, false);
        window.addEventListener("keydown", this._handleKeyDown, false);
    }

    public walk(b: boolean) {
        this._act.forward = b;
    }
    public walkBack(b: boolean) {
        this._act.backward = b;
    }
    public run(b: boolean) {
        this._act.forward = b;
        this._act.shift = b;
    }
    public turnLeft(b: boolean) {
        this._act.turnLeft = b;
        if (b) this._act.name = "tl"
        else {
            this._act.name = "";
            this._act.prevName = "";
        }
    }
    public turnRight(b: boolean) {
        this._act.turnRight = b;
        if (b) this._act.name = "tr"
        else {
            this._act.name = "";
            this._act.prevName = "";
        }
    }
    public strafeLeft(b: boolean) {
        this._act.stepLeft = b;
    }
    public strafeRight(b: boolean) {
        this._act.stepRight = b;
    }
    public jump() {
        this._act.jump = true;
    }
    public idle() {
        this._act.reset();
    }



    private _act: Action;
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
     */
    constructor(avatar: Mesh, camera: ArcRotateCamera, scene: Scene, agMap?: {}, faceForward?: boolean) {

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

        this._act = new Action();

        this._renderer = () => { this._moveAVandCamera() };
        this._handleKeyUp = (e) => { this._onKeyUp(e) };
        this._handleKeyDown = (e) => { this._onKeyDown(e) };

        window.addEventListener("keyup", this._handleKeyUp, false);
        window.addEventListener("keydown", this._handleKeyDown, false);

    }



}

export class AnimData {
    public name: string;
    public loop: boolean = true;
    public rate: number = 1;
    public ag: AnimationGroup;
    public exist: boolean = false;

    public constructor(name: string) {
        this.name = name;
    }
}

export class Action {
    public forward: boolean;
    public backward: boolean;
    public turnRight: boolean;
    public turnLeft: boolean;
    public stepRight: boolean;
    public stepLeft: boolean;
    public jump: boolean;
    public shift: boolean;

    public name: string;
    public prevName: string = "";

    constructor() {
        this.reset();
    }

    reset() {
        this.forward = false;
        this.backward = false;
        this.turnRight = false;
        this.turnLeft = false;
        this.stepRight = false;
        this.stepLeft = false;
        this.jump = false;
        this.shift = false;
    }

}




