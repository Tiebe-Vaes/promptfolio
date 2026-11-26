import { readJsonl } from '../jsonl.js';
import { classifyLanguage, CORRECTION_PHRASES, countMatches, POLITE_WORDS } from '../text.js';
import { localDate, localHour, localMonth } from '../time.js';

export interface HistoryStats {
  from: string | null;
  prompts: number;
  slashCommands: number;
  politeness: number;
  corrections: number;
  languages: { en: number; nl: number; other: number };
  hourCounts: number[];
  sessions: number;
  lateNightSessions: number;
  /** project path -> prompts */
  projects: Record<string, number>;
  /** YYYY-MM ascending, only months with prompts */
  byMonth: { month: string; prompts: number; corrections: number }[];
}

/** Aggregates ~/.claude/history.jsonl for one year. Prompt text is counted, never kept. */
export async function readHistory(file: string, opts: { year: number; tz: string }): Promise<HistoryStats> {
  const h: HistoryStats = {
    from: null, prompts: 0, slashCommands: 0, politeness: 0, corrections: 0,
    languages: { en: 0, nl: 0, other: 0 }, hourCounts: Array(24).fill(0),
    sessions: 0, lateNightSessions: 0, projects: {}, byMonth: [],
  };
  const firstBySession = new Map<string, number>();
  const months = new Map<string, { prompts: number; corrections: number }>();
  const year = String(opts.year);

  for await (const row of readJsonl(file)) {
    const r = row as { display?: unknown; timestamp?: unknown; project?: unknown; sessionId?: unknown };
    if (typeof r.display !== 'string' || typeof r.timestamp !== 'number') continue;
    const date = localDate(r.timestamp, opts.tz);
    if (!date.startsWith(year)) continue;

    if (typeof r.sessionId === 'string') {
      const prev = firstBySession.get(r.sessionId);
      if (prev === undefined || r.timestamp < prev) firstBySession.set(r.sessionId, r.timestamp);
    }
    if (r.display.trimStart().startsWith('/')) {
      h.slashCommands++;
      continue;
    }
    if (!h.from || date < h.from) h.from = date;
    h.prompts++;
    const corrections = countMatches(r.display, CORRECTION_PHRASES);
    h.politeness += countMatches(r.display, POLITE_WORDS);
    h.corrections += corrections;
    h.languages[classifyLanguage(r.display)]++;
    h.hourCounts[localHour(r.timestamp, opts.tz)]++;
    if (typeof r.project === 'string') h.projects[r.project] = (h.projects[r.project] ?? 0) + 1;
    const m = months.get(localMonth(r.timestamp, opts.tz)) ?? { prompts: 0, corrections: 0 };
    m.prompts++;
    m.corrections += corrections;
    months.set(localMonth(r.timestamp, opts.tz), m);
  }

  h.sessions = firstBySession.size;
  for (const ts of firstBySession.values()) if (localHour(ts, opts.tz) < 5) h.lateNightSessions++;
  h.byMonth = [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  return h;
}
