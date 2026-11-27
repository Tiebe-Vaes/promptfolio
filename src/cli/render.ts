import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { findBrowser, screenshot } from '../browser.js';
import { validateCopy } from '../copy.js';
import { buildCaptions } from '../render/captions.js';
import { CARD_FORMATS, cardDocument, type CardFormat } from '../render/cards.js';
import { CARD_IDS, type CardId } from '../render/model.js';
import { readmeCard } from '../render/readme.js';
import { SIZES } from '../render/shell.js';
import { buildStory } from '../render/story.js';
import { STYLE_IDS, type StyleId } from '../render/styles/style.js';
import type { Copy, Stats } from '../types.js';

type Format = CardFormat | 'readme';
const FORMATS: Format[] = [...CARD_FORMATS, 'readme'];
// Built file lives in <skill>/scripts/, fonts in <skill>/assets/.
const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

/** A comma list checked against the allowed values; null (after printing why) when one is unknown. */
function list<T extends string>(flag: string, value: string | undefined, allowed: readonly T[], fallback: T[]): T[] | null {
  if (value === undefined) return fallback;
  const picked = value.split(',').map(s => s.trim()).filter(Boolean);
  const bad = picked.filter(x => !allowed.includes(x as T));
  if (bad.length || picked.length === 0) {
    console.error(`Invalid --${flag}: ${value || '(empty)'} (use ${allowed.join(', ')})`);
    return null;
  }
  return [...new Set(picked)] as T[];
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    // No `default:` options: parseArgs only supports them from Node 18.11, and the scripts promise 18.3.
    options: { dir: { type: 'string' }, style: { type: 'string' }, cards: { type: 'string' }, formats: { type: 'string' }, 'no-png': { type: 'boolean' } },
  });
  if (!values.dir) { console.error('Missing --dir <folder with stats.json and copy.json>.'); return 1; }
  const dir = path.resolve(values.dir);
  const style = list<StyleId>('style', values.style, STYLE_IDS, ['clean']);
  const cards = list<CardId>('cards', values.cards, CARD_IDS, CARD_IDS);
  const formats = list<Format>('formats', values.formats, FORMATS, ['story']);
  if (!style || !cards || !formats) return 1;
  if (style.length !== 1) { console.error(`Invalid --style: pick one of ${STYLE_IDS.join(', ')}`); return 1; }

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
  const noPng = values['no-png'] === true;
  const browser = noPng || process.env.PROMPTFOLIO_BROWSER === 'none'
    ? null
    : findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync });
  if (!noPng && !browser) {
    console.log(process.env.PROMPTFOLIO_BROWSER === 'none'
      ? 'PROMPTFOLIO_BROWSER=none: PNGs skipped, story.html still works.'
      : 'No Chrome, Edge or Brave found: PNGs skipped, story.html still works.');
  }
  const shoot = async (htmlPath: string, png: string, width: number, height: number) => {
    if (!browser) return;
    try {
      await screenshot({ browser, htmlPath, outPng: png, width, height });
      written.push(png);
    } catch (err) {
      console.log(`Could not render ${path.basename(png)}: ${err instanceof Error ? err.message : err}`);
    }
  };

  for (const card of cards) {
    for (const format of formats) {
      if (format === 'readme') continue;
      const html = cardDocument(style[0], card, format, stats, copy, assetsDir, cards);
      if (!html) { if (format === formats.find(f => f !== 'readme')) console.log(`skipped ${card}: not enough data`); continue; }
      const htmlPath = path.join(cardsDir, `${style[0]}-${card}-${format}.html`);
      fs.writeFileSync(htmlPath, html);
      await shoot(htmlPath, htmlPath.replace(/\.html$/, '.png'), SIZES[format].w, SIZES[format].h);
    }
  }

  if (formats.includes('readme')) {
    const svg = readmeCard({ stats, copy, assetsDir });
    const svgPath = path.join(dir, 'readme-card.svg');
    fs.writeFileSync(svgPath, svg);
    written.push(svgPath);
    if (browser) {
      const wrap = path.join(cardsDir, 'readme-card.html');
      fs.writeFileSync(wrap, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:400px;overflow:hidden}</style></head><body>${svg}</body></html>`);
      await shoot(wrap, path.join(dir, 'readme-card.png'), 1200, 400);
    }
  }

  const captionsPath = path.join(dir, 'captions.json');
  fs.writeFileSync(captionsPath, JSON.stringify(buildCaptions(copy, stats), null, 2));
  // Earlier runs count too, other styles never do: the story links the PNGs of this style that exist on disk.
  const pngs = new Set(fs.readdirSync(cardsDir).filter(f => f.startsWith(`${style[0]}-`) && f.endsWith('-story.png')).map(f => `cards/${f}`));
  const storyPath = path.join(dir, 'story.html');
  fs.writeFileSync(storyPath, buildStory({ stats, copy, style: style[0], assetsDir, pngs }));
  for (const f of [storyPath, ...written, captionsPath]) console.log(f);
  return 0;
}

main().then(code => { process.exitCode = code; }, err => { console.error(err instanceof Error ? err.message : err); process.exitCode = 1; });
