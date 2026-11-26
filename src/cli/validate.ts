import fs from 'node:fs';
import { validateCopy } from '../copy.js';

const [copyPath, statsPath] = process.argv.slice(2);
if (!copyPath || !statsPath) {
  console.error('Usage: node validate.mjs <copy.json> <stats.json>');
  process.exitCode = 1;
} else {
  try {
    const result = validateCopy(JSON.parse(fs.readFileSync(copyPath, 'utf8')), JSON.parse(fs.readFileSync(statsPath, 'utf8')));
    if (result.ok) console.log('OK');
    else for (const e of result.errors) console.log(e);
    process.exitCode = result.ok ? 0 : 1;
  } catch (err) {
    console.log(`Could not read input: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  }
}
