import type { Stats } from '../../types.js';
import { footer } from './style.js';
import { t } from '../i18n.js';
import type { CardModel } from '../model.js';
import { INK } from '../theme.js';
import { sideHtml } from './clean.js';
import { frame, type StyleCtx, type StyleOut } from './style.js';

/** Card level from year tokens: 1 to 99, logarithmic so heavy users still have room to grow. */
export function level(yearTokens: number): number {
  return Math.max(1, Math.min(99, Math.floor(Math.log2(yearTokens / 1e6 + 1) * 5)));
}

/** Rarity from how many measurable habits reach their threshold. */
export function rarity(stats: Stats): 'common' | 'rare' | 'legendary' {
  const strong = stats.strengthCandidates.filter(c => c.score >= 1).length;
  return strong >= 4 ? 'legendary' : strong >= 2 ? 'rare' : 'common';
}

/** A mirrored 12x12 pixel creature, seeded from the user's stats, so every pack gets its own. */
export function sprite(stats: Stats, accent: string, deep: string): string {
  const key = `${stats.activity.sessions}|${stats.tools.bash}|${stats.tools.testRuns}|${stats.tools.commits}|${stats.files.topLanguage ?? ''}`;
  let seed = 2166136261;
  for (const ch of key) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return (seed >>> 8) / 0x1000000;
  };
  const colors = [deep, accent, INK];
  const rects: string[] = [];
  for (let y = 1; y < 11; y++) {
    for (let x = 1; x < 6; x++) {
      if (rnd() < (x === 1 || y === 1 || y === 10 ? 0.35 : 0.62)) {
        const fill = colors[Math.floor(rnd() * colors.length)];
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`, `<rect x="${11 - x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
      }
    }
  }
  rects.push('<rect x="4" y="4" width="1" height="1" fill="#FFFFFF"/>', '<rect x="7" y="4" width="1" height="1" fill="#FFFFFF"/>');
  return `<svg viewBox="0 0 12 12" width="260" height="260" shape-rendering="crispEdges" role="img" aria-label="creature">${rects.join('')}</svg>`;
}

/** Trading card: the four cards read as one booster pack, same creature, numbered 1/4 to 4/4. */
export function render(m: CardModel, ctx: StyleCtx): StyleOut {
  const s = t(ctx.lang);
  const lv = level(ctx.stats.tokens.yearTotal);
  const rare = s.rarity[rarity(ctx.stats)];
  const hero = m.hero ? `<div class="hero"><b>${m.hero.value}</b><span>${m.hero.label}</span></div>` : '';
  const cardHtml = `<div class="card"><div class="face">
    <div class="top"><div class="name">${m.title}</div><div class="lv">${s.level} <b>${lv}</b></div></div>
    <div class="window">${sprite(ctx.stats, ctx.theme.accent, ctx.theme.deep)}</div>
    <div class="type">${m.heading}</div>
    ${hero}
    <div class="side">${sideHtml(m, ctx.size.name, 6)}</div>
    ${m.line ? `<p class="flavor">${m.line}</p>` : ''}
    <div class="bottom"><span>${m.index}/${m.total}</span><span>${rare}</span></div>
  </div></div>`;
  const aside = ctx.size.name === 'wide'
    ? `<div class="aside"><div class="aname">${m.title}</div><div class="ameta">${m.heading}, ${s.level} ${lv}, ${rare}</div>${m.line ? `<p>${m.line}</p>` : ''}</div>`
    : '';
  return { css: CSS, html: frame(ctx, 'card', m, `<div class="stage">${cardHtml}</div>${aside}${footer()}`) };
}

