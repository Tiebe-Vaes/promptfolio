# Promptfolio: shareable AI-coding stats research

Date: 2026-11-27
Scope: which Claude Code / AI-coding usage numbers people share, which they distrust, how share screens are laid out, token framing, and a ranked list of 20 Promptfolio stats with data sources.

Evidence labels used below:
- **Verified**: read on a fetched page, or counted in local files on this machine.
- **Search snippet**: seen only in a search result summary, page not opened.
- **Unverified**: secondary source or claim I could not confirm.

Limits of this pass: no Reddit pages were retrievable (the search tool refused reddit.com as a domain). X posts were seen only as search snippets. Spotify Wrapped, GitHub Unwrapped and WakaTime year-in-review were not fetched in this pass. The Cursor 2025 page (cursor.com/2025) itself was not fetched; its stats were read from a forum thread.

---

## TL;DR

- People share scale numbers first: total tokens or messages, sessions, streak length, hours, and the single longest session. [Cursor forum thread](https://forum.cursor.com/t/view-your-year-2025-in-cursor/146960), [Codex Wrapped post](https://x.com/yetone/status/2005544057699959142), [cc-wrapped](https://github.com/levifig/cc-wrapped).
- Dollar figures are shared as "API-equivalent" cost against a flat subscription. That is the joke and the hook, but it is an estimate, not a bill. [Anthropic cost docs](https://code.claude.com/docs/en/costs?ref=t01.li) (search snippet), [ccusage guide](https://raw.githubusercontent.com/ryoppippi/ccusage/main/docs/guide/index.md).
- Summed token totals are dominated by cache reads. On this machine, cache tokens are 99.6% of all tokens and output is 0.39% (verified locally, see section 4). A plain total is therefore misleading as a "work" measure.
- Cache-inflated totals are the most-cited complaint. People report that "total" counters re-add cached tokens on every request. [ccstatusline issue](https://claudeissues.com/issue/64827-ccstatusline-total-counter-is-misleading-inflates-by-re-adding-cached-tokens-eve) (search snippet).
- Percentile claims such as "Top 1%" appear in Cursor's year stats. The method is not published, so these should not be used without a stated basis. The Cursor stats were read from a forum thread, not the page itself.
- Layouts that work: a short sequence of slides (CC Wrapped uses 7 animated slides), or a single card with one hero number plus a contribution heatmap (cc-wrapped, Claude Code Wrapped). Cursor's report is a chaptered story with one chart per chapter.
- Personality layers are common: 8 archetypes appear in at least two tools (Night Owl, Weekend Warrior, Streak Master and similar). Users like them, and they are cheap to compute from timestamps.
- Local Claude Code data supports most of the 20 stats. Verified fields: daily message, session and tool-call counts; per-model input, output and cache tokens; hour-of-day counts; session titles; denial kinds; effort levels; compaction and API-error events; file extensions edited.
- Warning from local data: the cached `costUSD` field is 0 for every model, and `stats-cache.json` was last computed 2026-11-11. Compute from transcripts, and price tokens yourself.
- Best token framing for sharing: lead with output tokens ("tokens of code and text Claude wrote for you") and mention the cache share as an honest footnote, not as the headline.

---

## 1. Numbers people brag about or joke about

Sources for what is shared (all search snippets or fetched pages as labelled):

| Number | Who shows it | Example | Evidence |
|---|---|---|---|
| Total tokens | Cursor Year in Code, Codex Wrapped, claude-wrapped | "3.21B tokens" (Cursor user post); "2,774,280,794 total tokens" (Codex Wrapped post) | Forum thread: verified. Codex post: [X, snippet](https://x.com/yetone/status/2005544057699959142) |
| Messages | claude-wrapped, Codex Wrapped | "71,108 messages, 263 sessions, 2.9B tokens, 40-day best streak" (example output) | [claude-wrapped on PyPI](https://pypi.org/project/claude-wrapped/), search snippet, unverified |
| Sessions | cc-wrapped, CC Wrapped | "3,446 sessions, about 73 per active day" | [dev.to post](https://dev.to/yurukusa/i-built-spotify-wrapped-for-claude-code-heres-what-3400-sessions-look-like-21e2): verified |
| Hours coded | CC Wrapped, ccwrapped.com | "109 hours" total; "Busiest day: Friday, 20.5 hours" | dev.to post: verified. ccwrapped: [X snippet](https://x.com/ccwrapped?lang=en) |
| Streak | Cursor, cc-wrapped, claude-wrapped | "316 days in" (Cursor user); "35 days" (CC Wrapped); "40-day best streak" | Forum and dev.to: verified |
| Longest session | CC Wrapped | "8.5 hours, on the cc-loop project" | dev.to post: verified |
| Lines of code / commits | Cursor (agent edits), Cyril's Wrapped post | "59,699 lines of agent edits last month" (forum title); "610 talks, 100 commits, 11 projects" | Forum related topic: snippet. [X post](https://x.com/SlamingDev/status/1998442056394404083): snippet |
| Models used | Cursor "cursor-2025-models" screenshot, Year in Code "top models" | Screenshot contents not visible | Year in Code page: verified text only |
| Cost vs subscription | ccusage community, Year in Code, LinkedIn posts | "$3,847 at API prices against a $200 plan" (LinkedIn post) | Search snippet, unverified |
| "Claude wrote X% of my code" | Not found in this pass | None retrieved | Gap |
| Rate limits hit | Not found as a share format in this pass | None retrieved | Gap |
| 3am / after-midnight coding | claude-wrapped, CC Wrapped | "You coded after midnight 47 times" (claude-wrapped example); "Night Owl" archetype | [claude-wrapped repo page](https://github.com/da-troll/claude-wrapped): verified |
| Percentile rank | Cursor Year in Code | "Top 16%", "Top 2%", "Top 1%" (user posts) | Forum thread: verified as quoted by users. Method not published |
| Comparisons | CC Wrapped fun facts | "54 movies and 145 cups of coffee" (one cup per 45 minutes) | dev.to post: verified |

Engagement visible: the Year in Code Product Hunt page shows 9 upvotes and 31 followers, with 2 maker comments visible. The Cursor forum thread's own reply and like counts were not visible. Unverified: none of the sources showed reliable reshare or like counts for individual share cards, so I cannot rank which numbers get the most engagement.

What people joke about: "316 days in", "Top 1%", "5.8k agents", "34 tabs" (Cursor forum replies, verified as quoted). Joke replies to Cursor's stats asked whether the "frustration" stats were missing, which shows people expect a negative stat as well.

---

## 2. Numbers people found boring, confusing, or untrustworthy

1. **Cache tokens inflating totals (most cited).** Summed totals include cache reads, which are re-counted on each request. A ccstatusline issue says its total "inflates by re-adding cached tokens every request" ([claudeissues, snippet](https://claudeissues.com/issue/64827-ccstatusline-total-counter-is-misleading-inflates-by-re-adding-cached-tokens-eve)). A Cursor forum thread asks why cache reads are "absurd" ([forum, snippet](https://forum.cursor.com/t/why-does-cursor-consume-an-absurd-amount-of-cache-read-tokens/151439)).
2. **Headline API-equivalent dollars.** A $400/month plan user reportedly saw $18,450 at API-equivalent prices, mostly from cache reads ([aiweekly, unverified, secondary](https://aiweekly.co/node/1897)). Critics say headline figures overstate what a subscriber pays. Anthropic's docs say subscription usage is included in the plan ([cost docs, snippet](https://code.claude.com/docs/en/costs?ref=t01.li)).
3. **Cache read pricing depends on the tool.** A search summary says cache reads are priced at 0.1x base input, and a Cursor forum post says they are billed at a small fraction of input rate (both search snippets, unverified; no page opened). Whether a given tool applies the right rate is not checked here.
4. **Percentile claims.** "Top 1%" from Cursor has no published method in the thread I read. Treat as unverified marketing unless Promptfolio states its population.
5. **Counts that read as "work".** Tool calls and message counts measure activity, not output. Cursor's own report uses "Mean Tool Calls per Session" and "Lines added per dev per week" as separate charts, so the audience is used to them ([cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits), verified).
6. **Stale or broken fields on this machine (verified locally):**
   - `stats-cache.json` `costUSD` is 0 for every model. Do not show it.
   - `stats-cache.json` `lastComputedDate` is 2026-11-11, 16 days before today. It lags the transcripts.
   - `longestSession.duration` is 4,939,032,021. If that is milliseconds, it is about 57 days, which is implausible for one session. It probably includes idle time. Do not show it without checking the unit.
   - `firstSessionDate` is 2026-04-21, so a calendar-year recap for 2026 covers only part of the year for this machine.

---

## 3. How real share screens are laid out

**Slide sequence vs dashboard.**
- CC Wrapped: 7 animated slides (total hours, sessions and days; hours by day of week; personality type; top projects; records such as streak and longest session; fun facts; shareable card). [dev.to post](https://dev.to/yurukusa/i-built-spotify-wrapped-for-claude-code-heres-what-3400-sessions-look-like-21e2): verified.
- Cursor developer habits: a numbered sequence of chapters, each with a headline takeaway, one chart, and a small data table. Described by the page as a slide-style story, not a dashboard. [cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits): verified.
- cc-wrapped and claude-wrapped: a single shareable card or terminal summary, with a GitHub-style activity heatmap and a headline stat block. [cc-wrapped](https://github.com/levifig/cc-wrapped), [claude-wrapped](https://github.com/da-troll/claude-wrapped): verified.
- Year in Code: a gallery of six images, with "Save/Share on socials". The page does not describe its slide layout in text. [Product Hunt](https://www.producthunt.com/products/year-in-code): verified text only.

**Which stat leads.** Hours or tokens lead in most shares. The first slide or card line is a total. Personality or archetype comes after the totals, often on its own slide.

**Token format.**
- Abbreviated with suffix: "3.21B tokens", "2.9B tokens", "12.19B tokens" (Cursor, claude-wrapped). Counts use K for thousands ("3.6K") and B for billions. [cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits): verified.
- Full comma-grouped: "2,774,280,794 total tokens" (Codex Wrapped). [X post, snippet](https://x.com/yetone/status/2005544057699959142).
- Not found: an exact share of "17.7B" next to "17,705,506,513" in the same card.

**Comparisons.** Fun facts convert hours or sessions into everyday units ("54 movies", "145 cups of coffee"). [dev.to post](https://dev.to/yurukusa/i-built-spotify-wrapped-for-claude-code-heres-what-3400-sessions-look-like-21e2): verified. "That's N novels" was not seen in any fetched share screen; treat as unverified for this audience.

**Personality layer.** claude-wrapped has eight archetypes: Night Owl, Streak Master, Terminal Warrior, The Refactorer, Empire Builder, Weekend Warrior, Perfectionist, Dedicated Dev. [claude-wrapped repo](https://github.com/da-troll/claude-wrapped): verified. CC Wrapped has eight types too, including "All In" and "Marathon Runner" ([dev.to post](https://dev.to/yurukusa/i-built-spotify-wrapped-for-claude-code-heres-what-3400-sessions-look-like-21e2)).

**Footers and branding.**
- cc-wrapped credits ccusage and opencode-wrapped, and links a personal follow handle ([cc-wrapped](https://github.com/levifig/cc-wrapped)). Do not copy the handle; it is a third party's.
- Cursor footer: product name, copyright line, security certification badges, language selector ([cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits)).
- Year in Code: a privacy line "Everything is processed in your browser" ([Product Hunt](https://www.producthunt.com/products/year-in-code)). Local-only processing is a selling point for Promptfolio too.

**Aspect ratios.** Not checked in this pass. Assumption for Promptfolio: 9:16 for story slides, 1:1 or 1.91:1 for a card. Mark as unverified until a real share image is measured.

---

## 4. Tokens: input, output, cache

**Do people separate them?** Some do. The ccusage tool tracks cache creation and cache read tokens separately from input and output ([ccusage npm](https://npmjs.com/package/ccusage): verified). The Cursor report shows input/output ratio and token share breakdowns, not absolute totals ([cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits): verified). Most community share cards show one total, which is the misleading part.

**What the logs contain (verified locally).** Each assistant record carries `usage` with `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, plus `cache_creation`, `output_tokens_details`, `server_tool_use`, `service_tier`, `speed`, `iterations`. Output tokens include a breakdown key that may hold thinking tokens (not verified in detail).

**This machine, all models (from `stats-cache.json` `modelUsage`, verified):**

| Token type | Count | Share of all-in |
|---|---|---|
| Input (new) | 1,442,998 | 0.01% |
| Output | 47,924,482 | 0.39% |
| Cache read | 11,951,960,450 | 97.4% |
| Cache creation | 274,120,743 | 2.2% |
| All-in total | 12,275,448,673 | 100% |

Cache (read + creation) is 99.6% of the all-in total. Output is 47.9M.

Across ten model IDs, the logs show `claude-opus-5-5` (27.3M output), `claude-haiku-5-5` (3.1M output), `claude-sonnet-5` (1.8M output) and older 4.x IDs. These are raw names from the logs; I did not verify the naming scheme against Anthropic's model list.

**Which framing is most shareable?**
- Lead with output: "47.9M tokens of code and text Claude wrote for me". Rough word equivalent is about 36M words at 0.75 words per token. Conversion is an estimate, unverified for this context.
- Put the cache share as a footnote, not the headline: "Most of the volume was context re-read from cache, so the real output is 47.9M."
- Avoid "12.3B tokens" as a headline on its own. It is the number most likely to be read as inflated.

**What ccusage and Cursor show.** ccusage reports daily, weekly, monthly, and session views with cache tokens separate, and estimated cost computed from token counts and model pricing ([ccusage guide](https://raw.githubusercontent.com/ryoppippi/ccusage/main/docs/guide/index.md): verified; column names not confirmed). Cursor shows abbreviated counts and token shares ([cursor.com/insights/developer-habits](https://cursor.com/insights/developer-habits): verified).

---

## 5. Ranked list of 20 stats for Promptfolio

Ranking is by expected share appeal, then by how safely it can be computed from local data. Data availability is verified against the local files unless marked.

Local sources used:
- `C:/Users/tiebe/.claude/stats-cache.json`: `dailyActivity` (date, messageCount, sessionCount, toolCallCount), `dailyModelTokens`, `modelUsage` (per model input, output, cache read, cache creation), `totalSessions`, `totalMessages`, `longestSession`, `firstSessionDate`, `hourCounts`.
- `C:/Users/tiebe/.claude/history.jsonl`: 1,681 lines, each with `display` (prompt text), `timestamp`, `project`, `sessionId`. Prompt text is private; compute counts only.
- `C:/Users/tiebe/.claude/projects/*/*.jsonl`: 171 session transcript files across 44 project folders. Record types include user, assistant, system, attachment, mode, custom-title, ai-title, pr-link, agent-name, api-request, turn_duration, compact_boundary, api_error, stop_hook_summary, model_refusal_fallback. Tool-use blocks carry tool name and input (file path, Bash command). Usage per assistant record (see section 4).

Notes on counts below: "approx" means a regex or string match, not a verified count.

1. **Sessions.** Share appeal: scale, easy to read. Data: `totalSessions` (319 in cache), and transcript count (171 files; the cache counts sessions differently). Wording: "319 sessions. 319 times you opened a conversation with Claude."
2. **Longest streak and current streak.** Appeal: high (streaks are the most-shared stat in every tool). Data: from `dailyActivity` dates. Wording: "Longest streak: N days."
3. **Hours coded.** Appeal: high, and comparable to Spotify minutes. Data: per session, last timestamp minus first; cap idle gaps (for example, ignore gaps over 30 min). Not verified in this pass. Wording: "N hours at the keyboard. That is N movies."
4. **Messages.** Appeal: medium. Data: `totalMessages` (98,085). Wording: "98,085 messages. Most of them were 'yes, do that'."
5. **Output tokens ("code and text Claude wrote for you").** Appeal: high, and honest. Data: sum of `output_tokens` (47.9M). Wording: "47.9M tokens of code and text, written for you."
6. **Cache share, as a footnote.** Appeal: low as headline, high as honest context. Data: cache read and creation totals (99.6%). Wording: "Most of the volume was context re-read from cache."
7. **API-equivalent cost (estimate).** Appeal: high, always a conversation starter. Data: `costUSD` is 0 locally, so price tokens yourself with a rate table by model and token type. Label it "estimated at list API prices". Wording: "About $X at API prices. You paid $Y."
8. **Top models used.** Appeal: medium. Data: `modelUsage` keys, ranked by output. Wording: "Your go-to model: claude-opus-5-5 (57% of output)." Compute percentages in code; the 57% figure is not verified.
9. **Hour of peak use.** Appeal: high (identity). Data: `hourCounts` (peak 16:00 with 63 counts locally). Wording: "Your peak hour: 4pm."
10. **Night owl score.** Appeal: high (identity). Data: transcript timestamps, count sessions starting after midnight. Wording: "Coded after midnight N times."
11. **Longest session by messages.** Appeal: high. Data: `longestSession.messageCount` (476). Avoid `duration` until the unit is checked. Wording: "Longest session: 476 messages in one sitting."
12. **Files touched and languages.** Appeal: high for developers. Data: unique `file_path` from Edit and Write tool inputs (1,673 unique files); extension counts (.tsx 1,665; .md 1,549; .ts 1,389; .java 717; .py 572). Wording: "1,673 files touched. Your stack: TypeScript and Markdown." Note: `.md` leads only when docs are counted; say so.
13. **Lines written (estimate).** Appeal: medium, often mocked. Data: count new lines in Write content and Edit new_string minus old_string. Not computed in this pass. Wording: "About N lines changed." Use only with a caveat.
14. **Commits made (approx).** Appeal: high. Data: Bash commands containing `git commit` (approx 1,024). Better: count tool results that show a commit hash. Not verified. Wording: "N commits, with Claude at the keyboard."
15. **Test runs (approx).** Appeal: medium. Data: Bash commands matching test runners (approx 1,650). Count pass and fail from results for accuracy. Wording: "N test runs. M went green on the first try." (Only if pass or fail is parsed.)
16. **Denied actions.** Appeal: high, funny. Data: `toolDenialKind` counts: user-rejected 22, interrupted 13, cancelled 11, automode-blocked 26, automode-unavailable 31, permission-rule 6. Wording: "You said no 22 times. Claude listened 22 times."
17. **Questions Claude asked you.** Appeal: medium. Data: AskUserQuestion tool calls (320). Wording: "Claude asked you 320 questions. You answered most of them."
18. **Effort setting.** Appeal: medium, fun identity. Data: `effort` on records: medium 35,545, high 12,799, low 406, xhigh 74. Wording: "You ran at medium effort 3 out of 4 times."
19. **Compactions and API errors (a "pain" stat).** Appeal: medium, funny. Data: system subtypes compact_boundary (13), api_error (135). Wording: "Context compacted 13 times. 135 API errors. Still shipping."
20. **Prompts typed and first day.** Appeal: medium. Data: `history.jsonl` line count (1,681) and `firstSessionDate` (2026-04-21). Wording: "1,681 prompts since April 21." Keep prompt text out of the card.

Extra candidates not in the 20 (cut for space): permission mode mix (auto 2,685 records, bypassPermissions 109, plan 12); PR links (pr-link records 331); agents spawned (agent-name records 9,165); browser tool calls (817 batch calls); session titles (most common ai-title; privacy risk, skip by default).

**Privacy rules for Promptfolio** (recommended, not verified against any tool): never print prompt text or file names from private projects; show project names only when the user opts in; compute on the device.

---

## Sources

Web:
- [levifig/cc-wrapped (GitHub)](https://github.com/levifig/cc-wrapped), fetched
- [da-troll/claude-wrapped (GitHub)](https://github.com/da-troll/claude-wrapped), fetched
- [claude-wrapped on PyPI](https://pypi.org/project/claude-wrapped/), search snippet
- [Cursor forum: View your year 2025 in Cursor](https://forum.cursor.com/t/view-your-year-2025-in-cursor/146960), fetched
- [Cursor forum: Ridiculously high token usage](https://forum.cursor.com/t/ridiculously-high-token-usage/167079), search snippet
- [Cursor forum: Why does Cursor consume an absurd amount of cache read tokens?](https://forum.cursor.com/t/why-does-cursor-consume-an-absurd-amount-of-cache-read-tokens/151439), search snippet
- [Cursor developer habits report](https://cursor.com/insights/developer-habits), fetched
- [ccusage on npm](https://npmjs.com/package/ccusage), search snippet
- [ccusage guide (raw markdown)](https://raw.githubusercontent.com/ryoppippi/ccusage/main/docs/guide/index.md), fetched
- [CC Wrapped: 3,400 sessions (dev.to)](https://dev.to/yurukusa/i-built-spotify-wrapped-for-claude-code-heres-what-3400-sessions-look-like-21e2), fetched
- [Year in Code (Product Hunt)](https://www.producthunt.com/products/year-in-code), fetched
- [Codex Wrapped post (X)](https://x.com/yetone/status/2005544057699959142), search snippet
- [Claude Code Wrapped 2025 post (X, Cyril)](https://x.com/SlamingDev/status/1998442056394404083), search snippet
- [Claude Code Wrapped 2025 post (X, Mattia)](https://x.com/mattiapomelli/status/2003194210942583165), search snippet
- [ccwrapped account (X)](https://x.com/ccwrapped?lang=en), search snippet
- [ccstatusline total counter issue](https://claudeissues.com/issue/64827-ccstatusline-total-counter-is-misleading-inflates-by-re-adding-cached-tokens-eve), search snippet
- [aiweekly: Claude Code user burns $18K on $400 plan](https://aiweekly.co/node/1897), search snippet, secondary, unverified
- [WebProNews: Claude Code hidden cost problem](https://www.webpronews.com/claude-codes-hidden-cost-problem-developers-sound-the-alarm-on-anthropics-ai-coding-agent-billing-practices/), search snippet, secondary
- [Anthropic Claude Code costs](https://code.claude.com/docs/en/costs?ref=t01.li), search snippet
- [Claude Code /insights guide (Prosper Substack)](https://prosperinai.substack.com/p/claude-code-insights-command), search snippet, unverified (announcement date from secondary sources)
- [Claude Code /stats write-up (Vincent Qiao)](https://blog.vincentqiao.com/en/posts/claude-code-stats/), search snippet
- [Claude Code /stats contribution graph (dev.to)](https://dev.to/rajeshroyal/stats-your-claude-code-contribution-graph-4hle), search snippet, unverified (the "--export png" flag is not confirmed)
- [stats-cache reference (Mintlify)](https://www.mintlify.com/1shanpanta/claude-analytics/reference/data-sources/stats-cache), search snippet

Local (verified, this machine):
- `C:/Users/tiebe/.claude/stats-cache.json` (version 5, lastComputedDate 2026-11-11)
- `C:/Users/tiebe/.claude/history.jsonl` (1,681 lines)
- `C:/Users/tiebe/.claude/projects/*/*.jsonl` (171 files, 44 project folders)

Not checked in this pass: Spotify Wrapped, GitHub Unwrapped, WakaTime year in review, Reddit (blocked as a search domain), Hacker News threads, LinkedIn posts, and actual share-image dimensions.
