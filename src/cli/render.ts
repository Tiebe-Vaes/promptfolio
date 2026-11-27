import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { findBrowser, screenshot } from '../browser.js';
import { validateCopy } from '../copy.js';
import { cardDocument, shareCards, type Target } from '../render/cards.js';
import { readmeCard } from '../render/readme.js';
import { SIZES } from '../render/shell.js';
import { buildStory } from '../render/story.js';
import type { Copy, Stats } from '../types.js';

const TARGETS: Target[] = ['instagram', 'linkedin', 'x', 'discord'];
// Built file lives in <skill>/scripts/, fonts in <skill>/assets/.
const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

async function main(): Promise<number> {
  const { values } = parseArgs({
    // No `default:` options: parseArgs only supports them from Node 18.11, and the scripts promise 18.3.
    options: { dir: { type: 'string' }, targets: { type: 'string' }, 'no-png': { type: 'boolean' } },
  });
  if (!values.dir) { console.error('Missing --dir <folder with stats.json and copy.json>.'); return 1; }
  const dir = path.resolve(values.dir);
  const targets = (values.targets ?? '').split(',').map(s => s.trim()).filter(Boolean) as Target[];
  const unknown = targets.filter(x => !TARGETS.includes(x));
  if (unknown.length) { console.error(`Unknown --targets: ${unknown.join(', ')} (use ${TARGETS.join(', ')})`); return 1; }

  let stats: Stats;
  let copy: Copy;
  try {
    stats = JSON.parse(fs.readFileSync(path.join(dir, 'stats.json'), 'utf8'));
    copy = JSON.parse(fs.readFileSync(path.join(dir, 'copy.json'), 'utf8'));
  } catch (err) {
    console.error(`Could not read stats.json and copy.json in ${dir}: ${err instanceof Error ? err.message : err}`);
    return 1;
  }
  const check = validateCopy(copy, stats);
  if (!check.ok) { for (const e of check.errors) console.log(e); return 1; }

  const cardsDir = path.join(dir, 'cards');
  fs.mkdirSync(cardsDir, { recursive: true });
  const written: string[] = [];
  const pngs = new Set<string>();

  const noPng = values['no-png'] === true;
  const browser = noPng || process.env.PROMPTFOLIO_BROWSER === 'none'
    ? null
    : findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync });
  if (!browser && !noPng) console.log('No Chrome, Edge or Brave found: PNGs skipped, story.html still works.');

  for (const { slide, size } of shareCards(copy.vibe, targets)) {
    const html = cardDocument(slide, size, stats, copy, assetsDir);
    if (!html) continue;
    const htmlPath = path.join(cardsDir, `${slide}-${size}.html`);
    fs.writeFileSync(htmlPath, html);
    if (browser) {
      const png = htmlPath.replace(/\.html$/, '.png');
      try {
        await screenshot({ browser, htmlPath, outPng: png, width: SIZES[size].w, height: SIZES[size].h });
        pngs.add(`cards/${slide}-${size}.png`);
        written.push(png);
      } catch (err) {
        console.log(`Could not render ${path.basename(png)}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  const svg = readmeCard({ stats, copy, assetsDir });
  const svgPath = path.join(dir, 'readme-card.svg');
  fs.writeFileSync(svgPath, svg);
  written.push(svgPath);
  if (browser) {
    const wrap = path.join(cardsDir, 'readme-card.html');
    fs.writeFileSync(wrap, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:400px;overflow:hidden}</style></head><body>${svg}</body></html>`);
    const png = path.join(dir, 'readme-card.png');
    try {
      await screenshot({ browser, htmlPath: wrap, outPng: png, width: 1200, height: 400 });
      written.push(png);
    } catch (err) {
      console.log(`Could not render readme-card.png: ${err instanceof Error ? err.message : err}`);
    }
  }

  const storyPath = path.join(dir, 'story.html');
  fs.writeFileSync(storyPath, buildStory({ stats, copy, assetsDir, pngs }));
  written.unshift(storyPath);
  for (const f of written) console.log(f);
  return 0;
}

main().then(code => { process.exitCode = code; }, err => { console.error(err instanceof Error ? err.message : err); process.exitCode = 1; });
