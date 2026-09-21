# Task Widget Layout Research

## Request And Status

The user asked whether Waypoint should retain its one-line task summary or use
an rpiv-todo-like multiline view, with connector lines and activity under its
native phase. They also requested moving `Waypoint auto | bypassed` to the
screenshot's lower-right footer area only if Pi supports that placement.

The user approved the final task-above-status bounded layout after research and
review. Implementation and native Check are complete within that presentation
scope; user settings, installed plugins and native footer are unchanged. The
preceding grouped-panel refinement is retained. Final terminal evidence is in
`implementation-evidence.md`.

## Visual Reference

Reviewed a disposable visual reference project and its bounded overlay
implementation. It was used only to compare visual hierarchy and was not
installed, copied into the product, or retained as a production dependency.

Read the package README, `docs/overlay.md`, `todo-overlay.ts`,
`view/format.ts`, and the actual `docs/overlay.jpg` screenshot.

Relevant source-backed presentation patterns:

- `todo-overlay.ts:65` registers an above-editor widget through `setWidget`.
- `todo-overlay.ts:154` implements a short collapsed view.
- `todo-overlay.ts:177` applies a content-row budget; default is 12 content rows,
  plus one trailing spacer. It does not render an unbounded list by default.
- `todo-overlay.ts:180` prefixes rows with tree connectors and closes the last
  visible branch. Overflow receives a count summary rather than spilling offscreen.
- `view/format.ts:83` colors the active subject, mutes completed subjects and
  keeps supporting labels/IDs quiet. Completion strike-through is specific to
  its todo semantics; Waypoint's reusable phase labels should not be crossed out.

Borrow the visual hierarchy, muted connectors, selective emphasis and bounded
height. Do not copy its todo tool/state store, turn-based completion hiding,
completion fractions, dependency graph, model guidance or keyboard shortcut.
A Trellis phase is not an independently model-completed todo. Four phases are
not four equally weighted pieces of work; do not show a synthetic `2/4` score.

## Pi Footer Capability

Inspected installed Pi 0.85.1 `docs/tui.md` in full, public extension types,
`examples/extensions/status-line.ts`, `examples/extensions/custom-footer.ts`,
and `dist/modes/interactive/components/footer.js`.

- `ExtensionUIContext.setStatus(key, text)` has no slot/alignment argument.
- `footer.js:172-204` computes the built-in model/thinking text on the right.
- `footer.js:210-219` sorts extension status values by key, sanitizes whitespace,
  joins them with spaces and emits one left-aligned line.
- Padding a status string cannot create a supported right-aligned slot:
  `sanitizeStatusText` collapses repeated spaces.
- `setFooter(factory)` replaces the entire footer. It does not append a right
  accessory while preserving the host component.
- An independently positioned overlay or below-editor widget is not the same
  placement and could obscure or displace existing native/extension content.

Conclusion for this installed version: no independent lower-right footer slot.
Honor the user's explicit fallback and leave the Waypoint status in its current
above-editor location. Do not replace the native footer or insert cursor-control
escape sequences. The existing token/context/model row and other plugin statuses
remain owned by Pi.

## Approved Layout

The subsequent user messages emphasized Trellis fidelity and proposed putting the
task area above the mode/routing row, since an independent right footer slot is
unavailable. Refine the initial phase-tree recommendation accordingly: the
primary hierarchy is the native task tree, not four synthetic todo items.

Inside the existing above-editor widget, render the current native task first,
its phase/activity below, and real children with connector lines only when such
records exist. Each child displays its own evidence-derived phase/state. Label
native agent activity distinctly so it cannot be mistaken for another task.
Finish with a visually separate Waypoint mode/routing row. Do not render a fake
multi-task example in the product when the current task has no children.

Bound the normal widget to at most eight rows including a separating blank row
and mode/status. Preserve the current task/phase, retain active evidence before
idle child detail, and summarize hidden real rows. A very short terminal should
fall back to two rows (task summary first, routing summary second); without an
active task, keep at most the configuration/status row. The native footer remains
untouched. Full phase/run/tree evidence is still accessible through `/waypoint`.

Use typed `Projection.phases` and task/run evidence without inventing activity.
Actual child tasks remain native parent/children relationships, not arbitrary
todos grouped by guessed phase. Missing evidence stays unknown, a successful
Check stays pass-complete with final scope unconfirmed, and cleared pointers do
not complete Finish. No progress database, new workflow or task mutations.

The final layout is implemented with a 20-terminal-row threshold for the short
fallback. The updated UI spec and tests cover 40/80/120 columns, 16/24/40-row
behavior, long/CJK labels, theme refresh, empty/single/real-child tasks,
active/failed/cancelled/concurrent operations, session isolation and unchanged
policy/config/native footer. Fresh rendered-screen PTY checks, including panel
and selector navigation after increasing widget height, passed after native Check.

