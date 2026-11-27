import type { Copy, Stats } from '../types.js';
import type { Lang } from './i18n.js';
import { progressBar, type Size } from './shell.js';
import type { languageColor } from './theme.js';

export interface SlideCtx {
  stats: Stats;
  copy: Copy;
  lang: Lang;
  theme: ReturnType<typeof languageColor>;
  size: Size;
  /** Position in the story; the progress bar shows only when `progress` is true. */
  index: number;
  total: number;
  progress?: boolean;
}

/** Rendered slide: scoped CSS plus one root element of exactly the slide size. Null = not enough data, skip it. */
export type SlideOut = { css: string; html: string } | null;

export type SlideId = 'tokens' | 'receipt' | 'terminal' | 'card' | 'growth';

/** Root element with fixed size, theme variables and an optional progress bar. */
export function frame(ctx: SlideCtx, cls: string, inner: string, dark = false): string {
  const vars = `--accent:${ctx.theme.accent};--deep:${ctx.theme.deep};--on-accent:${ctx.theme.onAccent}`;
  const bar = ctx.progress ? progressBar(ctx.index, ctx.total) : '';
  return `<section class="slide ${cls}${dark ? ' dark' : ''} size-${ctx.size.name}" style="width:${ctx.size.w}px;height:${ctx.size.h}px;${vars}">${bar}${inner}</section>`;
}

export const BASE_CSS = `
.slide { position: relative; overflow: hidden; flex: none; }
`;
