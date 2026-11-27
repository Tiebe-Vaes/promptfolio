import { escapeHtml, fill, num } from '../escape.js';
import { shortDate, t } from '../i18n.js';
import { frame, type SlideCtx, type SlideOut } from '../slide.js';

/** "mcp:Claude_Browser" -> "Claude Browser"; connector IDs were already reduced to "mcp:connector". */
export function toolName(name: string): string {
  if (!name.startsWith('mcp:')) return name;
  const server = name.slice(4);
  return server === 'connector' ? 'Connector' : server.replace(/[_-]+/g, ' ');
}

/** The recap as a session replay in a generic terminal (no Claude Code or Anthropic marks). */
export function render(ctx: SlideCtx): SlideOut {
  const { stats, lang, copy } = ctx;
  if (stats.activity.sessions === 0 && stats.tools.calls === 0) return null;
  const s = t(lang);
  const row = (k: string, v: string, cls = 'v') => `<div class="row"><span class="k">${k}</span><span class="${cls}">${v}</span></div>`;
  const top = stats.tools.top.slice(0, 4);
  const peak = top[0]?.count ?? 1;
  const tools = top.map(x => `<div class="row"><span class="v name">${escapeHtml(toolName(x.name))}</span><span><i class="bar" style="width:${Math.max(3, Math.round(100 * x.count / peak))}%"></i></span></div>`).join('');

  const inner = `<div class="win">
    <div class="dots"><i></i><i></i><i></i></div>
    <div class="p">~ <b>$</b> /promptfolio --year ${stats.year}</div><br>
    <div class="k">${s.reading(stats.activity.activeDays, num(stats.activity.activeDays, lang))}</div>
    <div class="k">${s.done}</div><br>
    ${row(s.sessions.toLowerCase(), num(stats.activity.sessions, lang))}
    ${stats.activity.busiestDay ? row(s.busiestDay, `${shortDate(stats.activity.busiestDay.date, lang)} (${num(stats.activity.busiestDay.messages, lang)} ${s.msgs})`) : ''}
    ${row(s.streak, s.days(stats.activity.longestStreakDays, num(stats.activity.longestStreakDays, lang)))}
    ${stats.files.topLanguage ? row(s.topLanguage, escapeHtml(stats.files.topLanguage), 'hl') : ''}
    ${tools ? `<br><div class="k">${s.topTools}</div>${tools}` : ''}
    ${copy.verdict ? `<br><div class="k">${s.verdict}</div><div class="v verdict">${fill(copy.verdict, stats, lang)}</div>` : ''}
    <br><div class="p">~ <b>$</b> <span class="caret"></span></div>
  </div>`;
  return { css: CSS, html: frame(ctx, 's-term', inner, true) };
}

const CSS = `
.s-term { background: #0D1117; color: #D7DEE8; font: 400 36px/1.5 "IBM Plex Mono", monospace; padding: 150px 70px; }
.s-term .win { border-radius: 24px; background: #161B22; border: 2px solid #262D37; padding: 44px 48px; height: 100%; overflow: hidden; }
.s-term .dots { display: flex; gap: 14px; margin-bottom: 40px; }
.s-term .dots i { width: 22px; height: 22px; border-radius: 50%; background: #2E3743; }
.s-term .p, .s-term .k { color: #8B97A7; }
.s-term .p b { color: #FFFFFF; font-weight: 600; }
.s-term .v { color: #FFFFFF; font-weight: 600; }
.s-term .hl { color: color-mix(in oklab, var(--accent) 60%, #FFFFFF); font-weight: 600; }
.s-term .row { display: grid; grid-template-columns: 360px 1fr; align-items: center; gap: 24px; }
.s-term .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-term .bar { display: block; height: 26px; border-radius: 3px; background: color-mix(in oklab, var(--accent) 60%, #FFFFFF); }
.s-term .verdict { max-width: 860px; }
.s-term .caret { display: inline-block; width: 20px; height: 40px; background: #D7DEE8; vertical-align: -8px; animation: pf-blink 1.1s steps(1) infinite; }
@keyframes pf-blink { 50% { opacity: 0; } }
`;
