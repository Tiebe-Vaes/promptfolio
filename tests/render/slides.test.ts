import { beforeAll, expect, test } from 'vitest';
import * as receipt from '../../src/render/slides/receipt.js';
import * as terminal from '../../src/render/slides/terminal.js';
import * as tokens from '../../src/render/slides/tokens.js';
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

test('tokens: pair, line and heatmap from real numbers', () => {
  const out = tokens.render(ctx(stats, funCopy))!;
  expect(out.html).toContain('4.8K');               // 4,773 tokens read
  expect(out.html).toContain('>200<');              // tokens written
  expect(out.html).toContain(`${stats.tokens.readPerWritten} times`);
  expect(out.html.match(/class="cell/g)!.length).toBeGreaterThanOrEqual(stats.activity.daily.length);
  assertDesignRules(out.html + out.css, { mono: false });
});

test('tokens: skips without data', () => expect(tokens.render(ctx(empty, funCopy))).toBeNull());

test('receipt: line items, API value and footer', () => {
  const priced = merge(stats, { apiValue: { usd: 4180.4, models: ['claude-opus-5-5'], skippedModels: ['mystery'], pricesAsOf: '2026-11-03' } });
  const out = receipt.render(ctx(priced, funCopy, 'feed'))!;
  expect(out.html).toContain('$4,180');
  expect(out.html).toContain('excl. 1 unpriced model');
  expect(out.html).toContain(String(stats.activity.sessions));
  expect(out.html).toContain('API value');
  expect(out.html).toContain('No refunds on tokens.');
  expect(out.html.match(/class="bar"/g)!.length).toBeGreaterThan(10);
  assertDesignRules(out.html + out.css, { mono: true });
});

test('receipt: hides an API value under one dollar', () => expect(receipt.render(ctx(stats, funCopy))!.html).not.toContain('API value'));

test('receipt: professional uses the fixed footer', () =>
  expect(receipt.render(ctx(stats, proCopy))!.html).toContain('Thank you for building.'));

test('receipt: skips without data', () => expect(receipt.render(ctx(empty, funCopy))).toBeNull());

test('terminal: rows, tools and verdict', () => {
  const out = terminal.render(ctx(stats, funCopy))!;
  expect(out.html).toContain('You trust tests more than vibes.');
  expect(out.html).toContain(stats.tools.top[0].name);
  expect(out.html).toContain('Python');
  expect(out.html).not.toMatch(/Claude Code|Anthropic/);
  assertDesignRules(out.html + out.css, { mono: true });
});

test('terminal: skips without data', () => expect(terminal.render(ctx(empty, funCopy))).toBeNull());

test('copy is escaped', () => {
  const evil = { ...funCopy, verdict: '<img src=x onerror=alert(1)>' };
  expect(terminal.render(ctx(stats, evil))!.html).not.toContain('<img');
});
