import { beforeAll, expect, test } from 'vitest';
import { findTranscripts } from '../src/jsonl.js';
import { readTranscripts, type TranscriptStats } from '../src/sources/transcripts.js';
import { fixture } from './helpers.js';

let t: TranscriptStats;
beforeAll(async () => {
  t = await readTranscripts(await findTranscripts(fixture('projects')), { year: 2026, tz: 'Europe/Brussels' });
});

test('sessions and subagents', () => {
  expect(t.sessions.count).toBe(2);
  expect(t.sessions.subagentSessions).toBe(1);
});

test('session length from main file', () => expect(t.sessions.longestMinutes).toBe(30));

test('tool calls, tests, commits, mcp, web searches', () => {
  expect(t.tools.calls).toBe(7);
  expect(t.tools.bash).toBe(2);
  expect(t.tools.testRuns).toBe(1);
  expect(t.tools.commits).toBe(1);
  expect(t.tools.mcpCalls).toBe(1);
  expect(t.tools.webSearches).toBe(3);
});

test('denials split and attributed', () => {
  expect(t.denials).toEqual({ userRejected: 1, automatic: 1, byTool: { Bash: 1, mcp__x__y: 1 } });
});

test('modes, effort, entrypoints', () => {
  expect(t.permissionModes).toEqual({ plan: 1, auto: 2 });
  expect(t.effort).toEqual({ high: 1, medium: 1 });
  expect(t.entrypoints).toEqual({ 'claude-desktop': 1, cli: 1 });
});

test('edited files by extension', () => {
  expect(t.files).toEqual({ edited: 2, byExtension: { '.ts': 1, '.py': 1 } });
});

test('system events', () => {
  expect(t.sessions.compactions).toBe(1);
  expect(t.sessions.apiErrors).toBe(1);
  expect(t.sessions.hookErrors).toBe(1);
});

test('tokens', () => {
  expect(t.tokens).toMatchObject({ input: 23, output: 200, cacheRead: 1000, cacheCreation: 50, thinking: 40 });
  expect(t.tokens.byModel).toEqual({ 'claude-opus-5-5': 1215, 'claude-sonnet-5': 58 });
});

test('tokens per local date and model', () => {
  expect(t.dailyTokens).toEqual([
    { date: '2026-11-20', tokensByModel: { 'claude-opus-5-5': 1215, 'claude-sonnet-5': 25 } },
    { date: '2026-11-21', tokensByModel: { 'claude-sonnet-5': 33 } },
  ]);
});

test('projects with branches and titles', () => {
  expect(t.projects['C:\\dev\\alpha']).toEqual({ sessions: 1, branches: ['feat/login'], titles: ['fix login sk-ant-api03-FAKEFAKEFAKEFAKEFAKE'] });
  expect(t.projects['C:\\dev\\beta'].branches).toEqual(['main']);
});

test('coverage and daily activity in local dates, 2025 skipped', () => {
  expect(t.from).toBe('2026-11-20');
  expect(t.to).toBe('2026-11-21');
  expect(t.daily).toEqual([
    { date: '2026-11-20', messages: 5, sessions: 1, toolCalls: 6 },
    { date: '2026-11-21', messages: 2, sessions: 1, toolCalls: 1 },
  ]);
});
