# Promptfolio Plan 3: Styles, Formats and the New Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four fixed cards (Tokens, Year in numbers, Toolkit, Growth) in one of four user-picked styles (Clean, Receipt, Terminal, Trading card), rendered only in the formats and cards the user picks, with a short question flow and a share step, released as v0.3.0.

**Architecture:** Split content from look. `src/render/model.ts` turns stats + copy into one `CardModel` per card (all numbers formatted, all strings escaped). Each style in `src/render/styles/` renders any `CardModel` at any size. So 4 content builders + 4 styles instead of 16 templates. The render CLI takes `--style --cards --formats`, names files `<style>-<card>-<format>.png`, and writes `captions.json` for the share step. Code still owns every number.

**Tech Stack:** Node 18.3+ runtime with zero runtime deps; TypeScript, vitest, esbuild; system Chrome/Edge/Brave for PNGs (unchanged).

**Spec:** `docs/superpowers/specs/2026-11-27-claude-code-recap-design.md`, sections "Flow inside the skill (revised 2026-11-27, v0.3)", "Card content (revised 2026-11-27, v0.3)" and "Visual decisions, revision for v0.3". Look reference: the v0.2 slides in `src/render/slides/` and `design/mockups/round-2.html`.

**Depends on:** `main` at `c1c94c5` (v0.2.0 built). Branch: `feat/plan-3-styles`.

## Global Constraints

- All Plan 1 and Plan 2 Global Constraints still hold: Node 18.3+ runtime, zero runtime deps, no network code in the scripts, redaction, no digits in copy, every copy string HTML-escaped, fonts embedded, commit messages without AI attribution.
- Design rules unchanged: no eyebrow labels, no "NN / NN" counters, no gradient text, no glow, no middle dots, no em dashes, no single accented word, uppercase and monospace only in the Receipt and Terminal styles, accent = top language colour.
- Styles: `clean`, `receipt`, `terminal`, `card`. Cards: `tokens`, `year`, `toolkit`, `growth`. Formats: `story` 1080x1920, `square` 1080x1080, `wide` 1200x675, `readme` 1200x400.
- Repo link text on every card and the README card: `github.com/Tiebe-Vaes/promptfolio`; in captions: `https://github.com/Tiebe-Vaes/promptfolio`. One constant, `REPO` in `src/render/brand.ts`.
- Defaults ("Make it now"): style `clean`, tone `professional`, format `story`, all four cards.
- Tool calls on the Year card come from `activity.toolCalls` only (stats-cache), never mixed with `tools.calls`.
- Every question in SKILL.md is an AskUserQuestion with at most 4 questions per screen and 4 options per question.
- PNG file names: `cards/<style>-<card>-<format>.png`; README card: `readme-card.svg` and `readme-card.png` in the output folder.

## Review Focus

1. **Copy containing HTML in a card line or the title.** Expect it shown as text in every style. Test: Task 3 `every style escapes copy` (matrix with `<img src=x onerror=alert(1)>`).
2. **A light user** (one day, no transcripts, one month). Expect skipped cards (Growth, maybe Toolkit) and a story with the rest; no "NaN", "undefined", "{". Test: Task 2 `sparse stats skip cards` and Task 7 `story with one card`.
3. **Long names and big numbers** (an MCP tool like `mcp:Claude_Browser`, a model id with a date suffix, Dutch number format "128.631"). Expect short readable names and no overflow. Test: Task 2 `tool and model names are shortened`; overflow checked by eye in Task 10.
4. **Switching style after a first render.** Expect the story to link only PNGs of the current style. Test: Task 8 `story links only the current style's PNGs`.
5. **Captions with quotes, ampersands or non-ASCII** in the X share URL. Expect an intent URL that decodes back to the exact caption. Test: Task 8 `x intent url round-trips the caption`.

---

## File structure

```
src/render/brand.ts            REPO constant
src/render/model.ts            CardId, CardModel, buildCard(), modelLabel(), toolName() (moved)
src/render/styles/style.ts     StyleId, StyleCtx, frame() (moved from slide.ts), shared footer
src/render/styles/clean.ts
src/render/styles/receipt.ts
src/render/styles/terminal.ts
src/render/styles/card.ts      + level(), rarity(), sprite() (moved from slides/card.ts)
src/render/cards.ts            renderCard(), cardDocument(), FORMATS
src/render/story.ts            story in one style
src/render/readme.ts           + repo link
src/render/captions.ts         buildCaptions() for captions.json
src/cli/render.ts              --style --cards --formats
delete: src/render/slide.ts, src/render/slides/*
tests/render/model.test.ts, styles.test.ts, captions.test.ts (new); story, readme, cli-render, copy tests rewritten; slides.test.ts and card-growth.test.ts removed
```

