import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../src/buildStats.js';
import { COPY_LIMITS, fillPlaceholders, validateCopy } from '../src/copy.js';
import type { Copy, Stats } from '../src/types.js';
import { fixture, fixturePath, merge } from './helpers.js';

let stats: Stats;
let empty: Stats;
beforeAll(async () => {
  stats = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27') });
  empty = await buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
});

const copy: Copy = {
  schemaVersion: 2, vibe: 'professional', language: 'en',
  title: 'Python builder',
  lines: {
    tokens: '{tokens.yearTotal} tokens went through Claude this year.',
    year: 'Shipped {tools.commits} commits.',
    toolkit: 'Works across {files.byLanguage.length} languages.',
    growth: '{activity.growth.factor} times busier by {activity.growth.peak.month}.',
  },
  captions: {
    instagram: 'My year with Claude Code.',
    linkedin: '{tools.commits} commits with Claude Code this year.',
    x: 'My Claude Code year.',
    discord: 'Year recap.',
  },
};

const withPath = (c: Copy, path: string, value: unknown): Copy => {
  const out: any = structuredClone(c);
  const keys = path.split('.');
  let o = out;
  for (const k of keys.slice(0, -1)) o = o[k];
  o[keys.at(-1)!] = value;
  return out;
};

test('v2 copy validates', () => expect(validateCopy(copy, stats)).toEqual({ ok: true, errors: [] }));

test('fun and roast use the same shape', () => {
  expect(validateCopy({ ...copy, vibe: 'fun' }, stats).ok).toBe(true);
  expect(validateCopy({ ...copy, vibe: 'roast' }, stats).ok).toBe(true);
});

test('schemaVersion must be 2', () =>
  expect(validateCopy({ ...copy, schemaVersion: 1 } as any, stats).errors).toContain('schemaVersion: must be 2'));

test('every vibe needs title, four lines and four captions', () => {
  for (const p of ['title', 'lines.tokens', 'lines.year', 'lines.toolkit', 'captions.instagram', 'captions.linkedin', 'captions.x', 'captions.discord']) {
    expect(validateCopy(withPath(copy, p, undefined), stats).errors.join(), p).toMatch(new RegExp(p.replace('.', '\\.')));
  }
});

test('growth line required when the growth card renders', () =>
  expect(validateCopy(withPath(copy, 'lines.growth', undefined), stats).errors.join()).toMatch(/lines\.growth/));

test('growth line optional without two months', () => {
  const c = withPath(withPath(copy, 'lines.growth', undefined), 'lines.year', 'A year.');
  const r = validateCopy(withPath(withPath(c, 'lines.tokens', 'Tokens.'), 'lines.toolkit', 'Tools.'), empty);
  expect(r.errors.filter(e => e.startsWith('lines.growth'))).toEqual([]);
});

test('old fields are rejected', () => {
  expect(validateCopy({ ...copy, tokensLine: 'x' } as any, stats).errors).toContain('tokensLine: not used since copy v2');
  expect(validateCopy({ ...copy, persona: {} } as any, stats).errors).toContain('persona: not used since copy v2');
});

test('limits', () => {
  expect(COPY_LIMITS).toEqual({ title: 22, line: 90, caption: 200 });
  expect(validateCopy(withPath(copy, 'title', 'x'.repeat(23)), stats).errors).toContain('title: too long (23 > 22 characters after filling)');
});

test('raw digits rejected', () =>
  expect(validateCopy(withPath(copy, 'lines.tokens', 'You ran 212 tests'), stats).errors[0]).toMatch(/lines\.tokens.*digit/));

test('unknown placeholder rejected', () =>
  expect(validateCopy(withPath(copy, 'lines.tokens', '{tools.nope} tests'), stats).errors[0]).toMatch(/lines\.tokens.*tools\.nope/));

test('placeholder to an object rejected', () =>
  expect(validateCopy(withPath(copy, 'lines.tokens', '{activity}'), stats).ok).toBe(false));

test('secrets rejected', () =>
  expect(validateCopy(withPath(copy, 'captions.x', 'key sk-ant-api03-FAKEFAKEFAKEFAKEFAKE'), stats).ok).toBe(false));

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

test('month placeholder renders as a name', () => {
  expect(fillPlaceholders('{activity.growth.peak.month}', stats, 'en')).toBe('March');
  expect(fillPlaceholders('{activity.growth.peak.month}', stats, 'nl')).toBe('maart');
});
