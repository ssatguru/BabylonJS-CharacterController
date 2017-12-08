var org;
(function (org) {
    var ssatguru;
    (function (ssatguru) {
        var babylonjs;
        (function (babylonjs) {
            var component;
            (function (component) {
                var Vector3 = BABYLON.Vector3;
                var Ray = BABYLON.Ray;
                var CharacterControl = (function () {
                    function CharacterControl(avatar, avatarSkeleton, camera, scene) {
                        var _this = this;
                        this.slopeLimit = 30;
                        this.maxSlopeLimit = 45;
                        this.sl = Math.PI * this.slopeLimit / 180;
                        this.sl2 = Math.PI * this.maxSlopeLimit / 180;
                        this.started = false;
                        this.walkSpeed = 3;
                        this.runSpeed = this.walkSpeed * 2;
                        this.backSpeed = this.walkSpeed / 2;
                        this.jumpSpeed = this.walkSpeed * 2;
                        this.leftSpeed = this.walkSpeed / 2;
                        this.rightSpeed = this.walkSpeed / 2;
                        this.prevAnim = null;
                        this.gravity = 9.8;
                        this.avStartPos = new Vector3(0, 0, 0);
                        this.grounded = false;
                        this.freeFallDist = 0;
                        this.fallFrameCountMin = 50;
                        this.fallFrameCount = 0;
                        this.inFreeFall = false;
                        this.wasWalking = false;
                        this.wasRunning = false;
                        this.jumpStartPosY = 0;
                        this.jumpTime = 0;
                        this.movFallTime = 0;
                        this.idleFallTime = 0;
                        this.groundFrameCount = 0;
                        this.groundFrameMax = 10;
                        this.ray = new Ray(Vector3.Zero(), Vector3.One(), 1);
                        this.rayDir = Vector3.Zero();
                        this.move = false;
                        this.avatarSkeleton = avatarSkeleton;
                        this.initAnims();
                        this.camera = camera;
                        this.avatar = avatar;
                        this.scene = scene;
                        this.key = new Key();
                        window.addEventListener("keydown", function (e) { return _this.onKeyDown(e); }, false);
                        window.addEventListener("keyup", function (e) { return _this.onKeyUp(e); }, false);
                        this.renderer = function () { _this.moveAVandCamera(); };
                    }
                    CharacterControl.prototype.setAvatar = function (avatar) {
                        this.avatar = avatar;
                    };
                    CharacterControl.prototype.setAvatarSkeleton = function (avatarSkeleton) {
                        this.avatarSkeleton = avatarSkeleton;
                    };
                    CharacterControl.prototype.setSlopeLimit = function (slopeLimit) {
                        this.slopeLimit = slopeLimit;
                        this.sl = Math.PI * slopeLimit / 180;
                    };
                    CharacterControl.prototype.setWalkSpeed = function (n) {
                        this.walkSpeed = n;
                    };
                    CharacterControl.prototype.setRunSpeed = function (n) {
                        this.runSpeed = n;
                    };
                    CharacterControl.prototype.setBackSpeed = function (n) {
                        this.backSpeed = n;
                    };
                    CharacterControl.prototype.setJumpSpeed = function (n) {
                        this.jumpSpeed = n;
                    };
                    CharacterControl.prototype.setLeftSpeed = function (n) {
                        this.leftSpeed = n;
                    };
                    CharacterControl.prototype.setRightSpeed = function (n) {
                        this.rightSpeed = n;
                    };
                    CharacterControl.prototype.start = function () {
                        if (this.started)
                            return;
                        this.started = true;
                        this.key.reset();
                        this.movFallTime = 0;
                        this.idleFallTime = 0.001;
                        this.grounded = false;
                        this.updateTargetValue();
                        this.scene.registerBeforeRender(this.renderer);
                        this.scene;
                    };
                    CharacterControl.prototype.stop = function () {
                        if (!this.started)
                            return;
                        this.started = false;
                        this.scene.unregisterBeforeRender(this.renderer);
                    };
                    CharacterControl.prototype.initAnims = function () {
                        this.walk = new AnimData("walk", true, 1, true);
                        this.walkBack = new AnimData("walkBack", true, 0.5, true);
                        this.idle = new AnimData("idle", true, 1, true);
                        this.run = new AnimData("run", true, 1, true);
                        this.jump = new AnimData("jump", false, 2, true);
                        this.fall = new AnimData("fall", false, 1, true);
                        this.turnLeft = new AnimData("turnLeft", true, 0.5, true);
                        this.turnRight = new AnimData("turnRight", true, 0.5, true);
                        this.strafeLeft = new AnimData("strafeLeft", true, 1, true);
                        this.strafeRight = new AnimData("strafeRight", true, 1, true);
                        this.slideBack = new AnimData("slideBack", true, 1, true);
                    };
                    CharacterControl.prototype.moveAVandCamera = function () {
                        this.avStartPos.copyFrom(this.avatar.position);
                        var anim = null;
                        var dt = this.scene.getEngine().getDeltaTime() / 1000;
                        if (this.key.jump && !this.inFreeFall) {
                            this.grounded = false;
                            this.idleFallTime = 0;
                            anim = this.doJump(dt);
                        }
                        else if (this.anyMovement() || this.inFreeFall) {
                            this.grounded = false;
                            this.idleFallTime = 0;
                            anim = this.doMove(dt);
                        }
                        else if (!this.inFreeFall) {
                            anim = this.doIdle(dt);
                        }
                        if (anim != null) {
                            if (this.avatarSkeleton !== null) {
                                if (this.prevAnim !== anim) {
                                    if (anim.exist) {
                                        this.avatarSkeleton.beginAnimation(anim.name, anim.l, anim.r);
                                    }
                                    this.prevAnim = anim;
                                }
                            }
                        }
                        this.updateTargetValue();
                        return;
                    };
                    CharacterControl.prototype.doJump = function (dt) {
                        var anim = null;
                        anim = this.jump;
                        if (this.jumpTime === 0) {
                            this.jumpStartPosY = this.avatar.position.y;
                        }
                        var js = this.jumpSpeed - this.gravity * this.jumpTime;
                        var jumpDist = js * dt - 0.5 * this.gravity * dt * dt;
                        this.jumpTime = this.jumpTime + dt;
                        var forwardDist = 0;
                        var disp;
                        this.avatar.rotation.y = -4.69 - this.camera.alpha;
                        if (this.wasRunning || this.wasWalking) {
                            if (this.wasRunning) {
                                forwardDist = this.runSpeed * dt;
                            }
                            else if (this.wasWalking) {
                                forwardDist = this.walkSpeed * dt;
                            }
                            disp = this.moveVector.clone();
                            disp.y = 0;
                            disp = disp.normalize();
                            disp.scaleToRef(forwardDist, disp);
                            disp.y = jumpDist;
                        }
                        else {
                            disp = new Vector3(0, jumpDist, 0);
                        }
                        this.avatar.moveWithCollisions(disp);
                        if (jumpDist < 0) {
                            anim = this.fall;
                            if ((this.avatar.position.y > this.avStartPos.y) || ((this.avatar.position.y === this.avStartPos.y) && (disp.length() > 0.001))) {
                                this.endJump();
                            }
                            else if (this.avatar.position.y < this.jumpStartPosY) {
                                var actDisp = this.avatar.position.subtract(this.avStartPos);
                                if (!(this.areVectorsEqual(actDisp, disp, 0.001))) {
                                    if (this.verticalSlope(actDisp) <= this.sl) {
                                        this.endJump();
                                    }
                                }
                            }
                        }
                        return anim;
                    };
                    CharacterControl.prototype.endJump = function () {
                        this.key.jump = false;
                        this.jumpTime = 0;
                        this.wasWalking = false;
                        this.wasRunning = false;
                    };
                    CharacterControl.prototype.areVectorsEqual = function (v1, v2, p) {
                        return ((Math.abs(v1.x - v2.x) < p) && (Math.abs(v1.y - v2.y) < p) && (Math.abs(v1.z - v2.z) < p));
                    };
                    CharacterControl.prototype.verticalSlope = function (v) {
                        return Math.atan(Math.abs(v.y / Math.sqrt(v.x * v.x + v.z * v.z)));
                    };
                    CharacterControl.prototype.doMove = function (dt) {
                        var u = this.movFallTime * this.gravity;
                        this.freeFallDist = u * dt + this.gravity * dt * dt / 2;
                        this.movFallTime = this.movFallTime + dt;
                        var moving = false;
                        var anim = null;
                        if (this.inFreeFall) {
                            this.moveVector.y = -this.freeFallDist;
                            moving = true;
                        }
                        else {
                            this.wasWalking = false;
                            this.wasRunning = false;
                            if (this.key.forward) {
                                var forwardDist = 0;
                                if (this.key.shift) {
                                    this.wasRunning = true;
                                    forwardDist = this.runSpeed * dt;
                                    anim = this.run;
                                }
                                else {
                                    this.wasWalking = true;
                                    forwardDist = this.walkSpeed * dt;
                                    anim = this.walk;
                                }
                                this.moveVector = this.avatar.calcMovePOV(0, -this.freeFallDist, forwardDist);
                                moving = true;
                            }
                            else if (this.key.backward) {
                                this.moveVector = this.avatar.calcMovePOV(0, -this.freeFallDist, -(this.backSpeed * dt));
                                anim = this.walkBack;
                                moving = true;
                            }
                            else if (this.key.stepLeft) {
                                anim = this.strafeLeft;
                                this.moveVector = this.avatar.calcMovePOV(-(this.leftSpeed * dt), -this.freeFallDist, 0);
                                moving = true;
                            }
                            else if (this.key.stepRight) {
                                anim = this.strafeRight;
                                this.moveVector = this.avatar.calcMovePOV((this.rightSpeed * dt), -this.freeFallDist, 0);
                                moving = true;
                            }
                        }
                        if (!this.key.stepLeft && !this.key.stepRight) {
                            if (this.key.turnLeft) {
                                this.camera.alpha = this.camera.alpha + 0.022;
                                if (!moving) {
                                    this.avatar.rotation.y = -4.69 - this.camera.alpha;
                                    anim = this.turnLeft;
                                }
                            }
                            else if (this.key.turnRight) {
                                this.camera.alpha = this.camera.alpha - 0.022;
                                if (!moving) {
                                    this.avatar.rotation.y = -4.69 - this.camera.alpha;
                                    anim = this.turnRight;
                                }
                            }
                        }
                        if (moving) {
                            this.avatar.rotation.y = -4.69 - this.camera.alpha;
                            if (this.moveVector.length() > 0.001) {
                                this.avatar.moveWithCollisions(this.moveVector);
                                if (this.avatar.position.y > this.avStartPos.y) {
                                    var actDisp = this.avatar.position.subtract(this.avStartPos);
                                    if (this.verticalSlope(actDisp) > this.sl2) {
                                        this.avatar.position.copyFrom(this.avStartPos);
                                        this.endFreeFall();
                                    }
                                    if (this.verticalSlope(actDisp) < this.sl) {
                                        this.endFreeFall();
                                    }
                                    else {
                                        this.fallFrameCount = 0;
                                        this.inFreeFall = false;
                                    }
                                }
                                else if ((this.avatar.position.y) < this.avStartPos.y) {
                                    var actDisp = this.avatar.position.subtract(this.avStartPos);
                                    if (!(this.areVectorsEqual(actDisp, this.moveVector, 0.001))) {
                                        if (this.verticalSlope(actDisp) <= this.sl) {
                                            this.endFreeFall();
                                        }
                                        else {
                                            this.fallFrameCount = 0;
                                            this.inFreeFall = false;
                                        }
                                    }
                                    else {
                                        this.inFreeFall = true;
                                        this.fallFrameCount++;
                                        if (this.fallFrameCount > this.fallFrameCountMin) {
                                            anim = this.fall;
                                        }
                                    }
                                }
                                else {
                                    this.endFreeFall();
                                }
                            }
                        }
                        return anim;
                    };
                    CharacterControl.prototype.endFreeFall = function () {
                        this.movFallTime = 0;
                        this.fallFrameCount = 0;
                        this.inFreeFall = false;
                    };
                    CharacterControl.prototype.doIdle = function (dt) {
                        if (this.grounded) {
                            return this.idle;
                        }
                        this.wasWalking = false;
                        this.wasRunning = false;
                        this.movFallTime = 0;
                        var anim = this.idle;
                        this.fallFrameCount = 0;
                        if (dt === 0) {
                            this.freeFallDist = 5;
                        }
                        else {
                            var u = this.idleFallTime * this.gravity;
                            this.freeFallDist = u * dt + this.gravity * dt * dt / 2;
                            this.idleFallTime = this.idleFallTime + dt;
                        }
                        if (this.freeFallDist < 0.01)
                            return anim;
                        var disp = new Vector3(0, -this.freeFallDist, 0);
                        ;
                        this.avatar.rotation.y = -4.69 - this.camera.alpha;
                        this.avatar.moveWithCollisions(disp);
                        if ((this.avatar.position.y > this.avStartPos.y) || (this.avatar.position.y === this.avStartPos.y)) {
                            this.groundIt();
                        }
                        else if (this.avatar.position.y < this.avStartPos.y) {
                            var actDisp = this.avatar.position.subtract(this.avStartPos);
                            if (!(this.areVectorsEqual(actDisp, disp, 0.001))) {
                                if (this.verticalSlope(actDisp) <= this.sl) {
                                    this.groundIt();
                                    this.avatar.position.copyFrom(this.avStartPos);
                                }
                                else {
                                    this.unGroundIt();
                                    anim = this.slideBack;
                                }
                            }
                        }
                        return anim;
                    };
                    CharacterControl.prototype.groundIt = function () {
                        this.groundFrameCount++;
                        if (this.groundFrameCount > this.groundFrameMax) {
                            this.grounded = true;
                            this.idleFallTime = 0;
                        }
                    };
                    CharacterControl.prototype.unGroundIt = function () {
                        this.grounded = false;
                        this.groundFrameCount = 0;
                    };
                    CharacterControl.prototype.updateTargetValue = function () {
                        this.camera.target.copyFromFloats(this.avatar.position.x, (this.avatar.position.y + 1.5), this.avatar.position.z);
                        this.bounceCamera();
                    };
                    CharacterControl.prototype.bounceCamera = function () {
                        this.camera.position.subtractToRef(this.camera.target, this.rayDir);
                        this.ray.origin = this.camera.target;
                        this.ray.length = this.rayDir.length();
                        this.ray.direction = this.rayDir.normalize();
                        var pi = this.scene.pickWithRay(this.ray, null, true);
                        if (pi.hit) {
                            this.camera.position = pi.pickedPoint;
                        }
                    };
                    CharacterControl.prototype.onKeyDown = function (e) {
                        var event = e;
                        var chr = String.fromCharCode(event.keyCode);
                        if (event.keyCode === 32) {
                            this.key.jump = true;
                        }
                        else if (event.keyCode === 16)
                            this.key.shift = true;
                        else if ((chr === "W") || (event.keyCode === 38))
                            this.key.forward = true;
                        else if ((chr === "A") || (event.keyCode === 37))
                            this.key.turnLeft = true;
                        else if ((chr === "D") || (event.keyCode === 39))
                            this.key.turnRight = true;
                        else if ((chr === "S") || (event.keyCode === 40))
                            this.key.backward = true;
                        else if (chr === "Q")
                            this.key.stepLeft = true;
                        else if (chr === "E")
                            this.key.stepRight = true;
                        this.move = this.anyMovement();
                    };
                    CharacterControl.prototype.anyMovement = function () {
                        return (this.key.forward || this.key.backward || this.key.turnLeft || this.key.turnRight || this.key.stepLeft || this.key.stepRight);
                    };
                    CharacterControl.prototype.onKeyUp = function (e) {
                        var event = e;
                        var chr = String.fromCharCode(event.keyCode);
                        if (event.keyCode === 32) {
                        }
                        else if (event.keyCode === 16) {
                            this.key.shift = false;
                        }
                        else if ((chr === "W") || (event.keyCode === 38))
                            this.key.forward = false;
                        else if ((chr === "A") || (event.keyCode === 37))
                            this.key.turnLeft = false;
                        else if ((chr === "D") || (event.keyCode === 39))
                            this.key.turnRight = false;
                        else if ((chr === "S") || (event.keyCode === 40))
                            this.key.backward = false;
                        else if (chr === "Q")
                            this.key.stepLeft = false;
                        else if (chr === "E")
                            this.key.stepRight = false;
                        this.move = this.anyMovement();
                    };
                    CharacterControl.prototype.horizontalMove = function (v1, v2) {
                        var dx = v1.x - v2.x;
                        var dz = v1.z - v2.z;
                        var d = Math.sqrt(dx * dx + dz * dz);
                        return d;
                    };
                    return CharacterControl;
                }());
                component.CharacterControl = CharacterControl;
                var AnimData = (function () {
                    function AnimData(name, l, r, e) {
                        this.exist = false;
                        this.name = name;
                        this.l = l;
                        this.r = r;
                        this.exist = e;
                    }
                    return AnimData;
                }());
                component.AnimData = AnimData;
                var Key = (function () {
                    function Key() {
                        this.forward = false;
                        this.backward = false;
                        this.turnRight = false;
                        this.turnLeft = false;
                        this.stepRight = false;
                        this.stepLeft = false;
                        this.jump = false;
                        this.shift = false;
                    }
                    Key.prototype.reset = function () {
                        this.forward = false;
                        this.backward = false;
                        this.turnRight = false;
                        this.turnLeft = false;
                        this.stepRight = false;
                        this.stepLeft = false;
                        this.jump = false;
                        this.shift = false;
                    };
                    return Key;
                }());
                component.Key = Key;
            })(component = babylonjs.component || (babylonjs.component = {}));
        })(babylonjs = ssatguru.babylonjs || (ssatguru.babylonjs = {}));
    })(ssatguru = org.ssatguru || (org.ssatguru = {}));
})(org || (org = {}));
//# sourceMappingURL=CharacterController.js.map