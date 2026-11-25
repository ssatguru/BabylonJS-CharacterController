# Tech Stack

## Language & Runtime

- TypeScript (compiled to ES5)
- Target: browsers (dual module format — UMD and ES module)

## Dependencies

- **babylonjs** (optional peer dependency, not bundled) — for UMD consumers
- **@babylonjs/core** (optional peer dependency, not bundled) — for ES module consumers
- Both declared at `^8.0.0` in peerDependencies, currently `^8.56.2` in devDependencies

## Build Tools

- **Webpack 5** — bundler, configured in `webpack.config.js` (multi-config array)
- **ts-loader** — TypeScript compilation within webpack
- **TypeScript ^4.9** — compiler
- **TerserPlugin** — minification for UMD production builds (mangles properties prefixed with `_`)
- **webpack-dev-server** — local development with live reload

## Source Layout

- The library core lives in `src/CharacterController.ts` (exported classes `CharacterController`, `ActionData`, `ActionMap`, `CCSettings`; internal `_Action`; pure navigation helpers).
- Larger features may live in their own modules under `src/`, imported by `CharacterController.ts`. WebXR support lives under `src/xr/` (`XRController.ts` glue + pure `XRLocomotion.ts` / `XRSupport.ts` / `XRInputMapping.ts`). Prefer new cohesive modules over growing the single file.
- The build entry point is still the single file `src/CharacterController.ts`; webpack bundles everything reachable from it. Adding modules under `src/` needs no webpack/tsconfig entry change (`tsconfig` compiles all `src/**/*.ts`).

## Key Build Configuration

- Entry point: `src/CharacterController.ts` (webpack follows its imports, including `src/xr/*.ts`)
- Webpack exports an array of two configurations from the same entry point:
  - **UMD config**: `dist/CharacterController.js` (production, minified) or `dist/CharacterController.max.js` (development). Externalizes `babylonjs` as CommonJS/AMD/global (`BABYLON`).
  - **ESM config**: `dist/CharacterController.es.js` (production only, unminified). Uses `src/_babylonjs-esm-bridge.js` to re-export BabylonJS types from `@babylonjs/core` sub-paths. Each sub-path is externalized via `webpack.es-externals.js` import map.
- Source maps enabled for both outputs
- TypeScript declarations generated once (`dist/CharacterController.d.ts`), shared by both formats. Public types/enums/functions from feature modules (e.g. `src/xr/*`) must be re-exported from the `CharacterController.ts` entry so they appear in the shared declarations.
- Private properties (prefixed with `_`) are mangled in UMD production builds only

## Import Map Maintenance

When adding new BabylonJS imports to ANY library source file (`src/CharacterController.ts` or any `src/xr/*.ts` / feature module), update:
1. `webpack.es-externals.js` — add type name → `@babylonjs/core` sub-path mapping
2. `src/_babylonjs-esm-bridge.js` — add re-export line for the new type

The `esm-import-map-completeness` test catches missing entries. Pure modules that import no BabylonJS types need no import-map/bridge entries.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build → `dist/CharacterController.js` (UMD) + `dist/CharacterController.es.js` (ESM) |
| `npm run build-dev` | Development build (UMD only) → `dist/CharacterController.max.js` |
| `npm run dev` | Start webpack-dev-server, opens `tst/test.html` |
| `npm test` | Run vitest tests |
| `npm install` | Install dependencies (run once after clone) |

## Testing

- **Vitest** — test runner (configured in `vitest.config.ts`)
- **fast-check** — property-based testing library
- Tests in `tests/` folder, run with `npm test` or `npx vitest run`
- Pure logic is extracted into standalone functions/modules (no BabylonJS scene instantiation needed) and imported directly by tests — e.g. the pure `src/xr/` modules (`XRLocomotion`, `XRSupport`, `XRInputMapping`) are property/unit tested without a scene; BabylonJS-facing glue (`XRController`) is tested against mocks.
- Build verification tests check import map completeness, webpack config structure, package entry points, and ESM output correctness
- Manual testing via HTML test pages in `tst/` folder served by webpack-dev-server. WebXR manual testing requires a secure context (HTTPS/localhost) and a compatible headset or the WebXR emulator.
