# Waypoint v1

Repository: this project
Package: `@celia-sh/waypoint`
Host: Pi
Workflow: Trellis native
Command: `/waypoint`

## Goal

Waypoint adds model choice and visibility to Trellis on Pi, without adding another workflow.

Give the main agent a user-selected Strong Model option for native Trellis dispatch, and give the user a compact, truthful view of Trellis task progress. Trellis owns the workflow and execution; the main agent owns routing decisions; Waypoint owns configuration, short routing guidance, and a read-only task projection.

## Background

Ordinary models can handle explicit implementation, exploration, repeated edits, lint/typecheck, mechanical refactors, and migrations. Some ambiguous requirements, difficult root causes, implementations, and correctness reviews materially benefit from stronger reasoning. Using a strong model for every token-heavy operation is not the objective.

This PRD consolidates the user's 29-section product brief and subsequent design clarifications. The original brief is a hypothesis to check against real Pi/Trellis behavior, not evidence that every proposed runtime signal exists. Technical choices belong in `design.md`; execution order belongs in `implement.md`; verified host facts belong in `research/runtime-contracts.md`.

The priority is reliable, on-demand collaboration between ordinary and strong models, not minimizing tokens at any cost. Lower ordinary-model prices already help with spend. Trellis makes evidence, constraints, and acceptance explicit and supports bounded tasks; it cannot guarantee that an ordinary model recognizes every reasoning blind spot. Waypoint offers guidance, not event-triggered advice or a second decision-maker.

The existing Todo and generic subagent tools in the development session are temporary development aids. Exclude them entirely from production dependencies, architecture assumptions, and the acceptance baseline. The maintenance target is Pi + Trellis + Waypoint alone after stability is established; this planning work does not uninstall existing tools.

The MVP is one task with incremental implementation passes, not an artificial child-task tree.

Revision status: the task-family and compact `@` prefix revisions are verified.
The intermediate Native Task Status And Activity Separation was implemented, then
superseded after live use by the approved Native Execution UI Ownership
Simplification. Production removal and the final independent source/test Check are
complete; fresh PTY/demo-pointer follow-up remains separate. The requirements
below supersede older phase/inline/activity presentation clauses. Preserve demo
records; pointer restoration is not part of this Check.

## Requirements

### R1. Keep The Native Workflow (Brief 1-3, 9-12, 23, 27, 29)

- Preserve Plan -> Implement -> Verify -> Finish, including optional/repeated `trellis-research`, `trellis-implement`, and `trellis-check`.
- Keep `.trellis/tasks/`, `prd.md`, optional `design.md`/`implement.md`, `research/`, `implement.jsonl`, and `check.jsonl` as native Trellis artifacts.
- Dispatch remains the main agent's use of `trellis_subagent`, including Trellis's context injection and role definitions.
- Waypoint never calls a model, spawns an agent, manages another session/runtime, or rewrites Trellis-generated integration files.
- No `waypoint-advisor`, `waypoint-fixer`, `waypoint-reviewer`, or `/waypoint consult`.
- Trellis Check can fix issues directly; do not introduce a fixer role.

### R2. Main-Agent Routing (Brief 4-6, 22-23)

- Use the ordinary/current model by default for all three Trellis roles, retaining native role configuration behavior.
- The main agent may choose Strong immediately, after an insufficient cheaper attempt, or never; the next dispatch can return to the ordinary model.
- A user's explicit model/thinking instruction takes precedence over the TUI Strong preset within its stated scope. The preset is a default option, not a restriction. The main agent interprets user intent and supplies the native dispatch arguments; Waypoint does not parse conversation text, persist an inferred override, or rewrite a call.
- Strong can research, implement code/fixes, and check correctness. It is not restricted to research or review.
- Guidance may mention ambiguous requirements, difficult reasoning/root causes, difficult implementation, insufficient cheaper attempts, and semantic/architectural/lifecycle/state-consistency verification.
- Size, token volume, file count, retry count, and invented ambiguity scores must not automatically select Strong.
- Do not add another AI or a heuristic task-difficulty classifier. Do not promise that routing makes an ordinary model as capable as Strong.
- Guidance is stable and advisory. Waypoint must not watch failures, task text, logs, run length, or confidence and inject situational messages such as "you should use Strong now".
- Missing information may require reproduction, logs, or a user question instead of stronger reasoning. The main agent owns that judgment too; Waypoint does not enforce a cheap-first attempt or a delegation checklist.

### R3. User-Selected Models And Thinking (Brief 7, 24)

