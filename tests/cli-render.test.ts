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

const noBrowser = { ...process.env, PROMPTFOLIO_BROWSER: 'none' };
const cardHtml = (dir: string) => fs.readdirSync(path.join(dir, 'cards')).filter(f => f.endsWith('.html')).sort();

test('defaults render clean story cards', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir], noBrowser);
  expect(r.status, r.stderr).toBe(0);
  expect(cardHtml(dir)).toEqual(['clean-growth-story.html', 'clean-tokens-story.html', 'clean-toolkit-story.html', 'clean-year-story.html']);
  expect(r.stdout).toContain(path.join(dir, 'story.html'));
});

test('picked cards and formats only', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir, '--style', 'receipt', '--cards', 'tokens', '--formats', 'square,wide'], noBrowser);
  expect(r.status, r.stderr).toBe(0);
  expect(cardHtml(dir)).toEqual(['receipt-tokens-square.html', 'receipt-tokens-wide.html']);
  expect(fs.existsSync(path.join(dir, 'readme-card.svg'))).toBe(false);
});

test('readme only when picked', () => {
  const dir = prepared();
  expect(node('render', ['--dir', dir, '--formats', 'readme'], noBrowser).status).toBe(0);
  expect(fs.existsSync(path.join(dir, 'readme-card.svg'))).toBe(true);
  expect(cardHtml(dir)).toEqual([]);
});

test('palette sets the accent', () => {
  const dir = prepared();
  expect(node('render', ['--dir', dir, '--cards', 'tokens', '--palette', 'grape'], noBrowser).status).toBe(0);
  expect(fs.readFileSync(path.join(dir, 'cards', 'clean-tokens-story.html'), 'utf8')).toContain('--accent:#7048E8');
  expect(node('render', ['--dir', dir, '--palette', 'neon'], noBrowser).status).toBe(1);
});

test('unknown style exits 1', () => {
  const r = node('render', ['--dir', prepared(), '--style', 'neon'], noBrowser);
  expect(r.status).toBe(1);
  expect(r.stderr).toMatch(/--style.*clean, receipt, terminal, card/);
});

test('render without browser', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir], noBrowser);
  expect(r.status, r.stderr).toBe(0);
  expect(fs.existsSync(path.join(dir, 'story.html'))).toBe(true);
  expect(fs.existsSync(path.join(dir, 'captions.json'))).toBe(true);
  expect(fs.readdirSync(path.join(dir, 'cards')).filter(f => f.endsWith('.png'))).toEqual([]);
  expect(r.stdout).toMatch(/PNGs skipped/);
});

test("story links only the current style's PNGs", () => {
  const dir = prepared();
  fs.mkdirSync(path.join(dir, 'cards'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'cards', 'receipt-tokens-story.png'), '');
  fs.writeFileSync(path.join(dir, 'cards', 'clean-year-story.png'), '');
  expect(node('render', ['--dir', dir, '--style', 'clean'], noBrowser).status).toBe(0);
  const story = fs.readFileSync(path.join(dir, 'story.html'), 'utf8');
  expect(story).toContain('href="cards/clean-year-story.png"');
  expect(story).not.toContain('receipt-tokens-story.png');
});

test('render rejects invalid copy', () => {
  const dir = prepared({ schemaVersion: 1, vibe: 'fun', language: 'en', captions: {} });
  const r = node('render', ['--dir', dir], noBrowser);
  expect(r.status).toBe(1);
  expect(r.stdout + r.stderr).toMatch(/schemaVersion/);
});

const browser = findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync });

test.skipIf(!browser)('render with browser writes PNGs at the right sizes', () => {
  const dir = prepared();
  const r = node('render', ['--dir', dir, '--style', 'card', '--cards', 'tokens,year', '--formats', 'story,square,wide,readme']);
  expect(r.status, r.stderr).toBe(0);
  const size = (f: string) => pngSize(fs.readFileSync(path.join(dir, f)));
  expect(size('cards/card-tokens-story.png')).toEqual({ width: 1080, height: 1920 });
  expect(size('cards/card-year-square.png')).toEqual({ width: 1080, height: 1080 });
  expect(size('cards/card-year-wide.png')).toEqual({ width: 1200, height: 675 });
  expect(size('readme-card.png')).toEqual({ width: 1200, height: 400 });
  expect(fs.readFileSync(path.join(dir, 'story.html'), 'utf8')).toContain('href="cards/card-tokens-story.png"');
}, 240_000);
