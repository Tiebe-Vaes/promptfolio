# Promptfolio: feature ideas for loved and shared recaps (v0.2 and later)

Date: 2026-11-27. Scope: new feature candidates only. Findings already in `2026-11-26-*.md` and `2026-11-27-shareable-stats.md` (formats, stat list, token framing, trademark, distribution) are not repeated here. The formats already decided for v0.2 (token pair, receipt, terminal, trading card, growth closer, heatmap) are not counted as candidates.

## TL;DR

- The strongest sharing driver in this category is a label or character a person can post: Spotify Clubs, YouTube personality types, Uber YOUBER, Duolingo's shareable final card. Promptfolio already has the persona and trading card, so new work should add more reasons to share, not more charts.
- Personal records, streaks and a "first prompt" origin moment are cheap to compute and fit the local data. They also give people a reason to post a second card.
- Friend comparison is the most asked-for social feature (leaderboard requests, ccclub's friend codes). It can be done without any upload: two local JSON files compared on one card.
- Three things drive backlash: stats that are wrong, shame or age-style labels with no basis, and paywalls or forced uploads. Spotify's 2024 edition and Listening Age reactions show the first two; Strava shows the third.
- The biggest product risk is not a missing feature. Transcripts are deleted after 30 days, so an opt-in monthly archive is the feature that makes next year's recap possible. It is the only top-5 item that needs a settings decision.
- Recommended v0.2 top 5: personal records and streak flames, model loyalty, first-prompt origin card, CLI flags (`--year`, `--json`, `--no-names`), and an opt-in monthly archive snapshot.

## Caveat on local data (affects every data-source claim below)

The research notes record that on the author's machine `stats-cache.json` was last computed 2026-11-11, and that `costUSD` is 0 for every model (`2026-11-27-shareable-stats.md`, section 4 and the TL;DR of the indirect-competitors doc). So any feature that uses `stats-cache.json` for days after 2026-11-11 will be short. Year-wide daily counts should come from `history.jsonl` (one line per prompt with a timestamp), which was current on the author's machine. Detailed numbers come from the last-30-day transcripts. Field names are from the recap spec and the research notes, not from docs, and must be checked against real files before coding.

## Ranked candidates (20)

Effort: S = under a day, one script module plus one template change; M = a few days, new template or new data path; L = a week or more, or new infrastructure. Privacy risk is about what leaves the machine or what could leak into a shared image. "Version" is the recommendation.

| # | Feature | What it is | Evidence that it drives sharing or delight | Effort | Privacy risk | Version |
|---|---|---|---|---|---|---|
| 1 | Personal records | Longest session, busiest day, longest streak, most tool calls in one day, each with its date | Duolingo's shareable final card shows streak and XP ([Android Authority](https://www.androidauthority.com/duolingo-year-in-review-2025-3621782)). Spotify and Steam show personal bests next to averages ([Steam Replay coverage](https://www.engadget.com/gaming/pc/steam-replay-2025-is-here-to-recap-your-pc-gaming-habits-205430951.html)) | S | Low (dates and counts only) | v0.2 |
| 2 | Streak flames | Current and longest streak shown as a flame tier (for example 7, 30, 100 days), with a "still burning" line if active this week | Duolingo's streak milestones and friend streaks are a core loop ([Duolingo product highlights](https://blog.duolingo.com/product-highlights/), search snippet). Cc-wrapped-style tools lead with streak length ([shareable-stats research, TL;DR](2026-11-27-shareable-stats.md)) | S | Low | v0.2 (with 1) |
| 3 | Model loyalty | Share of prompts or tokens per model, a "loyalty" label, and a model timeline by month | Users post their model mix; cheap to compute. Not verified as a shared-format trend (no source found) | S | Low | v0.2 |
| 4 | First-prompt origin card | The first day you used Claude Code this year and how many prompts that first day had. Shows the date only, never the prompt text | Spotify's Listening Age and origin-style framing were widely posted, even when disliked ([Fast Company](https://www.fastcompany.com/91454685/spotify-wrapped-2025-eagerly-checking-your-listening-age-everyone-else-is-too), [NPR](https://www.npr.org/2025/12/04/nx-s1-5632595/spotify-wrapped-listening-age)). Origin framing itself is an inference | S | Low (date and count). Prompt text must never be shown, per spec | v0.2 |
| 5 | CLI flags: `--year`, `--json`, `--no-names`, `--vibe`, `--lang`, `--out` | Flags for scripting and for re-running with another year or vibe | cc-wrapped has `--year` and writes a PNG and copies it to the clipboard ([cc-wrapped README](https://github.com/levifig/cc-wrapped)). A Claude Code feature request asks for JSON output and PNG export of stats, opened 2026-06-12 with no comments at the time of the search (search snippet only, claudeissues.com not reachable from the fetch tool) | S | Low; `--no-names` is the privacy control | v0.2 |
| 6 | Opt-in monthly archive snapshot | Each month the user can save a snapshot (stats, records, monthly line) to a folder, so next December has data older than 30 days | Directly addresses the 30-day cleanup in the spec. Claude Code's own `cleanupPeriodDays` is the only other lever ([claude-directory docs](https://code.claude.com/docs/en/claude-directory), via the existing research). Vibestats syncs daily stats to a private repo for the same reason ([docs.rs vibestats](https://docs.rs/crate/vibestats/2.4.3)) | M | Medium: writes new files; needs an explicit yes and stays local | v0.2 (recommended) |
| 7 | Compare with a friend (local JSON import) | Each person runs `--json`, sends the file, and the other runs `promptfolio compare a.json b.json` to get a side-by-side card. Nothing is uploaded by the tool | Friend and group comparison is requested and built: ccclub uses 6-letter group codes ([ccclub](https://ccclub.dev/claude-code-leaderboards)); an opt-in leaderboard request exists (search snippet, claudeissues 23245, two comments). Local-file version avoids the upload that makes those tools a privacy question | M | Medium: a shared file can carry paths and project names; compare must read only the redacted JSON | v0.3 |
| 8 | Animated GIF or MP4 story | Recorded frames of the tap-through story as a short clip | Video is listed as v2 in the spec. Remotion's GitHub Unwrapped is a video product ([Remotion GitHub Unwrapped 2023](https://github.com/remotion-dev/github-unwrapped-2023)). Video reach not measured for this niche | M to L (needs headless frame capture and an encoder; ffmpeg would break zero-dependency) | Low | v0.3 or later |
| 9 | Dark and light variants | Each card rendered in both themes from one token set | Cards read as two designs without extra templates. The research notes ask for dark and light share cards with big numbers (`2026-11-27-ai-design-tells.md`) | S (if colours are tokens) | Low | v0.2 |
| 10 | Language and locale beyond EN and NL | More languages for the copy and number formats (decimal and thousands separators) | Reddit's recap was localised per language ([Reddit 2022, TechCrunch](https://techcrunch.com/2022/12/08/reddits-end-of-year-recap-experience-rolls-out-with-personalized-shareable-cards)). Duolingo localises its Year in Review (not verified in this pass) | M (translation quality is the real cost) | Low | v0.3 |
| 11 | Monthly mini-recaps | One card per month (busiest day, sessions, a one-line headline), posted through the year | Spotify and Duolingo use repeated touchpoints; monthly recap formats are common but no engagement figure was found (unverified) | M (needs item 6 for old months) | Low | v0.3 (after 6) |
| 12 | Achievements and badges | A short list of unlocks (for example "100 sessions", "first week with 5 projects") shown on the card | Duolingo gives a themed Leaderboard badge to people who share results ([Android Authority](https://www.androidauthority.com/duolingo-year-in-review-2025-3621782)). Badges are the core of Discord's and Steam's recaps (existing research) | M (threshold tuning) | Low | v0.3 |
| 13 | "What you built" from git | List of repos or commit subjects from the year, with counts | GitHub Unwrapped-style tools exist and are shared among developers: GitHub Compiled 2025, GitHub Wrapped 2025, Wrap by SaaSBillboards ([Product Hunt](https://www.producthunt.com/products/github-compiled-2025), [Wrap](https://www.producthunt.com/products/wrap-by-saasbillboards)). Names show well, which is the risk | M | High: reads project names and commit text. Off by default, and project names must follow the "Hide all" setting | Later |
| 14 | Percentile rank ("top X%") | Ranks the user against other users | Cursor and WakaTime publish top-percent claims ([WakaTime sample page](https://wakatime.com/a-look-back-at-2025/1a7b5f29-2708-4091-928e-dc636095ae43/ifthratogo), search snippet; [Cursor forum](https://forum.cursor.com/t/view-your-year-2025-in-cursor/146960)). Method not published. Spec anti-goal forbids invented percentiles | L (needs a public baseline, which does not exist) | High (needs a dataset of other users) | Not planned |
| 15 | Opt-in public leaderboard | Public ranking by tokens, sessions or cost | Viberank, ccgather, tokenleaders and clawd.gg exist ([ccclub comparison page](https://ccclub.dev/claude-code-leaderboards)). Uploads of usage numbers to a public board ask a lot of trust | L (hosting, accounts, abuse handling) | High | Not planned |
| 16 | Hosted share link | A public URL for each recap | Strava paywall and hosted share cases show that users save images rather than click links ([Strava support](https://support.strava.com/en-us/articles/15401959-your-year-in-sport)). Spec non-goal | L | High | Not planned |
| 17 | Copy PNG to clipboard | `--copy` puts the card image on the clipboard after render | cc-wrapped does this ([cc-wrapped README](https://github.com/levifig/cc-wrapped)). Friction removal before posting | S (Windows: PowerShell `Set-Clipboard`; macOS: `osascript`; Linux: `xclip` if present) | Low | v0.2 (after CLI flags) |
| 18 | Caption generator | A ready-to-paste caption line under each card for LinkedIn, X or Discord, with the exact numbers from `stats.json` | Shares are most often screenshots with a caption (existing research); a caption cuts the "what do I write" step. Not measured | S | Low, if captions use only the validator-approved copy | v0.2 |
| 19 | Pseudonym option | Replace the user's name with "Redditor", a generic label, or a chosen handle | Reddit 2022 let users swap the username for a generic "Redditor" label ([TechCrunch 2022](https://techcrunch.com/2022/12/08/reddits-end-of-year-recap-experience-rolls-out-with-personalized-shareable-cards)) | S | Low | v0.2 |
| 20 | Age-style label ("Claude age") | A playful age from usage (for example from tenure or model mix) | Spotify's Listening Age was widely posted and also drew anger ([IBTimes UK](https://www.ibtimes.co.uk/spotify-wrapped-drops-new-listening-age-feature-users-are-screaming-their-supposed-music-tastes-1760183), search snippet; [Fast Company](https://www.fastcompany.com/91454685/spotify-wrapped-2025-eagerly-checking-your-listening-age-everyone-else-is-too)). Only fits Roast me, and the basis must be shown | M | Low | Later, Roast me only |

## Top 5 for v0.2

All five use data already on disk. Nothing needs a network call or a new dependency.

1. **Personal records and streak flames (items 1 and 2).**
   - Sources: year-wide daily counts from `~/.claude/history.jsonl` (`timestamp`, one line per prompt; current on the author's machine). Streak and busiest day computed from those dates. Cross-check against `stats-cache.json` `dailyActivity[]` (`date`, `messageCount`, `sessionCount`, `toolCallCount`) for days before 2026-11-11.
   - Longest session: transcripts `~/.claude/projects/*/*.jsonl` (last 30 days only). The card must say "detailed stats: last 30 days", as the spec already requires.
   - Effort S. Privacy: dates and counts only.

2. **Model loyalty (item 3).**
   - Sources: per-model token totals in `stats-cache.json` (listed in `2026-11-27-shareable-stats.md`, section 4, as verified fields; confirm the exact key names in the file). Monthly model mix from `message.model` in the last-30-day transcripts.
   - Effort S. Privacy: model names only.
   - Caveat: year-wide per-model numbers stop at the `stats-cache.json` date. Label the chart with its coverage.

3. **First-prompt origin card (item 4).**
   - Source: earliest `timestamp` in `history.jsonl`, plus the count of prompts that day from the same file. The file's `display` field holds prompt text and must not be read into output or into Claude's context, except as counts (spec rule).
   - Effort S. Privacy: date and count only. A secret scan still runs on every string that is rendered.

4. **CLI flags: `--year`, `--json`, `--no-names`, plus `--copy` and `--out` (items 5 and 17).**
   - Source: flags only, no new data. `--json` writes the redacted `stats.json` that the render step already uses; this is also the file format needed for item 7 later.
   - `--no-names` is the switch that makes "Hide all" scriptable.
   - Effort S. Privacy: `--json` output must pass the same redaction as the story. Add a test that a fixture with a project name and a path produces no such strings.

5. **Opt-in monthly archive snapshot (item 6).**
   - Sources: `stats.json` from each run, written to a user folder (for example `~/promptfolio-archive/2026-11.json`), with `history.jsonl` counts and last-30-day detail copied in before the transcripts are deleted.
   - Requires a yes from the user, in line with the spec's rule that `cleanupPeriodDays` is not changed without approval. Offer it in the onboarding, and again on the first run after month end.
   - Effort M. Privacy: writes new local files only. The archive files must use the same redaction as `stats.json`.

Not in the top 5 but cheap and worth a look: dark and light variants (9), caption generator (18), pseudonym option (19).

## Anti-features (what users disliked)

- **Shaming or ageing labels with no visible basis.** Spotify's Listening Age was widely posted, but many users were upset about results that made them seem older, and some said they felt personally targeted ([IBTimes UK](https://www.ibtimes.co.uk/spotify-wrapped-drops-new-listening-age-feature-users-are-screaming-their-supposed-music-tastes-1760183), [Fast Company](https://www.fastcompany.com/91454685/spotify-wrapped-2025-eagerly-checking-your-listening-age-everyone-else-is-too)). Rule for Promptfolio: every label shows the rule and the numbers behind it, and a playful label is only in Roast me.
- **Wrong numbers.** Spotify's 2024 edition was criticised for stats that users said were false, and the 2025 edition drew "AI slop with paid stats" complaints about data that did not match other sources ([Headphonesty](https://www.headphonesty.com/2025/12/fans-slam-spotify-wrapped-ai-slop-stats/), search snippet; [TechRadar on the 2024 mistakes](https://www.techradar.com/audio/spotify/spotify-admits-it-made-mistakes-with-your-wrapped-2024-heres-what-could-change-this-year), search snippet). Rule: the validator already blocks invented numbers. Add a footer that names the coverage period.
- **Generic AI copy and AI features nobody asked for.** The 2024 AI podcast was the main complaint ([TechCrunch](https://techcrunch.com/2024/12/04/spotify-wrapped-2024-adds-an-ai-podcast-powered-by-googles-notebooklm)). Rule: no feature that generates audio or video from a prompt.
- **Paywalls on the share.** Strava's paid tier put the recap behind a gate and users still saved images themselves ([Strava support](https://support.strava.com/en-us/articles/15401959-your-year-in-sport)). Rule: no gate, no account.
- **Totals inflated by cache reads.** Users report that total-token counters re-add cached tokens on every request ([ccstatusline issue, search snippet](https://claudeissues.com/issue/64827-ccstatusline-total-counter-is-misleading-inflates-by-re-adding-cached-tokens-eve)). Rule: lead with output tokens, as the shareable-stats research says.
- **Unexplained percentiles.** Percent-rank claims with no published method get questioned (see candidate 14). Rule: none without a stated base.
- **Forced public ranking and upload.** Leaderboards are a source of pressure and a privacy question at once; ccclub's answer (numeric summaries only, no prompts, no file paths) is the bar to match if we ever ship one ([ccclub](https://ccclub.dev/claude-code-leaderboards)).
- **Eligibility gates.** Letterboxd needs ten diary entries before a recap exists ([Letterboxd coverage](https://www.academicjobs.com/global-news/letterboxd-wrapped-2025-takes-over-social-media-movie-stats-viral-trends-33), weak source). Rule: a low-activity user still gets a short card, with a line that says so.
- **Silent cost framing.** "API-equivalent" cost shown as if it were a bill confuses people. The spec already labels it as an estimate at published prices; keep that.

## Unverified or weak

- Spotify's own Clubs, Listening Age and Fan Leaderboard figures come from the existing research (`2026-11-26-indirect-competitors-shareability.md`), not re-checked here.
- The claudeissues.com issues (67773, 15367, 23245) could not be fetched in this pass (DNS failure for claudeissues.com). Their details above come from search snippets only. Check them on github.com/anthropics/claude-code before quoting them.
- The 2025 Reddit Recap details come from a single site that does not cite Reddit, so they are left out.
- The Duolingo Year in Review details come from one Android Authority piece.
- No engagement numbers were found for monthly recaps, streak formats, or friend comparison. Treat the sharing claims for items 2, 3, 4, 11 and 12 as design inference.
- One search snippet contained embedded instructions addressed to the reader. They were ignored and are not part of this research.

## Sources

Products and launches:
- Spotify 2025 Wrapped newsroom: https://newsroom.spotify.com/2025-wrapped-user-experience/ (from existing research)
- NPR on Spotify Listening Age: https://www.npr.org/2025/12/04/nx-s1-5632595/spotify-wrapped-listening-age
- Fast Company on Listening Age: https://www.fastcompany.com/91454685/spotify-wrapped-2025-eagerly-checking-your-listening-age-everyone-else-is-too
- IBTimes UK on Listening Age (search snippet): https://www.ibtimes.co.uk/spotify-wrapped-drops-new-listening-age-feature-users-are-screaming-their-supposed-music-tastes-1760183
- Headphonesty on Spotify 2025 complaints (search snippet): https://www.headphonesty.com/2025/12/fans-slam-spotify-wrapped-ai-slop-stats/
- TechCrunch on the 2024 AI podcast: https://techcrunch.com/2024/12/04/spotify-wrapped-2024-adds-an-ai-podcast-powered-by-googles-notebooklm
- TechRadar on Spotify 2024 mistakes (search snippet): https://www.techradar.com/audio/spotify/spotify-admits-it-made-mistakes-with-your-wrapped-2024-heres-what-could-change-this-year
- GitHub Unwrapped (Remotion), 2023 repo: https://github.com/remotion-dev/github-unwrapped-2023
- GitHub Compiled 2025 (Product Hunt, search result): https://www.producthunt.com/products/github-compiled-2025
- Wrap by SaaSBillboards (Product Hunt, search result): https://www.producthunt.com/products/wrap-by-saasbillboards
- WakaTime 2025 Wrapped (fetched): https://wakatime.com/blog/70-wakatime-2025-wrapped
- WakaTime sample "Code Stats for 2025" page (search snippet): https://wakatime.com/a-look-back-at-2025/1a7b5f29-2708-4091-928e-dc636095ae43/ifthratogo
- Letterboxd Year in Review coverage (weak source, search result): https://www.academicjobs.com/global-news/letterboxd-wrapped-2025-takes-over-social-media-movie-stats-viral-trends-33
- Duolingo Year in Review (Android Authority, search result): https://www.androidauthority.com/duolingo-year-in-review-2025-3621782
- Duolingo product highlights (search result): https://blog.duolingo.com/product-highlights/
- Reddit Recap 2022 (TechCrunch): https://techcrunch.com/2022/12/08/reddits-end-of-year-recap-experience-rolls-out-with-personalized-shareable-cards
- Cursor year in code forum thread (search result): https://forum.cursor.com/t/view-your-year-2025-in-cursor/146960
- Cursor share thread (search result): https://forum.cursor.com/t/share-your-year-in-review/147241
- Strava Year in Sport support page (from existing research): https://support.strava.com/en-us/articles/15401959-your-year-in-sport
- Steam Replay coverage (Engadget, from existing research): https://www.engadget.com/gaming/pc/steam-replay-2025-is-here-to-recap-your-pc-gaming-habits-205430951.html

Claude Code tools and requests:
- cc-wrapped README: https://github.com/levifig/cc-wrapped
- Claude Code Wrapped (PyPI, search result): https://pypi.org/project/claude-code-wrapped/
- ccclub leaderboards comparison (fetched): https://ccclub.dev/claude-code-leaderboards
- vibestats crate docs (search result): https://docs.rs/crate/vibestats/2.4.3
- Claude Code session-report plugin (search result): https://claude.com/plugins/session-report
- Claude Code data directory docs (from existing research): https://code.claude.com/docs/en/claude-directory
- Claude Code feature request for stats JSON and PNG export (search snippet, claudeissues.com; fetch failed): https://claudeissues.com/issue/67773-feature-headless-exportable-stats-json-and-image-export
- Claude Code feature request for year-in-review analytics (search snippet; fetch failed): https://claudeissues.com/issue/15367-feature-request-year-in-review-analytics-and-usage-statistics
- Opt-in community leaderboard request (search snippet; fetch failed): https://claudeissues.com/issue/23245-feature-opt-in-community-stats-leaderboard-for-usage-comparison
- ccstatusline cache-inflation issue (search snippet, from existing research): https://claudeissues.com/issue/64827-ccstatusline-total-counter-is-misleading-inflates-by-re-adding-cached-tokens-eve

Not fetched directly: GitHub issue lists for ccusage, cc-wrapped and claude-code-wrapped (search did not index them). Check those repos' issue trackers before relying on request counts.
