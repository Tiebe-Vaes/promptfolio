import type { Stats, TokenSplit } from '../types.js';

/**
 * Anthropic's published API prices in USD per million tokens (first-party rates).
 * Input and output from Anthropic's model table (cached 2026-11-03, https://www.anthropic.com/pricing).
 * Cache write = 1.25x input (5-minute write) and cache read = 0.1x input are Anthropic's standard multipliers;
 * Opus 5.5, Sonnet 5.5 and Fable 5.2 publish their own cache-read price, used here.
 * A model without a published price is left out, never guessed.
 */
export const PRICES_AS_OF = '2026-11-03';

type Price = { input: number; output: number; cacheWrite: number; cacheRead: number };
const std = (input: number, output: number, cacheRead = input * 0.1): Price =>
  ({ input, output, cacheWrite: input * 1.25, cacheRead });

export const PRICES: Record<string, Price> = {
  'claude-fable-5-2': std(8, 40, 0.2),
  'claude-fable-5-1': std(10, 50),
  'claude-fable-5': std(10, 50),
  'claude-opus-5-5': std(4, 20, 0.2),
  'claude-opus-5': std(5, 25),
  'claude-opus-4-8': std(5, 25),
  'claude-opus-4-7': std(5, 25),
  'claude-opus-4-6': std(5, 25),
  'claude-sonnet-5-5': std(2, 10, 0.1),
  'claude-sonnet-5': std(2, 10),
  'claude-sonnet-4-6': std(3, 15),
  'claude-haiku-5-5': std(0.1, 0.5),
  'claude-haiku-4-5': std(1, 5),
};

/** Longest key that is a prefix of the model id, so dated ids like claude-haiku-4-5-20251001 match. */
export function priceFor(model: string): Price | undefined {
  const key = Object.keys(PRICES).filter(k => model === k || model.startsWith(`${k}-`)).sort((a, b) => b.length - a.length)[0];
  return key ? PRICES[key] : undefined;
}

export function apiValue(usage: Record<string, TokenSplit>): Stats['apiValue'] {
  const entries = Object.entries(usage).filter(([m, u]) => m !== '<synthetic>' && u.input + u.output + u.cacheRead + u.cacheCreation > 0);
  if (entries.length === 0) return null;
  let usd = 0;
  const models: string[] = [];
  const skippedModels: string[] = [];
  for (const [model, u] of entries) {
    const p = priceFor(model);
    if (!p) { skippedModels.push(model); continue; }
    models.push(model);
    usd += (u.input * p.input + u.output * p.output + u.cacheRead * p.cacheRead + u.cacheCreation * p.cacheWrite) / 1e6;
  }
  // Exact value; templates round it for display.
  return { usd, models: models.sort(), skippedModels: skippedModels.sort(), pricesAsOf: PRICES_AS_OF };
}