---

### Task 1: Copy v2

**Files:** Modify `src/types.ts` (`Copy`), `src/copy.ts`, `tests/copy.test.ts`, `tests/render/ctx.ts`, the CI fixture copy (find it with `grep -rn copy.json .github tests/fixtures`).

**Interfaces:**
- Produces `Copy` v2:
  ```ts
  interface Copy {
    schemaVersion: 2;
    vibe: 'professional' | 'fun' | 'roast';
    language: 'en' | 'nl';
    title: string;                                   // the user's title, e.g. "TypeScript builder"
    lines: { tokens: string; year: string; toolkit: string; growth: string };
    captions: { instagram: string; linkedin: string; x: string; discord: string };
  }
  ```
- `COPY_LIMITS` becomes `{ title: 22, line: 90, caption: 200 }`.
- `fillPlaceholders(text, stats, language)` unchanged.

Rules: every field required for every vibe; `lines.growth` required only when the Growth card renders (`stats.activity.byMonth.length >= 2`); digits outside placeholders, unknown placeholders, secrets and over-limit text fail as before. Old fields (`profile`, `persona`, `diary`, `awards`, `relationship`, `tokensLine`, `verdict`, `receiptFooter`, `growthLine`) are rejected with `<field>: not used since copy v2`.

- [ ] **Step 1: Write failing tests** in `tests/copy.test.ts`: `v2 copy validates` (fixture copy → ok), `schemaVersion must be 2`, `every vibe needs title, four lines and four captions`, `growth line optional without two months` (empty-home stats), `old fields are rejected` (`tokensLine` present → error `tokensLine: not used since copy v2`), `limits` (`title` of 23 chars → `title: too long (23 > 22 characters after filling)`), plus the existing digit, placeholder and secret tests ported to `lines.tokens`.
- [ ] **Step 2:** Run `npx vitest run tests/copy.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement; rewrite `funCopy`/`proCopy` in `tests/render/ctx.ts` as v2 (lines use `{tokens.yearTotal}`, `{tools.commits}`, `{files.byLanguage.length}`, `{activity.growth.factor}`).
- [ ] **Step 4:** Run `npx vitest run tests/copy.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit `"Simplify copy to a title, one line per card and captions"`.

### Task 2: Card models

**Files:** Create `src/render/brand.ts`, `src/render/model.ts`; modify `src/render/i18n.ts`. Test: `tests/render/model.test.ts`.

**Interfaces:**
- `REPO = 'github.com/Tiebe-Vaes/promptfolio'`, `REPO_URL = 'https://' + REPO`.
- ```ts
  type CardId = 'tokens' | 'year' | 'toolkit' | 'growth';
  const CARD_IDS: CardId[] = ['tokens', 'year', 'toolkit', 'growth'];
  interface CardModel {            // every string is already HTML-escaped and number-formatted
    id: CardId; index: number; total: number;     // position in the picked set, 1-based
    title: string;                                // filled copy.title
    heading: string;                              // fixed card name: "Tokens", "Year in numbers", ...
    hero: { value: string; label: string } | null;
    bars: { label: string; value: number; peak: boolean }[];   // growth only, months, 0 for quiet months
    tools: { name: string; count: string; share: number }[];   // toolkit only, top 10, share = count / top count
    items: { label: string; value: string; note?: string }[];
    total: { label: string; value: string; note: string } | null;   // year only: API value
    line: string;                                 // filled copy line for this card
    year: number;
  }
  function buildCard(id: CardId, stats: Stats, copy: Copy, picked?: CardId[]): CardModel | null;
  function modelLabel(id: string): string;        // 'claude-opus-5-5' -> 'Opus 5.5', 'claude-haiku-4-5-20251001' -> 'Haiku 4.5', 'claude-sonnet-5' -> 'Sonnet 5'
  function toolName(name: string): string;        // moved from slides/terminal.ts, plus a cut to 18 chars with "..."
  ```
- `index`/`total` count only cards in `picked` (default `CARD_IDS`) that are not null.

Content per card is the spec's "Card content" list. Skip rules: Tokens null when `tokens.yearTotal <= 0`; Year null when `prompts.count + activity.toolCalls === 0`; Toolkit null when `tools.top` is empty; Growth null when `activity.byMonth.length < 2`. Growth hero = factor only when `growth.factor >= 2`, else hero = messages total. Item with value 0 or null is left out. API total only when `apiValue.usd >= 1`, note = "estimate at API prices" plus "since <date>" when `tokens.usageFrom`. Equivalents note = "estimate". Labels for every item in `en` and `nl` in `i18n.ts`.

