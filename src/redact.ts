import type { ProjectEntry, Stats } from './types.js';

const SECRET_PATTERNS: RegExp[] = [
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
  /\b[0-9a-fA-F]{32,}\b/,
];

/** A long run of key-like characters that mixes upper case, lower case and digits. */
function looksRandom(text: string): boolean {
  for (const run of text.match(/[A-Za-z0-9+/=_-]{40,}/g) ?? []) {
    if (/[A-Z]/.test(run) && /[a-z]/.test(run) && /[0-9]/.test(run)) return true;
  }
  return false;
}

export function scanSecrets(text: string): boolean {
  return SECRET_PATTERNS.some(re => re.test(text)) || looksRandom(text);
}

export type RedactionMode = 'hide' | 'pick' | 'show';

/**
 * Returns a copy of `stats` that is safe to show Claude and to render.
 * Paths never leave: every project key becomes its label. Secrets are dropped in every mode.
 */
export function redactStats(stats: Stats, opts: { mode: RedactionMode; allow: string[] }): Stats {
  const allow = new Set(opts.allow);
  const visible = (p: ProjectEntry) =>
    !scanSecrets(p.label) && (opts.mode === 'show' || (opts.mode === 'pick' && allow.has(p.label)));
  const shown = stats.projects.list.filter(visible);
  const hidden = stats.projects.list.filter(p => !visible(p));

  const list: ProjectEntry[] = [
    ...shown.map(p => ({
      key: p.label,
      label: p.label,
      sessions: p.sessions,
      titles: p.titles.filter(t => !scanSecrets(t)),
      branches: p.branches.filter(b => !scanSecrets(b)),
    })),
    ...hidden.map((p, i) => {
      const label = `Project ${letters(i)}`;
      return { key: label, label, sessions: p.sessions, titles: [], branches: [] };
    }),
  ].sort((a, b) => b.sessions - a.sessions || a.label.localeCompare(b.label));

  return {
    ...structuredClone(stats),
    projects: { count: list.length, branchCount: list.reduce((a, p) => a + p.branches.length, 0), list },
  };
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
function letters(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export interface Sample {
  vibeHints: { topTools: string[]; languages: string[]; titles: string[]; projectLabels: string[] };
  /** Every dotted path in stats whose value is a number or string, for Claude to use as {placeholder}. */
  placeholders: string[];
}

export function buildSample(stats: Stats): Sample {
  const clean = (xs: string[]) => xs.filter(x => !scanSecrets(x));
  return {
    vibeHints: {
      topTools: clean(stats.tools.top.map(t => t.name)),
      languages: stats.files.byLanguage.map(l => l.language),
      titles: clean(stats.projects.list.flatMap(p => p.titles)).slice(0, 20),
      projectLabels: stats.projects.list.map(p => p.label),
    },
    placeholders: placeholderPaths(stats),
  };
}

function placeholderPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'number' || typeof value === 'string') return prefix ? [prefix] : [];
  if (Array.isArray(value)) {
    return [`${prefix}.length`, ...value.flatMap((v, i) => placeholderPaths(v, `${prefix}.${i}`))];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => placeholderPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}
