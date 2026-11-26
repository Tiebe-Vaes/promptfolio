import path from 'node:path';
import { findTranscripts } from './jsonl.js';
import { computeEquivalents } from './equivalents.js';
import { readHistory } from './sources/history.js';
import { readStatsCache } from './sources/statsCache.js';
import { readTooling } from './sources/tooling.js';
import { readTranscripts } from './sources/transcripts.js';
import { longestGap, longestStreak } from './streaks.js';
import { strengthCandidates } from './strengths.js';
import type { DailyActivity, ProjectEntry, Stats } from './types.js';

const LANGUAGES: Record<string, string> = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript',
  '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.py': 'Python', '.java': 'Java', '.kt': 'Kotlin', '.cs': 'C#', '.go': 'Go', '.rs': 'Rust',
  '.rb': 'Ruby', '.php': 'PHP', '.swift': 'Swift', '.css': 'CSS', '.scss': 'CSS', '.html': 'HTML',
  '.sql': 'SQL', '.md': 'Markdown', '.json': 'Config', '.yaml': 'Config', '.yml': 'Config', '.toml': 'Config',
};

const DEFAULT_RETENTION_DAYS = 30;

const share = (part: number, whole: number): number => (whole > 0 ? part / whole : 0);
const maxEntry = (o: Record<string, number>): string | null =>
  Object.entries(o).sort(([a, x], [b, y]) => y - x || a.localeCompare(b))[0]?.[0] ?? null;
const baseName = (p: string): string => (p.includes('\\') ? path.win32.basename(p) : path.posix.basename(p));

