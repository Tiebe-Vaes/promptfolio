import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildStats } from '../buildStats.js';
import { resolveClaudeDir } from '../paths.js';
import { buildSample, redactStats, type RedactionMode } from '../redact.js';

const MODES: RedactionMode[] = ['hide', 'pick', 'show'];

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
      year: { type: 'string' },
      tz: { type: 'string' },
      // No `default:` here: parseArgs only supports it from Node 18.11, and the scripts promise 18.3.
      projects: { type: 'string' },
      allow: { type: 'string' },
      'claude-dir': { type: 'string' },
    },
  });
  const now = new Date();
  const year = values.year ? Number(values.year) : now.getFullYear();
  const mode = (values.projects ?? 'hide') as RedactionMode;
  if (!values.out) return fail('Missing --out <dir>.', 1);
  if (!Number.isInteger(year)) return fail(`Invalid --year: ${values.year}`, 1);
  if (!MODES.includes(mode)) return fail(`Invalid --projects: ${mode} (use hide, pick or show)`, 1);

  const claudeDir = values['claude-dir'] ?? resolveClaudeDir(process.env, os.homedir());
  if (!fs.existsSync(claudeDir)) return fail(`Claude Code data folder not found: ${claudeDir}`, 2);
  const tz = values.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const stats = redactStats(await buildStats({ claudeDir, year, tz, now }), {
    mode,
    allow: (values.allow ?? '').split(',').map(s => s.trim()).filter(Boolean),
  });
  const out = path.resolve(values.out);
  fs.mkdirSync(out, { recursive: true });
  const statsPath = path.join(out, 'stats.json');
  const samplePath = path.join(out, 'sample.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  fs.writeFileSync(samplePath, JSON.stringify(buildSample(stats), null, 2));
  console.log(statsPath);
  console.log(samplePath);
  return 0;
}

function fail(message: string, code: number): number {
  console.error(message);
  return code;
}

main().then(code => { process.exitCode = code; }, err => { console.error(err instanceof Error ? err.message : err); process.exitCode = 1; });
