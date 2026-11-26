import { expect, test } from 'vitest';
import { readTooling } from '../src/sources/tooling.js';
import { fixture, fixturePath } from './helpers.js';

test('readTooling counts', async () =>
  expect(await readTooling(fixture())).toEqual({ skills: 1, agents: 1, hooks: 2, plugins: 1, cleanupPeriodDays: null }));

test('readTooling reads cleanupPeriodDays', async () => {
  const { mkdtemp, writeFile } = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pf-'));
  await writeFile(path.join(dir, 'settings.json'), '{"cleanupPeriodDays": 400}');
  expect((await readTooling(dir)).cleanupPeriodDays).toBe(400);
});

test('readTooling on empty dir', async () =>
  expect(await readTooling(fixturePath('empty-home'))).toEqual({ skills: 0, agents: 0, hooks: 0, plugins: 0, cleanupPeriodDays: null }));

test('listProjectNames gives folder names from history, most prompts first', async () => {
  const { listProjectNames } = await import('../src/sources/history.js');
  expect(await listProjectNames(fixture('history.jsonl'))).toEqual(['alpha', 'beta']);
});
