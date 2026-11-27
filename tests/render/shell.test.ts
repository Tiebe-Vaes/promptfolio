import { beforeAll, expect, test } from 'vitest';
import { buildStats } from '../../src/buildStats.js';
import { escapeHtml, fill } from '../../src/render/escape.js';
import { page, progressBar, SIZES } from '../../src/render/shell.js';
import type { Stats } from '../../src/types.js';
import { fixture } from '../helpers.js';

let stats: Stats;
beforeAll(async () => {
  stats = await buildStats({ claudeDir: fixture(), year: 2026, tz: 'Europe/Brussels', now: new Date('2026-11-27') });
});

test('escapeHtml neutralises tags', () => {
  const out = escapeHtml('<script>alert(1)</script> & "x" \'y\'');
  expect(out).not.toContain('<script');
  expect(out).toBe('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot; &#39;y&#39;');
});

test('fill escapes after filling', () =>
  expect(fill('<b>{tools.bash}</b>', stats, 'en')).toBe('&lt;b&gt;2&lt;/b&gt;'));

test('sizes match the spec', () => {
  expect(SIZES.story).toEqual({ name: 'story', w: 1080, h: 1920 });
  expect(SIZES.square).toEqual({ name: 'square', w: 1080, h: 1080 });
  expect(SIZES.wide).toEqual({ name: 'wide', w: 1200, h: 675 });
  expect(SIZES.readme).toEqual({ name: 'readme', w: 1200, h: 400 });
});

test('page has no external URLs and respects reduced motion', () => {
  const html = page({ title: 'T', css: '.a{}', body: '<p>x</p>', fontsCss: '', lang: 'nl' });
  expect(html).toMatch(/^<!doctype html>/);
  expect(html).toContain('<html lang="nl">');
  expect(html).toContain('prefers-reduced-motion');
  expect(html).not.toMatch(/https?:\/\//);
});

test('progressBar marks done segments', () => {
  const bar = progressBar(1, 4);
  expect(bar.match(/<i class="on"><\/i>/g)).toHaveLength(2);
  expect(bar.match(/<i><\/i>/g)).toHaveLength(2);
});
