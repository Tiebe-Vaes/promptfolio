import { expect, test } from 'vitest';
import { classifyLanguage, countMatches, CORRECTION_PHRASES, GIT_COMMIT_RE, POLITE_WORDS, TEST_RUNNER_RE } from '../src/text.js';

test('classifyLanguage', () => {
  expect(classifyLanguage('can you fix the bug in this file')).toBe('en');
  expect(classifyLanguage('kan je de bug in dit bestand niet fixen')).toBe('nl');
  expect(classifyLanguage('ok')).toBe('other');
});

test('test runner regex', () => {
  for (const c of ['npx vitest run a.test.ts', 'mvn -q test', './gradlew test', 'npm run test', 'pytest -x', 'go test ./...', 'cargo test'])
    expect(TEST_RUNNER_RE.test(c), c).toBe(true);
  for (const c of ['cat latest.txt', 'npm install', 'git status'])
    expect(TEST_RUNNER_RE.test(c), c).toBe(false);
});

test('git commit regex', () => {
  expect(GIT_COMMIT_RE.test('git add -A && git commit -m "x"')).toBe(true);
  expect(GIT_COMMIT_RE.test('git log')).toBe(false);
});

test('countMatches is whole-word and case-insensitive', () => {
  expect(countMatches('Please, thanks! THX', POLITE_WORDS)).toBe(3);
  expect(countMatches('pleased to meet', POLITE_WORDS)).toBe(0);
  expect(countMatches('nee wacht, dat klopt niet', CORRECTION_PHRASES)).toBe(3);
});
