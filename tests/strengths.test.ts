import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../src/buildStats.js';
import { strengthCandidates } from '../src/strengths.js';
import type { Stats } from '../src/types.js';
import { fixture, fixturePath, merge } from './helpers.js';

let base: Stats;
beforeAll(async () => {
  base = await buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
});

test('candidates sorted by score, zeros dropped', () => {
  const c = strengthCandidates(merge(base, { tools: { testRuns: 40, commits: 0 }, activity: { longestStreakDays: 7 } }));
  expect(c.map(x => x.id)).toEqual(['tests', 'consistency']);
  expect(c[0]).toEqual({ id: 'tests', value: 40, placeholder: 'tools.testRuns', score: 2 });
});

test('buildsTooling sums skills, agents and hooks', () => {
  const c = strengthCandidates(merge(base, { tooling: { skills: 3, agents: 1, hooks: 6, plugins: 9, total: 10 } }));
  expect(c).toEqual([{ id: 'buildsTooling', value: 10, placeholder: 'tooling.total', score: 2 }]);
});

test('range counts languages', () => {
  const c = strengthCandidates(merge(base, { files: { byLanguage: [{ language: 'Go', count: 1 }, { language: 'SQL', count: 1 }, { language: 'CSS', count: 1 }] } }));
  expect(c[0]).toMatchObject({ id: 'range', value: 3, placeholder: 'files.byLanguage.length', score: 1 });
});

test('empty stats give no candidates', () => expect(strengthCandidates(base)).toEqual([]));

test('buildStats fills candidates and equivalents', async () => {
  const s = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27') });
  expect(s.strengthCandidates.map(c => c.id)).toContain('tests');
  expect(s.equivalents.length).toBeGreaterThan(0);
});
