import { compact, fill, num } from '../escape.js';
import { shortDate, shortMonth, t } from '../i18n.js';
import { frame, type SlideCtx, type SlideOut } from '../slide.js';

const DAY = 86_400_000;
const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Data artwork: tokens read and written, plus the year as a heatmap (one cell per day, Monday-first weeks). */
export function render(ctx: SlideCtx): SlideOut {
  const { stats, lang } = ctx;
  if (stats.tokens.yearTotal <= 0 || stats.activity.daily.length === 0) return null;
  const s = t(lang);
  const daily = stats.activity.daily;
  const byDate = new Map(daily.map(d => [d.date, d.messages]));
  const max = Math.max(...daily.map(d => d.messages), 1);
  const first = toMs(daily[0].date);
  const start = first - ((new Date(first).getUTCDay() + 6) % 7) * DAY;
  const end = toMs(daily.at(-1)!.date);
  const weeks = Math.floor((end - start) / DAY / 7) + 1;
  const width = ctx.size.w - 128;
  const cell = Math.max(8, Math.min(26, Math.floor((width - (weeks - 1) * 5) / weeks)));

  const cells: string[] = [];
  const months: string[] = [];
  let lastLabel = -Infinity;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = iso(start + (w * 7 + d) * DAY);
      const v = byDate.get(date) ?? 0;
      const pct = v ? Math.round(18 + 82 * Math.sqrt(v / max)) : 0;
      cells.push(`<i class="cell" style="grid-column:${w + 1};grid-row:${d + 1}${v ? `;background:color-mix(in oklab, var(--accent) ${pct}%, #EEF1F5)` : ''}"></i>`);
      const left = w * (cell + 5);
      // Label each month at its first day; skip a label that would sit on top of the previous one.
      // First label at the first active day; then one at each month start that has room.
      const isFirst = date === daily[0].date;
      const monthStart = date.endsWith('-01') && date > daily[0].date;
      if ((isFirst || monthStart) && left - lastLabel >= 60) {
        months.push(`<span style="left:${left}px">${shortMonth(date.slice(0, 7), lang)}</span>`);
        lastLabel = left;
      }
    }
  }

  const read = compact(stats.tokens.yearTotal, lang);
  const written = stats.tokens.yearOutput ? compact(stats.tokens.yearOutput, lang) : null;
  const inner = `
    <div class="copy">
      <div class="num">${read}</div><div class="unit">${s.tokensRead}</div>
      ${written ? `<div class="num accent">${written}</div><div class="unit">${s.tokensWritten}${stats.tokens.usageFrom ? ` ${s.since(shortDate(stats.tokens.usageFrom, lang))}` : ''}</div>` : ''}
      ${ctx.copy.tokensLine ? `<p class="say">${fill(ctx.copy.tokensLine, stats, lang)}</p>` : ''}
    </div>
    <div class="heat" style="grid-template-columns:repeat(${weeks},${cell}px);grid-template-rows:repeat(7,${cell}px)">${cells.join('')}</div>
    <div class="months">${months.join('')}</div>
    <p class="foot">${s.activeDays(stats.activity.activeDays, num(stats.activity.activeDays, lang), shortDate(daily[0].date, lang), shortDate(daily.at(-1)!.date, lang))}</p>`;
  return { css: CSS, html: frame(ctx, 's-tok', inner) };
}

const CSS = `
.s-tok { background: #FFFFFF; color: #10151C; font-family: Archivo, sans-serif; }
.s-tok .copy { position: absolute; left: 64px; right: 64px; top: 140px; }
.s-tok .num { font-weight: 900; font-size: 300px; line-height: .82; letter-spacing: -.03em; }
.s-tok .num.accent { color: var(--accent); margin-top: 56px; }
.s-tok .unit { font-size: 46px; font-weight: 600; margin-top: 18px; }
.s-tok .say { font-size: 52px; line-height: 1.2; font-weight: 500; margin: 64px 0 0; max-width: 900px; }
.s-tok .heat { position: absolute; left: 64px; bottom: 230px; display: grid; gap: 5px; }
.s-tok .cell { border-radius: 5px; background: #EEF1F5; }
.s-tok .months { position: absolute; left: 64px; right: 64px; bottom: 180px; height: 36px; font-size: 30px; color: #4B5563; }
.s-tok .months span { position: absolute; top: 0; }
.s-tok .foot { position: absolute; left: 64px; bottom: 90px; margin: 0; font-size: 34px; color: #4B5563; }
.s-tok.size-feed .num { font-size: 220px; }
.s-tok.size-feed .say { font-size: 44px; margin-top: 40px; }
`;
