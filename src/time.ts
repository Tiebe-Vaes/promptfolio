const formatters = new Map<string, Intl.DateTimeFormat>();

function parts(ts: string | number, tz: string): Record<string, string> {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    });
    formatters.set(tz, f);
  }
  const out: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(ts))) out[p.type] = p.value;
  return out;
}

/** YYYY-MM-DD in the given time zone. */
export function localDate(ts: string | number, tz: string): string {
  const p = parts(ts, tz);
  return `${p.year}-${p.month}-${p.day}`;
}

/** 0-23 in the given time zone. */
export function localHour(ts: string | number, tz: string): number {
  return Number(parts(ts, tz).hour);
}

/** YYYY-MM in the given time zone. */
export function localMonth(ts: string | number, tz: string): string {
  return localDate(ts, tz).slice(0, 7);
}
