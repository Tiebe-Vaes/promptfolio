# Roadmap

Promptfolio turns your local Claude Code history into a year recap you can post. This is what is planned after v0.3. Ideas come from `docs/research/` (competitors, wrapped products, shareable stats, feature ideas).

## v0.3 (now)

Four cards (Tokens, Year in numbers, Toolkit, Growth) in four styles and four colours, three tones, the formats you pick (Story, Square, Wide, README), a share step with captions, English only, local only.

## v0.4: a complete year next time

- **Monthly archive.** Claude Code deletes detailed logs after 30 days by default. An opt-in monthly snapshot of the redacted stats (a scheduled `stats.mjs` run, or a SessionEnd hook) means next year's recap covers the whole year.
- **Faster PNGs.** Each PNG starts the browser once (about 2 s each). One browser session for all cards (DevTools protocol over a pipe, still no dependencies).
- **CLI flags people ask for:** `--json` (print stats), `--copy-only`, `--open`.

## v0.5: social

- **Compare with a friend.** Import a friend's exported `stats.json` (no upload, no server) and get a side-by-side card: who tested more, who shipped more, who said please.
- **More styles:** festival lineup of your top tools, nutrition label ("Promptfolio Facts"), both mocked up in `design/mockups/`.
- **Short video.** Record the story cards into a 9:16 MP4 for Reels and TikTok.

## Later

- claude.ai chat history from the official data export, merged with Claude Code.
- Other agents' logs (Codex, Cursor) behind the same cards, if users ask for it.

## Not planned

- Uploading logs or stats anywhere, hosted share links, public leaderboards.
- Percentile claims ("top 1%") without real data on other users.
- Paid tiers for the share images.
