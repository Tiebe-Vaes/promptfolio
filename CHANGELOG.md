# Changelog

## 0.3.0 (unreleased)

- Four cards with fixed content: Tokens, Year in numbers, Toolkit and Growth.
- Four styles for all four cards: Clean, Receipt, Terminal and Trading card (a booster pack, 1/4 to 4/4).
- Four colours: your top language's colour, Ink, Grape or Sunset.
- New flow: Make it now, or Personalise in five taps (style, tone, formats, cards, colour). Works the same in the CLI and the desktop app.
- Formats you pick, and only those are rendered: Story 9:16, Square 1:1, Wide 16:9, GitHub README 3:1. About two seconds per PNG.
- Share step: a caption per platform from your real numbers, a prefilled X post, links to every file. The repo link is on every card and caption.
- English only.
- Copy v2: a title, one line per card and four captions. Diary, awards, relationship and card moves are gone.

## 0.2.0 (not published, replaced by 0.3.0)

- Visual recap: `story.html` with token pair and year heatmap, receipt, terminal replay, trading card (Fun, Roast me) and growth closer (Professional).
- Share PNGs per platform (Instagram story, feed, landscape) rendered with the local Chrome, Edge or Brave; works without one (story only).
- README card SVG for GitHub profiles.
- New stats: tokens written per year, how often Claude rereads per written token, growth per month, favourite model, first prompt date, API value estimate at Anthropic's published prices.
- Accent colour from your top language; fonts embedded (OFL), nothing loaded from the network.
- Onboarding in one step of four questions.

## 0.1.0

- First version: `/promptfolio` reads local Claude Code logs, builds a redacted `stats.json`, lets Claude write a professional, fun or roast recap with placeholder numbers, validates it and shows a text preview.
- Privacy: no network code, project names hidden by default, paths never shared, secret scan in every mode.
- Works on Windows, macOS and Linux; scripts need Node 18.3+.
