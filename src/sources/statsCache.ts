import fs from 'node:fs';
import type { DailyActivity, TokenSplit } from '../types.js';

export interface StatsCacheData {
  through: string | null;
  daily: DailyActivity[];
  dailyTokens: { date: string; tokensByModel: Record<string, number> }[];
  firstSessionDate: string | null;
  longestSession: { durationMs: number; messages: number; timestamp: string } | null;
  /** All-time token split per model (no dates). */
  modelUsage: Record<string, TokenSplit>;
}

const EMPTY: StatsCacheData = { through: null, daily: [], dailyTokens: [], firstSessionDate: null, longestSession: null, modelUsage: {} };
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export async function readStatsCache(file: string): Promise<StatsCacheData> {
  let raw: any;
  try {
    raw = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  } catch {
    return { ...EMPTY };
  }
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const ls = raw.longestSession;
  const daily: DailyActivity[] = arr(raw.dailyActivity)
    .filter(d => typeof d?.date === 'string')
    .map(d => ({ date: d.date, messages: num(d.messageCount), sessions: num(d.sessionCount), toolCalls: num(d.toolCallCount) }));
  return {
    // Without lastComputedDate, the latest cached day is the best cutoff we have.
    through: str(raw.lastComputedDate) ?? (daily.map(d => d.date).sort().at(-1) ?? null),
    daily,
    dailyTokens: arr(raw.dailyModelTokens)
      .filter(d => typeof d?.date === 'string' && d.tokensByModel && typeof d.tokensByModel === 'object')
      .map(d => ({ date: d.date, tokensByModel: d.tokensByModel })),
    firstSessionDate: str(raw.firstSessionDate),
    modelUsage: Object.fromEntries(Object.entries(raw.modelUsage && typeof raw.modelUsage === 'object' ? raw.modelUsage : {})
      .filter(([, u]) => u && typeof u === 'object')
      .map(([m, u]: [string, any]) => [m, { input: num(u.inputTokens), output: num(u.outputTokens), cacheRead: num(u.cacheReadInputTokens), cacheCreation: num(u.cacheCreationInputTokens) }])),
    longestSession: ls && typeof ls === 'object'
      ? { durationMs: num(ls.duration), messages: num(ls.messageCount), timestamp: str(ls.timestamp) ?? '' }
      : null,
  };
}
