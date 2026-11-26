const DAY = 86_400_000;

function toDays(dates: string[]): number[] {
  return [...new Set(dates)].map(d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY).sort((a, b) => a - b);
}

/** Longest run of consecutive calendar days in `dates` (YYYY-MM-DD). */
export function longestStreak(dates: string[]): number {
  const days = toDays(dates);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] - days[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Most inactive days between two active days. */
export function longestGap(dates: string[]): number {
  const days = toDays(dates);
  let best = 0;
  for (let i = 1; i < days.length; i++) best = Math.max(best, days[i] - days[i - 1] - 1);
  return best;
}
