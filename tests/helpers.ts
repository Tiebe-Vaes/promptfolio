import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

/** Path under tests/fixtures/claude-home. */
export const fixture = (...parts: string[]): string => path.join(root, 'claude-home', ...parts);

/** Path under tests/fixtures. */
export const fixturePath = (name: string): string => path.join(root, name);

/** Deep-merges plain objects; arrays and primitives in `patch` replace. Returns a new object. */
export function merge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch as T;
  const out: any = structuredClone(base);
  for (const [k, v] of Object.entries(patch)) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(out[k] ?? {}, v) : v;
  return out;
}

export async function collect<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of it) out.push(x);
  return out;
}
