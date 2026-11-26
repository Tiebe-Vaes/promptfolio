import type { Stats, StrengthCandidate, StrengthId } from './types.js';

const RULES: { id: StrengthId; value: (s: Stats) => number; placeholder: string; threshold: number }[] = [
  { id: 'plansFirst', value: s => s.modes.planShare, placeholder: 'modes.planShare', threshold: 0.1 },
  { id: 'keepsControl', value: s => s.denials.userRejected, placeholder: 'denials.userRejected', threshold: 10 },
  { id: 'tests', value: s => s.tools.testRuns, placeholder: 'tools.testRuns', threshold: 20 },
  { id: 'ships', value: s => s.tools.commits, placeholder: 'tools.commits', threshold: 20 },
  { id: 'buildsTooling', value: s => s.tooling.skills + s.tooling.agents + s.tooling.hooks, placeholder: 'tooling.skills', threshold: 5 },
  { id: 'researches', value: s => s.tools.webSearches, placeholder: 'tools.webSearches', threshold: 25 },
  { id: 'range', value: s => s.files.byLanguage.length, placeholder: 'files.byLanguage.length', threshold: 3 },
  { id: 'consistency', value: s => s.activity.longestStreakDays, placeholder: 'activity.longestStreakDays', threshold: 7 },
];

/** Measurable habits with a non-zero value, strongest first (value relative to its threshold). */
export function strengthCandidates(stats: Stats): StrengthCandidate[] {
  return RULES.map(r => {
    const value = r.value(stats);
    return { id: r.id, value, placeholder: r.placeholder, score: value / r.threshold };
  })
    .filter(c => c.value > 0)
    .sort((a, b) => b.score - a.score);
}
