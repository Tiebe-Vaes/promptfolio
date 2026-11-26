import path from 'node:path';
import { readJsonl } from '../jsonl.js';
import { GIT_COMMIT_RE, TEST_RUNNER_RE } from '../text.js';
import { localDate } from '../time.js';
import type { DailyActivity } from '../types.js';

export interface TranscriptStats {
  from: string | null;
  to: string | null;
  daily: DailyActivity[];
  /** Same shape as stats-cache dailyModelTokens, so the two can be merged at a date cutoff. */
  dailyTokens: { date: string; tokensByModel: Record<string, number> }[];
  tokens: { input: number; output: number; cacheRead: number; cacheCreation: number; thinking: number; byModel: Record<string, number> };
  tools: { calls: number; byName: Record<string, number>; bash: number; testRuns: number; commits: number; mcpCalls: number; webSearches: number };
  denials: { userRejected: number; automatic: number; byTool: Record<string, number> };
  permissionModes: Record<string, number>;
  effort: Record<string, number>;
  entrypoints: Record<string, number>;
  files: { edited: number; byExtension: Record<string, number> };
  sessions: { count: number; subagentSessions: number; longestMinutes: number; compactions: number; apiErrors: number; hookErrors: number };
  projects: Record<string, { sessions: number; branches: string[]; titles: string[] }>;
}

/** A pause longer than this ends a stretch of work; a resumed session starts a new stretch. */
const IDLE_GAP_MS = 30 * 60_000;

/** Longest stretch of work in minutes, given sorted timestamps. */
export function longestActiveMinutes(sorted: number[]): number {
  let best = 0;
  let start = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    if (i === sorted.length || sorted[i] - sorted[i - 1] > IDLE_GAP_MS) {
      best = Math.max(best, sorted[i - 1] - start);
      start = sorted[i];
    }
  }
  return Math.round(best / 60_000);
}

/**
 * Display name for a tool. MCP tools become `mcp:<server>`: the tool part can reveal what the user did
 * (for example a mail action) and connector servers are named by an ID, which becomes `connector`.
 */
export function toolLabel(name: string): string {
  if (!name.startsWith('mcp__')) return name;
  const server = name.split('__')[1] ?? '';
  return !server || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(server) ? 'mcp:connector' : `mcp:${server}`;
}

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const bump = (o: Record<string, number>, k: string, by = 1): void => { o[k] = (o[k] ?? 0) + by; };

