import type { Copy, Stats } from '../types.js';
import { compact, escapeHtml, num } from './escape.js';
import { t, type Lang } from './i18n.js';
import { fontFaceCss, languageColor } from './theme.js';

/**
 * A 1200x400 SVG for a GitHub profile README. Fonts are embedded; GitHub shows SVGs through <img>,
 * so CSS animation works but scripts and external files do not. The line draws in once, unless reduced motion.
 */
export function readmeCard(opts: { stats: Stats; copy: Copy; assetsDir: string }): string {
  const { stats } = opts;
  const lang = opts.copy.language as Lang;
  const s = t(lang);
  const theme = languageColor(stats.files.topLanguage);
  const months = stats.activity.byMonth;
  const max = Math.max(...months.map(m => m.messages), 1);
  const x = (i: number) => 760 + i * (380 / Math.max(1, months.length - 1));
  const y = (v: number) => 330 - 220 * (v / max);
  const line = months.length > 1 ? 'M' + months.map((m, i) => `${x(i).toFixed(1)} ${y(m.messages).toFixed(1)}`).join(' L') : '';
  const stat = (label: string, value: string, sx: number) =>
    `<text x="${sx}" y="280" class="v">${escapeHtml(value)}</text><text x="${sx}" y="318" class="l">${escapeHtml(label)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400" role="img" aria-label="Promptfolio ${stats.year}">
<style>
${fontFaceCss(opts.assetsDir, ['Archivo'])}
text { font-family: Archivo, sans-serif; fill: #10151C; }
.w { font-weight: 900; font-size: 52px; }
.y { font-weight: 600; font-size: 28px; fill: #4B5563; }
.v { font-weight: 900; font-size: 64px; }
.l { font-weight: 500; font-size: 24px; fill: #4B5563; }
.line { fill: none; stroke: ${theme.accent}; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: draw 1.6s cubic-bezier(.22,1,.36,1) both; }
@keyframes draw { from { stroke-dashoffset: 1; } }
@media (prefers-reduced-motion: reduce) { .line { animation: none; } }
</style>
<rect width="1200" height="400" rx="28" fill="#FFFFFF"/>
<rect x="0" y="0" width="14" height="400" rx="7" fill="${theme.accent}"/>
<text x="64" y="104" class="w">Promptfolio</text>
<text x="64" y="148" class="y">Claude Code, ${stats.year}</text>
${stat(s.tokensRead, compact(stats.tokens.yearTotal, lang), 64)}
${stat(s.sessions.toLowerCase(), num(stats.activity.sessions, lang), 300)}
${stats.files.topLanguage ? stat(s.topLanguage, stats.files.topLanguage, 500) : ''}
${line ? `<path d="${line}" class="line" pathLength="1"/>` : ''}
</svg>
`;
}
