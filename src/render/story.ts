import type { Copy, Stats } from '../types.js';
import { BASE_CSS, renderCard, styleCtx } from './cards.js';
import { t, type Lang } from './i18n.js';
import { buildCard, CARD_IDS, type CardModel } from './model.js';
import { page, PROGRESS_CSS } from './shell.js';
import type { StyleId } from './styles/style.js';
import { fontFaceCss, type PaletteId } from './theme.js';

/**
 * The tap-through story: every card that has data, in one style, one at a time, scaled to the window.
 * `pngs` lists the card files that exist (e.g. "cards/clean-tokens-story.png"); others get a screenshot hint.
 */
export function buildStory(opts: { stats: Stats; copy: Copy; style: StyleId; palette?: PaletteId; assetsDir: string; pngs: Set<string> }): string {
  const { stats, copy, style } = opts;
  const lang = copy.language as Lang;
  const s = t(lang);
  const models = CARD_IDS.map(id => buildCard(id, stats, copy)).filter((m): m is CardModel => m !== null);
  const css = new Set<string>([BASE_CSS, PROGRESS_CSS]);
  const slides = models.map((m, i) => {
    const out = renderCard(style, m, styleCtx(stats, copy, 'story', { index: i, total: models.length, progress: true }, opts.palette));
    css.add(out.css);
    const png = `cards/${style}-${m.id}-story.png`;
    const action = opts.pngs.has(png)
      ? `<a class="save" href="${png}" download>${s.save}</a>`
      : `<span class="hint">${s.screenshot}</span>`;
    return `<figure class="frame" data-i="${i}"${i === 0 ? '' : ' hidden'}><div class="fit">${out.html}</div><figcaption>${action}</figcaption></figure>`;
  });

  return page({
    title: `Promptfolio ${stats.year}`,
    lang,
    fontsCss: fontFaceCss(opts.assetsDir),
    css: [...css].join('\n') + VIEWER_CSS,
    body: `<main class="viewer">
  ${slides.join('\n  ')}
  <button class="nav prev" type="button" aria-label="${s.previous}"></button>
  <button class="nav next" type="button" aria-label="${s.next}"></button>
</main>
<script>${VIEWER_JS}</script>`,
  });
}

const VIEWER_CSS = `
/* A safe scale before the script runs, so phones never widen their layout to the 1080px slide. */
:root { --k: 0.3; }
html, body { overflow-x: hidden; }
body { background: #0B0D10; min-height: 100vh; font-family: "Libre Franklin", sans-serif; }
.viewer { position: relative; min-height: 100vh; display: grid; place-items: center; }
.frame { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.frame[hidden] { display: none; }
.fit { width: calc(1080px * var(--k)); height: calc(1920px * var(--k)); border-radius: calc(36px * var(--k)); overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.45); }
.fit > .slide { transform: scale(var(--k)); transform-origin: 0 0; }
figcaption { font-size: 15px; color: #C9D2DD; min-height: 22px; }
.save { color: #FFFFFF; text-decoration: underline; text-underline-offset: 3px; }
.save:focus-visible, .nav:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
.nav { position: fixed; top: 0; bottom: 0; width: 50%; background: none; border: 0; cursor: pointer; }
.nav.prev { left: 0; } .nav.next { right: 0; }
`;

// Plain browser JS: scale to fit, tap or arrow keys to move, auto-advance unless reduced motion; space pauses.
const VIEWER_JS = `
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('.frame'));
  var i = 0, paused = false, timer = null;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fit() {
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var k = Math.min((vw - 32) / 1080, (vh - 72) / 1920);
    document.documentElement.style.setProperty('--k', String(Math.max(0.1, k)));
  }
  function show(n) {
    i = Math.max(0, Math.min(frames.length - 1, n));
    frames.forEach(function (f, j) { f.hidden = j !== i; });
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!calm && !paused && i < frames.length - 1) timer = setTimeout(function () { show(i + 1); }, 7000);
  }
  document.querySelector('.nav.next').addEventListener('click', function () { show(i + 1); });
  document.querySelector('.nav.prev').addEventListener('click', function () { show(i - 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === ' ') { e.preventDefault(); paused = !paused; schedule(); }
  });
  window.addEventListener('resize', fit);
  fit(); show(0);
})();
`;