- Strong selection comes from Pi's currently available model registry, including custom providers; Waypoint has no provider/model catalog.
- Persist the actual `{ provider, id }` identity, not a display label or an inferred model tier.
- Thinking options follow the installed Pi model capability and Trellis dispatch capability. Do not permanently cap them at `xhigh` or assume levels form a contiguous sequence.
- Preserve unsupported saved values for diagnosis; never silently substitute another model or thinking level.
- Example model names and `max` in the brief are examples, not configured defaults. Initial setup must not select a Strong Model without the user.

User-level configuration in the host Pi agent directory:

```json
{
  "defaultMode": "auto",
  "strongModel": { "provider": "provider-id", "id": "model-id" },
  "strongThinking": "max"
}
```

The configured thinking value must be supported by the chosen runtime/model. Session mode overrides do not overwrite `defaultMode`. Do not add worker/research/implement/check models, fallback chains, budgets, or thresholds.

### R4. Modes (Brief 8)

| Mode | Routing behavior |
| --- | --- |
| Auto (default) | Inject guidance only when current and Strong identities differ. Equal means equal provider and model ID, independent of display name/thinking. |
| On | Inject guidance even when the main model is Strong, provided required capabilities/configuration are usable. |
| Off | No Waypoint model guidance or model behavior; native Pi/Trellis remain untouched. |

Task visibility is independent of Auto bypass. The brief allows Task UI to remain visible or be hidden in Off; the proposed v1 default is to leave the read-only view visible without introducing another configuration field.

### R5. Commands And Controls (Brief 9, 21, 26)

- `/waypoint` opens a native Pi panel showing Mode, Current Model, Strong Model, Strong Thinking and the current Trellis task's native status.
- Allow mode changes, model selection, and thinking selection.
- Support `/waypoint auto`, `on`, `off`, `model`, `thinking`, and `status` with command completion.
- Show compatibility/configuration diagnostics in the panel and status output. Cancelled selectors change nothing.
- Use a bounded native task-family widget above the editor. Put the task area first and the `@` routing/current/Strong summary last. Tree connectors represent actual task relationships only. Render lifecycle through task-title styling rather than repeated status suffixes: planning is muted, the current in_progress task is accent/bold, other in_progress tasks use regular text, and completed/archived is muted/struck when explicitly browsed or structurally retained. Do not render phases or agents as task branches.
- Do not duplicate subagent activity or execution history in the widget, panel, status output, task browser or details. Native Trellis cards and `Alt+O` exclusively own dispatched/running/result, model/thinking, usage, tool and error presentation.
- Activating a child retains its containing requirement's parent and unfinished sibling context, with an explicit current-task marker. Independent tasks and unrelated project history never appear, including when expanded. Scope and native-record exclusions are defined in R9.
- Approved control defaults: start in the existing Focused view and let `Alt+W` cycle Focused -> Collapsed -> Full -> Focused. Focused preserves the current lineage, current direct children, and nearby sibling roots while always hiding descendants of side branches. Full traverses the complete loaded family in native preorder and, when the row budget is exceeded, truncates only the tail rather than applying Focused's context-priority selection. Both task views use at most eight rows including status; Collapsed and short windows use two rows, current-task path then mode/status. No task means at most one status row. Keep this preference transient within the current session runtime and expose the same cycling action in `/waypoint`.
- Register `Alt+T` as a direct entry to the complete loaded family tree browser, avoiding the `/waypoint` root panel. The focused custom component owns `↑/↓` visible-row movement, Page Up/Page Down scrolling, Enter/`Alt+D` native details, `Alt+C` completed history and Escape until it closes; it does not use left/right focus jumps. This modal key handling does not install an editor interceptor, activate a task, or alter native records. Keep the native Pi footer and Trellis `Alt+O` unchanged.
- Secondary task details show the raw native status, parent/child navigation, an archive path only when actually archived, and read diagnostics. Do not emit redundant translations such as `in_progress (Processing)` or expected-negative lines such as `Archive location: not observed`. Remove the derived Plan/Implement/Verify/Finish table and all activity/run/model history from Waypoint panels, status and details; do not claim task verification from run success. Native execution cards stay unchanged. Keyboard interaction must work in ordinary terminal mode; mouse is optional. Collapse is separate from explicitly browsing completed family records.
- The main panel is a concise control surface, not a dump of `/waypoint status`: separate settings from task summary with clear spacing/alignment, and expose full diagnostics and detailed native evidence in secondary views.
- Use selective, theme-aware color and terminal emphasis for labels, important values and task lifecycle styling. Compact task rows need no textual status suffix; explicit diagnostic/detail output retains the raw native status. Show Auto bypass explicitly when current and Strong identities match; normal bypass is not an error or a model handoff.
- Keep all product-owned UI text in English. Use ASCII `>` for the current task and ASCII tree connectors (`|-`, backtick-minus, `|`); do not add Chinese UI labels or a redundant Current suffix. Native user-owned task titles retain their original language and CJK width support.
- No Kanban, drag/drop, priorities, due dates, or general-purpose task editing.

