import type { HistoryStats } from './sources/history.js';
import type { TranscriptStats } from './sources/transcripts.js';

export interface DailyActivity {
  date: string;
  messages: number;
  sessions: number;
  toolCalls: number;
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
  persona?: { className: string; specialMove: string; weakness: string; nemesis: string };
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
  };
  tokens: { yearTotal: number; byModel: Record<string, number>; detailed: TranscriptStats['tokens'] };
  prompts: {
    count: number;
    slashCommands: number;
    politeness: number;
    corrections: number;
    languages: { en: number; nl: number; other: number };
    byMonth: HistoryStats['byMonth'];
  };
  tools: TranscriptStats['tools'] & { top: { name: string; count: number }[] };
  denials: { userRejected: number; automatic: number; topDeniedTool: string | null };
  modes: { planShare: number; byMode: Record<string, number> };
  effort: Record<string, number>;
  entrypoints: Record<string, number>;
  files: { edited: number; byLanguage: { language: string; count: number }[] };
  sessions: TranscriptStats['sessions'] & { longestMinutesYear: number | null };
  projects: { count: number; branchCount: number; list: ProjectEntry[] };
  tooling: { skills: number; agents: number; hooks: number; plugins: number };
  strengthCandidates: StrengthCandidate[];
  equivalents: EquivalentResult[];
}