- [ ] **Step 1: Write failing tests**: `tokens card from fixture` (hero value `compact(yearTotal)`, items contain written and favourite model), `year card uses stats-cache tool calls` (value = `num(activity.toolCalls)`, not `tools.calls`), `year total hides under one dollar`, `toolkit lists at most ten tools with shares`, `growth bars fill quiet months` (byMonth 2026-04, 2026-06 → three bars, May 0), `growth hero is the factor from 2x`, `sparse stats skip cards` (empty-home: all four null), `index counts picked non-null cards`, `tool and model names are shortened` (`mcp:Claude_Browser` → `Claude Browser`, 30-char name → 18 chars ending `...`, the three `modelLabel` cases), `strings are escaped` (copy title `<b>` → `&lt;b&gt;`).
- [ ] **Step 2:** Run `npx vitest run tests/render/model.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Commit `"Add the four card models"`.

### Task 3: Style frame, sizes and the Clean style

**Files:** Create `src/render/styles/style.ts`, `src/render/styles/clean.ts`; modify `src/render/shell.ts` (`SIZES`: `story`, `square` 1080x1080, `wide` 1200x675, `readme`; drop `feed`, `landscape`). Test: `tests/render/styles.test.ts`.

**Interfaces:**
- `type StyleId = 'clean' | 'receipt' | 'terminal' | 'card'`; `STYLE_IDS`.
- `interface StyleCtx { stats: Stats; lang: Lang; theme: ReturnType<typeof languageColor>; size: Size; progress?: boolean; index: number; total: number }`.
- `frame(ctx, cls, inner, dark?)` as in v0.2 `slide.ts`, plus `footer(cls?)` returning `<footer class="repo">github.com/Tiebe-Vaes/promptfolio</footer>`.
- Each style module: `render(model: CardModel, ctx: StyleCtx): { css: string; html: string }`; the root element has classes `slide st-<style> card-<card> size-<size>`, and every CSS rule is scoped under `.st-<style>`.

Clean look: white, Archivo, hero number at the v0.2 token-slide size, accent on the second-biggest number, items as label/value rows, growth bars in the accent, toolkit tools as horizontal accent bars, line in Libre Franklin, footer bottom-left. Square: hero smaller, items in two columns. Wide: hero and line left half, items or bars right half.

- [ ] **Step 1: Write failing tests**: a matrix helper `forEachCombo(styles, fn)` over cards x sizes (`story`, `square`, `wide`) using fixture stats; for `clean`: `root has the exact size` (`width:<w>px;height:<h>px`), `shows the hero value`, `shows the repo link`, `every style escapes copy` (evil title and line), `assertDesignRules(html + css, { mono: false })`.
- [ ] **Step 2:** Run `npx vitest run tests/render/styles.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Commit `"Add the style frame, new sizes and the Clean style"`.

### Task 4: Receipt style

**Files:** Create `src/render/styles/receipt.ts`; extend the matrix in `tests/render/styles.test.ts` to `receipt` with `{ mono: true }`.

Look from v0.2 `slides/receipt.ts`: accent background, rotated white slip, Plex Mono, header `PROMPTFOLIO` + `heading` + year, dashed rules, items as line items, `total` in the bold total row, `line` centred below, barcode from `stats.activity.daily` (as v0.2), footer link printed on the slip. Growth bars print as a mono bar chart (one row per month, `#` blocks scaled to the peak); toolkit tools as rows with count.

- [ ] **Step 1:** Add `receipt` to the matrix; add `receipt barcode has one bar per day in range`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `"Add the Receipt style"`.

### Task 5: Terminal style

**Files:** Create `src/render/styles/terminal.ts`; extend the matrix to `terminal` with `{ mono: true }`.

Look from v0.2 `slides/terminal.ts`: dark window, three dots, prompt `~ $ promptfolio <card id>`, items as `key ..... value` rows, hero as the first row in bright white at a larger size, tools and months as accent bars, `line` after `# ` in grey, blinking caret, footer link as the last grey line. No Claude or Anthropic marks.

- [ ] **Step 1:** Add `terminal` to the matrix; add `terminal has no Claude or Anthropic marks` (no `/Claude Code|Anthropic/` outside copy).
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit `"Add the Terminal style"`.

### Task 6: Trading card style

**Files:** Create `src/render/styles/card.ts` (move `level`, `rarity`, `sprite` from `slides/card.ts`; move their tests into `tests/render/styles.test.ts`); extend the matrix to `card` with `{ mono: false }`.

