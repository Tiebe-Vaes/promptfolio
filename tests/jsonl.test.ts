import path from 'node:path';
import { Readable } from 'node:stream';
import { expect, test } from 'vitest';
import { findTranscripts, readJsonl } from '../src/jsonl.js';
import { collect, fixture } from './helpers.js';

test('skips bad lines and counts them', async () => {
  const counter = { bad: 0 };
  const rows = await collect(readJsonl(Readable.from(['{"a":1}\n', 'not json\n', '\n', '{"a":2}\n']), counter));
  expect(rows).toEqual([{ a: 1 }, { a: 2 }]);
  expect(counter.bad).toBe(1);
});

test('streams lazily', async () => {
  let produced = 0;
  const src = Readable.from((function* () {
    for (let i = 0; i < 1e5; i++) { produced++; yield `{"i":${i}}\n`; }
  })());
  const it = readJsonl(src);
  await it.next();
  expect(produced).toBeLessThan(1e5);
  await it.return(undefined);
});

test('finds transcripts including subagents', async () => {
  const files = (await findTranscripts(fixture('projects')))
    .map(f => path.relative(fixture('projects'), f).replaceAll('\\', '/')).sort();
  expect(files).toEqual(['C--dev-alpha/s1.jsonl', 'C--dev-alpha/s1/subagents/agent-1.jsonl', 'C--dev-beta/s2.jsonl']);
});

test('missing projects dir gives []', async () => expect(await findTranscripts(fixture('nope'))).toEqual([]));

test('missing file yields nothing', async () => expect(await collect(readJsonl(fixture('nope.jsonl')))).toEqual([]));
