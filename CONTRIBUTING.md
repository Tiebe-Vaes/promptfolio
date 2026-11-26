# Contributing

Thanks for helping. A few things keep Promptfolio trustworthy:

- **Test first.** Every change comes with a test that failed before it. Fixtures in `tests/fixtures` are synthetic; never commit real logs.
- **No runtime dependencies and no network code.** The shipped scripts must run on Node 18.3+ with nothing installed. `tests/offline.test.ts` guards the network rule.
- **Code owns numbers, Claude owns words.** New stats go into `src/`, get a test, and become available to the copy as `{dotted.path}` placeholders.
- **Rebuild before you commit.** `npm run build` regenerates `plugins/promptfolio/skills/promptfolio/scripts`; CI fails if they are stale.

Run `npm test` and `npm run typecheck` before opening a pull request.
