# Promptfolio Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a user's local `~/.claude` data into a redacted `stats.json` plus `sample.json`, let Claude write `copy.json` through the skill, validate it, and detect a headless browser, so Plan 2 only has to add templates and rendering.

**Architecture:** TypeScript source with zero runtime dependencies, bundled by esbuild into plain `.mjs` scripts committed inside the skill folder. Code owns every number. Claude owns the words and uses `{dotted.path}` placeholders that resolve against `stats.json`. The repo is a Claude Code plugin marketplace with one plugin holding one skill.

**Tech Stack:** Node 18+ (runtime, no npm deps), TypeScript 5, vitest, esbuild, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-27-claude-code-recap-design.md`. Research: `docs/research/`.

**Scope:** Plan 1 of 2. The visual mockup round is a blocking gate between Plan 1 and Plan 2. Plan 2 covers HTML templates, `story.html`, PNG cards, README SVG, the render CLI, README and release.

## Global Constraints

- Product name `Promptfolio`, command `/promptfolio`, npm name `promptfolio`, output folder `./promptfolio-<year>/`.
- Runtime: Node >= 18, zero runtime dependencies. Dev dependencies only: `typescript`, `vitest`, `esbuild`, `@types/node`.
- The tool's scripts never make network requests.
- Claude data folder: `CLAUDE_CONFIG_DIR` if set, else `~/.claude`.
- Never crash on a malformed line, a missing file, or an unknown line type. Missing data produces zeros and `null` coverage, not errors.
- Dates and hours use the user's local time zone (`--tz`, default `Intl.DateTimeFormat().resolvedOptions().timeZone`).
- Secret scan runs on every string that goes into `sample.json`, `copy.json` validation or any output file, in every redaction mode.
- Default redaction: `hide`. Modes: `hide | pick | show`.
- Prompt text from `history.jsonl` never appears in any output; only counts.
- Copy contains no digits outside placeholders. Placeholders must resolve to a number or string in `stats.json`.
- Equivalents: first-party figures only (published by the AI company itself), each with an https source URL and the word "estimate" in its label. No source, not shown.
- Supported OS: Windows, macOS, Linux. CI runs on all three.
- Commit messages describe the change only. No `Co-Authored-By` or other AI attribution lines.

## Real data facts (from the author's machine, 2026-11-27)

- `stats-cache.json` keys: `version` (5), `lastComputedDate` ("2026-11-11", lags behind today), `dailyActivity[] {date, messageCount, sessionCount, toolCallCount}`, `dailyModelTokens[] {date, tokensByModel: {model: tokens}}`, `modelUsage {model: {inputTokens, outputTokens, cacheReadInputTokens, cacheCreationInputTokens, webSearchRequests, ...}}` (all-time), `totalSessions`, `totalMessages`, `longestSession {sessionId, timestamp, duration(ms), messageCount}`, `firstSessionDate`, `hourCounts {"0".."23": n}` (all-time).
- `history.jsonl` lines: `{display, pastedContents, timestamp (ms), project, sessionId}`. Slash commands appear as `display` starting with `/`.
- Transcripts: `projects/<project-dir>/<sessionId>.jsonl` and subagent logs at `projects/<project-dir>/<sessionId>/subagents/*.jsonl` (recurse).
- Line `type` values: `user`, `assistant`, `system`, `attachment`, `queue-operation`, `last-prompt`, `custom-title`, `mode`, others. Treat unknown types as ignorable.
- `system.subtype` values: `compact_boundary`, `api_error`, `stop_hook_summary`, `turn_duration`, `away_summary`, `informational`, `local_command`, `model_refusal_fallback`.
- `toolDenialKind` values: `user-rejected` (the user said no), plus automatic ones: `permission-rule`, `automode-blocked`, `automode-unavailable`, `interrupted`, `cancelled`.
- `permissionMode` values: `auto`, `default`, `plan`, `acceptEdits`, `bypassPermissions`. `effort`: `low`, `medium`, `high`, `xhigh`. `entrypoint`: `claude-desktop`, `cli` (others possible).
- `message.usage`: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens_details.thinking_tokens`, `server_tool_use.web_search_requests`. `message.model`. `message.content[]` blocks with `type: "tool_use"`, `name`, `input` (Bash: `input.command`; Edit/Write: `input.file_path`).
- Other line fields: `timestamp` (ISO), `sessionId`, `cwd`, `gitBranch`, `isSidechain`, `customTitle`, `hookErrors` (array).

## Review Focus

1. **Huge logs (1+ GB, thousands of files).** Expect streaming line by line, constant memory, finishing in reasonable time. Test: Task 2 `readJsonl` yields lines lazily from a stream (asserts the first line arrives before the file is fully read, using a generator-backed stream).
2. **A brand-new or near-empty `~/.claude`** (no `stats-cache.json`, no `history.jsonl`, no projects). Expect a valid `stats.json` with zeros and `null` coverage, exit code 0. Test: Task 6 `buildStats on empty claude dir`.
3. **Secrets in session titles, branch names, cwd paths or file paths, even in `show` mode.** Expect them dropped. Test: Task 7 `show mode still drops secret-bearing title`.
4. **Local time vs UTC at day and hour boundaries** (a prompt at 23:30 UTC is the next day in Brussels). Expect local dates. Test: Task 1 `localDate crosses midnight in Europe/Brussels`, Task 4 `late-night uses local hour`.
5. **Paths with spaces and a running browser** (Windows `Program Files (x86)`, Edge already open). Expect the screenshot to still work. Test: Task 10 `screenshotArgs uses a fresh user-data-dir and no shell`.

---

## File structure

```
package.json, tsconfig.json, vitest.config.ts, .gitignore, esbuild.config.mjs
.claude-plugin/marketplace.json
plugins/promptfolio/.claude-plugin/plugin.json
plugins/promptfolio/skills/promptfolio/SKILL.md
plugins/promptfolio/skills/promptfolio/scripts/{stats,validate,doctor}.mjs   (built, committed)
.github/workflows/ci.yml
src/types.ts            Stats, Copy, shared types
src/paths.ts            resolveClaudeDir
src/time.ts             localDate, localHour, localMonth
src/jsonl.ts            readJsonl, findTranscripts
src/streaks.ts          longestStreak, longestGap
src/sources/statsCache.ts
src/sources/history.ts
src/sources/transcripts.ts
src/sources/tooling.ts  tooling counts + retention setting
src/buildStats.ts       merge sources into Stats
src/text.ts             word lists, language classifier, test/commit regexes
src/redact.ts           scanSecrets, redaction, buildSample
src/strengths.ts
src/equivalents.ts
src/copy.ts             validateCopy, fillPlaceholders, COPY_LIMITS
src/browser.ts          findBrowser, screenshotArgs, screenshot
src/cli/{stats,validate,doctor}.ts
tests/**/*.test.ts
tests/fixtures/claude-home/...   synthetic data (Task 2 creates, later tasks extend)
```

---

### Task 1: Repo scaffold, paths and time helpers

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.claude-plugin/marketplace.json`, `plugins/promptfolio/.claude-plugin/plugin.json`, `plugins/promptfolio/skills/promptfolio/SKILL.md` (frontmatter only plus "work in progress"), `src/paths.ts`, `src/time.ts`
- Test: `tests/paths.test.ts`, `tests/time.test.ts`

