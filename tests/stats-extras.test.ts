import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../src/buildStats.js';
import { growth } from '../src/stats/extras.js';
import type { Stats } from '../src/types.js';
import { fixture } from './helpers.js';

let s: Stats;
beforeAll(async () => {
  s = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27T12:00:00Z') });
});

/** Copy of the fixture with a patched stats-cache.json. */
function patchedHome(patch: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-x-'));
  fs.cpSync(fixture(), dir, { recursive: true });
  const f = path.join(dir, 'stats-cache.json');
  fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, 'utf8')), ...patch }));
  return dir;
}

test('dailySeries merges cache and transcripts at the cutoff', () => {
  expect(s.activity.daily.map(d => d.date)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-10', '2026-11-11', '2026-11-20', '2026-11-21', '2026-11-23']);
  expect(s.activity.daily[0]).toEqual({ date: '2026-03-01', messages: 20 });
});

test('growth picks first and peak month', () => {
  expect(s.activity.growth).toEqual({ first: { month: '2026-03', messages: 95 }, peak: { month: '2026-03', messages: 95 }, factor: 1 });
  expect(growth([{ month: '2026-03', messages: 95 }, { month: '2026-11', messages: 950 }]))
    .toEqual({ first: { month: '2026-03', messages: 95 }, peak: { month: '2026-11', messages: 950 }, factor: 10 });
});

test('growth null with one month', () => expect(growth([{ month: '2026-03', messages: 5 }])).toBeNull());

test('yearOutput uses transcripts only when the cache history started before the year', () => {
  expect(s.tokens.yearOutput).toBe(200);
  expect(s.tokens.readPerWritten).toBe(Math.round((1500 + 2000 + 1215 + 58) / 200));
});

test('yearOutput uses modelUsage when first session is this year', async () => {
  const b = await buildStats({ claudeDir: patchedHome({ firstSessionDate: '2026-02-01T10:00:00Z' }), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27') });
  expect(b.tokens.yearOutput).toBe(500 + 200);
});

test('topLanguage is the most edited', () => expect(s.files.topLanguage).toBe('Python'));

test('apiValue covers the year usage', () => {
  expect(s.apiValue).not.toBeNull();
  expect(s.apiValue!.models.sort()).toEqual(['claude-opus-5-5', 'claude-sonnet-5']);
  expect(s.apiValue!.usd).toBeGreaterThan(0);
});

test('empty home has no extras', async () => {
  const { fixturePath } = await import('./helpers.js');
  const e = await buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
  expect(e.activity.daily).toEqual([]);
  expect(e.activity.growth).toBeNull();
  expect(e.tokens.yearOutput).toBeNull();
  expect(e.tokens.readPerWritten).toBeNull();
  expect(e.apiValue).toBeNull();
  expect(e.files.topLanguage).toBeNull();
});
