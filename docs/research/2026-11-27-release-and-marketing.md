# Promptfolio: release and marketing research

Date: 2026-11-27. Scope: how well-received Claude Code plugins, skills and small developer CLIs are released, distributed and launched, and what Promptfolio should copy.

Method and limits: primary sources first (Claude Code docs, skills.sh docs, GitHub READMEs, Product Hunt pages). Star counts and upvotes come from the snapshot each page showed on the day of the fetch and disagree between sources, so they are rough. I did not find a Show HN thread for ccusage or for cc-wrapped, and I could not search Reddit directly, so launch-channel claims below are limited to what the sources show.

## TL;DR

- Distribute through a Claude Code marketplace repo: `.claude-plugin/marketplace.json` in a public git repo is enough to publish, with no submission form ([Claude Code docs: publish](https://code.claude.com/docs/en/plugins/publish)).
- Users then run two commands: `claude plugin marketplace add <owner>/<repo>` and `claude plugin install <name>@<marketplace>` ([Claude Code docs: publish](https://code.claude.com/docs/en/plugins/publish)).
- Anthropic's directory (claude.ai/directory/manage) needs a paid claude.ai plan and is a separate, optional route ([Claude Code docs: publish](https://code.claude.com/docs/en/plugins/publish)).
- skills.sh is a leaderboard fed by anonymous CLI install telemetry, not a registry with a sign-up form; a skill appears once people install it from a public GitHub repo ([skills.sh docs](https://www.skills.sh/docs); [Vercel blog](https://vercel.com/blog/building-a-self-driving-skills-sh-leaderboard)).
- The best-known tools open the README with a screenshot of the tool's own output, a one-line pitch, and an install command within the first screen ([ccusage](https://github.com/ryoppippi/ccusage); [cc-wrapped](https://github.com/levifig/cc-wrapped); [code-wrapped](https://github.com/htin1/code-wrapped)).
- Caveman led with its headline numbers and social proof (citations, a Hacker News ranking) before the install step ([caveman README](https://github.com/JuliusBrussee/caveman)). Promptfolio's version of this is its privacy statement plus a sample card.
- Privacy is a selling point only when it is stated plainly and verifiable. ccusage documents its one daily telemetry ping and how to disable it, which is the level of detail to match ([ccusage README](https://github.com/ryoppippi/ccusage)).
- Wrapped-style tools in this niche are launched on Product Hunt and GitHub; the Product Hunt numbers I could see were small (Year in Code had 14 upvotes in a day snapshot, Caveman 260 points) ([Year in Code](https://www.producthunt.com/products/year-in-code); [Caveman launch](https://www.producthunt.com/products/caveman-claude-code-skill-plugin/launches/caveman)).
- Awesome lists take contributions by pull request or issue, and the most-starred list restricts PRs to collaborators, so submit by the list's own process rather than a PR ([awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)).
- Ship a `version` in `plugin.json` on every release (or omit it and let the commit SHA drive updates), validate with `--strict`, and never rename the plugin after launch ([Claude Code docs: publish](https://code.claude.com/docs/en/plugins/publish)).
- Use a GitHub social preview of 1280x640 and topics on the repo ([GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)).

## 1. Release anatomy of well-received tools

Snapshot values are from the fetch date. "Stars" is what the repo page showed.

| Tool | Type | README opening | Install placement | Demo asset | License | Stars (snapshot) | Notes |
|---|---|---|---|---|---|---|---|
| [superpowers](https://github.com/obra/superpowers) | Claude Code plugin / skills library | Intro, table of contents, then "How it works" | Installation section with one subsection per harness; Claude Code points to the official and Superpowers marketplaces | None visible in extracted text; repo has an `assets` folder | MIT | about 327.5k | Lists its own marketplace; has `RELEASE-NOTES.md` and `.version-bump.json` |
| [ccusage](https://github.com/ryoppippi/ccusage) | Usage/cost CLI (reads local logs) | Logo and terminal-report screenshot (PNG), then one-line pitch | `npx ccusage@latest` right after badges, before features | Static PNG screenshot | MIT | not captured in fetch; the search snippets cited about 7.2k | Badges for npm version and downloads; a privacy/telemetry section; a `.tagpr` release setup |
| [caveman](https://github.com/JuliusBrussee/caveman) | Claude Code skill/plugin | Banner image, bold pitch, badges, then four headline metrics | `npx @caveman-ai/cli@latest` after the first demo; more install routes lower down | Side-by-side table of a normal reply and a caveman reply | Apache-2.0 per README; sidebar also lists MIT (conflict to resolve before copying its pattern) | 123.1k (fetch); its own Product Hunt page says 24.9k; treat as unreliable | Social proof block directly under the stats; a Hacker News #1 claim comes from its own promotion |
| [cc-wrapped](https://github.com/levifig/cc-wrapped) | Wrapped-style CLI (local) | Tagline, then screenshot | Quick Start `npx cc-wrapped` right after the hero | Static PNG | MIT (short section near bottom) | 0 (repo sidebar) | Privacy line "No data is sent anywhere. Everything is processed locally." sits in a "Data Source" section; releases automated with semantic-release |
| [code-wrapped](https://github.com/htin1/code-wrapped) | Wrapped-style CLI (Anthropic admin API) | H1, screenshot, one-sentence pitch crediting Cursor's yearly review | Setup right after the pitch | Static PNG, plus a `--demo` mode that needs no credentials | Linked MIT file | 0 (sidebar) | Needs an `ANTHROPIC_ADMIN_KEY`; README does not say what data leaves the machine |
| [Year in Code](https://www.producthunt.com/products/year-in-code) | Browser Wrapped-style tool | Product Hunt listing | Web app | Product Hunt media | not captured | not captured | Says it is processed in the browser; 14 upvotes in a Dec 27, 2025 daily snapshot ([aitoolly daily list](https://aitoolly.com/producthunt-daily/2025-12-27)) |
| [claude-code-wrapped (PyPI)](https://pypi.org/project/claude-code-wrapped/) | Python Wrapped-style CLI | PyPI page | `uvx` or `pip` | Terminal flow | not captured | not captured | Multiple PyPI versions published (0.1.0 to 0.1.10 in search results); a separate `claude-wrapped` package also exists |
| [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Curated list | List-style README | n/a | n/a | not captured | not captured | Has CONTRIBUTING.md and a `templates` folder; PRs limited to collaborators per the page |
| Anthropic `claude-plugins-official` | Official marketplace | n/a | n/a | n/a | n/a | n/a | Not open to directory-portal submission; partner contact needed ([publish docs](https://code.claude.com/docs/en/plugins/publish)) |

Patterns across these:

- **Hero asset:** Almost all Wrapped-style tools use a static PNG of their own output, not a GIF. This is the "show the result first" pattern the Wrapped format depends on.
- **Install line early:** ccusage, cc-wrapped and code-wrapped put the command in the first screen. Superpowers puts installs in a separate section because it supports many harnesses.
- **Badges:** ccusage carries the most (npm version, npm downloads, plus third-party badges). Superpowers shows none in its extracted text. Badges are optional; the install line and screenshot do more work.
- **Privacy:** cc-wrapped states it in one sentence. ccusage has a full telemetry section. code-wrapped's admin-key requirement is the opposite of a privacy signal, and it does not explain data flow.
- **Versioning:** superpowers keeps `.version-bump.json` and release notes; ccusage uses tagpr; cc-wrapped uses semantic-release. Each tool automates tags rather than editing version numbers by hand.
- **Caveman's launch order:** Stats and social proof came before the install command. This copies well for a tool with measurable results; Promptfolio's equivalent would be sample output.

## 2. Official distribution checklist

### Claude Code plugin marketplace

- A marketplace is a directory or git repo with `.claude-plugin/marketplace.json`. The file requires `name`, `owner` and `plugins`. Each plugin entry needs `name` and `source` ([Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces); [marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference)).
- The plugin manifest is `.claude-plugin/plugin.json`. Only `name` is required, in kebab-case ([manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference)).
- The entry `name` and the manifest `name` must match. A mismatch causes `Plugin "<name>" not found in marketplace` errors ([Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces)).
- For a plugin in the same repo as its marketplace, use `"source": "./"` ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Users add it with `claude plugin marketplace add <owner>/<repo>` and install with `claude plugin install <name>@<marketplace>`. In-session: `/plugin install <name> --marketplace <owner>/<repo>` (requires Claude Code v2.1.275 or later) ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Validate with `claude plugin validate --strict ./<plugin>` (and on the marketplace directory). `--strict` fails on warnings such as a missing `version` ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Give the marketplace a name other authors are unlikely to pick. Two marketplaces cannot share a name, and the official names are reserved ([publish docs](https://code.claude.com/docs/en/plugins/publish); [Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces)).
- Versioning: bump `version` on every release, or omit `version` in a git-hosted marketplace so the commit SHA is used. If `version` is set and not bumped, `claude plugin update` reports "already at the latest version" ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Tag releases with `claude plugin tag --push`, which creates `{name}--v{version}` tags ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Never rename a published plugin. Use the `renames` map in the marketplace file if a rename is unavoidable ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Metadata users see: `description`, `author`, `homepage` (must be a URL) and `repository` in `plugin.json`, plus a `README.md` at the plugin root ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Optional: an eval suite run with `claude plugin eval` ([publish docs](https://code.claude.com/docs/en/plugins/publish)).

### Anthropic's directory (optional)

- Submit at claude.ai/directory/manage. Submitting needs a paid claude.ai plan (Pro, Max, Ultra, or an Owner on Team/Enterprise). Run `claude plugin validate ./your-plugin --strict` first ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- The portal applies rules the CLI does not check, so a clean local run does not guarantee approval ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
- Some components are Claude Code-only and do not load on claude.ai; check the component support table before submitting ([publish docs](https://code.claude.com/docs/en/plugins/publish)).

### skills.sh

- skills.sh is described as a leaderboard, not a registry. Listing follows from installs: a skill is published by putting it in a public GitHub repo, and it appears once people install it ([Vercel blog](https://vercel.com/blog/building-a-self-driving-skills-sh-leaderboard); [skills.sh docs](https://www.skills.sh/docs)).
- The ranking uses anonymous telemetry from the `skills` CLI. The docs say it "only tracks which skills are being installed" ([skills.sh docs](https://www.skills.sh/docs)).
- Install command: `npx skills add <owner>/<repo>`; `--skill` picks one skill from a repo ([skills.sh docs](https://www.skills.sh/docs); [vercel-labs/skills](https://github.com/vercel-labs/skills)).
- Automated review: Vercel says installed skills are reviewed automatically and suspicious ones are hidden from rankings and search, though still reachable by direct URL ([Vercel blog](https://vercel.com/blog/building-a-self-driving-skills-sh-leaderboard)).
- Badge markup: `[![skills.sh](https://skills.sh/b/owner/repo)](https://skills.sh/owner/repo)` ([skills.sh docs](https://www.skills.sh/docs)).
- Required SKILL.md frontmatter and folder layout are in the CLI's creating-skills doc, which I did not fetch. Verify before publishing ([vercel-labs/skills](https://github.com/vercel-labs/skills)).
- Telemetry opt-out for CLI users: `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` ([vercel-labs/skills](https://github.com/vercel-labs/skills)).

### Awesome lists

- hesreallyhim/awesome-claude-code has a CONTRIBUTING.md; the page says only collaborators can create PRs. Read CONTRIBUTING.md and its issue templates before submitting ([awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)).
- Chat2AnyLLM/awesome-claude-skills says contributions go through pull requests ([search result](https://awesome.ecosyste.ms/projects/github.com%2FChat2AnyLLM%2Fawesome-claude-skills)).
- The jqueryscript/awesome-claude-code list has about 30.1k stars and links the Anthropic-managed directory ([search result](https://github.com/jqueryscript/awesome-claude-code)).
- ccusage's README carries a "Mentioned in Awesome Claude Code" badge, which suggests listing there is a visible credibility marker ([ccusage README](https://github.com/ryoppippi/ccusage)).

## 3. Launch playbook

### Where tools were announced

- **Product Hunt:** Caveman launched on Product Hunt on April 14, 2026 and placed 6th for the day with 260 points ([Caveman launch](https://www.producthunt.com/products/caveman-claude-code-skill-plugin/launches/caveman)). Year in Code launched on Product Hunt in late December 2025 with a small count ([Year in Code](https://www.producthunt.com/products/year-in-code); [daily list](https://aitoolly.com/producthunt-daily/2025-12-27)).
- **Hacker News:** Caveman's README claims a Hacker News #1 ranking ([caveman README](https://github.com/JuliusBrussee/caveman)). A write-up reports 212 upvotes and 153 comments in a few hours ([Member-only write-up via levelup](https://levelup.gitconnected.com/i-tried-caveman-hit-a-wall-and-ended-up-sending-a-pull-request-to-a-65k-star-repo-8dc8952dcd59)). Treat both as secondary. An older Show HN for a Claude Code usage monitor reached 235 points ([HN item 44317012](https://hn.svelte.dev/item/44317012)).
- **Dev.to and Medium write-ups:** Several reviews and tutorials covered ccusage and caveman ([DEV: caveman review](https://dev.to/andrew-ooo/caveman-review-the-claude-code-skill-that-cuts-65-of-tokens-2boe); [Simon Willison on ccusage](https://simonwillison.net/2025/Jul/14/ccusage/)). Simon Willison's linkblog counts as independent coverage.
- **Reddit and X:** I could not check r/ClaudeAI or r/ClaudeCode directly, so I have no sourced evidence for which Reddit posts worked.
- **Discord and LinkedIn:** No sourced evidence found.

### Timing

- Wrapped-style tools in the search results appeared in late December 2025 (Year in Code's maker posted about 15-17 days before the snapshot; the daily list is dated December 27, 2025) ([Year in Code](https://www.producthunt.com/products/year-in-code); [daily list](https://aitoolly.com/producthunt-daily/2025-12-27)). Product Hunt's own "Product Hunt Wrapped 2025" led that same daily list with 335 upvotes ([Product Hunt newsletter archive](https://www.producthunt.com/newsletters/archive/46626-product-hunt-wrapped-2025)).
- This suggests the Wrapped season is a crowded window. I did not find a source that gives the best launch day, so treat "early December" as a hypothesis to test rather than a fact.

### What performed well (from the sources)

- A screenshot or card of the tool's own output in the README and in the launch post ([cc-wrapped](https://github.com/levifig/cc-wrapped); [code-wrapped](https://github.com/htin1/code-wrapped)).
- A "run one command" hook: `npx ccusage@latest` and `npx cc-wrapped` appear in the first screen ([ccusage](https://github.com/ryoppippi/ccusage); [cc-wrapped](https://github.com/levifig/cc-wrapped)).
- Headline numbers before the install step, plus citations and a Hacker News claim ([caveman README](https://github.com/JuliusBrussee/caveman)).
- A "no data leaves your machine" statement, repeated in the README and the launch post ([cc-wrapped](https://github.com/levifig/cc-wrapped); [Year in Code](https://www.producthunt.com/products/year-in-code)).
- A demo mode that needs no credentials, so people can try it without setup ([code-wrapped](https://github.com/htin1/code-wrapped)).

### What flopped or hurt (from the sources)

- Requiring an admin-level credential (code-wrapped's `ANTHROPIC_ADMIN_KEY`) without explaining the data flow. This makes privacy-minded readers stop ([code-wrapped](https://github.com/htin1/code-wrapped)).
- A tool whose privacy claim turned out to be partial. A community Obsidian plugin reads local logs but also makes one request per poll to api.anthropic.com, so a "local only" claim would be false for it ([search result on Obsidian token-usage plugin](https://community.obsidian.md/plugins/claude-usage)).
- Duplicate name collisions. Several unrelated packages use the ccusage name, and the PyPI package "ccusage" is a different tool ([npm ccusage](https://npmjs.com/package/ccusage); [PyPI ccusage](https://pypi.org/project/ccusage/)). Pick a name that does not collide.
- A launch with almost no traction. Year in Code's 14-upvote day snapshot suggests a launch without a community hook does not get attention on its own ([daily list](https://aitoolly.com/producthunt-daily/2025-12-27)).

## 4. Trust and privacy signals for tools that read local logs

- **State the data flow in the first screen.** Example from cc-wrapped: "No data is sent anywhere. Everything is processed locally." ([cc-wrapped](https://github.com/levifig/cc-wrapped)).
- **Declare any network call.** ccusage sends at most one telemetry ping per UTC day, containing version, OS, CPU architecture, first command name and a random installation ID, and says nothing from agent logs is sent. It is off in CI and with `--offline`, and can be disabled with `ccusage telemetry disable` or `DO_NOT_TRACK=1` ([ccusage README](https://github.com/ryoppippi/ccusage)). If Promptfolio ever phones home, this is the bar.
- **Make the zero-network claim testable.** Several local dashboards in this space advertise "zero telemetry" and "zero outbound connections", and a single-file, MIT-licensed burn-rate analyzer describes itself as privacy-first ([DEV: privacy-first burn-rate analyzer](https://dev.to/geniej/how-i-built-a-privacy-first-claude-code-burn-rate-analyzer-in-a-single-html-file-48o7)). A claim like that is only worth something when the code is open and the user can check it. ccusage shows the stronger version: it documents its one telemetry ping and offers `--offline` ([ccusage README](https://github.com/ryoppippi/ccusage)). The "zero telemetry" wording comes from search snippets I did not open individually, so verify before quoting it.
- **Say what the tool reads.** Name the local paths it reads (for example the Claude Code project log folder), and say the output stays in the user's home directory. cc-wrapped writes its PNG to the home directory and can copy it to the clipboard ([search result on cc-wrapped](https://github.com/levifig/cc-wrapped)).
- **Avoid credentials.** The high-trust tools need no API key. code-wrapped's admin key is a warning sign for readers, not a feature ([code-wrapped](https://github.com/htin1/code-wrapped)).
- **Shared cards need a warning.** A share card can expose project names, model use or cost. Offer a redaction option (hide project names, hide cost) before export.
- **Questions users ask** (from the tool READMEs and listings): whether data leaves the machine, whether costs are estimates, and whether the tool reads or writes files outside its own output ([ccusage README](https://github.com/ryoppippi/ccusage); [ccusage search results](https://npmjs.com/package/ccusage)). I did not find a public comment thread for Promptfolio-like tools, so this list is based on README sections, not user comments.

## 5. Repo hygiene checklist used by top projects

- **LICENSE:** Use a standard OSS license at the repo root. The projects here use MIT (ccusage, superpowers, cc-wrapped, code-wrapped) or Apache-2.0 (caveman, with a sidebar MIT conflict) ([ccusage](https://github.com/ryoppippi/ccusage); [superpowers](https://github.com/obra/superpowers); [caveman](https://github.com/JuliusBrussee/caveman)). For a small plugin, MIT is the most common choice in this set.
- **SECURITY.md:** Not verified in these sources. Add one with a private reporting address. Treat as a recommendation, not a finding.
- **CONTRIBUTING.md:** Present in awesome-claude-code ([awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)). Keep it short.
- **Issue templates:** awesome-claude-code has a `.github` folder that may hold them; not verified ([awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)).
- **GitHub topics:** Set topics (for example `claude-code`, `claude-code-plugin`, `claude-skills`) so the repo is findable. Not verified in a source here.
- **Social preview:** Upload a 1280x640 image (2:1; minimum 640x320), PNG, JPG or GIF, under 1 MB, in Settings > Social preview ([GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)).
- **Release tags:** Tag each release. Use `claude plugin tag` and a `version` bump ([publish docs](https://code.claude.com/docs/en/plugins/publish)). Use release notes or an automated changelog (superpowers keeps `RELEASE-NOTES.md`; cc-wrapped uses semantic-release) ([superpowers](https://github.com/obra/superpowers); [cc-wrapped](https://github.com/levifig/cc-wrapped)).
- **CI badge:** Add a CI workflow that runs `claude plugin validate --strict` and tests; show the badge in the README. Not verified against a top project in these sources.

## Promptfolio release checklist

Each item is tagged: **[repo]** = a file or setting in the repo, **[listing]** = a marketplace, directory or list entry, **[launch]** = a post or announcement.

1. **[repo]** Choose a permanent plugin name in kebab-case (for example `promptfolio`). It cannot be renamed after launch ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
2. **[repo]** Add `LICENSE` (MIT recommended, matching most of the set above).
3. **[repo]** Add `.claude-plugin/plugin.json` with `name`, `version`, `description`, `author`, `homepage`, `repository` ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
4. **[repo]** Add `.claude-plugin/marketplace.json` with a unique marketplace `name`, `owner`, and one entry whose `source` is `"./"` and whose `name` matches `plugin.json` ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
5. **[repo]** Add skill files in the layout the skills CLI expects (verify SKILL.md frontmatter first) ([vercel-labs/skills](https://github.com/vercel-labs/skills)).
6. **[repo]** Add a root `README.md` with: a sample card screenshot in the first screen, a one-line pitch, the install command in the first screen, a privacy section (no network, what files are read, where output is written), a FAQ, and the license line ([ccusage](https://github.com/ryoppippi/ccusage); [cc-wrapped](https://github.com/levifig/cc-wrapped)).
7. **[repo]** Add `SECURITY.md` and a short `CONTRIBUTING.md`.
8. **[repo]** Create a 1280x640 social preview image and upload it in repo Settings ([GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)).
9. **[repo]** Set GitHub topics (claude-code, claude-code-plugin, claude-skills, wrapped, year-in-review).
10. **[repo]** Add a CI workflow that runs `claude plugin validate --strict` on the plugin and marketplace, and add its badge to the README.
11. **[repo]** Run `claude plugin validate --strict ./promptfolio` and `claude plugin validate .` locally, then install from a local marketplace to confirm it loads ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
12. **[repo]** Test the privacy claim: run with the network blocked and confirm no outbound calls. Write the result in the README.
13. **[repo]** Tag `v0.1.0` with `claude plugin tag --push` and publish a GitHub release with notes ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
14. **[listing]** Push the repo public. Users can then run `claude plugin marketplace add <owner>/promptfolio` and install ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
15. **[listing]** Install it with `npx skills add <owner>/promptfolio` and confirm skills.sh lists it after the first installs. Add the skills.sh badge to the README ([skills.sh docs](https://www.skills.sh/docs)).
16. **[listing]** Submit to awesome-claude-code and any other awesome list, following each list's CONTRIBUTING file ([awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)).
17. **[listing]** Optional: submit to Anthropic's directory at claude.ai/directory/manage (needs a paid plan) ([publish docs](https://code.claude.com/docs/en/plugins/publish)).
18. **[launch]** Write a Product Hunt listing with the sample card as the lead image and the privacy line in the tagline or first paragraph ([Caveman launch](https://www.producthunt.com/products/caveman-claude-code-skill-plugin/launches/caveman)).
19. **[launch]** Post a Show HN with the one-command hook and the "no network" test result. Link to the repo, not a landing page ([HN item 44317012](https://hn.svelte.dev/item/44317012) as a reference for the format).
20. **[launch]** Post to r/ClaudeAI and r/ClaudeCode with one of your own sample cards. Check each subreddit's self-promotion rules first (not checked in this research).
21. **[launch]** Post a short screen recording or card image on X and LinkedIn with the install command.
22. **[launch]** Publish an update after the first week with install counts and fixes (announce it in the same channels).

## Sources

- Claude Code docs, Create a marketplace: https://code.claude.com/docs/en/plugin-marketplaces
- Claude Code docs, Publish and distribute a plugin: https://code.claude.com/docs/en/plugins/publish
- Claude Code docs, Marketplace reference: https://code.claude.com/docs/en/plugins/marketplace-reference
- Claude Code docs, Plugin manifest reference: https://code.claude.com/docs/en/plugins/manifest-reference
- skills.sh docs: https://www.skills.sh/docs
- Vercel, Building a self-driving skills.sh leaderboard: https://vercel.com/blog/building-a-self-driving-skills-sh-leaderboard
- vercel-labs/skills (CLI): https://github.com/vercel-labs/skills
- obra/superpowers: https://github.com/obra/superpowers
- ryoppippi/ccusage: https://github.com/ryoppippi/ccusage
- npm, ccusage: https://npmjs.com/package/ccusage
- JuliusBrussee/caveman: https://github.com/JuliusBrussee/caveman
- Product Hunt, Caveman launch: https://www.producthunt.com/products/caveman-claude-code-skill-plugin/launches/caveman
- levifig/cc-wrapped: https://github.com/levifig/cc-wrapped
- htin1/code-wrapped: https://github.com/htin1/code-wrapped
- PyPI, claude-code-wrapped: https://pypi.org/project/claude-code-wrapped/
- Product Hunt, Year in Code: https://www.producthunt.com/products/year-in-code
- aitoolly, Product Hunt daily picks Dec 27, 2025: https://aitoolly.com/producthunt-daily/2025-12-27
- Product Hunt newsletter, Product Hunt Wrapped 2025: https://www.producthunt.com/newsletters/archive/46626-product-hunt-wrapped-2025
- hesreallyhim/awesome-claude-code: https://github.com/hesreallyhim/awesome-claude-code
- jqueryscript/awesome-claude-code: https://github.com/jqueryscript/awesome-claude-code
- Chat2AnyLLM/awesome-claude-skills (listing): https://awesome.ecosyste.ms/projects/github.com%2FChat2AnyLLM%2Fawesome-claude-skills
- Hacker News, Show HN: Claude Code Usage Monitor (item 44317012): https://hn.svelte.dev/item/44317012
- Simon Willison, ccusage (2025-07-14): https://simonwillison.net/2025/Jul/14/ccusage/
- DEV, caveman review: https://dev.to/andrew-ooo/caveman-review-the-claude-code-skill-that-cuts-65-of-tokens-2boe
- levelup, caveman write-up: https://levelup.gitconnected.com/i-tried-caveman-hit-a-wall-and-ended-up-sending-a-pull-request-to-a-65k-star-repo-8dc8952dcd59
- Obsidian community, claude usage plugin: https://community.obsidian.md/plugins/claude-usage
- GitHub docs, Customizing your repository's social media preview: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview
