import type { StatsCacheData } from '../sources/statsCache.js';
import type { TranscriptStats } from '../sources/transcripts.js';
import { localDate } from '../time.js';
import type { Stats, TokenSplit } from '../types.js';

/** First month of the year versus the busiest month. Null with fewer than two months. */
export function growth(byMonth: { month: string; messages: number }[]): Stats['activity']['growth'] {
  const months = byMonth.filter(m => m.messages > 0);
  if (months.length < 2) return null;
  const first = months[0];
  const peak = months.reduce((best, m) => (m.messages > best.messages ? m : best), first);
  return {
    first: { month: first.month, messages: first.messages },
    peak: { month: peak.month, messages: peak.messages },
    factor: Math.round(peak.messages / first.messages),
  };
}

const add = (a: TokenSplit, b: TokenSplit): TokenSplit => ({
  input: a.input + b.input, output: a.output + b.output, cacheRead: a.cacheRead + b.cacheRead, cacheCreation: a.cacheCreation + b.cacheCreation,
});

/**
 * Token usage per model for the year. stats-cache keeps an all-time split per model with no dates,
 * so it only counts when the user's first session is in this year; transcripts add the days after its cutoff.
 */
export function yearUsageByModel(
  cache: StatsCacheData, transcripts: TranscriptStats, year: number, tz: string, fromCache: (date: string) => boolean,
): { usage: Record<string, TokenSplit>; from: string | null } | null {
  const usage: Record<string, TokenSplit> = {};
  const first = cache.firstSessionDate && !Number.isNaN(Date.parse(cache.firstSessionDate)) ? localDate(cache.firstSessionDate, tz) : null;
  const cacheCovers = first?.startsWith(String(year)) ?? false;
  let from: string | null = null;
  if (cacheCovers) for (const [m, u] of Object.entries(cache.modelUsage)) usage[m] = { ...u };
  for (const [date, models] of Object.entries(transcripts.dailyUsage)) {
    if (!date.startsWith(String(year)) || fromCache(date)) continue;
    if (!cacheCovers && (from === null || date < from)) from = date;
    for (const [m, u] of Object.entries(models)) usage[m] = usage[m] ? add(usage[m], u) : { ...u };
  }
  // from = first date counted when the totals only cover part of the year (null = the whole year).
  return Object.keys(usage).length > 0 ? { usage, from: cacheCovers ? null : from } : null;
}
