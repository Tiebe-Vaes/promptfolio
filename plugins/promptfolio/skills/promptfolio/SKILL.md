---
name: promptfolio
description: Promptfolio builds a shareable year recap of the user's Claude Code use from local logs. Use when the user says "promptfolio", asks for their year with Claude Code, or wants a Claude Code recap.
---

# Promptfolio

Turns the user's local Claude Code history into four share cards (Tokens, Year in numbers, Toolkit, Growth) in one style. Code computes every number; you write the words.

**Script paths.** The scripts live in `scripts/` inside this skill's base directory (the folder this SKILL.md was loaded from). Write `<skill>` below as that absolute folder, and quote it: `node "<skill>/scripts/doctor.mjs"`. Output goes to `./promptfolio-<year>/` in the user's current folder; write `<out>` for its absolute path.

**Questions.** Every question is an AskUserQuestion: at most 4 questions per call, at most 4 options per question. This works the same in the CLI and the desktop app. Never send the user to an HTML page to choose.

**Language.** Everything is English: questions, copy (`"language": "en"`), cards and messages, whatever language the user writes in.

**Opening a file, folder or URL.** `Start-Process "<target>"` in PowerShell, `cmd /c start "" "<target>"` in cmd or Git Bash on Windows, `open "<target>"` on macOS, `xdg-open "<target>"` on Linux.

## Steps

