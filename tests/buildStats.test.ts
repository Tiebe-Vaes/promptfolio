import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../src/buildStats.js';
import type { Stats } from '../src/types.js';
import { fixture, fixturePath } from './helpers.js';

let s: Stats;
beforeAll(async () => {
  s = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27T12:00:00Z') });
});

test('buildStats on empty claude dir', async () => {
  const e = await buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
  expect(e.activity.sessions).toBe(0);
  expect(e.coverage).toEqual({ yearFrom: null, statsCacheThrough: null, detailedFrom: null, detailedTo: null, historyFrom: null });
  expect(e.retention.effectiveDays).toBe(30);
  expect(e.activity.busiestDay).toBeNull();
  expect(e.modes.planShare).toBe(0);
});

test('stats-cache before cutoff, transcripts after', () => {
  expect(s.coverage).toEqual({ yearFrom: '2026-03-01', statsCacheThrough: '2026-11-11', detailedFrom: '2026-11-20', detailedTo: '2026-11-21', historyFrom: '2026-03-02' });
  expect(s.activity.activeDays).toBe(5 + 2);
  expect(s.activity.messages).toBe(20 + 30 + 5 + 40 + 15 + 5 + 2);
  expect(s.activity.longestStreakDays).toBe(3);
  expect(s.activity.busiestDay).toEqual({ date: '2026-03-10', messages: 40 });
  expect(s.activity.busiestMonth).toEqual({ month: '2026-03', messages: 95 });
  expect(s.activity.byMonth.map(m => m.month)).toEqual(['2026-03', '2026-11']);
});

test('year token total does not double count the overlap', () => {
  expect(s.tokens.yearTotal).toBe(1500 + 2000 + 1215 + 58);
  expect(s.tokens.byModel['claude-opus-5-5']).toBe(500 + 2000 + 1215);
});

test('languages, modes and files', () => {
  expect(s.files.byLanguage.map(l => l.language).sort()).toEqual(['Python', 'TypeScript']);
  expect(s.modes.planShare).toBeCloseTo(1 / 3);
  expect(s.denials.topDeniedTool).toBe('Bash');
  expect(s.tools.top[0]).toEqual({ name: 'Bash', count: 2 });
  expect(s.activity.lateNightSessionShare).toBeCloseTo(1 / 3);
});

test('projects labelled by folder name, sorted by sessions', () => {
  expect(s.projects.list.map(p => p.label)).toEqual(['alpha', 'beta']);
  expect(s.projects.branchCount).toBe(2);
});

test('longest session of the year from stats-cache', () => expect(s.sessions.longestMinutesYear).toBe(120));

test('tooling and retention', () => {
  expect(s.tooling).toEqual({ skills: 1, agents: 1, hooks: 2, plugins: 1 });
  expect(s.retention).toEqual({ cleanupPeriodDays: null, effectiveDays: 30 });
});
