import { expect, test } from 'vitest';
import { longestGap, longestStreak } from '../src/streaks.js';

test('longest streak', () => expect(longestStreak(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-10'])).toBe(3));
test('longest gap', () => expect(longestGap(['2026-03-03', '2026-03-10', '2026-11-11'])).toBe(245));
test('streak ignores duplicates and order', () => expect(longestStreak(['2026-03-02', '2026-03-01', '2026-03-02'])).toBe(2));
test('empty input', () => {
  expect(longestStreak([])).toBe(0);
  expect(longestGap(['2026-01-01'])).toBe(0);
});
