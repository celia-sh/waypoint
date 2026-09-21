# Waypoint Release Preparation

## Goal

Prepare the first public Waypoint repository state for review before any GitHub
push. Separate the release files from local Trellis/agent state, audit the
release candidate for sensitive material, and create a small logical local
commit history.

## Requirements

- Inspect all release candidates for credentials, tokens, private keys,
  environment files, local paths, session data, and other private state.
- Complete `.gitignore` for local dependencies, build output, editor state,
  Pi/Trellis/agent runtime state, and common credential-bearing files.
- Keep development-only `.pi/`, `.agents/`, `.trellis/`, `AGENTS.md`, and local
  Trellis attributes out of the release commits.
- Keep the public release allowlist limited to package metadata, source,
  tests, public documentation, license, and required development configuration.
- Split the currently uncommitted repository into three reviewable local
  commits: package/release scaffolding, extension source, and tests.
- Run the release checks against the staged release content and inspect the
  resulting commit history and file list.
- Stop before `git push`; the user must review the commits and staged remote
  contents first.

## Acceptance Criteria

- [ ] No credential, token, private key, environment file, session file, local
      user configuration, or Trellis task/runtime record is in the release
      candidate.
- [ ] `git check-ignore` proves local Pi, agent, Trellis, editor, dependency,
      build, and credential paths are ignored.
- [ ] The release candidate contains only the approved public file allowlist;
      `.trellis/`, `.pi/`, `.agents/`, `AGENTS.md`, and local attributes are
      absent from `git ls-files`.
- [ ] Exactly three logical local commits are created with inspectable stats and
      no commit contains unrelated private state.
- [ ] Lint, typecheck, unit tests, integration tests, and npm package dry-run
      pass after the commit split.
- [ ] The final report includes commit IDs, the release file list, audit result,
      and the explicit fact that no push was performed.

## Out of Scope

- Pushing to GitHub or configuring a remote.
- Publishing to npm or configuring GitHub Actions.
- Changing Waypoint runtime behavior, task semantics, model configuration, or
  Trellis integration.
- Completing the independent `00-bootstrap-guidelines` task.
- Removing local dependencies or other untracked development tools.

## Decisions

- Use the npm package allowlist already verified by `npm pack --dry-run`.
- Use three commits rather than one large initial commit or many file-level
  commits.
- Keep the release task itself local-only through the existing ignored Trellis
  directory.
