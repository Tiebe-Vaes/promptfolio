import { buildStats } from '../../src/buildStats.js';
import type { Copy, Stats } from '../../src/types.js';
import { fixture, fixturePath } from '../helpers.js';

const lines = {
  tokens: '{tokens.yearTotal} tokens went through Claude this year.',
  year: 'Shipped {tools.commits} commits.',
  toolkit: 'Works across {files.byLanguage.length} languages.',
  growth: '{activity.growth.factor} times busier by {activity.growth.peak.month}.',
};
const captions = { instagram: 'My year.', linkedin: 'My year with Claude Code.', x: 'My year.', discord: 'My year.' };

export const funCopy: Copy = { schemaVersion: 2, vibe: 'fun', language: 'en', title: 'Shell Warlock', lines, captions };
export const proCopy: Copy = { schemaVersion: 2, vibe: 'professional', language: 'en', title: 'Python builder', lines, captions };

export async function fixtureStats(): Promise<Stats> {
  return buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27T12:00:00Z') });
}

export async function emptyStats(): Promise<Stats> {
  return buildStats({ claudeDir: fixturePath('empty-home'), year: 2026, tz: 'UTC', now: new Date('2026-11-27') });
}
