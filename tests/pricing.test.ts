import { expect, test } from 'vitest';
import { apiValue, PRICES, priceFor } from '../src/stats/pricing.js';

const split = (input: number, output: number, cacheRead = 0, cacheCreation = 0) => ({ input, output, cacheRead, cacheCreation });

test('apiValue prices known models', () => {
  const p = PRICES['claude-opus-5-5'];
  const v = apiValue({ 'claude-opus-5-5': split(1e6, 1e6) })!;
  expect(v.usd).toBeCloseTo(p.input + p.output);
  expect(v.models).toEqual(['claude-opus-5-5']);
  expect(v.skippedModels).toEqual([]);
});

test('cache reads and writes use their own prices', () => {
  const p = PRICES['claude-sonnet-5-5'];
  expect(apiValue({ 'claude-sonnet-5-5': split(0, 0, 1e6, 1e6) })!.usd).toBeCloseTo(p.cacheRead + p.cacheWrite);
});

test('apiValue skips unknown models', () => {
  const v = apiValue({ 'mystery-1': split(1e6, 1e6) })!;
  expect(v.usd).toBe(0);
  expect(v.skippedModels).toEqual(['mystery-1']);
});

test('dated model ids match by prefix', () => expect(priceFor('claude-haiku-4-5-20251001')).toBe(PRICES['claude-haiku-4-5']));

test('synthetic and empty usage give null', () => {
  expect(apiValue({})).toBeNull();
  expect(apiValue({ '<synthetic>': split(0, 0) })).toBeNull();
});

test('unknown versions of a known family are not guessed', () => {
  expect(priceFor('claude-opus-5-7')).toBeUndefined();
  expect(priceFor('claude-fable-5-3')).toBeUndefined();
  expect(priceFor('claude-opus-5-5')).toBe(PRICES['claude-opus-5-5']);
});
