import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { fixture } from './helpers.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = (name: string) => path.join(root, 'plugins', 'promptfolio', 'skills', 'promptfolio', 'scripts', `${name}.mjs`);
const run = (name: string, args: string[], env: NodeJS.ProcessEnv = process.env) =>
  spawnSync(process.execPath, [script(name), ...args], { encoding: 'utf8', env });

let tmp: string;
beforeAll(() => {
  execFileSync(process.execPath, [path.join(root, 'esbuild.config.mjs')], { cwd: root });
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-cli-'));
});

test('stats CLI writes redacted stats and sample', () => {
  const r = run('stats', ['--claude-dir', fixture(), '--year', '2026', '--tz', 'Europe/Brussels', '--out', tmp]);
  expect(r.status, r.stderr).toBe(0);
  const raw = fs.readFileSync(path.join(tmp, 'stats.json'), 'utf8');
  const s = JSON.parse(raw);
  expect(s.year).toBe(2026);
  expect(s.projects.list[0].label).toBe('Project A');
  expect(raw).not.toMatch(/sk-ant-|alpha|C:\\\\dev/);
  const sample = JSON.parse(fs.readFileSync(path.join(tmp, 'sample.json'), 'utf8'));
  expect(sample.placeholders).toContain('activity.sessions');
  expect(r.stdout).toContain('stats.json');
});

test('stats CLI show mode keeps names', () => {
  const out = path.join(tmp, 'show');
  expect(run('stats', ['--claude-dir', fixture(), '--year', '2026', '--projects', 'show', '--out', out]).status).toBe(0);
  expect(JSON.parse(fs.readFileSync(path.join(out, 'stats.json'), 'utf8')).projects.list.map((p: any) => p.label).sort()).toEqual(['alpha', 'beta']);
});

test('stats CLI exits 2 on missing dir', () => {
  const r = run('stats', ['--claude-dir', fixture('nope'), '--out', tmp]);
  expect(r.status).toBe(2);
  expect(r.stderr).toMatch(/not found/i);
});

test('stats CLI rejects a bad --projects value', () =>
  expect(run('stats', ['--claude-dir', fixture(), '--projects', 'all', '--out', tmp]).status).toBe(1));

test('validate CLI', () => {
  const stats = path.join(tmp, 'stats.json');
  const good = path.join(tmp, 'good.json');
  const bad = path.join(tmp, 'bad.json');
  fs.writeFileSync(good, JSON.stringify({ schemaVersion: 1, vibe: 'fun', language: 'en',
    persona: { className: 'Shell Warlock', specialMove: 'git commit', weakness: 'sorry', nemesis: 'errors' },
    diary: ['one', 'two', 'three'], awards: [{ title: 'a', text: 'b' }, { title: 'c', text: 'd' }, { title: 'e', text: 'f' }],
    relationship: { status: 'Married', text: '{activity.activeDays} days together' }, captions: {} }));
  fs.writeFileSync(bad, JSON.stringify({ schemaVersion: 1, vibe: 'fun', language: 'en', captions: { x: '12 tests' } }));
  const ok = run('validate', [good, stats]);
  expect(ok.status, ok.stdout).toBe(0);
  expect(ok.stdout.trim()).toBe('OK');
  const no = run('validate', [bad, stats]);
  expect(no.status).toBe(1);
  expect(no.stdout).toMatch(/captions\.x/);
});

test('doctor CLI reports environment as JSON', () => {
  const r = run('doctor', [], { ...process.env, CLAUDE_CONFIG_DIR: fixture() });
  expect(r.status).toBe(0);
  const d = JSON.parse(r.stdout);
  expect(d).toMatchObject({ claudeDir: fixture(), claudeDirExists: true, cleanupPeriodDays: null });
  expect(d.node).toBe(process.version);
  expect('browser' in d).toBe(true);
});
