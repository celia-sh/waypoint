# Native Pi UI

## 1. Scope / Trigger

Use for changes to `src/ui.ts` or command/widget wiring in `src/index.ts`.
This is a Pi terminal extension, not a web frontend. Use host components and
themes; do not introduce a React/web rendering layer or another task store.

## 2. Signatures

- `/waypoint [auto|on|off|model|thinking|status]` is the only public command.
- `ViewState` carries configuration, capability diagnostics, typed native task
  data, optional transient `taskView: "focused" | "collapsed" | "full"`, and
  `routing: "enabled" | "bypassed" | "off" | "unavailable"`; it does not own
  persistent task state. Routing presentation comes from applicability and
  provider/ID identity, never a model display string.
- `canCycleTasks(state)` is true only for an active family with more than one
  eligible task row. `taskFamily(snapshot, includeCompleted?)` in `trellis.ts`
  supplies the scoped structural view.
- `compactLines(state, width, theme?, height = 24)` renders the bounded widget;
  `statusLines` and `renderStatus` expose configuration, native task metadata and
  diagnostics without execution history.
- `openPanel`, `showDetails`, `select`, `chooseModel`, `chooseMode`,
  `browseTasks` and `browseTaskPalette` build native controls. `nextTaskView`
  exhaustively cycles Focused -> Collapsed -> Full -> Focused.
- `installWidget(ctx, getState, condensed?)` installs the `waypoint` widget only
  in TUI mode; the optional getter is transient dialog state.

## 3. Contracts

Guard `ctx.ui.custom` with `ctx.mode === "tui"`; RPC can have `hasUI` without
supporting custom terminal components. Non-TUI status uses supported notification
or stderr, never an LLM message. Do not replace Pi's editor/footer or Trellis's
`alt+o` binding.

The default widget shows the current task's containing native family above the
Waypoint routing/model summary. That compact summary begins with accent-colored
ASCII `@ ` followed by the typed routing state (`enabled`, `bypassed`, `off`,
`unavailable`) in its semantic color. Do not repeat the product name or mode in
this row; mode remains explicit in the panel and full status. Preserve model
labels, same-model bypass, task notices and row/width bounds.

Keep verified unfinished parents and siblings when a child is active, never
unrelated roots or project history. Product labels are English; ASCII `>` marks
only the current pointer and ASCII `|-`, backtick-minus and `|` connect actual task
edges. Native titles are not translated. Phases and agents are not branches.
Compact task rows have no lifecycle suffix. `taskTitle(task, text, theme?)` styles
sanitized titles from record facts: planning is muted regular; a non-current
in_progress title uses regular text, while the current in_progress title is
accent/bold; and `taskClosed(task)` (completed or archived) is muted/struck.
Closed styling takes precedence over a contradictory raw status; details preserve
both facts. Custom/missing values, including review, use warning color. Trellis
0.6.17 writes planning/in_progress/completed only; review is not a fourth phase.
Current selection changes emphasis only for a non-closed in_progress title; it
never changes the raw lifecycle fact or implies execution. Children never change
a parent's lifecycle styling.

Completed/archived rows are excluded from the everyday widget and default browser.
The browser's `Show completed (N)` action appears only when this family has
related closed records, reveals only those records and resets on exit. Retain closed structural context only where removing it would
hide the active task or an unfinished branch; expose the native inconsistency.
Native archive detachment must not be reconstructed as a live relationship.

Terminals at least 20 rows high use at most eight widget rows including the
routing/model summary. Task rows directly precede the `@` line without a
Waypoint-owned blank spacer. Focused selects the current lineage, current task's
direct children and nearby sibling roots in native order and always omits their
side-branch descendants. Full traverses the complete loaded family in native
preorder, then truncates only the tail when the bounded row budget is exceeded;
it does not apply Focused's context-priority selection. Never use execution
evidence for selection. Keep `>` in a fixed left column before connectors, then
recompute connectors after trimming; overflow counts omitted resolved eligible
tasks, not hidden history or unreadable records. Deep ancestry uses an
abbreviated breadcrumb plus the nearest genuine subtree, never a fake direct
edge. Keep the current title/marker visible whenever it is within the bounded
native sequence. Bounded-read diagnostics are distinct from exact hidden-row
counts. Without a task, use one status row.

