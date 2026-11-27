# Promptfolio Plan 2: Visuals and Release Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `stats.json` + `copy.json` into a tap-through `story.html`, share PNGs and a README card in the look chosen in the mockup rounds, and get the repo ready to publish v0.2.0 (publishing itself waits for Tiebe).

**Architecture:** Templates are pure TypeScript functions `(ctx) => string` that return HTML using only embedded fonts and inline CSS/SVG. A render CLI writes `story.html`, one HTML file per share card, and screenshots the cards with the local browser (Plan 1 `screenshot`). Code still owns every number; Claude's copy reaches templates only through `fillPlaceholders` and HTML escaping.

**Tech Stack:** Node 18.3+ runtime with zero runtime deps; TypeScript, vitest, esbuild; `@fontsource` packages as dev dependencies only (fonts copied into the plugin at build time).

**Spec:** `docs/superpowers/specs/2026-11-27-claude-code-recap-design.md` (read "Visual decisions"). Mockups to match: `design/mockups/round-2.html` (data artwork, receipt, terminal, trading card) and `design/mockups/round-3-visualizers.html` (growth closer, middle board). Research: `docs/research/2026-11-27-ai-design-tells.md` (checklist), `2026-11-27-shareable-stats.md`, `2026-11-27-release-and-marketing.md`.

**Depends on:** Plan 1 merged state on branch `feat/plan-1-foundation` (or its successor).

## Global Constraints

- All Plan 1 Global Constraints still hold (Node 18.3+ runtime, zero runtime deps, no network code, redaction, no digits in copy, commit messages without AI attribution).
- Every string from `copy.json`, `stats.json` labels, project labels or titles is HTML-escaped before it enters a template.
- Templates load nothing from the network: fonts are base64 `@font-face` data URLs, images are inline SVG or canvas.
- Design rules (spec "Visual decisions"): no eyebrow labels, no "NN / NN" counters, no gradient text, no glow, no middle-dot strings, no em dashes in copy, no single accented word in a heading, no uppercase labels outside receipt and terminal, monospace only in receipt and terminal, accent = top language colour.
- Sizes: story slides 1080x1920; feed 1080x1350; landscape 1200x675; README card 1200x400.
- Placeholder numbers in story and cards always come from `stats.json`; derived numbers (ratios, growth factor, API value) are computed in code and exposed as stats fields.

## Review Focus

1. **Copy or a session title containing HTML or a script tag.** Expect it shown as text, never executed. Test: Task 4 `escapeHtml neutralises tags` and Task 7 `story escapes copy`.
2. **A user with almost no data** (one day, no transcripts, no history). Expect a short but valid story with slides that need missing data skipped, no "NaN", "undefined" or "{" in output. Test: Task 7 `sparse stats render without holes`.
3. **A top language without a known colour** (or no files edited). Expect a neutral fallback accent with readable contrast. Test: Task 3 `unknown language falls back`.
4. **Models missing from the price table.** Expect the API value to cover known models only and say so, never a made-up price. Test: Task 1 `apiValue skips unknown models`.
5. **No browser installed.** Expect story.html and the README SVG still written, PNG step skipped with one clear line. Test: Task 8 `render without browser`.

---

## File structure

```
src/stats/extras.ts          dailySeries, yearOutputTokens, growth, tokenRatio, topLanguage
src/stats/pricing.ts         PRICES table + apiValue()
src/render/escape.ts         escapeHtml, fill (fillPlaceholders + escape)
src/render/theme.ts          languageColor, fontFaceCss, tokens (sizes, colours)
src/render/shell.ts          page(), slide shell with progress bar
src/render/slides/tokens.ts  data artwork: token pair + heatmap
src/render/slides/receipt.ts
src/render/slides/terminal.ts
src/render/slides/card.ts    trading card + sprite()
src/render/slides/growth.ts  growth closer (professional)
src/render/story.ts          story.html assembly
src/render/cards.ts          share-card list per vibe and target
src/render/readme.ts         README card SVG
src/cli/render.ts
scripts/copy-fonts.mjs       dev: copies woff2 + OFL licences from @fontsource into plugin assets
plugins/promptfolio/skills/promptfolio/assets/fonts/*        (built, committed)
tests/render/*.test.ts, tests/stats-extras.test.ts, tests/pricing.test.ts
```

---

### Task 1: Stats extras and API value