**Interfaces:**
- Produces: `resolveClaudeDir(env: NodeJS.ProcessEnv, home: string): string`; `localDate(ts: string | number, tz: string): string` (YYYY-MM-DD); `localHour(ts: string | number, tz: string): number` (0-23); `localMonth(ts, tz): string` (YYYY-MM).

- [ ] **Step 1:** `git init -b main` in the repo root. `.gitignore`: `node_modules/`, `promptfolio-*/`, `coverage/`.
- [ ] **Step 2:** `package.json`: `"name": "promptfolio"`, `"type": "module"`, `"engines": {"node": ">=18"}`, `"private": true`, scripts `test` (`vitest run`), `typecheck` (`tsc --noEmit`), `build` (`node esbuild.config.mjs`), dev deps as in Global Constraints. `tsconfig.json`: `strict`, `module`/`moduleResolution` `NodeNext`, `target` `ES2022`, `noEmit`. Run `npm install`.
- [ ] **Step 3:** Marketplace files. `marketplace.json` follows the shape of an installed example (`~/.claude/plugins/marketplaces/caveman/.claude-plugin/marketplace.json`): `$schema`, `name: "promptfolio"`, `owner: {name: "Tiebe Vaes"}`, `plugins: [{name: "promptfolio", source: "./plugins/promptfolio", description, category: "productivity"}]`. `plugin.json`: `name`, `version: "0.1.0"`, `description`, `author`. `SKILL.md` frontmatter: `name: promptfolio`, `description:` one sentence saying it builds a shareable year recap of your Claude Code use and triggers on "promptfolio", "my year with Claude", "recap".
- [ ] **Step 4: Write failing tests**

```ts
test('uses CLAUDE_CONFIG_DIR when set', () =>
  expect(resolveClaudeDir({ CLAUDE_CONFIG_DIR: '/x/cfg' }, '/home/u')).toBe('/x/cfg'));
test('falls back to ~/.claude', () =>
  expect(resolveClaudeDir({}, '/home/u')).toBe(path.join('/home/u', '.claude')));
test('localDate crosses midnight in Europe/Brussels', () =>
  expect(localDate('2026-11-26T23:30:00Z', 'Europe/Brussels')).toBe('2026-11-27'));
test('localHour uses the time zone', () =>
  expect(localHour(Date.parse('2026-07-01T01:15:00Z'), 'Europe/Brussels')).toBe(3));
test('localMonth', () => expect(localMonth('2026-01-31T23:30:00Z', 'Europe/Brussels')).toBe('2026-02'));
```

- [ ] **Step 5:** Run `npx vitest run tests/paths.test.ts tests/time.test.ts`. Expected: FAIL (modules missing).
- [ ] **Step 6:** Implement both modules. Time helpers use `Intl.DateTimeFormat` with `timeZone` and `hourCycle: 'h23'` (en-CA gives YYYY-MM-DD).
- [ ] **Step 7:** Run the same tests. Expected: PASS. Run `npm run typecheck`. Expected: no errors.
- [ ] **Step 8:** Commit: `git add -A && git commit -m "Scaffold Promptfolio plugin repo with path and time helpers"`.

---

### Task 2: JSONL reader and transcript discovery

**Files:**
- Create: `src/jsonl.ts`, `tests/helpers.ts` (`fixture(...parts: string[]): string` resolves under `tests/fixtures/claude-home`, `fixturePath(name)` under `tests/fixtures`, `collect(asyncIterable)` to an array), `tests/fixtures/claude-home/` (initial tree below)
- Test: `tests/jsonl.test.ts`

**Interfaces:**
- Produces: `readJsonl(file: string | NodeJS.ReadableStream): AsyncGenerator<unknown>` (skips blank and unparsable lines); `readJsonlStats` counter object `{ bad: number }` passed as optional 2nd arg; `findTranscripts(projectsDir: string): Promise<string[]>` (all `*.jsonl` recursively, including `*/subagents/*.jsonl`; `[]` if dir missing).

Fixture tree created here (later tasks add lines; contents described in the task that needs them):
```
tests/fixtures/claude-home/
  stats-cache.json  history.jsonl  settings.json
  skills/demo/SKILL.md  agents/helper.md
  projects/C--dev-alpha/s1.jsonl
  projects/C--dev-alpha/s1/subagents/agent-1.jsonl
  projects/C--dev-beta/s2.jsonl
tests/fixtures/empty-home/        (empty folder with a .gitkeep)
```

- [ ] **Step 1: Write failing tests**

```ts
test('skips bad lines and counts them', async () => {
  const counter = { bad: 0 };
  const rows = await collect(readJsonl(Readable.from(['{"a":1}\n', 'not json\n', '\n', '{"a":2}\n']), counter));
  expect(rows).toEqual([{ a: 1 }, { a: 2 }]);
  expect(counter.bad).toBe(1);
});
test('streams lazily', async () => {
  let produced = 0;
  const src = Readable.from((function* () { for (let i = 0; i < 1e5; i++) { produced++; yield `{"i":${i}}\n`; } })());
  const it = readJsonl(src); await it.next();
  expect(produced).toBeLessThan(1e5);
});
test('finds transcripts including subagents', async () => {
  const files = (await findTranscripts(fixture('projects'))).map(f => path.relative(fixture('projects'), f).replaceAll('\\', '/')).sort();
  expect(files).toEqual(['C--dev-alpha/s1.jsonl', 'C--dev-alpha/s1/subagents/agent-1.jsonl', 'C--dev-beta/s2.jsonl']);
});
test('missing projects dir gives []', async () => expect(await findTranscripts(fixture('nope'))).toEqual([]));
```

