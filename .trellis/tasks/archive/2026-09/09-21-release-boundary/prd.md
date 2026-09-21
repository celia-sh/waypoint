# Correct Git Release Boundary

## Goal

Correct the distinction between the Git repository and the npm package before
any push. Keep the Trellis project source of truth in Git, while keeping the
published npm package limited to Waypoint runtime files.

## Confirmed Facts

- The native Trellis project convention versions `.trellis/` in Git.
- Trellis uses `.trellis/.gitignore` for local developer identity, current-task
  pointers, runtime/session state, temporary files, and Python cache.
- This repository's `.trellis/` contains project workflow, specs, tasks,
  archived task evidence, and workspace state.
- The current root `.gitignore` incorrectly excludes `.trellis/`, `.pi/`,
  `.agents/`, `AGENTS.md`, and `.gitattributes`.
- Runtime code resolves the repository from the current project context and
  uses configured Pi/session directories; it has no hardcoded current-machine
  path.
- Existing task and research records contain outside-location references from
  prior investigations; those references are not acceptable as final Trellis
  context.
- When outside information is unavoidable, the repository must retain only a
  standalone, redacted summary of facts, constraints, uncertainty, and impact;
  it must not retain a source locator or ask a future agent to open an outside
  file.
- The npm package uses `package.json.files` and can remain limited to Waypoint
  runtime files regardless of Git contents.

## Requirements

- Remove the root ignore rules that hide versioned Trellis project files.
- Preserve the nested `.trellis/.gitignore` rules for runtime and personal
  developer state.
- Audit `.trellis/`, `.pi/`, `.agents/`, `AGENTS.md`, and `.gitattributes` for
  credentials, outside locations, session data, and other local-only material.
- Persist the repository-context-summary rule in `.trellis/spec/guides/` and
  link it from the guide index.
- Include the reviewed Trellis project files and Pi/Trellis integration in Git.
- Rewrite archived task/research records into standalone summaries before Git
  inclusion. Do not retain outside paths or source locators, even as citations.
- Keep actual runtime/session/developer-local files out of Git.
- Keep the npm package allowlist unchanged and verify that Trellis files remain
  absent from `npm pack --dry-run`.
- Rewrite the local release history into logical commits without changing
  runtime behavior or pushing to a remote.
- Leave the repository at a review gate before `git push`.

## Acceptance Criteria

- [ ] `.trellis/workflow.md`, `.trellis/spec/`, `.trellis/tasks/`,
      `.trellis/workspace/`, `.trellis/scripts/`, `.pi/`, `.agents/`,
      `AGENTS.md`, and `.gitattributes` are trackable and the reviewed project
      files are included in the final Git tree.
- [ ] `.trellis/.runtime/`, `.trellis/.developer`, `.trellis/.current-task`,
      session/runtime markers, temporary files, and Python caches remain ignored.
- [ ] No credential, token, private key, environment secret, outside
      filesystem path, source locator, or unrelated user-local state is tracked
      in Trellis context.
- [ ] Any unavoidable outside fact is represented only by a repository-local
      summary that includes facts, constraints, uncertainty, impact, and a
      redaction check.
- [ ] The npm package still contains only the approved nine public package files.
- [ ] Local history contains logical package, source, tests, and Trellis project
      commits with inspectable boundaries.
- [ ] Lint, typecheck, unit tests, integration tests, package dry-run, ignore
      probes, path audits, and tracked-content audits pass.
- [ ] No GitHub remote is configured, and no `git push` or npm publish occurs.

## Out of Scope

- Publishing to npm or pushing to GitHub.
- GitHub Actions or release automation.
- Changes to Waypoint runtime behavior, routing, task semantics, or Trellis
  generated integration contents.
- Completing `00-bootstrap-guidelines`.
- Including Node dependencies, build output, raw Pi session logs, or external
  temporary fixtures.