**Files:** Create `src/stats/extras.ts`, `src/stats/pricing.ts`; modify `src/types.ts`, `src/buildStats.ts`, `src/sources/transcripts.ts`, `src/sources/statsCache.ts`. Test: `tests/stats-extras.test.ts`, `tests/pricing.test.ts`.

**Interfaces:**
- Produces new `Stats` fields:
  - `activity.daily: { date: string; messages: number }[]` (merged daily series, ascending)
  - `activity.growth: { first: { month: string; messages: number }; peak: { month: string; messages: number }; factor: number } | null` (first and busiest month of the year; `factor = round(peak / first, 0)`; null with fewer than 2 months)
  - `tokens.yearOutput: number | null`, `tokens.readPerWritten: number | null` (`round(yearTotal / yearOutput)`)
  - `files.topLanguage: string | null`
  - `apiValue: { usd: number; models: string[]; skippedModels: string[]; pricesAsOf: string } | null`
- `TranscriptStats.dailyOutput: Record<string, Record<string, { input: number; output: number; cacheRead: number; cacheCreation: number }>>` (date -> model -> split)
- `StatsCacheData.modelUsage: Record<string, { input: number; output: number; cacheRead: number; cacheCreation: number }>` and `firstSessionDate` (exists).
- `PRICES: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }>` (USD per million tokens, keyed by model id prefix) and `PRICES_AS_OF: string`; `apiValue(usage: Record<model, split>): Stats['apiValue']`.

Rules:
- `yearOutput`: if stats-cache `firstSessionDate` is in the year, use `modelUsage` output (it is all-time and the user started this year) plus transcript output on dates after `statsCacheThrough`; otherwise use transcript output only and keep it, labelled by coverage. If neither is available, null.
- API value uses the same split (cache `modelUsage` when its whole history is in the year, transcripts after the cutoff). Model ids map to `PRICES` by longest matching prefix; unmatched models go to `skippedModels`.
- `PRICES` values come from Anthropic's pricing page, read at build time (use the `claude-api` skill or `https://www.anthropic.com/pricing`), each line commented with its source date. A model with no published price is left out, never guessed.

- [ ] **Step 1: Write failing tests**: `dailySeries merges cache and transcripts at the cutoff`, `growth picks first and peak month` (fixture months: 2026-03 = 95 messages, 2026-11 = 23 → `{ first: { month: '2026-03', messages: 95 }, peak: { month: '2026-03', messages: 95 }, factor: 1 }`; a second case built with `merge` where November has 950 → `peak 2026-11, factor 10`), `growth null with one month`, `yearOutput uses modelUsage when first session is this year`, `readPerWritten rounds`, `topLanguage is the most edited`, `apiValue prices known models` (`{ 'claude-opus-5-5': { input: 1e6, output: 1e6, cacheRead: 0, cacheCreation: 0 } }` → `PRICES` input + output), `apiValue skips unknown models` (`{ 'mystery-1': ... }` → `usd 0, skippedModels ['mystery-1']`).
- [ ] **Step 2:** Run `npx vitest run tests/stats-extras.test.ts tests/pricing.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement; extend the fixture `stats-cache.json` with a `modelUsage` block.
- [ ] **Step 4:** Run the tests plus `tests/buildStats.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit `"Add daily series, year output tokens, growth and API value to stats"`.

### Task 2: Copy v2

**Files:** Modify `src/types.ts`, `src/copy.ts`, `tests/copy.test.ts`, `SKILL.md` copy rules.

**Interfaces:** `Copy` gains:
- `tokensLine: string` (one sentence under the token pair, all vibes)
- `persona.moves: { name: string; value: string; text: string }[]` (exactly 3; `value` is a single placeholder like `{tools.bash}`)
- `receiptFooter: string` (fun and roast; professional uses a fixed footer)
- `verdict: string` (terminal last line)
- `growthLine: string` (professional closer heading, e.g. "{activity.growth.factor} times busier by {activity.growth.peak.month}")

`fillPlaceholders` formats paths ending in `.month` with value `YYYY-MM` as the localized month name (`en`: "October", `nl`: "oktober"). `COPY_LIMITS` gains `tokensLine 90`, `moveName 22`, `moveText 60`, `receiptFooter 60`, `verdict 70`, `growthLine 40`; `className` drops to 22 (card width in round 2).

