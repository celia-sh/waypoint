# Task Widget Implementation Evidence

## Scope

Implemented the approved bounded task-first widget in the native Implement child.
No recursive dispatch, real model/provider call, new dependency, user configuration
write, task record write, footer/editor replacement, commit, publication or archive
was performed. Shared PRD/design/implementation/spec/evidence documents remain
owned by the main session and were not edited by this child.

Files changed:

- `src/ui.ts`: bounded native task tree, current phase summary, labeled native
  agent evidence, terminal-height-aware widget rendering.
- `src/index.ts`: transient dialog-open flag and guarded restoration, allowing
  the widget to condense during the existing Waypoint control flow.
- `tests/unit/extension-ui.test.ts`: updated normal-height expectations, dialog
  coexistence, resize/selection retention, cancellation/error restoration and
  unchanged footer/config/policy assertions.
- `tests/unit/task-widget.test.ts`: focused task-tree/evidence/render tests.
- `tests/integration/compact-status.test.ts`: task-first/status-last ordering and
  40/80/120-column by 16/24/40-row matrix.
- This separate research record.

## Presentation Decisions

- Normal height (20 rows or more): up to six task-area rows, one separating blank
  row, then existing Waypoint mode/routing/model summary; maximum eight rows.
- Below 20 terminal rows: two rows, phase/task summary followed by Waypoint status.
- No active task: one status row, even when a recent not-active task is available
  in the detailed browser.
- Normal view starts with `Task: <title>`, then typed phase evidence. Real child
  nodes use dim Unicode box connectors, phase before title, and an explicit
  archived marker when present. Grandchildren retain their ancestor indentation.
- Rendering collects only resolved native nodes, ignores duplicate references,
  skips missing records and breaks cycles. It does not create replacement nodes.
- Overflow reserves current task and phase, prioritizes active evidence, and
  requires all displayed ancestors to fit before displaying a descendant. Hidden
  task and agent rows are counted separately. Within parallel calls, running or
  unresolved runs take priority over already-returned peers.
- Agent rows are explicitly labeled `agent: trellis-...` under their owning task.
  Research stays task-scoped temporary evidence, never a fifth phase. The latest
  terminal research result can remain visible without changing phase facts.
- Concurrent typed Implement/Verify activity is shown together; in_progress by
  itself still displays Plan complete, not Implement running. Failed/cancelled/
  unknown evidence is not converted into completion. Terminal/unknown call state
  overrides stale per-run research data, preventing obsolete running/success
  claims after interruption or incompatible/error termination.
- The compact successful Check label is `Verify pass complete; final unknown`.
  The full details view retains `Verify: pass complete; final scope unconfirmed`.
  The shorter compact suffix fits the narrow root phase row without truncating
  the uncertainty statement.
- Dialog condensation is transient extension-local UI state, reset on session
  reset and restored in a generation-guarded finally block. The entire panel,
  model/thinking controls, task browser and details flow keeps the widget at two
  rows while open. Existing native SelectList sizing can therefore retain its
  surrounding-space budget. No saved setting or task/projection state was added.
- Widget height and theme output are evaluated at render time. SelectList retains
  its selected value when resized or repainted. Existing grouped panel remains.

## Verification

Final commands run after the last source/test edit:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed; 17 files checked, no fixes applied |
| `npm run typecheck` | Passed |
| `npm test` | Passed; 94 tests, 6 files |
| `npm run test:integration` | Passed; 15 tests, 4 files |

Baseline was 70 unit and nine integration tests. New coverage adds 24 unit cases
and six integration matrix cases. Tests cover empty/single/multilevel/archived/
missing/cyclic task snapshots, overflow and ancestor preservation, parallel and
concurrent runs, research nesting, preflight versus running, failure/cancellation/
unknown results and reruns, Check-pass uncertainty, unrelated task isolation,
CJK/control-byte sanitization, ANSI display widths, height changes, live getters,
theme invalidation, native list keyboard navigation and selected-value retention,
panel/selector cancellation, dialog-error restoration and untouched footer/editor
APIs. Configuration bytes and model-visible policy are unchanged by read-only
panel navigation and cancellation.

The first local test pass exposed a one-column compact Check suffix overflow at
40 columns and a traversal callback lint error; both were corrected before the
final all-green run. A subsequent code review added stale research-run and
parallel active-priority regressions before final verification.

Integration stderr still reports the existing, expected native Trellis 0.6.17
explicit-thinking=off forwarding diagnostic. This work did not alter compatibility
or forwarding behavior.

## Remaining Main-Session Verification

These are component/host-fixture tests, not new rendered-screen PTY captures.
The main session must perform fresh native Pi PTY checks at 40x16, 80x24 and
120x24 (plus resize), opening the grouped panel while the new tree is present,
reaching all actions, scrolling detailed evidence, cancelling selectors and
confirming the normal widget returns without displacing the native footer.
Previous panel screenshots do not establish this taller widget's behavior.

The main session also owns the separate native Check, including the earlier
panel refinement whose previous Check was interrupted, and shared spec/artifact
updates. No final review, real-provider routing validation or release readiness
is claimed by this implementation record.
