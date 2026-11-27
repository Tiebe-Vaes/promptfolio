import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { readmeCard } from '../../src/render/readme.js';
import type { Stats } from '../../src/types.js';
import { emptyStats, fixtureStats, funCopy } from './ctx.js';

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'promptfolio', 'skills', 'promptfolio', 'assets');
let stats: Stats;
beforeAll(async () => { stats = await fixtureStats(); });

test('readme svg is self-contained', () => {
  const svg = readmeCard({ stats, copy: funCopy, assetsDir });
  expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1200" height="400"/);
  expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/https?:/);
  expect(svg).toContain('data:font/woff2;base64,');
  expect(svg).toContain('Promptfolio');
  expect(svg).toContain('prefers-reduced-motion');
});

test('readme svg shows real numbers', () => {
  const svg = readmeCard({ stats, copy: funCopy, assetsDir });
  expect(svg).toContain('4.8K');
  expect(svg).toContain('Python');
});

test('readme svg escapes text and survives empty stats', async () => {
  const svg = readmeCard({ stats: await emptyStats(), copy: funCopy, assetsDir });
  expect(svg).toMatch(/<\/svg>\s*$/);
  expect(svg.replace(/url\(data:[^)]+\)/g, '')).not.toMatch(/NaN|undefined/);
});

test('readme svg embeds only the font it uses', () => {
  const svg = readmeCard({ stats, copy: funCopy, assetsDir });
  expect(svg).not.toContain('IBM Plex Mono');
  expect(svg.length).toBeLessThan(150_000);
});
