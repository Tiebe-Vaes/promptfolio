import { expect } from 'vitest';

const FAMILIES = ['Archivo', '"IBM Plex Mono"', '"Big Shoulders Display"', '"Libre Franklin"', 'sans-serif', 'monospace'];

/** The design rules from the spec ("Visual decisions"), checked on rendered HTML. */
export function assertDesignRules(html: string, opts: { mono: boolean }): void {
  expect(html, 'middle dot').not.toContain('·');
  expect(html, 'em dash').not.toContain('—');
  expect(html, 'gradient text').not.toMatch(/background-clip:\s*text/);
  expect(html, 'glow').not.toMatch(/text-shadow/);
  if (!opts.mono) {
    expect(html, 'uppercase labels').not.toMatch(/text-transform:\s*uppercase/);
    expect(html, 'monospace outside receipt/terminal').not.toContain('IBM Plex Mono');
  }
  for (const m of html.matchAll(/font-family:\s*([^;}]+)/g)) {
    for (const fam of m[1].split(',').map(s => s.trim())) expect(FAMILIES, `font ${fam}`).toContain(fam);
  }
  expect(html, 'unresolved placeholder').not.toMatch(/\{[a-z][A-Za-z0-9_.]*\}/);
  expect(html, 'broken value').not.toMatch(/NaN|undefined|null(?![-\w])/);
}
