import { cp } from 'node:fs/promises';
// Next standalone does not copy static/public assets automatically.
// These fixed, build-local destinations never touch the source Nuxt assets.
await cp('public', '.next/standalone/public', { recursive: true });
await cp('.next/static', '.next/standalone/.next/static', { recursive: true });
console.log('Standalone public/static assets prepared.');
