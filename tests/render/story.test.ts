import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { cardDocument } from '../../src/render/cards.js';
import { buildStory } from '../../src/render/story.js';
import type { Stats } from '../../src/types.js';
import { merge } from '../helpers.js';
import { emptyStats, fixtureStats, funCopy, proCopy } from './ctx.js';

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'promptfolio', 'skills', 'promptfolio', 'assets');
let stats: Stats;
let empty: Stats;
beforeAll(async () => {
  stats = await fixtureStats();
  empty = await emptyStats();
});

test('story shows every card in the chosen style', () => {
  const html = buildStory({ stats, copy: funCopy, style: 'receipt', assetsDir, pngs: new Set() });
  expect(html.match(/<section class="slide st-receipt /g)).toHaveLength(4);
  expect(html.match(/class="progress"/g)).toHaveLength(4);
});

test('story with one card', () => {
  const one = merge(empty, { tokens: { yearTotal: 5000 } });
  const html = buildStory({ stats: one, copy: proCopy, style: 'clean', assetsDir, pngs: new Set() });
  expect(html.match(/<section class="slide /g)).toHaveLength(1);
  expect(html.match(/<div class="progress"[^>]*>(?:<i[^>]*><\/i>){1}<\/div>/g)).toHaveLength(1);
});

test('story escapes copy', () => {
  const html = buildStory({ stats, copy: { ...funCopy, title: '<img src=x onerror=alert(1)>' }, style: 'card', assetsDir, pngs: new Set() });
  expect(html).not.toContain('<img src=x');
});

test('sparse stats render without holes', () => {
  const html = buildStory({ stats: empty, copy: funCopy, style: 'terminal', assetsDir, pngs: new Set() });
  expect(html).toMatch(/^<!doctype html>/);
  // Base64 font data can contain "NaN" by chance; check everything else.
  expect(html.replace(/url\(data:[^)]+\)/g, '')).not.toMatch(/NaN|undefined|\{[a-z][A-Za-z0-9_.]*\}/);
});

test("save link points at the style's PNG", () => {
  const html = buildStory({ stats, copy: funCopy, style: 'card', assetsDir, palette: 'grape', pngs: new Set(['cards/card-grape-year-story.png']) });
  expect(html).toContain('href="cards/card-grape-year-story.png"');
  expect(html).not.toContain('href="cards/card-grape-tokens-story.png"');
  expect(html).toContain('Screenshot this slide to share it');
});

test('story has no network URLs', () => {
  const html = buildStory({ stats, copy: funCopy, style: 'clean', assetsDir, pngs: new Set() });
  expect(html).not.toMatch(/https?:\/\//);
});

test('story is phone-safe before its script runs', () => {
  const html = buildStory({ stats, copy: funCopy, style: 'clean', assetsDir, pngs: new Set() });
  expect(html).toMatch(/:root\s*\{\s*--k:\s*0\.3\d*;/);
  expect(html).toMatch(/overflow-x:\s*hidden/);
});

test('card document has the exact size and the picked position', () => {
  const html = cardDocument('card', 'toolkit', 'wide', stats, funCopy, assetsDir, ['tokens', 'toolkit'])!;
  expect(html).toContain('width: 1200px; height: 675px');
  expect(html).toContain('2/2');
  expect(cardDocument('clean', 'growth', 'square', empty, funCopy, assetsDir)).toBeNull();
});
