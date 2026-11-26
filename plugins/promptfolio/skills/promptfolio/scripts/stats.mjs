// Built from src/cli by esbuild. Do not edit; run `npm run build`.

// src/cli/stats.ts
import fs4 from "node:fs";
import os from "node:os";
import path6 from "node:path";
import { parseArgs } from "node:util";

// src/buildStats.ts
import path4 from "node:path";

// src/jsonl.ts
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
async function* readJsonl(file, counter = { bad: 0 }) {
  let input;
  if (typeof file === "string") {
    if (!fs.existsSync(file)) return;
    input = fs.createReadStream(file, { encoding: "utf8" });
  } else {
    input = file;
  }
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line);
      } catch {
        counter.bad++;
      }
    }
  } finally {
    rl.close();
    if ("destroy" in input && typeof input.destroy === "function") input.destroy();
  }
}
async function findTranscripts(projectsDir) {
  const out = [];
  async function walk(dir) {
    let entries2;
    try {
      entries2 = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries2) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(p);
    }
  }
  await walk(projectsDir);
  return out;
}

// src/equivalents.ts
var GOOGLE_SOURCE = "https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference";
var GLASS_ML = 250;
var EQUIVALENTS = [
  {
    id: "energy",
    label: "Energy, estimate based on Google's published per-prompt Gemini figure",
    perPrompt: 0.24,
    unit: "Wh",
    provider: "Google",
    sourceUrl: GOOGLE_SOURCE
  },
  {
    id: "water",
    label: "Water, estimate based on Google's published per-prompt Gemini figure",
    perPrompt: 0.26 / GLASS_ML,
    unit: "glasses of water (250 mL)",
    provider: "Google",
    sourceUrl: GOOGLE_SOURCE
  }
];
function computeEquivalents(prompts) {
  return EQUIVALENTS.map((e) => ({ id: e.id, value: prompts * e.perPrompt, unit: e.unit, label: e.label, sourceUrl: e.sourceUrl }));
}

