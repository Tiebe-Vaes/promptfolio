# Claude Code wrapped: competitors, built-ins, data, legal, and share-card tech

Research date: 2026-11-26. Stars, commit counts and download numbers are as shown on the pages when they were fetched, not live values. Anything marked **unverified** could not be confirmed on a primary source in this pass. Legal notes are research, not legal advice.

## TL;DR

- The space is crowded but thin. Roughly ten "Claude Code wrapped" tools exist. Most have 0 to 9 GitHub stars. The only broad-adoption tool is [ccusage](https://github.com/ryoppippi/ccusage) (19.6k stars), and it is a usage-cost CLI, not a recap.
- The closest share-image competitor is [levifig/cc-wrapped](https://github.com/levifig/cc-wrapped). It renders a PNG with Satori and Resvg, but it has 0 stars and a fork lineage (numman-ali, moddi3) that is not visible on its own page.
- Anthropic now ships a first-party year-in-review. [Claude Reflect](https://www.anthropic.com/news/reflect-with-claude) (announced July 9, 2026) covers claude.ai chat, not Claude Code. Claude Code has no recap; it has [/insights](https://code.claude.com/docs/en/commands) (an HTML report) and [/usage](https://code.claude.com/docs/en/commands) (with a /stats alias).
- Two built-in facts shape the product. Local transcripts are deleted after 30 days by default ([cleanupPeriodDays](https://code.claude.com/docs/en/claude-directory)), so a year-in-review needs a warning or an archive step. /insights already writes an HTML report under ~/.claude/usage-data/.
- Naming risk: Anthropic's Agent SDK branding guide forbids "Claude Code" in third-party product names. Use a neutral name such as "agent-wrapped" or "session-wrapped" and say "for Claude Code" only in descriptions. Not legal advice.
- "Wrapped" is a Spotify-registered word in the US (per aggregator records, not USPTO). Several projects already use it. "Unwrapped" (used by Remotion's GitHub Unwrapped) avoids the question.
- Share images: Satori plus resvg (what cc-wrapped uses) is the lightest offline option with prebuilt Windows binaries. An in-browser DOM capture (html-to-image) is simpler but has CORS and Safari caveats.
- Instagram has no desktop story API. The Content Publishing API is business-accounts only, needs a publicly hosted JPEG, and stories expire after 24 hours. Realistic sharing: save the PNG, plus Web Share API (files) on mobile.
- Install can be one command: an npm/npx skill via [skills.sh](https://skills.sh) (`npx skills add <owner/repo>`), or a Claude Code plugin marketplace (`claude plugin marketplace add`, then `claude plugin install`).
- Gap: no tool combines a persona/trading-card output, a 9:16 story image or video, a share-safe export that hides project names, and a year-level archive that survives the 30-day cleanup.

---

## 1. Direct competitors (Claude Code and AI coding usage recaps)

### 1.1 Recap-style tools (Spotify Wrapped look)

**levifig/cc-wrapped** ([GitHub](https://github.com/levifig/cc-wrapped), [npm](https://www.npmjs.com/package/cc-wrapped))
- Install: `npx cc-wrapped`, or `npm install -g cc-wrapped` then `cc-wrapped`. Option `--year`.
- Stats: sessions, messages, tokens, projects, streaks, GitHub-style heatmap, top models and providers, cost when available.
- Output: terminal summary plus a PNG saved to the home directory, also copied to the clipboard. Inline image in Ghostty, Kitty, iTerm2, WezTerm, Konsole.
- Design: IBM Plex Mono card, built with Satori and Resvg.
- Lineage: a public fork of numman-ali/cc-wrapped; credits moddi3's opencode-wrapped and ccusage. MIT.
- Stars: 0. 18 commits. No release or date shown. Activity unverified.
- Caveat: a separate npm package with the same name and a different author appears in search results. Check the author before installing. The socket.dev page for `cc-wrapped` shows an unrelated site banner about an Axios supply-chain incident; that is not evidence against this package, but verify before installing.

**claude-code-wrapped** ([PyPI](https://pypi.org/project/claude-code-wrapped/), repo listed as [The-Money-Company-Limited/claudecodewrapped](https://github.com/The-Money-Company-Limited/claudecodewrapped))
- Install: `uvx claude-code-wrapped` (listed as recommended), `pip install claude-code-wrapped`, `npx claude-code-wrapped`. Python 3.12 or later.
- Stats: stat reveals, contribution graph, coding personality, movie-style credits.
- Output: terminal only. Options such as `--no-animate`, `--json`, a year argument (per [search summary](https://pypi.org/project/claude-code-wrapped/0.1.0/); unverified on the PyPI page).
- Author: Mert Deveci, described as the maker of Banker.so (per search; the Banker.so link is unverified).
- Latest version 0.1.11, released December 22, 2025 per PyPI. MIT. Roughly 11 months old at research date.
- Gap: no image or HTML output.

**claude-wrapped (da-troll)** ([GitHub](https://github.com/da-troll/claude-wrapped), [PyPI](https://pypi.org/project/claude-wrapped/), [npm](https://www.npmjs.com/package/@da-trollefsen/claude-wrapped))
- Install: `uvx claude-wrapped`, `npx @da-trollefsen/claude-wrapped`, `pip install claude-wrapped`, `brew tap da-troll/claude-wrapped` then `brew install claude-wrapped`, or from source with `uv run python -m claude_code_wrapped`.
- Stats: messages, sessions, projects, tokens (input, output, cache), cost estimates from Anthropic pricing, longest and current streaks, peak hour, top tools, projects and models, longest conversation, a personality type.
- Output: terminal (interactive or flags), HTML with interactive graphs, Markdown, JSON. No PNG or video in the README.
- Share: exports with timestamped filenames; no upload. Design: ASCII title, one-stat-at-a-time reveal, contribution graph, movie-style credits.
- Privacy: the README says it makes no network requests and needs no API key.
- Stars: 0. 64 commits. MIT. Last activity not shown. The fetch resolved the repo as `da-troll/Claude-Code-Wrapped`, so the name may have changed.
- Gap: HTML and Markdown are not share images. Its "top projects" output can leak project names if shared as-is.

**code-wrapped (htin1)** ([GitHub](https://github.com/htin1/code-wrapped))
- Install: `npm install && npm run build`, then `npm start`. Inspired by [cursor.com/2025](https://github.com/htin1/code-wrapped) per the README.
- Needs an `ANTHROPIC_ADMIN_KEY` from the Anthropic console. Filters: `--api-key-id` for API-key users, `--user <email>` for subscription users. With no filter it pulls org-wide data. `--year`, `--demo`, `-o` output path, `--svg` for SVG output.
- Stars: 0. 2 commits. MIT. Last activity not shown.
- Gap: needs an admin key, so it cannot read local logs. Not usable by a normal subscriber.

**coding-wrapped (senlindesign)** ([GitHub](https://github.com/senlindesign/coding-wrapped))
- Covers Claude Code and Codex. Install: `npx skills add senlindesign/coding-wrapped --skill coding-wrapped --agent claude-code --agent codex --global`, or as a plugin, or by copying `skills/coding-wrapped` into `~/.claude/skills/`.
- Reads the standard local session folders. Stores aggregates only (no transcripts, project names, paths, URLs or secrets).
- Output: a loopback dashboard at `http://127.0.0.1:4173/` with a pixel-art style, active days, model mix, tool use, four insight cards per run, and a portable local export. Python 3.9+.
- Stars: 9. 42 commits. MIT. Last activity not shown.
- Gap: a dashboard, not a shareable image or video. Closest existing match to the "persona card" idea, but no card export found.

**Year in Code** ([Product Hunt](https://www.producthunt.com/products/year-in-code))
- Web app (per search snippet only; unverified) that makes Wrapped-style reports with save and share, and later added GitHub-based reports. Not fetched.

### 1.2 Stats and dashboards (not recaps, but overlapping)

**ccusage** ([GitHub](https://github.com/ryoppippi/ccusage))
- Install: `npx ccusage@latest`, `bunx ccusage`, `pnpm dlx ccusage`.
- Reads local usage data from about 20 agent CLIs (Claude Code, Codex, OpenCode, Amp, Gemini CLI and others). Subcommands: `daily`, `weekly`, `monthly`, `session`, `blocks` (5-hour Claude Code windows), `statusline` (beta).
- Output: terminal tables, `--json`, `--breakdown`, `--no-cost`, `--compact` ("perfect for screenshots and sharing" per README).
- Stars: 19.6k, 944 forks. MIT. Release date not shown.
- Gap: no recap or card. It is the reference for JSONL parsing and pricing, and the most likely dependency to reuse or credit.

**buildingopen/claude-code-stats** (README title "Claude Recap") ([GitHub](https://github.com/buildingopen/claude-code-stats))
- Install: `npx claude-recap`. Needs Python 3.8+ and Node 14+.
- Stats: sessions, active days, hours, projects, cost and ROI against a plan (`--plan pro|max5|max`, default Max $200/month), errors, trends. `--days`, `--project`, `--json`, `--no-color`.
- Honest README: "Operational stats dashboard... Pure numbers, terminal output." The GitHub About line says "Spotify Wrapped for Claude Code", which the README does not support.
- `CLAUDE_PROJECTS_DIR` overrides the path (colon-separated list allowed).
- Stars: 0. 13 commits. MIT.

**yurukusa/cc-session-stats** ([GitHub](https://github.com/yurukusa/cc-session-stats))
- Install: `npx cc-session-stats`. Zero dependencies.
- Stats: sessions and hours, average and longest session, day-of-week, active-hours heatmap, project breakdown, streak, health warnings. `--json` for CI.
- Caveats: durations are estimated from first and last timestamps, so approximate. Sample output has a "0.0h per session" display issue. The README promotes paid products.
- Stars: 2. 37 commits. MIT.

**vibestats (stephenleo)** ([GitHub](https://github.com/stephenleo/vibestats))
- Syncs Claude Code and Codex activity to a private GitHub repo, then renders an SVG heatmap on the user's profile README via a daily GitHub Action, plus a web dashboard at vibestats.dev/<username>.
- Install: curl or PowerShell installer, or `cargo install vibestats`.
- Notable: only aggregated daily JSON is synced, and the data survives the 30-day local cleanup. This is the only tool found that solves the retention problem.
- Stars: 2. MIT. Last release not shown.
- Other "vibestats" packages exist (npm, a different author). Unverified.

**claude-analytics (npm, sooth)** and **1shanpanta/claude-analytics**: found in search only. Unverified; not fetched.

### 1.3 Other names found in search (not fetched)

- `claude-usage-analyzer`, `claude-usage` (PettHa), `claude-code-usage-analyzer` (aarora79): GitHub repos surfaced by search. Unverified.
- `atomchung/ccstory`: surfaced by search. Unverified.

### 1.4 Naming pattern

Most tools use "wrapped", "stats", "recap", or "analytics". The Remotion project uses "Unwrapped" ([GitHub Unwrapped 2023](https://github.com/remotion-dev/github-unwrapped-2023)). No 2024 repo was found under that name; the main [github-unwrapped](https://github.com/remotion-dev/github-unwrapped) repo was last pushed in December 2024 per an ecosyste.ms listing (unverified).

---

## 2. Built-in and first-party recaps

### 2.1 Claude Code

**/insights** (official, [commands reference](https://code.claude.com/docs/en/commands))
- Docs text: "Generate an HTML report analyzing your recent sessions on this machine: which projects you work in, how you use Claude Code, where things go wrong, and features to try." Not available in cloud sessions.
- Detail from [Analyze your usage patterns](https://code.claude.com/docs/en/costs#analyze-your-usage-patterns): writes `~/.claude/usage-data/report.html` and a timestamped copy each run. Up to 200 new sessions per run, skips very short ones. Report header shows counts like `200 sessions (412 total)`. Runs on any plan and provider. Covers friction points and suggestions. Sessions from other devices and claude.ai are excluded.
- Retention: deleted with the other session data after `cleanupPeriodDays` (default 30).
- Gap for this product: it is a self-improvement report, not a shareable card. It does not produce images.

**/usage, /stats, /cost** ([commands reference](https://code.claude.com/docs/en/commands), [costs page](https://code.claude.com/docs/en/costs))
- `/usage` shows session cost, plan usage limits and activity stats. `/stats` and `/cost` are aliases; `/stats` opens on the Stats tab.
- Figures are "computed from local session history on this machine", so usage from other devices or claude.ai is not included.
- `stats-cache.json` holds "aggregated token and cost counts shown by /usage" ([claude-directory doc](https://code.claude.com/docs/en/claude-directory)).
- No recap, image, or share feature.

**Analytics dashboards** (team and API, [analytics doc](https://code.claude.com/docs/en/analytics))
- claude.ai Team and Enterprise dashboard at claude.ai/analytics/claude-code: usage metrics, GitHub-linked contribution metrics, leaderboard, CSV export. Admin-only. API dashboard at platform.claude.com/claude-code.
- Not for individuals. Relevant only as a reference for what enterprise users see.

### 2.2 Anthropic consumer: Claude Reflect ("Claude Wrapped" is press nickname)

- Announced July 9, 2026: [Introducing a way to reflect on how you use Claude](https://www.anthropic.com/news/reflect-with-claude) (title per search result; fetched content was the page body).
- Facts from the announcement as fetched: beta; in Settings on web and desktop; windows of 1, 3, 6 or 12 months; shows key topics, usage patterns, task types and peak times; maps activity to the 4D AI Fluency Framework (Delegation, Description, Discernment, Diligence); periodic reflective questions; quiet hours and break reminders.
- Availability: Free, Pro and Max with Memory on (per fetch). A press report says Team and Enterprise are not supported (unverified against the page).
- Exclusions: incognito chats; content from connected tools is not pulled in (a summary may appear); conversations linked to a health integration are left out. Press reports also exclude Claude Code and Cowork; the announcement fetch did not mention Claude Code. Treat the Claude Code exclusion as unverified.
- Roadmap: a time-spent view "coming soon"; reflection on Cowork coming soon.
- Export or sharing of a reflection: not stated.
- Press framing: called "Spotify Wrapped-style" by [Digital Trends](https://digitaltrends.com/computing/claude-reflect-is-here-its-your-usual-yearly-wrapped-but-with-anthropics-ai) and by [MacRumors](https://macrumors.com/2026/07/09/anthropic-reflect-claude-tracking). Engadget framed it as a way to "log off". No shareable card found.

### 2.3 ChatGPT

- "Your Year with ChatGPT" launched around December 22, 2025, per [TechCrunch](https://techcrunch.com/2025/12/22/chatgpt-launches-a-year-end-review-like-spotify-wrapped/) and [MacRumors](https://www.macrumors.com/2025/12/22/chatgpt-year-end-summary-2025/).
- Eligible individual accounts in the US, UK, Canada, Australia and New Zealand. Team, Enterprise and Education excluded. Requires reference of saved memory and chat history on.
- Contents: message count, a poem, a generated pixel painting, an award, 2026 predictions. Opened by asking for it, not forced.
- Gap: image-generation style, not a local tool. Shows the expected format: a few stats, a poem, a persona-like "award".

### 2.4 Cursor

- Cursor published a developer-habits report ([cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits)). Lines added per PR up roughly 2.5x year over year, per the report summary in search.
- A cursor.com/2025 personal page was mentioned in a community post. Not confirmed on a Cursor primary page. Unverified.
- Cursor forum threads ask users to share their year in review ([forum](https://forum.cursor.com/t/share-your-year-in-review/147241)). No official personal recap confirmed.

### 2.5 GitHub Copilot

- Usage metrics dashboard covers a rolling 28-day window, with an NDJSON export for longer-term storage. [Docs](https://docs.github.com/en/copilot/concepts/billing-and-usage/copilot-usage-metrics/copilot-metrics).
- The Copilot metrics were announced GA on [February 27, 2026](https://github.blog/changelog/2026-02-27-copilot-metrics-is-now-generally-available). Some docs still say preview; the changelog is newer.
- A July 2026 impact dashboard for admins ([changelog](https://github.blog/changelog/2026-07-21-new-copilot-usage-metrics-impact-dashboard)).
- No Wrapped-style recap found.

### 2.6 Not searched in this pass (unverified)

Perplexity, Gemini, Replit, Lovable, v0, Warp: no search run. Treat as unknown.

---

## 3. Data: what the local files contain

### 3.1 Claude Code local files (primary)

From [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory):
- `~/.claude/projects/<project>/<session>.jsonl`: conversation transcript, including messages, tool calls, tool results, the system prompt, tool definitions and request parameters.
- `~/.claude/projects/<project>/<session>/subagents/`: subagent transcripts in the same format.
- `~/.claude/projects/<project>/<session>/tool-results/`: large tool outputs spilled to files.
- `~/.claude/stats-cache.json`: aggregated token and cost counts used by /usage. Kept until you delete it.
- `~/.claude/history.jsonl`: prompts typed, with timestamp and project path. Kept until you delete it.
- `~/.claude/usage-data/`: /insights reports.
- Retention: `cleanupPeriodDays` default 30, minimum 1. Files older than that are deleted at startup. `desktopSessionCleanupPeriodDays` covers Claude Desktop and Cowork transcripts.
- Plaintext: transcripts are not encrypted; anything a tool prints, including credentials, is written to the JSONL.
- Directory override: `CLAUDE_CONFIG_DIR` moves every `~/.claude` path (per the same doc). On Windows, `~/.claude` = `%USERPROFILE%\.claude`.

### 3.2 JSONL line schema (secondary sources only)

- Each line is one JSON object with a `type` field distinguishing user and assistant messages. Source: [tmai-core transcript parser](https://docs.rs/tmai-core/1.2.0/src/tmai_core/transcript/parser.rs.html), and the [entireio/cli Go package](https://pkg.go.dev/github.com/entireio/cli@v0.5.4/cmd/entire/cli/transcript) per search.
- Model: `message.model` on assistant messages (same tmai-core parser).
- Usage blocks with cache tokens: named in the [claude-code-transcripts](https://docs.rs/crate/claude-code-transcripts/0.1.3/source/README.md) README, field names not confirmed.
- Schema drift: claude-code-transcripts has a round-trip validator to catch unknown fields ([CHANGELOG 0.1.9](https://docs.rs/crate/claude-code-transcripts/0.1.9/source/CHANGELOG.md)). Its changelog mentions `leafUuid` last-prompt entries and new attachment types.
- Content is sometimes a string and sometimes a list (cc-transcript [README](https://pypi.org/project/cc-transcript/7.1.0/) per search).
- **Unverified:** the exact field names `sessionId`, `timestamp`, `cwd`, `gitBranch`, `version`, `requestId`, and the usage sub-fields (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`). An attempt to read the ccusage TypeScript types returned 404. Verify by reading a real JSONL file on disk and by reading one parser's source before writing the schema.

### 3.3 claude.ai data export

- Path: Settings > Privacy > Export data, on web or desktop. Not on mobile. Source: [Export your Claude data](https://support.claude.com/en/articles/9450526-export-your-claude-data).
- Download link expires after 24 hours and may work once.
- Contents: conversations and account data, plus voice recordings shared with Anthropic. Original uploaded files are not included.
- Format: JSON (per a third-party site). No official file structure or `conversations.json` name found on a primary page. Projects and memory reportedly not included (third-party claim, unverified).
- Relevance: a claude.ai recap needs this export or Reflect. A local tool cannot read claude.ai chats.

---

## 4. Legal and trademark

Not legal advice. Points below are what the cited pages say.

### 4.1 Anthropic Trademark Guidelines

Source: [anthropic.com/legal/trademark-guidelines](https://www.anthropic.com/legal/trademark-guidelines).
- The guidelines apply to "any trademarks owned by Anthropic, PBC or its affiliates", including names, logos and brand elements.
- Quoted rules (as returned by the fetch tool; verify against the live page):
  - "You may only use our trademarks as specifically permitted by us and only in materials we approve beforehand."
  - "No alterations of our trademarks (changes to color, font, proportion, or otherwise) are permitted."
  - "You may not use our trademarks in a manner that implies Anthropic's sponsorship or endorsement."
- Inquiries and press: existing business partners contact marketing@anthropic.com.
- **Not found:** the page does not give rules on putting "Claude" in a product name, on the Claude logo for third-party apps, or on "Built with Claude" wording. Those rules were not located in primary sources in this pass.

### 4.2 Agent SDK branding guidance (the most specific rule found)

Source: [Agent SDK overview, Branding guidelines](https://code.claude.com/docs/en/agent-sdk/overview).
- For partners integrating the Agent SDK, Claude branding is optional. Allowed: "Claude Agent" (preferred for dropdown menus); "Claude", within a menu already labeled "Agents"; "{YourAgentName} Powered by Claude".
- Not permitted: "Claude Code" or "Claude Code Agent"; Claude Code-branded ASCII art or visual elements that mimic Claude Code.
- "Your product should maintain its own branding and not appear to be Claude Code or any Anthropic product."
- Scope: written for Agent SDK products. The rule is not stated as applying to a tool that only reads local Claude Code files. Treat it as the nearest official guidance, and apply it conservatively.
- Also in that doc: third-party developers may not offer claude.ai login or rate limits for products built on the Agent SDK ("Unless previously approved..."). A local recap tool that reads files should not ask users to sign in with claude.ai.

### 4.3 Clawdbot to Moltbot to OpenClaw

- The open-source agent project "Clawdbot" was asked by Anthropic to rename because of similarity to "Claude" in January 2026. It became Moltbot, then OpenClaw on January 30, 2026.
- Sources: [Laravel News](https://laravel-news.com/clawdbot-rebrands-to-moltbot-after-trademark-request-from-anthropic); [AOL / creator interview](https://www.aol.com/articles/clawdbot-creator-says-anthropic-forced-162839894.html); [Business Today](https://www.businesstoday.in/amp/technology/news/story/the-lobster-sheds-its-shell-for-the-third-time-as-clawdbot-becomes-openclaw-513650-2026-01-30).
- Accounts differ. One says Anthropic sent a polite email rather than lawyers. Another describes a "legal challenge". The creator said he was "forced" to rename. One report says Anthropic owns the trademark to the Clawd mascot image.
- Lesson: Anthropic enforces against names that sound like "Claude". A tool called "Claude-wrapped" is a closer name than "Clawdbot", so the risk is higher.

### 4.4 Spotify and "Wrapped"

- US registrations for WRAPPED to Spotify AB, per aggregator records (not USPTO TSDR; verify):
  - Reg. 5695235, registered 2019-03-12, Classes 38, 41, 42 ([markinton](https://markinton.com/trademark/wrapped-98114883) lists related serials; [trademarkdir](https://trademarkdir.com/trademark/wrapped-98975690)).
  - Reg. 7763897 (serial 98975690), registered April 2025, Classes 9 and 41, including downloadable music files.
  - Serial 98114883, filed August 3, 2023, Classes 16 and 25, pending.
- No EUIPO record found in search. An Australian record exists per search; details not checked.
- Whether Spotify has challenged other "wrapped" uses: **unverified**. Many open-source "wrapped" tools exist (cc-wrapped, claude-wrapped, code-wrapped, claude-code-wrapped, Year in Code), and none found mentions a challenge. Absence of a challenge is not a legal defense.
- Practical reading: "Wrapped" is registered for entertainment and music classes. A recap tool is not in those classes, but the word is still risky in a product name. Remotion's "Unwrapped" avoids it.

### 4.5 Usage terms and reading local logs

- Anthropic's [legal and compliance page](https://code.claude.com/docs/en/legal-and-compliance.md) covers commercial and consumer terms and the Usage Policy ([AUP](https://www.anthropic.com/aup)). No rule against reading local Claude Code files was found.
- The legal and compliance page does not cover third-party tool or local-file access (per search summary).
- Local transcripts are the user's own files. The docs say transcripts are plaintext and sensitive ([claude-directory](https://code.claude.com/docs/en/claude-directory)). A tool that uploads them would move sensitive data off the machine; keep the default local.
- Consumer terms for Free, Pro and Max users apply to a personal user. Not checked in full.

---

## 5. Card and share-image technology

Summary table, all for Node.js unless noted.

| Option | What it does | Deps and platform | Offline | Notes |
|---|---|---|---|---|
| [vercel/satori](https://github.com/vercel/satori) | HTML/CSS (JSX) to SVG | Node 16+; WASM layout bundled; needs at least one font (TTF, OTF, WOFF or WOFF2); MPL-2.0; 14.2k stars | Yes | Flexbox, Grid and block layout via Taffy. No `useState` or `useEffect`. Tables and `subgrid` throw. PNG needs a rasterizer. |
| [yisibl/resvg-js](https://github.com/yisibl/resvg-js) (`@resvg/resvg-js`) | SVG to PNG (Rust resvg via napi-rs) | Prebuilt binaries incl. Windows x64, arm64; macOS; Linux; Node 12 to 22 in matrix; MPL-2.0; about 2.0k stars | Yes, unless SVG links external images | PNG output; custom fonts via `fontFiles`, `fontBuffers` (wasm), `loadSystemFonts`. This is what cc-wrapped uses. |
| `@vercel/og` | Satori plus resvg for edge/Next.js | Built on satori and resvg | Usually | **Unverified** in this pass. |
| [bubkoo/html-to-image](https://github.com/bubkoo/html-to-image) | DOM node to PNG/SVG via canvas and foreignObject | `npm install --save html-to-image`; MIT; 7.3k stars | Yes (in browser) | Cross-origin images and tainted canvases fail. Safari can render blank on first pass (`stabilizationAttempts` helps). No IE. |
| [qq15725/modern-screenshot](https://github.com/qq15725/modern-screenshot) | DOM to PNG, SVG, JPEG, WebP, Blob | `npm i modern-screenshot`; MIT; 2.1k stars | Yes (in browser) | "Partial embedding will fail due to CORS." CSS counters not cloned. |
| [Playwright screenshots](https://playwright.dev/docs/screenshots) | Headless browser renders an HTML card, then `page.screenshot({ path })` or `locator.screenshot()`, `fullPage: true` | Needs a browser binary; size **unverified** | Yes | Best fidelity (real CSS). `device_scale_factor` not verified on the page; install command not verified on the page. |
| Canvas (node-canvas, `@napi-rs/canvas`) | Draw directly | Native build or prebuilt | Yes | Manual layout; no HTML/CSS. **Unverified** on Windows prebuilts in this pass. |
| [Remotion](https://www.remotion.dev/) | React to MP4 video | Heavier; Chromium render | Yes locally | Used by [GitHub Unwrapped 2023](https://github.com/remotion-dev/github-unwrapped-2023) (Vite 5, Remotion, AWS Lambda). Remotion's license terms for companies are **unverified** here; check before using commercially. |
| Terminal inline image | cc-wrapped prints PNG inline | Only in Ghostty, Kitty, iTerm2, WezTerm, Konsole | Yes | Others fall back to a saved file. |

Practical notes:
- Output sizes: 1080 x 1920 (9:16) for Instagram and TikTok stories, 1200 x 675 or 1200 x 630 for X and LinkedIn cards, 1080 x 1080 for square feed. Sizing is general knowledge; **unverified** against platform docs in this pass.
- Video: Remotion or a short ffmpeg pass over stat frames. No competitor found that outputs video.

### 5.1 Web Share API (files)

Source: [MDN Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
- Needs a secure context (HTTPS). Must follow a user gesture (transient activation).
- Feature-detect with `navigator.canShare({ files })` before calling `navigator.share({ files, title })`.
- Errors: `NotAllowedError` (permissions or no gesture), `AbortError` (user cancelled or no targets), `DataError`, `InvalidStateError`.
- Windows: the promise resolves when the share popup opens, not when delivery finishes. Android resolves after data is handed off.
- Browser and platform support table was not returned; check MDN compatibility table before relying on iOS or Windows. **Unverified** for iOS Safari and Windows Chrome file sharing.
- A local CLI cannot use Web Share directly. A local HTML page served from localhost is not an HTTPS origin; the card would need an HTTPS page (for example a static page that loads the PNG from disk via file input).

### 5.2 Instagram and desktop posting

Source: [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing) and the [IG User Media Publish reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish).
- Stories can only be published on business accounts (per search summary of the docs).
- Two-step flow: create a media container with `media_type` set to `STORIES` and a public `image_url`, then publish.
- The image must be reachable at a public URL. JPEG only, 8 MB maximum.
- Stickers (link, poll, location) not supported. Mentions without stickers are supported.
- Stories expire after 24 hours.
- Rate limit check: `content_publishing_limit`; general limit about 50 posts per 24 hours. Whether stories count is not stated.
- No desktop story-posting path found. The API is server-to-server with a user token; a desktop CLI would need a hosted image URL.
- Practical route: export a PNG, then either share through Web Share on a phone or post manually in the app. **Automated posting via the API needs a hosted URL and a business account.**

---

## 6. Skill distribution

### 6.1 Claude Code plugins and marketplaces (primary)

Source: [Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces).
- A marketplace is a directory or git repo with `.claude-plugin/marketplace.json`.
- Install flow the docs show:
  - `claude plugin marketplace add <owner>/<repo>` (or a URL, or a local path)
  - `claude plugin install <plugin-name>@<marketplace-name>`
  - Inside a session: `/plugin marketplace add ...` and `/plugin install ...`
  - Verify with `claude plugin list` and `claude plugin details <name>`.
- Plugin skills are prefixed by the plugin name, for example `/<plugin>:hello`.
- Sharing one plugin without a marketplace: send the directory or a zip (per the same doc, linking to [publish](https://code.claude.com/docs/en/plugins/publish.md)).
- Submission to Anthropic's directory is described at the same publish page (not fetched).

### 6.2 Plain skills (no plugin)

- A skill is a folder with `SKILL.md` under `~/.claude/skills/<name>/` (personal) or `.claude/skills/<name>/` (project). Source: [claude-directory](https://code.claude.com/docs/en/claude-directory).
- Skills are invoked with `/skill-name` or auto-matched to the task.

### 6.3 skills.sh and `npx skills`

- [skills.sh](https://skills.sh) describes itself as "The Open Agent Skills Ecosystem". Lists about 20 agents including Claude Code, Cursor, Codex, Copilot, Windsurf, Gemini, Cline, OpenCode, Zed and VS Code.
- Install command shown on the page (with a rendering error): `npx skills add <owner/repo>`. Example from coding-wrapped: `npx skills add senlindesign/coding-wrapped --skill coding-wrapped --agent claude-code --global`.
- Leaderboard with installs (e.g. find-skills at 4.6M; site total 1.57M). Counts are as shown on the page.
- A `find` subcommand was not documented on the page. Discovery is by the site search box. **`npx skills find` is unverified**; check the CLI help before using it in docs.

### 6.4 Recommended one-command install (design suggestion)

1. Publish the repo with `skills/<name>/SKILL.md` at the root, so `npx skills add <owner>/<repo> --skill <name> --agent claude-code` works.
2. Also publish a `.claude-plugin/marketplace.json` so `claude plugin marketplace add <owner>/<repo>` and `claude plugin install <name>@<marketplace>` work for users who prefer plugins.
3. The CLI (if any) is installed with `npx <name>` and needs no global install, as cc-wrapped and claude-recap do.

---

## Comparison table: direct competitors

Stars and activity are as captured. "Unverified" = not on a primary source in this pass.

| Tool | URL | Install | Stats shown | Output | Share features | Design | Stars / downloads | Last activity | What it misses |
|---|---|---|---|---|---|---|---|---|---|
| cc-wrapped (levifig) | [GitHub](https://github.com/levifig/cc-wrapped) | `npx cc-wrapped` | Sessions, messages, tokens, projects, streaks, heatmap, models, cost | Terminal + PNG (Satori/Resvg) | Clipboard copy; inline in 5 terminals | Spotify-style card, IBM Plex Mono | 0 stars; 18 commits | Not shown | No HTML; no persona; no story size; fork lineage unclear |
| claude-code-wrapped | [PyPI](https://pypi.org/project/claude-code-wrapped/) | `uvx` / `pip` / `npx` | Stats, contribution graph, personality | Terminal only | None | Animated reveal, movie credits | PyPI 0.1.11 (Dec 22, 2025) | About 11 months at research date | No image or file export |
| claude-wrapped (da-troll) | [GitHub](https://github.com/da-troll/claude-wrapped) | `uvx` / `npx` / `pip` / `brew` | Messages, tokens, cost estimate, streaks, personality, top projects | Terminal, HTML, Markdown, JSON | Timestamped exports | ASCII title, reveal, graph | 0 stars; 64 commits | Not shown | No PNG/video; top projects can leak names |
| code-wrapped (htin1) | [GitHub](https://github.com/htin1/code-wrapped) | `npm install && npm run build` | Not listed in README | File; SVG option | None | Demo image | 0 stars; 2 commits | Not shown | Needs org admin API key; not local |
| coding-wrapped (senlindesign) | [GitHub](https://github.com/senlindesign/coding-wrapped) | `npx skills add` / plugin | Active days, sessions, model mix, tools, streaks | Local web dashboard; export | Local export | Pixel-art, 4 insight cards | 9 stars; 42 commits | Not shown | Not an image; loopback dashboard |
| ccusage | [GitHub](https://github.com/ryoppippi/ccusage) | `npx ccusage@latest` | Tokens, cost, daily/monthly/session, blocks | Terminal tables, JSON | `--compact` for screenshots | Terminal | 19.6k stars; 944 forks | Not shown | No recap or card |
| claude-recap (buildingopen) | [GitHub](https://github.com/buildingopen/claude-code-stats) | `npx claude-recap` | Sessions, hours, projects, cost/ROI | Terminal, JSON | None | Terminal | 0 stars; 13 commits | Not shown | Says "Wrapped" in About; README says terminal numbers only |
| cc-session-stats (yurukusa) | [GitHub](https://github.com/yurukusa/cc-session-stats) | `npx cc-session-stats` | Session durations, hours, heatmap, streak, warnings | Terminal, JSON | None | Terminal | 2 stars; 37 commits | Not shown | Durations estimated; promotes paid products |
| vibestats (stephenleo) | [GitHub](https://github.com/stephenleo/vibestats) | curl / PowerShell / cargo | Heatmap, tokens, sessions, models | Profile SVG heatmap; web dashboard | Profile README | Heatmap | 2 stars | Not shown | Needs GitHub sync; not a recap |
| Claude Reflect (Anthropic) | [announcement](https://www.anthropic.com/news/reflect-with-claude) | Built into claude.ai Settings | Topics, task types, peak times, 4D fluency | In-app | None found | In-app | Not applicable | July 9, 2026 | Chat only; no Claude Code data |
| /insights (Claude Code) | [commands](https://code.claude.com/docs/en/commands) | Built in | Projects, usage, friction, suggestions | HTML at ~/.claude/usage-data/ | None | HTML report | Not applicable | Built in | Not a share card; 30-day retention |
| ChatGPT Your Year | [TechCrunch](https://techcrunch.com/2025/12/22/chatgpt-launches-a-year-end-review-like-spotify-wrapped/) | In-app | Message count, poem, pixel art, award | In-app image | Yes (in-app) | Playful | Not applicable | Dec 2025 | Limited countries; no local data |
| Year in Code | [Product Hunt](https://www.producthunt.com/products/year-in-code) | Web app | Wrapped report | Web | Save and share | Unverified | Unverified | Unverified | Not fetched |

---

## Gaps nobody fills

1. **Persona or trading-card output from Claude Code logs.** coding-wrapped has pixel art and claude-wrapped has a "personality type", but no collectible card with rarity, stats and a share PNG.
2. **Story-size and video output.** cc-wrapped gives one PNG in an unspecified size. No competitor found outputs 9:16 story images or a short video.
3. **Share-safe export.** Most tools show project names and paths. None found offers a "share" mode that strips project names, branch names, file paths and prompts before any image is made.
4. **Year-level archive past the 30-day cleanup.** Only vibestats keeps data past the cleanup, and it uses a GitHub sync. No local, private archive that a year-in-review can use. The tool should warn if `cleanupPeriodDays` is low and offer a one-time snapshot.
5. **One tool for Claude Code and claude.ai.** Reflect covers chat, Claude Code covers code, and export is manual. No tool merges the two. Local claude.ai export is possible from the Settings > Privacy export.
6. **Multi-agent coverage with a card.** ccusage covers about 20 CLIs but has no card; coding-wrapped covers Claude Code and Codex with a dashboard. Nothing produces one image across agents.
7. **Mobile share path documented.** No competitor documents Web Share API for an image from a local recap.
8. **Honest stats.** cc-session-stats and claude-recap both show estimated durations or costs with caveats; no card tool labels estimates on the image.
9. **Windows first.** cc-wrapped depends on terminal image support; Windows Terminal inline images were not listed. Only resvg-js confirmed Windows prebuilts. A Windows-tested card path is open.
10. **Name that is clearly third-party.** Most tools use "claude" in the name. The Agent SDK guide forbids "Claude Code" in names. A neutral name (for example "agent-wrapped") avoids the trademark risk.

---

## Sources

Anthropic and Claude Code (primary)
- [Commands reference](https://code.claude.com/docs/en/commands)
- [Manage costs (includes /insights and /usage detail)](https://code.claude.com/docs/en/costs)
- [Track team usage with analytics](https://code.claude.com/docs/en/analytics)
- [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory)
- [Create a marketplace (plugins)](https://code.claude.com/docs/en/plugin-marketplaces)
- [Agent SDK overview (branding guidelines)](https://code.claude.com/docs/en/agent-sdk/overview)
- [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance.md)
- [Anthropic Trademark Guidelines](https://www.anthropic.com/legal/trademark-guidelines)
- [Anthropic Usage Policy](https://www.anthropic.com/aup)
- [Introducing a way to reflect on how you use Claude (Reflect)](https://www.anthropic.com/news/reflect-with-claude)
- [Export your Claude data](https://support.claude.com/en/articles/9450526-export-your-claude-data)

Competitors and tools
- [levifig/cc-wrapped](https://github.com/levifig/cc-wrapped)
- [cc-wrapped on npm](https://www.npmjs.com/package/cc-wrapped)
- [claude-code-wrapped on PyPI](https://pypi.org/project/claude-code-wrapped/)
- [The-Money-Company-Limited/claudecodewrapped](https://github.com/The-Money-Company-Limited/claudecodewrapped)
- [da-troll/claude-wrapped](https://github.com/da-troll/claude-wrapped)
- [claude-wrapped on PyPI](https://pypi.org/project/claude-wrapped/)
- [@da-trollefsen/claude-wrapped on npm](https://www.npmjs.com/package/@da-trollefsen/claude-wrapped)
- [htin1/code-wrapped](https://github.com/htin1/code-wrapped)
- [senlindesign/coding-wrapped](https://github.com/senlindesign/coding-wrapped)
- [ryoppippi/ccusage](https://github.com/ryoppippi/ccusage)
- [buildingopen/claude-code-stats](https://github.com/buildingopen/claude-code-stats)
- [yurukusa/cc-session-stats](https://github.com/yurukusa/cc-session-stats)
- [stephenleo/vibestats](https://github.com/stephenleo/vibestats)
- [Year in Code on Product Hunt](https://www.producthunt.com/products/year-in-code)
- [remotion-dev/github-unwrapped-2023](https://github.com/remotion-dev/github-unwrapped-2023)
- [remotion-dev/github-unwrapped](https://github.com/remotion-dev/github-unwrapped)

Other AI tools
- [TechCrunch: ChatGPT year-end review](https://techcrunch.com/2025/12/22/chatgpt-launches-a-year-end-review-like-spotify-wrapped/)
- [MacRumors: ChatGPT year-end summary](https://www.macrumors.com/2025/12/22/chatgpt-year-end-summary-2025/)
- [Digital Trends: Claude Reflect](https://digitaltrends.com/computing/claude-reflect-is-here-its-your-usual-yearly-wrapped-but-with-anthropics-ai)
- [MacRumors: Anthropic Reflect](https://macrumors.com/2026/07/09/anthropic-reflect-claude-tracking)
- [Cursor developer habits report](https://cursor.com/insights/developer-habits)
- [Cursor forum: share your year in review](https://forum.cursor.com/t/share-your-year-in-review/147241)
- [GitHub Copilot usage metrics](https://docs.github.com/en/copilot/concepts/billing-and-usage/copilot-usage-metrics/copilot-metrics)
- [GitHub changelog: Copilot metrics GA](https://github.blog/changelog/2026-02-27-copilot-metrics-is-now-generally-available)

Data formats
- [tmai-core transcript parser (docs.rs)](https://docs.rs/tmai-core/1.2.0/src/tmai_core/transcript/parser.rs.html)
- [claude-code-transcripts README (docs.rs)](https://docs.rs/crate/claude-code-transcripts/0.1.3/source/README.md)
- [claude-code-transcripts CHANGELOG 0.1.9 (docs.rs)](https://docs.rs/crate/claude-code-transcripts/0.1.9/source/CHANGELOG.md)
- [entireio/cli transcript package (pkg.go.dev)](https://pkg.go.dev/github.com/entireio/cli@v0.5.4/cmd/entire/cli/transcript)

Legal and trademark (secondary)
- [Clawdbot rebrand to Moltbot (Laravel News)](https://laravel-news.com/clawdbot-rebrands-to-moltbot-after-trademark-request-from-anthropic)
- [Clawdbot creator on the rename (AOL)](https://www.aol.com/articles/clawdbot-creator-says-anthropic-forced-162839894.html)
- [Clawdbot to OpenClaw (Business Today)](https://www.businesstoday.in/amp/technology/news/story/the-lobster-sheds-its-shell-for-the-third-time-as-clawdbot-becomes-openclaw-513650-2026-01-30)
- [WRAPPED trademark record, markinton](https://markinton.com/trademark/wrapped-98114883)
- [WRAPPED trademark record, trademarkdir](https://trademarkdir.com/trademark/wrapped-98975690)

Share-card tech
- [vercel/satori](https://github.com/vercel/satori)
- [yisibl/resvg-js](https://github.com/yisibl/resvg-js)
- [bubkoo/html-to-image](https://github.com/bubkoo/html-to-image)
- [qq15725/modern-screenshot](https://github.com/qq15725/modern-screenshot)
- [Playwright: screenshots](https://playwright.dev/docs/screenshots)
- [Remotion](https://www.remotion.dev/)
- [MDN: Navigator.share()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing)
- [Instagram IG User Media Publish](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish)

Skill distribution
- [skills.sh](https://skills.sh)
- [Create a marketplace (Claude Code plugins)](https://code.claude.com/docs/en/plugin-marketplaces)
