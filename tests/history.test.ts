import { expect, test } from 'vitest';
import { readHistory } from '../src/sources/history.js';
import { fixture } from './helpers.js';

test('history aggregates the year in local time', async () => {
  const h = await readHistory(fixture('history.jsonl'), { year: 2026, tz: 'Europe/Brussels' });
  expect(h.prompts).toBe(4);
  expect(h.slashCommands).toBe(1);
  expect(h.politeness).toBe(1);
  expect(h.corrections).toBeGreaterThanOrEqual(2);
  expect(h.languages.nl).toBe(1);
  expect(h.from).toBe('2026-03-02');
  expect(h.sessions).toBe(3);
  expect(h.projects['C:\\dev\\alpha']).toBe(3);
  expect(h.byMonth.map(m => m.month)).toEqual(['2026-03', '2026-07', '2026-11']);
  expect(h.byMonth.every((m, i, a) => i === 0 || a[i - 1].month < m.month)).toBe(true);
});

test('late-night uses local hour', async () => {
  const h = await readHistory(fixture('history.jsonl'), { year: 2026, tz: 'Europe/Brussels' });
  expect(h.hourCounts).toHaveLength(24);
  expect(h.hourCounts[2]).toBe(1);
  expect(h.lateNightSessions).toBe(1);
  const utc = await readHistory(fixture('history.jsonl'), { year: 2026, tz: 'UTC' });
  expect(utc.hourCounts[0]).toBe(1);
});

test('prompt text never stored', async () => {
  const h = await readHistory(fixture('history.jsonl'), { year: 2026, tz: 'UTC' });
  expect(JSON.stringify(h)).not.toMatch(/sk-ant|login bug/);
});

test('missing history', async () => {
  const h = await readHistory(fixture('nope'), { year: 2026, tz: 'UTC' });
  expect(h.prompts).toBe(0);
  expect(h.from).toBeNull();
});
