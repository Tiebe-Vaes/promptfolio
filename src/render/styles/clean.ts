import type { CardModel } from '../model.js';
import { footer, frame, type StyleCtx, type StyleOut } from './style.js';

/** How many tools fit: the wide format has the least height. */
const toolLimit = (size: string) => (size === 'wide' ? 5 : 10);

/** Shared body for the Clean and Trading card styles: bars, tool bars, label/value rows and the total. */
export function sideHtml(m: CardModel, size: string): string {
  const peak = Math.max(...m.bars.map(b => b.value), 1);
  const bars = m.bars.length
    ? `<div class="bars">${m.bars.map(b => `<div class="b${b.peak ? ' pk' : ''}"><i style="height:${Math.max(2, Math.round(100 * b.value / peak))}%"></i><span>${b.label}</span></div>`).join('')}</div>`
    : '';
  const tools = m.tools.length
    ? `<ol class="tools">${m.tools.slice(0, toolLimit(size)).map(x => `<li><span class="n">${x.name}</span><span class="c">${x.count}</span><i style="width:${Math.max(2, Math.round(100 * x.share))}%"></i></li>`).join('')}</ol>`
    : '';
  const items = m.items.length
    ? `<dl class="items">${m.items.map(i => `<div><dt>${i.label}</dt><dd>${i.value}${i.note ? ` <small>${i.note}</small>` : ''}</dd></div>`).join('')}</dl>`
    : '';
  const sum = m.sum ? `<div class="sum"><span>${m.sum.label}</span><b>${m.sum.value}</b><small>${m.sum.note}</small></div>` : '';
  return `${bars}${tools}${items}${sum}`;
}

/** Clean: white, big Archivo numbers, the accent from the top language. */
export function render(m: CardModel, ctx: StyleCtx): StyleOut {
  const hero = m.hero ? `<div class="hero"><div class="v">${m.hero.value}</div><div class="l">${m.hero.label}</div></div>` : '';
  const inner = `<div class="main">
    <header><div class="ttl">${m.title}</div><h2>${m.heading}</h2></header>
    ${hero}
    ${m.line ? `<p class="line">${m.line}</p>` : ''}
  </div>
  <div class="side">${sideHtml(m, ctx.size.name)}</div>
  ${footer()}`;
  return { css: CSS, html: frame(ctx, 'clean', m, inner) };
}

const CSS = `
.st-clean { --hero: 300px; --big: 64px; --body: 44px; --small: 30px; --gap: 48px;
  background: #FFFFFF; color: #10151C; font-family: "Libre Franklin", sans-serif; padding: 130px 72px 64px;
  display: grid; grid-template: "main" auto "side" 1fr "foot" auto / minmax(0, 1fr); gap: var(--gap); }
.st-clean .side { align-self: end; }
.st-clean.size-square { --hero: 210px; --big: 50px; --body: 30px; --small: 22px; --gap: 32px; padding: 64px 64px 44px; }
.st-clean.size-square .items, .st-clean.size-square .tools { grid-template-columns: 1fr 1fr; column-gap: 48px; }
.st-clean.size-wide { --hero: 130px; --big: 40px; --body: 25px; --small: 19px; --gap: 18px 56px; padding: 44px 56px 30px;
  grid-template: "main side" 1fr "foot foot" auto / minmax(0, 1fr) minmax(0, 1fr); }
.st-clean.size-wide .side { align-self: start; }
.st-clean .main { grid-area: main; display: flex; flex-direction: column; gap: var(--gap); min-width: 0; }
.st-clean .side { grid-area: side; display: flex; flex-direction: column; gap: calc(var(--body) * .8); min-width: 0; }
.st-clean .ttl { font-size: var(--small); color: #4B5563; }
.st-clean h2 { margin: 6px 0 0; font: 800 var(--big)/1.05 Archivo, sans-serif; letter-spacing: -.01em; }
.st-clean .hero .v { font: 900 var(--hero)/.86 Archivo, sans-serif; letter-spacing: -.03em; white-space: nowrap; }
.st-clean.card-toolkit .hero .v { font-size: calc(var(--hero) * .45); line-height: 1; white-space: normal; }
.st-clean .hero .l { font: 600 var(--body)/1.2 Archivo, sans-serif; margin-top: calc(var(--body) * .4); color: var(--accent); }
.st-clean .line { margin: 0; font-size: var(--body); line-height: 1.3; color: #374151; max-width: 30ch; }
.st-clean .items { margin: 0; display: grid; }
.st-clean .items div { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; padding: calc(var(--body) * .4) 0; border-top: 2px solid #E3E7EC; }
.st-clean dt { font-size: var(--body); color: #374151; }
.st-clean dd { margin: 0; font: 800 var(--body)/1.2 Archivo, sans-serif; text-align: right; white-space: nowrap; }
.st-clean dd small, .st-clean .sum small { display: block; font: 400 var(--small)/1.2 "Libre Franklin", sans-serif; color: #6B7280; }
.st-clean .sum { display: grid; grid-template-columns: 1fr auto; align-items: baseline; padding-top: calc(var(--body) * .5); border-top: 4px solid #10151C; }
.st-clean .sum span { font: 700 var(--body) Archivo, sans-serif; }
.st-clean .sum b { font: 900 calc(var(--big) * 1.1)/1 Archivo, sans-serif; color: var(--accent); }
.st-clean .sum small { grid-column: 1 / -1; }
.st-clean .bars { display: flex; align-items: flex-end; gap: calc(var(--body) * .3); height: calc(var(--hero) * 1.6); }
.st-clean .bars .b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; }
.st-clean .bars i { display: block; width: 100%; border-radius: 6px 6px 0 0; background: color-mix(in oklab, var(--accent) 30%, #FFFFFF); }
.st-clean .bars .pk i { background: var(--accent); }
.st-clean .bars span { font-size: var(--small); color: #4B5563; }
.st-clean .tools { list-style: none; margin: 0; padding: 0; display: grid; gap: calc(var(--body) * .35); }
.st-clean .tools li { display: grid; grid-template-columns: 1fr auto; gap: 4px 16px; font-size: var(--small); }
.st-clean .tools .n { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-clean .tools .c { font-family: Archivo, sans-serif; font-weight: 700; }
.st-clean .tools i { grid-column: 1 / -1; display: block; height: calc(var(--small) * .45); border-radius: 4px; background: var(--accent); }
.st-clean .repo { grid-area: foot; font-size: var(--small); color: #6B7280; }
`;
