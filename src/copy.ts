import { scanSecrets } from './redact.js';
import type { Stats } from './types.js';

/** Max characters after filling placeholders. Captions leave room for the repo link code adds. */
export const COPY_LIMITS = { title: 22, line: 90, caption: 200 } as const;

const RETIRED = ['profile', 'persona', 'diary', 'awards', 'relationship', 'tokensLine', 'verdict', 'receiptFooter', 'growthLine'];
const PLATFORMS = ['instagram', 'linkedin', 'x', 'discord'] as const;

type LimitKey = keyof typeof COPY_LIMITS;

const PLACEHOLDER_RE = /\{([A-Za-z0-9_.]+)\}/g;

/** Resolves a dotted path into stats; arrays allow an index or `length`. Returns undefined unless number or string. */
function resolve(stats: Stats, path: string): number | string | undefined {
  let v: any = stats;
  for (const key of path.split('.')) {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v) && key === 'length') v = v.length;
    else if (typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, key)) v = v[key];
    else return undefined;
  }
  return typeof v === 'number' || typeof v === 'string' ? v : undefined;
}

function format(path: string, value: number | string): string {
  if (typeof value === 'string') {
    if (path.endsWith('.month') && /^\d{4}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 15)));
    }
    return value;
  }
  if (path.endsWith('Share') && value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

/** Output is English only (decided by Tiebe, 2026-11-27); `_language` stays for call-site compatibility. */
export function fillPlaceholders(text: string, stats: Stats, _language: 'en' = 'en'): string {
  return text.replace(PLACEHOLDER_RE, (whole, path: string) => {
    const v = resolve(stats, path);
    return v === undefined ? whole : format(path, v);
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function validateCopy(copy: unknown, stats: Stats): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isObj(copy)) return { ok: false, errors: ['copy: must be a JSON object'] };

  const text = (path: string, value: unknown, limit: LimitKey): void => {
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${path}: must be a non-empty string`);
      return;
    }
    for (const [, p] of value.matchAll(PLACEHOLDER_RE)) {
      if (resolve(stats, p) === undefined) errors.push(`${path}: placeholder {${p}} does not resolve to a number or string in stats`);
    }
    if (/\d/.test(value.replace(PLACEHOLDER_RE, ''))) errors.push(`${path}: contains a digit outside a placeholder; use a {placeholder}`);
    if (scanSecrets(value)) errors.push(`${path}: looks like it contains a secret or personal data`);
    const filled = fillPlaceholders(value, stats);
    if (filled.length > COPY_LIMITS[limit]) errors.push(`${path}: too long (${filled.length} > ${COPY_LIMITS[limit]} characters after filling)`);
  };
  if (copy.schemaVersion !== 2) errors.push('schemaVersion: must be 2');
  if (copy.language !== 'en') errors.push('language: must be "en"');
  if (!['professional', 'fun', 'roast'].includes(copy.vibe as string)) errors.push('vibe: must be "professional", "fun" or "roast"');
  for (const k of RETIRED) if (k in copy) errors.push(`${k}: not used since copy v2`);

  text('title', copy.title, 'title');
  const lines = isObj(copy.lines) ? copy.lines : {};
  if (!isObj(copy.lines)) errors.push('lines: must be an object with tokens, year, toolkit and growth');
  for (const k of ['tokens', 'year', 'toolkit']) text(`lines.${k}`, lines[k], 'line');
  // Same condition as the growth card: it renders from two active months.
  if (stats.activity.byMonth.length >= 2 || lines.growth !== undefined) text('lines.growth', lines.growth, 'line');

  const captions = isObj(copy.captions) ? copy.captions : {};
  if (!isObj(copy.captions)) errors.push('captions: must be an object with instagram, linkedin, x and discord');
  for (const k of PLATFORMS) text(`captions.${k}`, captions[k], 'caption');

  return { ok: errors.length === 0, errors };
}
