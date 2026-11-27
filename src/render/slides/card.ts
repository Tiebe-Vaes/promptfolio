import type { Stats } from '../../types.js';
import { escapeHtml, fill } from '../escape.js';
import { t } from '../i18n.js';
import { frame, type SlideCtx, type SlideOut } from '../slide.js';
import { INK } from '../theme.js';

/** Card level from year tokens: 1 to 99, logarithmic so heavy users still have room to grow. */
export function level(yearTokens: number): number {
  return Math.max(1, Math.min(99, Math.floor(Math.log2(yearTokens / 1e6 + 1) * 5)));
}

/** Rarity from how many measurable habits reach their threshold. */
export function rarity(stats: Stats): 'common' | 'rare' | 'legendary' {
  const strong = stats.strengthCandidates.filter(c => c.score >= 1).length;
  return strong >= 4 ? 'legendary' : strong >= 2 ? 'rare' : 'common';
}

/** A mirrored 12x12 pixel creature, seeded from the user's stats, so every card gets its own. */
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
  return `<svg viewBox="0 0 12 12" width="360" height="360" shape-rendering="crispEdges" role="img" aria-label="creature">${rects.join('')}</svg>`;
}

/** The fun and roast closer: a trading card built from the persona and real move values. */
export function render(ctx: SlideCtx): SlideOut {
  const { stats, lang, copy } = ctx;
  const p = copy.persona;
  if (!p || !p.moves || p.moves.length === 0) return null;
  const s = t(lang);
  const lv = level(stats.tokens.yearTotal);
  const rare = s.rarity[rarity(stats)];
  const moves = p.moves.map(m => `<div class="move"><b>${fill(m.name, stats, lang)}</b><span>${fill(m.value, stats, lang)}</span><p>${fill(m.text, stats, lang)}</p></div>`).join('');
  const typeLine = s.classLine(escapeHtml(stats.files.topLanguage ?? 'Polyglot'), String(stats.activity.sessions), stats.year);

  const cardHtml = `<div class="card"><div class="face">
    <div class="top"><div class="name">${fill(p.className, stats, lang)}</div><div class="lv">${s.level} <b>${lv}</b></div></div>
    <div class="window">${sprite(stats, ctx.theme.accent, ctx.theme.deep)}</div>
    <div class="type">${typeLine}</div>
    ${moves}
    <div class="bottom"><span>${s.weakness}: ${fill(p.weakness, stats, lang)}</span><span>${s.nemesis}: ${fill(p.nemesis, stats, lang)}</span><span>${rare}</span></div>
  </div></div>`;
  const side = ctx.size.name === 'landscape'
    ? `<div class="side"><div class="sname">${fill(p.className, stats, lang)}</div><div class="smeta">${s.level} ${lv}, ${rare}</div><p>${fill(p.specialMove, stats, lang)}</p></div>`
    : '';
  return { css: CSS, html: frame(ctx, 's-card', `<div class="stage">${cardHtml}</div>${side}`) };
}

const CSS = `
.s-card { background: #E9ECF1; font-family: Archivo, sans-serif; }
.s-card .stage { position: absolute; inset: 0; display: grid; place-items: center; }
.s-card .card { width: 860px; height: 1220px; border-radius: 40px; padding: 26px; background: var(--deep); box-shadow: 0 60px 110px rgba(16,21,28,.35); transform: rotate(1.2deg); }
.s-card .face { height: 100%; border-radius: 22px; background: #F7F8FA; padding: 34px 40px; display: flex; flex-direction: column; }
.s-card .top { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.s-card .name { font: 900 88px/1 "Big Shoulders Display", sans-serif; color: #10151C; }
.s-card .lv { font-weight: 700; font-size: 40px; color: var(--deep); white-space: nowrap; }
.s-card .lv b { font-size: 64px; }
.s-card .window { margin-top: 22px; height: 470px; border-radius: 14px; border: 6px solid var(--deep); background: color-mix(in oklab, var(--accent) 14%, #F7F8FA); display: grid; place-items: center; }
.s-card .type { font-size: 30px; line-height: 1.3; color: #4B5563; margin: 14px 0 18px; }
.s-card .move { display: grid; grid-template-columns: 1fr auto; align-items: baseline; padding: 18px 0; border-top: 3px solid #D5DAE1; }
.s-card .move b { font-size: 46px; font-weight: 800; color: #10151C; }
.s-card .move span { font-size: 54px; font-weight: 900; color: var(--deep); }
.s-card .move p { grid-column: 1 / -1; margin: 6px 0 0; font-size: 30px; color: #4B5563; }
.s-card .bottom { margin-top: auto; display: flex; justify-content: space-between; gap: 16px; font-size: 26px; line-height: 1.3; color: #4B5563; border-top: 3px solid #D5DAE1; padding-top: 16px; }
.s-card.size-feed .card { transform: rotate(1.2deg) scale(.98); }
.s-card.size-landscape .stage { right: auto; width: 520px; }
.s-card.size-landscape .card { transform: rotate(1.2deg) scale(.48); }
.s-card .side { position: absolute; left: 560px; right: 64px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; color: #10151C; }
.s-card .sname { font: 900 104px/.95 "Big Shoulders Display", sans-serif; }
.s-card .smeta { font-size: 34px; font-weight: 700; color: var(--deep); margin-top: 18px; }
.s-card .side p { font-size: 32px; line-height: 1.3; color: #4B5563; margin: 24px 0 0; }
`;
