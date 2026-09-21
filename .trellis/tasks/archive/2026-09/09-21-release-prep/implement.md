# Waypoint Release Preparation Implementation Plan

## Ordered Checklist

### 1. Baseline and audit

- [ ] Record the current working-tree status, active task pointer, and public
      package allowlist.
- [ ] Scan file names and file contents for credentials, tokens, private keys,
      environment files, local paths, session data, and provider secrets.
- [ ] Classify every match; block any unclassified sensitive match.

### 2. Ignore rules

- [ ] Update `.gitignore` with local runtime, developer state, editor/cache,
      build, environment, credential, and key-file rules.
- [ ] Verify `.pi/`, `.agents/`, `.trellis/`, `AGENTS.md`, local attributes,
      `.npmrc`, environment files, and representative key files are ignored.
- [ ] Confirm ignored files cannot enter the release candidate through a broad
      staging command.

### 3. Stage the release set

- [ ] Stage only package/release scaffolding and inspect the staged file list.
- [ ] Run `git diff --cached --check` and the sensitive-content scan.
- [ ] Commit as `chore: prepare Waypoint package`.
- [ ] Stage only `src/`, inspect, check, and commit as
      `feat: add Waypoint Pi extension`.
- [ ] Stage only `tests/`, inspect, check, and commit as
      `test: add Waypoint coverage`.

### 4. Verify the local release

- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run test:integration`.
- [ ] Run `npm pack --dry-run --json` and confirm only public package files are
      present.
- [ ] Inspect the three commits, `git ls-files`, ignored paths, and final
      working-tree status.

### 5. Stop for review

- [ ] Archive this release-prep task locally with `--no-commit` only after all
      checks pass, if the task lifecycle requires it.
- [ ] Report the commit IDs, file groups, audit result, package file list, and
      remaining untracked/ignored state.
- [ ] Do not run `git push`, `npm publish`, or configure a remote.

## Validation Commands

```bash
rg -n -i --hidden --glob '!node_modules/**' --glob '!.git/**' \
  '(api[_-]?key|access[_-]?token|secret|password|private[_-]?key|bearer|authorization|BEGIN .*PRIVATE KEY|ghp_|github_pat_|npm_)' .

git check-ignore -v .pi/settings.json .trellis/.runtime/sessions/example.json \
  .agents/skills/example/SKILL.md AGENTS.md .env .npmrc example.pem

git diff --cached --check
git ls-files
npm run lint
npm run typecheck
npm test
npm run test:integration
npm pack --dry-run --json
```

## Rollback Points

- Before staging: preserve the already-reviewed package state; only the planned
  `.gitignore` update is added during this task, while planning artifacts remain
  local-only.
- After each staging step: `git reset` removes index contents without deleting
  release files.
- Before review: local commits can be amended or reset; no remote exists.
- Never recover by adding ignored task/runtime files to a commit.
