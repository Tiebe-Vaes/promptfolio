import { beforeAll, describe, expect, test } from 'vitest';
import { REPO } from '../../src/render/brand.js';
import { buildCard, CARD_IDS, type CardModel } from '../../src/render/model.js';
import { SIZES, type SizeName } from '../../src/render/shell.js';
import * as clean from '../../src/render/styles/clean.js';
import * as receipt from '../../src/render/styles/receipt.js';
import * as terminal from '../../src/render/styles/terminal.js';
import * as card from '../../src/render/styles/card.js';
import type { StyleCtx, StyleId } from '../../src/render/styles/style.js';
import { languageColor } from '../../src/render/theme.js';
import { merge } from '../helpers.js';
import type { Copy, Stats } from '../../src/types.js';
import { fixtureStats, proCopy } from './ctx.js';
import { assertDesignRules } from './rules.js';

const STYLES: Partial<Record<StyleId, { render: (m: CardModel, c: StyleCtx) => { css: string; html: string }; mono: boolean }>> = {
  clean: { render: clean.render, mono: false },
  receipt: { render: receipt.render, mono: true },
  terminal: { render: terminal.render, mono: true },
  card: { render: card.render, mono: false },
};
const FORMATS: SizeName[] = ['story', 'square', 'wide'];

let stats: Stats;
beforeAll(async () => { stats = await fixtureStats(); });

const sctx = (size: SizeName): StyleCtx => ({ stats, lang: 'en', theme: languageColor(stats.files.topLanguage), size: SIZES[size], index: 0, total: 4 });
const evil: Copy = { ...proCopy, title: '<img src=x onerror=alert(1)>', lines: { ...proCopy.lines, tokens: '<script>alert(1)</script>' } };

for (const [style, def] of Object.entries(STYLES)) {
  describe(style, () => {
    for (const card of CARD_IDS) for (const size of FORMATS) {
      test(`${card} ${size}`, () => {
        const m = buildCard(card, stats, proCopy)!;
        const out = def!.render(m, sctx(size));
        expect(out.html, 'root size').toContain(`width:${SIZES[size].w}px;height:${SIZES[size].h}px`);
        expect(out.html, 'root classes').toContain(`slide st-${style} card-${card} size-${size}`);
        expect(out.html, 'repo link').toContain(REPO);
        if (m.hero) expect(out.html, 'hero').toContain(m.hero.value);
        expect(out.html, 'line').toContain(m.line);
        assertDesignRules(out.html + out.css, { mono: def!.mono });
      });
    }
    test('every style escapes copy', () => {
      const out = def!.render(buildCard('tokens', stats, evil)!, sctx('story'));
      expect(out.html).not.toMatch(/<img|<script/);
    });
  });
}

test('receipt barcode has one bar per day in range', () => {
  const d = stats.activity.daily;
  const days = Math.round((Date.parse(d.at(-1)!.date) - Date.parse(d[0].date)) / 86_400_000) + 1;
  const html = receipt.render(buildCard('year', stats, proCopy)!, sctx('story')).html;
  expect(html.match(/class="bar"/g)!.length).toBe(days);
});

test('terminal has no Claude or Anthropic marks', () => {
  for (const card of CARD_IDS) {
    const html = terminal.render(buildCard(card, stats, { ...proCopy, title: 'x', lines: { tokens: 'a', year: 'b', toolkit: 'c', growth: 'd' } })!, sctx('story')).html;
    expect(html).not.toMatch(/Claude Code|Anthropic/);
  }
});

test('sprite is deterministic', () => expect(card.sprite(stats, '#3178C6', '#1B3F6B')).toBe(card.sprite(stats, '#3178C6', '#1B3F6B')));

test('sprite differs for different stats', () =>
  expect(card.sprite(stats, '#3178C6', '#1B3F6B')).not.toBe(card.sprite(merge(stats, { tools: { bash: 9999 } }), '#3178C6', '#1B3F6B')));

test('level formula', () => {
  expect(card.level(17.7e9)).toBe(70);
  expect(card.level(0)).toBe(1);
  expect(card.level(1e20)).toBe(99);
});

test('rarity thresholds', () => {
  const c = (n: number) => merge(stats, { strengthCandidates: Array.from({ length: n }, () => ({ id: 'tests', value: 1, placeholder: 'tools.testRuns', score: 1 })) });
  expect(card.rarity(c(1))).toBe('common');
  expect(card.rarity(c(2))).toBe('rare');
  expect(card.rarity(c(4))).toBe('legendary');
});

test('card shows its pack position', () => {
  const html = card.render(buildCard('year', stats, proCopy)!, sctx('story')).html;
  expect(html).toContain('2/4');
});