### R6. Explicit Compatibility (Brief 11-12)

- Detect the Trellis project, registered/active native `trellis_subagent`, and per-dispatch model/thinking capabilities at startup and refresh when necessary.
- An incompatible or unverifiable capability gets an explicit diagnostic; unsupported behavior is not advertised as available.
- No fallback to generic subagent packages, runtime forks, generated-file patches, or a different orchestration system.
- Do not uninstall or reconfigure the user's other extensions.

### R7. Trellis Is The Task Source Of Truth (Brief 13-15, 20)

- Project tasks, relationships and lifecycle status come only from Trellis task records and the current session pointer. Waypoint does not observe or reconstruct native subagent execution for presentation.
- No Waypoint task records, task database, manual completion tool, or required `todo.complete(...)` calls.
- No dependency on or synchronization with `@juicesharp/rpiv-todo`, `pi-task-ui`, `@narumitw/pi-subagents`, or other generic task/subagent packages.
- Generic Todo extensions may coexist independently.
- Missing/corrupt/ambiguous evidence must not fabricate a task, a completed phase, an executing model, or another session's activity.

### R8. Native Task Status; Native Cards Own Execution

- The implemented Trellis lifecycle is planning -> in_progress -> completed:
  create writes planning, start writes in_progress, and archive writes completed.
  The generic string field/filter may carry other values, but `review` has no
  native transition or workflow state and is not a fourth lifecycle phase.
- Compact task rows render those three facts without status suffixes: muted title
  for planning, accent/bold for the current in_progress task, regular text for
  other in_progress tasks, and muted/struck title for
  completed or archived records when explicitly browsed or structurally retained.
  Unknown/custom values use warning styling and remain raw/diagnosable in details.
- Keep current-task identity, native status and archive location separate facts.
  Starting a task does not prove planning quality or a running agent; clearing the
  pointer is not completion. Do not infer a parent's status from its children.
- Waypoint does not subscribe to, replay, aggregate, diagnose or display
  `trellis_subagent` execution activity. It shows no Activity row, role/run history,
  pass result, incomplete-history warning or execution-derived task ordering.
- Trellis's native card and `Alt+O` exclusively present dispatched/running/results,
  concurrency, model/thinking, usage, tool activity and errors. Waypoint neither
  duplicates those facts nor attempts to reconstruct them across `/reload`.
- Run success is not task completion or semantic acceptance. This ownership change
  does not alter Trellis workflow, dispatch, cards, task lifecycle or completion.


### R9. Real Task Trees And Lightweight Tasks (Brief 18-19)

- Scope the everyday tree to the current task's containing native requirement: follow verified parent relationships up to its highest unfinished, unarchived ancestor, then show related unfinished branches. A standalone task remains standalone. Broken or cyclic links stop traversal with diagnostics, not guessed relationships or a project-wide fallback.
- Distinguish the active pointer from running evidence. Mark the current task even when it is only planning; do not infer running work from `in_progress`, tree position, or a child's state. Parent rows do not inherit child phase results.
- Exclude completed/archived tasks from both collapsed and expanded everyday views. Explicit completed-record browsing is limited to the same family and does not unlock all project history. Preserve the active task and necessary structural context if inconsistent records would otherwise hide it; expose the inconsistency rather than reparenting nodes.
- Prioritize the current task and its ancestor context under the bounded display, then its direct unfinished children, then nearby unfinished sibling roots in native order. Expand descendants of non-current sibling branches only after those rows fit. Do not use hidden execution evidence to order task rows. Distinguish overflow of eligible task rows from unresolved/bounded reads and deliberately excluded history; none is a completion percentage.
- Do not create tasks merely to populate the UI.
- PRD-only tasks remain valid; do not require `design.md`, `implement.md`, research, or child tasks just for display.
- Missing child records are not invented tasks or proof of completion. Archived references remain resolvable for explicit family details, without forcing their inclusion in the everyday widget.

### R10. Minimal Model Context (Brief 5, 22)