Look from v0.2 `slides/card.ts`: framed card in `--deep`, name = `title` in Big Shoulders Display, level from `tokens.yearTotal`, creature window (same `sprite` for all four cards, so the pack reads as one set), `heading` under the window, items as stat rows, `line` as flavour text, bottom row `<index>/<total>` and rarity, footer link under the card. Square: card centred, zoom to fit. Wide: card left, title, heading and line right.

- [ ] **Step 1:** Add `card` to the matrix; port `sprite is deterministic`, `sprite differs for different stats`, `level formula` (yearTotal 17.7e9 → 70), `rarity thresholds`; add `card shows its pack position` (`2/4`).
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit `"Add the Trading card style"`.

### Task 7: Cards, story and README card

**Files:** Rewrite `src/render/cards.ts`, `src/render/story.ts`; modify `src/render/readme.ts`; delete `src/render/slide.ts`, `src/render/slides/`, `tests/render/slides.test.ts`, `tests/render/card-growth.test.ts`. Tests: `tests/render/story.test.ts`, `tests/render/readme.test.ts`.

**Interfaces:**
- `renderCard(style: StyleId, model: CardModel, ctx: StyleCtx): { css; html }`.
- `cardDocument(style, card: CardId, format: 'story' | 'square' | 'wide', stats, copy, assetsDir, picked?: CardId[]): string | null` (null when the model is null).
- `buildStory({ stats, copy, style, assetsDir, pngs: Set<string> }): string`: all non-null cards in `CARD_IDS` order in the given style at story size; save link to `cards/<style>-<card>-story.png` when in `pngs`, else the screenshot hint; viewer JS and CSS as v0.2.
- `readmeCard` adds the repo link bottom-right in Archivo 22px.

- [ ] **Step 1: Write failing tests**: `story shows every card in the chosen style` (receipt style → four `.st-receipt` roots on fixture stats), `story with one card` (stats where only Tokens renders → one frame, no progress gaps), `story escapes copy`, `story has no network URLs`, `save link points at the style's PNG`, `readme card shows the repo link`, `readme svg is self-contained`.
- [ ] **Step 2–4:** Run `npx vitest run tests/render` (FAIL), implement and delete the old slides, run (PASS).
- [ ] **Step 5:** Commit `"Render cards and the story in one style; retire the v0.2 slides"`.

### Task 8: Render CLI and captions

**Files:** Rewrite `src/cli/render.ts`; create `src/render/captions.ts`. Tests: `tests/cli-render.test.ts`, `tests/render/captions.test.ts`.

**Interfaces:**
- `node render.mjs --dir <out> [--style clean|receipt|terminal|card] [--cards tokens,year,toolkit,growth] [--formats story,square,wide,readme] [--no-png]`. Missing flags use the defaults (`clean`, all cards, `story`) via `??` (no parseArgs `default`). Unknown values: exit 1 naming the flag and the allowed values.
- Writes `story.html` (always), `cards/<style>-<card>-<format>.html` and `.png` for each picked card x picked non-readme format, `readme-card.svg` + `.png` only when `readme` is picked, `captions.json`. Prints every written path, absolute, one per line; a skipped card prints `skipped <card>: not enough data`.
- `pngs` for the story = the `cards/<style>-*-story.png` files that exist on disk after rendering (so earlier runs count, other styles never do).
- `buildCaptions(copy, stats): Record<'instagram' | 'linkedin' | 'x' | 'discord', { text: string; intentUrl?: string }>`: text = filled caption + `\n\n` + `REPO_URL`; `x.intentUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text)`. Before coding, confirm the intent URL against X's web intent docs and note the source URL in a code comment.

- [ ] **Step 1: Write failing tests**: `defaults render clean story cards` (no flags → four `cards/clean-*-story.html`), `picked cards and formats only` (`--cards tokens --formats square,wide` → exactly two card HTML files), `readme only when picked`, `unknown style exits 1`, `render without browser` (`PROMPTFOLIO_BROWSER=none`: story, captions.json, no PNGs, exit 0), `story links only the current style's PNGs` (create a dummy `cards/receipt-tokens-story.png`, render `--style clean` → story has no link to it), `render with browser writes PNGs at the right sizes` (`test.skipIf(!browser)`, IHDR sizes for square and wide), `x intent url round-trips the caption` (caption with `"`, `&`, `é` → `decodeURIComponent` of the query equals the text), `captions end with the repo url`.
- [ ] **Step 2–4:** Run `npx vitest run tests/cli-render.test.ts tests/render/captions.test.ts` (FAIL), `npm run build`, implement, run (PASS).
- [ ] **Step 5:** Commit `"Render picked styles, cards and formats; write captions for sharing"`.

