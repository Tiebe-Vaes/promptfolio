import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { contrastRatio, fontFaceCss, LANGUAGE_COLORS, languageColor } from '../../src/render/theme.js';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'promptfolio', 'skills', 'promptfolio', 'assets');

test('TypeScript is #3178C6', () => expect(languageColor('TypeScript').accent).toBe('#3178C6'));

test('unknown language falls back', () => {
  expect(languageColor('Brainfuck').accent).toBe('#3C6FA8');
  expect(languageColor(null).accent).toBe('#3C6FA8');
});

test('onAccent meets 4.5:1 for every colour', () => {
  for (const lang of [...Object.keys(LANGUAGE_COLORS), null]) {
    const t = languageColor(lang);
    expect(contrastRatio(t.accent, t.onAccent), String(lang)).toBeGreaterThanOrEqual(4.5);
  }
});

test('deep is darker than the accent', () => {
  const t = languageColor('Python');
  expect(contrastRatio(t.deep, '#FFFFFF')).toBeGreaterThan(contrastRatio(t.accent, '#FFFFFF'));
});

test('contrastRatio basics', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
});

test('fontFaceCss embeds data URLs only', () => {
  const css = fontFaceCss(assets);
  expect(css).toContain('font-family: Archivo');
  expect(css).toContain('font-family: "IBM Plex Mono"');
  expect(css).toContain('data:font/woff2;base64,');
  expect(css).not.toMatch(/https?:/);
});
