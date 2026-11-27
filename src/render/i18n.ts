export type Lang = 'en' | 'nl';

/** Fixed labels on slides. Everything else comes from stats or Claude's copy. */
const STRINGS = {
  en: {
    tokensRead: 'tokens read', tokensWritten: 'tokens written', activeDays: (n: number, f: string, from: string, to: string) => `${f} active day${n === 1 ? '' : 's'}, ${from} to ${to}`,
    sessions: 'Sessions', messages: 'Messages', bash: 'Bash commands', testRuns: 'Test runs', commits: 'Commits',
    please: '"please"', noWait: '"no wait"', apiValue: 'API value', youPaid: 'You paid', aPlan: 'a plan',
    excludes: (n: number) => `excl. ${n} unpriced model${n === 1 ? '' : 's'}`, apiNote: 'Estimate at Anthropic API prices',
    receiptThanks: 'Thank you for building.', receiptYear: (y: number) => `Claude Code, year ${y}`,
    busiestDay: 'busiest day', streak: 'longest streak', days: (n: number, f: string) => `${f} day${n === 1 ? '' : 's'}`, topLanguage: 'top language',
    topTools: 'top tools', verdict: 'verdict', reading: (n: number, f: string) => `reading ${f} day${n === 1 ? '' : 's'} of logs...`, done: 'done',
    msgs: 'msgs', level: 'LV', weakness: 'Weakness', nemesis: 'Nemesis', rarity: { common: 'Common', rare: 'Rare', legendary: 'Legendary' },
    classLine: (lang: string, n: number, f: string, y: number) => `${lang} class. Summoned ${f} time${n === 1 ? '' : 's'} in ${y}.`,
    since: (d: string) => `since ${d}`,
    messagesPerMonth: 'messages per month', save: 'Save image', screenshot: 'Screenshot this slide to share it',
    next: 'Next', previous: 'Previous',
  },
  nl: {
    tokensRead: 'tokens gelezen', tokensWritten: 'tokens geschreven', activeDays: (n: number, f: string, from: string, to: string) => `${f} actieve dag${n === 1 ? '' : 'en'}, ${from} tot ${to}`,
    sessions: 'Sessies', messages: 'Berichten', bash: 'Bash-commando\'s', testRuns: 'Testruns', commits: 'Commits',
    please: '"alsjeblieft"', noWait: '"nee wacht"', apiValue: 'API-waarde', youPaid: 'Jij betaalde', aPlan: 'een abonnement',
    excludes: (n: number) => `zonder ${n} model${n === 1 ? '' : 'len'} zonder prijs`, apiNote: 'Schatting aan Anthropic API-prijzen',
    receiptThanks: 'Bedankt om te bouwen.', receiptYear: (y: number) => `Claude Code, jaar ${y}`,
    busiestDay: 'drukste dag', streak: 'langste reeks', days: (n: number, f: string) => `${f} dag${n === 1 ? '' : 'en'}`, topLanguage: 'toptaal',
    topTools: 'top tools', verdict: 'oordeel', reading: (n: number, f: string) => `${f} dag${n === 1 ? '' : 'en'} logs lezen...`, done: 'klaar',
    msgs: 'ber.', level: 'LV', weakness: 'Zwakte', nemesis: 'Aartsvijand', rarity: { common: 'Gewoon', rare: 'Zeldzaam', legendary: 'Legendarisch' },
    classLine: (lang: string, n: number, f: string, y: number) => `${lang}-klasse. ${f} keer opgeroepen in ${y}.`,
    since: (d: string) => `sinds ${d}`,
    messagesPerMonth: 'berichten per maand', save: 'Afbeelding opslaan', screenshot: 'Maak een screenshot van deze slide om te delen',
    next: 'Volgende', previous: 'Vorige',
  },
} as const;

export const t = (lang: Lang) => STRINGS[lang];

/** "Apr 21" / "21 apr." */
export function shortDate(date: string, lang: Lang): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-BE' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "Apr" / "apr." for a YYYY-MM month. */
export function shortMonth(month: string, lang: Lang): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-BE' : 'en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 15)));
}