const CSS = `
.st-card { --body: 32px; --small: 24px; background: #E9ECF1; font-family: Archivo, sans-serif; color: #10151C; }
.st-card .stage { position: absolute; inset: 0 0 60px; display: grid; place-items: center; }
.st-card .card { width: 860px; height: 1440px; border-radius: 40px; padding: 26px; background: var(--deep); box-shadow: 0 60px 110px rgba(16,21,28,.35); transform: rotate(1.2deg); }
.st-card.size-square .card { zoom: .64; }
.st-card.size-wide .stage { right: auto; width: 560px; bottom: 30px; }
.st-card.size-wide .card { zoom: .42; }
.st-card .face { height: 100%; border-radius: 22px; background: #F7F8FA; padding: 30px 40px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
.st-card .top { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.st-card .name { font: 900 80px/1 "Big Shoulders Display", sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-card .lv { font-weight: 700; font-size: 36px; color: var(--deep); white-space: nowrap; }
.st-card .lv b { font-size: 58px; }
.st-card .window { height: 300px; flex: none; border-radius: 14px; border: 6px solid var(--deep); background: color-mix(in oklab, var(--accent) 14%, #F7F8FA); display: grid; place-items: center; }
.st-card .type { font-size: 30px; font-weight: 700; color: var(--deep); }
.st-card .hero b { display: block; font: 900 120px/.9 Archivo, sans-serif; letter-spacing: -.02em; white-space: nowrap; }
.st-card.card-toolkit .hero b { font-size: 72px; }
.st-card .hero span { font-size: var(--small); color: #4B5563; }
.st-card .side { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.st-card .items { margin: 0; display: grid; }
.st-card .items div { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; padding: 9px 0; border-top: 3px solid #D5DAE1; }
.st-card dt { font-size: var(--body); color: #374151; }
.st-card dd { margin: 0; font: 800 var(--body)/1.2 Archivo, sans-serif; color: var(--deep); text-align: right; white-space: nowrap; }
.st-card dd small, .st-card .sum small { display: block; font-size: 20px; font-weight: 400; color: #6B7280; }
.st-card .sum { display: grid; grid-template-columns: 1fr auto; align-items: baseline; border-top: 4px solid var(--deep); padding-top: 10px; }
.st-card .sum span { font-size: var(--body); font-weight: 700; }
.st-card .sum b { font-size: 56px; font-weight: 900; color: var(--deep); }
.st-card .sum small { grid-column: 1 / -1; }
.st-card .bars { display: flex; align-items: flex-end; gap: 8px; height: 180px; }
.st-card .bars .b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px; }
.st-card .bars i { display: block; width: 100%; border-radius: 4px 4px 0 0; background: color-mix(in oklab, var(--accent) 35%, #F7F8FA); }
.st-card .bars .pk i { background: var(--deep); }
.st-card .bars span { font-size: 20px; color: #4B5563; }
.st-card .tools { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.st-card .tools li { display: grid; grid-template-columns: 1fr auto; gap: 2px 14px; font-size: 26px; }
.st-card .tools .n { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-card .tools .c { font-weight: 800; color: var(--deep); }
.st-card .tools i { grid-column: 1 / -1; display: block; height: 10px; border-radius: 3px; background: var(--accent); }
.st-card .flavor { margin: 0; font: 400 28px/1.3 "Libre Franklin", sans-serif; color: #4B5563; }
.st-card .bottom { margin-top: auto; display: flex; justify-content: space-between; font-size: 26px; font-weight: 700; color: #4B5563; border-top: 3px solid #D5DAE1; padding-top: 12px; }
.st-card .aside { position: absolute; left: 600px; right: 56px; top: 0; bottom: 60px; display: flex; flex-direction: column; justify-content: center; }
.st-card .aname { font: 900 96px/.95 "Big Shoulders Display", sans-serif; }
.st-card .ameta { font-size: 28px; font-weight: 700; color: var(--deep); margin-top: 16px; }
.st-card .aside p { font: 400 28px/1.3 "Libre Franklin", sans-serif; color: #4B5563; margin: 20px 0 0; }
.st-card .repo { position: absolute; left: 0; right: 0; bottom: 22px; text-align: center; font: 400 var(--small) "Libre Franklin", sans-serif; color: #4B5563; }
.st-card.size-wide .repo { font-size: 18px; bottom: 14px; }
`;