- [ ] **Step 1: Write failing tests**: `move value must be exactly one placeholder`, `fun needs 3 moves`, `month placeholder renders as a name` (`en` "October", `nl` "oktober"), `professional needs growthLine when growth exists`, `limits match card widths`.
- [ ] **Step 2:** Run `npx vitest run tests/copy.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement; update SKILL.md "Copy rules" (shape + one line per new field).
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `"Extend copy for cards, receipt, terminal and growth"`.

### Task 3: Fonts and theme

**Files:** Create `scripts/copy-fonts.mjs`, `src/render/theme.ts`; modify `package.json` (dev deps `@fontsource-variable/archivo`, `@fontsource/ibm-plex-mono`, `@fontsource/big-shoulders-display`, `@fontsource/libre-franklin`; script `fonts`); output `plugins/promptfolio/skills/promptfolio/assets/fonts/` with latin `woff2` files and each font's `LICENSE` (OFL). Test: `tests/render/theme.test.ts`.

**Interfaces:**
- `LANGUAGE_COLORS: Record<string, string>` (GitHub linguist colours for the languages in `buildStats` LANGUAGES table; Markdown `#083FA1`, Config `#6B7280`).
- `languageColor(lang: string | null): { accent: string; deep: string; onAccent: '#FFFFFF' | '#10151C' }` (fallback `#3C6FA8`; `onAccent` picked for 4.5:1 contrast; `deep` is the accent mixed 45% with `#10151C`).
- `fontFaceCss(assetsDir: string): string` (reads the woff2 files, returns `@font-face` rules with base64 data URLs; cached per process).

- [ ] **Step 1: Write failing tests**: `TypeScript is #3178C6`, `unknown language falls back`, `onAccent meets 4.5:1 for every colour` (compute WCAG contrast in the test), `fontFaceCss embeds data URLs only` (no `http`).
- [ ] **Step 2:** Run `npx vitest run tests/render/theme.test.ts`. Expected: FAIL.
- [ ] **Step 3:** `npm i -D` the four packages, write `copy-fonts.mjs` (copies only the latin subset weights used: Archivo variable, Plex Mono 400/600, Big Shoulders Display 900, Libre Franklin 400/600/900), run it, implement `theme.ts`.
- [ ] **Step 4:** Run tests. Expected: PASS. Check `du -sh assets/fonts` stays under 600 KB.
- [ ] **Step 5:** Commit `"Embed OFL fonts and derive the accent from the top language"`.

### Task 4: Escaping and slide shell

**Files:** Create `src/render/escape.ts`, `src/render/shell.ts`. Test: `tests/render/shell.test.ts`.

**Interfaces:**
- `escapeHtml(s: string): string`; `fill(text: string, stats: Stats, lang: 'en' | 'nl'): string` (= `escapeHtml(fillPlaceholders(text, stats, lang))`).
- `type Size = { w: number; h: number; name: 'story' | 'feed' | 'landscape' | 'readme' }`; `SIZES: Record<Size['name'], Size>`.
- `page(opts: { title: string; css: string; body: string; fontsCss: string; lang: 'en' | 'nl' }): string` (complete document, `<meta name="color-scheme">`, reduced-motion rule).
- `progressBar(index: number, total: number): string` (Instagram-style segments; only used in story mode).

- [ ] **Step 1: Write failing tests**: `escapeHtml neutralises tags` (`<script>alert(1)</script>` → no `<script`), `fill escapes after filling`, `page has no external URLs` (no `http://` or `https://` in output), `progressBar marks done segments`.
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit `"Add HTML escaping, sizes and the story shell"`.

### Task 5: Slides: tokens + heatmap, receipt, terminal

**Files:** Create `src/render/slides/tokens.ts`, `receipt.ts`, `terminal.ts`. Test: `tests/render/slides.test.ts`.

**Interfaces:** each exports `render(ctx: SlideCtx): { css: string; html: string } | null` where `SlideCtx = { stats: Stats; copy: Copy; lang: 'en' | 'nl'; theme: ReturnType<typeof languageColor>; size: Size }`. `null` means "not enough data, skip this slide".

Match `design/mockups/round-2.html` boards 1, 2 and 4 (positions, sizes, fonts), with these data rules:
- Tokens: needs `tokens.yearTotal > 0`; shows `yearOutput` only when non-null (else single number). Heatmap from `activity.daily` for the covered weeks; month labels from data; cell colour = `color-mix` of accent by `sqrt(messages / max)`.
- Receipt: line items from stats (sessions, messages, bash, test runs, commits, politeness, corrections, tokens read/written, API value + "You paid: a plan" only when `apiValue` non-null with a note when `skippedModels` is non-empty), barcode from `activity.daily`, footer from `copy.receiptFooter` or the fixed professional footer.
- Terminal: rows from stats (sessions, busiest day, streak, top language), top 4 tools as bars, `copy.verdict`. No Claude or Anthropic marks.

