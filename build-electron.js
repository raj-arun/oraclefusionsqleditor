const { build } = require('esbuild');
const path = require('path');

// Build main process
build({
  entryPoints: ['electron/main.ts', 'electron/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist-electron',
  external: ['electron', 'electron-store'],
  format: 'cjs',
  sourcemap: true,
}).catch(() => process.exit(1));
