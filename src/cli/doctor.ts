import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findBrowser } from '../browser.js';
import { resolveClaudeDir } from '../paths.js';
import { listProjectNames } from '../sources/history.js';
import { readTooling } from '../sources/tooling.js';

const claudeDir = resolveClaudeDir(process.env, os.homedir());
const claudeDirExists = fs.existsSync(claudeDir);
const { cleanupPeriodDays } = claudeDirExists ? await readTooling(claudeDir) : { cleanupPeriodDays: null };
// Project names only on request: the user asked to pick which ones to show.
const projects = process.argv.includes('--projects') && claudeDirExists
  ? await listProjectNames(path.join(claudeDir, 'history.jsonl'))
  : undefined;

console.log(JSON.stringify({
  node: process.version,
  claudeDir,
  claudeDirExists,
  browser: findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync }),
  cleanupPeriodDays,
  ...(projects ? { projects } : {}),
}, null, 2));
