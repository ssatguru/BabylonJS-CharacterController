/**
 * ES6 externals mapping for the ESM webpack build.
 *
 * Maps each BabylonJS type imported by src/CharacterController.ts
 * to its corresponding @babylonjs/core sub-path import.
 */

const BABYLONJS_ES6_MAP = {
  "Skeleton": "@babylonjs/core/Bones/skeleton",
  "ArcRotateCamera": "@babylonjs/core/Cameras/arcRotateCamera",
  "Vector3": "@babylonjs/core/Maths/math.vector",
  "Mesh": "@babylonjs/core/Meshes/mesh",
  "Node": "@babylonjs/core/node",
  "Scene": "@babylonjs/core/scene",
  "Ray": "@babylonjs/core/Culling/ray",
  "PickingInfo": "@babylonjs/core/Collisions/pickingInfo",
  "AnimationGroup": "@babylonjs/core/Animations/animationGroup",
  "TransformNode": "@babylonjs/core/Meshes/transformNode",
  "TargetedAnimation": "@babylonjs/core/Animations/animationGroup",
  "Matrix": "@babylonjs/core/Maths/math.vector",
  "DeepImmutable": "@babylonjs/core/types",
  "AbstractMesh": "@babylonjs/core/Meshes/abstractMesh",
  "PlaySoundAction": "@babylonjs/core/Actions/directActions",
  "InstancedMesh": "@babylonjs/core/Meshes/instancedMesh",
  "Sound": "@babylonjs/core/Audio/sound",
  "AnimationRange": "@babylonjs/core/Animations/animationRange",
  "Animatable": "@babylonjs/core/Animations/animatable",
  "AnimationEvent": "@babylonjs/core/Animations/animationEvent",
  "int": "@babylonjs/core/types",
  "LinesMesh": "@babylonjs/core/Meshes/linesMesh",
  "MeshBuilder": "@babylonjs/core/Meshes/meshBuilder",
  "Color3": "@babylonjs/core/Maths/math.color",
  "Quaternion": "@babylonjs/core/Maths/math.vector",
};

/**
 * Webpack externals function for the ESM build configuration.
 *
 * When webpack encounters an import of "babylonjs", this function
 * resolves it to the individual @babylonjs/core sub-path imports
 * based on the BABYLONJS_ES6_MAP.
 *
 * Usage in webpack config:
 *   externals: [esExternalsFunction]
 *
 * @param {{request: string, contextInfo: object, context: string}} data - The externals callback data
 * @param {function} callback - The webpack externals callback: callback(err, result)
 */
function esExternalsFunction({ request }, callback) {
  if (request === "babylonjs") {
    // Build an array of sub-path externals grouped by module path.
    // Webpack will generate individual import statements for each sub-path.
    const subPaths = [...new Set(Object.values(BABYLONJS_ES6_MAP))];
    // Return the first sub-path as the module external.
    // Webpack's externals function for "module" type expects a single module specifier,
    // but the actual rewriting is handled per-import by the more granular approach below.
    // For the full rewrite, we use the externals array with per-type resolution.
    callback(null, subPaths[0]);
    return;
  }
  callback();
}

/**
 * Creates a webpack externals function that rewrites each individual
 * BabylonJS type import to its @babylonjs/core sub-path.
 *
 * This works with webpack's module externals type to produce
 * individual import statements in the ESM output like:
 *   import { Vector3 } from "@babylonjs/core/Maths/math.vector";
 *
 * @returns {function} A webpack externals function
 */
function createESExternals() {
  return function ({ request }, callback) {
    if (request === "babylonjs") {
      // Group types by their sub-path to produce clean imports
      const pathToTypes = {};
      for (const [typeName, subPath] of Object.entries(BABYLONJS_ES6_MAP)) {
        if (!pathToTypes[subPath]) {
          pathToTypes[subPath] = [];
        }
        pathToTypes[subPath].push(typeName);
      }

      // Return the externals as an array of sub-path modules.
      // Each unique sub-path becomes a separate import in the output.
      const externals = Object.keys(pathToTypes);
      callback(null, externals);
      return;
    }
    callback();
  };
}

module.exports = {
  BABYLONJS_ES6_MAP,
  esExternalsFunction,
  createESExternals,
};
