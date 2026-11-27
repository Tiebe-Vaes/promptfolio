import { expect, test } from 'vitest';
import { readStatsCache } from '../src/sources/statsCache.js';
import { fixture } from './helpers.js';

test('reads stats-cache', async () => {
  const d = await readStatsCache(fixture('stats-cache.json'));
  expect(d.through).toBe('2026-11-11');
  expect(d.daily).toHaveLength(6);
  expect(d.daily[1]).toEqual({ date: '2026-03-01', messages: 20, sessions: 1, toolCalls: 8 });
  expect(d.dailyTokens).toHaveLength(2);
  expect(d.firstSessionDate).toBe('2025-12-30T10:00:00.000Z');
  expect(d.longestSession).toEqual({ durationMs: 7200000, messages: 120, timestamp: '2026-03-10T10:00:00.000Z' });
});

test('missing stats-cache', async () => {
  const d = await readStatsCache(fixture('nope.json'));
  expect(d).toEqual({ through: null, daily: [], dailyTokens: [], firstSessionDate: null, longestSession: null, modelUsage: {} });
});

test('missing lastComputedDate falls back to the latest cached day', async () => {
  const { mkdtemp, writeFile } = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pf-c-'));
  const f = path.join(dir, 'stats-cache.json');
  await writeFile(f, JSON.stringify({ dailyActivity: [
    { date: '2026-02-01', messageCount: 3, sessionCount: 1, toolCallCount: 1 },
    { date: '2026-02-05', messageCount: 4, sessionCount: 1, toolCallCount: 2 },
  ] }));
  expect((await readStatsCache(f)).through).toBe('2026-02-05');
});
