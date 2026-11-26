# Claude Code year recap skill: design

Date: 2026-11-27. Status: draft for approval. Product name: **Promptfolio** (decided by Tiebe). Note: the name is also used by unrelated prompt-portfolio products (Framer templates, an iOS prompt archive app, a Notion template); none is a recap tool. npm `promptfolio` was free on 2026-11-27.

Research behind this design:
- `docs/research/2026-11-26-direct-competitors-legal-tech.md`
- `docs/research/2026-11-26-indirect-competitors-shareability.md`
- `docs/research/2026-11-26-stack-analysis.md`

## Intent

A Claude Code skill that turns a user's local Claude Code history into a year recap people want to post. Two reasons it exists:

1. A tidy overview of your year with Claude Code that also shows, with evidence, why you are a good developer (the "professional" version, safe for LinkedIn).
2. A fun, laughable, LARP-able version: a persona, a trading card, a diary Claude writes about you, awards, your relationship status with Claude.

What makes it different from the existing tools (cc-wrapped, claude-code-wrapped, ccusage, `/insights`, Claude Reflect): those show numbers or a private report. This one has Claude write a personal persona from real data, and produces share-ready output (story, PNGs, README card). Nobody else ships a persona card, a 9:16 story, or a share-safe mode.

Quality over speed. There is no hard launch date, though early December (Wrapped season) is a nice-to-have.

## Goals

- One-command install, then one command (`/promptfolio`) to run.
- Optional onboarding of at most 5 single-tap questions. Typing "go" at any point skips the rest and uses the defaults (professional, everything hidden, English, all formats).
- Three outputs from one run:
  - **A. Story:** one self-contained HTML file, tap-through like an Instagram story, with count-up numbers and a "save as PNG" button on each slide. Opens offline by double-click.
  - **B. PNG cards:** written straight to a folder, no browser window needed: 9:16 (1080x1920), 4:5 (1080x1350), 1.91:1 (1200x627).
  - **E. README card:** an SVG for a GitHub profile README, animated with CSS if feasible.
- Three vibes. They share one design system (fonts, colours, slide shell, card frame). Professional has its own story sections and ends on a profile card; Fun and Roast me share the trading-card sections and differ only in tone. So v1 has two card templates (profile, trading card) and one slide shell:
  - **Professional:** only strengths, factual, backed by numbers.
  - **Fun:** persona, light roast.
  - **Roast me:** honest, can sting.
- English and Dutch output.
- Everything runs locally. The tool's own scripts upload nothing. The only data that leaves the machine is the redacted stats and sample that Claude reads in the user's own session to write the text (see Privacy).

## Non-goals (v1)

- Video output (later, by recording the HTML story).
- claude.ai chat history via data export.
- Friend duels or comparisons.
- A monthly archive to beat the 30-day log cleanup (strong v2 candidate, see Constraints).
- Other agents (Codex, Cursor, Copilot).
- A hosted website or shareable URL.
- Receipt, festival-lineup and other extra themes.

## Anti-goals (failure even if it works)

- Leaking anything sensitive in a shared image: project names, file paths, branch names, session titles, prompt text, API keys, tokens, emails.
- Numbers in the text that do not match the data, or invented comparisons ("top 3% of users") with no stated base.
- Generic AI text that could apply to anyone ("You're a passionate coder!"). Every persona line must point at something real in the user's data.
- Looking like an official Anthropic product: no Claude or Anthropic logo, and no "Claude Code" in the product name.
- Asking the user to install a browser, a runtime, or npm packages beyond what they have.
- Paywalls or accounts.

## Constraints

- **Data retention.** Claude Code deletes full session transcripts after 30 days by default (`cleanupPeriodDays`). On the author's machine: full logs from Oct 10, `stats-cache.json` daily counts from April, `history.jsonl` prompts from May. The recap must be honest about coverage: year-wide numbers come from `stats-cache.json` and `history.jsonl`, detailed numbers from the transcripts, and the output says which period the detailed numbers cover ("detailed stats: last 30 days"). On the first run the skill offers to raise `cleanupPeriodDays` so next year's recap has full data; the user approves that settings change, and nothing changes without that yes. (Decided by Tiebe.)
- **Log format is undocumented.** Field names below come from inspecting real files, not from docs. The parser must tolerate missing fields and unknown line types, and never crash on a bad line.
- **Runtime.** Node 18+ is required. The native Claude Code installer does not install Node, so the skill checks `node -v` first and gives a clear message if Node is missing.
- **Browser.** PNG export (B) uses a locally installed Chrome, Edge, Chromium or Brave in headless mode (`--headless=new --screenshot=<path> --window-size=W,H`). Tested on Windows with Edge: 1080x1920 in 2.4 s. If no browser is found, the run still produces the story (A) and the README card (E), and tells the user to use the story's save buttons instead.
- **Fonts.** Fonts are embedded (base64) in every HTML file, so cards look the same on every OS.
- **Name.** It cannot contain "Claude Code" (Agent SDK branding guide). Avoid "Wrapped" (Spotify trademarks). Final name decided before publishing.
- **Legal.** Reading the user's own local logs is fine. Not legal advice. Check the name with someone before any paid version.

