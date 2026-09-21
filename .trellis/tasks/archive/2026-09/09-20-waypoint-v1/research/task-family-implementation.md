# Task-Family Implementation Handoff

## Scope

Implemented the approved presentation revision on 2026-09-20 as the native
`trellis-implement` child. No child agents were dispatched. Comparison baseline: a disposable snapshot from the repository's pre-change
state (the repository had no initial commit).

Product changes:

- `src/trellis.ts`: active-lineage-first resolution, reciprocal native edge
  validation, containing unfinished family root, live-reference priority before
  archive lookup, scoped completed-record filtering and explicit diagnostics.
  Record reads remain bounded to 64 attempts and traversal to 16 edges. Reference
  processing is separately bounded to 4096; archive month lookup remains bounded
  to 240. Unresolved reads are not exact hidden-task counts. Closed records are
  retained only when required to connect live/current context. Recent-directory
  inode reconciliation and native pass projection semantics are unchanged.
- `src/ui.ts`: English title-first inline states, ASCII current marker/connectors,
  task-only branches, active-path priority, deep breadcrumb/nearest-subtree
  fallback, bounded expanded/collapsed rendering and family-only Show completed
  browser state. Completed browsing resets on exit. Long CJK titles retain current
  marker and state at 40/80/120 columns. ANSI resets produced by Pi truncation
  are stripped before applying display sanitization/theme callbacks.
- `src/index.ts`: one Alt+W registration plus panel action, expanded-by-default
  in-memory preference, task-switch retention and session/runtime reset. Short
  terminals and dialogs (including native ui_prompt events) temporarily condense
  without changing the preference. Shortcut/UI failures remain isolated.
- `README.md`: documents family scope, evidence labels, closed filtering,
  transient controls, size bounds and terminal/conflict fallback.

Unchanged relative to the baseline: `src/config.ts`, `src/models.ts`,
`src/routing.ts`, package metadata/dependencies. No generated integration edits,
real task/pointer/demo edits, user configuration/keybinding changes, footer/editor
replacement, model request or persisted presentation state. Task-owned checklist
and this handoff are the only Trellis artifact edits from this implementation.

## Tests Changed

- New `tests/unit/task-family.test.ts`: native family switches, reciprocal-link
  failures, malformed/cyclic/closed boundaries, archive ambiguity, 90 related
  archive references before live siblings, 250 unrelated corrupt archive records,
  required closed context, depth bounds and unchanged task bytes.
- `tests/unit/task-widget.test.ts`: replaces obsolete mixed phase/agent-branch
  layout assertions with the approved task-only view. Retains coverage for
  dispatch versus running, parallel/adverse/unknown evidence, reruns, research
  without phase mutation, completed Check uncertainty, CJK widths, theme/height
  refresh, current-marker priority, deep/overflow rows and renderer failures.
- `tests/unit/extension-ui.test.ts`: transient shortcut/panel/dialog/session
  behavior, running native evidence during toggle, no-op/non-TUI cases, completed
  browser scope/reset and existing transaction/error boundaries.
- `tests/unit/trellis.test.ts`: native relation fixtures now include reciprocal
  parent facts; existing path/session/projection tests remain intact.
- `tests/integration/compact-status.test.ts`: title-first Started state and current
  marker remain visible across the nine width/height combinations.
- `tests/integration/pi-runtime.test.ts`: loads real Pi/native Trellis/Waypoint
  into temporary projects; invokes Pi's actual setupExtensionShortcuts,
  CustomEditor.handleInput and shortcut-help rendering. Alt+W toggles the family,
  Alt+O remains registered, the unsent draft/history/native/config bytes remain
  unchanged, and the model-request spy remains unused. Host methods receive a
  simulated terminal/UI context; this is not a real PTY test.
- `tests/integration/package-boundaries.test.ts`: adds only `node:util` to the
  import allowlist for standard-library ANSI stripping, retaining all forbidden
  dispatch/network/model/tool/write assertions.

## Verification

Final commands all passed:

| Command | Result |
| --- | --- |
| `npm run lint` | 18 files, no findings |
| `npm run typecheck` | Passed |
| `npm test` | 118 tests across 7 files |
| `npm run test:integration` | 16 tests across 4 files |
| `npm pack --dry-run --json` | 8 entries: README, package.json, six src modules |
| `python3 .trellis/scripts/task.py validate 09-20-waypoint-v1` | Both manifests passed, six entries each |

Manifest validation also prints the pre-existing warning that the recorded `main`
branch does not exist in the unborn repository. No branch operation was performed.

The new checks caught and fixed a width bug during development: truncation adds
ANSI reset bytes, which must not be passed back through the external-text
sanitizer. The final passing totals supersede earlier failing development runs.

## Remaining Main-Session Verification

- Independent review and native `trellis-check` over the entire revision.
- Real rendered-screen PTY probes at 40x16, 80x24 and 120x24: selected grandchild,
  current marker, completed filtering, unrelated archive, deep/overflow families,
  Alt+W/panel controls, resize/dialog restoration and unchanged native footer/draft.
- Update frontend/backend specs only after that review and evidence.
- No claim about actual terminal Alt delivery, live-provider routing judgment or
  the pending Strong dogfooding exercises is added by these offline tests.

No commit, push, publication, archive, pointer change or demonstration cleanup was
performed or implied.
