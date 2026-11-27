import { compact, escapeHtml, fill, num } from '../escape.js';
import { shortDate, t } from '../i18n.js';
import { frame, type SlideCtx, type SlideOut } from '../slide.js';

const DAY = 86_400_000;
const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));

/** The year as a till receipt. Monospace is honest here: receipts are printed that way. */
export function render(ctx: SlideCtx): SlideOut {
  const { stats, lang, copy } = ctx;
  const daily = stats.activity.daily;
  if (daily.length === 0) return null;
  const s = t(lang);
  const line = (label: string, value: string, cls = '') => `<div class="ln${cls}"><span>${label}</span><span>${value}</span></div>`;

  const items = [
    line(s.sessions, num(stats.activity.sessions, lang)),
    line(s.messages, num(stats.activity.messages, lang)),
    stats.tools.bash ? line(s.bash, num(stats.tools.bash, lang)) : '',
    stats.tools.testRuns ? line(s.testRuns, num(stats.tools.testRuns, lang)) : '',
    stats.tools.commits ? line(s.commits, num(stats.tools.commits, lang)) : '',
    stats.prompts.count ? line(escapeHtml(s.please), num(stats.prompts.politeness, lang)) : '',
    stats.prompts.count ? line(escapeHtml(s.noWait), num(stats.prompts.corrections, lang)) : '',
  ].join('');
  const tokens = [
    stats.tokens.yearTotal ? line(s.tokensRead.replace(/^./, c => c.toUpperCase()), compact(stats.tokens.yearTotal, lang)) : '',
    stats.tokens.yearOutput ? line(s.tokensWritten.replace(/^./, c => c.toUpperCase()), compact(stats.tokens.yearOutput, lang)) : '',
  ].join('');
  const api = stats.apiValue && stats.apiValue.usd >= 1
    ? line(s.apiValue, `$${num(Math.round(stats.apiValue.usd), lang)}`, ' tot') + line(s.youPaid, s.aPlan)
      + `<div class="note">${s.apiNote}${stats.tokens.usageFrom ? `, ${s.since(shortDate(stats.tokens.usageFrom, lang))}` : ''}${stats.apiValue.skippedModels.length ? `, ${s.excludes(stats.apiValue.skippedModels.length)}` : ''}</div>`
    : '';
  const footer = copy.vibe !== 'professional' && copy.receiptFooter ? fill(copy.receiptFooter, stats, lang) : s.receiptThanks;

  const first = toMs(daily[0].date);
  const days = Math.round((toMs(daily.at(-1)!.date) - first) / DAY) + 1;
  const byDate = new Map(daily.map(d => [d.date, d.messages]));
  const max = Math.max(...daily.map(d => d.messages), 1);
  const bars = Array.from({ length: days }, (_, i) => {
    const v = byDate.get(new Date(first + i * DAY).toISOString().slice(0, 10)) ?? 0;
    return `<i class="bar" style="height:${Math.max(6, Math.round(100 * Math.sqrt(v / max)))}%"></i>`;
  }).join('');

  const inner = `<div class="slip">
    <h3>PROMPTFOLIO</h3>
    <div class="c">${s.receiptYear(stats.year)}<br>${shortDate(daily[0].date, lang)} &ndash; ${shortDate(daily.at(-1)!.date, lang)}</div>
    <hr>${items}<hr>${tokens}${api}<hr>
    <div class="c">${footer}</div>
    <div class="bars">${bars}</div>
  </div>`;
  return { css: CSS, html: frame(ctx, 's-rcpt', inner) };
}

const CSS = `
.s-rcpt { background: var(--accent); display: grid; place-items: center; }
.s-rcpt .slip { width: 820px; background: #FFFFFF; color: #111111; font: 400 34px/1.45 "IBM Plex Mono", monospace; padding: 72px 64px 90px;
  transform: rotate(-1.6deg); box-shadow: 0 50px 90px rgba(0,0,0,.28);
  -webkit-mask: radial-gradient(14px at 50% 100%, transparent 98%, #000) 0 0 / 40px 100% repeat-x;
          mask: radial-gradient(14px at 50% 100%, transparent 98%, #000) 0 0 / 40px 100% repeat-x; }
.s-rcpt h3 { font: 600 52px/1.1 "IBM Plex Mono", monospace; text-align: center; margin: 0 0 6px; }
.s-rcpt .c { text-align: center; }
.s-rcpt hr { border: 0; border-top: 3px dashed #111111; margin: 26px 0; }
.s-rcpt .ln { display: flex; justify-content: space-between; gap: 20px; }
.s-rcpt .tot { font-weight: 600; font-size: 44px; margin-top: 8px; }
.s-rcpt .note { font-size: 24px; color: #4B5563; margin-top: 6px; }
.s-rcpt .bars { display: flex; align-items: flex-end; gap: 2px; height: 110px; margin-top: 32px; }
.s-rcpt .bar { flex: 1; background: #111111; }
.s-rcpt.size-feed .slip { font-size: 28px; padding: 48px 56px 64px; width: 760px; }
.s-rcpt.size-feed h3 { font-size: 44px; }
.s-rcpt.size-feed hr { margin: 18px 0; }
.s-rcpt.size-feed .tot { font-size: 36px; }
.s-rcpt.size-feed .bars { height: 80px; margin-top: 22px; }
`;