Clip external titles and breadcrumbs before theming; preserve the current title
before distant path labels. Do not introduce an
Activity row, role/run/pass result, incomplete-history warning or execution model
summary in any Waypoint view. Pi truncation may insert ANSI reset bytes: strip
these from clipped plain text before sanitizing/theming it again, without
stripping intended themed output.

Alt+W and the panel's Task View action cycle Focused -> Collapsed -> Full ->
Focused. Focused is the runtime default, so the first cycle preserves the previous
collapse interaction. Preference survives task switches but resets on reload/
session/project replacement and tree navigation. No task or only one eligible row
means a harmless shortcut and no panel action. Use native shortcut registration/
help, not an editor interceptor, new command, persisted preference or model
message.

Alt+T opens `browseTaskPalette` directly. Pi has no public API for opening its
built-in command palette, so this native `ctx.ui.custom()` component renders the
complete loaded family as a tree rather than a flat list. Once focused, its
`handleInput` owns `↑/↓` visible-row movement, Enter/Alt+D native details, Alt+C
scoped completed history and Escape; registered editor shortcuts do not run inside
that component. Left/right input is intentionally not a browser action. It shares
generation/dialog/error boundaries with panel browsing, restores focus on close
and cannot activate a task. Pi owns registered-shortcut conflicts; panel/browser
actions are the fallback for terminal Alt delivery and other extensions. Keep
Alt+O intact.

Short terminals and dialogs temporarily condense without changing preference.
`dialogOpen` retains generation-guarded finally restoration; native ui_prompt
notifications additionally condense other blocking controls. Notification handlers
require an initialized matching session/project TUI scope and must not call a
lifecycle initializer after shutdown. Pi queues these best-effort notifications:
condensation is eventual, not a guaranteed first-frame hook. Rendering failures
return a bounded diagnostic row; notification/cleanup failures do not escape.

Do not replace Pi's footer for right alignment: Pi 0.85.1 setStatus has no right
slot and setFooter replaces the whole footer. Keep editor input and footer intact.

The root panel shows aligned settings and a concise lifecycle-styled task title.
Full status and compatibility notices belong in secondary Details/Diagnostics
views; return preserves the selected root action. Auto bypass is a neutral state,
not a warning. Sanitize external text before styling. Routing labels remain
textual; raw task status remains available in details without relying on color.

The task-tree browser clips plain task rows before rendering, uses a separate
focus marker from the native `>` pointer marker, and preserves lifecycle colors
when focus moves. Never place ANSI in task data, reintroduce status descriptions,
or let focus override lifecycle colors/emphasis. Theme/state changes are read at
render time. Use host `theme.bold` / `theme.strikethrough` on already-sanitized
colored titles; do not pass their ANSI output through `plain` again. Model and
thinking selectors may continue to use the host `SelectList` and its
`styleLabel` callback.

Model selection uses searchable
`SelectList` with values mapped back to registry objects, not display-name
parsing. Thinking choices come from `supportedThinking`. Save model/thinking
together after both controls succeed. Escape cancels without writing config.
Modes are session preferences; no command changes `defaultMode`.

Read-only task browsing follows actual native parent/child paths. Native details
show task identity, raw `Task status: <value>` (`(missing)` when absent),
parent/children and read diagnostics. Emit `Archive: <ref>` only for actually
archived records. Do not add translations like `(Processing)` or an unarchived
`not observed` line. They contain no phase table, Activity,
role/run result, model/thinking, usage, tool or error history. The browser cannot
start/archive or edit a task. A reconciled recent task is labeled not active, and
native completed status is distinguished from observed archive location.

All external text goes through the display sanitization helper. Use host
`truncateToWidth`, `wrapTextWithAnsi`, `visibleWidth` in rendering/tests, not
string length for terminal display width. Call theme callbacks when rendering;
`invalidate()` must invalidate nested input/list components. Components keep
only navigation/filter state and obtain current facts through getters.

## 4. Validation & Error Matrix