- [ ] **Step 2:** Run `npx vitest run tests/jsonl.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement with `node:readline` over `fs.createReadStream` (or the given stream) and `fs.promises.readdir(..., { recursive: true })` is Node 20+, so walk directories manually for Node 18.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Add streaming JSONL reader and transcript discovery"`.

---

### Task 3: stats-cache source and streaks

**Files:**
- Create: `src/types.ts` (first part, `DailyActivity`), `src/streaks.ts`, `src/sources/statsCache.ts`; fill `tests/fixtures/claude-home/stats-cache.json`
- Test: `tests/streaks.test.ts`, `tests/statsCache.test.ts`

**Interfaces:**
- Produces: `interface DailyActivity { date: string; messages: number; sessions: number; toolCalls: number }`; `interface StatsCacheData { through: string | null; daily: DailyActivity[]; dailyTokens: { date: string; tokensByModel: Record<string, number> }[]; firstSessionDate: string | null; longestSession: { durationMs: number; messages: number } | null }`; `readStatsCache(file: string): Promise<StatsCacheData>` (empty data with `through: null` when missing or invalid); `longestStreak(dates: string[]): number`; `longestGap(dates: string[]): number` (days between consecutive active dates minus 1, 0 if fewer than 2).

Fixture `stats-cache.json`: version 5, `lastComputedDate: "2026-11-11"`, `dailyActivity` for 2025-12-30, 2026-03-01, 2026-03-02, 2026-03-03, 2026-03-10, 2026-11-11; `dailyModelTokens` for two of those dates with two models; `longestSession` with `duration: 7200000, messageCount: 120`; `firstSessionDate: "2025-12-30T10:00:00Z"`.

- [ ] **Step 1: Write failing tests**

```ts
test('longest streak', () => expect(longestStreak(['2026-03-01','2026-03-02','2026-03-03','2026-03-10'])).toBe(3));
test('longest gap', () => expect(longestGap(['2026-03-03','2026-03-10','2026-11-11'])).toBe(245));
test('streak ignores duplicates and order', () => expect(longestStreak(['2026-03-02','2026-03-01','2026-03-02'])).toBe(2));
test('reads stats-cache', async () => {
  const d = await readStatsCache(fixture('stats-cache.json'));
  expect(d.through).toBe('2026-11-11');
  expect(d.daily).toHaveLength(6);
  expect(d.daily[1]).toEqual({ date: '2026-03-01', messages: expect.any(Number), sessions: expect.any(Number), toolCalls: expect.any(Number) });
  expect(d.longestSession).toEqual({ durationMs: 7200000, messages: 120 });
});
test('missing stats-cache', async () => expect((await readStatsCache(fixture('nope.json'))).through).toBeNull());
```

- [ ] **Step 2:** Run `npx vitest run tests/streaks.test.ts tests/statsCache.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Date math on `YYYY-MM-DD` strings via `Date.UTC` so DST does not matter.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Read stats-cache and compute streaks"`.

---

### Task 4: History source

**Files:**
- Create: `src/text.ts`, `src/sources/history.ts`; fill `tests/fixtures/claude-home/history.jsonl`
- Test: `tests/text.test.ts`, `tests/history.test.ts`

**Interfaces:**
- Produces from `text.ts`: `POLITE_WORDS`, `CORRECTION_PHRASES` (string arrays, lowercase, en + nl), `classifyLanguage(text: string): 'en' | 'nl' | 'other'`, `TEST_RUNNER_RE: RegExp`, `GIT_COMMIT_RE: RegExp`, `countMatches(text: string, words: string[]): number` (whole-word, case-insensitive).
- Produces from `history.ts`: `interface HistoryStats { from: string | null; prompts: number; slashCommands: number; politeness: number; corrections: number; languages: { en: number; nl: number; other: number }; hourCounts: number[] /* length 24 */; sessions: number; lateNightSessions: number; projects: Record<string, number> /* project path -> prompts */; byMonth: { month: string; prompts: number; corrections: number }[] /* YYYY-MM ascending, only months with prompts */ }`; `readHistory(file: string, opts: { year: number; tz: string }): Promise<HistoryStats>`.

Values pinned:
- `POLITE_WORDS`: please, pls, thanks, thank you, thx, sorry, alsjeblieft, aub, bedankt, dankje, dank je, merci, sorry.
- `CORRECTION_PHRASES`: no wait, wait, actually, that's wrong, undo, revert, not what i, nee, wacht, klopt niet, fout, terugdraaien.
- `classifyLanguage`: count stopwords; nl set `de het een ik je niet wat maar ook nog dat voor is dit zijn kan moet`, en set `the and is you not what but this that for are can should with`; the larger count wins when it is at least 2, else `other`. (`is` counts for both; that is fine.)
- `TEST_RUNNER_RE` matches: vitest, jest, pytest, `npm test`, `npm run test`, `pnpm test`, `yarn test`, `bun test`, `mvn test` (with flags between), `./mvnw test`, `gradle test`, `./gradlew test`, `go test`, `cargo test`, `dotnet test`, phpunit, rspec.
- `GIT_COMMIT_RE`: `/\bgit\s+commit\b/`.
- Late night: a session's first prompt (by timestamp) has local hour 0-4.
- Year filter: only lines whose local date falls in `opts.year`.

Fixture `history.jsonl` (all `project` values under `C:\\dev\\alpha` or `C:\\dev\\beta`): an English prompt with "please" in 2026; a Dutch prompt "nee wacht, dat klopt niet" in 2026; `/model` slash command; a prompt at `2026-07-01T00:30:00Z` (02:30 Brussels) as the first prompt of its session; a prompt dated 2025-12-31T12:00:00Z (excluded for year 2026); a prompt containing `sk-ant-api03-FAKEFAKEFAKEFAKEFAKE`; one malformed line.

