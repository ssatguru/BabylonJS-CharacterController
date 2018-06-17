
namespace org.ssatguru.babylonjs.component {

    import Skeleton=BABYLON.Skeleton;
    import ArcRotateCamera=BABYLON.ArcRotateCamera;
    import Vector3=BABYLON.Vector3;
    import Mesh=BABYLON.Mesh;
    import Scene=BABYLON.Scene;
    import Ray=BABYLON.Ray;
    import PickingInfo=BABYLON.PickingInfo;

    export class CharacterController {

        private avatar: Mesh;
        private skeleton: Skeleton;
        private camera: ArcRotateCamera;
        private scene: Scene;

        //avatar speed in meters/second
        private walkSpeed: number=3;
        private runSpeed: number=this.walkSpeed*2;
        private backSpeed: number=this.walkSpeed/2;
        private jumpSpeed: number=this.walkSpeed*2;
        private leftSpeed: number=this.walkSpeed/2;
        private rightSpeed: number=this.walkSpeed/2;
        private gravity: number=9.8;
        //slopeLimit in degrees
        private minSlopeLimit: number=30;
        private maxSlopeLimit: number=45;
        //slopeLimit in radians
        sl: number=Math.PI*this.minSlopeLimit/180;
        sl2: number=Math.PI*this.maxSlopeLimit/180;

        //The av will step up a stair only if it is closer to the ground than the indicated value.
        private _stepOffset: number=0.25;
        //toal amount by which the av has moved up
        private _vMoveTot: number=0;
        //position of av when it started moving up
        private _vMovStartPos: Vector3=new Vector3(0,0,0);

        //animations
        private walk: AnimData=new AnimData("walk");
        private walkBack: AnimData=new AnimData("walkBack");
        private idle: AnimData=new AnimData("idle");
        private run: AnimData=new AnimData("run");
        private jump: AnimData=new AnimData("jump");
        private fall: AnimData=new AnimData("fall");
        private turnLeft: AnimData=new AnimData("turnLeft");
        private turnRight: AnimData=new AnimData("turnRight");
        private strafeLeft: AnimData=new AnimData("strafeLeft");
        private strafeRight: AnimData=new AnimData("strafeRight");
        private slideBack: AnimData=new AnimData("slideBack");

        private anims: AnimData[]=[this.walk,this.walkBack,this.idle,this.run,this.jump,this.fall,this.turnLeft,this.turnRight,this.strafeLeft,this.strafeRight,this.slideBack];

        //move keys
        private walkKey: string="W";
        private walkBackKey: string="S";
        private turnLeftKey: string="A";
        private turnRightKey: string="D";
        private strafeLeftKey: string="Q";
        private strafeRightKey: string="E";
        private jumpKey: string="32";
        private walkCode: number=38;
        private walkBackCode: number=40;
        private turnLeftCode: number=37;
        private turnRightCode: number=39;
        private strafeLeftCode: number=0;
        private strafeRightCode: number=0;
        private jumpCode: number=32;

        private elasticCamera: boolean=true;
        private cameraTarget: Vector3=new Vector3(0,0,0);
        //should we go into first person view when camera is near avatar (radius is lowerradius limit)
        private noFirstPerson: boolean=false;

        public setAvatar(avatar: Mesh) {
            this.avatar=avatar;
        }

        public setAvatarSkeleton(skeleton: Skeleton) {
            this.skeleton=skeleton;
            this.checkAnims(skeleton);
        }

        public setSlopeLimit(minSlopeLimit: number,maxSlopeLimit: number) {
            this.minSlopeLimit=minSlopeLimit;
            this.maxSlopeLimit=maxSlopeLimit;

            this.sl=Math.PI*minSlopeLimit/180;
            this.sl2=Math.PI*this.maxSlopeLimit/180;
        }

        /**
         * The av will step up a stair only if it is closer to the ground than the indicated value.
         * Default value is 0.25 m
         */
        public setStepOffset(stepOffset: number) {
            this._stepOffset=stepOffset;
        }

        public setWalkSpeed(n: number) {
            this.walkSpeed=n;
        }
        public setRunSpeed(n: number) {
            this.runSpeed=n;
        }
        public setBackSpeed(n: number) {
            this.backSpeed=n;
        }
        public setJumpSpeed(n: number) {
            this.jumpSpeed=n;
        }
        public setLeftSpeed(n: number) {
            this.leftSpeed=n;
        }
        public setRightSpeed(n: number) {
            this.rightSpeed=n;
        }
        public setGravity(n: number) {
            this.gravity=n;
        }

