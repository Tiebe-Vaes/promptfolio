export const POLITE_WORDS = [
  'please', 'pls', 'thanks', 'thank you', 'thx', 'sorry',
  'alsjeblieft', 'aub', 'bedankt', 'dankje', 'dank je', 'merci',
];

export const CORRECTION_PHRASES = [
  'no wait', 'wait', 'actually', "that's wrong", 'undo', 'revert', 'not what i',
  'nee', 'wacht', 'klopt niet', 'fout', 'terugdraaien',
];

const NL = new Set('de het een ik je niet wat maar ook nog dat voor is dit zijn kan moet'.split(' '));
const EN = new Set('the and is you not what but this that for are can should with'.split(' '));

export function classifyLanguage(text: string): 'en' | 'nl' | 'other' {
  let nl = 0;
  let en = 0;
  for (const w of text.toLowerCase().split(/[^\p{L}']+/u)) {
    if (NL.has(w)) nl++;
    if (EN.has(w)) en++;
  }
  if (Math.max(nl, en) < 2 || nl === en) return 'other';
  return nl > en ? 'nl' : 'en';
}

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patternCache = new Map<string[], RegExp>();

/** Whole-word, case-insensitive hit count of all `words` in `text`. */
export function countMatches(text: string, words: string[]): number {
  let re = patternCache.get(words);
  if (!re) {
    re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
    patternCache.set(words, re);
  }
  return text.match(re)?.length ?? 0;
}

export const TEST_RUNNER_RE =
  /\b(?:vitest|jest|pytest|phpunit|rspec)\b|\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test\b|(?:\bmvn|\.\/mvnw)\s+(?:-\S+\s+)*test\b|(?:\bgradle|\.\/gradlew)\s+(?:-\S+\s+)*test\b|\b(?:go|cargo|dotnet)\s+test\b/;

export const GIT_COMMIT_RE = /\bgit\s+commit\b/;
