import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

/**
 * Yields one parsed JSON value per line, streaming. Blank lines are skipped,
 * unparsable lines are counted in `counter.bad`. A missing file yields nothing.
 */
export async function* readJsonl(
  file: string | NodeJS.ReadableStream,
  counter: { bad: number } = { bad: 0 },
): AsyncGenerator<unknown> {
  let input: NodeJS.ReadableStream;
  if (typeof file === 'string') {
    if (!fs.existsSync(file)) return;
    input = fs.createReadStream(file, { encoding: 'utf8' });
  } else {
    input = file;
  }
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line);
      } catch {
        counter.bad++;
      }
    }
  } finally {
    rl.close();
    if ('destroy' in input && typeof input.destroy === 'function') input.destroy();
  }
}

/** All *.jsonl files under `projectsDir`, recursively (includes subagent logs). */
export async function findTranscripts(projectsDir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.endsWith('.jsonl')) out.push(p);
    }
  }
  await walk(projectsDir);
  return out;
}
