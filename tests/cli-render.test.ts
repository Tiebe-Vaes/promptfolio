import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from 'vitest';
import { findBrowser, pngSize } from '../src/browser.js';
import { fixture } from './helpers.js';
import { funCopy } from './render/ctx.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = (name: string) => path.join(root, 'plugins', 'promptfolio', 'skills', 'promptfolio', 'scripts', `${name}.mjs`);
const node = (name: string, args: string[], env: NodeJS.ProcessEnv = process.env) =>
  spawnSync(process.execPath, [script(name), ...args], { encoding: 'utf8', env, timeout: 120_000 });

function prepared(copy: unknown = funCopy): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-render-'));
  execFileSync(process.execPath, [script('stats'), '--claude-dir', fixture(), '--year', '2026', '--tz', 'Europe/Brussels', '--out', dir]);
  fs.writeFileSync(path.join(dir, 'copy.json'), JSON.stringify(copy));
  return dir;
}

beforeAll(() => { execFileSync(process.execPath, [path.join(root, 'esbuild.config.mjs')], { cwd: root }); });

test('render without browser', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir, '--targets', 'instagram'], { ...process.env, PROMPTFOLIO_BROWSER: 'none' });
  expect(r.status, r.stderr).toBe(0);
  expect(fs.existsSync(path.join(dir, 'story.html'))).toBe(true);
  expect(fs.existsSync(path.join(dir, 'readme-card.svg'))).toBe(true);
  expect(fs.readdirSync(path.join(dir, 'cards')).filter(f => f.endsWith('.png'))).toEqual([]);
  expect(r.stdout).toMatch(/No Chrome, Edge or Brave found/);
});

test('render rejects invalid copy', () => {
  const dir = prepared({ schemaVersion: 1, vibe: 'fun', language: 'en', captions: {} });
  const r = node('render', ['--dir', dir], { ...process.env, PROMPTFOLIO_BROWSER: 'none' });
  expect(r.status).toBe(1);
  expect(r.stdout + r.stderr).toMatch(/persona/);
});

test('render --no-png skips screenshots', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir, '--no-png']);
  expect(r.status, r.stderr).toBe(0);
  expect(fs.readdirSync(path.join(dir, 'cards')).some(f => f.endsWith('.png'))).toBe(false);
});

const browser = findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync });

test.skipIf(!browser)('render with browser writes PNGs at the right sizes', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir, '--targets', 'instagram,x']);
  expect(r.status, r.stderr).toBe(0);
  const sizes = Object.fromEntries(fs.readdirSync(path.join(dir, 'cards')).filter(f => f.endsWith('.png'))
    .map(f => [f, pngSize(fs.readFileSync(path.join(dir, 'cards', f)))]));
  expect(sizes['card-story.png']).toEqual({ width: 1080, height: 1920 });
  expect(sizes['card-landscape.png']).toEqual({ width: 1200, height: 675 });
  expect(sizes['receipt-feed.png']).toEqual({ width: 1080, height: 1350 });
  expect(pngSize(fs.readFileSync(path.join(dir, 'readme-card.png')))).toEqual({ width: 1200, height: 400 });
  expect(fs.readFileSync(path.join(dir, 'story.html'), 'utf8')).toContain('href="cards/card-story.png"');
}, 180_000);
