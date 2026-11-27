import { fillPlaceholders } from '../copy.js';
import type { Copy, Stats } from '../types.js';
import { REPO_URL } from './brand.js';

export type Platform = 'instagram' | 'linkedin' | 'x' | 'discord';
const PLATFORMS: Platform[] = ['instagram', 'linkedin', 'x', 'discord'];

// X's post web intent: https://x.com/intent/tweet with a URL-encoded `text` parameter
// (source: https://docs.x.com/x-for-websites/post-button/guides/web-intent, checked 2026-11-27).
const X_INTENT = 'https://x.com/intent/tweet?text=';

/** Plain-text captions for the share step, filled from stats, each ending with the repo link. */
export function buildCaptions(copy: Copy, stats: Stats): Record<Platform, { text: string; intentUrl?: string }> {
  const out = {} as Record<Platform, { text: string; intentUrl?: string }>;
  for (const p of PLATFORMS) {
    const text = `${fillPlaceholders(copy.captions[p], stats, copy.language)}\n\n${REPO_URL}`;
    out[p] = p === 'x' ? { text, intentUrl: X_INTENT + encodeURIComponent(text) } : { text };
  }
  return out;
}
