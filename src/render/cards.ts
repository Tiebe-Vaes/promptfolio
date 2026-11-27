import type { Copy, Stats } from '../types.js';
import type { Lang } from './i18n.js';
import { buildCard, CARD_IDS, type CardId, type CardModel } from './model.js';
import { page, SIZES, type SizeName } from './shell.js';
import * as card from './styles/card.js';
import * as clean from './styles/clean.js';
import * as receipt from './styles/receipt.js';
import type { StyleCtx, StyleId, StyleOut } from './styles/style.js';
import * as terminal from './styles/terminal.js';
import { fontFaceCss, paletteTheme, type PaletteId } from './theme.js';

export type CardFormat = 'story' | 'square' | 'wide';
export const CARD_FORMATS: CardFormat[] = ['story', 'square', 'wide'];

const STYLES: Record<StyleId, (m: CardModel, ctx: StyleCtx) => StyleOut> = {
  clean: clean.render, receipt: receipt.render, terminal: terminal.render, card: card.render,
};

export const BASE_CSS = `
.slide { position: relative; overflow: hidden; flex: none; }
`;

export function renderCard(style: StyleId, model: CardModel, ctx: StyleCtx): StyleOut {
  return STYLES[style](model, ctx);
}

export function styleCtx(stats: Stats, copy: Copy, size: SizeName, extra: Partial<StyleCtx> = {}, palette: PaletteId = 'auto'): StyleCtx {
  return { stats, lang: copy.language as Lang, theme: paletteTheme(palette, stats.files.topLanguage), size: SIZES[size], index: 0, total: 1, ...extra };
}

/** One card as its own HTML document at exact pixel size, ready for a screenshot. Null when the card has no data. */
export function cardDocument(style: StyleId, id: CardId, format: CardFormat, stats: Stats, copy: Copy, assetsDir: string, picked: CardId[] = CARD_IDS, palette: PaletteId = 'auto'): string | null {
  const model = buildCard(id, stats, copy, picked);
  if (!model) return null;
  const out = renderCard(style, model, styleCtx(stats, copy, format, {}, palette));
  const { w, h } = SIZES[format];
  return page({
    title: `Promptfolio ${id}`,
    lang: copy.language,
    fontsCss: fontFaceCss(assetsDir),
    css: `${BASE_CSS}${out.css}\nhtml, body { width: ${w}px; height: ${h}px; overflow: hidden; }`,
    body: out.html,
  });
}
