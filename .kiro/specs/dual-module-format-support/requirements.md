# Requirements Document

## Introduction

This feature adds ES6 module format support to the BabylonJS-CharacterController library alongside the existing UMD format. BabylonJS provides two module formats: the UMD format (via the `babylonjs` package) and the ES6 format (via `@babylonjs/core` with individual sub-path imports). Currently, the library only supports UMD consumers. This feature enables consumers using either module format to use the CharacterController without modification.

## Glossary

- **Build_System**: The Webpack 5 configuration and associated tooling that compiles and bundles the library source into distributable outputs
- **UMD_Bundle**: The existing Universal Module Definition output that works with CommonJS, AMD, ES modules, and script tags, importing from the `babylonjs` package
- **ES6_Bundle**: A new ES module output that imports from `@babylonjs/core` sub-paths, enabling tree-shaking for consumers using the ES6 BabylonJS packages
- **Source_File**: The single TypeScript source file at `src/CharacterController.ts` containing the entire library
- **Package_Manifest**: The `package.json` file that defines entry points, exports, and metadata for npm consumers
- **Consumer**: A developer who installs and uses the `babylonjs-charactercontroller` npm package in their project

## Requirements

### Requirement 1: Dual Build Output

**User Story:** As a library maintainer, I want the build system to produce both UMD and ES6 module outputs from the same source, so that consumers using either BabylonJS module format can use the library.

#### Acceptance Criteria

1. WHEN a production build is executed, THE Build_System SHALL produce a minified UMD bundle at `dist/CharacterController.js` that exposes the library via CommonJS, AMD, and global variable access
2. WHEN a production build is executed, THE Build_System SHALL produce an ES6 module bundle at `dist/CharacterController.es.js` that uses `import`/`export` syntax
3. WHEN a development build is executed, THE Build_System SHALL produce an unminified UMD bundle at `dist/CharacterController.max.js`
4. THE Build_System SHALL externalize the `babylonjs` package in both UMD and ES6 outputs such that no BabylonJS code is included in the bundles
5. THE Build_System SHALL generate a single TypeScript declaration file at `dist/CharacterController.d.ts` that is resolvable by consumers using either UMD or ES6 module imports
6. WHEN the UMD bundle is loaded via a script tag, THE Build_System SHALL map the `babylonjs` external to the `BABYLON` global variable

### Requirement 2: ES6 Module Externalization

**User Story:** As a consumer using `@babylonjs/core`, I want the ES6 bundle to reference `@babylonjs/core` sub-path imports, so that my bundler can tree-shake unused BabylonJS modules.

#### Acceptance Criteria

1. THE ES6_Bundle SHALL emit ES module syntax (`import`/`export` statements) and import each BabylonJS type from its corresponding `@babylonjs/core` sub-path (e.g., `@babylonjs/core/Meshes/mesh`) rather than from a single monolithic `babylonjs` package
2. THE ES6_Bundle SHALL not include any BabylonJS code in its output; the bundle size SHALL contain zero bytes originating from `@babylonjs/core` packages
3. WHEN a consumer bundles the ES6 output with a tree-shaking bundler, THE ES6_Bundle SHALL produce only named imports for the specific symbols used, so that any `@babylonjs/core` sub-path not referenced by the consumer's code is excluded from the consumer's final bundle
4. THE ES6_Bundle SHALL be output to the `dist/` directory as a separate file from the existing UMD bundle, and the `package.json` `module` field SHALL reference this ES6 entry point

### Requirement 3: UMD Bundle Backward Compatibility

**User Story:** As an existing consumer using the `babylonjs` UMD package, I want the library to continue working exactly as before, so that upgrading does not break my project.

#### Acceptance Criteria

1. THE UMD_Bundle SHALL externalize the `babylonjs` package with module mappings for commonjs, commonjs2, amd, and a browser global root of `BABYLON`
2. THE UMD_Bundle SHALL use `libraryTarget: "umd"` so the output is consumable via CommonJS require, AMD define, and browser script tag
3. THE Build_System SHALL produce a production output file named `CharacterController.js` and a development output file named `CharacterController.max.js` in the `dist/` directory
4. THE Build_System SHALL mangle all properties matching the regex `/^_/` in the UMD production output using TerserPlugin
5. THE Build_System SHALL generate a TypeScript declaration file (`CharacterController.d.ts`) alongside the bundle output

### Requirement 4: Package Entry Points

**User Story:** As a consumer, I want the package.json to correctly route my import to the right bundle based on my chosen subpath, so that I do not need manual configuration.

#### Acceptance Criteria

1. THE Package_Manifest SHALL define a `main` field with a relative path pointing to the UMD bundle file located in the `dist/` directory
2. THE Package_Manifest SHALL define a `module` field with a relative path pointing to the UMD bundle file located in the `dist/` directory, so that ESM-first bundlers (Vite, Rollup) default to the UMD build for the bare import
3. THE Package_Manifest SHALL define a `types` field with a relative path pointing to the TypeScript declaration file located in the `dist/` directory
4. THE Package_Manifest SHALL define an `exports` field with the following subpath entries:
   - `"."` — bare import resolving to the UMD bundle (both `import` and `require` conditions), ensuring backward compatibility with existing UMD consumers
   - `"./es"` — ES module subpath resolving to the ES6 bundle via the `import` condition, for consumers using `@babylonjs/core`
   - `"./umd"` — explicit UMD subpath resolving to the UMD bundle (both `import` and `require` conditions)
   - Each subpath entry SHALL include a `types` condition resolving to the TypeScript declaration file
5. THE Package_Manifest SHALL reference only files that exist in the built `dist/` directory at the paths specified in the `main`, `module`, `types`, and `exports` fields

### Requirement 5: Single Source File Maintenance

**User Story:** As a library maintainer, I want to maintain a single source file without conditional compilation or duplicate code, so that the codebase remains simple.

#### Acceptance Criteria

1. THE Source_File SHALL be a single TypeScript file that contains no conditional compilation directives, no preprocessor macros, and no code blocks duplicated to target different module formats
2. THE Source_File SHALL use ES module named import syntax from the "babylonjs" package as its sole import style for all BabylonJS dependencies
3. THE Build_System SHALL externalize the "babylonjs" import and map it to the correct module reference for each consumption context: CommonJS require, AMD module name, and global variable (window.BABYLON)
4. THE Build_System SHALL produce a single UMD bundle from the Source_File that is consumable via CommonJS, AMD, ES module interop, and browser script tag without requiring separate source files per format

### Requirement 6: Peer Dependency Declaration

**User Story:** As a consumer, I want clear peer dependency declarations, so that I know which BabylonJS packages to install for my chosen module format.

#### Acceptance Criteria

1. THE Package_Manifest SHALL declare `babylonjs` as a peer dependency with a version range starting from `^8.0.0`
2. THE Package_Manifest SHALL declare `@babylonjs/core` as a peer dependency with a version range starting from `^8.0.0`
3. THE Package_Manifest SHALL mark both `babylonjs` and `@babylonjs/core` as optional in `peerDependenciesMeta` so that consumers only need to install the package matching their chosen module format
4. THE Package_Manifest SHALL specify version ranges that are compatible with the BabylonJS version currently used in devDependencies
