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
                    function CharacterControl(avatar, camera, scene) {
                        var _this = this;
                        this.walkSpeed = 3;
                        this.runSpeed = this.walkSpeed * 2;
                        this.backSpeed = this.walkSpeed / 2;
                        this.jumpSpeed = this.walkSpeed * 2;
                        this.leftSpeed = this.walkSpeed / 2;
                        this.rightSpeed = this.walkSpeed / 2;
                        this.gravity = 9.8;
                        this.minSlopeLimit = 30;
                        this.maxSlopeLimit = 45;
                        this.sl = Math.PI * this.minSlopeLimit / 180;
                        this.sl2 = Math.PI * this.maxSlopeLimit / 180;
                        this.walk = new AnimData("walk");
                        this.walkBack = new AnimData("walkBack");
                        this.idle = new AnimData("idle");
                        this.run = new AnimData("run");
                        this.jump = new AnimData("jump");
                        this.fall = new AnimData("fall");
                        this.turnLeft = new AnimData("turnLeft");
                        this.turnRight = new AnimData("turnRight");
                        this.strafeLeft = new AnimData("strafeLeft");
                        this.strafeRight = new AnimData("strafeRight");
                        this.slideBack = new AnimData("slideBack");
                        this.anims = [this.walk, this.walkBack, this.idle, this.run, this.jump, this.fall, this.turnLeft, this.turnRight, this.strafeLeft, this.strafeRight, this.slideBack];
                        this.walkKey = "W";
                        this.walkBackKey = "S";
                        this.turnLeftKey = "A";
                        this.turnRightKey = "D";
                        this.strafeLeftKey = "Q";
                        this.strafeRightKey = "E";
                        this.jumpKey = "32";
                        this.walkCode = 38;
                        this.walkBackCode = 40;
                        this.turnLeftCode = 37;
                        this.turnRightCode = 39;
                        this.strafeLeftCode = 0;
                        this.strafeRightCode = 0;
                        this.jumpCode = 32;
                        this.elasticCamera = true;
                        this.cameraTarget = new Vector3(0, 0, 0);
                        this.noFirstPerson = false;
                        this.started = false;
                        this.prevAnim = null;
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
                        this.savedCameraCollision = true;
                        this.ray = new Ray(Vector3.Zero(), Vector3.One(), 1);
                        this.rayDir = Vector3.Zero();
                        this.move = false;
                        this.avatar = avatar;
                        this.scene = scene;
                        this.skeleton = avatar.skeleton;
                        if (this.skeleton != null)
                            this.checkAnims(this.skeleton);
                        this.camera = camera;
                        this.savedCameraCollision = this.camera.checkCollisions;
                        this.key = new Key();
                        window.addEventListener("keydown", function (e) { return _this.onKeyDown(e); }, false);
                        window.addEventListener("keyup", function (e) { return _this.onKeyUp(e); }, false);
                        this.renderer = function () { _this.moveAVandCamera(); };
                    }
                    CharacterControl.prototype.setAvatar = function (avatar) {
                        this.avatar = avatar;
                    };
                    CharacterControl.prototype.setAvatarSkeleton = function (skeleton) {
                        this.skeleton = skeleton;
                        this.checkAnims(skeleton);
                    };
                    CharacterControl.prototype.setSlopeLimit = function (minSlopeLimit, maxSlopeLimit) {
                        this.minSlopeLimit = minSlopeLimit;
                        this.maxSlopeLimit = maxSlopeLimit;
                        this.sl = Math.PI * minSlopeLimit / 180;
                        this.sl2 = Math.PI * this.maxSlopeLimit / 180;
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
                    CharacterControl.prototype.setGravity = function (n) {
                        this.gravity = n;
                    };
                    CharacterControl.prototype.setAnim = function (anim, rangeName, rate, loop) {
                        if (this.skeleton == null)
                            return;
                        anim.name = rangeName;
                        anim.rate = rate;
                        anim.loop = loop;
                        if (this.skeleton.getAnimationRange(anim.name) != null) {
                            anim.exist = true;
                        }
                        else {
                            anim.exist = false;
                        }
                    };
                    CharacterControl.prototype.setWalkAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.walk, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setRunAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.run, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setWalkBackAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.walkBack, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setSlideBackAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.slideBack, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setIdleAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.idle, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setTurnRightAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.turnRight, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setTurnLeftAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.turnLeft, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setStrafeRightAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.strafeRight, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setSrafeLeftAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.strafeLeft, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setJumpAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.jump, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setFallAnim = function (rangeName, rate, loop) {
                        this.setAnim(this.fall, rangeName, rate, loop);
                    };
                    CharacterControl.prototype.setWalkKey = function (key) {
                        this.walkKey = key;
                    };
                    CharacterControl.prototype.setWalkBackKey = function (key) {
                        this.walkBackKey = key;
                    };
                    CharacterControl.prototype.setTurnLeftKey = function (key) {
                        this.turnLeftKey = key;
                    };
                    CharacterControl.prototype.setTurnRightKey = function (key) {
                        this.turnRightKey = key;
                    };
                    CharacterControl.prototype.setStrafeLeftKey = function (key) {
                        this.strafeLeftKey = key;
                    };
                    CharacterControl.prototype.setStrafeRightKey = function (key) {
                        this.strafeRightKey = key;
                    };
                    CharacterControl.prototype.setJumpKey = function (key) {
                        this.jumpKey = key;
                    };
                    CharacterControl.prototype.setWalkCode = function (code) {
                        this.walkCode = code;
                    };
                    CharacterControl.prototype.setWalkBackCode = function (code) {
                        this.walkBackCode = code;
                    };
                    CharacterControl.prototype.setTurnLeftCode = function (code) {
                        this.turnLeftCode = code;
                    };
                    CharacterControl.prototype.setTurnRightCode = function (code) {
                        this.turnRightCode = code;
                    };
                    CharacterControl.prototype.setStrafeLeftCode = function (code) {
                        this.strafeLeftCode = code;
                    };
                    CharacterControl.prototype.setStrafeRightCode = function (code) {
                        this.strafeRightCode = code;
                    };
                    CharacterControl.prototype.setJumpCode = function (code) {
                        this.jumpCode = code;
                    };
                    CharacterControl.prototype.setCameraElastic = function (b) {
                        this.elasticCamera = b;
                    };
                    CharacterControl.prototype.setCameraTarget = function (v) {
                        this.cameraTarget.copyFrom(v);
                    };
                    CharacterControl.prototype.setNoFirstPerson = function (b) {
                        this.noFirstPerson = b;
                    };
                    CharacterControl.prototype.checkAnims = function (skel) {
                        for (var _i = 0, _a = this.anims; _i < _a.length; _i++) {
                            var anim = _a[_i];
                            if (skel.getAnimationRange(anim.name) != null)
                                anim.exist = true;
                        }
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
                            if (this.skeleton !== null) {
                                if (this.prevAnim !== anim) {
                                    if (anim.exist) {
                                        this.skeleton.beginAnimation(anim.name, anim.loop, anim.rate);
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
                        this.avatar.position.addToRef(this.cameraTarget, this.camera.target);
                        if (this.camera.radius > this.camera.lowerRadiusLimit) {
                            if (this.elasticCamera)
                                this.snapCamera();
                        }
                        if (this.camera.radius <= this.camera.lowerRadiusLimit) {
                            if (!this.noFirstPerson) {
                                this.avatar.visibility = 0;
                                this.camera.checkCollisions = false;
                            }
                        }
                        else {
                            this.avatar.visibility = 1;
                            this.camera.checkCollisions = this.savedCameraCollision;
                        }
                    };
                    CharacterControl.prototype.snapCamera = function () {
                        var _this = this;
                        this.camera.position.subtractToRef(this.camera.target, this.rayDir);
                        this.ray.origin = this.camera.target;
                        this.ray.length = this.rayDir.length();
                        this.ray.direction = this.rayDir.normalize();
                        var pi = this.scene.pickWithRay(this.ray, function (mesh) {
                            if (mesh == _this.avatar || !mesh.isPickable)
                                return false;
                            else
                                return true;
                        }, true);
                        if (pi.hit) {
                            if (this.camera.checkCollisions) {
                                this.camera.position = pi.pickedPoint;
                            }
                            else {
                                var nr = pi.pickedPoint.subtract(this.camera.target).length();
                                this.camera.radius = nr;
                            }
                        }
                    };
                    CharacterControl.prototype.anyMovement = function () {
                        return (this.key.forward || this.key.backward || this.key.turnLeft || this.key.turnRight || this.key.stepLeft || this.key.stepRight);
                    };
                    CharacterControl.prototype.onKeyDown = function (e) {
                        var event = e;
                        var code = event.keyCode;
                        var chr = String.fromCharCode(code);
                        if ((chr === this.jumpKey) || (code === this.jumpCode))
                            this.key.jump = true;
                        else if (code === 16)
                            this.key.shift = true;
                        else if ((chr === this.walkKey) || (code === this.walkCode))
                            this.key.forward = true;
                        else if ((chr === this.turnLeftKey) || (code === this.turnLeftCode))
                            this.key.turnLeft = true;
                        else if ((chr === this.turnRightKey) || (code === this.turnRightCode))
                            this.key.turnRight = true;
                        else if ((chr === this.walkBackKey) || (code === this.walkBackCode))
                            this.key.backward = true;
                        else if ((chr === this.strafeLeftKey) || (code === this.strafeLeftCode))
                            this.key.stepLeft = true;
                        else if ((chr === this.strafeRightKey) || (code === this.strafeRightCode))
                            this.key.stepRight = true;
                        this.move = this.anyMovement();
                    };
                    CharacterControl.prototype.onKeyUp = function (e) {
                        var event = e;
                        var code = event.keyCode;
                        var chr = String.fromCharCode(code);
                        if (code === 16) {
                            this.key.shift = false;
                        }
                        else if ((chr === this.walkKey) || (code === this.walkCode))
                            this.key.forward = false;
                        else if ((chr === this.turnLeftKey) || (code === this.turnLeftCode))
                            this.key.turnLeft = false;
                        else if ((chr === this.turnRightKey) || (code === this.turnRightCode))
                            this.key.turnRight = false;
                        else if ((chr === this.walkBackKey) || (code === this.walkBackCode))
                            this.key.backward = false;
                        else if ((chr === this.strafeLeftKey) || (code === this.strafeLeftCode))
                            this.key.stepLeft = false;
                        else if ((chr === this.strafeRightKey) || (code === this.strafeRightCode))
                            this.key.stepRight = false;
                        this.move = this.anyMovement();
                    };
                    return CharacterControl;
                }());
                component.CharacterControl = CharacterControl;
                var AnimData = (function () {
                    function AnimData(name) {
                        this.loop = true;
                        this.rate = 1;
                        this.exist = false;
                        this.name = name;
                    }
                    return AnimData;
                }());
                component.AnimData = AnimData;
                var Key = (function () {
                    function Key() {
                        this.reset();
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