        public setAnim(anim: AnimData,rangeName: string,rate: number,loop: boolean) {
            if(this.skeleton==null) return;
            anim.name=rangeName;
            anim.rate=rate;
            anim.loop=loop;
            if(this.skeleton.getAnimationRange(anim.name)!=null) {
                anim.exist=true;
            } else {
                anim.exist=false;
            }
        }

        public setWalkAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.walk,rangeName,rate,loop);
        }
        public setRunAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.run,rangeName,rate,loop);
        }
        public setWalkBackAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.walkBack,rangeName,rate,loop);
        }
        public setSlideBackAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.slideBack,rangeName,rate,loop);
        }
        public setIdleAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.idle,rangeName,rate,loop);
        }
        public setTurnRightAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.turnRight,rangeName,rate,loop);
        }
        public setTurnLeftAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.turnLeft,rangeName,rate,loop);
        }
        public setStrafeRightAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.strafeRight,rangeName,rate,loop);
        }
        public setSrafeLeftAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.strafeLeft,rangeName,rate,loop);
        }
        public setJumpAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.jump,rangeName,rate,loop);
        }
        public setFallAnim(rangeName: string,rate: number,loop: boolean) {
            this.setAnim(this.fall,rangeName,rate,loop);
        }

        public setWalkKey(key: string) {
            this.walkKey=key
        }
        public setWalkBackKey(key: string) {
            this.walkBackKey=key
        }
        public setTurnLeftKey(key: string) {
            this.turnLeftKey=key
        }
        public setTurnRightKey(key: string) {
            this.turnRightKey=key
        }
        public setStrafeLeftKey(key: string) {
            this.strafeLeftKey=key
        }
        public setStrafeRightKey(key: string) {
            this.strafeRightKey=key
        }
        public setJumpKey(key: string) {
            this.jumpKey=key
        }

        public setWalkCode(code: number) {
            this.walkCode=code
        }
        public setWalkBackCode(code: number) {
            this.walkBackCode=code
        }
        public setTurnLeftCode(code: number) {
            this.turnLeftCode=code
        }
        public setTurnRightCode(code: number) {
            this.turnRightCode=code
        }
        public setStrafeLeftCode(code: number) {
            this.strafeLeftCode=code
        }
        public setStrafeRightCode(code: number) {
            this.strafeRightCode=code
        }
        public setJumpCode(code: number) {
            this.jumpCode=code
        }

        public setCameraElasticity(b: boolean) {
            this.elasticCamera=b;
        }
        public setCameraTarget(v: Vector3) {
            this.cameraTarget.copyFrom(v);
        }
        /**
         * user should call this whenever the user changes the camera checkCollision 
         * property
         * 
         */
        public cameraCollisionChanged() {
            this.savedCameraCollision=this.camera.checkCollisions;
        }
        public setNoFirstPerson(b: boolean) {
            this.noFirstPerson=b;
        }

        private checkAnims(skel: Skeleton) {
            for(let anim of this.anims) {
                if(skel.getAnimationRange(anim.name)!=null) anim.exist=true;
            }
        }

        private key: Key;
        private renderer: () => void;
        constructor(avatar: Mesh,camera: ArcRotateCamera,scene: Scene) {

            this.avatar=avatar;
            this.scene=scene;

            this.skeleton=avatar.skeleton;
            if(this.skeleton!=null) this.checkAnims(this.skeleton);
            this.camera=camera;
            this.savedCameraCollision=this.camera.checkCollisions;

            this.key=new Key();

            window.addEventListener("keydown",(e) => {return this.onKeyDown(e)},false);
            window.addEventListener("keyup",(e) => {return this.onKeyUp(e)},false);
            this.renderer=() => {this.moveAVandCamera()};

        }

        private started: boolean=false;
        public start() {
            if(this.started) return;
            this.started=true;
            this.key.reset();
            this.movFallTime=0;
            //first time we enter render loop, delta time shows zero !!
            this.idleFallTime=0.001;
            this.grounded=false;
            this.updateTargetValue();

            this.scene.registerBeforeRender(this.renderer);
            this.scene
        }

        public stop() {
            if(!this.started) return;
            this.started=false;
            this.scene.unregisterBeforeRender(this.renderer);

            this.prevAnim=null;
        }

        /**
         * use pauseAnim to stop the charactere controller from playing
         * any animation on the character
         * use this when you want to play your animation instead
         * see also resumeAnim()
         */
        private _stopAnim: boolean=false;
        public pauseAnim() {
            this._stopAnim=true;
        }

        /**
         * use resumeAnim to resume the character controller playing
         * animations on the character.
         * see also pauseAnim()
         */
        public resumeAnim() {
            this._stopAnim=false;
        }

        private prevAnim: AnimData=null;

        private avStartPos: Vector3=new Vector3(0,0,0);
        private grounded: boolean=false;
        //distance by which AV would move down if in freefall
        private freeFallDist: number=0;

        //how many minimum contiguos frames should the AV have been in free fall
        //before we assume AV is in big freefall.
        //we will use this to remove animation flicker during move down a slope (fall, move, fall move etc)
        //TODO: base this on slope - large slope large count
        private fallFrameCountMin: number=50;
        private fallFrameCount: number=0;

        private inFreeFall: boolean=false;
        private wasWalking: boolean=false;
        private wasRunning: boolean=false;
        private moveVector: Vector3;

        private moveAVandCamera() {
            this.avStartPos.copyFrom(this.avatar.position);
            let anim: AnimData=null;
            let dt: number=this.scene.getEngine().getDeltaTime()/1000;

            if(this.key.jump&&!this.inFreeFall) {
                this.grounded=false;
                this.idleFallTime=0;

                anim=this.doJump(dt);
            } else if(this.anyMovement()||this.inFreeFall) {
                this.grounded=false;
                this.idleFallTime=0;

                anim=this.doMove(dt);
            } else if(!this.inFreeFall) {

                anim=this.doIdle(dt);
            }
            if(!this._stopAnim) {
                if(anim!=null) {
                    if(this.skeleton!==null) {
                        if(this.prevAnim!==anim) {
                            if(anim.exist) {
                                this.skeleton.beginAnimation(anim.name,anim.loop,anim.rate);
                            }
                            this.prevAnim=anim;
                        }
                    }
                }
            }
            this.updateTargetValue();
            return;
        }

        //verical position of AV when it is about to start a jump
        private jumpStartPosY: number=0;
        //for how long the AV has been in the jump
        private jumpTime: number=0;
        private doJump(dt: number): AnimData {

            let anim: AnimData=null;
            anim=this.jump;
            if(this.jumpTime===0) {
                this.jumpStartPosY=this.avatar.position.y;
            }
            //up velocity at the begining of the lastt frame (v=u+at)
            let js: number=this.jumpSpeed-this.gravity*this.jumpTime;
            //distance travelled up since last frame to this frame (s=ut+1/2*at^2)
            let jumpDist: number=js*dt-0.5*this.gravity*dt*dt;
            this.jumpTime=this.jumpTime+dt;

            let forwardDist: number=0;
            let disp: Vector3;
            this.avatar.rotation.y=-4.69-this.camera.alpha;
            if(this.wasRunning||this.wasWalking) {
                if(this.wasRunning) {
                    forwardDist=this.runSpeed*dt;
                } else if(this.wasWalking) {
                    forwardDist=this.walkSpeed*dt;
                }
                //find out in which horizontal direction the AV was moving when it started the jump
                disp=this.moveVector.clone();
                disp.y=0;
                disp=disp.normalize();
                disp.scaleToRef(forwardDist,disp);
                disp.y=jumpDist;
            } else {
                disp=new Vector3(0,jumpDist,0);
            }
            //moveWithCollision only seems to happen if length of displacment is atleast 0.001
            this.avatar.moveWithCollisions(disp);
            if(jumpDist<0) {
                anim=this.fall;
                //check if going up a slope or back on flat ground 
                if((this.avatar.position.y>this.avStartPos.y)||((this.avatar.position.y===this.avStartPos.y)&&(disp.length()>0.001))) {
                    this.endJump();
                } else if(this.avatar.position.y<this.jumpStartPosY) {
                    //the avatar is below the point from where it started the jump
                    //so it is either in free fall or is sliding along a downward slope
                    //
                    //if the actual displacemnt is same as the desired displacement then AV is in freefall
                    //else it is on a slope
                    let actDisp: Vector3=this.avatar.position.subtract(this.avStartPos);
                    if(!(this.areVectorsEqual(actDisp,disp,0.001))) {
                        //AV is on slope
                        //Should AV continue to slide or stop?
                        //if slope is less steeper than acceptable then stop else slide
                        if(this.verticalSlope(actDisp)<=this.sl) {
                            this.endJump();
                        }
                    }
                }
            }
            return anim;
        }

        /**
         * does cleanup at the end of a jump
         */
        private endJump() {
            this.key.jump=false;
            this.jumpTime=0;
            this.wasWalking=false;
            this.wasRunning=false;
        }

        /**
         * checks if two vectors v1 and v2 are equal within a precision of p
         */
        private areVectorsEqual(v1: Vector3,v2: Vector3,p: number) {
            return ((Math.abs(v1.x-v2.x)<p)&&(Math.abs(v1.y-v2.y)<p)&&(Math.abs(v1.z-v2.z)<p));
        }
        /*
         * returns the slope (in radians) of a vector in the vertical plane
         */
        private verticalSlope(v: Vector3): number {
            return Math.atan(Math.abs(v.y/Math.sqrt(v.x*v.x+v.z*v.z)));
        }

        //for how long has the av been falling while moving
        private movFallTime: number=0;

        private doMove(dt: number): AnimData {

            //initial down velocity
            let u: number=this.movFallTime*this.gravity
            //calculate the distance by which av should fall down since last frame
            //assuming it is in freefall
            this.freeFallDist=u*dt+this.gravity*dt*dt/2;

            this.movFallTime=this.movFallTime+dt;

            let moving: boolean=false;
            let anim: AnimData=null;

            if(this.inFreeFall) {
                this.moveVector.y=-this.freeFallDist;
                moving=true;
            } else {
                this.wasWalking=false;
                this.wasRunning=false;

                if(this.key.forward) {
                    let forwardDist: number=0;
                    if(this.key.shift) {
                        this.wasRunning=true;
                        forwardDist=this.runSpeed*dt;
                        anim=this.run;
                    } else {
                        this.wasWalking=true;
                        forwardDist=this.walkSpeed*dt;
                        anim=this.walk;
                    }
                    this.moveVector=this.avatar.calcMovePOV(0,-this.freeFallDist,forwardDist);
                    moving=true;
                } else if(this.key.backward) {
                    this.moveVector=this.avatar.calcMovePOV(0,-this.freeFallDist,-(this.backSpeed*dt));
                    anim=this.walkBack;
                    moving=true;
                } else if(this.key.stepLeft) {
                    anim=this.strafeLeft;
                    this.moveVector=this.avatar.calcMovePOV(-(this.leftSpeed*dt),-this.freeFallDist,0);
                    moving=true;
                } else if(this.key.stepRight) {
                    anim=this.strafeRight;
                    this.moveVector=this.avatar.calcMovePOV((this.rightSpeed*dt),-this.freeFallDist,0);
                    moving=true;
                }
            }

            if(!this.key.stepLeft&&!this.key.stepRight) {
                if(this.key.turnLeft) {
                    this.camera.alpha=this.camera.alpha+0.022;
                    if(!moving) {
                        this.avatar.rotation.y=-4.69-this.camera.alpha;
                        anim=this.turnLeft;
                    }
                } else if(this.key.turnRight) {
                    this.camera.alpha=this.camera.alpha-0.022;
                    if(!moving) {
                        this.avatar.rotation.y=-4.69-this.camera.alpha;
                        anim=this.turnRight;
                    }
                }
            }

            if(moving) {
                this.avatar.rotation.y=-4.69-this.camera.alpha;

                if(this.moveVector.length()>0.001) {
                    this.avatar.moveWithCollisions(this.moveVector);
                    //walking up a slope
                    if(this.avatar.position.y>this.avStartPos.y) {
                        let actDisp: Vector3=this.avatar.position.subtract(this.avStartPos);
                        let _sl: number=this.verticalSlope(actDisp);
                        if(_sl>=this.sl2) {
                            //this._climbingSteps=true;
                            //is av trying to go up steps
                            if(this._stepOffset>0) {
                                if(this._vMoveTot==0) {
                                    //if just started climbing note down the position
                                    this._vMovStartPos.copyFrom(this.avStartPos);
                                }
                                this._vMoveTot=this._vMoveTot+(this.avatar.position.y-this.avStartPos.y);
                                if(this._vMoveTot>this._stepOffset) {
                                    //move av back to its position at begining of steps
                                    this._vMoveTot=0;
                                    this.avatar.position.copyFrom(this._vMovStartPos);
                                    this.endFreeFall();
                                }
                            } else {
                                //move av back to old position
                                this.avatar.position.copyFrom(this.avStartPos);
                                this.endFreeFall();
                            }
                        } else {
                            this._vMoveTot=0;
                            if(_sl>this.sl) {
                                //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                                this.fallFrameCount=0;
                                this.inFreeFall=false;
                            } else {
                                //continue walking
                                this.endFreeFall();
                            }
                        }
                    } else if((this.avatar.position.y)<this.avStartPos.y) {
                        let actDisp: Vector3=this.avatar.position.subtract(this.avStartPos);
                        if(!(this.areVectorsEqual(actDisp,this.moveVector,0.001))) {
                            //AV is on slope
                            //Should AV continue to slide or walk?
                            //if slope is less steeper than acceptable then walk else slide
                            if(this.verticalSlope(actDisp)<=this.sl) {
                                this.endFreeFall();
                            } else {
                                //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                                this.fallFrameCount=0;
                                this.inFreeFall=false;
                            }
                        } else {
                            this.inFreeFall=true;
                            this.fallFrameCount++;
                            //AV could be running down a slope which mean freefall,run,frefall run ...
                            //to remove anim flicker, check if AV has been falling down continously for last few consecutive frames
                            //before changing to free fall animation
                            if(this.fallFrameCount>this.fallFrameCountMin) {
                                anim=this.fall;
                            }
                        }
                    } else {
                        this.endFreeFall();
                    }
                }
            }
            return anim;
        }

        private endFreeFall(): void {
            this.movFallTime=0;
            this.fallFrameCount=0;
            this.inFreeFall=false;
        }

        //for how long has the av been falling while idle (not moving)
        private idleFallTime: number=0;
        private doIdle(dt: number): AnimData {
            if(this.grounded) {
                return this.idle;
            }
            this.wasWalking=false;
            this.wasRunning=false;
            this.movFallTime=0;
            let anim: AnimData=this.idle;
            this.fallFrameCount=0;


            if(dt===0) {
                this.freeFallDist=5;
            } else {
                let u: number=this.idleFallTime*this.gravity
                this.freeFallDist=u*dt+this.gravity*dt*dt/2;
                this.idleFallTime=this.idleFallTime+dt;
            }
            //if displacement is less than 0.01(? need to verify further) then 
            //moveWithDisplacement down against a surface seems to push the AV up by a small amount!!
            if(this.freeFallDist<0.01) return anim;
            let disp: Vector3=new Vector3(0,-this.freeFallDist,0);;
            this.avatar.rotation.y=-4.69-this.camera.alpha;
            this.avatar.moveWithCollisions(disp);
            if((this.avatar.position.y>this.avStartPos.y)||(this.avatar.position.y===this.avStartPos.y)) {
                //                this.grounded = true;
                //                this.idleFallTime = 0;
                this.groundIt();
            } else if(this.avatar.position.y<this.avStartPos.y) {
                //AV is going down. 
                //AV is either in free fall or is sliding along a downward slope
                //
                //if the actual displacemnt is same as the desired displacement then AV is in freefall
                //else it is on a slope
                let actDisp: Vector3=this.avatar.position.subtract(this.avStartPos);
                if(!(this.areVectorsEqual(actDisp,disp,0.001))) {
                    //AV is on slope
                    //Should AV continue to slide or stop?
                    //if slope is less steeper than accebtable then stop else slide
                    if(this.verticalSlope(actDisp)<=this.sl) {
                        //                        this.grounded = true;
                        //                        this.idleFallTime = 0;
                        this.groundIt();
                        this.avatar.position.copyFrom(this.avStartPos);
                    } else {
                        this.unGroundIt();
                        anim=this.slideBack;
                    }
                }
            }
            return anim;
        }

        private groundFrameCount=0;
        private groundFrameMax=10;
        /**
         * donot ground immediately
         * wait few more frames
         */
        private groundIt(): void {
            this.groundFrameCount++;
            if(this.groundFrameCount>this.groundFrameMax) {
                this.grounded=true;
                this.idleFallTime=0;
            }
        }
        private unGroundIt() {
            this.grounded=false;
            this.groundFrameCount=0;
        }

        savedCameraCollision: boolean=true;
        private updateTargetValue() {
            //donot move camera if av is trying to clinb steps
            if(this._vMoveTot==0)
                this.avatar.position.addToRef(this.cameraTarget,this.camera.target);

            if(this.camera.radius>this.camera.lowerRadiusLimit) {if(this.elasticCamera) this.snapCamera();}

            if(this.camera.radius<=this.camera.lowerRadiusLimit) {
                if(!this.noFirstPerson) {
                    this.avatar.visibility=0;
                    this.camera.checkCollisions=false;
                }
            } else {
                this.avatar.visibility=1;
                this.camera.checkCollisions=this.savedCameraCollision;
            }
        }

        ray: Ray=new Ray(Vector3.Zero(),Vector3.One(),1);
        rayDir: Vector3=Vector3.Zero();
        //camera seems to get stuck into things
        //should move camera away from things by a value of cameraSkin
        cameraSkin: number=0.5;
        skip: number=0;
        private snapCamera() {
//            if(this.skip<120) {
//                this.skip++;
//                return;
//            }
//            this.skip=0;
            //get vector from av (camera.target) to camera
            this.camera.position.subtractToRef(this.camera.target,this.rayDir);
            //start ray from av to camera
            this.ray.origin=this.camera.target;
            this.ray.length=this.rayDir.length();
            this.ray.direction=this.rayDir.normalize();

            let pi: PickingInfo=this.scene.pickWithRay(this.ray,(mesh) => {
                //if(mesh==this.avatar||!mesh.isPickable||!mesh.checkCollisions) return false;
                if(mesh==this.avatar||!mesh.checkCollisions) return false;
                else return true;
            },true);

            if(pi.hit) {
                //postion the camera in front of the mesh that is obstructing camera
                if(this.camera.checkCollisions) {
                    let newPos: Vector3=this.camera.target.subtract(pi.pickedPoint).normalize().scale(this.cameraSkin);
                    pi.pickedPoint.addToRef(newPos,this.camera.position);
                } else {
                    let nr: number=pi.pickedPoint.subtract(this.camera.target).length();
                    this.camera.radius=nr-this.cameraSkin;
                }
            }
        }

        move: boolean=false;
        public anyMovement(): boolean {
            return (this.key.forward||this.key.backward||this.key.turnLeft||this.key.turnRight||this.key.stepLeft||this.key.stepRight);
        }

        private onKeyDown(e: Event) {
            var event: KeyboardEvent=<KeyboardEvent>e;
            var code: number=event.keyCode;
            var chr: string=String.fromCharCode(code);

            if((chr===this.jumpKey)||(code===this.jumpCode)) this.key.jump=true;
            else if(code===16) this.key.shift=true;
            //WASD or arrow keys
            else if((chr===this.walkKey)||(code===this.walkCode)) this.key.forward=true;
            else if((chr===this.turnLeftKey)||(code===this.turnLeftCode)) this.key.turnLeft=true;
            else if((chr===this.turnRightKey)||(code===this.turnRightCode)) this.key.turnRight=true;
            else if((chr===this.walkBackKey)||(code===this.walkBackCode)) this.key.backward=true;
            else if((chr===this.strafeLeftKey)||(code===this.strafeLeftCode)) this.key.stepLeft=true;
            else if((chr===this.strafeRightKey)||(code===this.strafeRightCode)) this.key.stepRight=true;
            this.move=this.anyMovement();
        }

        private onKeyUp(e: Event) {
            var event: KeyboardEvent=<KeyboardEvent>e;
            var code: number=event.keyCode;
            var chr: string=String.fromCharCode(code);

            if(code===16) {this.key.shift=false;}
            //WASD or arrow keys
            else if((chr===this.walkKey)||(code===this.walkCode)) this.key.forward=false;
            else if((chr===this.turnLeftKey)||(code===this.turnLeftCode)) this.key.turnLeft=false;
            else if((chr===this.turnRightKey)||(code===this.turnRightCode)) this.key.turnRight=false;
            else if((chr===this.walkBackKey)||(code===this.walkBackCode)) this.key.backward=false;
            else if((chr===this.strafeLeftKey)||(code===this.strafeLeftCode)) this.key.stepLeft=false;
            else if((chr===this.strafeRightKey)||(code===this.strafeRightCode)) this.key.stepRight=false;

            this.move=this.anyMovement();
        }
    }

    export class AnimData {
        public name: string;
        public loop: boolean=true;
        public rate: number=1;
        public exist: boolean=false;

        public constructor(name: string) {
            this.name=name;
        }
    }

    export class Key {
        public forward: boolean;
        public backward: boolean;
        public turnRight: boolean;
        public turnLeft: boolean;
        public stepRight: boolean;
        public stepLeft: boolean;
        public jump: boolean;
        public shift: boolean;

        constructor() {
            this.reset();
        }

        reset() {
            this.forward=false;
            this.backward=false;
            this.turnRight=false;
            this.turnLeft=false;
            this.stepRight=false;
            this.stepLeft=false;
            this.jump=false;
            this.shift=false;
        }
    }
}
