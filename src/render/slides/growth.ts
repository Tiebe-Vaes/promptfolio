import { fill, num } from '../escape.js';
import { shortMonth } from '../i18n.js';
import { frame, type SlideCtx, type SlideOut } from '../slide.js';

/** Every month from the first to the last active month, with quiet months as zero. */
function monthSeries(byMonth: { month: string; messages: number }[]): { month: string; messages: number }[] {
  if (byMonth.length === 0) return [];
  const map = new Map(byMonth.map(m => [m.month, m.messages]));
  const out: { month: string; messages: number }[] = [];
  let [y, m] = byMonth[0].month.split('-').map(Number);
  const last = byMonth.at(-1)!.month;
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push({ month: key, messages: map.get(key) ?? 0 });
    if (key >= last) break;
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

/** The professional closer: messages per month as one line, the growth heading and three strengths. */
export function render(ctx: SlideCtx): SlideOut {
  const { stats, lang, copy } = ctx;
  const g = stats.activity.growth;
  // "1 times busier" is not a story: the slide needs at least a doubling.
  if (!g || g.factor < 2 || !copy.growthLine || !copy.profile) return null;
  const series = monthSeries(stats.activity.byMonth);
  const max = Math.max(...series.map(m => m.messages), 1);
  const W = 952, H = 560;
  const x = (i: number) => 20 + i * ((W - 40) / Math.max(1, series.length - 1));
  const y = (v: number) => H - 80 - (H - 160) * (v / max);
  const pts = series.map((m, i) => [x(i), y(m.messages)] as const);
  const line = 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  const area = `M${pts[0][0].toFixed(1)} ${H - 80} L` + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + ` L${pts.at(-1)![0].toFixed(1)} ${H - 80} Z`;
  const pk = series.findIndex(m => m.month === g.peak.month);
  const labels = series.map((m, i) => `<text x="${x(i).toFixed(1)}" y="${H - 24}" text-anchor="middle">${shortMonth(m.month, lang)}</text>`).join('');
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${num(g.peak.messages, lang)}">
    <path d="${area}" fill="color-mix(in oklab, var(--accent) 16%, #FFFFFF)"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="draw"/>
    <circle cx="${pts[0][0].toFixed(1)}" cy="${pts[0][1].toFixed(1)}" r="14" fill="#10151C"/>
    ${pk >= 0 ? `<circle cx="${pts[pk][0].toFixed(1)}" cy="${pts[pk][1].toFixed(1)}" r="14" fill="#10151C"/><text x="${(pts[pk][0] - 24).toFixed(1)}" y="${(pts[pk][1] - 28).toFixed(1)}" text-anchor="end" class="peak">${num(g.peak.messages, lang)}</text>` : ''}
    ${labels}
  </svg>`;
  const strengths = copy.profile.strengths.slice(0, 3).map(st => `<li>${fill(st.text, stats, lang)}</li>`).join('');
  const inner = `${chart}<div class="copy"><h2>${fill(copy.growthLine, stats, lang)}</h2><ul>${strengths}</ul></div>`;
  return { css: CSS, html: frame(ctx, 's-grow', inner) };
}

const CSS = `
.s-grow { background: #FFFFFF; color: #10151C; font-family: Archivo, sans-serif; }
.s-grow .chart { position: absolute; top: 120px; left: 64px; width: 952px; height: 560px; overflow: visible; }
.s-grow .chart text { font-size: 30px; fill: #4B5563; font-family: Archivo, sans-serif; }
.s-grow .chart .peak { fill: #10151C; font-weight: 700; }
.s-grow .draw { stroke-dasharray: 1; stroke-dashoffset: 0; animation: pf-draw 1.4s cubic-bezier(.22,1,.36,1) both; }
@keyframes pf-draw { from { stroke-dashoffset: 1; } }
.s-grow .copy { position: absolute; left: 72px; right: 72px; top: 780px; }
.s-grow h2 { margin: 0; font-weight: 900; font-size: 128px; line-height: .94; letter-spacing: -.02em; }
.s-grow ul { list-style: none; padding: 0; margin: 56px 0 0; display: grid; gap: 0; }
.s-grow li { font-size: 44px; line-height: 1.25; padding: 26px 0; border-top: 3px solid #E3E7EC; color: #374151; }
.s-grow.size-feed .chart { top: 90px; height: 420px; }
.s-grow.size-feed .copy { top: 560px; }
.s-grow.size-feed h2 { font-size: 96px; }
.s-grow.size-feed li { font-size: 36px; padding: 18px 0; }
.s-grow.size-landscape .chart { top: 80px; left: 40px; width: 600px; height: 400px; }
.s-grow.size-landscape .copy { left: 680px; right: 48px; top: 70px; }
.s-grow.size-landscape h2 { font-size: 64px; }
.s-grow.size-landscape ul { margin-top: 28px; }
.s-grow.size-landscape li { font-size: 26px; padding: 14px 0; }
`;
