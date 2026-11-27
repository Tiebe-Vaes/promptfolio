import { fillPlaceholders } from '../copy.js';
import type { Stats } from '../types.js';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Text for HTML content and attribute values. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ENTITIES[c]);
}

/** Fills {placeholders} from stats, then escapes. The only way copy enters a template. */
export function fill(text: string, stats: Stats, lang: 'en' | 'nl'): string {
  return escapeHtml(fillPlaceholders(text, stats, lang));
}

/** Locale-formatted number for templates. */
export function num(n: number, lang: 'en' | 'nl', digits = 0): string {
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-BE' : 'en-US', { maximumFractionDigits: digits }).format(n);
}

/** Short form: 17.7B, 48M, 12.3K. */
export function compact(n: number, lang: 'en' | 'nl'): string {
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, u] of units) if (n >= v) return `${num(n / v, lang, n / v < 100 ? 1 : 0)}${u}`;
  return num(n, lang);
}