## Approaches considered

1. **Zero-dependency Node scripts + HTML templates + the system browser for PNGs (chosen).** One template system (HTML/CSS) feeds the story and the PNGs, with full CSS. Users install nothing beyond Node and a browser they already have. Weak spot: machines without Chrome or Edge, covered by the in-story save buttons.
2. **Satori + resvg.** Deterministic, no browser needed, text as SVG paths. Rejected: a second template system next to the story HTML, flexbox-only CSS, two npm dependencies.
3. **Bun single binary.** No runtime needed. Rejected: 50-90 MB per platform, unsigned-binary warnings on Windows and macOS, a release pipeline for 5 targets.

Also rejected: Takumi (no SVG output), canvas drawing (hard to design), Playwright (downloads a 150 MB browser), Claude parsing the 1 GB of logs itself (slow, expensive, not testable), Remotion (video only, v2).

Tiebe picked approach 1.

## Decided

### Architecture

```
~/.claude logs ──► stats script (Node, 0 deps) ──► stats.json
                                                     │
                             Claude (in the skill) ──► copy.json
                                                     │
              stats.json + copy.json + HTML templates ──► render script
                                                     ├─► story.html        (A)
                                                     ├─► cards/*.png       (B, via headless browser)
                                                     └─► readme-card.svg   (E)
```

Split of work:
- **Code** owns every number. Deterministic and tested.
- **Claude** owns the words: persona, class name, strengths, diary entries, award names, captions. Claude never types a number. It uses placeholders like `{sessions}` or `{denials.top_tool}` that the render step fills from `stats.json`. A validator rejects copy with unknown placeholders, raw digits, or text too long for its slot.

### Flow inside the skill

1. Check Node. Locate the Claude data folder (`CLAUDE_CONFIG_DIR` or `~/.claude`).
2. Onboarding, or "go" for the defaults:
   1. Vibe: Professional / Fun / Roast me
   2. Posting where: IG story / LinkedIn / X / Discord / Just me (decides which PNG sizes to write)
   3. Project names: Hide all / Pick which / Show
   4. Theme: Trading card (v1 has this one theme for Fun and Roast me; Professional uses a clean profile layout)
   5. Language: English / Nederlands
3. Run the stats script → `stats.json`.
4. Claude reads `stats.json` plus a small, already-redacted sample (allowed session titles, top tools, top file types) and writes `copy.json`.
5. Validate `copy.json`. On failure, Claude fixes it and reruns validation.
6. Run the render script → output folder.
7. Show the user where the files are and open the story.

### Data sources and fields used

- `~/.claude/stats-cache.json`: `dailyActivity[]` with `date`, `messageCount`, `sessionCount`, `toolCallCount`. Year-wide activity, streaks, busiest days.
- `~/.claude/history.jsonl`: `display` (prompt text), `timestamp`, `project`, `sessionId`. Year-wide prompt counts, hours of day, politeness and correction words, language mix. Prompt text is analysed locally and never copied into output or into Claude's context, except as counts.
- `~/.claude/projects/*/*.jsonl` (last ~30 days): line `type`, `timestamp`, `cwd`, `gitBranch`, `entrypoint`, `permissionMode`, `effort`, `customTitle`, `isSidechain`, `toolDenialKind`, `message.model`, `message.usage` (input, output, cache tokens, `output_tokens_details.thinking_tokens`, `server_tool_use.web_search_requests`), `message.content[]` tool_use names and Bash commands, `hookErrors`.
- `~/.claude/skills`, `~/.claude/agents`, the `hooks` in `settings.json`, enabled plugins: counts only, for the "builds own tooling" strength.

### Stats (v1 list)

Year-wide: active days, sessions, messages, tool calls, longest streak, longest gap, busiest day, busiest month, prompts typed, hour-of-day profile, late-night share (sessions starting 00:00-05:00), politeness words, correction words ("no wait", "actually", "nee"), language mix.

Detailed period: tokens (in, out, cached), thinking tokens, models used, top tools, Bash command count, file types edited (→ languages), test runs (Bash commands matching common test runners), commits (Bash `git commit`), tool denials and top denied tool, plan-mode share, effort levels, subagent share, web searches, distinct projects and branches, longest session, compactions, hook errors, session titles (only shown if allowed).

Equivalents, always labelled as rough estimates with a range and a source link in the story: water (per-request range 0.26 mL to about 39 mL, turned into bathtubs at 150 L), energy (phone charges), tokens as books. Exact factors and sources are kept in one constants file. Source rule (decided by Tiebe): first-party figures only, meaning numbers published by the AI company itself (for example Google's per-prompt Gemini figures: 0.24 Wh, 0.26 mL water). Third-party estimates are not used. Every equivalent says "estimate" and links its source. A factor with no first-party source is not shown. The water range above therefore narrows to the first-party figures.

### Professional strengths

A fixed list of measurable habits. Claude picks the user's top 3 and words them factually ("Reviewed and blocked 41 tool calls"), never with a verdict ("you are a great developer"). The v1 list: plans first (plan-mode share), keeps control (denials), tests (test runs), ships (commits), builds own tooling (skills, hooks, agents), researches (web searches), range (languages), consistency (streak, active weeks).

### Story content

- Professional: Your year → What you built → Your stack → How you work (3 strengths) → Growth by month → Profile card.
- Fun / Roast me: Your year → Claude's diary about you (3-5 short entries) → Awards (3-4) → Relationship status with Claude → Funny equivalents → Trading card (class, level from tokens, 4 stats, special move, weakness, nemesis error).
- Every story ends on a card. The card is what gets posted.

### Privacy and redaction

- Output folder default: `./promptfolio-<year>/` in the current directory: `story.html`, `cards/*.png`, `readme-card.svg`, `stats.json`.
- With "Hide all", project names become "Project A, B, ...", and paths, branches and session titles are dropped from everything Claude sees and everything rendered.
- A secret scan (API key, token, email and URL-with-credentials patterns) runs on every string that goes into Claude's context or into an output file, and drops matches.
- `stats.json` stays local. The skill says plainly that `copy.json` is written by the Claude model the user is already talking to.

### Code and packaging

- Source in TypeScript with vitest tests; built to plain `.mjs` files committed inside the skill folder, so users run `node <skill>/scripts/stats.mjs` with no install step.
- Repo works as a Claude Code plugin marketplace (one plugin containing the skill) and as a skills.sh source (`npx skills add <owner>/<repo>`).
- Supported: Windows, macOS, Linux. v1 claims all three (decided by Tiebe). Real-data testing exists only on Windows; fixtures are synthetic, built from the Windows field inventory; CI runs the tests and one end-to-end render on all three OS. Known risk: the log format or browser install paths may differ on macOS or Linux, so the parser stays tolerant and browser detection has an env override.
- Browser detection: an env override first, then the standard install paths for Edge, Chrome, Chromium and Brave per OS.

### Testing

- Unit tests on the parser with synthetic JSONL fixtures, including broken lines and unknown types.
- Unit tests on the copy validator and the redaction and secret scan.
- One end-to-end render test on CI (GitHub Actions runners have Chrome) that checks the PNG sizes.
- A manual run on the author's real data before release.

## Still open (decided in later steps, not by the builder alone)

- **Visual style** of the story and the cards: decided with Tiebe in a mockup round, using ui-ux-pro-max, with make-interfaces-feel-better for the final polish. Constraints: one eye-catcher at most, smooth on phones, Instagram story safe zones respected, no Anthropic branding. Sequencing (decided by Claude): the stats script, copy validator, redaction and browser detection come first; the mockup round is a blocking step before any template work.
- **Product name: Promptfolio** (decided by Tiebe), used for the repo, npm name, install command, marketplace id, skill folder and `/promptfolio` command from the start. The current folder name "Claude-wrapped" is local only and is never published.
- **Privacy notice** (decided by Tiebe): README and onboarding say plainly: "The scripts upload nothing. Claude reads redacted stats in your own session to write the text."

## Left to the builder

File and folder layout, the regexes for test runners and secrets, exact JSON schemas for `stats.json` and `copy.json`, CLI flags of the scripts, the browser path lists, the level formula, font choice inside the visual style, and the README SVG technique (CSS-animated SVG with an embedded font if GitHub renders it, else a static SVG or PNG).