- [ ] **Step 1: Write failing tests**

```ts
test('classifyLanguage', () => {
  expect(classifyLanguage('can you fix the bug in this file')).toBe('en');
  expect(classifyLanguage('kan je de bug in dit bestand niet fixen')).toBe('nl');
  expect(classifyLanguage('ok')).toBe('other');
});
test('test runner regex', () => {
  for (const c of ['npx vitest run a.test.ts', 'mvn -q test', './gradlew test', 'npm run test', 'pytest -x'])
    expect(TEST_RUNNER_RE.test(c)).toBe(true);
  expect(TEST_RUNNER_RE.test('cat latest.txt')).toBe(false);
});
test('history aggregates the year in local time', async () => {
  const h = await readHistory(fixture('history.jsonl'), { year: 2026, tz: 'Europe/Brussels' });
  expect(h.prompts).toBe(4);           // 2026 non-slash prompts
  expect(h.slashCommands).toBe(1);
  expect(h.politeness).toBe(1);
  expect(h.corrections).toBeGreaterThanOrEqual(2);
  expect(h.languages.nl).toBe(1);
  expect(h.hourCounts[2]).toBe(1);
  expect(h.lateNightSessions).toBe(1);  // late-night uses local hour
  expect(h.byMonth.every((m, i, a) => i === 0 || a[i - 1].month < m.month)).toBe(true);
});
test('missing history', async () => expect((await readHistory(fixture('nope'), { year: 2026, tz: 'UTC' })).prompts).toBe(0));
```

- [ ] **Step 2:** Run `npx vitest run tests/text.test.ts tests/history.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Prompt text is only counted, never stored.
- [ ] **Step 4:** Run tests. Expected: PASS (adjust the fixture, not the assertions, if a count is off by fixture design).
- [ ] **Step 5:** Commit `"Aggregate prompt history per year"`.

---

### Task 5: Transcript source

**Files:**
- Create: `src/sources/transcripts.ts`; fill the three transcript fixtures
- Test: `tests/transcripts.test.ts`

**Interfaces:**
- Consumes: `readJsonl`, `findTranscripts` (Task 2), `localDate`, `localHour` (Task 1), `TEST_RUNNER_RE`, `GIT_COMMIT_RE` (Task 4), `DailyActivity` (Task 3).
- Produces:

```ts
interface TranscriptStats {
  from: string | null; to: string | null;            // local dates of first/last line in the year
  daily: DailyActivity[];                             // per local date, from user+assistant lines
  tokens: { input: number; output: number; cacheRead: number; cacheCreation: number; thinking: number; byModel: Record<string, number> };
  tools: { calls: number; byName: Record<string, number>; bash: number; testRuns: number; commits: number; mcpCalls: number; webSearches: number };
  denials: { userRejected: number; automatic: number; byTool: Record<string, number> };
  permissionModes: Record<string, number>;            // counts over user lines with permissionMode
  effort: Record<string, number>;
  entrypoints: Record<string, number>;                // per session, first seen
  files: { edited: number; byExtension: Record<string, number> };   // distinct file paths from Edit/Write/MultiEdit/NotebookEdit
  sessions: { count: number; subagentSessions: number; longestMinutes: number; compactions: number; apiErrors: number; hookErrors: number };
  projects: Record<string, { sessions: number; branches: string[]; titles: string[] }>; // key = cwd
}
readTranscripts(files: string[], opts: { year: number; tz: string }): Promise<TranscriptStats>
```

Pinned rules:
- A session = distinct `sessionId`. A file under `subagents/` or any line with `isSidechain: true` counts toward `subagentSessions`, not `count`.
- Session length = last minus first timestamp in that session's main file, in minutes.
- `compactions` = `system` lines with `subtype: "compact_boundary"`; `apiErrors` = `subtype: "api_error"`; `hookErrors` = sum of `hookErrors.length`.
- Denials: `toolDenialKind === "user-rejected"` → `userRejected`; any other value → `automatic`. Attribute to the tool name of the matching `tool_use` if available via `toolUseID`, else `"unknown"`.
- `mcpCalls` = tool names starting with `mcp__`. `webSearches` = sum of `usage.server_tool_use.web_search_requests` plus `WebSearch` tool calls.
- `byModel` = input + output + cacheRead + cacheCreation per `message.model`.
- Branches: distinct non-empty `gitBranch` per cwd. Titles: distinct `customTitle` per cwd.
- Lines outside the year (local date) are skipped.

Fixture content (s1 = alpha, 2026-11-20; s2 = beta, 2026-11-21): assistant lines with usage and `thinking_tokens`, tool_use `Bash` with `npx vitest run`, `Bash` with `git commit -m "x"`, `Edit` on `src/a.ts`, `Write` on `src/b.py`, `mcp__x__y`, a `user-rejected` denial and an `automode-blocked` denial, `permissionMode: "plan"` on one user line and `"auto"` on another, `customTitle: "fix login sk-ant-api03-FAKEFAKEFAKEFAKEFAKE"`, `gitBranch: "feat/login"`, a `compact_boundary`, an `api_error`, `hookErrors: ["x"]`, an unknown `type: "atis-latch"` line, one broken line, one line dated 2025.

- [ ] **Step 1: Write failing tests** (one `test` per pinned rule; key assertions):

```ts
const t = await readTranscripts(await findTranscripts(fixture('projects')), { year: 2026, tz: 'Europe/Brussels' });
expect(t.sessions.count).toBe(2);
expect(t.sessions.subagentSessions).toBe(1);
expect(t.tools.testRuns).toBe(1);
expect(t.tools.commits).toBe(1);
expect(t.tools.mcpCalls).toBe(1);
expect(t.denials).toMatchObject({ userRejected: 1, automatic: 1 });
expect(t.permissionModes.plan).toBe(1);
expect(t.files.byExtension).toEqual({ '.ts': 1, '.py': 1 });
expect(t.sessions.compactions).toBe(1);
expect(t.tokens.thinking).toBeGreaterThan(0);
expect(t.projects['C:\\dev\\alpha'].branches).toEqual(['feat/login']);
expect(t.from).toBe('2026-11-20');
```

- [ ] **Step 2:** Run `npx vitest run tests/transcripts.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement one pass per file, accumulating into the result object.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Aggregate detailed stats from session transcripts"`.

