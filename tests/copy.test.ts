import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../src/buildStats.js';
import { COPY_LIMITS, fillPlaceholders, validateCopy } from '../src/copy.js';
import type { Copy, Stats } from '../src/types.js';
import { fixture, merge } from './helpers.js';

let stats: Stats;
beforeAll(async () => {
  stats = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27') });
});

const proCopy: Copy = {
  schemaVersion: 1, vibe: 'professional', language: 'en',
  profile: {
    headline: '{activity.activeDays} active days with Claude Code',
    strengths: [
      { id: 'buildsTooling', text: 'Builds own tooling: {tooling.skills} custom skills' },
      { id: 'plansFirst', text: 'Plans first: {modes.planShare} of turns in plan mode' },
      { id: 'range', text: 'Range: {files.byLanguage.length} languages' },
    ],
  },
  tokensLine: 'Claude reread your code {tokens.readPerWritten} times per token it wrote.',
  verdict: 'You trust tests more than vibes.',
  growthLine: 'Busiest in {activity.growth.peak.month}',
  captions: { year: 'Your year in prompts' },
};

const funCopy: Copy = {
  schemaVersion: 1, vibe: 'fun', language: 'en',
  persona: {
    className: 'Shell Warlock', specialMove: 'git commit at dawn', weakness: 'Saying sorry to a robot', nemesis: 'api_error',
    moves: [
      { name: 'Bash Barrage', value: '{tools.bash}', text: 'Hits the shell until it compiles.' },
      { name: 'Watch It Fail', value: '{tools.testRuns}', text: 'Runs the tests before trusting anything.' },
      { name: 'Ship at Dawn', value: '{tools.commits}', text: 'Commits, mostly before lunch.' },
    ],
  },
  tokensLine: 'Claude reread your code {tokens.readPerWritten} times per token it wrote.',
  verdict: 'You trust tests more than vibes.',
  receiptFooter: 'No refunds on tokens.',
  diary: ['He asked for a plan. Then he asked again.', 'We ran the tests. They ran back.', 'Another compaction. I forgot everything.'],
  awards: [
    { title: 'Most Polite', text: '{prompts.politeness} times please or thanks' },
    { title: 'Night Owl', text: 'Late nights were a thing' },
    { title: 'Ship It', text: '{tools.commits} commits' },
  ],
  relationship: { status: "It's complicated", text: 'Ghosted for {activity.longestGapDays} days, then came back.' },
  captions: {},
};

const withPath = (copy: Copy, path: string, value: unknown): Copy => {
  const c: any = structuredClone(copy);
  const keys = path.split('.');
  let o = c;
  for (const k of keys.slice(0, -1)) o = o[k];
  o[keys.at(-1)!] = value;
  return c;
};

test('valid professional copy passes', () => expect(validateCopy(proCopy, stats)).toEqual({ ok: true, errors: [] }));
test('valid fun copy passes', () => expect(validateCopy(funCopy, stats)).toEqual({ ok: true, errors: [] }));

test('raw digits rejected', () => {
  const r = validateCopy(withPath(proCopy, 'profile.headline', 'You ran 212 tests'), stats);
  expect(r.ok).toBe(false);
  expect(r.errors[0]).toMatch(/profile\.headline.*digit/);
});

test('unknown placeholder rejected', () => {
  const r = validateCopy(withPath(proCopy, 'profile.headline', '{tools.nope} tests'), stats);
  expect(r.errors[0]).toMatch(/profile\.headline.*tools\.nope/);
});

test('placeholder to an object rejected', () =>
  expect(validateCopy(withPath(proCopy, 'profile.headline', '{activity}'), stats).ok).toBe(false));

test('too long after filling rejected', () => {
  const r = validateCopy(withPath(funCopy, 'persona.className', 'x'.repeat(COPY_LIMITS.className + 1)), stats);
  expect(r.errors[0]).toMatch(/persona\.className.*long/);
});

test('strength id must be a candidate', () => {
  const noShips = merge(stats, { strengthCandidates: stats.strengthCandidates.filter(c => c.id !== 'ships') });
  const copy = withPath(proCopy, 'profile.strengths.0.id', 'ships');
  expect(validateCopy(copy, stats).ok).toBe(true);
  expect(validateCopy(copy, noShips).ok).toBe(false);
});

test('professional needs exactly 3 distinct strengths', () => {
  expect(validateCopy(withPath(proCopy, 'profile.strengths', proCopy.profile!.strengths.slice(0, 2)), stats).ok).toBe(false);
  const dup = withPath(proCopy, 'profile.strengths.1.id', 'buildsTooling');
  expect(validateCopy(dup, stats).ok).toBe(false);
});

