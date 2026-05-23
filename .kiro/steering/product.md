# Product Overview

BabylonJS-CharacterController is a third-person character controller library for BabylonJS (3D WebGL framework). It provides avatar movement, animation management, camera following, and collision handling without relying on a physics engine.

## Core Capabilities

- Avatar movement: walk, run, strafe, turn, jump, fall, slide
- Two camera modes: third-person/first-person (mode 0) and top-down/isometric (mode 1)
- Animation support via both AnimationRanges (skeleton) and AnimationGroups (.glb files)
- Keyboard input handling with configurable key bindings
- Programmatic avatar control (for NPCs or UI-driven movement)
- Slope traversal limits and step climbing
- Camera elasticity (snaps in front of obstructions)
- Automatic first-person mode when camera is close to avatar
- Footstep sound playback synced to animation cycles

## Target Users

Game developers using BabylonJS who need a ready-made character controller for third-person or isometric games.

## Distribution

Published to npm as `babylonjs-charactercontroller`. Distributed as a UMD module usable via CommonJS, AMD, ES modules, or script tag.
