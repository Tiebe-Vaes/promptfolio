import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { shareCards, storySlides } from '../../src/render/cards.js';
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

test('slide order per vibe', () => {
  expect(storySlides('professional')).toEqual(['tokens', 'terminal', 'receipt', 'growth']);
  expect(storySlides('fun')).toEqual(['tokens', 'receipt', 'terminal', 'card']);
  expect(storySlides('roast')).toEqual(['tokens', 'receipt', 'terminal', 'card']);
});

test('story renders every available slide with a progress bar', () => {
  const html = buildStory({ stats, copy: funCopy, assetsDir, pngs: new Set() });
  expect(html.match(/<section class="slide /g)).toHaveLength(4);
  expect(html.match(/class="progress"/g)).toHaveLength(4);
});

test('progress counts rendered slides', () => {
  const html = buildStory({ stats, copy: proCopy, assetsDir, pngs: new Set() }); // growth factor 1: no closer
  expect(html.match(/<section class="slide /g)).toHaveLength(3);
  expect(html.match(/<div class="progress"[^>]*>(?:<i[^>]*><\/i>){3}<\/div>/g)).toHaveLength(3);
});

test('story escapes copy', () => {
  const html = buildStory({ stats, copy: { ...funCopy, verdict: '<img src=x onerror=alert(1)>' }, assetsDir, pngs: new Set() });
  expect(html).not.toContain('<img src=x');
});

test('sparse stats render without holes', () => {
  const html = buildStory({ stats: empty, copy: funCopy, assetsDir, pngs: new Set() });
  expect(html).toMatch(/^<!doctype html>/);
  // Base64 font data can contain "NaN" by chance; check everything else.
  expect(html.replace(/url\(data:[^)]+\)/g, '')).not.toMatch(/NaN|undefined|\{[a-z][A-Za-z0-9_.]*\}/);
});

test('save links only for rendered PNGs', () => {
  const html = buildStory({ stats, copy: funCopy, assetsDir, pngs: new Set(['cards/card-story.png']) });
  expect(html).toContain('href="cards/card-story.png"');
  expect(html).not.toContain('href="cards/tokens-story.png"');
  expect(html).toContain('Screenshot this slide to share it');
});

test('story has no network URLs', () => {
  const html = buildStory({ stats: merge(stats, {}), copy: funCopy, assetsDir, pngs: new Set() });
  expect(html).not.toMatch(/https?:\/\//);
});

test('shareCards per target', () => {
  expect(shareCards('fun', ['instagram'])).toEqual([
    { slide: 'tokens', size: 'story' }, { slide: 'receipt', size: 'story' }, { slide: 'terminal', size: 'story' },
    { slide: 'card', size: 'story' }, { slide: 'receipt', size: 'feed' },
  ]);
  expect(shareCards('professional', ['linkedin'])).toEqual([
    { slide: 'growth', size: 'feed' }, { slide: 'growth', size: 'landscape' }, { slide: 'receipt', size: 'feed' },
  ]);
  expect(shareCards('roast', ['x', 'discord'])).toEqual([{ slide: 'card', size: 'landscape' }, { slide: 'receipt', size: 'feed' }]);
  expect(shareCards('fun', [])).toEqual([{ slide: 'receipt', size: 'feed' }]);
});
