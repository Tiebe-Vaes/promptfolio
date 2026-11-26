import type { EquivalentResult } from './types.js';

export interface Equivalent {
  id: string;
  label: string;
  /** Amount of `unit` per prompt. */
  perPrompt: number;
  unit: string;
  provider: string;
  sourceUrl: string;
}

// First-party figures only (published by the AI company itself). Anthropic publishes none as of 2026-11-27,
// so these use Google's median Gemini Apps text prompt (May 2025 data, not independently verified).
const GOOGLE_SOURCE = 'https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference';
const GLASS_ML = 250;

export const EQUIVALENTS: Equivalent[] = [
  {
    id: 'energy',
    label: "Energy, estimate based on Google's published per-prompt Gemini figure",
    perPrompt: 0.24,
    unit: 'Wh',
    provider: 'Google',
    sourceUrl: GOOGLE_SOURCE,
  },
  {
    id: 'water',
    label: "Water, estimate based on Google's published per-prompt Gemini figure",
    perPrompt: 0.26 / GLASS_ML,
    unit: 'glasses of water (250 mL)',
    provider: 'Google',
    sourceUrl: GOOGLE_SOURCE,
  },
];

export function computeEquivalents(prompts: number): EquivalentResult[] {
  return EQUIVALENTS.map(e => ({ id: e.id, value: prompts * e.perPrompt, unit: e.unit, label: e.label, sourceUrl: e.sourceUrl }));
}