- [ ] **Step 1: Write failing tests** per slide: `renders real numbers` (contains formatted `activity.sessions` etc.), `skips without data` (null on empty stats), `no unresolved placeholders` (no `{` followed by a letter in output), `design rules` (a shared helper `assertDesignRules(html, { mono: boolean })`: no `·`, no `—`, no `background-clip:text`, no `text-transform:uppercase` unless mono slide, no `font-family` other than the four families).
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit `"Add token, receipt and terminal slides"`.

### Task 6: Trading card and growth closer

**Files:** Create `src/render/slides/card.ts`, `src/render/slides/growth.ts`. Test: `tests/render/card-growth.test.ts`.

**Interfaces:**
- `sprite(stats: Stats, accent: string, deep: string): string` returns an inline SVG (12x12 mirrored pixel creature, `shape-rendering="crispEdges"`), deterministic per stats (seed from `activity.sessions`, `tools.bash`, `tools.testRuns`, `tools.commits`, `files.topLanguage`).
- `card.render(ctx)`: round-2 board 3 layout; level = `min(99, floor(log2(yearTotal / 1e6 + 1) * 5))`; rarity from the number of strength candidates with `score >= 1` (`0-1 Common, 2-3 Rare, 4+ Legendary`); moves from `copy.persona.moves`.
- `growth.render(ctx)`: round-3 middle board; line from `activity.byMonth` with empty months as 0 in between; heading `copy.growthLine`; three strengths from `copy.profile.strengths`; null when `activity.growth` is null (story then ends on the token slide).
- Landscape (`1200x675`) and feed (`1080x1350`) variants: card centred with the title beside it (landscape) or above it (feed); growth with chart left and strengths right (landscape).

- [ ] **Step 1: Write failing tests**: `sprite is deterministic`, `sprite differs for different stats`, `level formula` (yearTotal 17.7e9 → 70), `rarity thresholds`, `growth null without growth`, `variants fit their size` (rendered HTML root has the given width and height), plus `assertDesignRules`.
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit `"Add trading card and growth closer"`.

### Task 7: Story assembly

**Files:** Create `src/render/story.ts`, `src/render/cards.ts`. Test: `tests/render/story.test.ts`.

**Interfaces:**
- `storySlides(vibe): Array<'tokens' | 'receipt' | 'terminal' | 'card' | 'growth'>`: professional `['tokens', 'terminal', 'receipt', 'growth']`; fun and roast `['tokens', 'receipt', 'terminal', 'card']`.
- `buildStory(ctx: { stats; copy; lang; assetsDir }): string`: one self-contained HTML document, slides that return null are skipped, progress bar counts only rendered slides; tap right/left half and arrow keys move; space pauses; no auto-advance when `prefers-reduced-motion`; each slide has a "Save image" link to `cards/<slide>-story.png` (hidden when the file was not rendered; then the slide shows "Screenshot this slide to share it").
- `shareCards(vibe, targets: Array<'instagram' | 'linkedin' | 'x' | 'discord'>): { slide; size }[]`: instagram → every story slide at `story`; linkedin → closer at `feed` and `landscape`; x and discord → closer at `landscape`; always the receipt at `feed`. Closer = `card` (fun, roast) or `growth` (professional).

- [ ] **Step 1: Write failing tests**: `slide order per vibe`, `story escapes copy` (copy with `<img onerror>` stays inert), `sparse stats render without holes` (empty-home stats + minimal copy: valid HTML, no `NaN`, `undefined`, `{`), `progress counts rendered slides`, `shareCards per target`, `story has no network URLs`.
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit `"Assemble the tap-through story and share-card list"`.

### Task 8: README card and render CLI

**Files:** Create `src/render/readme.ts`, `src/cli/render.ts`; modify `esbuild.config.mjs` (add `render`). Test: `tests/render/readme.test.ts`, `tests/cli-render.test.ts`.

