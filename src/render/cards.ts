import type { Copy, Stats } from '../types.js';
import type { Lang } from './i18n.js';
import { page, SIZES, type SizeName } from './shell.js';
import { BASE_CSS, type SlideCtx, type SlideId, type SlideOut } from './slide.js';
import * as card from './slides/card.js';
import * as growth from './slides/growth.js';
import * as receipt from './slides/receipt.js';
import * as terminal from './slides/terminal.js';
import * as tokens from './slides/tokens.js';
import { fontFaceCss, languageColor } from './theme.js';

export type Vibe = Copy['vibe'];
export type Target = 'instagram' | 'linkedin' | 'x' | 'discord';

const RENDERERS: Record<SlideId, (ctx: SlideCtx) => SlideOut> = {
  tokens: tokens.render, receipt: receipt.render, terminal: terminal.render, card: card.render, growth: growth.render,
};

export function storySlides(vibe: Vibe): SlideId[] {
  return vibe === 'professional' ? ['tokens', 'terminal', 'receipt', 'growth'] : ['tokens', 'receipt', 'terminal', 'card'];
}

const closer = (vibe: Vibe): SlideId => (vibe === 'professional' ? 'growth' : 'card');

/** Which PNGs to export for the places the user posts to. The receipt in feed size is always included. */
export function shareCards(vibe: Vibe, targets: Target[]): { slide: SlideId; size: SizeName }[] {
  const out: { slide: SlideId; size: SizeName }[] = [];
  const add = (slide: SlideId, size: SizeName) => {
    if (!out.some(o => o.slide === slide && o.size === size)) out.push({ slide, size });
  };
  if (targets.includes('instagram')) for (const s of storySlides(vibe)) add(s, 'story');
  if (targets.includes('linkedin')) { add(closer(vibe), 'feed'); add(closer(vibe), 'landscape'); }
  if (targets.includes('x') || targets.includes('discord')) add(closer(vibe), 'landscape');
  add('receipt', 'feed');
  return out;
}

export function renderSlide(id: SlideId, ctx: SlideCtx): SlideOut {
  return RENDERERS[id](ctx);
}

export function slideCtx(stats: Stats, copy: Copy, size: SizeName, extra: Partial<SlideCtx> = {}): SlideCtx {
  return { stats, copy, lang: copy.language as Lang, theme: languageColor(stats.files.topLanguage), size: SIZES[size], index: 0, total: 1, ...extra };
}

/** One share card as its own HTML document at exact pixel size, ready for a screenshot. Null when the slide has no data. */
export function cardDocument(id: SlideId, size: SizeName, stats: Stats, copy: Copy, assetsDir: string): string | null {
  const out = renderSlide(id, slideCtx(stats, copy, size));
  if (!out) return null;
  const { w, h } = SIZES[size];
  return page({
    title: `Promptfolio ${id}`,
    lang: copy.language,
    fontsCss: fontFaceCss(assetsDir),
    css: `${BASE_CSS}${out.css}\nhtml, body { width: ${w}px; height: ${h}px; overflow: hidden; }`,
    body: out.html,
  });
}
