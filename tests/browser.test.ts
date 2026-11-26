import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { findBrowser, pngSize, screenshot, screenshotArgs } from '../src/browser.js';

test('env override wins', () =>
  expect(findBrowser({ platform: 'win32', env: { PROMPTFOLIO_BROWSER: 'C:\\b\\x.exe' }, exists: () => true })).toBe('C:\\b\\x.exe'));

test('env override ignored when missing', () =>
  expect(findBrowser({ platform: 'win32', env: { PROMPTFOLIO_BROWSER: 'C:\\b\\x.exe' }, exists: () => false })).toBeNull());

test('finds Edge in Program Files (x86)', () => {
  const env = { 'ProgramFiles(x86)': 'C:\\Program Files (x86)', ProgramFiles: 'C:\\Program Files', LOCALAPPDATA: 'C:\\L' };
  expect(findBrowser({ platform: 'win32', env, exists: p => p.includes('Edge') }))
    .toBe('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
});

test('prefers Chrome on macOS', () =>
  expect(findBrowser({ platform: 'darwin', env: {}, exists: () => true }))
    .toBe('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));

test('searches PATH on Linux', () =>
  expect(findBrowser({ platform: 'linux', env: { PATH: '/usr/local/bin:/usr/bin' }, exists: p => p === '/usr/bin/chromium' }))
    .toBe('/usr/bin/chromium'));

test('null when nothing exists', () =>
  expect(findBrowser({ platform: 'linux', env: { PATH: '/usr/bin' }, exists: () => false })).toBeNull());

test('screenshotArgs uses a fresh user-data-dir and no shell', () => {
  const a = screenshotArgs({ htmlPath: 'C:\\a b\\c.html', outPng: 'C:\\a b\\o.png', width: 1080, height: 1920, userDataDir: 'C:\\t\\p' });
  expect(a).toContain('--headless=new');
  expect(a).toContain('--user-data-dir=C:\\t\\p');
  expect(a).toContain('--screenshot=C:\\a b\\o.png');
  expect(a).toContain('--window-size=1080,1920');
  expect(a.at(-1)).toMatch(/^file:\/\/\/C:\/a%20b\/c\.html$/);
});

const browser = findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync });

test.skipIf(!browser)('renders a 1080x1920 PNG', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf shot '));
  const html = path.join(dir, 'card.html');
  const out = path.join(dir, 'card.png');
  fs.writeFileSync(html, '<html><body style="margin:0;background:#d97757"><h1>Lv</h1></body></html>');
  await screenshot({ browser: browser!, htmlPath: html, outPng: out, width: 1080, height: 1920 });
  expect(pngSize(fs.readFileSync(out))).toEqual({ width: 1080, height: 1920 });
});

test('screenshot rejects when the browser fails', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-'));
  await expect(screenshot({ browser: process.execPath, htmlPath: path.join(dir, 'x.html'), outPng: path.join(dir, 'x.png'), width: 10, height: 10, timeoutMs: 5000 }))
    .rejects.toThrow();
});
