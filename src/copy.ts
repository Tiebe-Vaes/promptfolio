import { scanSecrets } from './redact.js';
import type { Stats } from './types.js';

/** Max characters after filling placeholders. Provisional until the mockup round (Plan 2). */
export const COPY_LIMITS = {
  headline: 60,
  strength: 90,
  className: 28,
  specialMove: 40,
  weakness: 40,
  nemesis: 32,
  diary: 160,
  awardTitle: 32,
  awardText: 120,
  relationshipStatus: 24,
  relationshipText: 140,
  caption: 120,
} as const;

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

function format(path: string, value: number | string, language: 'en' | 'nl'): string {
  if (typeof value === 'string') return value;
  if (path.endsWith('Share') && value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return new Intl.NumberFormat(language === 'nl' ? 'nl-BE' : 'en-US', { maximumFractionDigits: 1 }).format(value);
}

export function fillPlaceholders(text: string, stats: Stats, language: 'en' | 'nl'): string {
  return text.replace(PLACEHOLDER_RE, (whole, path: string) => {
    const v = resolve(stats, path);
    return v === undefined ? whole : format(path, v, language);
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function validateCopy(copy: unknown, stats: Stats): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isObj(copy)) return { ok: false, errors: ['copy: must be a JSON object'] };
  const language = copy.language === 'nl' ? 'nl' : 'en';

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
    const filled = fillPlaceholders(value, stats, language);
    if (filled.length > COPY_LIMITS[limit]) errors.push(`${path}: too long (${filled.length} > ${COPY_LIMITS[limit]} characters after filling)`);
  };
  const list = (path: string, value: unknown, min: number, max: number): unknown[] => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      errors.push(`${path}: needs ${min === max ? min : `${min}-${max}`} entries`);
      return [];
    }
    return value;
  };

  if (copy.schemaVersion !== 1) errors.push('schemaVersion: must be 1');
  if (copy.language !== 'en' && copy.language !== 'nl') errors.push('language: must be "en" or "nl"');
  if (!['professional', 'fun', 'roast'].includes(copy.vibe as string)) errors.push('vibe: must be "professional", "fun" or "roast"');

  if (copy.vibe === 'professional') {
    const profile = copy.profile;
    if (!isObj(profile)) errors.push('profile: required for the professional vibe');
    else {
      text('profile.headline', profile.headline, 'headline');
      const candidates = new Set(stats.strengthCandidates.map(c => c.id));
      const seen = new Set<string>();
      list('profile.strengths', profile.strengths, 3, 3).forEach((s, i) => {
        const id = isObj(s) ? s.id : undefined;
        if (typeof id !== 'string' || !candidates.has(id as any)) errors.push(`profile.strengths.${i}.id: must be one of the strength candidates in stats`);
        else if (seen.has(id)) errors.push(`profile.strengths.${i}.id: duplicate strength`);
        else seen.add(id);
        text(`profile.strengths.${i}.text`, isObj(s) ? s.text : undefined, 'strength');
      });
    }
  }

  if (copy.vibe === 'fun' || copy.vibe === 'roast') {
    const p = copy.persona;
    if (!isObj(p)) errors.push('persona: required for the fun and roast vibes');
    else {
      text('persona.className', p.className, 'className');
      text('persona.specialMove', p.specialMove, 'specialMove');
      text('persona.weakness', p.weakness, 'weakness');
      text('persona.nemesis', p.nemesis, 'nemesis');
    }
    list('diary', copy.diary, 3, 5).forEach((d, i) => text(`diary.${i}`, d, 'diary'));
    list('awards', copy.awards, 3, 4).forEach((a, i) => {
      text(`awards.${i}.title`, isObj(a) ? a.title : undefined, 'awardTitle');
      text(`awards.${i}.text`, isObj(a) ? a.text : undefined, 'awardText');
    });
    const r = copy.relationship;
    if (!isObj(r)) errors.push('relationship: required for the fun and roast vibes');
    else {
      text('relationship.status', r.status, 'relationshipStatus');
      text('relationship.text', r.text, 'relationshipText');
    }
  }

  if (!isObj(copy.captions)) errors.push('captions: must be an object of strings');
  else for (const [k, v] of Object.entries(copy.captions)) text(`captions.${k}`, v, 'caption');

  return { ok: errors.length === 0, errors };
}
