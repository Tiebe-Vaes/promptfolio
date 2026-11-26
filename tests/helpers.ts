import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

/** Path under tests/fixtures/claude-home. */
export const fixture = (...parts: string[]): string => path.join(root, 'claude-home', ...parts);

/** Path under tests/fixtures. */
export const fixturePath = (name: string): string => path.join(root, name);

export async function collect<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of it) out.push(x);
  return out;
}
