import { beforeAll, expect, test } from 'vitest';
import { buildStats, pickLongestSessionMinutes } from '../src/buildStats.js';
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
  expect(s.coverage).toEqual({ yearFrom: '2026-03-01', statsCacheThrough: '2026-11-11', detailedFrom: '2026-11-20', detailedTo: '2026-11-23', historyFrom: '2026-03-02' });
  expect(s.activity.activeDays).toBe(5 + 3);
  expect(s.activity.messages).toBe(20 + 30 + 5 + 40 + 15 + 5 + 2 + 1);
  expect(s.activity.sessions).toBe(8 - 1 + 2);
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
  expect(s.tooling).toEqual({ skills: 1, agents: 1, hooks: 2, plugins: 1, total: 4 });
  expect(s.retention).toEqual({ cleanupPeriodDays: null, effectiveDays: 30 });
});

test('a year value only when the year-wide cache value is trustworthy', () => {
  expect(pickLongestSessionMinutes(82317, 95)).toBeNull();
  expect(pickLongestSessionMinutes(120, 30)).toBe(120);
  expect(pickLongestSessionMinutes(120, 300)).toBe(300);
  expect(pickLongestSessionMinutes(null, 40)).toBeNull();
});

test('tooling total backs the buildsTooling strength', () => {
  expect(s.tooling.total).toBe(1 + 1 + 2);
  expect(s.strengthCandidates.find(c => c.id === 'buildsTooling')!.placeholder).toBe('tooling.total');
});

test('stats-cache without lastComputedDate keeps its days', async () => {
  const { mkdtemp, writeFile } = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pf-b-'));
  await writeFile(path.join(dir, 'stats-cache.json'), JSON.stringify({ dailyActivity: [
    { date: '2026-02-01', messageCount: 3, sessionCount: 1, toolCallCount: 1 },
    { date: '2026-02-05', messageCount: 4, sessionCount: 1, toolCallCount: 2 },
  ] }));
  const b = await buildStats({ claudeDir: dir, year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
  expect(b.activity.activeDays).toBe(2);
  expect(b.activity.messages).toBe(7);
});
