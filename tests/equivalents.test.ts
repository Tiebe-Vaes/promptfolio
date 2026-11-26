import { expect, test } from 'vitest';
import { computeEquivalents, EQUIVALENTS } from '../src/equivalents.js';

test('every equivalent is first-party, sourced and labelled', () => {
  expect(EQUIVALENTS.length).toBeGreaterThan(0);
  for (const e of EQUIVALENTS) {
    expect(e.sourceUrl).toMatch(/^https:\/\//);
    expect(e.label.toLowerCase()).toContain('estimate');
    expect(e.label).toContain(e.provider);
  }
});

test('computeEquivalents scales by prompts', () => {
  const r = computeEquivalents(1000);
  expect(r.map(x => x.id).sort()).toEqual(['energy', 'water']);
  expect(r.find(x => x.id === 'energy')!.value).toBeCloseTo(240);
  expect(r.find(x => x.id === 'water')!.value).toBeCloseTo(1.04);
});

test('zero prompts give zero', () => {
  for (const r of computeEquivalents(0)) expect(r.value).toBe(0);
});
