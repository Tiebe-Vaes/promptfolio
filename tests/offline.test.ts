import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDir = path.join(root, 'plugins', 'promptfolio', 'skills', 'promptfolio', 'scripts');
const srcDir = path.join(root, 'src');

function allFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? allFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

// Guards the README promise "the scripts make no network requests".
const NETWORK = /\b(?:node:)?(?:https?|http2|net|dgram|tls|dns)['"]|\bfetch\s*\(|\bWebSocket\b|\bXMLHttpRequest\b/;

test('source and shipped scripts use no network APIs', () => {
  const files = [...allFiles(srcDir), ...allFiles(scriptsDir)];
  expect(files.length).toBeGreaterThan(5);
  for (const f of files) expect(NETWORK.test(fs.readFileSync(f, 'utf8')), f).toBe(false);
});

test('the guard regex catches network imports', () => {
  for (const s of ["import https from 'node:https'", "require('net')", 'await fetch(url)'])
    expect(NETWORK.test(s), s).toBe(true);
});
