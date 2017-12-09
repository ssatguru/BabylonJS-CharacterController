
namespace org.ssatguru.babylonjs.component {

    import Skeleton=BABYLON.Skeleton;
    import ArcRotateCamera=BABYLON.ArcRotateCamera;
    import Vector3=BABYLON.Vector3;
    import Mesh=BABYLON.Mesh;
    import Scene=BABYLON.Scene;
    import Ray=BABYLON.Ray;
    import RayHelper=BABYLON.RayHelper;
    import PickingInfo=BABYLON.PickingInfo;

    export class CharacterControl {
        private avatar: Mesh;
        private avatarSkeleton: Skeleton;
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
        //animations
        private walk: AnimData;
        private walkBack: AnimData;
        private slideBack: AnimData;
        private idle: AnimData;
        private run: AnimData;
        private jump: AnimData;
        private fall: AnimData;
        private turnLeft: AnimData;
        private turnRight: AnimData;
        private strafeLeft: AnimData;
        private strafeRight: AnimData;
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
        
        private elasticCamera:boolean=true;
        

        public setAvatar(avatar: Mesh) {
            this.avatar=avatar;
        }

        public setAvatarSkeleton(avatarSkeleton: Skeleton) {
            this.avatarSkeleton=avatarSkeleton;
        }

