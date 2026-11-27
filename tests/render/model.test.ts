import { beforeAll, expect, test } from 'vitest';
import { REPO, REPO_URL } from '../../src/render/brand.js';
import { compact, num } from '../../src/render/escape.js';
import { buildCard, CARD_IDS, modelLabel, toolName } from '../../src/render/model.js';
import type { Stats } from '../../src/types.js';
import { merge } from '../helpers.js';
import { emptyStats, fixtureStats, funCopy, proCopy } from './ctx.js';

let stats: Stats;
let empty: Stats;
beforeAll(async () => {
  stats = await fixtureStats();
  empty = await emptyStats();
});

const values = (m: ReturnType<typeof buildCard>) => m!.items.map(i => i.value).join(' | ');

test('repo constants', () => {
  expect(REPO).toBe('github.com/Tiebe-Vaes/promptfolio');
  expect(REPO_URL).toBe('https://github.com/Tiebe-Vaes/promptfolio');
});

test('tokens card from fixture', () => {
  const m = buildCard('tokens', stats, proCopy)!;
  expect(m.heading).toBe('Tokens');
  expect(m.hero!.value).toBe(compact(stats.tokens.yearTotal, 'en'));
  expect(values(m)).toContain(compact(stats.tokens.yearOutput!, 'en'));
  expect(values(m)).toContain(modelLabel(stats.tokens.favoriteModel!.model));
  expect(m.items.some(i => i.note === 'estimate')).toBe(true);
  expect(m.line).toContain(num(stats.tokens.yearTotal, 'en'));
  expect(m.title).toBe('Python builder');
});

test('year card uses stats-cache tool calls', () => {
  const s = merge(stats, { activity: { toolCalls: 40508 }, tools: { calls: 32677 } });
  const v = values(buildCard('year', s, proCopy));
  expect(v).toContain('40,508');
  expect(v).not.toContain('32,677');
});

test('year total shows the API value from one dollar', () => {
  const priced = merge(stats, { apiValue: { usd: 7532.04, models: ['claude-opus-5-5'], skippedModels: [], pricesAsOf: '2026-11-03' } });
  expect(buildCard('year', priced, proCopy)!.sum).toMatchObject({ value: '$7,532' });
  const cheap = merge(stats, { apiValue: { usd: 0.4, models: ['claude-opus-5-5'], skippedModels: [], pricesAsOf: '2026-11-03' } });
  expect(buildCard('year', cheap, proCopy)!.sum).toBeNull();
});

test('zero items are left out', () => {
  const v = buildCard('year', merge(stats, { tools: { commits: 0 } }), proCopy)!.items.map(i => i.label);
  expect(v).not.toContain('Commits');
});

test('toolkit lists at most ten tools with shares', () => {
  const top = Array.from({ length: 12 }, (_, i) => ({ name: `Tool${i}`, count: 120 - i * 10 }));
  const m = buildCard('toolkit', merge(stats, { tools: { top } }), proCopy)!;
  expect(m.tools).toHaveLength(10);
  expect(m.tools[0]).toEqual({ name: 'Tool0', count: '120', share: 1 });
  expect(m.tools[1].share).toBeCloseTo(110 / 120);
});

test('growth bars fill quiet months', () => {
  const s = merge(stats, { activity: {
    byMonth: [{ month: '2026-04', activeDays: 2, messages: 10, sessions: 1 }, { month: '2026-06', activeDays: 5, messages: 300, sessions: 4 }],
    growth: { first: { month: '2026-04', messages: 10 }, peak: { month: '2026-06', messages: 300 }, factor: 30 },
  } });
  const m = buildCard('growth', s, proCopy)!;
  expect(m.bars.map(b => [b.label, b.value, b.peak])).toEqual([['Apr', 10, false], ['May', 0, false], ['Jun', 300, true]]);
  expect(m.hero!.value).toBe('30x');
});

test('growth hero falls back to messages under a doubling', () => {
  const s = merge(stats, { activity: { growth: { first: { month: '2026-03', messages: 95 }, peak: { month: '2026-03', messages: 95 }, factor: 1 } } });
  expect(buildCard('growth', s, proCopy)!.hero!.value).toBe(num(stats.activity.messages, 'en'));
});

test('sparse stats skip cards', () => {
  for (const id of CARD_IDS) expect(buildCard(id, empty, funCopy), id).toBeNull();
});

test('index counts picked non-null cards', () => {
  const m = buildCard('toolkit', stats, proCopy, ['tokens', 'toolkit'])!;
  expect([m.index, m.total]).toEqual([2, 2]);
  const all = buildCard('growth', stats, proCopy)!;
  expect([all.index, all.total]).toEqual([4, 4]);
});

test('tool and model names are shortened', () => {
  expect(toolName('mcp:Claude_Browser')).toBe('Claude Browser');
  expect(toolName('mcp:connector')).toBe('Connector');
  expect(toolName('A'.repeat(30))).toBe('A'.repeat(15) + '...');
  expect(modelLabel('claude-opus-5-5')).toBe('Opus 5.5');
  expect(modelLabel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5');
  expect(modelLabel('claude-sonnet-5')).toBe('Sonnet 5');
});

test('strings are escaped', () => {
  const m = buildCard('tokens', stats, { ...proCopy, title: '<b>x</b>', lines: { ...proCopy.lines, tokens: '<img src=x onerror=alert(1)>' } })!;
  expect(m.title).toBe('&lt;b&gt;x&lt;/b&gt;');
  expect(m.line).not.toContain('<img');
});


test('equivalents that round to zero are left out', () => {
  const s = merge(stats, { equivalents: [
    { id: 'energy', value: 0.3, unit: 'Wh', label: 'e', sourceUrl: 'x' },
    { id: 'water', value: 0.004, unit: 'glasses', label: 'w', sourceUrl: 'x' },
  ] });
  const labels = buildCard('tokens', s, proCopy)!.items.map(i => i.label);
  expect(labels).not.toContain('energy');
  expect(labels).not.toContain('water');
});
