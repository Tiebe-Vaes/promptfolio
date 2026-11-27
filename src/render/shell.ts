export type SizeName = 'story' | 'square' | 'wide' | 'readme';
export type Size = { name: SizeName; w: number; h: number };

export const SIZES: Record<SizeName, Size> = {
  story: { name: 'story', w: 1080, h: 1920 },
  square: { name: 'square', w: 1080, h: 1080 },
  wide: { name: 'wide', w: 1200, h: 675 },
  readme: { name: 'readme', w: 1200, h: 400 },
};

/** A complete, self-contained HTML document. */
export function page(opts: { title: string; css: string; body: string; fontsCss: string; lang: 'en' }): string {
  return `<!doctype html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${opts.title}</title>
<style>
${opts.fontsCss}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-variant-numeric: tabular-nums; }
${opts.css}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
${opts.body}
</body>
</html>
`;
}

/** Instagram-style story progress: segments up to and including `index` are filled. */
export function progressBar(index: number, total: number): string {
  const segs = Array.from({ length: total }, (_, i) => (i <= index ? '<i class="on"></i>' : '<i></i>')).join('');
  return `<div class="progress" aria-hidden="true">${segs}</div>`;
}

/** Shared CSS for progress bars on light and dark slides. */
export const PROGRESS_CSS = `
.progress { position: absolute; top: 48px; left: 64px; right: 64px; display: flex; gap: 10px; z-index: 2; }
.progress i { flex: 1; height: 8px; border-radius: 4px; background: rgba(16,21,28,.18); }
.progress i.on { background: #10151C; }
.dark .progress i { background: rgba(255,255,255,.25); }
.dark .progress i.on { background: #FFFFFF; }
`;