test('fun needs 3-5 diary entries and 3-4 awards', () => {
  expect(validateCopy(withPath(funCopy, 'diary', ['a']), stats).ok).toBe(false);
  expect(validateCopy(withPath(funCopy, 'awards', funCopy.awards!.slice(0, 2)), stats).ok).toBe(false);
  expect(validateCopy(withPath(funCopy, 'relationship', undefined), stats).ok).toBe(false);
});

test('secrets rejected', () =>
  expect(validateCopy(withPath(funCopy, 'diary.0', 'key sk-ant-api03-FAKEFAKEFAKEFAKEFAKE'), stats).ok).toBe(false));

test('non-object input rejected without throwing', () => {
  expect(validateCopy(null, stats).ok).toBe(false);
  expect(validateCopy({ vibe: 'party' }, stats).ok).toBe(false);
});

test('fillPlaceholders formats per language', () => {
  expect(fillPlaceholders('{tools.testRuns} tests', merge(stats, { tools: { testRuns: 1234 } }), 'nl')).toBe('1.234 tests');
  expect(fillPlaceholders('{tools.testRuns} tests', merge(stats, { tools: { testRuns: 1234 } }), 'en')).toBe('1,234 tests');
  expect(fillPlaceholders('{modes.planShare}', merge(stats, { modes: { planShare: 0.38 } }), 'en')).toBe('38%');
  expect(fillPlaceholders('{files.byLanguage.length} languages', stats, 'en')).toBe('2 languages');
});

test('move value must be exactly one placeholder', () => {
  const bad = withPath(funCopy, 'persona.moves.0.value', 'about {tools.bash}');
  expect(validateCopy(bad, stats).errors.join()).toMatch(/persona.moves.0.value/);
  expect(validateCopy(withPath(funCopy, 'persona.moves.0.value', '{tooling}'), stats).ok).toBe(false);
});

test('fun needs 3 moves, a receipt footer, a verdict and a tokens line', () => {
  expect(validateCopy(withPath(funCopy, 'persona.moves', funCopy.persona!.moves!.slice(0, 2)), stats).ok).toBe(false);
  expect(validateCopy(withPath(funCopy, 'receiptFooter', undefined), stats).ok).toBe(false);
  expect(validateCopy(withPath(funCopy, 'verdict', undefined), stats).ok).toBe(false);
  expect(validateCopy(withPath(funCopy, 'tokensLine', undefined), stats).ok).toBe(false);
});

test('professional needs growthLine when growth exists', () => {
  const grown = merge(stats, { activity: { growth: { first: { month: '2026-03', messages: 10 }, peak: { month: '2026-11', messages: 100 }, factor: 10 } } });
  expect(validateCopy(withPath(proCopy, 'growthLine', undefined), grown).ok).toBe(false);
  expect(validateCopy(withPath(proCopy, 'growthLine', undefined), stats).ok).toBe(true); // factor 1: no growth slide
  const noGrowth = merge(stats, { activity: { growth: null } });
  expect(validateCopy(withPath(proCopy, 'growthLine', undefined), noGrowth).ok).toBe(true);
});

test('month placeholder renders as a name', () => {
  expect(fillPlaceholders('{activity.growth.peak.month}', stats, 'en')).toBe('March');
  expect(fillPlaceholders('{activity.growth.peak.month}', stats, 'nl')).toBe('maart');
});

test('limits match card widths', () => {
  expect(COPY_LIMITS.className).toBe(22);
  expect(COPY_LIMITS.moveName).toBe(22);
  expect(COPY_LIMITS.growthLine).toBe(40);
});

test('light users need only as many strengths as they have candidates', () => {
  const one = merge(stats, { strengthCandidates: [{ id: 'consistency', value: 2, placeholder: 'activity.longestStreakDays', score: 0.3 }] });
  const copy = withPath(proCopy, 'profile.strengths', [{ id: 'consistency', text: 'Streak of {activity.longestStreakDays} days' }]);
  expect(validateCopy(copy, one)).toEqual({ ok: true, errors: [] });
  expect(validateCopy(withPath(proCopy, 'profile.strengths', []), one).ok).toBe(false);
});

test('a card move must not be zero', () => {
  const zero = merge(stats, { tools: { commits: 0 } });
  expect(validateCopy(withPath(funCopy, 'persona.moves.2.value', '{tools.commits}'), zero).errors.join()).toMatch(/persona.moves.2.value/);
});
