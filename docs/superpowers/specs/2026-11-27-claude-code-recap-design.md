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
- First question: "Make it now" (defaults, no further questions) or "Personalise (1 min)" (one screen of four questions). See "Flow inside the skill" (revised 2026-11-27, v0.3).
- Four cards with fixed content (Tokens, Year in numbers, Toolkit, Growth), all in one style the user picks: Clean, Receipt, Terminal or Trading card. Style decides the look; tone decides the words.
- Outputs from one run:
  - **A. Story:** one self-contained HTML file, tap-through like an Instagram story, showing the four cards in the chosen style, with a "save image" link on each card whose PNG exists. Opens offline by double-click. Always written.
  - **B. PNG cards:** only the cards and formats the user picked: Story 9:16 (1080x1920), Square 1:1 (1080x1080), Wide 16:9 (1200x675).
  - **E. README card:** an SVG (plus PNG) for a GitHub profile README, 3:1 (1200x400), only when the user picks that format.
- Three tones. They change only Claude's words, never the layout:
  - **Professional:** factual, each line states a habit with its number (why you're a good dev).
  - **Fun:** light, laughable.
  - **Roast me:** honest, can sting, about habits only.
- Every card and the README card carry the repo link `github.com/Tiebe-Vaes/promptfolio` in small type at the bottom.
- English and Dutch output.
- Everything runs locally. The tool's own scripts upload nothing. The only data that leaves the machine is the redacted stats and sample that Claude reads in the user's own session to write the text (see Privacy).

## Non-goals (v1)

- Video output (later, by recording the HTML story).
- claude.ai chat history via data export.
- Friend duels or comparisons.
- A monthly archive to beat the 30-day log cleanup (strong v2 candidate, see Constraints).
- Other agents (Codex, Cursor, Copilot).
- A hosted website or shareable URL.
- Festival-lineup, nutrition-label and other styles beyond the four.
- Choosing stats per card: each card's content is fixed (decided by Tiebe, 2026-11-27).
- Posting on the user's behalf: the share step gives a caption and opens the platform, the user posts.

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

### Flow inside the skill (revised 2026-11-27, v0.3, decided by Tiebe)

All questions use Claude Code's own question picker (AskUserQuestion), so the flow works the same in the CLI and the desktop app. No HTML pages for choices. AskUserQuestion allows at most 4 questions per screen and 4 options per question.

1. Check Node. Locate the Claude data folder (`CLAUDE_CONFIG_DIR` or `~/.claude`). Show the privacy line.
2. Run the stats script → `stats.json` (before the questions, so previews and descriptions use the user's real numbers). Project names are always hidden; no card shows them.
3. Screen 1: "Make it now" or "Personalise (1 min)". Make it now = Clean, Professional, Story 9:16, all four cards.
4. Screen 2 (Personalise only), one screen:
   1. Style (single): Clean / Receipt / Terminal / Trading card, each with a text preview of the Tokens card using the user's numbers.
   2. Tone (single): Professional / Fun / Roast me.
   3. Formats (multi): Story 9:16 / Square 1:1 / Wide 16:9 / GitHub README 3:1.
   4. Cards (multi): Tokens / Year in numbers / Toolkit / Growth, each described in one line with the user's numbers.
   Language follows the conversation (English or Dutch). The year is the current one; only in January or February does the skill ask whether the user means last year.
5. Claude reads `stats.json` plus the redacted sample and writes `copy.json`; validate; on failure fix and rerun.
6. Render only the picked cards and formats, plus `story.html` → output folder. Tell the user the PNG time first (about 10 s each).
7. Say where everything is: the folder and every file as clickable links (absolute paths).
8. "What now?": Share / On my GitHub profile / Other format or style / Done.
   - **Share** → which platform (Instagram / LinkedIn / X / Discord). If no picked format fits that platform, offer to render one (LinkedIn: Square or Wide; X and Discord: Wide; Instagram: Story or Square). Then show that platform's caption (filled from stats, ends with the repo link), and: X opens a prefilled post in the browser (the user attaches the image); Instagram says which PNG to send to the phone; LinkedIn and Discord open the folder. Back to "What now?".
   - **On my GitHub profile** → render the README card if missing, show the markdown snippet. Back to "What now?".
   - **Other format or style** → ask which, render only that. Back to "What now?".
   - **Done** → open the folder. If `cleanupPeriodDays` is unset or below 366, offer to raise it to 400 so next year's recap is complete (edit only after a yes). End with one line holding the repo link.

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

### Card content (revised 2026-11-27, v0.3, stats picked by Tiebe)

Each card is the same in every style and tone; only its look (style) and Claude's one line (tone) change. A card whose hero number is zero or missing is skipped.

- **Tokens:** hero = tokens this year (`tokens.yearTotal`). Items: tokens written (`tokens.yearOutput`, with "since" when partial), favourite model and share (`tokens.favoriteModel`), energy and water estimates (`equivalents`, labelled "estimate").
- **Year in numbers:** items: prompts (`prompts.count`), slash commands, "please" and "thanks" (`prompts.politeness`), tool calls (`activity.toolCalls`, the stats-cache count only), commits, web searches, subagents (`sessions.subagentSessions`), files edited. Total line: API value (`apiValue`, labelled estimate, shown from $1); with no API value, no total line.
- **Toolkit:** hero = top 10 tools (`tools.top`). Items: languages (count and the top one), own setup (skills, agents, hooks), plugins.
- **Growth:** hero = messages per month as bars plus the growth factor (`activity.growth.factor`, shown from 2x). Items: messages, busiest month, longest streak, longest gap. Skipped when there are fewer than two active months.
- Claude writes one line per card (`lines.tokens`, `lines.year`, `lines.toolkit`, `lines.growth`), a short `title` for the user (the trading card's name, the clean style's header), and one caption per platform. Professional lines state a habit with its number, picked from `strengthCandidates`; Fun and Roast lines tease, Roast can sting.
- Out since v0.3: test runs, corrections, denials, plan-mode share, heatmap, read-per-written ratio, diary, awards, relationship, card moves.

### Privacy and redaction

- Output folder default: `./promptfolio-<year>/` in the current directory: `story.html`, `cards/*.png`, `readme-card.svg`, `stats.json`.
- Project names become "Project A, B, ...", and paths, branches and session titles are dropped from everything Claude sees and everything rendered. Since v0.3 this is always on (the cards show no project names), so the skill no longer asks.
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

## Visual decisions (mockup rounds, 2026-11-27)

Decided by Tiebe after three mockup rounds (`design/mockups/round-2.html`, `round-3-visualizers.html`), checked against `docs/research/2026-11-27-ai-design-tells.md`:

- **Formats in v0.2:** data artwork (token pair + year heatmap), receipt, terminal session, trading card, and a growth closer for Professional (messages per month as one line, headline like "29 times busier by October"). The hour clock, nutrition label and language stack are out.
- **Token slide:** both numbers as a pair, "tokens read" (all tokens including cache) and "tokens written" (output), with a line saying how many tokens Claude reread per token it wrote.
- **API value:** shown on the receipt as a labelled estimate at Anthropic's published API prices, next to "You paid: a plan".
- **Accent colour:** the user's top language's GitHub colour (TypeScript #3178C6, Python #3572A5, Java #B07219, ...), not a fixed brand colour.
- **Type:** Archivo (variable width) for numbers and headings, IBM Plex Mono only on the receipt and terminal, Big Shoulders Display for the card name, Libre Franklin for body text. All OFL fonts, embedded.
- **Never:** eyebrow labels, "01 / 07" counters (stories use an Instagram-style progress bar), gradient text, glow, middle-dot strings, one accented word in a heading, monospace for decoration, cream + terracotta, near-black + single neon accent.
- **Generated art:** heatmap, growth line, receipt barcode and the trading-card creature are drawn from the user's own data, so every recap differs.

## Visual decisions, revision for v0.3 (2026-11-27, decided by Tiebe)

- **One style for all four cards.** The four v0.2 slide looks become styles: Clean (from the data artwork slide: big Archivo numbers, white, accent colour), Receipt (IBM Plex Mono slip with barcode), Terminal (dark terminal window, Plex Mono), Trading card (framed card with the generated creature, level and rarity; the four cards read as a booster pack, "1/4" to "4/4"). All four ship in v0.3.
- **Formats:** Story 1080x1920, Square 1080x1080, Wide 1200x675, README 1200x400. The 4:5 feed size is dropped (Square covers feeds; the picker allows only 4 options). Discord has no documented image size; Wide is the assumption, checked on a real message before release.
- **Repo link** on every card and the README card, small, in the style's own body font, never as the eye-catcher.
- All earlier "Never" rules still hold. Monospace is allowed only in the Receipt and Terminal styles.

## Left to the builder

File and folder layout, the regexes for test runners and secrets, exact JSON schemas for `stats.json` and `copy.json`, CLI flags of the scripts, the browser path lists, the level formula, font choice inside the visual style, and the README SVG technique (CSS-animated SVG with an embedded font if GitHub renders it, else a static SVG or PNG).
