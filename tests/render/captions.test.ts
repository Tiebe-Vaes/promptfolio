import { beforeAll, expect, test } from 'vitest';
import { REPO_URL } from '../../src/render/brand.js';
import { buildCaptions } from '../../src/render/captions.js';
import type { Stats } from '../../src/types.js';
import { fixtureStats, proCopy } from './ctx.js';

let stats: Stats;
beforeAll(async () => { stats = await fixtureStats(); });

test('captions end with the repo url', () => {
  const c = buildCaptions(proCopy, stats);
  expect(Object.keys(c)).toEqual(['instagram', 'linkedin', 'x', 'discord']);
  for (const v of Object.values(c)) expect(v.text.endsWith(`\n\n${REPO_URL}`)).toBe(true);
});

test('captions fill placeholders', () => {
  const c = buildCaptions({ ...proCopy, captions: { ...proCopy.captions, linkedin: '{tools.commits} commits' } }, stats);
  expect(c.linkedin.text).toMatch(new RegExp(`^${stats.tools.commits} commits`));
});

test('x intent url round-trips the caption', () => {
  const c = buildCaptions({ ...proCopy, captions: { ...proCopy.captions, x: 'Ship "it" & café' } }, stats);
  const url = new URL(c.x.intentUrl!);
  expect(`${url.origin}${url.pathname}`).toBe('https://x.com/intent/tweet');
  expect(url.searchParams.get('text')).toBe(c.x.text);
  expect(c.instagram.intentUrl).toBeUndefined();
});
