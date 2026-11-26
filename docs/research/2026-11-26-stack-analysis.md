# Stack analysis: rendering, runtime, distribution

Date: 2026-11-26. Outputs needed: (A) tap-through HTML story, (B) PNG cards written straight to a folder (9:16, 4:5, 1.91:1), (E) README card (SVG, ideally animated).

## TL;DR

- Claude Code's native installer does not need Node, so `npx` is not guaranteed on a user's machine ([install docs](https://code.claude.com/docs/en/install)). Most developers still have Node, but the skill must check for it.
- A system Chrome or Edge can render HTML straight to PNG with one command and no packages. Tested here: Edge rendered a 1080x1920 card with grid, gradients and backdrop blur to a chosen path in 2.4 s ([Chrome headless CLI](https://developer.chrome.com/docs/automation-and-testing/headless-cli)).
- That allows one template system (HTML/CSS) for both the story (A) and the PNGs (B), with full CSS instead of Satori's flexbox subset.
- The README card (E) is the odd one out: GitHub shows SVG through `<img>`, so CSS animation works but JavaScript and external fonts do not ([MDN: SVG as an image](https://developer.mozilla.org/en/SVG/SVG_as_an_Image), [GitHub discussion](https://github.com/orgs/community/discussions/151372)).
- Recommendation: a zero-dependency runtime. Plain Node scripts inside the skill folder, HTML templates, PNG export with the system browser, and in-browser export as a fallback. TypeScript and tests stay dev-only.

## Rendering options

| Option | Output | CSS power | User install | Windows | Notes |
|---|---|---|---|---|---|
| R1 Satori + resvg-js | SVG + PNG | Flexbox subset, no grid, font files needed | 2 npm packages (resvg has native prebuilds) | Yes | Deterministic, no browser. Text becomes paths, good for README SVG. Second template system next to the HTML story. ([satori](https://github.com/vercel/satori)) |
| R2 Takumi | PNG/JPEG/WebP | Satori-like, narrower selectors | npm (Rust/WASM) | Yes | Claims 2-10x faster than Satori (own benchmarks). No SVG output, Nuxt docs say use Satori for SVG. ([takumi](https://github.com/kane50613/takumi), [Nuxt OG renderers](https://nuxtseo.com/docs/og-image/renderers/takumi)) |
| R3 System Chrome/Edge `--headless=new --screenshot` | PNG | Full CSS (same as story) | None if Chrome/Edge/Chromium exists | Edge is on every Windows | One process per card, about 2.4 s each (tested). Fonts must be embedded in the HTML for the same look on every OS. No Safari option on Mac. |
| R4 puppeteer-core with system browser | PNG, PDF, video frames | Full CSS | 1 npm package | Yes | One launch for all cards, can wait for fonts. Version-matching caveat with non-bundled browsers ([pptr config](https://pptr.dev/guides/configuration)). Full Puppeteer/Playwright downloads a browser (~150 MB+), too heavy. |
| R5 In-browser export (modern-screenshot / html-to-image) | PNG from the open story | Most CSS, foreignObject quirks | None | Yes | User clicks "save". Known Safari and CORS issues. Good fallback, not good as the only path for (B). |
| R6 Canvas (@napi-rs/canvas, skia-canvas) | PNG | Draw by hand | Native npm package | Yes | Every element placed by code. Hard to design nice cards. Dropped. |
| R7 Remotion | MP4/WebM | Full (React in Chrome) | Heavy, downloads headless Chrome | Yes | Right for video (v2). GitHub Unwrapped used it ([repo](https://github.com/remotion-dev/github-unwrapped-2023)). License terms for companies need checking. |

README SVG (E) choices:
- Hand-written SVG template with CSS animation and a base64 `@font-face` subset font (needs a test on GitHub: data-URI fonts inside `<img>` SVG are unverified).
- Satori-generated SVG (text as paths, no font risk) plus hand-added CSS animation.
- Plain PNG (no animation, zero risk).

## Runtime and distribution options

| Option | Needs on user machine | Install size | Notes |
|---|---|---|---|
| D1 npm package via `npx` | Node + network on first run | Small | Familiar. Not guaranteed with native Claude Code install. |
| D2 Plain `.mjs` scripts inside the skill folder, no npm deps | Node 18+ | Tiny, ships with the skill | No `npm install`, no network, nothing to audit. Skill checks `node -v` and explains if missing. |
| D3 Bun single binary per OS | Nothing | 50-90 MB per platform ([bun docs](https://bun.com/docs/bundler/executables)) | Unsigned binaries trigger SmartScreen/Gatekeeper warnings. Release pipeline for 5 targets. |
| D4 Python via `uvx` | uv | Small | Satori unavailable. Fewer Claude Code users have uv than Node. |
| D5 Claude parses logs with its own tools | Nothing | None | 1.1 GB of logs here: slow, expensive, not repeatable, not testable. Dropped. |

Install paths for the skill itself: plugin marketplace (`claude plugin marketplace add` then `claude plugin install`) or `npx skills add` (skills.sh). Both are one command. See `2026-11-26-direct-competitors-legal-tech.md`.

## HTML story build

- Ship as one self-contained file (data, fonts, CSS, JS inlined) so it opens offline by double-click.
- Author in vanilla HTML/CSS/JS, or author with Vite and bundle into one file (`vite-plugin-singlefile`). Vanilla keeps the template readable for the render step; Vite helps if the story grows.
- Motion: CSS transitions and keyframes first; motion.dev only if CSS cannot do a specific effect. Holo/tilt card effect is doable in CSS plus a few lines of pointer/gyro JS.

## Machine check (this PC)

Node 22.22.2, Bun 1.3.14, Python 3.14.7, Edge and Chrome installed. Claude Code installed via npm.

## Open checks before building

1. Data-URI fonts inside an SVG shown by GitHub `<img>`.
2. Chrome/Edge path detection on macOS and Linux (and Chromium, Brave, Arc as fallbacks).
3. `--screenshot=<path>` behaviour on Chrome stable on macOS (tested only on Edge/Windows).
4. Instagram story safe zones (top/bottom margins) from an official Meta page.
