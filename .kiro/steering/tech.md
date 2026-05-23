# Tech Stack

## Language & Runtime

- TypeScript (compiled to ES5)
- Target: browsers (UMD module format)

## Dependencies

- **babylonjs** (peer/external dependency, not bundled) — currently ^8.4.0 in devDependencies

## Build Tools

- **Webpack 5** — bundler, configured in `webpack.config.js`
- **ts-loader** — TypeScript compilation within webpack
- **TypeScript ^4.9** — compiler
- **TerserPlugin** — minification for production builds (mangles properties prefixed with `_`)
- **webpack-dev-server** — local development with live reload

## Key Build Configuration

- Entry point: `src/CharacterController.ts`
- Output: `dist/CharacterController.js` (production, minified) or `dist/CharacterController.max.js` (development)
- Module format: UMD (libraryTarget: "umd")
- BabylonJS is externalized (not bundled)
- Source maps enabled
- TypeScript declarations generated (`declaration: true`)
- Private properties (prefixed with `_`) are mangled in production builds

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build (minified) → `dist/CharacterController.js` |
| `npm run build-dev` | Development build (unminified) → `dist/CharacterController.max.js` |
| `npm run dev` | Start webpack-dev-server, opens `tst/test.html` |
| `npm test` | Run vitest property-based tests |
| `npm install` | Install dependencies (run once after clone) |

## Testing

- **Vitest** — test runner (configured in `vitest.config.ts`)
- **fast-check** — property-based testing library
- Tests in `tests/` folder, run with `npm test` or `npx vitest run`
- Tests extract pure logic into standalone functions (no BabylonJS scene instantiation needed)
- Manual testing via HTML test pages in `tst/` folder served by webpack-dev-server
