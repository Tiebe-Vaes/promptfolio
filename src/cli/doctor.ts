import fs from 'node:fs';
import os from 'node:os';
import { findBrowser } from '../browser.js';
import { resolveClaudeDir } from '../paths.js';
import { readTooling } from '../sources/tooling.js';

const claudeDir = resolveClaudeDir(process.env, os.homedir());
const claudeDirExists = fs.existsSync(claudeDir);
const { cleanupPeriodDays } = claudeDirExists ? await readTooling(claudeDir) : { cleanupPeriodDays: null };

console.log(JSON.stringify({
  node: process.version,
  claudeDir,
  claudeDirExists,
  browser: findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync }),
  cleanupPeriodDays,
}, null, 2));
