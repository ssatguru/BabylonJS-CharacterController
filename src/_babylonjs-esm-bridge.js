/**
 * ESM bridge module for the webpack ESM build.
 *
 * This file is used as a resolve alias for "babylonjs" in the ESM webpack config.
 * It re-exports each BabylonJS type from its individual @babylonjs/core sub-path,
 * allowing webpack to generate individual import statements in the ESM output.
 *
 * This file is NOT included in the UMD build or published to npm.
 */
export { Skeleton } from "@babylonjs/core/Bones/skeleton";
export { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
export { Vector3, Matrix, Quaternion } from "@babylonjs/core/Maths/math.vector";
export { Mesh } from "@babylonjs/core/Meshes/mesh";
export { Node } from "@babylonjs/core/node";
export { Scene } from "@babylonjs/core/scene";
export { Ray } from "@babylonjs/core/Culling/ray";
export { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
export { AnimationGroup, TargetedAnimation } from "@babylonjs/core/Animations/animationGroup";
export { TransformNode } from "@babylonjs/core/Meshes/transformNode";
export { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
export { PlaySoundAction } from "@babylonjs/core/Actions/directActions";
export { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
export { Sound } from "@babylonjs/core/Audio/sound";
export { AnimationRange } from "@babylonjs/core/Animations/animationRange";
export { Animatable } from "@babylonjs/core/Animations/animatable";
export { AnimationEvent } from "@babylonjs/core/Animations/animationEvent";
export { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
export { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
export { Color3 } from "@babylonjs/core/Maths/math.color";
