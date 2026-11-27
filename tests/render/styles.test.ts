import { beforeAll, describe, expect, test } from 'vitest';
import { REPO } from '../../src/render/brand.js';
import { buildCard, CARD_IDS, type CardModel } from '../../src/render/model.js';
import { SIZES, type SizeName } from '../../src/render/shell.js';
import * as clean from '../../src/render/styles/clean.js';
import type { StyleCtx, StyleId } from '../../src/render/styles/style.js';
import { languageColor } from '../../src/render/theme.js';
import type { Copy, Stats } from '../../src/types.js';
import { fixtureStats, proCopy } from './ctx.js';
import { assertDesignRules } from './rules.js';

const STYLES: Partial<Record<StyleId, { render: (m: CardModel, c: StyleCtx) => { css: string; html: string }; mono: boolean }>> = {
  clean: { render: clean.render, mono: false },
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
