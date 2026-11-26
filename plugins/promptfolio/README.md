# Promptfolio

**Your year with Claude Code, as a recap you can post.** Promptfolio reads your local Claude Code logs, works out your year in numbers, and has Claude write a persona and strengths from what you actually did. Nothing leaves your machine except what Claude reads in your own session.

```text
111 days building with Claude Code
- Tests as habit: 1,094 test runs
- Ships: 700 commits made from sessions
- Researches first: 652 web searches
Most edited: TypeScript, across 11 languages
```

*A real professional recap, v0.1 text output. Story slides and share cards (Instagram story, LinkedIn, README card) arrive in v0.2.*

## Install

In Claude Code:

```bash
claude plugin marketplace add Tiebe-Vaes/promptfolio
claude plugin install promptfolio@promptfolio
```

Or with the skills CLI:

```bash
npx skills add Tiebe-Vaes/promptfolio
```

Then type `/promptfolio`, answer five quick questions, or type **go** for the professional version.

Needs Node 18.3 or newer. Claude Code's native installer does not install Node, so check with `node -v`.

## What you get

| Vibe | What it writes |
|---|---|
| **Professional** | A tidy overview and three strengths backed by numbers: tests run, commits, languages, streaks, tooling you built |
| **Fun** | A class, a special move, a weakness, Claude's diary about you, awards, your relationship status with Claude |
| **Roast me** | The same, honest enough to sting |

English and Dutch. Every number in the text comes from code, never from the model: Claude writes `{tools.testRuns}` and Promptfolio fills in the value, so the numbers are always right.

## Privacy

- **The scripts make no network requests.** A test (`tests/offline.test.ts`) fails the build if network code appears.
- **What is read:** `~/.claude/stats-cache.json`, `~/.claude/history.jsonl`, `~/.claude/projects/**/*.jsonl`, and counts from `~/.claude/skills`, `agents` and `settings.json`. Set `CLAUDE_CONFIG_DIR` to use another folder.
- **What Claude sees:** a redacted `stats.json` and `sample.json`. Project names become "Project A, B, C" by default, paths never leave, and a secret scan drops anything that looks like a key, token or email, in every mode. Prompt text is counted, never copied.
- **Where output goes:** `./promptfolio-<year>/` in your current folder.

## Good to know

- **Detailed stats cover about 30 days.** Claude Code deletes full session logs after 30 days by default (`cleanupPeriodDays`). Year-wide counts come from its own daily summary; tokens, tests and commits come from the logs still on disk. Promptfolio says which period each number covers and offers to raise the setting so next year is complete.
- **Equivalents are estimates.** Anthropic publishes no energy or water figure per prompt, so energy and water use Google's published Gemini figure, labelled as such.
- **Not affiliated with Anthropic.** Promptfolio is an independent open-source project.

## Development

```bash
npm install
npm test
npm run build   # bundles src/cli into plugins/promptfolio/skills/promptfolio/scripts
```

Development needs Node 22.12+. The shipped scripts have no dependencies and run on Node 18.3+; CI checks both.

## License

[MIT](LICENSE)