---

### Task 6: Tooling, retention and buildStats

**Files:**
- Create: `src/sources/tooling.ts`, `src/buildStats.ts`; complete `src/types.ts` with `Stats`; fill `settings.json`, `skills/demo/SKILL.md`, `agents/helper.md` fixtures
- Test: `tests/tooling.test.ts`, `tests/buildStats.test.ts`

**Interfaces:**
- Consumes: Tasks 3, 4, 5.
- Produces: `readTooling(claudeDir: string): Promise<{ skills: number; agents: number; hooks: number; plugins: number; cleanupPeriodDays: number | null }>` (skills = folders in `skills/` with a `SKILL.md`; agents = `.md` files in `agents/`; hooks = total hook commands in `settings.json` `hooks`; plugins = `true` values in `enabledPlugins`; `cleanupPeriodDays` from `settings.json`, `null` if absent). And `buildStats(opts: { claudeDir: string; year: number; tz: string; now: Date }): Promise<Stats>` with:

```ts
interface Stats {
  schemaVersion: 1; year: number; generatedAt: string; tz: string;
  coverage: { yearFrom: string | null; statsCacheThrough: string | null; detailedFrom: string | null; detailedTo: string | null; historyFrom: string | null };
  retention: { cleanupPeriodDays: number | null; effectiveDays: number };    // effectiveDays = value ?? 30
  activity: { activeDays: number; sessions: number; messages: number; toolCalls: number; longestStreakDays: number; longestGapDays: number;
              busiestDay: { date: string; messages: number } | null; busiestMonth: { month: string; messages: number } | null;
              hourCounts: number[]; lateNightSessionShare: number;
              byMonth: { month: string; activeDays: number; messages: number; sessions: number }[] };   // for the Growth slide
  tokens: { yearTotal: number; byModel: Record<string, number>; detailed: TranscriptStats['tokens'] };
  prompts: { count: number; slashCommands: number; politeness: number; corrections: number; languages: { en: number; nl: number; other: number };
             byMonth: HistoryStats['byMonth'] };
  tools: TranscriptStats['tools'] & { top: { name: string; count: number }[] };   // top 10
  denials: { userRejected: number; automatic: number; topDeniedTool: string | null };
  modes: { planShare: number; byMode: Record<string, number> }; effort: Record<string, number>; entrypoints: Record<string, number>;
  files: { edited: number; byLanguage: { language: string; count: number }[] };
  sessions: TranscriptStats['sessions'] & { longestMinutesYear: number | null };
  projects: { count: number; branchCount: number; list: { key: string; label: string; sessions: number; titles: string[]; branches: string[] }[] };
  tooling: { skills: number; agents: number; hooks: number; plugins: number };
  strengthCandidates: StrengthCandidate[];    // filled in Task 8; [] until then
  equivalents: EquivalentResult[];            // filled in Task 8; [] until then
}
```