## Task-Family Revision: Live Demonstration Feedback

Status: approved for implementation after the user said "开始". The user then
clarified that this is an English project and the current marker can use ASCII.
Use English product labels and ASCII `>` / tree connectors; preserve native task
titles and CJK handling. The earlier feedback was that repeated phase labels
and mixed task/phase/agent branches were confusing. They requested meaningful hierarchy
and a bounded scope even when expanded, questioned archived-row accumulation, and
suggested a shortcut only if justified. Asked whether activating a child should
preserve parent/unfinished-sibling context or display only that child's subtree,
the user answered "前者" (the former). The containing-family scope is confirmed;
the full plan and proposed control defaults were subsequently approved. Native
Implement/Check and final main-session PTY verification are complete: 131 unit,
17 integration tests and four rendered-screen scenarios passed. Current evidence
is in `implementation-evidence.md` and `task-family-review.md`. The discussion
below records the decision and technical evidence that led to implementation.

### Native Evidence

- `.trellis/workflow.md:169` defines parents as source-requirement containers and
  children as independently planned, implemented, checked and archived deliverables.
  Tree position does not encode dependencies or execution order.
- `.trellis/scripts/common/task_store.py:1363` retains an archived child's name
  in its parent's children list. Archiving a parent clears its children's parent
  references. Do not reconstruct removed relationships from titles or history.
- `src/trellis.ts:240` starts from one session pointer and recursively reads known
  relations only. It currently has 64-node/16-depth bounds and can resolve linked
  archived records; it does not enumerate unrelated task roots for display.
  Current depth-first reads load children before parent context, so the revision
  must prioritize active ancestry before side branches and archived detail.
- `src/ui.ts:144` currently mixes task/phase/agent rows. `src/ui.ts:268` roots the
  widget at tasks.active, losing the visible parent/sibling context when a child
  is selected. `src/ui.ts:739` browses linked parents/children without a completed
  filter. These are the concrete presentation gaps, not a native task-model bug.

### Shortcut And Host Evidence

Inspected Pi 0.85.1 `docs/keybindings.md` and its linked `terminal-setup.md` in full,
the native status-line example, `ExtensionAPI.registerShortcut`,
`dist/core/extensions/runner.js:363`, and the actual editor shortcut dispatch at
`dist/modes/interactive/interactive-mode.js:1556`.

- `registerShortcut` accepts a key, description and ExtensionContext handler;
  it does not require opening a custom focused widget or triggering a model.
- The default editor dispatches extension shortcuts and native shortcut help
  includes their descriptions. Do not replace/intercept the editor to add this.
- Alt+W is absent from inspected Pi defaults; `.pi/extensions/trellis/index.ts:1862`
  owns Alt+O. Initial source checks found no Alt+W registration in the inspected
  local extensions, but configurable/other plugins can still collide.
- Pi's runner skips reserved built-in conflicts and warns about other collisions,
  with later extension registration winning for equal keys. Public ExtensionAPI
  has no full cross-extension shortcut enumeration. No universal collision-free
  guarantee is justified. Keep the panel action available and do not rewrite
  user keybindings or add a custom input interceptor.
- Terminal delivery of Alt/Option is not guaranteed. PTY testing proves Pi's
  received-key handling, not a user's terminal-level keymap. The panel remains
  the no-new-shortcut fallback; no terminal config changes are authorized.

### Proposed Direction For Final Review

Task-only connectors; title-first inline state; explicit active pointer marker;
highest valid unfinished/unarchived native ancestor as family root; no independent
roots. Exclude closed relatives from everyday collapsed and expanded views, with
explicit completed-record browsing bounded to this family in details. Unknown or
unreadable records are not completed, and inconsistent active ancestry is not
silently hidden or repaired.

Propose initially expanded to preserve the previous interaction while removing
redundancy. One Alt+W/panel toggle selects a bounded tree or a compact current-task
breadcrumb, without per-node input focus. Keep this UI-only choice in memory,
retain it across task switches, and reset on runtime/session replacement. Short
terminals/dialogs temporarily condense without overwriting it. Detailed phase,
run and final-scope evidence stays available without becoming additional tasks.

Authoritative proposed requirements: PRD R5/R9 and AC23-25. Technical tradeoffs,
active-lineage/read-budget priorities, deep-tree fallback and lifecycle rules:
`design.md` Task-Family Presentation Revision. Execution/review gates:
`implement.md` matching revision. No source/spec/runtime/config edits or product
implementation were performed while recording this proposal.
