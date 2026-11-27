import type { Stats } from '../../types.js';
import { REPO } from '../brand.js';
import type { Lang } from '../i18n.js';
import type { CardModel } from '../model.js';
import { progressBar, type Size } from '../shell.js';
import type { languageColor } from '../theme.js';

export type StyleId = 'clean' | 'receipt' | 'terminal' | 'card';
export const STYLE_IDS: StyleId[] = ['clean', 'receipt', 'terminal', 'card'];

export interface StyleCtx {
  stats: Stats;
  lang: Lang;
  theme: ReturnType<typeof languageColor>;
  size: Size;
  /** Story mode: show the progress bar at `index` of `total`. */
  progress?: boolean;
  index: number;
  total: number;
}

export type StyleOut = { css: string; html: string };

/** Root element: exact size, theme variables, optional progress bar. CSS of each style is scoped under .st-<style>. */
export function frame(ctx: StyleCtx, style: StyleId, model: CardModel, inner: string, dark = false): string {
  const vars = `--accent:${ctx.theme.accent};--deep:${ctx.theme.deep}`;
  const bar = ctx.progress ? progressBar(ctx.index, ctx.total) : '';
  return `<section class="slide st-${style} card-${model.id} size-${ctx.size.name}${dark ? ' dark' : ''}" style="width:${ctx.size.w}px;height:${ctx.size.h}px;${vars}">${bar}${inner}</section>`;
}

export const footer = (): string => `<footer class="repo">${REPO}</footer>`;
