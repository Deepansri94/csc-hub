// Cross-platform server bundler for Electron production build
import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'server.js',
  external: ['@whiskeysockets/baileys', 'pino', 'express'],
  logLevel: 'info',
});

console.log('✅ server.ts bundled to server.js');
