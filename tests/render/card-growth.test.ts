import { beforeAll, expect, test } from 'vitest';
import * as card from '../../src/render/slides/card.js';
import * as growth from '../../src/render/slides/growth.js';
import type { Stats } from '../../src/types.js';
import { merge } from '../helpers.js';
import { ctx, emptyStats, fixtureStats, funCopy, proCopy } from './ctx.js';
import { assertDesignRules } from './rules.js';

let stats: Stats;
let empty: Stats;
beforeAll(async () => {
  stats = await fixtureStats();
  empty = await emptyStats();
});

const grown = () => merge(stats, {
  activity: {
    byMonth: [{ month: '2026-03', activeDays: 4, messages: 95, sessions: 6 }, { month: '2026-11', activeDays: 3, messages: 950, sessions: 3 }],
    growth: { first: { month: '2026-03', messages: 95 }, peak: { month: '2026-11', messages: 950 }, factor: 10 },
  },
});

test('sprite is deterministic', () => expect(card.sprite(stats, '#3178C6', '#1B3F6B')).toBe(card.sprite(stats, '#3178C6', '#1B3F6B')));

test('sprite differs for different stats', () =>
  expect(card.sprite(stats, '#3178C6', '#1B3F6B')).not.toBe(card.sprite(merge(stats, { tools: { bash: 9999 } }), '#3178C6', '#1B3F6B')));

test('sprite is an inline svg with crisp pixels', () => {
  const svg = card.sprite(stats, '#3178C6', '#1B3F6B');
  expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 12 12"/);
  expect(svg).toContain('shape-rendering="crispEdges"');
});

test('level formula', () => {
  expect(card.level(17.7e9)).toBe(70);
  expect(card.level(0)).toBe(1);
  expect(card.level(1e20)).toBe(99);
});

test('rarity thresholds', () => {
  const c = (scores: number[]) => merge(stats, { strengthCandidates: scores.map(score => ({ id: 'tests', value: 1, placeholder: 'tools.testRuns', score })) });
  expect(card.rarity(c([0.5]))).toBe('common');
  expect(card.rarity(c([1, 2]))).toBe('rare');
  expect(card.rarity(c([1, 1, 1, 1]))).toBe('legendary');
});

test('card renders the persona with real move values', () => {
  const out = card.render(ctx(stats, funCopy))!;
  expect(out.html).toContain('Shell Warlock');
  expect(out.html).toContain('Bash Barrage');
  expect(out.html).toContain(`>${stats.tools.bash}<`);
  assertDesignRules(out.html + out.css, { mono: false });
});

test('card needs a persona', () => expect(card.render(ctx(stats, proCopy))).toBeNull());

test('growth renders the line and strengths', () => {
  const out = growth.render(ctx(grown(), proCopy))!;
  expect(out.html).toContain('10 times busier by November');
  expect(out.html).toContain('<path');
  expect(out.html).toContain('Builds own tooling');
  assertDesignRules(out.html + out.css, { mono: false });
});

test('growth null without growth', () => {
  expect(growth.render(ctx(stats, proCopy))).toBeNull();
  expect(growth.render(ctx(empty, proCopy))).toBeNull();
});

test('variants fit their size', () => {
  for (const size of ['story', 'feed', 'landscape'] as const) {
    expect(card.render(ctx(stats, funCopy, size))!.html).toContain(`width:${ctx(stats, funCopy, size).size.w}px;height:${ctx(stats, funCopy, size).size.h}px`);
    expect(growth.render(ctx(grown(), proCopy, size))!.html).toMatch(new RegExp(`size-${size}`));
  }
});
