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

test('tokens: month labels never collide', () => {
  const html = tokens.render(ctx(merge(stats, { activity: { daily: [
    { date: '2026-04-21', messages: 5 }, { date: '2026-05-02', messages: 9 }, { date: '2026-11-20', messages: 3 },
  ] } }), funCopy))!.html;
  const lefts = [...html.matchAll(/<span style="left:(\d+)px">/g)].map(m => Number(m[1]));
  for (let i = 1; i < lefts.length; i++) expect(lefts[i] - lefts[i - 1]).toBeGreaterThanOrEqual(60);
});

test('terminal: long tool names are shortened, MCP tools get a readable name', () => {
  const html = terminal.render(ctx(merge(stats, { tools: { top: [{ name: 'mcp:Claude_Browser', count: 9 }, { name: 'Bash', count: 3 }] } }), funCopy))!.html;
  expect(html).toContain('>Claude Browser<');
  expect(html).not.toContain('mcp:');
});

test('plurals read right', () => {
  const one = merge(stats, { activity: { activeDays: 1, longestStreakDays: 1, sessions: 1 } });
  const term = terminal.render(ctx(one, funCopy))!.html;
  expect(term).toContain('reading 1 day of logs');
  expect(term).toContain('>1 day<');
  expect(tokens.render(ctx(one, funCopy))!.html).toContain('1 active day,');
});

test('heatmap starts its labels at the first active month', () => {
  const html = tokens.render(ctx(merge(stats, { activity: { daily: [{ date: '2026-03-01', messages: 4 }, { date: '2026-05-20', messages: 9 }] } }), funCopy))!.html;
  const labels = [...html.matchAll(/<span style="left:\d+px">([^<]+)<\/span>/g)].map(m => m[1]);
  expect(labels[0]).toBe('Mar');
  expect(labels).not.toContain('Feb');
});

test('written tokens say since when they only cover part of the year', () => {
  expect(tokens.render(ctx(stats, funCopy))!.html).toMatch(/tokens written since Nov 20/);
  const priced = merge(stats, { apiValue: { usd: 50, models: ['claude-opus-5-5'], skippedModels: [], pricesAsOf: '2026-11-03' } });
  expect(receipt.render(ctx(priced, funCopy))!.html).toMatch(/since Nov 20/);
});
