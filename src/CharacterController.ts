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
    TargetedAnimation,
    Matrix,
    DeepImmutable,
    AbstractMesh,
    PlaySoundAction,
    InstancedMesh,
    Sound,
    AnimationRange,
    Animatable,
    AnimationEvent
} from "babylonjs";
import { SubSurfaceConfiguration } from "babylonjs/Rendering/subSurfaceConfiguration";

export class CharacterController {

    private _avatar: Mesh = null;;
    private _skeleton: Skeleton = null;
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


    private _actionMap: ActionMap = new ActionMap();

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
        this._actionMap.walk.speed = n;
    }
    public setRunSpeed(n: number) {
        this._actionMap.run.speed = n;
    }
    public setBackSpeed(n: number) {
        this._actionMap.walkBack.speed = n;
    }
    public setBackFastSpeed(n: number) {
        this._actionMap.walkBackFast.speed = n;
    }
    public setJumpSpeed(n: number) {
        this._actionMap.idleJump.speed = n;
        this._actionMap.runJump.speed = n;
    }
    public setLeftSpeed(n: number) {
        this._actionMap.strafeLeft.speed = n;
    }
    public setLeftFastSpeed(n: number) {
        this._actionMap.strafeLeftFast.speed = n;
    }
    public setRightSpeed(n: number) {
        this._actionMap.strafeRight.speed = n;
    }
    public setRightFastSpeed(n: number) {
        this._actionMap.strafeLeftFast.speed = n;
    }
    // get turnSpeed in degrees per second.
    // store in radians per second
    public setTurnSpeed(n: number) {
        this._actionMap.turnLeft.speed = n * Math.PI / 180;
        this._actionMap.turnRight.speed = n * Math.PI / 180;
    }
    public setTurnFastSpeed(n: number) {
        this._actionMap.turnLeftFast.speed = n * Math.PI / 180;
        this._actionMap.turnRightFast.speed = n * Math.PI / 180;
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
        if (this._prevActData != null && this._prevActData.exist) this._prevActData.ag.stop();
        this._isAG = true;
        this.setActionMap(<ActionMap>agMap);
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
        this.setActionMap(<ActionMap>arMap);
    }

    /**
     * updates action data in the cc actionMap
     * with action data from the provided/input actionMap 
     * 
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
     * @param inActMap 
     * @returns 
     */
    public setActionMap(inActMap: ActionMap): string {
        let agMap: boolean = false;
        let inActData: ActionData;


        let ccActionNames: string[] = Object.keys(this._actionMap);
        for (let ccActionName of ccActionNames) {
            let ccActData = this._actionMap[ccActionName];
            //some keys could map to functions (like reset())
            if (!(ccActData instanceof ActionData)) continue;
            ccActData.exist = false;

            inActData = inActMap[ccActData.id];
            //in previous version of cc the key value was AnimationGroup rather than ActionData
            //lets accomodate that for backward compatibility
            if (inActData != null) {
                if (inActData instanceof AnimationGroup) {
                    ccActData.ag = inActData;
                    ccActData.name = ccActData.ag.name;
                    ccActData.exist = true;
                    agMap = true;
                    this._hasAnims = true;
                } else if (inActData.exist) {
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
                        if (inActData.loop != null) ccActData.loop = inActData.loop;
                        if (inActData.rate) ccActData.rate = inActData.rate;
                        if (inActData.speed) ccActData.speed = inActData.speed;
                        // if (actDataI.key) actDataO.key = actDataI.key;
                        if (inActData.sound) ccActData.sound = inActData.sound;
                    } else {
                        ccActData.name = inActData;
                    }
                }
            }
        }
        this._checkFastAnims();
        //force to play new anims
        this._prevActData = null;
        if (agMap) return "ag"; else return "ar";
    }

    public getActionMap(): ActionMap {
        let map: ActionMap = new ActionMap();

        let keys: string[] = Object.keys(this._actionMap);
        for (let key of keys) {
            let actDataI = this._actionMap[key];

            if (!(actDataI instanceof ActionData)) continue;
            if (!actDataI.exist) continue;

            let actDataO: ActionData = map[actDataI.id];
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
    }

    public getSettings(): CCSettings {
        let ccs: CCSettings = new CCSettings();
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

        return ccs;
    }

    public setSettings(ccs: CCSettings) {
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

    }

    private _setAnim(anim: ActionData, animName?: string | AnimationGroup, rate?: number, loop?: boolean) {

        //animation range need skeleton
        if (!this._isAG && this._skeleton == null) return;

        if (animName != null) {
            if (this._isAG) {
                if (!(animName instanceof AnimationGroup)) return;
                anim.ag = <AnimationGroup>animName;
                anim.exist = true;
            } else {
                if (this._skeleton.getAnimationRange(anim.name) != null) {
                    anim.name = <string>animName;
                    anim.exist = true;
                } else {
                    anim.exist = false;
                    return;
                }
            }
        }

        if (loop != null) anim.loop = loop;
        if (rate != null) anim.rate = rate;
    }

    public enableBlending(n: number) {
        if (this._isAG) {
            let keys: string[] = Object.keys(this._actionMap);
            for (let key of keys) {
                let act = this._actionMap[key];
                if (!(act instanceof ActionData)) continue;
                if (act.exist) {
                    let ar: AnimationGroup = act.ag;
                    for (let ta of ar.targetedAnimations) {
                        ta.animation.enableBlending = true;
                        ta.animation.blendingSpeed = n;
                    }
                }
            }
        } else {
            if (this._skeleton !== null)
                this._skeleton.enableBlending(n);
        }
    }

    public disableBlending() {
        if (this._isAG) {
            let keys: string[] = Object.keys(this._actionMap);
            for (let key of keys) {
                let anim = this._actionMap[key];
                if (!(anim instanceof ActionData)) continue;
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

    // setters for sound
    public setSound(sound: Sound) {
        let ccActionNames: string[] = Object.keys(this._actionMap);
        sound.loop = false;
        for (let ccActionName of ccActionNames) {
            let ccActData = this._actionMap[ccActionName];
            //some keys could map to functions (like reset())
            if (!(ccActData instanceof ActionData)) continue;
            ccActData.sound = sound;
            ccActData.sound.attachToMesh(this._avatar);
        }
        this._actionMap.idle.sound = null;
        this._actionMap.fall.sound = null;
        this._actionMap.slideBack.sound = null;
    }


    // setters for keys
    public setWalkKey(key: string) {
        this._actionMap.walk.key = key.toLowerCase();
    }
    public setWalkBackKey(key: string) {
        this._actionMap.walkBack.key = key.toLowerCase();
    }
    public setTurnLeftKey(key: string) {
        this._actionMap.turnLeft.key = key.toLowerCase();
    }
    public setTurnRightKey(key: string) {
        this._actionMap.turnRight.key = key.toLowerCase();
    }
    public setStrafeLeftKey(key: string) {
        this._actionMap.strafeLeft.key = key.toLowerCase();
    }
    public setStrafeRightKey(key: string) {
        this._actionMap.strafeRight.key = key.toLowerCase();
    }
    public setJumpKey(key: string) {
        this._actionMap.idleJump.key = key.toLowerCase();
    }

    public setCameraElasticity(b: boolean) {
        this._cameraElastic = b;
    }

    public setElasticiSteps(n: number) {
        this._elasticSteps = n;
    }

    public makeObstructionInvisible(b: boolean) {
        this._makeInvisible = b;
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
            if (!(anim instanceof ActionData)) continue;
            if (skel != null) {
                if (skel.getAnimationRange(anim.id) != null) {
                    anim.name = anim.id;
                    anim.exist = true;
                    this._hasAnims = true;
                }
            } else {
                anim.exist = false;
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

    private _copySlowAnims(f: ActionData, s: ActionData) {
        if (f.exist) return;
        if (!s.exist) return;
        f.exist = true;
        f.ag = s.ag;
        f.name = s.name;
        f.rate = s.rate * 2;
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
    private _isLHS_RHS = false;
    private _signLHS_RHS = -1;
    private _setRHS(mesh: TransformNode) {
        const meshMatrix: Matrix = mesh.getWorldMatrix();
        const _localX = Vector3.FromArray(<DeepImmutable<Float32Array>>meshMatrix.m, 0);
        const _localY = Vector3.FromArray(<DeepImmutable<Float32Array>>meshMatrix.m, 4);
        const _localZ = Vector3.FromArray(<DeepImmutable<Float32Array>>meshMatrix.m, 8);
        const actualZ = Vector3.Cross(_localX, _localY);
        //same direction or opposite direction of Z
        if (Vector3.Dot(actualZ, _localZ) < 0) {
            this._isLHS_RHS = true;
            this._signLHS_RHS = 1;
        }
        else {
            this._isLHS_RHS = false;
            this._signLHS_RHS = -1;
        }
        console.log("have rhs lhs issue " + this._isLHS_RHS);
    }

    /**
     * Use setFaceForward(true|false) to indicate that the avatar's face  points forward (true) or backward (false).
     * The avatar's face  points forward if its face is looking in positive local Z axis direction
     */
    private _ffSign: number;
    private _rhsSign: number;
    private _ff: boolean;
    //in mode 0, av2cam is used to align avatar with camera , with camera always facing avatar's back
    //note:camera alpha is measured anti-clockwise , avatar rotation is measured clockwise 
    private _av2cam;
    public setFaceForward(b: boolean) {
        this._ff = b;

        this._rhsSign = this._scene.useRightHandedSystem ? -1 : 1;

        if (this._isLHS_RHS) {
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
            if (!(anim instanceof ActionData)) continue;
            if (agMap[anim.name] != null) {
                anim.ag = agMap[anim.name];
                anim.exist = true;
            }
        }
    }

    // check if any of the mesh on the node tree is refrenced by any animation group
    private _containsAG(node: Node, ags: AnimationGroup[], fromRoot: boolean) {
        let r: Node;
        let ns: Node[];

        if (fromRoot) {
            r = this._getRoot(node);
            ns = r.getChildren((n) => { return (n instanceof TransformNode) }, false);
        } else {
            r = node;
            ns = [r];
        }

        for (let ag of ags) {
            let tas: TargetedAnimation[] = ag.targetedAnimations;
            for (let ta of tas) {
                if (ns.indexOf(ta.target) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    //get the root of Node
    private _getRoot(tn: Node): Node {
        if (tn.parent == null) return tn;
        return this._getRoot(tn.parent);
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
        this._prevActData = null;
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

    private _prevActData: ActionData = null;
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

    _currentActData: ActionData;
    private _moveAVandCamera() {
        this._avStartPos.copyFrom(this._avatar.position);
        let actData: ActionData = null;
        const dt: number = this._scene.getEngine().getDeltaTime() / 1000;

        if (this._act._jump && !this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            actData = this._doJump(dt);
        } else if (this.anyMovement() || this._inFreeFall) {
            this._grounded = false;
            this._idleFallTime = 0;
            actData = this._doMove(dt);
        } else if (!this._inFreeFall) {
            actData = this._doIdle(dt);
        }
        if (!this._stopAnim && this._hasAnims && actData != null) {
            if (this._prevActData !== actData) {
                if (actData.exist) {

                    //animation frame counts
                    let c: number;

                    if (this._isAG) {
                        if (this._prevActData != null && this._prevActData.exist) this._prevActData.ag.stop();
                        //TODO use start instead of play ?
                        //anim._ag.play(anim._loop);
                        //anim._ag.speedRatio = anim._rate;
                        actData.ag.start(actData.loop, actData.rate);
                        //ag returns normalized frame values between 0 and 1
                        //we will assume 30 fps for animations 
                        c = (actData.ag.to - actData.ag.from) * 30;
                    } else {
                        let a: Animatable = this._skeleton.beginAnimation(actData.name, actData.loop, actData.rate);
                        //a.onAnimationLoop = () => { if (actData.sound != null) actData.sound.play(); };
                        this._currentActData = actData;
                        c = this._skeleton.getAnimationRange(actData.name).to - this._skeleton.getAnimationRange(actData.name).from;
                    }

                    if (this._prevActData != null && this._prevActData.sound != null) {
                        this._prevActData.sound.stop();
                        if (this._sndId != null) {
                            clearInterval(this._sndId);
                        }
                    }
                    if (actData.sound != null) {
                        actData.sound.play();
                        //we will assume 30 fps for animations and play sound twice during the animation
                        this._sndId = setInterval(() => { actData.sound.play(); }, c * 1000 / (30 * actData.rate * 2));
                    }

                }
                this._prevActData = actData;
            }
        }
        this._updateTargetValue();
        return;
    }

    private _soundLoopTime = 700;
    private _sndId = null;
    private _ae: AnimationEvent = new AnimationEvent(0, () => { console.log("anim event playing"); if (this._currentActData.sound != null) this._currentActData.sound.play(); });

    //verical position of AV when it is about to start a jump
    private _jumpStartPosY: number = 0;
    //for how long the AV has been in the jump
    private _jumpTime: number = 0;
    private _doJump(dt: number): ActionData {

        let actData: ActionData = null;
        actData = this._actionMap.runJump;
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
                forwardDist = this._actionMap.run.speed * dt;
            } else if (this._wasWalking) {
                forwardDist = this._actionMap.walk.speed * dt;
            }
            //find out in which horizontal direction the AV was moving when it started the jump
            disp = this._moveVector.clone();
            disp.y = 0;
            disp = disp.normalize();
            disp.scaleToRef(forwardDist, disp);
            jumpDist = this._calcJumpDist(this._actionMap.runJump.speed, dt);
            disp.y = jumpDist;
        } else {
            jumpDist = this._calcJumpDist(this._actionMap.idleJump.speed, dt);
            disp = new Vector3(0, jumpDist, 0);
            actData = this._actionMap.idleJump;
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
                    actData = this._actionMap.fall;
                }
            }
        }
        return actData;
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
    private _doMove(dt: number): ActionData {

        //initial down velocity
        const u: number = this._movFallTime * this._gravity
        //calculate the distance by which av should fall down since last frame
        //assuming it is in freefall
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;

        this._movFallTime = this._movFallTime + dt;

        let moving: boolean = false;
        let actdata: ActionData = null;

        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        }

        //in case avatar was rotated by player, rotate camera around avatar to align with avatar
        actdata = this._rotateC2AV(actdata, moving, dt);


        //in case camera was rotated around avatar by player, rotate avatar to align with camera
        this._rotateAV2C();

        //now that avatar is rotated properly, construct the vector to move the avatar 
        //donot move the avatar if avatar is in freefall

        if (!this._inFreeFall) {
            this._wasWalking = false;
            this._wasRunning = false;

            let sign: number;
            let horizDist: number = 0;
            switch (true) {
                case (this._act._stepLeft):
                    sign = this._signLHS_RHS * this._isAvFacingCamera();
                    horizDist = this._actionMap.strafeLeft.speed * dt;
                    if (this._act._speedMod) {
                        horizDist = this._actionMap.strafeLeftFast.speed * dt;
                        actdata = (-this._ffSign * sign > 0) ? this._actionMap.strafeLeftFast : this._actionMap.strafeRightFast;
                    } else {
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
                    } else {
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
                    } else {
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
                    } else {
                        actdata = this._actionMap.walkBack;
                    }
                    this._moveVector = this._avatar.calcMovePOV(0, -this._freeFallDist, -this._ffSign * horizDist);
                    moving = true;
                    break;
            }
        }

        // move the avatar

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
                            actdata = this._actionMap.fall;
                        }
                    }
                } else {
                    this._endFreeFall();
                }
            }
        }
        return actdata;
    }

    /**
     * rotate avatar to camera in case player is rotating camera around avatar
     */


    private _rotateAV2C() {
        if (this._mode != 1) {
            if (this._noRot) {
                switch (true) {
                    case (this._act._walk && this._act._turnRight):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + this._rhsSign * Math.PI / 4;
                        break;
                    case (this._act._walk && this._act._turnLeft):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha - this._rhsSign * Math.PI / 4;
                        break;
                    case (this._act._walkback && this._act._turnRight):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + this._rhsSign * 3 * Math.PI / 4;
                        break;
                    case (this._act._walkback && this._act._turnLeft):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha - this._rhsSign * 3 * Math.PI / 4;
                        break;
                    case (this._act._walk):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha;
                        break;
                    case (this._act._walkback):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + Math.PI;
                        break;
                    case (this._act._turnRight):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha + this._rhsSign * Math.PI / 2;
                        break;
                    case (this._act._turnLeft):
                        this._avatar.rotation.y = this._av2cam - this._camera.alpha - this._rhsSign * Math.PI / 2;
                        break;
                }
            } else {
                this._avatar.rotation.y = this._av2cam - this._camera.alpha;
            }
        }
    }

    //rotate camera around Avatar in case player is rotating avatar.
    private _rotateC2AV(anim: ActionData, moving: boolean, dt: number): ActionData {
        if (!(this._noRot && this._mode == 0) && (!this._act._stepLeft && !this._act._stepRight) && (this._act._turnLeft || this._act._turnRight)) {
            let turnAngle = this._actionMap.turnLeft.speed * dt;
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
                    if (this._isLHS_RHS) this._sign = - this._sign;
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
                this._camera.alpha = this._camera.alpha + this._rhsSign * turnAngle * a;
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
    private _doIdle(dt: number): ActionData {
        if (this._grounded) {
            return this._actionMap.idle;
        }
        this._wasWalking = false;
        this._wasRunning = false;
        this._movFallTime = 0;
        let anim: ActionData = this._actionMap.idle;
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

        if (this._camera.radius > this._camera.lowerRadiusLimit) { if (this._cameraElastic || this._makeInvisible) this._handleObstruction(); }

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
    private _prevPickedMeshes: AbstractMesh[];
    private _pickedMeshes: AbstractMesh[] = new Array();;
    private _makeInvisible = false;
    private _elasticSteps = 50;
    private _alreadyInvisible: AbstractMesh[];

    /**
     * The following method handles the use case wherein some mesh
     * comes between the avatar and the camera thus obstructing the view
     * of the avatar.
     * Two ways this can be handled
     * a) make the obstructing  mesh invisible
     *   instead of invisible a better option would have been to make semi transparent.
     *   Unfortunately, unlike mesh, mesh instances do not "visibility" setting)
     *   Every alternate frame make mesh visible and invisible to give the impression of semi-transparent.
     * b) move the camera in front of the obstructing mesh
     */
    private _handleObstruction() {

        //get vector from av (camera.target) to camera
        this._camera.position.subtractToRef(this._camera.target, this._rayDir);
        //start ray from av to camera
        this._ray.origin = this._camera.target;
        this._ray.length = this._rayDir.length();
        this._ray.direction = this._rayDir.normalize();

        //TODO 
        //handle case were pick is with a child of avatar, avatar atatchment. etc
        const pis: PickingInfo[] = this._scene.multiPickWithRay(this._ray, (mesh) => {
            if (mesh == this._avatar) return false;
            else return true;
        });


        if (this._makeInvisible) {
            this._prevPickedMeshes = this._pickedMeshes;
            if (pis.length > 0) {
                this._pickedMeshes = new Array();
                for (let pi of pis) {
                    if (pi.pickedMesh.isVisible || this._prevPickedMeshes.includes(pi.pickedMesh)) {
                        pi.pickedMesh.isVisible = false;
                        this._pickedMeshes.push(pi.pickedMesh);
                    }
                }
                for (let pm of this._prevPickedMeshes) {
                    if (!this._pickedMeshes.includes(pm)) {
                        pm.isVisible = true;
                    }
                }
            } else {
                for (let pm of this._prevPickedMeshes) {
                    pm.isVisible = true;
                }
                this._prevPickedMeshes.length = 0;
            }
        }

        if (this._cameraElastic) {
            if (pis.length > 0) {
                // postion the camera in front of the mesh that is obstructing camera

                //if only one obstruction and it is invisible then if it is not collidable or our camera is not collidable then do nothing
                if ((pis.length == 1 && !this._isSeeAble(pis[0].pickedMesh)) && (!pis[0].pickedMesh.checkCollisions || !this._camera.checkCollisions)) return;

                //if our camera is collidable then we donot want it to get stuck behind another collidable obsrtucting mesh
                let pp: Vector3 = null;

                //we will asume the order of picked meshes is from closest to avatar to furthest
                //we should get the first one which is visible or invisible and collidable
                for (let i = 0; i < pis.length; i++) {
                    let pm = pis[i].pickedMesh;
                    if (this._isSeeAble(pm)) {
                        pp = pis[i].pickedPoint;
                        break;
                    } else if (pm.checkCollisions) {
                        pp = pis[i].pickedPoint;
                        break;
                    }
                }
                if (pp == null) return;

                const c2p: Vector3 = this._camera.position.subtract(pp);
                //note that when camera is collidable, changing the orbital camera radius may not work.
                //changing the radius moves the camera forward (with collision?) and collision can interfere with movement
                //
                //in every cylce we are dividing the distance to tarvel by same number of steps.
                //as we get closer to destination the speed will thus slow down.
                //when just 1 unit distance left, lets snap to the final position.
                //when calculating final position make sure the camera does not get stuck at the pickposition especially
                //if collision is on

                const l: number = c2p.length();
                if (this._camera.checkCollisions) {
                    let step: Vector3;
                    if (l <= 1) {
                        step = c2p.addInPlace(c2p.normalizeToNew().scaleInPlace(this._cameraSkin));
                    } else {
                        step = c2p.normalize().scaleInPlace(l / this._elasticSteps);
                    }
                    this._camera.position = this._camera.position.subtract(step);
                } else {
                    let step: number;
                    if (l <= 1) step = l + this._cameraSkin; else step = l / this._elasticSteps;
                    this._camera.radius = this._camera.radius - (step);
                }
            }
        }
    }

    //how many ways can a mesh be invisible?
    private _isSeeAble(mesh: AbstractMesh): boolean {
        if (!mesh.isVisible) return false;
        if (mesh.visibility == 0) return false;
        if (mesh.material != null && mesh.material.alphaMode != 0 && mesh.material.alpha == 0) return false;
        return true;
        //what about vertex color? groan!
    }


    private _move: boolean = false;
    public anyMovement(): boolean {
        return (this._act._walk || this._act._walkback || this._act._turnLeft || this._act._turnRight || this._act._stepLeft || this._act._stepRight);
    }

    private _onKeyDown(e: KeyboardEvent) {
        if (!e.key) return;
        if (e.repeat) return;
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
    }

    private _onKeyUp(e: KeyboardEvent) {
        if (!e.key) return;
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
        this._isAG = this._containsAG(avatar, this._scene.animationGroups, true);

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


        if (this._skeleton != null && this._skelDrivenByAG(skeleton)) this._isAG = true; else this._isAG = false;

        if (!this._isAG && this._skeleton != null) this._checkAnimRanges(this._skeleton);
    }


    // this check if any of this skeleton animations is referenced by any targetedAnimation in any of the animationgroup in the scene.
    private _skelDrivenByAG(skeleton: Skeleton) {
        return skeleton.animations.some(sa => this._scene.animationGroups.some(ag => ag.children.some(ta => ta.animation == sa)));
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
     * @param actionMap/animationGroupMap 
     *        maps actions to animations and other data like speed,sound etc 
     *        or 
     *        for backward compatibility could be AnimationGroup Map
     * @param faceForward 
     */
    constructor(avatar: Mesh, camera: ArcRotateCamera, scene: Scene, actionMap?: {}, faceForward = false) {

        this._camera = camera;
        this._scene = scene;

        let success = this.setAvatar(avatar, faceForward);
        if (!success) {
            console.error("unable to set avatar");
        }


        let dataType: string = null;
        if (actionMap != null) {
            dataType = this.setActionMap(<ActionMap>actionMap);
        }

        //try to use the existing avatar animations

        //animation ranges
        if (!this._isAG && this._skeleton != null) this._checkAnimRanges(this._skeleton);
        //animation groups
        if (this._isAG) {
            //TODO
        }


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

export class ActionData {
    public id: string;
    public speed: number;
    //_ds default speed.  speed is set to this on reset
    public ds: number;
    public sound: Sound;
    public key: string;
    //_dk defailt key
    public dk: string;

    //animation data
    //if _ag is null then assuming animation range and use _name to play animationrange
    //instead of name maybe call it arName?
    public name: string = "";
    public ag: AnimationGroup;
    public loop: boolean = true;
    public rate: number = 1;

    public exist: boolean = false;

    public constructor(id?: string, speed = 1, key?: string) {
        this.id = id;
        this.speed = speed;
        this.ds = speed;
        this.key = key;
        this.dk = key;
    }

    public reset() {
        this.name = "";
        this.speed = this.ds;
        this.key = this.dk;
        this.loop = true;
        this.rate = 1;
        this.sound = null;
        this.exist = false;
    }

}

//not really a "Map"
export class ActionMap {
    public walk = new ActionData("walk", 3, "w");
    public walkBack = new ActionData("walkBack", 1.5, "s");
    public walkBackFast = new ActionData("walkBackFast", 3, "na");
    public idle = new ActionData("idle", 0, "na");
    public idleJump = new ActionData("idleJump", 6, " ");
    public run = new ActionData("run", 6, "na");
    public runJump = new ActionData("runJump", 6, "na");
    public fall = new ActionData("fall", 0, "na");
    public turnLeft = new ActionData("turnLeft", Math.PI / 8, "a");
    public turnLeftFast = new ActionData("turnLeftFast", Math.PI / 4, "na");
    public turnRight = new ActionData("turnRight", Math.PI / 8, "d");
    public turnRightFast = new ActionData("turnRightFast", Math.PI / 4, "na");
    public strafeLeft = new ActionData("strafeLeft", 1.5, "q");
    public strafeLeftFast = new ActionData("strafeLeftFast", 3, "na");
    public strafeRight = new ActionData("strafeRight", 1.5, "e");
    public strafeRightFast = new ActionData("strafeRightFast", 3, "na");
    public slideBack = new ActionData("slideBack", 0, "na");

    public reset() {
        let keys: string[] = Object.keys(this);
        for (let key of keys) {
            let act = this[key];
            if (!(act instanceof ActionData)) continue;
            act.reset()
        }
    }
};

export class CCSettings {
    public faceForward: boolean;
    public gravity: number;
    public minSlopeLimit: number;
    public maxSlopeLimit: number;
    public stepOffset: number;
    public cameraElastic: boolean = true;
    public elasticSteps: number;
    public makeInvisble: boolean = true;
    public cameraTarget: Vector3 = Vector3.Zero();
    public noFirstPerson: boolean = false;
    public topDown: boolean = true;
    //turningOff takes effect only when topDown is false
    public turningOff: boolean = true;
    public keyboard: boolean = true;
}
