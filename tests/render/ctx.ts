import { buildStats } from '../../src/buildStats.js';
import { languageColor } from '../../src/render/theme.js';
import { SIZES, type SizeName } from '../../src/render/shell.js';
import type { SlideCtx } from '../../src/render/slide.js';
import type { Copy, Stats } from '../../src/types.js';
import { fixture, fixturePath } from '../helpers.js';

export const funCopy: Copy = {
  schemaVersion: 1, vibe: 'fun', language: 'en',
  persona: {
    className: 'Shell Warlock', specialMove: 'git commit at dawn', weakness: 'plan mode', nemesis: 'api_error',
    moves: [
      { name: 'Bash Barrage', value: '{tools.bash}', text: 'Hits the shell until it compiles.' },
      { name: 'Watch It Fail', value: '{tools.testRuns}', text: 'Runs the tests before trusting anything.' },
      { name: 'Ship at Dawn', value: '{tools.commits}', text: 'Commits, mostly before lunch.' },
    ],
  },
  diary: ['a', 'b', 'c'], awards: [{ title: 'a', text: 'b' }, { title: 'c', text: 'd' }, { title: 'e', text: 'f' }],
  relationship: { status: 'Married', text: 'Daily.' },
  tokensLine: 'Claude reread your code {tokens.readPerWritten} times for every token it wrote back.',
  verdict: 'You trust tests more than vibes.',
  receiptFooter: 'No refunds on tokens.',
  captions: {},
};

export const proCopy: Copy = {
  schemaVersion: 1, vibe: 'professional', language: 'en',
  profile: {
    headline: '{activity.activeDays} days with Claude Code',
    strengths: [
      { id: 'buildsTooling', text: 'Builds own tooling: {tooling.total} skills, agents and hooks' },
      { id: 'plansFirst', text: 'Plans first: {modes.planShare} of turns in plan mode' },
      { id: 'range', text: '{files.byLanguage.length} languages' },
    ],
  },
  tokensLine: 'Claude reread your code {tokens.readPerWritten} times for every token it wrote back.',
  verdict: 'You plan, then you ship.',
  growthLine: '{activity.growth.factor} times busier by {activity.growth.peak.month}',
  captions: {},
};

export async function fixtureStats(): Promise<Stats> {
  return buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27T12:00:00Z') });
}

export async function emptyStats(): Promise<Stats> {
  return buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
}

export function ctx(stats: Stats, copy: Copy, size: SizeName = 'story'): SlideCtx {
  return { stats, copy, lang: copy.language, theme: languageColor(stats.files.topLanguage), size: SIZES[size], index: 0, total: 4 };
}
