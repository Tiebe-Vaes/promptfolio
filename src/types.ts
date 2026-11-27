import type { HistoryStats } from './sources/history.js';
import type { TranscriptStats } from './sources/transcripts.js';

export interface DailyActivity {
  date: string;
  messages: number;
  sessions: number;
  toolCalls: number;
}

/** Tokens by kind, as the API bills them. */
export interface TokenSplit {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

export type StrengthId =
  | 'plansFirst' | 'keepsControl' | 'tests' | 'ships' | 'buildsTooling' | 'researches' | 'range' | 'consistency';

export interface StrengthCandidate {
  id: StrengthId;
  value: number;
  placeholder: string;
  score: number;
}

export interface EquivalentResult {
  id: string;
  value: number;
  unit: string;
  label: string;
  sourceUrl: string;
}

/** Text Claude writes. Numbers only appear as {dotted.path} placeholders into Stats. */
export interface Copy {
  schemaVersion: 1;
  vibe: 'professional' | 'fun' | 'roast';
  language: 'en' | 'nl';
  profile?: { headline: string; strengths: { id: StrengthId; text: string }[] };
  persona?: {
    className: string; specialMove: string; weakness: string; nemesis: string;
    /** Exactly 3 card moves; value is one {placeholder} that resolves to a number. */
    moves?: { name: string; value: string; text: string }[];
  };
  /** One sentence under the token pair. */
  tokensLine?: string;
  /** Receipt footer for fun and roast. */
  receiptFooter?: string;
  /** Last line of the terminal replay. */
  verdict?: string;
  /** Professional closer heading. */
  growthLine?: string;
  diary?: string[];
  awards?: { title: string; text: string }[];
  relationship?: { status: string; text: string };
  captions: Record<string, string>;
}

export interface ProjectEntry {
  key: string;
  label: string;
  sessions: number;
  titles: string[];
  branches: string[];
}

export interface Stats {
  schemaVersion: 1;
  year: number;
  generatedAt: string;
  tz: string;
  coverage: {
    yearFrom: string | null;
    statsCacheThrough: string | null;
    detailedFrom: string | null;
    detailedTo: string | null;
    historyFrom: string | null;
  };
  retention: { cleanupPeriodDays: number | null; effectiveDays: number };
  activity: {
    activeDays: number;
    sessions: number;
    messages: number;
    toolCalls: number;
    longestStreakDays: number;
    longestGapDays: number;
    busiestDay: { date: string; messages: number } | null;
    busiestMonth: { month: string; messages: number } | null;
    hourCounts: number[];
    lateNightSessionShare: number;
    byMonth: { month: string; activeDays: number; messages: number; sessions: number }[];
    daily: { date: string; messages: number }[];
    growth: { first: { month: string; messages: number }; peak: { month: string; messages: number }; factor: number } | null;
  };
  tokens: {
    yearTotal: number;
    byModel: Record<string, number>;
    detailed: TranscriptStats['tokens'];
    /** Tokens Claude wrote this year; null when no source covers the year. */
    yearOutput: number | null;
    /** First date yearOutput and apiValue cover when they only cover part of the year; null = whole year. */
    usageFrom: string | null;
    /** Tokens read (all, incl. cache) per token written. */
    readPerWritten: number | null;
    /** Model with the most year tokens and its share (0..1). */
    favoriteModel: { model: string; share: number } | null;
  };
  prompts: {
    count: number;
    slashCommands: number;
    politeness: number;
    corrections: number;
    languages: { en: number; nl: number; other: number };
    byMonth: HistoryStats['byMonth'];
    /** Local date of the first prompt this year (no text). */
    firstDate: string | null;
  };
  tools: TranscriptStats['tools'] & { top: { name: string; count: number }[] };
  denials: { userRejected: number; automatic: number; topDeniedTool: string | null };
  modes: { planShare: number; byMode: Record<string, number> };
  effort: Record<string, number>;
  entrypoints: Record<string, number>;
  files: { edited: number; byLanguage: { language: string; count: number }[]; topLanguage: string | null };
  sessions: TranscriptStats['sessions'] & { longestMinutesYear: number | null };
  projects: { count: number; branchCount: number; list: ProjectEntry[] };
  /** total = skills + agents + hooks: things the user built, not installed plugins. */
  tooling: { skills: number; agents: number; hooks: number; plugins: number; total: number };
  strengthCandidates: StrengthCandidate[];
  equivalents: EquivalentResult[];
  /** Estimate at Anthropic's published API prices. */
  apiValue: { usd: number; models: string[]; skippedModels: string[]; pricesAsOf: string } | null;
}