**Interfaces:**
- `readmeCard(ctx): string`: a 1200x400 SVG: tokens read/written, sessions, top language, growth sparkline, Promptfolio wordmark in Archivo; fonts embedded as `@font-face` data URLs inside `<style>`; one CSS animation (line draw) disabled under reduced motion.
- `node render.mjs --dir <out> [--targets instagram,linkedin,x,discord] [--no-png]`: reads `<dir>/stats.json` + `<dir>/copy.json` (validates copy first; exit 1 with errors if invalid), writes `story.html`, `cards/<slide>-<size>.html` and, with a browser, `cards/<slide>-<size>.png` via Plan 1 `screenshot`; writes `readme-card.svg` and `readme-card.png`; prints every written path; without a browser prints one line "No Chrome, Edge or Brave found: PNGs skipped, story.html still works" and exits 0.

- [ ] **Step 1: Write failing tests**: `readme svg is self-contained` (no `http`), `render without browser` (`PROMPTFOLIO_BROWSER` pointing to a missing file and PATH emptied: story.html + readme-card.svg exist, no PNGs, exit 0), `render rejects invalid copy` (exit 1), `render with browser writes PNGs at the right sizes` (`test.skipIf(!browser)`, check IHDR sizes with `pngSize`).
- [ ] **Step 2–4:** Run (FAIL), build, implement, run (PASS).
- [ ] **Step 5:** Commit `"Add README card and render CLI"`.

### Task 9: Skill v1 and CI

**Files:** Modify `SKILL.md`, `.github/workflows/ci.yml`, `README.md` (usage section), `tests/cli.test.ts` if CLI surface changed.

- [ ] **Step 1:** SKILL.md: "Posting where" answers map to `--targets` (`Instagram story` → `instagram`, `LinkedIn` → `linkedin`, `X or Discord` → `x,discord`, `Just me` → none). Step 9 becomes: run `node "<skill>/scripts/render.mjs" --dir ./promptfolio-<year> --targets ...`, then open `story.html` (`start` on Windows, `open` on macOS, `xdg-open` on Linux) and list the PNG paths. Add copy rules for the new fields from Task 2.
- [ ] **Step 2:** CI: in the `test` job on `ubuntu-latest`, install Chrome via `browser-actions/setup-chrome@v1` before `npm test` so the PNG tests run there instead of skipping; the Node 18 runtime job also runs `render.mjs --no-png` on the fixture with a valid copy.
- [ ] **Step 3:** Run the full suite once: `npm run typecheck && npm test && npm run build && git status --short plugins/`. Expected: all pass, build output committed.
- [ ] **Step 4:** Commit `"Render from the skill and test PNG export in CI"`.

### Task 10: Visual verification on real data

**Files:** Only fixes found here (each with a test in the owning task's file).

- [ ] **Step 1:** Run the full pipeline on the author's real data for all three vibes into the scratchpad (never inside the repo). Write the copy files by hand following SKILL.md.
- [ ] **Step 2:** Compare every PNG with the mockups and `docs/research/2026-11-27-ai-design-tells.md` checklist items 1-28; list each deviation.
- [ ] **Step 3:** Use the `ui-check-all-widths` skill on `story.html` (phone widths 360-430 px and desktop) and `make-interfaces-feel-better` for a polish pass on tap feedback, progress bar timing and the line-draw animation.
- [ ] **Step 4:** Fix, rerun, commit `"Polish slides after real-data review"`.

### Task 11: Release prep v0.2.0 (stop before publishing)

**Files:** Modify `README.md`, `plugins/promptfolio/README.md`, `CHANGELOG.md`, `plugin.json`, `package.json`; create `design/social-preview.png` (1280x640) and `docs/images/` sample renders.

- [ ] **Step 1:** Render sample images from a synthetic "demo" stats file (`tests/fixtures/demo-stats.json`, realistic but invented, clearly labelled as demo data). Real-data images only if Tiebe says so.
- [ ] **Step 2:** README: hero = demo receipt or card PNG in the first screen, install commands, privacy section unchanged, "Sample output (demo data)" caption; update CHANGELOG `0.2.0`; bump versions to `0.2.0`.
- [ ] **Step 3:** Render `design/social-preview.png` at 1280x640 with the same templates.
- [ ] **Step 4:** Run `claude plugin validate --strict ./plugins/promptfolio` and `claude plugin validate --strict .`; full suite; build fresh.
- [ ] **Step 5:** Commit `"Prepare v0.2.0 release: readme images, changelog, social preview"`. Stop: creating the GitHub repo, pushing, tagging, skills.sh and launch posts need Tiebe's go.