export async function readTranscripts(files: string[], opts: { year: number; tz: string }): Promise<TranscriptStats> {
  const t: TranscriptStats = {
    from: null, to: null, daily: [], dailyTokens: [],
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, thinking: 0, byModel: {} },
    tools: { calls: 0, byName: {}, bash: 0, testRuns: 0, commits: 0, mcpCalls: 0, webSearches: 0 },
    denials: { userRejected: 0, automatic: 0, byTool: {} },
    permissionModes: {}, effort: {}, entrypoints: {},
    files: { edited: 0, byExtension: {} },
    sessions: { count: 0, subagentSessions: 0, longestMinutes: 0, compactions: 0, apiErrors: 0, hookErrors: 0 },
    projects: {},
  };
  const year = String(opts.year);
  const days = new Map<string, { messages: number; toolCalls: number }>();
  /** Timestamps of each main session's lines, for first day and active time. */
  const sessionTimes = new Map<string, number[]>();
  const sessionCwd = new Map<string, string>();
  const sessionEntry = new Map<string, string>();
  const sessionTitles = new Map<string, Set<string>>();
  const branches = new Map<string, Set<string>>();
  const edited = new Set<string>();
  const tokensByDate = new Map<string, Record<string, number>>();

  const day = (date: string) => {
    let d = days.get(date);
    if (!d) days.set(date, (d = { messages: 0, toolCalls: 0 }));
    return d;
  };

  for (const file of files) {
    const isSubagentFile = file.split(/[\\/]/).includes('subagents');
    if (isSubagentFile) t.sessions.subagentSessions++;
    const toolNames = new Map<string, string>();
    // Request blobs carry the effort setting but no timestamp; they count if the file has lines in the year.
    const fileEffort: Record<string, number> = {};
    let fileInYear = false;

    for await (const row of readJsonl(file)) {
      const r = row as any;
      if (!r || typeof r !== 'object') continue;
      const sid: string | undefined = typeof r.sessionId === 'string' ? r.sessionId : undefined;

      // Title lines carry no timestamp; attribute them to the session's project at the end.
      if (r.type === 'custom-title' && typeof r.customTitle === 'string' && sid) {
        if (!sessionTitles.has(sid)) sessionTitles.set(sid, new Set());
        sessionTitles.get(sid)!.add(r.customTitle);
        continue;
      }
      if (r.type === 'api-request-blob') {
        const effort = r.message?.output_config?.effort;
        if (typeof effort === 'string') bump(fileEffort, effort);
        continue;
      }
      if (typeof r.timestamp !== 'string') continue;
      const ts = Date.parse(r.timestamp);
      if (Number.isNaN(ts)) continue;
      const date = localDate(ts, opts.tz);
      if (!date.startsWith(year)) continue;

      const main = !isSubagentFile && r.isSidechain !== true;
      fileInYear = true;
      if (!t.from || date < t.from) t.from = date;
      if (!t.to || date > t.to) t.to = date;

      if (main && sid) {
        if (!sessionTimes.has(sid)) sessionTimes.set(sid, []);
        sessionTimes.get(sid)!.push(ts);
        if (typeof r.cwd === 'string' && !sessionCwd.has(sid)) sessionCwd.set(sid, r.cwd);
        if (typeof r.entrypoint === 'string' && !sessionEntry.has(sid)) sessionEntry.set(sid, r.entrypoint);
        if (typeof r.cwd === 'string' && typeof r.gitBranch === 'string' && r.gitBranch) {
          if (!branches.has(r.cwd)) branches.set(r.cwd, new Set());
          branches.get(r.cwd)!.add(r.gitBranch);
        }
      }

      if (r.type === 'system') {
        if (r.subtype === 'compact_boundary') t.sessions.compactions++;
        if (r.subtype === 'api_error') t.sessions.apiErrors++;
      }
      if (Array.isArray(r.hookErrors)) t.sessions.hookErrors += r.hookErrors.length;

      if (r.type === 'user') {
        if (typeof r.permissionMode === 'string') bump(t.permissionModes, r.permissionMode);
        if (typeof r.toolDenialKind === 'string') {
          if (r.toolDenialKind === 'user-rejected') t.denials.userRejected++;
          else t.denials.automatic++;
          const result = Array.isArray(r.message?.content) ? r.message.content.find((b: any) => b?.type === 'tool_result') : undefined;
          bump(t.denials.byTool, toolNames.get(result?.tool_use_id) ?? 'unknown');
        }
      }

      if (main && sid && (r.type === 'user' || r.type === 'assistant')) {
        day(date).messages++;
      }

      if (r.type === 'assistant' && r.message && typeof r.message === 'object') {
        const u = r.message.usage ?? {};
        const input = num(u.input_tokens), output = num(u.output_tokens);
        const cacheRead = num(u.cache_read_input_tokens), cacheCreation = num(u.cache_creation_input_tokens);
        t.tokens.input += input;
        t.tokens.output += output;
        t.tokens.cacheRead += cacheRead;
        t.tokens.cacheCreation += cacheCreation;
        t.tokens.thinking += num(u.output_tokens_details?.thinking_tokens);
        t.tools.webSearches += num(u.server_tool_use?.web_search_requests);
        if (typeof r.message.model === 'string') {
          const total = input + output + cacheRead + cacheCreation;
          bump(t.tokens.byModel, r.message.model, total);
          if (!tokensByDate.has(date)) tokensByDate.set(date, {});
          bump(tokensByDate.get(date)!, r.message.model, total);
        }

        for (const b of Array.isArray(r.message.content) ? r.message.content : []) {
          if (b?.type !== 'tool_use' || typeof b.name !== 'string') continue;
          if (typeof b.id === 'string') toolNames.set(b.id, toolLabel(b.name));
          t.tools.calls++;
          day(date).toolCalls++;
          bump(t.tools.byName, toolLabel(b.name));
          if (b.name.startsWith('mcp__')) t.tools.mcpCalls++;
          if (b.name === 'WebSearch') t.tools.webSearches++;
          if (b.name === 'Bash' && typeof b.input?.command === 'string') {
            t.tools.bash++;
            if (TEST_RUNNER_RE.test(b.input.command)) t.tools.testRuns++;
            if (GIT_COMMIT_RE.test(b.input.command)) t.tools.commits++;
          }
          if (EDIT_TOOLS.has(b.name)) {
            const fp = b.input?.file_path ?? b.input?.notebook_path;
            if (typeof fp === 'string' && !edited.has(fp)) {
              edited.add(fp);
              const ext = path.extname(fp.replaceAll('\\', '/')).toLowerCase();
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
  const sessionsByFirstDay: Record<string, number> = {};
  for (const times of sessionTimes.values()) {
    times.sort((a, b) => a - b);
    bump(sessionsByFirstDay, localDate(times[0], opts.tz));
    t.sessions.longestMinutes = Math.max(t.sessions.longestMinutes, longestActiveMinutes(times));
  }
  for (const e of sessionEntry.values()) bump(t.entrypoints, e);
  for (const [sid, cwd] of sessionCwd) {
    const p = (t.projects[cwd] ??= { sessions: 0, branches: [...(branches.get(cwd) ?? [])], titles: [] });
    p.sessions++;
    for (const title of sessionTitles.get(sid) ?? []) if (!p.titles.includes(title)) p.titles.push(title);
  }
  t.daily = [...days].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, messages: d.messages, sessions: sessionsByFirstDay[date] ?? 0, toolCalls: d.toolCalls }));
  t.dailyTokens = [...tokensByDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, tokensByModel]) => ({ date, tokensByModel }));
  return t;
}
