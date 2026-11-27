import { REPO } from '../brand.js';
import { num } from '../escape.js';
import { t } from '../i18n.js';
import type { CardModel } from '../model.js';
import { frame, type StyleCtx, type StyleOut } from './style.js';

const DAY = 86_400_000;
const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const TOOLS = { story: 10, square: 6, wide: 5 } as Record<string, number>;

/** The year's daily messages as a barcode, one bar per calendar day from the first to the last active day. */
function barcode(daily: { date: string; messages: number }[]): string {
  if (daily.length === 0) return '';
  const first = toMs(daily[0].date);
  const days = Math.round((toMs(daily.at(-1)!.date) - first) / DAY) + 1;
  const byDate = new Map(daily.map(d => [d.date, d.messages]));
  const max = Math.max(...daily.map(d => d.messages), 1);
  return `<div class="code">${Array.from({ length: days }, (_, i) => {
    const v = byDate.get(new Date(first + i * DAY).toISOString().slice(0, 10)) ?? 0;
    return `<i class="bar" style="height:${Math.max(6, Math.round(100 * Math.sqrt(v / max)))}%"></i>`;
  }).join('')}</div>`;
}

/** Receipt: the card as a till slip. Monospace is honest here: receipts are printed that way. */
export function render(m: CardModel, ctx: StyleCtx): StyleOut {
  const ln = (label: string, value: string, cls = '') => `<div class="ln${cls}"><span>${label}</span><span>${value}</span></div>`;
  const peak = Math.max(...m.bars.map(b => b.value), 1);
  const blocks = (v: number) => '#'.repeat(Math.max(v > 0 ? 1 : 0, Math.round(12 * v / peak)));
  const body = [
    m.hero ? `<div class="hero"><b>${m.hero.value}</b><span>${m.hero.label}</span></div><hr>` : '',
    m.bars.length ? m.bars.map(b => ln(`${b.label} <em>${blocks(b.value)}</em>`, num(b.value, ctx.lang))).join('') + '<hr>' : '',
    m.tools.length ? m.tools.slice(0, TOOLS[ctx.size.name] ?? 10).map(x => ln(x.name, x.count)).join('') + '<hr>' : '',
    m.items.map(i => ln(i.label, `${i.value}${i.note ? `*` : ''}`)).join(''),
    m.sum ? `<hr>${ln(m.sum.label, m.sum.value, ' tot')}<div class="note">${m.sum.note}</div>` : '',
    m.items.some(i => i.note) ? `<div class="note">* ${[...new Set(m.items.filter(i => i.note).map(i => i.note))].join(', ')}</div>` : '',
  ].join('');
  const inner = `<div class="slip">
    <h3>PROMPTFOLIO</h3>
    <div class="c">${m.heading}<br>${t(ctx.lang).receiptYear(m.year)}<br>${m.title}</div>
    <hr><div class="body">${body}</div><hr>
    ${m.line ? `<div class="c say">${m.line}</div>` : ''}
    ${barcode(ctx.stats.activity.daily)}
    <div class="c repo">${REPO}</div>
  </div>`;
  return { css: CSS, html: frame(ctx, 'receipt', m, inner) };
}

const CSS = `
.st-receipt { --f: 36px; --w: 880px; background: var(--accent); display: grid; place-items: center; }
.st-receipt.size-square { --f: 23px; --w: 640px; }
.st-receipt.size-wide { --f: 18px; --w: 980px; }
.st-receipt.size-wide .body { columns: 2; column-gap: 2.4em; column-rule: 2px dashed #111111; }
.st-receipt.size-wide .slip { transform: rotate(-1deg); }
.st-receipt .slip { width: var(--w); background: #FFFFFF; color: #111111; font: 400 var(--f)/1.4 "IBM Plex Mono", monospace;
  padding: calc(var(--f) * 2) calc(var(--f) * 1.8) calc(var(--f) * 2.4); transform: rotate(-1.6deg); box-shadow: 0 40px 80px rgba(0,0,0,.28);
  -webkit-mask: radial-gradient(calc(var(--f) * .4) at 50% 100%, transparent 98%, #000) 0 0 / calc(var(--f) * 1.2) 100% repeat-x;
          mask: radial-gradient(calc(var(--f) * .4) at 50% 100%, transparent 98%, #000) 0 0 / calc(var(--f) * 1.2) 100% repeat-x; }
.st-receipt h3 { font: 600 calc(var(--f) * 1.5)/1.1 "IBM Plex Mono", monospace; text-align: center; margin: 0 0 .2em; letter-spacing: .08em; }
.st-receipt .c { text-align: center; }
.st-receipt hr { border: 0; border-top: 3px dashed #111111; margin: .7em 0; }
.st-receipt .ln { display: flex; justify-content: space-between; gap: 1em; }
.st-receipt .ln { break-inside: avoid; }
.st-receipt .ln span:first-child { min-width: 0; }
.st-receipt .ln span:last-child { white-space: nowrap; text-align: right; }
.st-receipt .ln em { font-style: normal; color: #6B7280; }
.st-receipt .hero { text-align: center; }
.st-receipt .hero b { display: block; font: 600 calc(var(--f) * 2.8)/1.05 "IBM Plex Mono", monospace; }
.st-receipt .hero span { text-transform: uppercase; letter-spacing: .06em; }
.st-receipt .tot { font-weight: 600; font-size: calc(var(--f) * 1.3); }
.st-receipt .note { font-size: calc(var(--f) * .7); color: #4B5563; }
.st-receipt .say { margin: .4em 0; }
.st-receipt .code { display: flex; align-items: flex-end; gap: 1px; height: calc(var(--f) * 2.6); margin-top: 1em; }
.st-receipt .bar { flex: 1; background: #111111; }
.st-receipt .repo { font-size: calc(var(--f) * .7); margin-top: .6em; }
`;
