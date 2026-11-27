# AI design tells: what makes a UI, landing page or share card look generated

Research date: 2026-11-27. Scope: visual and copy tells, with extra attention to what Claude (Anthropic) tends to produce, and what design skills recommend instead. Sources are listed at the end. Where a claim comes only from a blog or a summary, this file says so.

## TL;DR

- The most consistent tells are the default palette (purple-to-blue or purple-on-white gradients), the default font (Inter, Roboto, Arial, system fonts), and the default layout (centered hero, then three equal rounded feature cards).
- Anthropic's own cookbook says Claude "will almost always conform to Inter fonts, purple gradients on white backgrounds, and minimal animations" without guidance (sourced from the claude.com article, see Sources). This is the strongest first-party evidence for a Claude-specific look.
- Anthropic attributes the convergence to "distributional convergence": safe, common choices dominate. Telling the model to avoid one default makes it pick another (Space Grotesk recurs).
- Decorative chrome is the second family of tells: eyebrow labels above every heading, tracked all-caps micro labels, "01 / 07" numbering, pill badges, gradient text, glow, glassmorphism, sparkle icons, decorative blobs.
- Emoji used as icons, and mixed icon styles, read as unfinished. One icon set with one stroke weight fixes most of it.
- Copy tells are mostly vocabulary and rhythm: "Unlock", "Elevate", "seamless", "Build faster. Ship smarter.", "not just X, it's Y", rule-of-three lists, and em dashes used as a reflex.
- Fake social proof and placeholder content (John Doe, round-number stats, vague testimonials, lorem ipsum) are strong trust killers.
- Good share cards and year-in-review screens work because they have one focal number, real personal data, a clear type scale, and a brand-specific color idea. Spotify Wrapped is the reference pattern (big numbers as the device, one stat per story).
- Most design skills (Impeccable, Hallmark, Anthropic's frontend-design skill) agree on the fix: commit to a point of view, pick one or two distinct typefaces, use one accent, vary radii and layouts by role, and spend boldness in one place.
- The frequency numbers floating around the web (for example "90% of the time") are anecdotal. Treat the list below as a ranked heuristic, not measured data.

## 1. Ranked visual tells

Ranking is by how often sources name a tell and how strongly they tie it to generated output. "Claude-specific" means Anthropic's own cookbook or article names it. Otherwise the tell is attributed to design skills or community write-ups that describe generic AI output, and Claude is one of the models that produce it.

| # | Tell | Why it reads as AI | Better alternative | Claude-specific? | Source |
|---|------|--------------------|--------------------|------------------|--------|
| 1 | Purple-to-blue or indigo-to-purple gradients (often on white) | The most-cited tell. Traced to Tailwind's indigo defaults; the gradient is the "average" of what models have seen. | Solid brand colors, or a two-tone gradient tied to the product. Gradient on at most one element. | Yes. Anthropic's cookbook names "purple gradients on white backgrounds" as a default. | [Anthropic cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics), [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells) |
| 2 | Inter (or Roboto, Arial, system fonts) for everything | Unchosen default. Nothing signals a decision. | One distinctive display face plus a body face, clearly different in character. Use weight extremes (200 vs 800) and size jumps of 3x, not 1.5x. | Yes. Named by Anthropic as "Never use: Inter, Roboto, Open Sans, Lato, default system fonts." | [Anthropic cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics), [Impeccable README](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md) |
| 3 | Centered hero, then three equal rounded feature cards | The "triptych" layout. Predictable, content-free. | Asymmetric or 60/40 editorial hero, one large card plus smaller ones, or a bento with varied spans where the content has real hierarchy. | Yes. Described as the house layout of Claude output. | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [Claude cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics) |
| 4 | Cards inside cards, and a card around everything | Boxes are used as a default container, not for real groupings. | Cards only for real groupings. Use spacing, rules and type for the rest. | Not named specifically | [Impeccable README](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md), [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 5 | One border-radius and one soft grey shadow on everything (uniform rounded-2xl) | No hierarchy in the shape language. | Vary radii by element type (small controls, larger panels, sharp editorial blocks). Light or no shadow for flat elements. | Partly. Anthropic's cookbook notes "cookie-cutter" layouts. | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list), [Hallmark-style tells in Impeccable](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md) |
| 6 | Eyebrow label (tracked all-caps kicker) above every heading | Filler chrome; repeats on every section. | Use a kicker only where it adds meaning. Otherwise let the heading stand. Sentence case, not tracked caps. | Not Claude-specific. Named by Hallmark and in Impeccable's anti-pattern list. | [Hallmark README](https://raw.githubusercontent.com/Nutlope/hallmark/main/README.md), [Impeccable docs](https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns) |
| 7 | Gradient text on headlines | Decorative effect with weak legibility. | Single-color headline. One accent word via weight or an underline, not a gradient. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 8 | Emoji as icons | Free to produce, so models reach for them. Renders inconsistently. | One SVG icon library (Lucide, Phosphor, Feather) with one stroke weight. Or no icon. | Not named specifically | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list), [Impeccable README](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md) |
| 9 | "Sparkles" icon and magic-wand metaphors for AI features | Shorthand for "AI", now a cliche. | Icon that shows the actual action (search, summarize). | Not named specifically | Community write-ups; no primary source found |
| 10 | Glassmorphism on every panel | Blur and translucency everywhere; hurts contrast. | At most one translucent element per page. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 11 | Dark mode with neon glow | Glow on every element, glowing body text, near-black with one acid-green accent. | Glow on one accent. No glow on body text. Dark background tinted to the brand, not #111 by default. | Partly. Anthropic's skill guidance names "near-black background with a single acid-green or vermilion accent" as a cliche. | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list), [Anthropic frontend-design guidance as fetched](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md) |
| 12 | Pill badges everywhere ("New", "Beta", a pill above every section) | Chrome that carries no information. | Badges only for real status. | Not Claude-specific | [Hallmark README](https://raw.githubusercontent.com/Nutlope/hallmark/main/README.md) |
| 13 | Tiny uppercase tracked labels, wide letter-spacing on body | Hard to read, visually noisy. | Default spacing for body. Tighten display text. Caps only for short labels. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 14 | Numbered "01 / 07" chrome on sections | Numbers with no order are decoration. | Numbers only when the content is an actual sequence. | Not Claude-specific | [Impeccable README](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md) (summary) |
| 15 | Decorative blobs, scattered shapes, decorative background images | Filler texture that does not carry meaning. | Layered gradient atmosphere or a geometric pattern tied to the subject. Real screenshots or imagery. | Yes for the "solid backgrounds" part: Anthropic says Claude "tends to use solid colors" and recommends atmosphere instead. | [Anthropic cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics), [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 16 | Generic hero + three feature cards + testimonial row + email sign-up at the end | The template. Hallmark names "an email sign-up at the end of every page" as a tell. | Lead with the product or the subject. Cut sections that have no content. | Partly | [Hallmark README](https://raw.githubusercontent.com/Nutlope/hallmark/main/README.md) |
| 17 | Fake testimonials, "John Doe" names, round-number stats, fake brand names | Obvious placeholders; destroy trust. | Real or clearly anonymized customers; specific figures (not "10,000+"). | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 18 | Lorem-like filler and weightless headlines | Says nothing. | Specific copy that says who the product is for. | Not Claude-specific | [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 19 | Monospace for small data labels with no reason | Signals "tech" without a reason. | Monospace only for code or truly tabular numbers. Use tabular figures in a normal sans if you need alignment. | Not Claude-specific | [Impeccable docs](https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns) |
| 20 | Too many font weights and sizes; same weight everywhere | Flat hierarchy or noisy hierarchy. | Two to four weights. Use weight extremes to build hierarchy. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list), [Anthropic cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics) |
| 21 | Low-contrast gray text (especially on colored backgrounds) | Fails WCAG AA; looks washed out. | 4.5:1 minimum for text. Gray only on neutral backgrounds. | Not Claude-specific | [Impeccable README](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md), [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 22 | Centered everything (headings, body, buttons) | Centered body text is hard to read and feels generic. | Align by purpose. Left-align body text. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 23 | Scroll fades and fade-up on every element, hover transitions on every card | Motion for its own sake. Anthropic's guidance prefers one orchestrated page load. | One staggered page-load sequence, or motion that shows a state change. Respect reduced motion. | Yes. Anthropic's skill guidance says to prefer "one well-orchestrated page load with staggered reveals". | [Anthropic cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics), [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 24 | Rainbow or glowing animated borders, endlessly looping animation | Attention-seeking motion. | Static borders. Animate only to show state. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| 25 | Equal-weight footer columns, identical section padding, identical `<hr>` dividers | Uniform rhythm. | Vary padding and layout by section weight. | Not Claude-specific | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |

Notes on the ranking:

- Rows 1 to 3 are the only ones with a first-party Anthropic statement attached. They are the strongest Claude-specific tells in this file.
- Rows 6 to 14 are chrome: they add decoration and labels without information. They show up in share cards and dashboards as much as in landing pages.
- Row 9 (sparkles) has no primary source. It is listed because it is a very frequent community complaint.

## 2. Copy tells in UI text

| Tell | Example | Why it reads as AI | Better pattern | Source |
|------|---------|--------------------|----------------|--------|
| Filler verbs | "Unlock", "Empower", "Leverage", "Elevate", "Supercharge" | Vague promise, no action | A concrete verb: "Export", "Track", "Split" | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| "Seamless", "effortless", "robust" | "A seamless experience" | Says nothing measurable | Name the specific thing that is easier | [Wikipedia AI vocabulary list](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) lists "robust" and similar words |
| Weightless headline | "Build faster. Ship smarter." | Could be any product | Say who it is for and what they get | [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells) |
| "Not just X, it's Y" | "It's not just a tracker, it's a companion." | Negative parallelism is a known model pattern | State the claim directly: "A tracker that also tells you what changed." | [Wikipedia: Signs of AI writing, negative parallelisms](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| Rule of three | "Fast, secure, and beautiful" | Reflexive triplets | Use the number of items you actually have | [Wikipedia: rule of three](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| Em dashes everywhere | "Your data — private — stays yours" | Overuse is a listed indicator | Commas, periods, or split the sentence | [Wikipedia: overuse of em dashes](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| Marketing verbs | "Our app features and offers..." | Puffery in place of plain "has" | "It has..." or name the feature | [Wikipedia: avoidance of basic copulatives](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| Significance puffery | "a pivotal role", "a testament to" | Inflated importance | Show the fact that matters | [Wikipedia: significance puffery](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| Throat-clearing welcome | "Welcome to the future of..." | Says nothing; delays the value | Lead with the value | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| Title Case for everything | "Get Started With Your Account" | Reads as a template | Sentence case; Title Case only for proper nouns | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| Arrow in links and buttons | "Read more →" on every link | Decorative tic | Plain label; arrow only on navigation that moves forward | [Anthropic frontend-design guidance as fetched](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md) |
| Middle-dot meta strings | "Free · Fast · Private" | Chrome with no meaning | Let the fact stand alone, or use a list where order matters | [Anthropic frontend-design guidance as fetched](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md) |
| "WORD — fragment" labels | "Insight — your year" | Em dash used as a label separator | Colon or plain line break | [Anthropic frontend-design guidance as fetched](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md) |
| Fake precision | "Saves 73.4% of your time" with no basis | Looks measured, is not | Real number with its source, or no number | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| Vague testimonials | "This changed everything for our team!" | Unverifiable | Specific outcome with a named, real person | [Laith ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list) |
| Cheesy taglines | "Where ideas take flight" | Empty image | Say what the thing does | [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells) |

Caveat: the Wikipedia guide lists "tapestry", "delve", "showcase", "pivotal", "crucial", "foster" and similar words as AI vocabulary. It does not mention "unlock", "elevate" or "seamless". Those come from design-blog lists, not from the Wikipedia page.

## 3. What good share cards and year-in-review screens do

The pattern across Spotify Wrapped, Letterboxd Wrapped and the developer wrap tools:

- One focal number. Spotify embraces oversized "BANs" (big-ass numbers) over complex charts, and frames each story around the one stat that would make a viewer stop ([Figures & Figures on Wrapped](https://figuresandfigures.substack.com/p/how-spotify-wrapped-nails-data-storytelling), [UX Design on Wrapped](https://uxdesign.cc/why-is-spotify-wrapped-so-popular-5c503e79a3ee)).
- Real personal data, interpreted. The attraction is the insight, not the export: "What you can make attractive is the insights" ([Springboard-derived piece via Yahoo](https://www.yahoo.com/news/decoding-spotify-wrapped-data-driven-200112364.html)).
- Narrative sequence. Wrapped presents stats as a story with a beginning and an end, not as a static report ([Brand Hopper case study](https://thebrandhopper.com/2025/06/10/a-case-study-on-spotify-wrapped-the-storytelling-phenomenon/)).
- Type as shape. The 2024 Wrapped returned to bold type on flat color, and treated numerals and letters as shape elements. The 2021 edition, with distorted type, lost legibility ([Alex Jimenez, Wrapped 2024 design review](https://alexjimenezdesign.substack.com/p/three-design-elements-that-made-spotify)).
- A brand-owned color. Each Wrapped year uses a palette that belongs to the campaign, not to a template ([Spotify newsroom](https://newsroom.spotify.com/?p=37865)).
- Shareable by design. Letterboxd's 2025 Wrapped is credited with exportable images sized for stories and feeds and a unique link per recap ([The Tab](https://thetab.com/2026/01/02/it-can-be-confusing-so-heres-how-to-see-your-letterboxd-wrapped-for-2025), a lower-quality source; see the caveat). Treat this as a community observation.
- A useful test from a Product Hunt maker: will the user share it, is it interesting, and will they be proud or surprised ([Product Hunt, GitHub Wrapped 2025](https://www.producthunt.com/p/github-wrapped-2024-your-year-in-code/github-wrapped-2025)).

Not verified in this research: Strava's year-in-sport design. A search returned nothing usable, so no Strava claim is made here.

GitHub Unwrapped: there is no official GitHub product found. The results are third-party tools (GitWrap 2025, DevWrapped 2025, GitHub Compiled 2025). One third-party article raises a privacy concern: these tools use only public API data and offer no opt-in for contributors whose repos are featured ([DEV Community, GitHub Wrapped 2025](https://dev.to/programmerraja/spotify-wrapped-but-for-developers-introducing-github-wrapped-2025-21lm) and [News LAVX on developer dashboards](https://news.lavx.hu/article/unwrapping-your-github-data-the-rise-of-personal-developer-dashboards); the privacy point is from a single lower-profile source). For Promptfolio, that is a relevant point to design for: show only what the user chooses to share.

## 4. Checklists from the design skills

### Impeccable (pbakaus/impeccable)

Impeccable is an open-source design skill for coding agents. Its README names these anti-patterns: "Inter for everything", "Purple-to-blue gradients", "Cards nested in cards", "gray text on colored backgrounds", and "a rounded-square icon tile above every heading". It also calls out a "tasteful default" of a cream page, thin serif, italic accent and pill buttons as its own cliche. It has a rule-based detector (the README gives 62 deterministic rules, with `overused-font` as one example) that runs via `npx impeccable detect` ([README](https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md)). The mirror of its docs at mintlify lists typography, color and layout anti-patterns, including an "all caps eyebrow above every heading", "meta strings joined with middle dots", "WORD — fragment" labels, and a "monospace face for small data labels" ([Impeccable docs mirror](https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns)). Note: the mintlify page returned HTTP 410 on a direct fetch in this session. The list above comes from the search-indexed copy, so check the primary repo before quoting it.

### Hallmark (Nutlope/hallmark)

Hallmark (MIT, May 2026) is a SKILL.md for Claude Code, Cursor and Codex. Its gates are tiered: a floor that never ships (contrast, focus, reduced motion, invented facts, broken phone layout), reflex defaults a model falls into and can be overruled with a reason, and finish items that never block a ship. Its named tells include an eyebrow label above every heading, tracked-capital labels, one colored word in a headline, a hero that does not fit the screen, an email sign-up at the end of every page, and a form that shows "thanks" without sending anything ([README](https://raw.githubusercontent.com/Nutlope/hallmark/main/README.md)). Install: `npx skills add nutlope/hallmark`.

### Anthropic frontend-design skill (anthropics/skills)

Anthropic's own guidance (cookbook and claude.com article) says the defaults to avoid are: Inter, Roboto, Arial, system fonts; purple gradients on white; predictable layouts and cookie-cutter components; solid backgrounds where atmosphere would work. It recommends one distinctive font used decisively, a cohesive palette with dominant colors and sharp accents, CSS-first motion with one staggered page load, and layered atmospheric backgrounds ([Anthropic cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics), [claude.com article](https://claude.com/resources/articles/improving-frontend-design-through-skills)). The Tessl review of the skill calls it strong on concept but light on concrete code examples ([Tessl review](https://tessl.io/registry/skills/github/anthropics/skills/frontend-design/review)).

A fetch of the raw `anthropics/skills` SKILL.md returned a longer list of do and don't items (for example "Avoid the warm cream background with serif display and terracotta accent", "gradient washes as decoration", "identical rounded cards", "Avoid the same soft grey shadow", "Accenting a single word or phrase in a headline", "all caps labels", "A tracked-out ALL-CAPS eyebrow label above every heading"). The wording reached this research through the fetch summarizer, not as a verbatim copy. Verify the exact lines against the repo before quoting them.

### Laith ban list (ux-skill wiki, community)

Community list with the most complete category split: default purple-to-blue gradients, glow on every element, heavy drop shadows on flat cards, gradient text, glassmorphism on every panel, neon text glow, one border radius everywhere, Inter for body and display, heavy serif on every headline, Title Case for all copy, all-caps body text, wide letter-spacing on body, everything centered, same font weight everywhere, headlines wrapping 5 to 6 lines, three equal cards in a row, centered hero stack, identical section padding, identical card heights, uniform 12-column grid, filler verbs, round-number stats, fake brand names, John Doe placeholders, emoji as decoration, mixed icon styles, hover-only tooltips on touch, animating width and height, 600ms animations on routine actions, linear easing, autoplaying video with sound, spinners for loading ([Anti-AI slop ban list](https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list)). Use it as a checklist, not as evidence.

### Wikipedia: Signs of AI writing

Used for the copy section: AI vocabulary (vibrant, tapestry, showcase, pivotal, crucial, enhance, foster, robust, delve), significance puffery, marketing verbs, negative parallelisms, rule of three, and em-dash overuse ([Wikipedia](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)). Wikipedia itself says these signs are not proof on their own.

## 5. Good-practice summary (what to do instead)

- Pick a point of view before you style. One sentence: what is this product or share card about, and what single feeling should it leave?
- Two typefaces at most, clearly different in character. Use weight extremes and large size jumps for hierarchy.
- One brand color plus neutrals. One accent, used sparingly. Solid color beats gradient unless the gradient carries meaning.
- Spend boldness in one place: one hero move, one big number, one signature motion.
- Vary shape language by role: a sharp editorial block, a rounded control, a flat divider. Do not put one radius on everything.
- Cards only for real groupings. Use rules, spacing and type otherwise.
- One icon set, one stroke weight. No emoji as icons.
- Real content: named customers, specific numbers with sources, real screenshots or real data.
- Motion: one orchestrated entrance; state-change motion only; reduced-motion respected.
- Check contrast (4.5:1 for body text) and touch-friendly tap targets before you call it done.

## Promptfolio do/don't checklist (dark and light share cards with big numbers)

Do:
1. Lead with one big number. Everything else supports it.
2. Use real data from the user's year, with the unit and the period written next to it.
3. Pick one accent color derived from the user's own data or a brand palette, not a purple default.
4. Use one display face for the number and one body face for labels. Keep the number at 3x or more the label size.
5. Use weight extremes for hierarchy (800 for the number, 400 for the label).
6. Keep text at 4.5:1 contrast on both dark and light backgrounds; test both themes.
7. Make the card legible at phone width without horizontal scroll.
8. Give each stat one sentence of plain-language meaning, not a slogan.
9. Vary the card layout between slides or sections: one large number, one short list, one comparison.
10. Use flat color or subtle texture for atmosphere; if you use a gradient, use it on one element only.
11. Show a clear share action and a clear download action, both plain-labelled.
12. Use sentence case for headings and labels.

Don't:
13. Don't use purple-to-blue or indigo-to-purple gradients as the default background.
14. Don't set the headline in Inter, Roboto, Arial or the system font.
15. Don't add an eyebrow label above every heading or a "01 / 07" counter on every slide.
16. Don't use gradient text, glassmorphism, neon glow, or glowing body text.
17. Don't put emoji in place of icons; use one SVG icon set with one stroke weight.
18. Don't center every line; left-align body text and captions.
19. Don't use round-number stats or invented figures. If a number is not in the data, don't show it.
20. Don't write filler copy ("Unlock your year", "Elevate your habits", "seamless").
21. Don't use "not just X, it's Y" or rule-of-three taglines as a template.
22. Don't use em dashes as a reflex; use a colon, a comma, or a new line.
23. Don't nest cards inside cards.
24. Don't use gray text on a colored background below 4.5:1 contrast.
25. Don't animate every card on hover or fade every element on scroll; one entrance sequence is enough.
26. Don't use monospace for labels unless the content is code or a true data table.
27. Don't add decorative blobs, scattered shapes or stock photos.
28. Don't show a share image that the user did not approve; show only the data the user chooses to share.

## Sources

Primary and near-primary:

- Anthropic, "Coding prompting for frontend aesthetics" (Claude cookbook): https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics
- Anthropic, "Improving frontend design through Skills" (claude.com): https://claude.com/resources/articles/improving-frontend-design-through-skills
- anthropics/skills, frontend-design SKILL.md (raw, fetched via summary; verify exact wording): https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
- pbakaus/impeccable README (raw, fetched via summary): https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md
- Impeccable docs mirror, anti-patterns (returned HTTP 410 on direct fetch; search-indexed copy): https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns
- Nutlope/hallmark README (raw, fetched via summary): https://raw.githubusercontent.com/Nutlope/hallmark/main/README.md
- Wikipedia, "Signs of AI writing": https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing

Community and secondary:

- Laith0003/ux-skill, "Anti AI slop ban list" wiki: https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list
- 925 Studios, "AI Slop Fonts and Gradients: The Tells That Give Away AI Design": https://www.925studios.co/blog/ai-slop-design-tells
- Tessl review of anthropics/skills frontend-design: https://tessl.io/registry/skills/github/anthropics/skills/frontend-design/review
- Alex Jimenez, "Three Design Elements That Made Spotify Wrapped 2024 Great": https://alexjimenezdesign.substack.com/p/three-design-elements-that-made-spotify
- Figures & Figures, "How Spotify Wrapped nails data storytelling": https://figuresandfigures.substack.com/p/how-spotify-wrapped-nails-data-storytelling
- UX Design, "Why is Spotify Wrapped so popular?": https://uxdesign.cc/why-is-spotify-wrapped-so-popular-5c503e79a3ee
- Brand Hopper, "A Case Study on Spotify Wrapped: The Storytelling Phenomenon": https://thebrandhopper.com/2025/06/10/a-case-study-on-spotify-wrapped-the-storytelling-phenomenon/
- Spotify newsroom, 2025 Wrapped: https://newsroom.spotify.com/?p=37865
- The Tab, Letterboxd Wrapped 2025 how-to: https://thetab.com/2026/01/02/it-can-be-confusing-so-heres-how-to-see-your-letterboxd-wrapped-for-2025
- Product Hunt, GitHub Wrapped 2025: https://www.producthunt.com/p/github-wrapped-2024-your-year-in-code/github-wrapped-2025
- DEV Community, GitHub Wrapped 2025 write-up: https://dev.to/programmerraja/spotify-wrapped-but-for-developers-introducing-github-wrapped-2025-21lm

Gaps and caveats:

- No Strava year-in-sport source was found.
- No primary GitHub Unwrapped source was found; the GitHub results are third-party tools.
- The "90% of the time" and "3,033 complaints" figures circulating online are unverified and are not used as evidence here.
- Several direct fetches returned summaries rather than verbatim text. Quotes marked "as fetched" should be checked against the live repo before they are reused in public copy.