Merge rules:
- Daily activity: stats-cache days with `date <= statsCacheThrough`, transcript days after it. Year filter on both.
- `tokens.yearTotal` = stats-cache `dailyTokens` in the year up to `through` + transcript `byModel` totals after `through`.
- `files.byLanguage`: map extensions with a fixed table in `buildStats.ts` (`.ts .tsx` TypeScript, `.js .jsx .mjs .cjs` JavaScript, `.py` Python, `.java` Java, `.kt` Kotlin, `.cs` C#, `.go` Go, `.rs` Rust, `.rb` Ruby, `.php` PHP, `.swift` Swift, `.css .scss` CSS, `.html` HTML, `.sql` SQL, `.md` Markdown, `.json .yaml .yml .toml` Config); unknown extensions are dropped.
- `projects.list[].label` = basename of the cwd (redaction happens in Task 7). Sessions per project come from transcripts, falling back to history prompts if no transcripts.
- `sessions.longestMinutesYear` from stats-cache `longestSession` if its timestamp is in the year.

- [ ] **Step 1: Write failing tests**

```ts
test('readTooling counts', async () => expect(await readTooling(fixture())).toEqual({ skills: 1, agents: 1, hooks: 2, plugins: 1, cleanupPeriodDays: null }));
test('buildStats on empty claude dir', async () => {
  const s = await buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
  expect(s.activity.sessions).toBe(0);
  expect(s.coverage).toEqual({ yearFrom: null, statsCacheThrough: null, detailedFrom: null, detailedTo: null, historyFrom: null });
  expect(s.retention.effectiveDays).toBe(30);
});
test('stats-cache before cutoff, transcripts after', async () => {
  const s = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27') });
  expect(s.coverage.statsCacheThrough).toBe('2026-11-11');
  expect(s.coverage.detailedFrom).toBe('2026-11-20');
  expect(s.activity.activeDays).toBe(5 + 2);   // 5 cache days in 2026 + 2 transcript days
  expect(s.files.byLanguage.map(l => l.language).sort()).toEqual(['Python', 'TypeScript']);
  expect(s.activity.byMonth.map(m => m.month)).toEqual(['2026-03', '2026-11']);
});
```

- [ ] **Step 2:** Run `npx vitest run tests/tooling.test.ts tests/buildStats.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Merge sources into a year Stats object"`.

---

### Task 7: Redaction, secret scan and the Claude sample

**Files:**
- Create: `src/redact.ts`
- Test: `tests/redact.test.ts`

**Interfaces:**
- Consumes: `Stats` (Task 6).
- Produces: `scanSecrets(text: string): boolean`; `redactStats(stats: Stats, opts: { mode: 'hide' | 'pick' | 'show'; allow: string[] }): Stats`; `buildSample(stats: Stats): Sample` where `interface Sample { vibeHints: { topTools: string[]; languages: string[]; titles: string[]; projectLabels: string[] }; placeholders: string[] }` (`placeholders` = every dotted path in `stats` whose value is a number or string, for Claude to choose from).

Pinned rules:
- `scanSecrets` returns true for: `sk-ant-` keys, `sk-` followed by 20+ chars, `ghp_`, `gho_`, `github_pat_`, `AKIA[0-9A-Z]{16}`, `xox[abprs]-`, `AIza[0-9A-Za-z_-]{35}`, `-----BEGIN`, JWT shape `eyJ[\w-]+\.[\w-]+\.[\w-]+`, emails, URLs with `user:pass@`, any run of 32+ hex or base64url chars.
- `hide`: labels become `Project A`, `Project B`, ... ordered by sessions desc; `titles` and `branches` emptied; `key` replaced with the label.
- `pick`: projects whose basename is in `allow` keep label, titles and branches; others behave as `hide` (lettered from A after the allowed ones).
- `show`: everything kept.
- In every mode: any string for which `scanSecrets` is true is removed (titles, branches, labels). A secret-bearing label becomes the lettered label.

- [ ] **Step 1: Write failing tests**

```ts
test('scanSecrets', () => {
  expect(scanSecrets('fix login sk-ant-api03-FAKEFAKEFAKEFAKEFAKE')).toBe(true);
  expect(scanSecrets('mail me at a@b.co')).toBe(true);
  expect(scanSecrets('fix the login button')).toBe(false);
});
test('hide mode letters projects and drops titles', () => {
  const r = redactStats(stats, { mode: 'hide', allow: [] });
  expect(r.projects.list.map(p => p.label)).toEqual(['Project A', 'Project B']);
  expect(r.projects.list.every(p => p.titles.length === 0 && p.branches.length === 0)).toBe(true);
  expect(JSON.stringify(r)).not.toContain('alpha');
});
test('show mode still drops secret-bearing title', () => {
  const r = redactStats(stats, { mode: 'show', allow: [] });
  expect(JSON.stringify(r)).not.toContain('sk-ant-');
  expect(r.projects.list.find(p => p.label === 'alpha')!.branches).toEqual(['feat/login']);
});
test('pick mode keeps only allowed names', () => {
  const r = redactStats(stats, { mode: 'pick', allow: ['beta'] });
  expect(r.projects.list.map(p => p.label).sort()).toEqual(['Project A', 'beta']);
});
test('sample lists placeholders', () => expect(buildSample(stats).placeholders).toContain('activity.sessions'));
```

- [ ] **Step 2:** Run `npx vitest run tests/redact.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. `redactStats` returns a new object.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Redact project details and scan for secrets"`.

---

### Task 8: Strength candidates and equivalents

**Files:**
- Create: `src/strengths.ts`, `src/equivalents.ts`; wire both into `buildStats`
- Test: `tests/strengths.test.ts`, `tests/equivalents.test.ts`

**Interfaces:**
- Consumes: `Stats`.
- Produces: `type StrengthId = 'plansFirst' | 'keepsControl' | 'tests' | 'ships' | 'buildsTooling' | 'researches' | 'range' | 'consistency'`; `interface StrengthCandidate { id: StrengthId; value: number; placeholder: string; score: number }`; `strengthCandidates(stats: Stats): StrengthCandidate[]` (only `value > 0`, sorted by `score` desc). `interface Equivalent { id: string; label: string; perPrompt: number; unit: string; provider: string; sourceUrl: string }`; `EQUIVALENTS: Equivalent[]`; `interface EquivalentResult { id: string; value: number; unit: string; label: string; sourceUrl: string }`; `computeEquivalents(prompts: number): EquivalentResult[]`.

Pinned values:

| id | value from | placeholder | threshold |
|---|---|---|---|
| plansFirst | `modes.planShare` | `modes.planShare` | 0.1 |
| keepsControl | `denials.userRejected` | `denials.userRejected` | 10 |
| tests | `tools.testRuns` | `tools.testRuns` | 20 |
| ships | `tools.commits` | `tools.commits` | 20 |
| buildsTooling | `tooling.skills + tooling.agents + tooling.hooks` | `tooling.skills` | 5 |
| researches | `tools.webSearches` | `tools.webSearches` | 25 |
| range | `files.byLanguage.length` | `files.byLanguage.length` | 3 |
| consistency | `activity.longestStreakDays` | `activity.longestStreakDays` | 7 |

`score = value / threshold`.

Equivalents: the builder looks up first-party per-prompt figures at build time. Starting point: Google's published Gemini text-prompt figures (0.24 Wh, 0.26 mL water); find the Google primary page and use its URL. Search for an Anthropic-published figure; if one exists, prefer it. Each label names the provider and contains "estimate" (for example "Water, estimate based on Google's published Gemini figure"). Units: water in glasses (250 mL), energy in Wh. If no first-party source can be found for a figure, it is not in the list.

- [ ] **Step 1: Write failing tests**

```ts
test('candidates sorted by score, zeros dropped', () => {
  const c = strengthCandidates(statsWith({ tools: { testRuns: 40, commits: 0 }, activity: { longestStreakDays: 7 } }));
  expect(c[0]).toMatchObject({ id: 'tests', score: 2 });
  expect(c.find(x => x.id === 'ships')).toBeUndefined();
});
test('every equivalent is first-party, sourced and labelled', () => {
  for (const e of EQUIVALENTS) {
    expect(e.sourceUrl).toMatch(/^https:\/\//);
    expect(e.label.toLowerCase()).toContain('estimate');
    expect(e.label).toContain(e.provider);
  }
});
test('computeEquivalents scales by prompts', () => {
  for (const r of computeEquivalents(1000)) expect(r.value).toBeGreaterThan(0);
});
```

- [ ] **Step 2:** Run the two test files. Expected: FAIL.
- [ ] **Step 3:** Implement; call both from `buildStats` so `stats.strengthCandidates` and `stats.equivalents` are filled.
- [ ] **Step 4:** Run tests plus `tests/buildStats.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit `"Add strength candidates and first-party equivalents"`.

---

### Task 9: Copy validator and placeholder filling

**Files:**
- Create: `src/copy.ts`; add `Copy` to `src/types.ts`
- Test: `tests/copy.test.ts`

**Interfaces:**
- Consumes: `Stats`, `StrengthId`, `scanSecrets`.
- Produces:

```ts
interface Copy {
  schemaVersion: 1; vibe: 'professional' | 'fun' | 'roast'; language: 'en' | 'nl';
  profile?: { headline: string; strengths: { id: StrengthId; text: string }[] };
  persona?: { className: string; specialMove: string; weakness: string; nemesis: string };
  diary?: string[]; awards?: { title: string; text: string }[]; relationship?: { status: string; text: string };
  captions: Record<string, string>;
}
COPY_LIMITS: Record<'headline'|'strength'|'className'|'specialMove'|'weakness'|'nemesis'|'diary'|'awardTitle'|'awardText'|'relationshipStatus'|'relationshipText'|'caption', number>
validateCopy(copy: unknown, stats: Stats): { ok: boolean; errors: string[] }   // errors name the JSON path
fillPlaceholders(text: string, stats: Stats, language: 'en' | 'nl'): string
```

Pinned rules:
- `COPY_LIMITS` (characters, measured after filling placeholders; provisional until the mockup round): headline 60, strength 90, className 28, specialMove 40, weakness 40, nemesis 32, diary 160, awardTitle 32, awardText 120, relationshipStatus 24, relationshipText 140, caption 120.
- `professional` requires `profile` with exactly 3 strengths, distinct ids, each id present in `stats.strengthCandidates`.
- `fun` and `roast` require `persona`, `diary` (3-5 entries), `awards` (3-4), `relationship`.
- Placeholder syntax `{a.b.c}`; must resolve to a number or string in `stats` (array `.length` allowed).
- No digit characters outside placeholders.
- Any string where `scanSecrets` is true is an error.
- `fillPlaceholders` formats numbers with `Intl.NumberFormat(language === 'nl' ? 'nl-BE' : 'en-US', { maximumFractionDigits: 1 })`; values between 0 and 1 whose path ends in `Share` are shown as percentages.

- [ ] **Step 1: Write failing tests**

```ts
test('valid professional copy passes', () => expect(validateCopy(proCopy, stats)).toEqual({ ok: true, errors: [] }));
test('raw digits rejected', () => expect(validateCopy(with(proCopy, 'profile.headline', 'You ran 212 tests'), stats).errors[0]).toMatch(/profile\.headline.*digit/));
test('unknown placeholder rejected', () => expect(validateCopy(with(proCopy, 'profile.headline', '{tools.nope}'), stats).ok).toBe(false));
test('too long after filling rejected', () => expect(validateCopy(with(funCopy, 'persona.className', 'x'.repeat(29)), stats).ok).toBe(false));
test('strength id must be a candidate', () => expect(validateCopy(withStrength(proCopy, 'ships'), statsWithoutCommits).ok).toBe(false));
test('fun needs 3-5 diary entries', () => expect(validateCopy(with(funCopy, 'diary', ['a']), stats).ok).toBe(false));
test('fillPlaceholders formats per language', () => {
  expect(fillPlaceholders('{tools.testRuns} tests', statsWith({ tools: { testRuns: 1234 } }), 'nl')).toBe('1.234 tests');
  expect(fillPlaceholders('{modes.planShare}', statsWith({ modes: { planShare: 0.38 } }), 'en')).toBe('38%');
});
```

- [ ] **Step 2:** Run `npx vitest run tests/copy.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Validate Claude-written copy and fill placeholders"`.

---

### Task 10: Browser detection and screenshot

**Files:**
- Create: `src/browser.ts`
- Test: `tests/browser.test.ts`

**Interfaces:**
- Produces: `findBrowser(opts: { platform: NodeJS.Platform; env: NodeJS.ProcessEnv; exists: (p: string) => boolean }): string | null`; `screenshotArgs(opts: { htmlPath: string; outPng: string; width: number; height: number; userDataDir: string }): string[]`; `screenshot(opts: { browser: string; htmlPath: string; outPng: string; width: number; height: number; timeoutMs?: number }): Promise<void>` (rejects if the PNG is missing or its IHDR size differs).

Pinned values:
- Order: `PROMPTFOLIO_BROWSER` env first (if it exists), then per platform:
  - win32: `%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe`, `%ProgramFiles%\Microsoft\Edge\Application\msedge.exe`, `%ProgramFiles%\Google\Chrome\Application\chrome.exe`, `%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe`, `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`, `%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe`, `%LOCALAPPDATA%\Chromium\Application\chrome.exe`.
  - darwin: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`, `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`, `/Applications/Chromium.app/Contents/MacOS/Chromium`.
  - linux: each of `google-chrome`, `google-chrome-stable`, `chromium`, `chromium-browser`, `microsoft-edge`, `brave-browser` joined with every `PATH` entry.
- Args: `--headless=new`, `--disable-gpu`, `--hide-scrollbars`, `--no-first-run`, `--no-default-browser-check`, `--user-data-dir=<fresh temp dir>`, `--screenshot=<outPng>`, `--window-size=<w>,<h>`, `--virtual-time-budget=3000`, then `pathToFileURL(htmlPath).href` last.
- `screenshot` uses `execFile` (no shell), default timeout 30 s, removes the temp profile afterwards.

- [ ] **Step 1: Write failing tests**

```ts
test('env override wins', () => expect(findBrowser({ platform: 'win32', env: { PROMPTFOLIO_BROWSER: 'C:\\b\\x.exe' }, exists: () => true })).toBe('C:\\b\\x.exe'));
test('finds Edge in Program Files (x86)', () => {
  const env = { 'ProgramFiles(x86)': 'C:\\Program Files (x86)', ProgramFiles: 'C:\\Program Files', LOCALAPPDATA: 'C:\\L' };
  expect(findBrowser({ platform: 'win32', env, exists: p => p.includes('Edge') })).toBe('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
});
test('null when nothing exists', () => expect(findBrowser({ platform: 'linux', env: { PATH: '/usr/bin' }, exists: () => false })).toBeNull());
test('screenshotArgs uses a fresh user-data-dir and no shell', () => {
  const a = screenshotArgs({ htmlPath: 'C:\\a b\\c.html', outPng: 'C:\\a b\\o.png', width: 1080, height: 1920, userDataDir: 'C:\\t\\p' });
  expect(a).toContain('--user-data-dir=C:\\t\\p');
  expect(a).toContain('--window-size=1080,1920');
  expect(a.at(-1)).toMatch(/^file:\/\/\/C:\/a%20b\/c\.html$/);
});
const browser = findBrowser({ platform: process.platform, env: process.env, exists: fs.existsSync });
test.skipIf(!browser)('renders a 1080x1920 PNG', async () => {
  // write a tiny HTML file to a temp dir, call screenshot, assert IHDR width/height
});
```

- [ ] **Step 2:** Run `npx vitest run tests/browser.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Paths are built with `path.win32.join` / `path.posix.join` based on `opts.platform`, so tests run on any OS.
- [ ] **Step 4:** Run tests. Expected: PASS (the render test runs on this Windows machine with Edge).
- [ ] **Step 5:** Commit `"Detect a local Chromium browser and take headless screenshots"`.

---

### Task 11: CLIs, build, skill v0 and CI

**Files:**
- Create: `src/cli/stats.ts`, `src/cli/validate.ts`, `src/cli/doctor.ts`, `esbuild.config.mjs`, `.github/workflows/ci.yml`; built `plugins/promptfolio/skills/promptfolio/scripts/{stats,validate,doctor}.mjs`; full `SKILL.md`
- Test: `tests/cli.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces (command lines used by the skill and by Plan 2):
  - `node scripts/doctor.mjs` → prints JSON `{ node: string, claudeDir: string, claudeDirExists: boolean, browser: string | null, cleanupPeriodDays: number | null }`, exit 0.
  - `node scripts/stats.mjs --out <dir> [--year <n>] [--tz <iana>] [--projects hide|pick|show] [--allow a,b] [--claude-dir <path>]` → writes `<dir>/stats.json` (redacted) and `<dir>/sample.json`, prints the two paths, exit 0; exit 2 with a one-line message if the Claude dir does not exist. Defaults: current year, local tz, `hide`.
  - `node scripts/validate.mjs <copy.json> <stats.json>` → exit 0 and `OK`, or exit 1 and one error per line.

- [ ] **Step 1: Write failing tests** (spawn the built scripts with `execFileSync(process.execPath, [...])` against the fixture):

```ts
test('stats CLI writes redacted stats and sample', () => {
  execFileSync(process.execPath, [script('stats'), '--claude-dir', fixture(), '--year', '2026', '--tz', 'Europe/Brussels', '--out', tmp]);
  const s = JSON.parse(fs.readFileSync(path.join(tmp, 'stats.json'), 'utf8'));
  expect(s.projects.list[0].label).toBe('Project A');
  expect(fs.readFileSync(path.join(tmp, 'stats.json'), 'utf8')).not.toMatch(/sk-ant-|alpha/);
});
test('stats CLI exits 2 on missing dir', () => expect(() => execFileSync(process.execPath, [script('stats'), '--claude-dir', fixture('nope'), '--out', tmp])).toThrow(expect.objectContaining({ status: 2 })));
test('validate CLI', () => { /* valid copy → status 0, invalid → status 1 with path in stdout */ });
```

- [ ] **Step 2:** Run `npm run build && npx vitest run tests/cli.test.ts`. Expected: FAIL (no CLIs yet).
- [ ] **Step 3:** Implement the CLIs with `node:util` `parseArgs`. `esbuild.config.mjs` bundles each `src/cli/*.ts` to `plugins/promptfolio/skills/promptfolio/scripts/<name>.mjs` with `platform: 'node'`, `format: 'esm'`, `target: 'node18'`, `bundle: true`.
- [ ] **Step 4:** Write `SKILL.md` v0. Steps, in order, all paths relative to the skill folder:
  1. Run `node -v`; if missing or below 18, tell the user Promptfolio needs Node 18+ and stop.
  2. Run `doctor.mjs`; if `claudeDirExists` is false, say so and stop.
  3. Say: "Quick setup (5 taps), or type go for the professional version." Ask with AskUserQuestion: vibe (Professional / Fun / Roast me), posting where (IG story / LinkedIn / X / Discord / Just me, multi-select), project names (Hide all / Pick which / Show), theme (Trading card; only for Fun and Roast me), language (English / Nederlands). "go" at any point → professional, hide, English, all formats.
  4. If `cleanupPeriodDays` is null or below 366: explain that Claude Code deletes detailed logs after that many days and ask whether to set `cleanupPeriodDays` to 400 in `settings.json`. Edit only on a yes.
  5. Show the privacy line exactly: "The scripts upload nothing. Claude reads redacted stats in your own session to write the text."
  6. Run `stats.mjs --out ./promptfolio-<year> --projects <mode> [--allow ...]`.
  7. Read `stats.json` and `sample.json`. Write `copy.json` following the `Copy` shape and the rules (placeholders only for numbers, no digits, every line points at something real in the data, factual tone for professional, never "top X%").
  8. Run `validate.mjs`; on errors, fix and rerun, at most 3 times.
  9. Plan 1 end state: print the filled copy as a text preview and say rendering comes next (Plan 2 replaces this step).
- [ ] **Step 5:** `ci.yml`: matrix `os: [ubuntu-latest, macos-latest, windows-latest]`, `node: [18, 22]`; steps: checkout, setup-node, `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --exit-code plugins/` (built scripts must be committed and fresh).
- [ ] **Step 6:** Run the full suite once: `npm run typecheck && npm test && npm run build && git status --short plugins/`. Expected: all pass, no uncommitted build output after committing.
- [ ] **Step 7:** Commit `"Add stats, validate and doctor CLIs, skill v0 and CI"`.

---

### Task 12: Real-data run on the author's machine

**Files:**
- Modify: only if the run exposes a bug (fix at the root with a new fixture line and test in the owning task's test file).

- [ ] **Step 1:** Run `node plugins/promptfolio/skills/promptfolio/scripts/doctor.mjs`. Expected: Node 22, `claudeDirExists: true`, Edge or Chrome path.
- [ ] **Step 2:** Time it: `node plugins/promptfolio/skills/promptfolio/scripts/stats.mjs --out %TEMP%\pf-real` over the real 1.1 GB. Expected: finishes, exit 0. Record the duration in the commit message if over 60 s.
- [ ] **Step 3:** Inspect `stats.json` by hand: `activity.sessions` within 10% of `stats-cache.json` `totalSessions` for the year, `coverage.detailedFrom` near Oct 10, `projects.list` lettered, `grep -E "sk-|@|C:\\\\"` finds nothing.
- [ ] **Step 4:** Run the skill end to end in a fresh Claude Code session with `/promptfolio` and "go". Expected: valid `copy.json`, text preview shown.
- [ ] **Step 5:** Commit any fixes. Then stop: the mockup round happens before Plan 2.
