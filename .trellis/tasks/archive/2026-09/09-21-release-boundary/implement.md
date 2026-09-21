# Correct Git Release Boundary — Implementation Plan

## Preconditions

- [ ] Keep the current task active and do not run `task.py start` until this
      plan receives explicit user approval.
- [ ] Confirm the working tree is clean apart from ignored local Trellis state.
- [ ] Confirm no Git remote is configured and record the current `HEAD`.
- [ ] Read the local Trellis ignore boundary, the repository-context-summary
      guide, and the package `files` allowlist before changing anything.

## Ordered Checklist

### 1. Persist and apply the context-summary rule

- [ ] Keep `.trellis/spec/guides/repository-context-summaries.md` linked from
      the guide index.
- [ ] Ensure every task manifest points only to an existing repository-relative
      file.
- [ ] Record outside findings only as standalone facts, constraints,
      uncertainty, consequence, and redaction result; remove source locators.

### 2. Audit the candidate project tree

- [ ] Enumerate `.trellis/`, `.pi/`, `.agents/`, `AGENTS.md`, and
      `.gitattributes`, including symlink checks.
- [ ] Scan names and contents for credentials, tokens, private keys, environment
      files, raw session logs, outside filesystem locations, source locators,
      and unrelated local state.
- [ ] Verify executable/configuration files resolve the active repository from
      cwd/session/env rather than a checked-in machine path.
- [ ] Record all redactions needed before staging.

### 3. Sanitize historical evidence

- [ ] Rewrite archived task/research prose into standalone summaries.
- [ ] Remove every outside path, source locator, machine identifier, and raw
      external excerpt; do not replace one locator with another.
- [ ] Preserve task requirements, test results, behavior, constraints,
      uncertainty, and evidence meaning.
- [ ] Re-run the path and secret audit and review every remaining match.

### 4. Correct ignore boundaries

- [ ] Remove root rules that ignore `.trellis/`, `.pi/`, `.agents/`,
      `AGENTS.md`, and `.gitattributes`.
- [ ] Preserve dependency, build, editor, environment, credential, key,
      session and cache rules.
- [ ] Verify nested `.trellis/.gitignore` still excludes runtime, developer,
      pointer, temporary and Python-cache files.
- [ ] Probe both a representative versioned file and a representative local
      runtime file with `git check-ignore`.

### 5. Rebuild the local commit series

- [ ] Create a local backup ref for the current three-commit history.
- [ ] Rewrite the first three commits if needed so the corrected root ignore
      boundary is present from the package-preparation commit onward.
- [ ] Stage only the reviewed Trellis/Pi/agent project files for a fourth
      `chore: add Trellis project context` commit.
- [ ] Inspect staged names, `git diff --cached --check`, and sensitive/path
      scans before committing.
- [ ] Ensure runtime/session files and the backup ref are not part of the
      public branch.

### 6. Run quality and package checks

- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run test:integration`.
- [ ] Run `npm pack --dry-run --json`; confirm exactly the nine approved npm
      files and no Trellis/Pi/agent project files.
- [ ] Run the tracked-content, ignore, secret, symlink and current-path audits.
- [ ] Confirm no GitHub remote, no push, and no npm publish.

### 7. Finalize the task for review

- [ ] Inspect `git log`, commit stats, tracked names, and final status.
- [ ] Archive this task with `--no-commit` only after the final evidence is
      recorded, then include the archive move in the reviewed Trellis commit if
      required for a clean tree.
- [ ] Report the final commit IDs, included/excluded boundaries, redactions,
      package file list, and the explicit push/publish stop.

## Validation Commands

```bash
git status --short --ignored
git remote -v
git log --oneline --decorate -3
find .trellis .pi .agents -type l -print
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' \
  -e '(BEGIN .*PRIVATE KEY|api[_-]?key|access[_-]?token|password|secret|bearer|authorization|ghp_|github_pat_|npm_)' \
  .trellis .pi .agents AGENTS.md .gitattributes
Review the staged Trellis context for outside filesystem locations, source
locators, machine identifiers, credentials, raw session data, and temporary
capture names. Treat every match as a classification failure until rewritten
as a repository-local summary or excluded.

git check-ignore -v .trellis/workflow.md \
  .trellis/.runtime/sessions/example.json \
  .pi/extensions/trellis/index.ts \
  .agents/skills/trellis-check/SKILL.md AGENTS.md .gitattributes

git diff --cached --check
git ls-files
npm run lint
npm run typecheck
npm test
npm run test:integration
npm pack --dry-run --json
```

## Rollback Points

- Before redaction: use the recorded clean commit and backup ref; do not delete
  task records or the demo-cleanup backup.
- After redaction: restore a file from the backup ref or `git checkout --` only
  before staging the intended Trellis commit.
- After index staging: `git reset` clears the index without removing files.
- During history rewrite: abort rebase and restore the backup ref if any commit
  boundary or file group is wrong.
- Before review: amend/reset local commits only; no remote exists.
