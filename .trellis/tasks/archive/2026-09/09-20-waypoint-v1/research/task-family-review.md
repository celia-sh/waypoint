# Task-Family Review

## Result And Scope

Completed the native `trellis-check` review on 2026-09-20. Reviewed the entire
approved Task-Family Presentation Revision against PRD R5/R8/R9 and AC23-25,
design/implementation artifacts, all six check.jsonl references, both layer
indexes, installed Pi 0.85.1 documentation/source and the actual native Trellis
archive implementation. No child agents were dispatched.

The repository was unborn and all product files were untracked: `git diff` was
empty and could not establish this revision. An independent disposable snapshot
was used as the comparison baseline for source, README, and changed tests. Historical mixed phase/agent branches and no-shortcut clauses
were treated as superseded by the approved revision.

No known in-scope code findings remain after the fixes below. This is a completed
code/automated Check, not rendered-screen PTY acceptance or release approval.

## Findings Fixed

1. **Narrow rows could erase the successful Check's final-scope qualifier.**
   At 40 columns, a nested row with cancelled/interrupted/unknown implementation
   evidence could end in `C pass/...` or `C pass/fi...`. The original narrow tests
   asserted the pass label but not its qualifier. `src/ui.ts` now selects whole
   full/compact/terse labels rather than slicing evidence. Under heavier pressure
   it uses a truthful adverse/activity summary, retaining `final?` whenever the
   underlying Check pass is complete. Long collapsed titles also reserve an
   abbreviated path indicator. Regression coverage spans five ancestry depths,
   expanded/short layouts, adverse states, concurrency, title/marker retention
   and display width. Full Check scope remains explicitly unconfirmed in details.

2. **Overlapping research could claim a completed pass beside a failed peer.**
   The inline research state previously used the last dispatched call's result,
   and ignored `incompleteHistory`. It now requires sound completion of the whole
   latest overlap group, preserves failed/cancelled/interrupted/unknown results,
   and treats bounded-away evidence as unknown. Added four adverse overlap cases
   and incomplete-history assertions. Native `Projection` implementation and
   phase semantics were not changed.

3. **Distant root references could starve active-lineage context.**
   Ancestor records were reserved, but root-first queue expansion consumed the
   64-record or 4096 queued-reference budget before children/siblings near the
   actual current task. `src/trellis.ts` now schedules each already verified
   lineage node from current toward root before distant branches. Native sibling
   order is restored for rendering; existing depth, record and reference bounds
   remain. New 80- and 4096-reference fixtures retain the current grandchild,
   nearby sibling and direct child, with bounded-read diagnostics rather than
   fabricated hidden-task counts.

4. **Normal archive detachment was diagnosed as corrupt family evidence.**
   Native `task_store.py` keeps the archived parent's child names but clears the
   live children's `parent` fields; those children can subsequently be relinked.
   The new reciprocal validator correctly excluded these edges but incorrectly
   emitted conflict diagnostics. The loader now recognizes explicit native
   detachment/relinking at an archived parent and does not reconstruct those
   relationships or import their new requirement. Still-reciprocal archived
   descendants remain available through scoped completed browsing. Added a
   fixture covering detached, relinked and still-linked archived children, based
   on the actual native source contract. No real archive command was run.

5. **Late prompt notifications could restart a shut-down view.**
   `ui_prompt_start/end` called `ensure()`, which could recreate observation and
   reinstall the widget after shutdown. These notification handlers now require
   an initialized TUI view with matching session/project scope; they do not start
   a lifecycle. Tests cover late start/end, obsolete contexts and Pi's actual
   queued notification wrapper, including overlapping prompt coalescing and
   completion after shutdown. Existing Waypoint-dialog generation guards remain.

## Files Changed By Check

- `src/trellis.ts`: lineage scheduling and native archive detachment handling.
- `src/ui.ts`: atomic evidence labels, overlap-safe research state and long-title
  collapsed path retention.
- `src/index.ts`: scoped, lifecycle-safe prompt notification handling.
- `tests/unit/task-family.test.ts`: three new loader cases.
- `tests/unit/task-widget.test.ts`: nine new evidence/width cases and strengthened
  existing adverse/Check assertions.
- `tests/unit/extension-ui.test.ts`: late/stale prompt notification regression.
- `tests/integration/pi-runtime.test.ts`: real Pi prompt-wrapper lifecycle test.
- This review record.

README and the other implementation-owned tests were reviewed but not changed by
Check. No layer specs or approval/checklist statuses were updated as a claim of
PTY completion.

## Verification

Eleven assertions failed in the first regression run against the implementation
handoff, establishing the findings before the product fixes. Final verification
passed after all source edits:

| Command | Result |
| --- | --- |
| `npm run lint` | 18 files; no findings |
| `npm run typecheck` | Passed |
| `npm test` | 131 tests across seven files |
| `npm run test:integration` | 17 tests across four files |
| `npm pack --dry-run --json` | Eight entries: README, package.json and six source modules |
| `python3 .trellis/scripts/task.py validate 09-20-waypoint-v1` | Both manifests passed, six entries each |

Manifest validation retains the existing warning that recorded branch `main`
does not exist in this unborn repository. No branch operation was performed.

Baseline byte comparisons passed for `src/config.ts`, `src/models.ts`,
`src/routing.ts`, package.json and package-lock.json. The trellis.ts diff leaves
`PassState`, `Projection` and `TaskObserver` unchanged. Integration retained the
native generated-source hash assertion, production ownership checks, no-model
shortcut behavior and unchanged fixture task/config/history bytes. The new
prompt-wrapper integration also asserts zero model requests. Native Alt+O,
editor and footer ownership remain intact.

The real current pointer was rechecked and still resolves to
`.trellis/tasks/09-20-waypoint-v1`. Check performed no task start/finish/archive,
real task/demo/pointer writes, generated integration edits, user configuration
or keybinding edits, package changes, commits, pushes or publication.

## Remaining Main-Session Gates

- Run fresh rendered-screen PTY probes at 40x16, 80x24 and 120x24, including
  selected grandchild, scoped completed browsing, large unrelated archive,
  deep/overflow families, Alt+W/panel controls, dialog close and resize. Verify
  unchanged native footer, unsent draft and native/config bytes, zero model
  requests and process cleanup. Host editor/shortcut/help and prompt-wrapper
  tests use simulated terminal components, not a PTY.
- Update frontend/backend specs only after recording that evidence. Existing
  presentation specs still contain historical clauses superseded by approval.
- Pi prompt notifications are best-effort and queued, not an awaited before-open
  hook. The integration verifies eventual condensation/restoration after the
  actual notification microtasks, not guaranteed first-frame layout for another
  extension's synchronous UI or terminal delivery of Alt/Option.
- Live-provider/Strong dogfooding exercises, commit approval, publication, native
  archive and demo cleanup remain separate. This Check does not certify them.
