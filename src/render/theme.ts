import fs from 'node:fs';
import path from 'node:path';

/** GitHub linguist colours for the languages buildStats recognises. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#C9B400',
  Python: '#3572A5',
  Java: '#B07219',
  Kotlin: '#A97BFF',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  CSS: '#563D7C',
  HTML: '#E34C26',
  SQL: '#E38C00',
  Markdown: '#083FA1',
  Config: '#6B7280',
};

const FALLBACK = '#3C6FA8';
export const INK = '#10151C';
const WHITE = '#FFFFFF';

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(a: string, b: string, weightB: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return '#' + x.map((v, i) => Math.round(v * (1 - weightB) + y[i] * weightB).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Accent from the user's top language; text on the accent is white or ink, whichever reads better. */
export function languageColor(lang: string | null): { accent: string; deep: string; onAccent: '#FFFFFF' | '#10151C' } {
  const accent = (lang && LANGUAGE_COLORS[lang]) || FALLBACK;
  const onAccent = contrastRatio(accent, WHITE) >= contrastRatio(accent, INK) ? WHITE : INK;
  return { accent, deep: mix(accent, INK, 0.45), onAccent };
}

const FONT_FILES: { family: string; file: string; weight: string; stretch?: string }[] = [
  { family: 'Archivo', file: 'archivo-latin-wdth-normal.woff2', weight: '100 900', stretch: '62% 125%' },
  { family: '"IBM Plex Mono"', file: 'ibm-plex-mono-latin-400-normal.woff2', weight: '400' },
  { family: '"IBM Plex Mono"', file: 'ibm-plex-mono-latin-600-normal.woff2', weight: '600' },
  { family: '"Big Shoulders Display"', file: 'big-shoulders-display-latin-900-normal.woff2', weight: '900' },
  { family: '"Libre Franklin"', file: 'libre-franklin-latin-400-normal.woff2', weight: '400' },
  { family: '"Libre Franklin"', file: 'libre-franklin-latin-600-normal.woff2', weight: '600' },
  { family: '"Libre Franklin"', file: 'libre-franklin-latin-900-normal.woff2', weight: '900' },
];

const fontCache = new Map<string, string>();

/** @font-face rules with the fonts inlined as base64, so pages work offline and in screenshots. */
export function fontFaceCss(assetsDir: string): string {
  const cached = fontCache.get(assetsDir);
  if (cached) return cached;
  const css = FONT_FILES.map(f => {
    const data = fs.readFileSync(path.join(assetsDir, 'fonts', f.file)).toString('base64');
    return `@font-face { font-family: ${f.family}; src: url(data:font/woff2;base64,${data}) format('woff2'); font-weight: ${f.weight};${f.stretch ? ` font-stretch: ${f.stretch};` : ''} font-display: block; }`;
  }).join('\n');
  fontCache.set(assetsDir, css);
  return css;
}