        public setSlopeLimit(minSlopeLimit: number,maxSlopeLimit: number) {
            this.minSlopeLimit=minSlopeLimit;
            this.maxSlopeLimit=maxSlopeLimit;

            this.sl=Math.PI*minSlopeLimit/180;
            this.sl2=Math.PI*this.maxSlopeLimit/180;
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
        public setGravity(n:number){
            this.gravity=n;
        }
        public setWalkAnim(rangeName: string,rate: number) {
            this.walk.name=rangeName;
            this.walk.rate=rate;
        }
        public setRunAnim(rangeName: string,rate: number) {
            this.run.name=rangeName;
            this.run.rate=rate;
        }
        public setWalkBackAnim(rangeName: string,rate: number) {
            this.walkBack.name=rangeName;
            this.walkBack.rate=rate;
        }
        public setSlideBackAnim(rangeName: string,rate: number) {
            this.slideBack.name=rangeName;
            this.slideBack.rate=rate;
        }
        public setIdleAnim(rangeName: string,rate: number) {
            this.idle.name=rangeName;
            this.idle.rate=rate;
        }
        public setStrafeRightAnim(rangeName: string,rate: number) {
            this.strafeRight.name=rangeName;
            this.strafeRight.rate=rate;
        }
        public setSrafeLeftAnim(rangeName: string,rate: number) {
            this.strafeLeft.name=rangeName;
            this.strafeLeft.rate=rate;
        }
        public setJumpAnim(rangeName: string,rate: number) {
            this.jump.name=rangeName;
            this.jump.rate=rate;
        }
        public setFallAnim(rangeName: string,rate: number) {
            this.fall.name=rangeName;
            this.fall.rate=rate;
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
        
        public setCameraElastic(b:boolean){
            this.elasticCamera = b;
        }


        private initAnims(skel: Skeleton) {
            this.walk=new AnimData("walk",true,1,true);
            this.walkBack=new AnimData("walkBack",true,0.5,true);
            this.idle=new AnimData("idle",true,1,true);
            this.run=new AnimData("run",true,1,true);
            this.jump=new AnimData("jump",false,2,true);
            this.fall=new AnimData("fall",false,1,true);
            this.turnLeft=new AnimData("turnLeft",true,0.5,true);
            this.turnRight=new AnimData("turnRight",true,0.5,true);
            this.strafeLeft=new AnimData("strafeLeft",true,1,true);
            this.strafeRight=new AnimData("strafeRight",true,1,true);
            this.slideBack=new AnimData("slideBack",true,1,true);

            if(skel.getAnimationRange("walk")==null) this.walk.exist=false;
            if(skel.getAnimationRange("walkBack")==null) this.walkBack.exist=false;
            if(skel.getAnimationRange("idle")==null) this.idle.exist=false;
            if(skel.getAnimationRange("run")==null) this.run.exist=false;
            if(skel.getAnimationRange("jump")==null) this.jump.exist=false;
            if(skel.getAnimationRange("fall")==null) this.fall.exist=false;
            if(skel.getAnimationRange("turnLeft")==null) this.turnLeft.exist=false;
            if(skel.getAnimationRange("turnRight")==null) this.turnRight.exist=false;
            if(skel.getAnimationRange("strafeLeft")==null) this.strafeLeft.exist=false;
            if(skel.getAnimationRange("strafeRight")==null) this.strafeRight.exist=false;
            if(skel.getAnimationRange("slideBack")==null) this.slideBack.exist=false;
            
        }
        
        private key: Key;
        private renderer: () => void;
        constructor(avatar: Mesh,avatarSkeleton: Skeleton,camera: ArcRotateCamera,scene: Scene) {

            this.avatarSkeleton=avatarSkeleton;
            this.initAnims(avatarSkeleton);
            this.camera=camera;

            this.avatar=avatar;
            this.scene=scene;
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

            if(anim!=null) {
                if(this.avatarSkeleton!==null) {
                    if(this.prevAnim!==anim) {
                        if(anim.exist) {
                            this.avatarSkeleton.beginAnimation(anim.name,anim.loop,anim.rate);
                        }
                        this.prevAnim=anim;
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
                        if(this.verticalSlope(actDisp)>this.sl2) {
                            this.avatar.position.copyFrom(this.avStartPos);
                            this.endFreeFall();
                        } if(this.verticalSlope(actDisp)<this.sl) {
                            this.endFreeFall();
                        } else {
                            //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
                            this.fallFrameCount=0;
                            this.inFreeFall=false;
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


        private updateTargetValue() {
            this.camera.target.copyFromFloats(this.avatar.position.x,(this.avatar.position.y+1.5),this.avatar.position.z);
            if(this.elasticCamera) this.snapCamera();
        }

        ray: Ray=new Ray(Vector3.Zero(),Vector3.One(),1);
        rayDir: Vector3=Vector3.Zero();
        private snapCamera() {
            //get vector from av (camera.target) to camera
            this.camera.position.subtractToRef(this.camera.target,this.rayDir);
            //start ray from av to camera
            this.ray.origin=this.camera.target;
            this.ray.length=this.rayDir.length();
            this.ray.direction=this.rayDir.normalize();

            let pi: PickingInfo=this.scene.pickWithRay(this.ray,null,true);
            if(pi.hit) {
                //postion the camera in front of the mesh that is obstructing camera
                this.camera.position=pi.pickedPoint;
            }
        }

        move: boolean=false;
        public anyMovement(): boolean {
            return (this.key.forward||this.key.backward||this.key.turnLeft||this.key.turnRight||this.key.stepLeft||this.key.stepRight);
        }

        private onKeyDown(e: Event) {
            var event: KeyboardEvent=<KeyboardEvent>e;
            var chr: string=String.fromCharCode(event.keyCode);

            if((chr===this.jumpKey)||(event.keyCode===this.jumpCode))this.key.jump=true; 
            else if(event.keyCode===16) this.key.shift=true;
            //WASD or arrow keys
            else if((chr===this.walkKey)||(event.keyCode===this.walkCode)) this.key.forward=true;
            else if((chr===this.turnLeftKey) ||(event.keyCode===this.turnLeftCode)) this.key.turnLeft=true;
            else if((chr===this.turnRightKey)||(event.keyCode===this.turnRightCode)) this.key.turnRight=true;
            else if((chr===this.walkBackKey)||(event.keyCode===this.walkBackCode)) this.key.backward=true;
            else if((chr===this.strafeLeftKey)||(event.keyCode===this.strafeLeftCode)) this.key.stepLeft=true;
            else if((chr===this.strafeRightKey)||(event.keyCode===this.strafeRightCode)) this.key.stepRight=true;
            this.move=this.anyMovement();

        }

        private onKeyUp(e: Event) {
            var event: KeyboardEvent=<KeyboardEvent>e;
            var chr: string=String.fromCharCode(event.keyCode);
       
            if(event.keyCode===16) {this.key.shift=false;}
            //WASD or arrow keys
            else if((chr===this.walkKey)||(event.keyCode===this.walkCode)) this.key.forward=false;
            else if((chr===this.turnLeftKey) ||(event.keyCode===this.turnLeftCode)) this.key.turnLeft=false;
            else if((chr===this.turnRightKey)||(event.keyCode===this.turnRightCode)) this.key.turnRight=false;
            else if((chr===this.walkBackKey)||(event.keyCode===this.walkBackCode)) this.key.backward=false;
            else if((chr===this.strafeLeftKey)||(event.keyCode===this.strafeLeftCode)) this.key.stepLeft=false;
            else if((chr===this.strafeRightKey)||(event.keyCode===this.strafeRightCode)) this.key.stepRight=false;

            this.move=this.anyMovement();

        }

        //calc distance in horizontal plane
        private horizontalMove(v1: Vector3,v2: Vector3): number {
            let dx: number=v1.x-v2.x;
            let dz: number=v1.z-v2.z;
            let d: number=Math.sqrt(dx*dx+dz*dz);
            return d;

        }
    }

    export class AnimData {
        public name: string;
        public loop: boolean;
        public rate: number;
        public exist: boolean=false;

        public constructor(name: string,loop: boolean,rate: number,exist: boolean) {
            this.name=name;
            this.loop=loop;
            this.rate=rate;
            this.exist=exist;
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