Inject only enabled-state/default Strong identity/default Strong thinking, a short routing policy with explicit-user-choice precedence, and the requirement to follow native Trellis workflow through `trellis_subagent`. Use Pi's `context` event before every main-agent model invocation, including tool continuations, to project at most one current policy block. Do not persist repeated copies. Off and Auto bypass remove Waypoint's projected block on the next invocation.

Do not duplicate task documents, research, Todo state, workflow text or spec-update guidance. Trellis already owns those instructions. Do not add tool presets, wrapper tools, argument rewriting, a read-only status tool or direct dispatch integration to reduce parameter memory. No custom compaction/summary hook is required: Pi keeps its normal summarization; the next main-agent request reconstructs the default capability/policy from configuration. This does not guarantee that Pi's summary preserves every oral instruction.

## Acceptance Criteria

| ID | Observable acceptance | Requirement |
| --- | --- | --- |
| AC01 | Panel and all seven command forms work; cancelled controls do not persist changes. | R4, R5 |
| AC02 | Models come from the current Pi registry, with no hardcoded provider/model ranking. | R3 |
| AC03 | Runtime-supported `max` and non-contiguous thinking capabilities work; unsupported selections show diagnostics rather than silent clamps. | R3, R6 |
| AC04 | Auto omits guidance for equal provider/ID; On includes it; Off excludes it. Task UI remains independent. | R4 |
| AC05 | Policy explicitly permits Strong research, implementation, and checking; the main agent alone selects each dispatch. | R1, R2, R10 |
| AC06 | All Trellis work still uses native `trellis_subagent`; Waypoint makes zero model calls and has no spawn/session/runtime implementation. | R1, R6 |
| AC07 | No task-difficulty scoring, retry/file/token threshold, automatic escalation, or fallback chain exists. | R2, R3 |
| AC08 | Missing/inactive/incompatible Trellis, missing Strong, and invalid config produce actionable diagnostics without altering native behavior. | R3, R6 |
| AC09 | Task UI derives from Trellis/native evidence and works without generic Todo/subagent plugins or model-controlled checkboxes. | R7 |
| AC10 | Waypoint does not subscribe to or replay subagent lifecycle events and shows no Activity, role/run result or incomplete-history presentation; native Trellis cards remain unchanged. | R8 |
| AC11 | Task-row styling remains derived only from planning/in_progress/completed or archive location across dispatch, success, failure and `/reload`; no repeated status suffix, fabricated review phase, four-phase table, pass history or final-scope disclaimer appears. Pointer clearing is not completion. | R8 |
| AC12 | Research, Implement and Check execution appear only in native Trellis cards, never in Waypoint widget/panel/status/details. PRD-only tasks need no additional artifacts. | R5, R8, R9 |
| AC13 | Native parent/child records display; completed/archived relatives are excluded from the everyday widget and available only through explicit family details; no synthetic children or task writes occur. | R7, R9 |
| AC14 | Reload/session switch/tree navigation never imports another session's task or obsolete running state. | R7 |
| AC15 | Narrow/wide native terminal views fit their width; non-TUI modes do not attempt unsupported custom UI. | R5 |
| AC16 | Every applicable main-agent request has exactly one current policy block, including tool continuations and after context reconstruction; no PRD/design/research/UI state or repeated history messages are added. | R10 |
| AC17 | Disabling/removing Waypoint leaves Trellis files, tools, models, and workflow usable unchanged. | R1, R4, R6 |
| AC18 | Published package contains Waypoint, not this repository's Trellis runtime, planning tasks, private config, or session files. | R1, R7 |
| AC19 | A maintenance task succeeds using Pi + Trellis + Waypoint with the temporary generic Todo/subagent extensions disabled in an isolated test environment. | R1, R7 |
| AC20 | No execution event or task-content heuristic triggers a recommendation to select Strong; model-visible guidance changes only with explicit configuration/model availability/mode applicability. | R2, R10 |
| AC21 | Guidance states that applicable explicit user model/thinking choices override the preset; native dispatch arguments remain wholly agent-authored and unchanged by Waypoint. | R2, R10 |
| AC22 | No summary replacement, compaction model call, new spec-update instructions or Trellis tool wrapper is introduced. | R1, R10 |
| AC23 | Switching parent -> child -> grandchild within one requirement retains the containing native tree and unfinished sibling context, with exactly one left-column current-task marker; current direct children and sibling roots precede descendants of non-current branches, and unrelated roots/history never enter either widget size. | R5, R9 |
| AC24 | Task-only branches show styled native titles without lifecycle suffixes or execution-derived rows/ordering/inferred parent progress. Planning is muted, the current in_progress task is accent/bold, other in_progress tasks use regular text, and completed/archived is muted/struck; ASCII current `>` and connectors plus native CJK titles remain supported. | R5, R8, R9 |
| AC25 | `Alt+W` and the panel control cycle transient Focused, Collapsed and Full widget modes without editing task/config files or triggering a model; short windows/dialogs temporarily condense and restore the chosen mode. Focused never expands side-branch descendants; Full uses native family preorder and only tail-truncates when bounded rows run out; the current task remains visible whenever it is within that native sequence under width, depth and row pressure. | R5, R7, R9 |
| AC26 | `Alt+T` opens the complete loaded family tree browser directly in TUI mode. While focused, the custom component exclusively handles visible-row Up/Down and page movement, native details, completed-history and Escape; it does not use left/right focus jumps. Closing restores editor focus and leaves the draft, current pointer, native files and model activity unchanged. | R5, R7, R9 |