export async function buildStats(opts: { claudeDir: string; year: number; tz: string; now: Date }): Promise<Stats> {
  const { claudeDir, year, tz } = opts;
  const y = String(year);
  const inYear = (date: string) => date.startsWith(y);

  const [cache, history, tooling, transcripts] = await Promise.all([
    readStatsCache(path.join(claudeDir, 'stats-cache.json')),
    readHistory(path.join(claudeDir, 'history.jsonl'), { year, tz }),
    readTooling(claudeDir),
    findTranscripts(path.join(claudeDir, 'projects')).then(files => readTranscripts(files, { year, tz })),
  ]);

  // stats-cache is authoritative up to its last computed date, transcripts after it.
  const through = cache.through;
  const fromCache = (date: string) => through !== null && date <= through;
  const daily: DailyActivity[] = [
    ...cache.daily.filter(d => inYear(d.date) && fromCache(d.date)),
    ...transcripts.daily.filter(d => !fromCache(d.date)),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const byModel: Record<string, number> = {};
  for (const d of [...cache.dailyTokens.filter(d => inYear(d.date) && fromCache(d.date)), ...transcripts.dailyTokens.filter(d => !fromCache(d.date))]) {
    for (const [m, n] of Object.entries(d.tokensByModel)) if (typeof n === 'number') byModel[m] = (byModel[m] ?? 0) + n;
  }

  const months = new Map<string, { activeDays: number; messages: number; sessions: number }>();
  for (const d of daily) {
    const m = months.get(d.date.slice(0, 7)) ?? { activeDays: 0, messages: 0, sessions: 0 };
    m.activeDays++;
    m.messages += d.messages;
    m.sessions += d.sessions;
    months.set(d.date.slice(0, 7), m);
  }
  const byMonth = [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  const dates = daily.map(d => d.date);
  const busiestDay = daily.reduce<DailyActivity | null>((best, d) => (!best || d.messages > best.messages ? d : best), null);
  const busiestMonth = byMonth.reduce<(typeof byMonth)[number] | null>((best, m) => (!best || m.messages > best.messages ? m : best), null);

  const projectSource: Record<string, { sessions: number; branches: string[]; titles: string[] }> =
    Object.keys(transcripts.projects).length > 0
      ? transcripts.projects
      : Object.fromEntries(Object.entries(history.projects).map(([k, n]) => [k, { sessions: n, branches: [], titles: [] }]));
  const list: ProjectEntry[] = Object.entries(projectSource)
    .map(([key, p]) => ({ key, label: baseName(key), sessions: p.sessions, titles: [...p.titles], branches: [...p.branches] }))
    .sort((a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label));

  const languageCounts: Record<string, number> = {};
  for (const [ext, n] of Object.entries(transcripts.files.byExtension)) {
    const lang = LANGUAGES[ext];
    if (lang) languageCounts[lang] = (languageCounts[lang] ?? 0) + n;
  }

  const modeTotal = Object.values(transcripts.permissionModes).reduce((a, b) => a + b, 0);
  const ls = cache.longestSession;
  const yearFrom = [dates[0], history.from, transcripts.from].filter((d): d is string => !!d).sort()[0] ?? null;

  const stats: Stats = {
    schemaVersion: 1,
    year,
    generatedAt: opts.now.toISOString(),
    tz,
    coverage: {
      yearFrom,
      statsCacheThrough: through,
      detailedFrom: transcripts.from,
      detailedTo: transcripts.to,
      historyFrom: history.from,
    },
    retention: { cleanupPeriodDays: tooling.cleanupPeriodDays, effectiveDays: tooling.cleanupPeriodDays ?? DEFAULT_RETENTION_DAYS },
    activity: {
      activeDays: daily.length,
      sessions: daily.reduce((a, d) => a + d.sessions, 0),
      messages: daily.reduce((a, d) => a + d.messages, 0),
      toolCalls: daily.reduce((a, d) => a + d.toolCalls, 0),
      longestStreakDays: longestStreak(dates),
      longestGapDays: longestGap(dates),
      busiestDay: busiestDay ? { date: busiestDay.date, messages: busiestDay.messages } : null,
      busiestMonth: busiestMonth ? { month: busiestMonth.month, messages: busiestMonth.messages } : null,
      hourCounts: history.hourCounts,
      lateNightSessionShare: share(history.lateNightSessions, history.sessions),
      byMonth,
    },
    tokens: { yearTotal: Object.values(byModel).reduce((a, b) => a + b, 0), byModel, detailed: transcripts.tokens },
    prompts: {
      count: history.prompts,
      slashCommands: history.slashCommands,
      politeness: history.politeness,
      corrections: history.corrections,
      languages: history.languages,
      byMonth: history.byMonth,
    },
    tools: {
      ...transcripts.tools,
      top: Object.entries(transcripts.tools.byName).sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).slice(0, 10)
        .map(([name, count]) => ({ name, count })),
    },
    denials: {
      userRejected: transcripts.denials.userRejected,
      automatic: transcripts.denials.automatic,
      topDeniedTool: maxEntry(Object.fromEntries(Object.entries(transcripts.denials.byTool).filter(([k]) => k !== 'unknown'))),
    },
    modes: { planShare: share(transcripts.permissionModes.plan ?? 0, modeTotal), byMode: transcripts.permissionModes },
    effort: transcripts.effort,
    entrypoints: transcripts.entrypoints,
    files: {
      edited: transcripts.files.edited,
      byLanguage: Object.entries(languageCounts).sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([language, count]) => ({ language, count })),
    },
    sessions: {
      ...transcripts.sessions,
      longestMinutesYear: ls && ls.timestamp && inYear(ls.timestamp.slice(0, 10)) ? Math.round(ls.durationMs / 60000) : null,
    },
    projects: { count: list.length, branchCount: list.reduce((a, p) => a + p.branches.length, 0), list },
    tooling: { skills: tooling.skills, agents: tooling.agents, hooks: tooling.hooks, plugins: tooling.plugins },
    strengthCandidates: [],
    equivalents: computeEquivalents(history.prompts),
  };
  stats.strengthCandidates = strengthCandidates(stats);
  return stats;
}
