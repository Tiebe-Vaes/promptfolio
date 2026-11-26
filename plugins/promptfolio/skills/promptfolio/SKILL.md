---
name: promptfolio
description: Promptfolio builds a shareable year recap of the user's Claude Code use from local logs. Use when the user says "promptfolio", asks for their year with Claude Code, or wants a Claude Code recap.
---

# Promptfolio

Turns the user's local Claude Code history into a year recap. Code computes every number; you write the words. Scripts live in `scripts/` next to this file; run them with `node`.

## Steps

1. **Check Node.** Run `node -v`. Done when it prints v18 or higher. If Node is missing or older, tell the user Promptfolio needs Node 18+ and end here.
2. **Doctor.** Run `node scripts/doctor.mjs`. Done when you have its JSON. If `claudeDirExists` is false, tell the user no Claude Code data was found at `claudeDir` and end here.
3. **Onboarding.** Say: "Quick setup (5 taps), or type go for the professional version." Then ask with AskUserQuestion:
   - Vibe: Professional / Fun / Roast me
   - Posting where (multi-select): IG story / LinkedIn / X / Discord / Just me
   - Project names: Hide all / Pick which / Show
   - Theme: Trading card (ask only for Fun or Roast me)
   - Language: English / Nederlands

   "go" at any point means: professional, hide, English, all formats. For "Pick which", ask which project folder names to show. Done when vibe, project mode and language are known.
4. **Retention.** If `cleanupPeriodDays` is null or below 366, explain: Claude Code deletes detailed session logs after that many days (30 by default), so this recap's detailed stats cover only that window. Offer to set `cleanupPeriodDays` to 400 in `<claudeDir>/settings.json` so next year's recap is complete. Edit the file only after the user says yes, preserving every other setting.
5. **Privacy line.** Show exactly: "The scripts upload nothing. Claude reads redacted stats in your own session to write the text."
6. **Stats.** Run `node scripts/stats.mjs --out ./promptfolio-<year> --projects <hide|pick|show> [--allow name1,name2]`. Done when it prints the paths of `stats.json` and `sample.json`.
7. **Write the copy.** Read both files, then write `./promptfolio-<year>/copy.json` following **Copy rules** below.
8. **Validate.** Run `node scripts/validate.mjs ./promptfolio-<year>/copy.json ./promptfolio-<year>/stats.json`. Each output line names a JSON path and the problem; fix those and rerun. Done when it prints `OK`. After 3 failed rounds, show the user the remaining errors.
9. **Preview.** Show the copy as plain text with every `{placeholder}` replaced by its value from `stats.json` (percentages for paths ending in `Share`). Tell the user the visual story and share cards come in the next version.

## Copy rules

Shape:

```json
{
  "schemaVersion": 1,
  "vibe": "professional | fun | roast",
  "language": "en | nl",
  "profile": { "headline": "", "strengths": [{ "id": "", "text": "" }] },
  "persona": { "className": "", "specialMove": "", "weakness": "", "nemesis": "" },
  "diary": [""],
  "awards": [{ "title": "", "text": "" }],
  "relationship": { "status": "", "text": "" },
  "captions": {}
}
```

- **professional** fills `profile`: a headline and exactly 3 strengths whose `id`s come from `stats.strengthCandidates` (prefer the highest `score`). Each strength states the habit and its number factually, e.g. "Reviewed and blocked {denials.userRejected} tool calls".
- **fun** and **roast** fill `persona`, 3-5 `diary` entries (Claude's diary about the user, first person), 3-4 `awards` and `relationship`. Fun teases lightly; roast is honest and can sting, still about habits, never about the person's worth.
- **Numbers only as placeholders.** Every number is a `{dotted.path}` from `sample.json` `placeholders`. Digits typed into text fail validation.
- **Specific.** Every line points at something real in the data: a top tool, a language, a late-night share, a session title from `sample.json` `vibeHints`. A line that would fit any user gets rewritten.
- **Honest comparisons.** Compare the user only with their own data (months, habits). Rankings against other users stay out, since there is no data on other users.
- Write in the chosen language. Keep within the length limits the validator reports.