// src/text.ts
var POLITE_WORDS = [
  "please",
  "pls",
  "thanks",
  "thank you",
  "thx",
  "sorry",
  "alsjeblieft",
  "aub",
  "bedankt",
  "dankje",
  "dank je",
  "merci"
];
var CORRECTION_PHRASES = [
  "no wait",
  "wait",
  "actually",
  "that's wrong",
  "undo",
  "revert",
  "not what i",
  "nee",
  "wacht",
  "klopt niet",
  "fout",
  "terugdraaien"
];
var NL = new Set("de het een ik je niet wat maar ook nog dat voor is dit zijn kan moet".split(" "));
var EN = new Set("the and is you not what but this that for are can should with".split(" "));
function classifyLanguage(text) {
  let nl = 0;
  let en = 0;
  for (const w of text.toLowerCase().split(/[^\p{L}']+/u)) {
    if (NL.has(w)) nl++;
    if (EN.has(w)) en++;
  }
  if (Math.max(nl, en) < 2 || nl === en) return "other";
  return nl > en ? "nl" : "en";
}
var escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var patternCache = /* @__PURE__ */ new Map();
function countMatches(text, words) {
  let re = patternCache.get(words);
  if (!re) {
    re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(escape).join("|")})(?![\\p{L}\\p{N}])`, "giu");
    patternCache.set(words, re);
  }
  return text.match(re)?.length ?? 0;
}
var TEST_RUNNER_RE = /\b(?:vitest|jest|pytest|phpunit|rspec)\b|\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test\b|(?:\bmvn|\.\/mvnw)\s+(?:-\S+\s+)*test\b|(?:\bgradle|\.\/gradlew)\s+(?:-\S+\s+)*test\b|\b(?:go|cargo|dotnet)\s+test\b/;
var GIT_COMMIT_RE = /\bgit\s+commit\b/;

// src/time.ts
var formatters = /* @__PURE__ */ new Map();
function parts(ts, tz) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23"
    });
    formatters.set(tz, f);
  }
  const out = {};
  for (const p of f.formatToParts(new Date(ts))) out[p.type] = p.value;
  return out;
}
function localDate(ts, tz) {
  const p = parts(ts, tz);
  return `${p.year}-${p.month}-${p.day}`;
}
function localHour(ts, tz) {
  return Number(parts(ts, tz).hour);
}
function localMonth(ts, tz) {
  return localDate(ts, tz).slice(0, 7);
}

// src/sources/history.ts
async function readHistory(file, opts) {
  const h = {
    from: null,
    prompts: 0,
    slashCommands: 0,
    politeness: 0,
    corrections: 0,
    languages: { en: 0, nl: 0, other: 0 },
    hourCounts: Array(24).fill(0),
    sessions: 0,
    lateNightSessions: 0,
    projects: {},
    byMonth: []
  };
  const firstBySession = /* @__PURE__ */ new Map();
  const months = /* @__PURE__ */ new Map();
  const year = String(opts.year);
  for await (const row of readJsonl(file)) {
    const r = row;
    if (typeof r.display !== "string" || typeof r.timestamp !== "number") continue;
    const date = localDate(r.timestamp, opts.tz);
    if (!date.startsWith(year)) continue;
    if (typeof r.sessionId === "string") {
      const prev = firstBySession.get(r.sessionId);
      if (prev === void 0 || r.timestamp < prev) firstBySession.set(r.sessionId, r.timestamp);
    }
    if (r.display.trimStart().startsWith("/")) {
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
    if (typeof r.project === "string") h.projects[r.project] = (h.projects[r.project] ?? 0) + 1;
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

// src/sources/statsCache.ts
import fs2 from "node:fs";
var EMPTY = { through: null, daily: [], dailyTokens: [], firstSessionDate: null, longestSession: null };
var num = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
var str = (v) => typeof v === "string" ? v : null;
var arr = (v) => Array.isArray(v) ? v : [];
async function readStatsCache(file) {
  let raw;
  try {
    raw = JSON.parse(await fs2.promises.readFile(file, "utf8"));
  } catch {
    return { ...EMPTY };
  }
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const ls = raw.longestSession;
  return {
    through: str(raw.lastComputedDate),
    daily: arr(raw.dailyActivity).filter((d) => typeof d?.date === "string").map((d) => ({ date: d.date, messages: num(d.messageCount), sessions: num(d.sessionCount), toolCalls: num(d.toolCallCount) })),
    dailyTokens: arr(raw.dailyModelTokens).filter((d) => typeof d?.date === "string" && d.tokensByModel && typeof d.tokensByModel === "object").map((d) => ({ date: d.date, tokensByModel: d.tokensByModel })),
    firstSessionDate: str(raw.firstSessionDate),
    longestSession: ls && typeof ls === "object" ? { durationMs: num(ls.duration), messages: num(ls.messageCount), timestamp: str(ls.timestamp) ?? "" } : null
  };
}

// src/sources/tooling.ts
import fs3 from "node:fs";
import path2 from "node:path";
async function entries(dir) {
  try {
    return await fs3.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
async function readTooling(claudeDir) {
  let skills = 0;
  for (const e of await entries(path2.join(claudeDir, "skills"))) {
    if (e.isDirectory() && fs3.existsSync(path2.join(claudeDir, "skills", e.name, "SKILL.md"))) skills++;
  }
  const agents = (await entries(path2.join(claudeDir, "agents"))).filter((e) => e.isFile() && e.name.endsWith(".md")).length;
  let settings = {};
  try {
    settings = JSON.parse(await fs3.promises.readFile(path2.join(claudeDir, "settings.json"), "utf8")) ?? {};
  } catch {
  }
  let hooks = 0;
  if (settings.hooks && typeof settings.hooks === "object") {
    for (const groups of Object.values(settings.hooks)) {
      for (const g of Array.isArray(groups) ? groups : []) hooks += Array.isArray(g?.hooks) ? g.hooks.length : 0;
    }
  }
  const plugins = settings.enabledPlugins && typeof settings.enabledPlugins === "object" ? Object.values(settings.enabledPlugins).filter((v) => v === true).length : 0;
  const c = settings.cleanupPeriodDays;
  return { skills, agents, hooks, plugins, cleanupPeriodDays: typeof c === "number" && Number.isFinite(c) ? c : null };
}

// src/sources/transcripts.ts
import path3 from "node:path";
var IDLE_GAP_MS = 30 * 6e4;
function longestActiveMinutes(sorted) {
  let best = 0;
  let start = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    if (i === sorted.length || sorted[i] - sorted[i - 1] > IDLE_GAP_MS) {
      best = Math.max(best, sorted[i - 1] - start);
      start = sorted[i];
    }
  }
  return Math.round(best / 6e4);
}
var EDIT_TOOLS = /* @__PURE__ */ new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
var num2 = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
var bump = (o, k, by = 1) => {
  o[k] = (o[k] ?? 0) + by;
};
async function readTranscripts(files, opts) {
  const t = {
    from: null,
    to: null,
    daily: [],
    dailyTokens: [],
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, thinking: 0, byModel: {} },
    tools: { calls: 0, byName: {}, bash: 0, testRuns: 0, commits: 0, mcpCalls: 0, webSearches: 0 },
    denials: { userRejected: 0, automatic: 0, byTool: {} },
    permissionModes: {},
    effort: {},
    entrypoints: {},
    files: { edited: 0, byExtension: {} },
    sessions: { count: 0, subagentSessions: 0, longestMinutes: 0, compactions: 0, apiErrors: 0, hookErrors: 0 },
    projects: {}
  };
  const year = String(opts.year);
  const days = /* @__PURE__ */ new Map();
  const sessionTimes = /* @__PURE__ */ new Map();
  const sessionCwd = /* @__PURE__ */ new Map();
  const sessionEntry = /* @__PURE__ */ new Map();
  const sessionTitles = /* @__PURE__ */ new Map();
  const branches = /* @__PURE__ */ new Map();
  const edited = /* @__PURE__ */ new Set();
  const tokensByDate = /* @__PURE__ */ new Map();
  const day = (date) => {
    let d = days.get(date);
    if (!d) days.set(date, d = { messages: 0, toolCalls: 0 });
    return d;
  };
  for (const file of files) {
    const isSubagentFile = file.split(/[\\/]/).includes("subagents");
    if (isSubagentFile) t.sessions.subagentSessions++;
    const toolNames = /* @__PURE__ */ new Map();
    const fileEffort = {};
    let fileInYear = false;
    for await (const row of readJsonl(file)) {
      const r = row;
      if (!r || typeof r !== "object") continue;
      const sid = typeof r.sessionId === "string" ? r.sessionId : void 0;
      if (r.type === "custom-title" && typeof r.customTitle === "string" && sid) {
        if (!sessionTitles.has(sid)) sessionTitles.set(sid, /* @__PURE__ */ new Set());
        sessionTitles.get(sid).add(r.customTitle);
        continue;
      }
      if (r.type === "api-request-blob") {
        const effort = r.message?.output_config?.effort;
        if (typeof effort === "string") bump(fileEffort, effort);
        continue;
      }
      if (typeof r.timestamp !== "string") continue;
      const ts = Date.parse(r.timestamp);
      if (Number.isNaN(ts)) continue;
      const date = localDate(ts, opts.tz);
      if (!date.startsWith(year)) continue;
      const main2 = !isSubagentFile && r.isSidechain !== true;
      fileInYear = true;
      if (!t.from || date < t.from) t.from = date;
      if (!t.to || date > t.to) t.to = date;
      if (main2 && sid) {
        if (!sessionTimes.has(sid)) sessionTimes.set(sid, []);
        sessionTimes.get(sid).push(ts);
        if (typeof r.cwd === "string" && !sessionCwd.has(sid)) sessionCwd.set(sid, r.cwd);
        if (typeof r.entrypoint === "string" && !sessionEntry.has(sid)) sessionEntry.set(sid, r.entrypoint);
        if (typeof r.cwd === "string" && typeof r.gitBranch === "string" && r.gitBranch) {
          if (!branches.has(r.cwd)) branches.set(r.cwd, /* @__PURE__ */ new Set());
          branches.get(r.cwd).add(r.gitBranch);
        }
      }
      if (r.type === "system") {
        if (r.subtype === "compact_boundary") t.sessions.compactions++;
        if (r.subtype === "api_error") t.sessions.apiErrors++;
      }
      if (Array.isArray(r.hookErrors)) t.sessions.hookErrors += r.hookErrors.length;
      if (r.type === "user") {
        if (typeof r.permissionMode === "string") bump(t.permissionModes, r.permissionMode);
        if (typeof r.toolDenialKind === "string") {
          if (r.toolDenialKind === "user-rejected") t.denials.userRejected++;
          else t.denials.automatic++;
          const result = Array.isArray(r.message?.content) ? r.message.content.find((b) => b?.type === "tool_result") : void 0;
          bump(t.denials.byTool, toolNames.get(result?.tool_use_id) ?? "unknown");
        }
      }
      if (main2 && sid && (r.type === "user" || r.type === "assistant")) {
        day(date).messages++;
      }
      if (r.type === "assistant" && r.message && typeof r.message === "object") {
        const u = r.message.usage ?? {};
        const input = num2(u.input_tokens), output = num2(u.output_tokens);
        const cacheRead = num2(u.cache_read_input_tokens), cacheCreation = num2(u.cache_creation_input_tokens);
        t.tokens.input += input;
        t.tokens.output += output;
        t.tokens.cacheRead += cacheRead;
        t.tokens.cacheCreation += cacheCreation;
        t.tokens.thinking += num2(u.output_tokens_details?.thinking_tokens);
        t.tools.webSearches += num2(u.server_tool_use?.web_search_requests);
        if (typeof r.message.model === "string") {
          const total = input + output + cacheRead + cacheCreation;
          bump(t.tokens.byModel, r.message.model, total);
          if (!tokensByDate.has(date)) tokensByDate.set(date, {});
          bump(tokensByDate.get(date), r.message.model, total);
        }
        for (const b of Array.isArray(r.message.content) ? r.message.content : []) {
          if (b?.type !== "tool_use" || typeof b.name !== "string") continue;
          if (typeof b.id === "string") toolNames.set(b.id, b.name);
          t.tools.calls++;
          day(date).toolCalls++;
          bump(t.tools.byName, b.name);
          if (b.name.startsWith("mcp__")) t.tools.mcpCalls++;
          if (b.name === "WebSearch") t.tools.webSearches++;
          if (b.name === "Bash" && typeof b.input?.command === "string") {
            t.tools.bash++;
            if (TEST_RUNNER_RE.test(b.input.command)) t.tools.testRuns++;
            if (GIT_COMMIT_RE.test(b.input.command)) t.tools.commits++;
          }
          if (EDIT_TOOLS.has(b.name)) {
            const fp = b.input?.file_path ?? b.input?.notebook_path;
            if (typeof fp === "string" && !edited.has(fp)) {
              edited.add(fp);
              const ext = path3.extname(fp.replaceAll("\\", "/")).toLowerCase();
              if (ext) bump(t.files.byExtension, ext);
            }
          }
        }
      }
    }
    if (fileInYear) for (const [k, n] of Object.entries(fileEffort)) bump(t.effort, k, n);
  }
  t.files.edited = edited.size;
  t.sessions.count = sessionTimes.size;
  const sessionsByFirstDay = {};
  for (const times of sessionTimes.values()) {
    times.sort((a, b) => a - b);
    bump(sessionsByFirstDay, localDate(times[0], opts.tz));
    t.sessions.longestMinutes = Math.max(t.sessions.longestMinutes, longestActiveMinutes(times));
  }
  for (const e of sessionEntry.values()) bump(t.entrypoints, e);
  for (const [sid, cwd] of sessionCwd) {
    const p = t.projects[cwd] ??= { sessions: 0, branches: [...branches.get(cwd) ?? []], titles: [] };
    p.sessions++;
    for (const title of sessionTitles.get(sid) ?? []) if (!p.titles.includes(title)) p.titles.push(title);
  }
  t.daily = [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({ date, messages: d.messages, sessions: sessionsByFirstDay[date] ?? 0, toolCalls: d.toolCalls }));
  t.dailyTokens = [...tokensByDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, tokensByModel]) => ({ date, tokensByModel }));
  return t;
}

// src/streaks.ts
var DAY = 864e5;
function toDays(dates) {
  return [...new Set(dates)].map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY).sort((a, b) => a - b);
}
function longestStreak(dates) {
  const days = toDays(dates);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] - days[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
function longestGap(dates) {
  const days = toDays(dates);
  let best = 0;
  for (let i = 1; i < days.length; i++) best = Math.max(best, days[i] - days[i - 1] - 1);
  return best;
}

// src/strengths.ts
var RULES = [
  { id: "plansFirst", value: (s) => s.modes.planShare, placeholder: "modes.planShare", threshold: 0.1 },
  { id: "keepsControl", value: (s) => s.denials.userRejected, placeholder: "denials.userRejected", threshold: 10 },
  { id: "tests", value: (s) => s.tools.testRuns, placeholder: "tools.testRuns", threshold: 20 },
  { id: "ships", value: (s) => s.tools.commits, placeholder: "tools.commits", threshold: 20 },
  { id: "buildsTooling", value: (s) => s.tooling.skills + s.tooling.agents + s.tooling.hooks, placeholder: "tooling.skills", threshold: 5 },
  { id: "researches", value: (s) => s.tools.webSearches, placeholder: "tools.webSearches", threshold: 25 },
  { id: "range", value: (s) => s.files.byLanguage.length, placeholder: "files.byLanguage.length", threshold: 3 },
  { id: "consistency", value: (s) => s.activity.longestStreakDays, placeholder: "activity.longestStreakDays", threshold: 7 }
];
function strengthCandidates(stats) {
  return RULES.map((r) => {
    const value = r.value(stats);
    return { id: r.id, value, placeholder: r.placeholder, score: value / r.threshold };
  }).filter((c) => c.value > 0).sort((a, b) => b.score - a.score);
}

// src/buildStats.ts
var LANGUAGES = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".java": "Java",
  ".kt": "Kotlin",
  ".cs": "C#",
  ".go": "Go",
  ".rs": "Rust",
  ".rb": "Ruby",
  ".php": "PHP",
  ".swift": "Swift",
  ".css": "CSS",
  ".scss": "CSS",
  ".html": "HTML",
  ".sql": "SQL",
  ".md": "Markdown",
  ".json": "Config",
  ".yaml": "Config",
  ".yml": "Config",
  ".toml": "Config"
};
var DEFAULT_RETENTION_DAYS = 30;
var MAX_TRUSTED_CACHE_SESSION_MINUTES = 12 * 60;
function pickLongestSessionMinutes(cacheMinutes, transcriptMinutes) {
  const cache = cacheMinutes !== null && cacheMinutes <= MAX_TRUSTED_CACHE_SESSION_MINUTES ? cacheMinutes : null;
  const best = Math.max(cache ?? 0, transcriptMinutes);
  return best > 0 ? best : null;
}
var share = (part, whole) => whole > 0 ? part / whole : 0;
var maxEntry = (o) => Object.entries(o).sort(([a, x], [b, y]) => y - x || a.localeCompare(b))[0]?.[0] ?? null;
var baseName = (p) => p.includes("\\") ? path4.win32.basename(p) : path4.posix.basename(p);
async function buildStats(opts) {
  const { claudeDir, year, tz } = opts;
  const y = String(year);
  const inYear = (date) => date.startsWith(y);
  const [cache, history, tooling, transcripts] = await Promise.all([
    readStatsCache(path4.join(claudeDir, "stats-cache.json")),
    readHistory(path4.join(claudeDir, "history.jsonl"), { year, tz }),
    readTooling(claudeDir),
    findTranscripts(path4.join(claudeDir, "projects")).then((files) => readTranscripts(files, { year, tz }))
  ]);
  const through = cache.through;
  const fromCache = (date) => through !== null && date <= through;
  const daily = [
    ...cache.daily.filter((d) => inYear(d.date) && fromCache(d.date)),
    ...transcripts.daily.filter((d) => !fromCache(d.date))
  ].sort((a, b) => a.date.localeCompare(b.date));
  const byModel = {};
  for (const d of [...cache.dailyTokens.filter((d2) => inYear(d2.date) && fromCache(d2.date)), ...transcripts.dailyTokens.filter((d2) => !fromCache(d2.date))]) {
    for (const [m, n] of Object.entries(d.tokensByModel)) if (typeof n === "number") byModel[m] = (byModel[m] ?? 0) + n;
  }
  const months = /* @__PURE__ */ new Map();
  for (const d of daily) {
    const m = months.get(d.date.slice(0, 7)) ?? { activeDays: 0, messages: 0, sessions: 0 };
    m.activeDays++;
    m.messages += d.messages;
    m.sessions += d.sessions;
    months.set(d.date.slice(0, 7), m);
  }
  const byMonth = [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  const dates = daily.map((d) => d.date);
  const busiestDay = daily.reduce((best, d) => !best || d.messages > best.messages ? d : best, null);
  const busiestMonth = byMonth.reduce((best, m) => !best || m.messages > best.messages ? m : best, null);
  const projectSource = Object.keys(transcripts.projects).length > 0 ? transcripts.projects : Object.fromEntries(Object.entries(history.projects).map(([k, n]) => [k, { sessions: n, branches: [], titles: [] }]));
  const list = Object.entries(projectSource).map(([key, p]) => ({ key, label: baseName(key), sessions: p.sessions, titles: [...p.titles], branches: [...p.branches] })).sort((a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label));
  const languageCounts = {};
  for (const [ext, n] of Object.entries(transcripts.files.byExtension)) {
    const lang = LANGUAGES[ext];
    if (lang) languageCounts[lang] = (languageCounts[lang] ?? 0) + n;
  }
  const modeTotal = Object.values(transcripts.permissionModes).reduce((a, b) => a + b, 0);
  const ls = cache.longestSession;
  const yearFrom = [dates[0], history.from, transcripts.from].filter((d) => !!d).sort()[0] ?? null;
  const stats = {
    schemaVersion: 1,
    year,
    generatedAt: opts.now.toISOString(),
    tz,
    coverage: {
      yearFrom,
      statsCacheThrough: through,
      detailedFrom: transcripts.from,
      detailedTo: transcripts.to,
      historyFrom: history.from
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
      byMonth
    },
    tokens: { yearTotal: Object.values(byModel).reduce((a, b) => a + b, 0), byModel, detailed: transcripts.tokens },
    prompts: {
      count: history.prompts,
      slashCommands: history.slashCommands,
      politeness: history.politeness,
      corrections: history.corrections,
      languages: history.languages,
      byMonth: history.byMonth
    },
    tools: {
      ...transcripts.tools,
      top: Object.entries(transcripts.tools.byName).sort(([a, x], [b, y2]) => y2 - x || a.localeCompare(b)).slice(0, 10).map(([name, count]) => ({ name, count }))
    },
    denials: {
      userRejected: transcripts.denials.userRejected,
      automatic: transcripts.denials.automatic,
      topDeniedTool: maxEntry(Object.fromEntries(Object.entries(transcripts.denials.byTool).filter(([k]) => k !== "unknown")))
    },
    modes: { planShare: share(transcripts.permissionModes.plan ?? 0, modeTotal), byMode: transcripts.permissionModes },
    effort: transcripts.effort,
    entrypoints: transcripts.entrypoints,
    files: {
      edited: transcripts.files.edited,
      byLanguage: Object.entries(languageCounts).sort(([a, x], [b, y2]) => y2 - x || a.localeCompare(b)).map(([language, count]) => ({ language, count }))
    },
    sessions: {
      ...transcripts.sessions,
      longestMinutesYear: pickLongestSessionMinutes(
        ls && ls.timestamp && inYear(ls.timestamp.slice(0, 10)) ? Math.round(ls.durationMs / 6e4) : null,
        transcripts.sessions.longestMinutes
      )
    },
    projects: { count: list.length, branchCount: list.reduce((a, p) => a + p.branches.length, 0), list },
    tooling: { skills: tooling.skills, agents: tooling.agents, hooks: tooling.hooks, plugins: tooling.plugins },
    strengthCandidates: [],
    equivalents: computeEquivalents(history.prompts)
  };
  stats.strengthCandidates = strengthCandidates(stats);
  return stats;
}

// src/paths.ts
import path5 from "node:path";
function resolveClaudeDir(env, home) {
  return env.CLAUDE_CONFIG_DIR || path5.join(home, ".claude");
}

// src/redact.ts
var SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{8,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{35}/,
  /-----BEGIN/,
  /\beyJ[\w-]+\.[\w-]+\.[\w-]+/,
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^@\s]+@/i,
  /\b[0-9a-fA-F]{32,}\b/
];
function looksRandom(text) {
  for (const run of text.match(/[A-Za-z0-9+/=_-]{40,}/g) ?? []) {
    if (/[A-Z]/.test(run) && /[a-z]/.test(run) && /[0-9]/.test(run)) return true;
  }
  return false;
}
function scanSecrets(text) {
  return SECRET_PATTERNS.some((re) => re.test(text)) || looksRandom(text);
}
function redactStats(stats, opts) {
  const allow = new Set(opts.allow);
  const visible = (p) => !scanSecrets(p.label) && (opts.mode === "show" || opts.mode === "pick" && allow.has(p.label));
  const shown = stats.projects.list.filter(visible);
  const hidden = stats.projects.list.filter((p) => !visible(p));
  const list = [
    ...shown.map((p) => ({
      key: p.label,
      label: p.label,
      sessions: p.sessions,
      titles: p.titles.filter((t) => !scanSecrets(t)),
      branches: p.branches.filter((b) => !scanSecrets(b))
    })),
    ...hidden.map((p, i) => {
      const label = `Project ${letters(i)}`;
      return { key: label, label, sessions: p.sessions, titles: [], branches: [] };
    })
  ].sort((a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label));
  return {
    ...structuredClone(stats),
    projects: { count: list.length, branchCount: list.reduce((a, p) => a + p.branches.length, 0), list }
  };
}
function letters(i) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
}
function buildSample(stats) {
  const clean = (xs) => xs.filter((x) => !scanSecrets(x));
  return {
    vibeHints: {
      topTools: clean(stats.tools.top.map((t) => t.name)),
      languages: stats.files.byLanguage.map((l) => l.language),
      titles: clean(stats.projects.list.flatMap((p) => p.titles)).slice(0, 20),
      projectLabels: stats.projects.list.map((p) => p.label)
    },
    placeholders: placeholderPaths(stats)
  };
}
function placeholderPaths(value, prefix = "") {
  if (typeof value === "number" || typeof value === "string") return prefix ? [prefix] : [];
  if (Array.isArray(value)) {
    return [`${prefix}.length`, ...value.flatMap((v, i) => placeholderPaths(v, `${prefix}.${i}`))];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => placeholderPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

// src/cli/stats.ts
var MODES = ["hide", "pick", "show"];
async function main() {
  const { values } = parseArgs({
    options: {
      out: { type: "string" },
      year: { type: "string" },
      tz: { type: "string" },
      projects: { type: "string", default: "hide" },
      allow: { type: "string", default: "" },
      "claude-dir": { type: "string" }
    }
  });
  const now = /* @__PURE__ */ new Date();
  const year = values.year ? Number(values.year) : now.getFullYear();
  const mode = values.projects;
  if (!values.out) return fail("Missing --out <dir>.", 1);
  if (!Number.isInteger(year)) return fail(`Invalid --year: ${values.year}`, 1);
  if (!MODES.includes(mode)) return fail(`Invalid --projects: ${values.projects} (use hide, pick or show)`, 1);
  const claudeDir = values["claude-dir"] ?? resolveClaudeDir(process.env, os.homedir());
  if (!fs4.existsSync(claudeDir)) return fail(`Claude Code data folder not found: ${claudeDir}`, 2);
  const tz = values.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stats = redactStats(await buildStats({ claudeDir, year, tz, now }), {
    mode,
    allow: values.allow.split(",").map((s) => s.trim()).filter(Boolean)
  });
  const out = path6.resolve(values.out);
  fs4.mkdirSync(out, { recursive: true });
  const statsPath = path6.join(out, "stats.json");
  const samplePath = path6.join(out, "sample.json");
  fs4.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  fs4.writeFileSync(samplePath, JSON.stringify(buildSample(stats), null, 2));
  console.log(statsPath);
  console.log(samplePath);
  return 0;
}
function fail(message, code) {
  console.error(message);
  return code;
}
main().then((code) => {
  process.exitCode = code;
}, (err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
