import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../src/buildStats.js';
import { buildSample, redactStats, scanSecrets } from '../src/redact.js';
import type { Stats } from '../src/types.js';
import { fixture } from './helpers.js';

let stats: Stats;
beforeAll(async () => {
  stats = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27T12:00:00Z') });
});

test('scanSecrets', () => {
  for (const s of [
    'fix login sk-ant-api03-FAKEFAKEFAKEFAKEFAKE', 'mail me at a@b.co', 'ghp_abcdefghijklmnopqrstuvwxyz0123456789',
    'AKIAABCDEFGHIJKLMNOP', 'https://user:pass@example.com/x', 'eyJhbGciOi.eyJzdWIiOiIx.c2lnbmF0dXJl',
    '-----BEGIN PRIVATE KEY-----', 'token 0123456789abcdef0123456789abcdef',
  ]) expect(scanSecrets(s), s).toBe(true);
  for (const s of ['fix the login button', 'feat/login', 'main', 'claude-opus-5-5', 'mcp__1a59c906-04da__read'])
    expect(scanSecrets(s), s).toBe(false);
});

test('hide mode letters projects and drops titles', () => {
  const r = redactStats(stats, { mode: 'hide', allow: [] });
  expect(r.projects.list.map(p => p.label)).toEqual(['Project A', 'Project B']);
  expect(r.projects.list.every(p => p.titles.length === 0 && p.branches.length === 0)).toBe(true);
  expect(JSON.stringify(r)).not.toMatch(/alpha|beta|feat\/login/);
});

test('show mode still drops secret-bearing title', () => {
  const r = redactStats(stats, { mode: 'show', allow: [] });
  expect(JSON.stringify(r)).not.toContain('sk-ant-');
  const alpha = r.projects.list.find(p => p.label === 'alpha')!;
  expect(alpha.branches).toEqual(['feat/login']);
  expect(alpha.titles).toEqual([]);
});

test('paths never leave, even in show mode', () => {
  const r = redactStats(stats, { mode: 'show', allow: [] });
  expect(JSON.stringify(r)).not.toMatch(/C:\\\\dev/);
  expect(r.projects.list.map(p => p.key)).toEqual(r.projects.list.map(p => p.label));
});

test('pick mode keeps only allowed names', () => {
  const r = redactStats(stats, { mode: 'pick', allow: ['beta'] });
  expect(r.projects.list.map(p => p.label).sort()).toEqual(['Project A', 'beta']);
  expect(r.projects.list.find(p => p.label === 'beta')!.branches).toEqual(['main']);
});

test('redactStats does not mutate its input', () => {
  redactStats(stats, { mode: 'hide', allow: [] });
  expect(stats.projects.list[0].label).toBe('alpha');
});

test('sample lists placeholders and hints', () => {
  const s = buildSample(redactStats(stats, { mode: 'hide', allow: [] }));
  expect(s.placeholders).toContain('activity.sessions');
  expect(s.placeholders).toContain('files.byLanguage.length');
  expect(s.placeholders).not.toContain('projects.list');
  expect(s.vibeHints.topTools[0]).toBe('Bash');
  expect(s.vibeHints.projectLabels).toEqual(['Project A', 'Project B']);
  expect(s.vibeHints.titles).toEqual([]);
});
