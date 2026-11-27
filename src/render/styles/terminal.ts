import { REPO } from '../brand.js';
import { num } from '../escape.js';
import type { CardModel } from '../model.js';
import { frame, type StyleCtx, type StyleOut } from './style.js';

const TOOLS = { story: 10, square: 7, wide: 5 } as Record<string, number>;

/** Terminal: the card printed by a command in a generic terminal window (no Claude Code or Anthropic marks). */
export function render(m: CardModel, ctx: StyleCtx): StyleOut {
  const row = (k: string, v: string, cls = 'v') => `<div class="row"><span class="k">${k}</span><span class="${cls}">${v}</span></div>`;
  const bar = (share: number) => `<i class="bar" style="width:${Math.max(2, Math.round(100 * share))}%"></i>`;
  const peak = Math.max(...m.bars.map(b => b.value), 1);
  const body = [
    m.hero ? `<div class="hero"><b>${m.hero.value}</b> <span class="k">${m.hero.label}</span></div>` : '',
    m.bars.length ? `<div class="chart">${m.bars.map(b => `<div class="cr${b.peak ? ' pk' : ''}"><span class="k">${b.label}</span>${bar(b.value / peak)}<span class="v">${num(b.value, ctx.lang)}</span></div>`).join('')}</div>` : '',
    m.tools.length ? `<div class="chart">${m.tools.slice(0, TOOLS[ctx.size.name] ?? 10).map(x => `<div class="cr"><span class="v name">${x.name}</span>${bar(x.share)}<span class="v">${x.count}</span></div>`).join('')}</div>` : '',
    m.items.length ? `<div class="rows">${m.items.map(i => row(i.label, `${i.value}${i.note ? ` <span class="k">(${i.note})</span>` : ''}`)).join('')}</div>` : '',
    m.sum ? row(m.sum.label, `${m.sum.value} <span class="k">(${m.sum.note})</span>`, 'hl') : '',
  ].join('');
  const inner = `<div class="win">
    <div class="dots"><i></i><i></i><i></i></div>
    <div class="p">~ <b>$</b> promptfolio ${m.id} --year ${m.year}</div>
    <div class="k">${m.heading}, ${m.title}</div>
    <div class="body">${body}</div>
    ${m.line ? `<div class="k say"># ${m.line}</div>` : ''}
    <div class="p">~ <b>$</b> <span class="caret"></span></div>
    <div class="k repo">${REPO}</div>
  </div>`;
  return { css: CSS, html: frame(ctx, 'terminal', m, inner, true) };
}

const CSS = `
.st-terminal { --f: 36px; background: #0D1117; color: #D7DEE8; font: 400 var(--f)/1.5 "IBM Plex Mono", monospace; padding: 130px 60px 70px; }
.st-terminal.size-square { --f: 25px; padding: 56px; }
.st-terminal.size-wide { --f: 18px; padding: 36px 44px; }
.st-terminal .win { border-radius: calc(var(--f) * .6); background: #161B22; border: 2px solid #262D37; padding: calc(var(--f) * 1.2) calc(var(--f) * 1.3); height: 100%; overflow: hidden; display: flex; flex-direction: column; gap: calc(var(--f) * .5); }
.st-terminal .dots { display: flex; gap: calc(var(--f) * .4); margin-bottom: calc(var(--f) * .5); }
.st-terminal .dots i { width: calc(var(--f) * .6); height: calc(var(--f) * .6); border-radius: 50%; background: #2E3743; }
.st-terminal .p, .st-terminal .k { color: #8B97A7; }
.st-terminal .p b, .st-terminal .v { color: #FFFFFF; font-weight: 600; }
.st-terminal .hl { color: color-mix(in oklab, var(--accent) 60%, #FFFFFF); font-weight: 600; }
.st-terminal .body { display: flex; flex-direction: column; gap: calc(var(--f) * .7); margin: calc(var(--f) * .5) 0; min-height: 0; flex: 0 1 auto; overflow: hidden; }
.st-terminal.size-wide .hero b { font-size: calc(var(--f) * 2); }
.st-terminal.size-wide .body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 2.4em; align-content: start; }
.st-terminal .hero b { font-size: calc(var(--f) * 2.6); line-height: 1.05; color: #FFFFFF; }
.st-terminal .row { display: flex; justify-content: space-between; gap: 1em; }
.st-terminal .row .v, .st-terminal .row .hl { text-align: right; white-space: nowrap; }
.st-terminal .chart { display: grid; gap: calc(var(--f) * .2); }
.st-terminal .cr { display: grid; grid-template-columns: 8.5em 1fr 4.5em; align-items: center; gap: .6em; }
.st-terminal .cr .v:last-child { text-align: right; }
.st-terminal .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-terminal .bar { display: block; height: .62em; border-radius: 2px; background: color-mix(in oklab, var(--accent) 45%, #2E3743); }
.st-terminal .pk .bar, .st-terminal .cr:first-child .bar { background: color-mix(in oklab, var(--accent) 60%, #FFFFFF); }
.st-terminal .say { white-space: normal; }
.st-terminal .repo { margin-top: auto; font-size: calc(var(--f) * .7); }
.st-terminal .caret { display: inline-block; width: .55em; height: 1.1em; background: #D7DEE8; vertical-align: -.2em; animation: pf-blink 1.1s steps(1) infinite; }
@keyframes pf-blink { 50% { opacity: 0; } }
`;