| Case | Required behavior |
| --- | --- |
| Model selection cancelled or thinking cancelled | Saved model/thinking unchanged |
| Model becomes unavailable before save | Refuse the transaction with a diagnostic |
| Empty registry / unavailable effort | No inferred model or thinking default |
| Long provider/task labels, CJK, control bytes | Bound rows to terminal width; no control injection |
| 40/80/120 columns | No overflow; scroll long panel information |
| RPC/headless command | No custom dialog, no model turn |
| Session changes while a selector is pending | Ignore stale result through the generation guard |
| No active task | At most one compact configuration/diagnostic row |
| Compact routing summary | ASCII `@` and one typed routing state; no product/mode prefix or `off | off`; explicit mode retained in panel/status |
| Auto, usable equal provider/ID | Neutral `bypassed`; one shared model, no handoff arrow |
| Truncated/deep family | Current marker in a fixed left column, styled title, genuine ancestry/breadcrumb and exact resolved-eligible hidden-row count |
| Row pressure across siblings | Current direct children and sibling roots precede descendants of non-current branches; connectors reflect only visible genuine edges |
| Native status / custom review / missing | Record-derived title styling; raw value in details; no invented phase or suffix |
| Selected completed/archived row | Muted strikethrough survives list focus; archive path only when archived |
| Completed/archived relatives | Excluded by default; explicit browser filter stays within family and resets on exit |
| Alt+W / Task View | Same transient three-state cycle; Focused is context-prioritized and strict, Full is native-preorder then tail-truncated; no editor/config/task/history writes or model turn; empty/single family no-op |
| Alt+T task browser | Direct same-family tree; ↑/↓ and page movement, details, completed-history and close keys stay local; left/right focus jumps are intentionally absent; clean focus restoration with no pointer/editor/file/model mutation |
| Dialog closes/errors or session changes | Restore appropriate widget height; no stale session UI/config writes |
| Late native prompt notification | Ignore after shutdown or from another scope; do not restart observers or reinstall widget |
| Widget render or notification fails | Bounded diagnostic or isolated failure; native Pi remains usable |

## 5. Good / Base / Bad Cases

- Good: only the current native in_progress title is accent/bold; another
  in_progress relative stays regular text, while a custom review value remains
  raw in details and warning-styled rather than becoming a phase.
- Base: a PRD-only task displays without creating design/research/child artifacts.
- Bad: a component changes task status because a control was pressed or because
  a subagent result paragraph contained the word "complete".

## 6. Tests Required

`tests/unit/extension-ui.test.ts` covers lifecycle wiring, mode replay,
selector transactions, typed bypass presentation, theme invalidation, height and
width handling, model-list input/cancellation, tree-browser arrow navigation,
details/history/escape handling, stale dialog restoration, UI channel failures and
non-TUI guards. `tests/unit/task-widget.test.ts` covers ASCII task-only families,
compact `@` routing states and semantic colors, unchanged explicit full-status
modes, current-path priority, native title colors and emphasis, raw custom/missing
detail values, archive-only paths, deep/CJK widths, scoped closed filtering,
left-column markers, Focused breadth-before-depth priority, Full native-preorder
tail truncation and connectors/counts without execution-derived ordering.
Browser tests must cover selected planning/closed/custom titles and fresh styles
after invalidation; focus must not erase lifecycle styling, and changing the
current pointer must move in_progress emphasis without rewriting task state.
`tests/unit/task-family.test.ts` covers native structure and bounded read priority.
Integration asserts the 40/80/120-column by 16/24/40-row widget matrix and invokes
Pi's actual shortcut dispatcher/editor/help and queued prompt notification wrapper
with simulated terminals. These are not real PTY screen evidence.

Real PTY smoke testing must exercise all three Alt+W states with an unsent draft,
Alt+T browser/local keys, panel Task View,
parent/child/grandchild pointer switches in disposable fixtures, completed-filter
scope/reset, deep/overflow families and a large unrelated archive. Also exercise
model search/cancellation, resize, dialog restoration and reload. Check rendered
screens, not only ANSI substrings: task above status, bounded rows, current marker,
ASCII structure, English product text, native footer/card ownership and draft intact.
Expanded task rows must directly precede `@` with no Waypoint blank spacer. Verify
fixture task/config/native bytes and zero model requests; clean up test processes.

## 7. Wrong vs Correct

Wrong: `if (ctx.hasUI) await ctx.ui.custom(...)`, or derive task presentation
from a `trellis_subagent` execution result.

Correct: check `ctx.mode === "tui"` for native custom components, use
`notifyStatus` for RPC/headless reporting, and map task status only from the
native task record. `hasUI` alone describes whether some UI channel exists, not
the capabilities of that channel.