1. **Check Node.** Run `node -v`. Done when it prints v18.3 or higher. If Node is missing or older, tell the user Promptfolio needs Node 18.3+ and end here.
2. **Doctor.** Run `node "<skill>/scripts/doctor.mjs"`. If `claudeDirExists` is false, tell the user no Claude Code data was found at `claudeDir` and end here. Show exactly: "The scripts upload nothing. Claude reads redacted stats in your own session to write the text." In January or February only, ask whether the recap is for last year or this year. Done when the year is known.
3. **Stats.** Run `node "<skill>/scripts/stats.mjs" --out <out> --projects hide` (add `--year <year>` for last year). Done when it prints the paths of `stats.json` and `sample.json`. Read both.
4. **Screen 1.** Ask "How do you want your recap?" with two options: "Make it now" (Clean style, Professional tone, Story format, all four cards) and "Personalise (1 min)" (four quick questions). Make it now skips step 5.
5. **Screen 2.** One AskUserQuestion with four questions:
   - **Style** (single): Clean / Receipt / Terminal / Trading card. Give each option a `preview`: the Tokens card in that style as plain text, filled with the user's numbers from `stats.json` (`tokens.yearTotal`, `tokens.yearOutput`, `tokens.favoriteModel`). See **Style previews**.
   - **Tone** (single): Professional (factual, why you're a good dev) / Fun (light, laughable) / Roast me (honest, can sting).
   - **Formats** (multi): Story 9:16 (Instagram and TikTok stories) / Square 1:1 (Instagram feed, LinkedIn, Discord) / Wide 16:9 (Discord, X, Slack, LinkedIn) / GitHub README 3:1 (profile banner). Map to `story`, `square`, `wide`, `readme`.
   - **Cards** (multi): Tokens / Year in numbers / Toolkit / Growth. Describe each in one line with the user's real numbers (for example "18.1B tokens, 72.5M written, Opus 5.5 favourite"). Map to `tokens`, `year`, `toolkit`, `growth`.

   Done when style, tone, formats and cards are known. An empty multi-select means the default (Story; all cards).
6. **Write the copy.** Write `<out>/copy.json` following **Copy rules**, then run `node "<skill>/scripts/validate.mjs" <out>/copy.json <out>/stats.json`. Each output line names a JSON path and the problem; fix those and rerun. Done when it prints `OK`. After 3 failed rounds, show the user the remaining errors.
7. **Render.** Count the PNGs (cards x non-readme formats, plus 1 for readme) and say they take a few seconds each. Run `node "<skill>/scripts/render.mjs" --dir <out> --style <clean|receipt|terminal|card> --cards <list> --formats <list>`. It prints every written path, absolute, one per line, and `skipped <card>: not enough data` for a card without data. Done when it exits 0.
8. **Show where it is.** Open `<out>/story.html`. Then list the folder and every printed file as a markdown link with its absolute path, for example `[clean-tokens-story.png](C:/Users/me/promptfolio-2026/cards/clean-tokens-story.png)`. Mention skipped cards in one line. If render said PNGs were skipped, say the story still works and screenshots are the way to share. Done when every written file is linked.
9. **What now?** Ask "What now?" with: Share / On my GitHub profile / Other format or style / Done. Repeat this step after each branch except Done.
   - **Share.** Ask which platform: Instagram / LinkedIn / X / Discord. When no rendered format fits it (Instagram: story or square; LinkedIn: square or wide; X and Discord: wide), offer to render one and do it on a yes. Read `<out>/captions.json` and show that platform's `text` in a code block to copy. X: open its `intentUrl` (the post opens prefilled; the user attaches the PNG). Instagram: name the PNG to send to the phone. LinkedIn and Discord: open the `cards` folder. You never post anything yourself.
   - **On my GitHub profile.** If `readme-card.svg` is missing, rerun render with the same `--style` and `--formats readme`. Show the link to `readme-card.svg` and the snippet `![Promptfolio](readme-card.svg)`, to commit next to the README of the user's profile repository (the repository named after their GitHub username).
   - **Other format or style.** Ask which formats and, if wanted, which style (the same options as step 5). Rerun render with only those, then link the new files.
   - **Done.** Open the `<out>` folder. If doctor's `cleanupPeriodDays` is null or below 366, explain that Claude Code deletes detailed session logs after that many days (30 by default), so next year's recap is fuller if they are kept, and offer to set `cleanupPeriodDays` to 400 in `<claudeDir>/settings.json`. Edit only after a yes, keeping every other setting. End with one line: "Made with Promptfolio: https://github.com/Tiebe-Vaes/promptfolio".

## Style previews

Plain text, about 24 characters wide, 8 to 12 lines, with the user's numbers. Clean: the big number, "tokens in <year>", then written and favourite model. Receipt: a `PROMPTFOLIO <year>` header, dashed rules, label/value lines, a barcode line of `|` and spaces. Terminal: `$ promptfolio tokens`, then `read ..... <n>` style rows and a `$ _` prompt. Trading card: `<title> Lv <n>` on top, a box marked `[creature]`, stat rows and `card 1/4`. End every preview with `github.com/Tiebe-Vaes/promptfolio`.

## Copy rules

Shape (copy v2):

```json
{
  "schemaVersion": 2,
  "vibe": "professional | fun | roast",
  "language": "en | nl",
  "title": "",
  "lines": { "tokens": "", "year": "", "toolkit": "", "growth": "" },
  "captions": { "instagram": "", "linkedin": "", "x": "", "discord": "" }
}
```

- **title** (22 characters max): a short title for the user, built from their data, e.g. "TypeScript builder" or "Shell Warlock". It is the trading card's name and the header of the clean cards.
- **lines** (90 max each): one line per card, under its numbers. `growth` is required when `stats.activity.byMonth` has two or more months, else leave it out. **Professional** lines state a habit with its number, taken from `stats.strengthCandidates` (highest `score` first), e.g. "Shipped {tools.commits} commits, most of them small." **Fun** teases lightly. **Roast** is honest and can sting, about habits only, never about the person's worth.
- **captions** (200 max each), without the repo link (code adds it): Instagram casual, LinkedIn factual (the strongest habit and number), X short, Discord casual.
- **Numbers only as placeholders.** Every number is a `{dotted.path}` from `sample.json` `placeholders`. Month placeholders print as month names. Digits typed into text fail validation.
- **Specific.** Every line points at something real in the data: a top tool, a language, a busiest month, a habit from `sample.json` `vibeHints`. A line that would fit any user gets rewritten.
- **Honest comparisons.** Compare the user only with their own data (months, habits). Rankings against other users stay out; there is no data on other users.