## Non-Goals

Direct Strong calls; automatic semantic escalation; additional agent roles/workflows/runtimes; generic Todo management; task-state persistence; third-party Todo synchronization; automatic task splitting; modifying Trellis task documents; automatic best-model selection; model benchmarks; token budgets/cost scheduling; telemetry; web application UI.

## Confirmed Planning Decisions

- Native run success must not imply final acceptance. The latest approved presentation delegates execution details to native cards instead of repeating pass/final-scope caveats; no protocol extension or release dependency.
- Strong is chosen in the TUI and offered through short guidance. The main agent uses native `model`/`thinking` arguments; explicit user instructions take precedence in their scope.
- Use Pi's per-invocation `context` event, without repeated persistent messages or custom summary handling.
- Reuse Trellis's own spec/context/workflow instructions without adding competing requirements.

The user approved the original MVP and subsequent refinements. After trying the separate Activity cue, the user approved removing execution observation from Waypoint because Trellis's native subagent card already owns it. The native product task remains `in_progress`; commits, publication, archive and demo cleanup remain separate.

### Task Widget Follow-Up: Historical Approved Layout

The user subsequently requested comparing the single-line task summary with an
rpiv-todo-like multiline presentation, and explicitly emphasized fitting Trellis.
Only visual presentation may be borrowed: Trellis remains the sole task source,
native parent/children remain real task relationships, and native execution
activity belongs under its observed phase. Do not turn phases into model-managed
todos, fabricate subtasks, infer an executing phase from `in_progress`, or invent
a completion percentage.

The requested lower-right status placement is conditional on Pi support. Source
inspection of installed Pi 0.85.1 found no independent right-aligned footer slot;
therefore retain the current placement rather than replacing Pi's footer.

The user then proposed placing the task area above the Waypoint mode/status row.
This ordering is supported inside the existing widget and does not require footer
replacement. Multiline presentation must not imply that multiple tasks exist:
only real native child records create child-task rows.

The user approved the bounded task-tree layout after reviewing the final summary:
task area above mode/status, real child records only, eight-row normal maximum,
and two-row short-terminal fallback. This superseded the earlier two-row default.
That implemented baseline is preserved as historical evidence in
`research/task-widget-layout.md`. The latest task-family revision is defined once
in R5/R9 and AC23-25; it retains the height/order constraints but proposes replacing
phase/agent branches and automatic archived-row inclusion. The user approved the
complete revision and added the English UI / ASCII-marker clarification before
implementation. Commit, publication, native archive and demo cleanup remain
outside this approval.

### Compact Status Prefix Simplification (Approved)

The user finds the widget's `Waypoint <mode> | <routing>` prefix redundant,
particularly `Waypoint off | off`, and requests an ASCII Waypoint marker instead.
The user approved the scoped preview by selecting `@ (Recommended)`.

- Remove the product name and configuration mode from the compact widget prefix;
  retain one truthful routing state (`enabled`, `bypassed`, `off`, `unavailable`).
- Prepend fixed ASCII `@` for Waypoint, suggesting a location and separate from
  the task's `>` marker.
- Preserve current/Strong model information, neutral same-model bypass, task
  notices, theme semantics and existing width/height limits.
- Keep mode controls and explicit mode information in the panel and full status
  details. Do not change routing policy, configuration, task evidence, tree layout,
  native footer, shortcuts or persisted state.
- Acceptance: no `Waypoint auto |` or `off | off` in the compact status row;
  all four routing states remain distinguishable and fit 40/80/120 columns.
- Continue implementation under the original product task after approval, not
  the currently selected display-only demo task. Preserve all demo records.