### Task 9: Skill flow v2

**Files:** Rewrite the steps and copy rules in `plugins/promptfolio/skills/promptfolio/SKILL.md`; modify `src/cli/stats.ts` only if `--projects` must default to `hide` (check: it must work without the flag).

Steps to write, in this order, each ending on a completion criterion (spec "Flow inside the skill" is the authority):
1. Node check. 2. Doctor + privacy line; in January or February only, ask whether the recap is for last year or this year. 3. Stats (`--projects hide`, plus `--year` when last year was picked). 4. Screen 1 (Make it now / Personalise). 5. Screen 2 (style with text previews of the Tokens card built from `stats.json` numbers, tone, formats multi, cards multi with one-line descriptions using real numbers). 6. Write copy v2 in the conversation's language, validate (3 rounds max). 7. Say the PNG time, render with `--style --cards --formats`. 8. Show the folder and every printed path as markdown links (absolute paths). 9. "What now?" loop: Share (platform question, missing-format offer, caption from `captions.json`, X: open `intentUrl`; Instagram: name the PNG to send to the phone; LinkedIn and Discord: open the folder), On my GitHub profile (render `--formats readme` if missing, show `![Promptfolio](readme-card.svg)` with the folder link), Other format or style (ask which, render only that), Done (open folder, retention offer when `cleanupPeriodDays` is null or below 366, one closing line with the repo link). Opening a file or URL: `Start-Process` in PowerShell, `cmd /c start ""` in cmd or Git Bash on Windows, `open` on macOS, `xdg-open` on Linux.

Copy rules: the v2 shape, one rule per field; professional lines state a habit with its number from `strengthCandidates`; captions per platform (Instagram casual, LinkedIn factual, X short, Discord casual) without the repo link (code adds it).

- [ ] **Step 1:** Write SKILL.md. Check every AskUserQuestion screen has at most 4 questions and every question at most 4 options.
- [ ] **Step 2:** Run `claude plugin validate --strict ./plugins/promptfolio`. Expected: pass.
- [ ] **Step 3:** Dry-run the flow by hand on real data into the scratchpad: run the scripts in the SKILL order with a hand-written copy v2. Expected: every step's command works as written.
- [ ] **Step 4:** Commit `"Ask in two short screens, render only what was picked, add the share step"`.

### Task 10: Visual check on real data

**Files:** Only fixes found here, each with a test in the owning task's file.

- [ ] **Step 1:** Render every style x card x format (4 x 4 x 3 = 48 PNGs, plus the README card) on the author's real data into the scratchpad, never inside the repo.
- [ ] **Step 2:** Check each PNG against `docs/research/2026-11-27-ai-design-tells.md` items 1-28 and for overflow (long tool names, Dutch numbers, 10 tools in Wide); list each deviation.
- [ ] **Step 3:** `ui-check-all-widths` on `story.html` for each style (phone 360-430 px, desktop).
- [ ] **Step 4:** Post one Wide PNG in a Discord message to confirm the 16:9 assumption only if Tiebe does it; otherwise list it under "Not checked".
- [ ] **Step 5:** Fix, rerun, commit `"Polish styles after real-data review"`.

### Task 11: Release prep v0.3.0 (stop before publishing)

**Files:** Modify `scripts/demo.mjs`, `README.md`, `plugins/promptfolio/README.md`, `CHANGELOG.md`, `docs/ROADMAP.md`, `plugin.json`, `package.json`, `.github/workflows/ci.yml` (runtime job: `render.mjs --no-png --style receipt --cards tokens,year --formats square`), `docs/images/*`.

- [ ] **Step 1:** Demo images from invented demo data: one style overview (the Tokens card in all four styles side by side) as the README hero, plus one Wide card. Caption "Sample output (demo data)".
- [ ] **Step 2:** README usage: the two screens, the share step, formats table. CHANGELOG `0.3.0`. ROADMAP: move done items, keep the rest. Versions `0.3.0`.
- [ ] **Step 3:** Full suite once: `npm run typecheck && npm test && npm run build && git status --short plugins/`, then `claude plugin validate --strict ./plugins/promptfolio` and `claude plugin validate --strict .`. Expected: all pass, build output committed.
- [ ] **Step 4:** Commit `"Prepare v0.3.0: four styles, picked formats, share step"`. Stop: merging, pushing, publishing and making the repo public wait for Tiebe.
