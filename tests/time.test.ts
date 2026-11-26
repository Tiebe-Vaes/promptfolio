import { expect, test } from 'vitest';
import { localDate, localHour, localMonth } from '../src/time.js';

test('localDate crosses midnight in Europe/Brussels', () =>
  expect(localDate('2026-11-26T23:30:00Z', 'Europe/Brussels')).toBe('2026-11-27'));

test('localHour uses the time zone', () =>
  expect(localHour(Date.parse('2026-07-01T01:15:00Z'), 'Europe/Brussels')).toBe(3));

test('localMonth', () => expect(localMonth('2026-01-31T23:30:00Z', 'Europe/Brussels')).toBe('2026-02'));
