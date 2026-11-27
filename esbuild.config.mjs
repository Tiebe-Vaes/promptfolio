import { build } from 'esbuild';

const names = ['stats', 'validate', 'doctor', 'render'];

await build({
  entryPoints: Object.fromEntries(names.map(n => [n, `src/cli/${n}.ts`])),
  outdir: 'plugins/promptfolio/skills/promptfolio/scripts',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  legalComments: 'none',
  logLevel: 'warning',
  banner: { js: '// Built from src/cli by esbuild. Do not edit; run `npm run build`.' },
});
