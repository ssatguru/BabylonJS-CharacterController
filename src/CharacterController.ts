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
    AnimationEvent,
    int,
    LinesMesh,
    MeshBuilder,
    Color3
} from "babylonjs";


export class CharacterController {

    private _avatar: Mesh = null;
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
    private _pauseCam:boolean = false;
    //position of av when it started moving up
    private _vMovStartPos: Vector3 = Vector3.Zero();


    private _actionMap: ActionMap = new ActionMap();

    private _cameraElastic: boolean = true;
    private _cameraTarget: Vector3 = Vector3.Zero();
    //should we go into first person view when camera is near avatar (radius is lowerradius limit)
    private _noFirstPerson: boolean = false;

    private _down: Vector3 = Vector3.DownReadOnly;


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
        ccs.sound = this._stepSound;

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
        this.setSound(ccs.sound);

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


    _stepSound: Sound;
    // setters for sound
    public setSound(sound: Sound) {
        if (sound == null) return;
        this._stepSound = sound;
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
     * 0 In fps/third person game rotating the camera around the avatar , rotates the avatar too.
     * 
     * cannot switch mode to 0 if no camera avaiable.
     */
    private _mode = 0;
    private _saveMode = 0;
    public setMode(n: number) {
        //cannot switch mode to 0 if no camera avaiable.
        if (this._hasCam) {
            this._mode = n;
            this._saveMode = n;
        } else {
            this._mode = 1;
            this._saveMode = 1;
        }
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
        const _localX = Vector3.FromArray(meshMatrix.m, 0);
        const _localY = Vector3.FromArray(meshMatrix.m, 4);
        const _localZ = Vector3.FromArray(meshMatrix.m, 8);
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

        if (!this._hasCam) {
            this._av2cam = 0;
            this._ffSign = 1;
            return;
        }

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
        if (this._ekb) this._addkeylistener();
        this._scene.registerBeforeRender(this._renderer);
    }

    public stop() {
        if (!this._started) return;
        this._started = false;
        this._scene.unregisterBeforeRender(this._renderer);
        this._removekeylistener();
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

        if (this._prevActData != null && this._prevActData.exist) {
            //stop current animation
            if (this._isAG) {
                this._prevActData.ag.stop();
            } else {
                //this._scene.stopAnimation(this._skeleton, this._prevActData.name);
                this._scene.stopAnimation(this._skeleton);
                //this._scene.stopAllAnimations();
            }
            //stop current sound
            if (this._prevActData.sound != null) {
                this._prevActData.sound.stop();
            }
            clearInterval(this._sndId);

            this._scene.unregisterBeforeRender(this._renderer);
        }
    }

    /**
     * use resumeAnim to resume the character controller playing
     * animations on the character.
     * see also pauseAnim()
     */
    public resumeAnim() {
        this._stopAnim = false;
        this._prevActData = null;
        this._scene.registerBeforeRender(this._renderer);
    }

    private _prevActData: ActionData = null;
    private _avStartPos: Vector3 = Vector3.Zero();
    private _pickStartY: number = 0;
    private _grounded: boolean = false;
    //distance by which AV would move down if in freefall
    private _freeFallDist: number = 0;

    //how many minimum contiguos frames should the AV have been in free fall
    //before we assume AV is in big freefall.
    //we will use this to remove animation flicker during move down a slope (fall, move, fall move etc)
    //TODO: base this on slope - large slope large count
    private _fallFrameCountMin: number = 20;
    private _fallFrameCount: number = 0;

    private _inFreeFall: boolean = false;
    private _wasWalking: boolean = false;
    private _wasRunning: boolean = false;
    private _moveVector: Vector3;

    //used only in mode 1
    //value 1 or -1 , -1 if avatar is facing camera
    //private _notFacingCamera = 1;

    private _isAvFacingCamera(): number {
        if (!this._hasCam) return 1;
        if (Vector3.Dot(this._avatar.forward, this._avatar.position.subtract(this._camera.position)) < 0) return 1
        else return -1;
    }

    private _moveAVandCamera() {
        this._avStartPos.copyFrom(this._avatar.position);
        let actData: ActionData = null;
        const dt: number = this._scene.getEngine().getDeltaTime() / 1000;

        if (this._act._jump && !this._inFreeFall) {
            this._vMoveTot = 0;
            this._pauseCam = false;
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
            // console.log("anim: " + actData.name);
            if (this._prevActData !== actData) {
                if (actData.exist) {

                    //animation frame counts
                    let c: number;
                    let fps: number = 30;

                    if (this._isAG) {
                        if (this._prevActData != null && this._prevActData.exist) this._prevActData.ag.stop();
                        actData.ag.start(actData.loop, actData.rate);
                        fps = actData.ag.targetedAnimations[0].animation.framePerSecond;
                        c = (actData.ag.to - actData.ag.from);
                    } else {
                        let a: Animatable = this._skeleton.beginAnimation(actData.name, actData.loop, actData.rate);
                        fps = a.getAnimations()[0].animation.framePerSecond;
                        c = this._skeleton.getAnimationRange(actData.name).to - this._skeleton.getAnimationRange(actData.name).from;
                    }

                    //SOUND
                    //TODO do sound as animationevent.
                    if (this._prevActData != null && this._prevActData.sound != null) {
                        this._prevActData.sound.stop();
                    }
                    clearInterval(this._sndId);
                    if (actData.sound != null) {
                        actData.sound.play();
                        //play sound twice during the animation
                        this._sndId = setInterval(() => { actData.sound.play(); }, c * 1000 / (fps * Math.abs(actData.rate) * 2));
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

        // if (this._hasCam && this._mode != 1 && !this._noRot) this._avatar.rotation.y = this._av2cam - this._camera.alpha;
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
                    let _ng = this._isNearGround(actDisp);
                    if (_ng.slope <= this._sl1) {
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
        //up velocity at the begining of the last frame (v=u+at)
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
    private _steps = true;
    private _stepHigh:boolean = false;
    private _doMove(dt: number): ActionData {
        // console.log("doMove");

        //initial down velocity (v=u+at)
        const u: number =  this._gravity * this._movFallTime ;

        //calculate the distance by which av should move down since last frame
        //s=ut+att/2
        this._freeFallDist = u * dt + this._gravity * dt * dt / 2;

        this._movFallTime = this._movFallTime + dt;

        let moving: boolean = false;
        let actdata: ActionData = null;

        if (this._inFreeFall) {
            this._moveVector.y = -this._freeFallDist;
            moving = true;
        }


        //rotate avatar with respect to camera direction. 
        this._rotateAV2C();

        //rotate the avatar in case player is trying to rotate the avatar. rotate the camera too if camera turning is on
        actdata = this._rotateAVnC(actdata, moving, dt);

        //now that avatar is rotated properly, construct the vector to move the avatar 
        //donot move the avatar if avatar is in freefall

        if (!this._inFreeFall) {
            this._wasWalking = false;
            this._wasRunning = false;

            let sign: number;
            let horizDist: number = 0;
            switch (true) {
                case (this._act._stepLeft):
                    // console.log("step left");
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
                    // console.log("step right");
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
                    // console.log("walk");
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
                    // console.log("walk back");
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
                //console.log("moving", this._moveVector);
                this._avatar.moveWithCollisions(this._moveVector);

                let actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);

                const _ng = this._isNearGround(actDisp);

                //walking up a step or a  slope
                if (this._avatar.position.y - this._avStartPos.y > 0.01) {
                //if (this._avatar.position.y > this._avStartPos.y) {
                    //if AV is going up even though slope is 0 then that means AV is trying to climb steps
                    //The elliptical shape of ellipsoid allows this.
                    if (_ng.slope == 0) {
                        //if user has specified step offset then prevent AV from going beyond that
                        //otherwise allow whatever the ellisoid allows
                        if (this._stepOffset > 0) {
                            if (this._vMoveTot == 0) {
                                //if AV just started climbing step, note down the position
                                this._vMovStartPos.copyFrom(this._avStartPos);

                                //The pick ray being in front, will pick a step and 
                                //thus can be used to calc the step height
                                let stepHeight = _ng.y - this._vMovStartPos.y;

                                //if the step height is more than that allowed
                                if (stepHeight > this._stepOffset) {
                                    this._stepHigh = true;
                                    //move av back to its position at begining of steps
                                    // this._avatar.position.copyFrom(this._vMovStartPos);
                                    // this._pauseCam = true;
                                }else{
                                    this._stepHigh = false;
                                }
                            }
                          

                            //if the av is trying to climb step at an angle then the pick might miss the step
                            //in such case let the av move up but keep track of how much it has moved up
                            this._vMoveTot = this._avatar.position.y - this._vMovStartPos.y;

                            //if the total amount by which the AV has moved up exceeds the allowable limit then
                            //move av back to its position at begining of steps
                            //(this doesnot seem to work very reliably)
                            if (this._stepHigh) {
                                //move av back to its position at begining of steps
                                this._avatar.position.copyFrom(this._vMovStartPos);
                            }
                            else if (this._vMoveTot > this._stepOffset) {
                                this._avatar.position.copyFrom(this._vMovStartPos);
                                this._pauseCam=true;
                                this._vMoveTot = 0
                            }   
                        }
                    } else {
                        //looks like the avatar is going up a slope
                        this._vMoveTot = 0;
                        this._pauseCam=false;
                        const _slp = _ng.slope;

                        //if slope is less than the higher slope limit then continue moving up
                        //if slope is greater than the higher slope limit then stop moving up
                        //
                        //But sometimes even if the the slope is greater than the higher slope limit 
                        //we may want avatar to continue moving up the slope.
                        //Remember that the the ray is in front of the avatar (when the avatar is facing the slope).
                        //Thus the slope read, is not the slope of the ground under the avatar but of ground in front of the avatar.
                        //Now the ground in front can suddenly start sloping down more than allowable limit.
                        //In that case the avatar should not stop but continue moving forward.
                        //To identify this use case we need to check if the current pickpoint is below the previous pickpoint.
                        //Normally if we are going up the slope then the current pickpoint
                        //should always be above the previous pickpoint.
                        //If this is not the case then we have identifed this use case of a downward slope ahead.
                        //Note: the slope does not tell us if it is a upward slope or a downward slope

                        if (_slp >= this._sl2 && _ng.y > this._pickStartY) {
                            //move av back to old position
                            this._avatar.position.copyFrom(this._avStartPos);
                            this._endFreeFall();
                            this._pickStartY = 0;
                        } else {
                            //keep moving up the slope
                            this._pickStartY = _ng.y;
                            if (_slp > this._sl1) {
                                //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                                this._fallFrameCount = 0;
                                this._inFreeFall = false;
                            } else {
                                //continue walking
                                this._endFreeFall();
                            }
                        }
                    }
                   
                } else 
                    // if (this._avStartPos.y - this._avatar.position.y > 0.01 ) {
                    if ( this._avatar.position.y < this._avStartPos.y ) {
                    this._pauseCam = false;
                    //av is going down a slope or is in free fall
                    this._vMoveTot = 0;
                    const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);

                    //if the AV falls by an amount equal to the free fall distance calculated then it is in freefall
                    //Now the AV could be going down a slope but still be seen as if it is in a freefall.
                    //This could happen if the AV is going down a steep fall. In such cases the AV move forward, 
                    // goes in freefall,hits the slope,goes in freefall again and so on
                    //To make sure this is not the case check the pickray does not hit the ground or if it does then 
                    // the pickpoint is atleast 1 unit(?) below the avatar's position
                    //if (this._areVectorsEqual(actDisp, this._moveVector, 0.001) &&  (!_ng.hit || (_ng.hit && this._avatar.position.y - _ng.y > 1))) {
                    if (this._areVectorsEqual(actDisp, this._moveVector, 0.001) &&  !_ng.hit) {
                        //AV is in freefall

                        this._pauseCam = false;
                        this._inFreeFall = true;
                        
                        //AV could be running down a slope which mean freefall,run,freefall run ...
                        //to remove anim flicker, check if AV has been falling down continously for last few consecutive frames
                        //before changing to free fall animation
                        // this._fallFrameCount++;
                        // if (this._fallFrameCount > this._fallFrameCountMin) {
                            actdata = this._actionMap.fall;
                        // }
                    
                  
                    }else {
                          //if (_ng.y >= this._avatar.position.y) {
                        //AV is on ground and thus on slope
                        //
                        //Should AV continue to slide or walk?
                        //if slope is less steeper than acceptable then walk else slide
                        //if (this._verticalSlope(actDisp) <= this._sl1) {
                            if (_ng.slope <= this._sl1) {
                               // this._endFreeFall();
                               this._fallFrameCount = 0;
                                this._inFreeFall = false;
                            } else {
                                //av is on a steep slope , keep the moveFallTIme non zero to continue deaccelerate it vertically
                                this._fallFrameCount = 0;
                                this._inFreeFall = false;
                            }
                       
                    }
                } else {
                    //AV is walking on a flat surface
                    this._pauseCam = false;
                    this._vMoveTot = 0;
                    //this._endFreeFall();
                    this._fallFrameCount = 0;
                    this._inFreeFall = false;
                }
            }
        }
        return actdata;
    }



    //check if any collidable mesh is just below the avatar's ellipsoid
    private _isNearGround(actDisp: Vector3): { "name": string, "ground": boolean, "slope": number,"y":number,"hit":boolean } {

        let upDist = this._avatar.position.y - this._avStartPos.y;
        // console.log("upDist", upDist);
        let up:boolean = true;
        if (Math.abs(upDist) < 0.006) { 
            up = true;
        }else{
            up = (upDist > 0.01 ) ? true : false;
        }
        let fwd: boolean;
        actDisp.y = 0;
        if (actDisp.x == 0 && actDisp.z == 0) {
            fwd = true;
        } else {
            let cosTheta = Vector3.Dot(this._avatar.forward, actDisp.normalize());
            fwd = (cosTheta >= 0) ? true : false;
        }
        let fact = (up && fwd) || (!up && !fwd) ? 1 : -1;

        //SAT DEBUG
        // fact=1;

        // send the pick ray vertically down starting from a pont which is
        // a) in the middle of the ellipsoid  and
        // b) either front or back of the avatar
        // if AV is moving forward and up (in otherwords facing the slope) then ray in front
        // if AV is moving backward and down (in otherwords facing the slope) then ray in front
        // if AV is moving forward and down (in otherwords facing away from the slope) then ray in back
        // if AV is moving backward and  up (in otherwords facing away from the slope) then ray in back
        // This way the ray is targetting a point on the ground which is slightly above the avatar feet thus 
        // ensuring that the ray will always hit the ground.
        // The length of the ray is such that it atleast reaches the bottom of the avator.

        this._avatar.forward.scaleToRef(this._avatar.ellipsoid.x * fact, this._ray.origin);
        this._ray.origin.addToRef(this._avatar.position, this._ray.origin);
        this._ray.origin.addToRef(this._avatar.ellipsoidOffset, this._ray.origin);
        //this._avatar.position.addToRef(this._avatar.ellipsoidOffset, this._ray.origin);
        //this._ray.origin.y = this._ray.origin.y - this._avatar.ellipsoid.y;
        //from the bottom of ellipsoid go down 1/4 the ellipsoid height to check for any mesh
        //this._ray.length = this._avatar.ellipsoid.y + this._stepOffset;
        this._ray.length = this._avatar.ellipsoid.y *2;
        //direction is towards the bottom
        this._ray.direction = this._down;

        //draw pick ray
        if (this._ellipsoid !=null) {
            this._drawLines(this._ray.origin, this._ray.origin.add(new Vector3(0, -this._ray.length, 0)));
        }

        
        //handle case were pick is with a child of avatar, avatar atatchment. etc
        //check if any collidable mesh is there just below the avatar's ellipsoid
        const pi: PickingInfo = this._scene.pickWithRay(this._ray, (mesh) => {
            if (this._avChildren.includes(mesh)) return false;
            if (mesh.checkCollisions) return true;
            return false;
        });

        if (pi != null && pi.hit) {
            let n: Vector3 = pi.getNormal(true, true);
            let slope: number = Math.PI / 2 - Math.asin(Math.abs(n.y));
            return { "name": pi.pickedMesh.name, "ground": true, "slope": slope, "y":pi.pickedPoint.y, "hit":true };
        }
        else return { "name": "", "ground": false, "slope": 0, "y":0, "hit":false };

    }


    //check if any collidable mesh is just below the avatar's ellipsoid
    private _isNearGround_old(): { "name": string, "ground": boolean, "slope": number } {
        //start the ray from the bottom of avatar's ellipsod
        //ellipsoid center = avatar position + ellipsoid offset
        //ellipsoid bottom = ellipsoid center - ellipsoid height 
        this._avatar.position.addToRef(this._avatar.ellipsoidOffset, this._ray.origin);
        this._ray.origin.y = this._ray.origin.y - this._avatar.ellipsoid.y;
        //from the bottom of ellipsoid go down 1/4 the ellipsoid height to check for any mesh
        this._ray.length = this._avatar.ellipsoid.y / 2;
        //direction is towards the bottom
        this._ray.direction = this._down;



        //TODO 
        //handle case were pick is with a child of avatar, avatar atatchment. etc
        //check if any collidable mesh is there just below the avatar's ellipsoid
        const pis: PickingInfo[] = this._scene.multiPickWithRay(this._ray, (mesh) => {
            if (mesh == this._avatar) return false;
            if (mesh.checkCollisions) return true
            else return false;
        });

        if (pis.length > 0) {
            let pi: PickingInfo = pis[0];

            let n: Vector3 = pi.getNormal(true, true);
            let slope: number = Math.PI / 2 - Math.asin(Math.abs(n.y));

            return { "name": pi.pickedMesh.name, "ground": true, "slope": slope };
        }
        else return { "name": "", "ground": false, "slope": 0 };

    }


    //for debugging purpose draws the rayline use to detect slope or steps
    _rayLine: LinesMesh = null;
    _lineOptions:any = {};
    private _drawLines(pt1: Vector3, pt2: Vector3) {
        if (this._rayLine == null){
            const myPoints = [pt1, pt2];
            this._lineOptions = {
                points: myPoints,
                updatable: true
            }
            this._rayLine = MeshBuilder.CreateLines("lines", this._lineOptions );
        }else {
            this._lineOptions.points[0]=pt1;
            this._lineOptions.points[1]=pt2;
            this._lineOptions.instance = this._rayLine;
            this._rayLine = MeshBuilder.CreateLines("lines", this._lineOptions);
        }
    }

    /**
     * rotate avatar with respect to camera direction. 
     */
    private _rotateAV2C() {
        if (this._hasCam)
            if (this._mode != 1) {
                let ca = (this._hasCam) ? (this._av2cam - this._camera.alpha) : 0;
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
                } else {
                    if (this._hasCam)
                        this._avatar.rotation.y = ca;
                }
            }
    }

    //rotate the avatar in case player is trying to rotate the avatar. rotate the camera too if camera turning is on
    private _rotateAVnC(anim: ActionData, moving: boolean, dt: number): ActionData {
        if (!(this._noRot && this._mode == 0) && (!this._act._stepLeft && !this._act._stepRight) && (this._act._turnLeft || this._act._turnRight)) {
            let turnAngle = this._actionMap.turnLeft.speed * dt;
            if (this._act._speedMod) {
                turnAngle = 2 * turnAngle;
            }
            let a;
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
                a = this._sign;
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
            } else {
                a = 1;
                if (this._act._turnLeft) {
                    if (this._act._walkback) a = -1;
                    if (!moving) anim = this._actionMap.turnLeft;
                } else {
                    if (this._act._walk) a = -1;
                    if (!moving) { a = -1; anim = this._actionMap.turnRight; }
                }
                if (this._hasCam)
                    this._camera.alpha = this._camera.alpha + this._rhsSign * turnAngle * a;
            }

            this._avatar.rotation.y = this._avatar.rotation.y + turnAngle * a;
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
        // console.log("idling");
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
        // if (this._hasCam && this._mode != 1 && !this._noRot) this._avatar.rotation.y = this._av2cam - this._camera.alpha;
        this._avatar.moveWithCollisions(disp);
        if ((this._avatar.position.y > this._avStartPos.y) || (this._avatar.position.y === this._avStartPos.y)) {
            //                this.grounded = true;
            //                this.idleFallTime = 0;
            const actDisp: Vector3 = this._avatar.position.subtract(this._avStartPos);
            let ng = this._isNearGround(actDisp);
            //if (this._verticalSlope(actDisp) <= this._sl1) {
            if (ng.slope <= this._sl1) {
                this._groundIt();
                this._avatar.position.copyFrom(this._avStartPos);
            } else {
                this._unGroundIt();
                anim = this._actionMap.slideBack;
            }

            //this._groundIt();
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
                let ng = this._isNearGround(actDisp);
                if (ng.slope <= this._sl1) {
                    this._groundIt();
                    this._avatar.position.copyFrom(this._avStartPos);
                } else {
                    this._unGroundIt();
                    anim = this._actionMap.slideBack;
                }
            } else {
                anim = this._actionMap.fall;
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
        if (!this._hasCam) return;
        //donot move camera if av is trying to clinb steps
        //if (this._vMoveTot == 0)
        if (!this._pauseCam) {
            this._avatar.position.addToRef(this._cameraTarget, this._camera.target);
        }else{ 
            this._vMovStartPos.addToRef(this._cameraTarget, this._camera.target);
        }

        if (this._camera.radius > this._camera.lowerRadiusLimit) { if (this._cameraElastic || this._makeInvisible) this._handleObstruction(); }

        //if user so desire, make the AV invisible if camera comes close to it
        if (this._camera.radius <= this._camera.lowerRadiusLimit) {
            if (!this._noFirstPerson && !this._inFP) {
                this._makeMeshInvisible(this._avatar);
                this._camera.checkCollisions = false;
                this._saveMode = this._mode;
                this._mode = 0;
                this._inFP = true;
            }
        } else {
            if (this._inFP) {
                this._inFP = false;
                this._mode = this._saveMode;
                this._restoreVisiblity(this._avatar);
                this._camera.checkCollisions = this._savedCameraCollision;
            }
        }
    }

    // make mesh and all its children invisible
    // store their current visibility state so that we can restore them later on
    private _makeMeshInvisible(mesh: Mesh) {

        this._visiblityMap.set(mesh, mesh.visibility);
        mesh.visibility = 0;

        mesh.getChildMeshes(false, (n) => {
            if (n instanceof Mesh) {
                this._visiblityMap.set(n, n.visibility);
                n.visibility = 0;
            }
            return false;
        });
    }

    private _visiblityMap: Map<Mesh, int> = new Map();

    //restore mesh visibility to previous state
    private _restoreVisiblity(mesh: Mesh) {
        mesh.visibility = this._visiblityMap.get(mesh);
        mesh.getChildMeshes(false, (n) => {
            if (n instanceof Mesh) n.visibility = this._visiblityMap.get(n);
            return false;
        });
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


        //do not pick a mesh if it is the avatar or any of its children (like attachments etc)
        const pis: PickingInfo[] = this._scene.multiPickWithRay(this._ray, (mesh) => {
            if (this._avChildren.includes(mesh)) return false;
            if (mesh.isPickable) {
                return true;
            }else{ 
                return false;
            }
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
                // console.log("walk");
                this._act._walk = true;
                break;
            case "left":
            case "arrowleft":
            case this._actionMap.turnLeft.key:
                // console.log("turn left");
                this._act._turnLeft = true;
                break;
            case "right":
            case "arrowright":
            case this._actionMap.turnRight.key:
                // console.log("turn right");
                this._act._turnRight = true;
                break;
            case "down":
            case "arrowdown":
            case this._actionMap.walkBack.key:
                // console.log("walk back");
                this._act._walkback = true;
                break;
            case this._actionMap.strafeLeft.key:
                // console.log("strafe left");
                this._act._stepLeft = true;
                break;
            case this._actionMap.strafeRight.key:
                // console.log("strafe right");
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

    private _ekb: boolean = true;
    public isKeyBoardEnabled(): boolean {
        return this._ekb;
    }
    public enableKeyBoard(b: boolean) {
        this._ekb = b;
        if (b) {
            this._addkeylistener();
        } else {
            this._removekeylistener();
        }
    }

    private _addkeylistener() {
        let canvas: HTMLCanvasElement = this._scene.getEngine().getRenderingCanvas();
        canvas.addEventListener("keyup", this._handleKeyUp, false);
        canvas.addEventListener("keydown", this._handleKeyDown, false);
    }

    private _removekeylistener() {
        let canvas: HTMLCanvasElement = this._scene.getEngine().getRenderingCanvas();
        canvas.removeEventListener("keyup", this._handleKeyUp, false);
        canvas.removeEventListener("keydown", this._handleKeyDown, false);
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

    public fall() {
        this._grounded = false;
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

    private _getAbstractMeshChildren(tn: Node): AbstractMesh[] {
        let ms: AbstractMesh[] = new Array();
        if (tn instanceof AbstractMesh) ms.push(tn);
        tn.getChildren((cm) => {
            if (cm instanceof AbstractMesh) ms.push(cm);
            return false;
        },
        false)
        return ms;  
    }

    public setAvatar(avatar: Mesh, faceForward: boolean = false): boolean {

        let rootNode = this._root(avatar);
        if (rootNode instanceof Mesh) {
            this._avatar = rootNode;
        } else {
            console.error("Cannot move this mesh. The root node of the mesh provided is not a mesh");
            return false;
        }
        this._avChildren = this._getAbstractMeshChildren(rootNode);
        this._skeleton = this._findSkel(avatar);
        this._isAG = this._containsAG(avatar, this._scene.animationGroups, true);

        this._actionMap.reset();

        //animation ranges
        if (!this._isAG && this._skeleton != null) this._checkAnimRanges(this._skeleton);

        this._setRHS(avatar);
        this.setFaceForward(faceForward);

        return true;
    }


    private _ellipsoid:TransformNode = null;
    public showEllipsoid(show:boolean) {
        if (!show){
            if (this._ellipsoid != null) this._ellipsoid.dispose();
            this._ellipsoid = null;
            if (this._rayLine != null) { this._rayLine.dispose(); this._rayLine = null; }
            return;
        }
        let ellipsoid:TransformNode = new TransformNode("ellipsoid", this._scene);
        
        let a = this._avatar.ellipsoid.x;
        let b = this._avatar.ellipsoid.y;

        const points = [];
        for(let theta = -Math.PI/2; theta < Math.PI/2; theta += Math.PI/36) {
            points.push(new BABYLON.Vector3(0, b * Math.sin(theta), a * Math.cos(theta)));
        }
    
        const ellipse : LinesMesh[] = [];
        ellipse[0] = MeshBuilder.CreateLines("e", {points:points}, this._scene);
        ellipse[0].color = Color3.Red();
        ellipse[0].parent = ellipsoid;
        ellipse[0].isPickable = false;
        const steps = 12;
        const dTheta = 2 * Math.PI / steps; 
        for(let i = 1; i < steps; i++) {
                ellipse[i] = ellipse[0].clone("el" + i);
                ellipse[i].parent = ellipsoid;
                ellipse[i].rotation.y = i * dTheta;
                ellipse[i].isPickable = false;
        }
        ellipsoid.parent = this._avatar;
        ellipsoid.position = this._avatar.ellipsoidOffset;
        this._ellipsoid= ellipsoid;
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
    private _hasCam: boolean = true;
    //av children will be used if elastic camera is set to true
    //pick collision with children will ignored then
    private _avChildren:AbstractMesh[];

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

        //if camera is null assume this would be used to control an NPC
        //we cannot use mode 0 as that is dependent on camera being present. so force mode 1
        if (this._camera == null) {
            this._hasCam = false;
            this.setMode(1);
        }
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

        if (this._hasCam) this._savedCameraCollision = this._camera.checkCollisions;

        // this._avatar.onCollideObservable.add(
        //     function(m,evt){
        //         let msg = "Collision with: "+m.name;
        //         console.log(m);
        //         console.log(evt);
        //     }
        // );    


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
    public sound: Sound;
}
