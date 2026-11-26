import path from 'node:path';
import { expect, test } from 'vitest';
import { resolveClaudeDir } from '../src/paths.js';

test('uses CLAUDE_CONFIG_DIR when set', () =>
  expect(resolveClaudeDir({ CLAUDE_CONFIG_DIR: '/x/cfg' }, '/home/u')).toBe('/x/cfg'));

test('falls back to ~/.claude', () =>
  expect(resolveClaudeDir({}, '/home/u')).toBe(path.join('/home/u', '.claude')));
