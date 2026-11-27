import type { Copy, Stats } from '../types.js';
import { compact, escapeHtml, fill, num } from './escape.js';
import { longMonth, shortDate, shortMonth, t, type Lang } from './i18n.js';

export type CardId = 'tokens' | 'year' | 'toolkit' | 'growth';
export const CARD_IDS: CardId[] = ['tokens', 'year', 'toolkit', 'growth'];

/** One card's content, the same in every style. Every string is already HTML-escaped and number-formatted. */
export interface CardModel {
  id: CardId;
  /** Position among the picked cards that render, 1-based. */
  index: number;
  total: number;
  title: string;
  heading: string;
  hero: { value: string; label: string } | null;
  /** Growth only: one bar per month, quiet months as 0. */
  bars: { label: string; value: number; peak: boolean }[];
  /** Toolkit only: top 10, share = count / top count. */
  tools: { name: string; count: string; share: number }[];
  items: { label: string; value: string; note?: string }[];
  /** Year only: the API value. */
  sum: { label: string; value: string; note: string } | null;
  line: string;
  year: number;
}

/** "mcp:Claude_Browser" -> "Claude Browser"; long names are cut to 18 characters. */
export function toolName(name: string): string {
  const server = name.startsWith('mcp:') ? name.slice(4) : null;
  const out = server === null ? name : server === 'connector' ? 'Connector' : server.replace(/[_-]+/g, ' ');
  return out.length > 18 ? `${out.slice(0, 15)}...` : out;
}

/** "claude-opus-5-5" -> "Opus 5.5", "claude-haiku-4-5-20251001" -> "Haiku 4.5". */
export function modelLabel(id: string): string {
  if (!id.startsWith('claude-')) return id;
  const [family, ...version] = id.slice(7).replace(/-\d{8}$/, '').split('-');
  return `${family.charAt(0).toUpperCase()}${family.slice(1)}${version.length ? ` ${version.join('.')}` : ''}`;
}

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

/** The skip rules: a card without its core data does not render. */
function hasCard(id: CardId, stats: Stats): boolean {
  switch (id) {
    case 'tokens': return stats.tokens.yearTotal > 0;
    case 'year': return stats.prompts.count + stats.activity.toolCalls > 0;
    case 'toolkit': return stats.tools.top.length > 0;
    case 'growth': return stats.activity.byMonth.length >= 2;
  }
}

export function buildCard(id: CardId, stats: Stats, copy: Copy, picked: CardId[] = CARD_IDS): CardModel | null {
  if (!hasCard(id, stats)) return null;
  const lang = copy.language as Lang;
  const s = t(lang).card;
  const n = (v: number) => num(v, lang);
  const items: CardModel['items'] = [];
  const add = (label: string, value: number | null | undefined, text?: string, note?: string) => {
    if (value) items.push({ label: escapeHtml(label), value: escapeHtml(text ?? n(value)), ...(note ? { note: escapeHtml(note) } : {}) });
  };
  const shown = picked.filter(c => hasCard(c, stats));
  const base = {
    id, index: shown.indexOf(id) + 1, total: shown.length, year: stats.year,
    title: fill(copy.title, stats, lang), heading: escapeHtml(s[id]),
    line: fill((id === 'growth' ? copy.lines.growth : copy.lines[id]) ?? '', stats, lang),
    bars: [] as CardModel['bars'], tools: [] as CardModel['tools'], sum: null as CardModel['sum'],
  };

  if (id === 'tokens') {
    const since = stats.tokens.usageFrom ? t(lang).since(shortDate(stats.tokens.usageFrom, lang)) : undefined;
    add(s.written, stats.tokens.yearOutput, stats.tokens.yearOutput ? compact(stats.tokens.yearOutput, lang) : undefined, since);
    const fav = stats.tokens.favoriteModel;
    if (fav) add(s.favorite, 1, `${modelLabel(fav.model)}, ${Math.round(fav.share * 100)}%`);
    const eq = new Map(stats.equivalents.map(e => [e.id, e.value]));
    // A value that rounds to 0 ("0 Wh", "0 glasses") says nothing; leave it out.
    const wh = eq.get('energy');
    if (wh && wh >= 0.5) add(s.energy, wh, `${n(wh)} Wh`, s.estimate);
    const water = eq.get('water');
    if (water && water >= 0.05) add(s.water, water, s.glasses(num(water, lang, 1)), s.estimate);
    return { ...base, hero: { value: compact(stats.tokens.yearTotal, lang), label: escapeHtml(s.tokensYear) }, items };
  }

  if (id === 'year') {
    add(s.prompts, stats.prompts.count);
    add(s.slash, stats.prompts.slashCommands);
    add(s.politeness, stats.prompts.politeness);
    add(s.toolCalls, stats.activity.toolCalls);
    add(s.commits, stats.tools.commits);
    add(s.webSearches, stats.tools.webSearches);
    add(s.subagents, stats.sessions.subagentSessions);
    add(s.filesEdited, stats.files.edited);
    const api = stats.apiValue;
    const sum = api && api.usd >= 1
      ? { label: escapeHtml(s.apiValue), value: `$${n(Math.round(api.usd))}`, note: escapeHtml(stats.tokens.usageFrom ? `${s.apiNote}, ${t(lang).since(shortDate(stats.tokens.usageFrom, lang))}` : s.apiNote) }
      : null;
    return { ...base, hero: null, items, sum };
  }

  if (id === 'toolkit') {
    const top = stats.tools.top.slice(0, 10);
    const peak = top[0].count || 1;
    const langs = stats.files.byLanguage.length;
    add(s.languages, langs, undefined, stats.files.topLanguage ? s.topFirst(stats.files.topLanguage) : undefined);
    const tl = stats.tooling;
    const setup = [tl.skills ? s.skills(tl.skills, n(tl.skills)) : '', tl.agents ? s.agents(tl.agents, n(tl.agents)) : '', tl.hooks ? s.hooks(tl.hooks, n(tl.hooks)) : ''].filter(Boolean).join(', ');
    add(s.setup, tl.total, setup);
    add(s.plugins, tl.plugins);
    return {
      ...base, items, hero: { value: escapeHtml(toolName(top[0].name)), label: escapeHtml(s.topTools) },
      tools: top.map(x => ({ name: escapeHtml(toolName(x.name)), count: n(x.count), share: x.count / peak })),
    };
  }

  const g = stats.activity.growth;
  const series = monthSeries(stats.activity.byMonth);
  add(s.messages, stats.activity.messages);
  const bm = stats.activity.busiestMonth;
  if (bm) add(s.busiestMonth, bm.messages, longMonth(bm.month, lang), s.msgs(n(bm.messages)));
  add(s.streak, stats.activity.longestStreakDays, s.days(stats.activity.longestStreakDays, n(stats.activity.longestStreakDays)));
  add(s.gap, stats.activity.longestGapDays, s.days(stats.activity.longestGapDays, n(stats.activity.longestGapDays)));
  const hero = g && g.factor >= 2
    ? { value: `${n(g.factor)}x`, label: escapeHtml(s.busier(shortMonth(g.first.month, lang), shortMonth(g.peak.month, lang))) }
    : { value: n(stats.activity.messages), label: escapeHtml(s.messagesYear) };
  return {
    ...base, hero, items,
    bars: series.map(m => ({ label: escapeHtml(shortMonth(m.month, lang)), value: m.messages, peak: !!g && m.month === g.peak.month })),
  };
}
