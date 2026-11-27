// Builds invented demo data and renders the README images. No real user data is used:
// the schema comes from the test fixture, every number below is made up.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const S = 'plugins/promptfolio/skills/promptfolio/scripts';
const out = 'design/demo';
const run = (script, args) => execFileSync(process.execPath, [path.join(S, `${script}.mjs`), ...args], { stdio: 'inherit' });

// Seeded random so the demo renders the same every time.
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function daily() {
  const days = [];
  for (let d = Date.UTC(2026, 2, 3); d <= Date.UTC(2026, 10, 26); d += 86_400_000) {
    const date = new Date(d).toISOString().slice(0, 10);
    const month = new Date(d).getUTCMonth();
    const busy = 0.25 + month * 0.09; // the year picks up towards autumn
    if (rnd() < busy) days.push({ date, messages: Math.round(40 + rnd() * 380 * (1 + month * 0.35)) });
  }
  return days;
}

function demoStats(base) {
  const d = daily();
  const months = new Map();
  for (const x of d) {
    const m = months.get(x.date.slice(0, 7)) ?? { activeDays: 0, messages: 0, sessions: 0 };
    m.activeDays++; m.messages += x.messages; m.sessions += 1 + Math.round(rnd() * 3);
    months.set(x.date.slice(0, 7), m);
  }
  const byMonth = [...months].map(([month, v]) => ({ month, ...v }));
  const first = byMonth[0];
  const peak = byMonth.reduce((a, b) => (b.messages > a.messages ? b : a));
  const busiest = d.reduce((a, b) => (b.messages > a.messages ? b : a));
  const yearTotal = 9_412_000_000, yearOutput = 41_200_000;
  return {
    ...base,
    activity: {
      ...base.activity,
      activeDays: d.length, sessions: byMonth.reduce((a, m) => a + m.sessions, 0), messages: d.reduce((a, x) => a + x.messages, 0),
      toolCalls: 18_406, longestStreakDays: 11, longestGapDays: 9,
      busiestDay: busiest, busiestMonth: { month: peak.month, messages: peak.messages },
      byMonth, daily: d,
      growth: { first: { month: first.month, messages: first.messages }, peak: { month: peak.month, messages: peak.messages }, factor: Math.round(peak.messages / first.messages) },
    },
    tokens: { ...base.tokens, yearTotal, yearOutput, usageFrom: null, readPerWritten: Math.round(yearTotal / yearOutput), byModel: { 'claude-opus-5-5': 7_900_000_000, 'claude-sonnet-5-5': 1_512_000_000 }, favoriteModel: { model: 'claude-opus-5-5', share: 0.84 } },
    // Same per-prompt factors as src/equivalents.ts (Google's published Gemini figures).
    equivalents: (base.equivalents ?? []).map(e => ({ ...e, value: e.id === 'energy' ? 1_204 * 0.24 : 1_204 * 0.26 / 250 })),
    prompts: { ...base.prompts, count: 1_204, slashCommands: 96, politeness: 61, corrections: 87 },
    sessions: { ...base.sessions, subagentSessions: 140 },
    tools: { ...base.tools, calls: 18_406, bash: 7_204, testRuns: 862, commits: 455, webSearches: 318, mcpCalls: 2_210,
      top: [{ name: 'Bash', count: 7204 }, { name: 'Edit', count: 3120 }, { name: 'Read', count: 2804 }, { name: 'mcp:Claude_Browser', count: 1350 }, { name: 'Write', count: 990 }, { name: 'Grep', count: 640 }, { name: 'WebSearch', count: 318 }] },
    files: { edited: 1_032, topLanguage: 'Python', byLanguage: [{ language: 'Python', count: 512 }, { language: 'TypeScript', count: 288 }, { language: 'SQL', count: 91 }, { language: 'Markdown', count: 80 }, { language: 'Go', count: 61 }] },
    tooling: { skills: 4, agents: 2, hooks: 3, plugins: 6, total: 9 },
    apiValue: { usd: 3_912.4, models: ['claude-opus-5-5', 'claude-sonnet-5-5'], skippedModels: [], pricesAsOf: base.apiValue?.pricesAsOf ?? '2026-11-03' },
    strengthCandidates: [
      { id: 'tests', value: 862, placeholder: 'tools.testRuns', score: 43.1 },
      { id: 'ships', value: 455, placeholder: 'tools.commits', score: 22.8 },
      { id: 'researches', value: 318, placeholder: 'tools.webSearches', score: 12.7 },
      { id: 'range', value: 5, placeholder: 'files.byLanguage.length', score: 1.7 },
    ],
  };
}

const copy = {
  schemaVersion: 2, vibe: 'professional', language: 'en', title: 'Python builder',
  lines: {
    tokens: 'Claude reread the code {tokens.readPerWritten} times for every token it wrote.',
    year: 'Ships in small steps: {tools.commits} commits this year.',
    toolkit: 'Shell first, {files.byLanguage.length} languages deep.',
    growth: '{activity.growth.factor} times busier by {activity.growth.peak.month}.',
  },
  captions: {
    instagram: 'My year with Claude Code, in four cards.',
    linkedin: '{tools.commits} commits and {tools.webSearches} web searches with Claude Code this year.',
    x: 'My Claude Code year: {tools.commits} commits.',
    discord: 'Made my Claude Code recap.',
  },
};

// One folder per style, each in a different palette, so the README shows the range.
const looks = { clean: 'auto', receipt: 'sunset', terminal: 'ink', card: 'grape' };
for (const [style, palette] of Object.entries(looks)) {
  const dir = path.join(out, style);
  fs.rmSync(dir, { recursive: true, force: true });
  run('stats', ['--claude-dir', 'tests/fixtures/claude-home', '--year', '2026', '--tz', 'UTC', '--out', dir]);
  const stats = demoStats(JSON.parse(fs.readFileSync(path.join(dir, 'stats.json'), 'utf8')));
  fs.writeFileSync(path.join(dir, 'stats.json'), JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(dir, 'copy.json'), JSON.stringify(copy, null, 2));
  run('render', ['--dir', dir, '--style', style, '--palette', palette, '--formats', style === 'clean' ? 'story,wide,readme' : 'story,wide']);
}
console.log('demo rendered to design/demo');
