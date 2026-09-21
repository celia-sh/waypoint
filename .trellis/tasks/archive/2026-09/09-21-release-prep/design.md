# Waypoint Release Preparation Design

## Release Boundary

The public repository is the npm package source. Its root release set is:

- `package.json`
- `package-lock.json`
- `README.md`
- `LICENSE`
- `src/`
- `tests/`
- `tsconfig.json`
- `biome.json`
- `vitest.config.ts`
- `.gitignore`

Local Trellis, Pi, agent, and developer-instruction state is outside this
boundary:

- `.trellis/`
- `.pi/`
- `.agents/`
- `AGENTS.md`
- the local Trellis `.gitattributes` file

The working tree currently has no commits, so the release history must be
created from the untracked public files rather than reconstructed from a prior
baseline.

## Sensitive-Information Audit

Audit both names and contents before staging:

- names: `.env*`, `.npmrc`, credentials, secrets, private keys, certificates,
  local settings, session/runtime files;
- contents: API keys, bearer tokens, passwords, private-key blocks, credentialed
  URLs, user-home paths, session identifiers, and provider secrets;
- generated/local state: `.trellis/.runtime`, `.trellis/tasks`, `.pi/settings.json`,
  and agent workspace files.

Known fixture values such as `local-fixture-only` are test data and remain only
in tests. Any unexpected match blocks staging until classified and removed or
ignored.

## Ignore Strategy

Keep existing dependency/build rules and add rules for:

- local Pi/Trellis/agent state and developer instructions;
- editor/OS/cache/log output;
- environment and credential files;
- local certificate/key formats.

Use negation only for an intentional example file if one is added later. Verify
rules with `git check-ignore -v` and verify the release candidate with
`git status --ignored` and `git ls-files`.

## Commit Shape

Create exactly three commits:

1. `chore: prepare Waypoint package` — `.gitignore`, package metadata and lock,
   README, LICENSE, and TypeScript/test tooling configuration;
2. `feat: add Waypoint Pi extension` — `src/`;
3. `test: add Waypoint coverage` — `tests/`.

Stage each allowlisted group explicitly. Never use `git add .` while local
Trellis and agent directories are present. Inspect the staged name list and
`git diff --cached --check` before every commit.

## Review Gate

After the three commits, inspect:

- `git log --oneline --decorate -3`;
- `git show --stat --summary HEAD~2..HEAD`;
- `git ls-files` and sensitive-pattern scans;
- `npm pack --dry-run --json`;
- all quality checks.

Do not create or update a remote and do not push. The user reviews the local
commit series before any later publishing action.

## Rollback

Before deletion or staging, retain any existing local backup artifacts and
new release-prep task artifacts. If staging is wrong, reset the
index without altering the working files. If a commit must be redone before
review, use a local reset/recommit only; no remote history exists yet.
