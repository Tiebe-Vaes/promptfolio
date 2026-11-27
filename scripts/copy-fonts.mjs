// Copies the latin woff2 files Promptfolio uses, plus each font's OFL licence, from @fontsource
// into the plugin, so the shipped scripts can embed them without any network access.
import fs from 'node:fs';
import path from 'node:path';

const out = 'plugins/promptfolio/skills/promptfolio/assets/fonts';
const fonts = [
  { pkg: '@fontsource-variable/archivo', files: ['archivo-latin-wdth-normal.woff2'], licence: 'Archivo-OFL.txt' },
  { pkg: '@fontsource/ibm-plex-mono', files: ['ibm-plex-mono-latin-400-normal.woff2', 'ibm-plex-mono-latin-600-normal.woff2'], licence: 'IBMPlexMono-OFL.txt' },
  { pkg: '@fontsource/big-shoulders-display', files: ['big-shoulders-display-latin-900-normal.woff2'], licence: 'BigShouldersDisplay-OFL.txt' },
  { pkg: '@fontsource/libre-franklin', files: ['libre-franklin-latin-400-normal.woff2', 'libre-franklin-latin-600-normal.woff2', 'libre-franklin-latin-900-normal.woff2'], licence: 'LibreFranklin-OFL.txt' },
];

fs.mkdirSync(out, { recursive: true });
for (const f of fonts) {
  const dir = path.join('node_modules', f.pkg);
  for (const file of f.files) fs.copyFileSync(path.join(dir, 'files', file), path.join(out, file));
  fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(out, f.licence));
}
console.log(`fonts copied to ${out}`);
