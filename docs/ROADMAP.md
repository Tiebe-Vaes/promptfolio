# Roadmap

Promptfolio turns your local Claude Code history into a year recap you can post. This is what is planned after v0.2. Ideas come from `docs/research/` (competitors, wrapped products, shareable stats, feature ideas).

## v0.2 (now)

Story (`story.html`), share PNGs per platform, README card, three vibes (Professional, Fun, Roast me), English and Dutch, accent from your top language, API value estimate, local only.

## v0.3: a complete year next time

- **Monthly archive.** Claude Code deletes detailed logs after 30 days by default. An opt-in monthly snapshot of the redacted stats (a scheduled `stats.mjs` run, or a SessionEnd hook) means next year's recap covers the whole year.
- **Faster PNGs.** Today each PNG starts the browser once (about 10 s each). One browser session for all cards (DevTools protocol over a pipe, still no dependencies) should bring a full render under 15 s.
- **Personal records slide.** Longest streak, busiest day, longest session, first prompt of the year, favourite model: all already in `stats.json`.
- **CLI flags people ask for:** `--json` (print stats), `--copy-only`, `--open`.

## v0.4: social

- **Compare with a friend.** Import a friend's exported `stats.json` (no upload, no server) and get a side-by-side card: who tested more, who shipped more, who said please.
- **More themes for Fun:** festival lineup of your top tools, nutrition label ("Promptfolio Facts"), both mocked up in `design/mockups/`.
- **Short video.** Record the story slides into a 9:16 MP4 for Reels and TikTok.

## Later

- claude.ai chat history from the official data export, merged with Claude Code.
- More languages for the fixed labels (the copy itself already follows the user's language).
- Other agents' logs (Codex, Cursor) behind the same cards, if users ask for it.

## Not planned

- Uploading logs or stats anywhere, hosted share links, public leaderboards.
- Percentile claims ("top 1%") without real data on other users.
- Paid tiers for the share images.
