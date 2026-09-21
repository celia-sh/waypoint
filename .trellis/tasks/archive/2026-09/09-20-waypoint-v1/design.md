# Waypoint v1 Technical Design

Status: the MVP, previous refinements, bounded Full/Focused modes and the native tree browser are implemented and verified. The latest UI revision uses English product text and ASCII markers and passes native Check, 143 unit / 17 integration tests and fresh real PTY coverage. Earlier UI sections document historical baselines; the current task-tree revision supersedes conflicting presentation clauses. Read `prd.md` for requirements; current evidence and remaining live-provider checks are in `research/implementation-evidence.md`. Runtime evidence is in `research/runtime-contracts.md`; agent collaboration rationale is in `research/collaboration-design.md`.

## Architecture

```text
Pi registry + user configuration -> models/config -> routing policy -> main agent
                                                                      |
                                             model choice + native dispatch
                                                                      v
Trellis task files + Pi native tool events <- trellis_subagent <- main agent
                    |
                    v
            read-only projection -> Pi widget / waypoint panel
```

There is no Waypoint dispatch arrow, task writer, model request, or agent runtime. The main agent is the only routing decision-maker. Deterministic diagnostics check whether a requested capability exists; they never assess whether a task deserves Strong.

## Modules

| Module | Responsibility |
| --- | --- |
| `src/index.ts` | Extension factory, event subscriptions, command registration, lifecycle cleanup and dependency wiring. |
| `src/config.ts` | User config parsing, validation, atomic save and session-only mode preference. No task fields. |
| `src/models.ts` | Pi registry lookup, exact provider/ID comparison and runtime-derived thinking capability. |
| `src/routing.ts` | Pure applicability and short policy generation. No task difficulty, trace analysis or dispatch. |
| `src/trellis.ts` | Read-only task resolution/tree loading, native compatibility adapter and evidence projection. |
| `src/ui.ts` | Native widget, panel, selectors and status rendering; no persistent task state. |

Use TypeScript ESM, npm, strict type checking and Vitest for focused fixtures. Host Pi packages are peers, with exact tested versions in development dependencies. Keep runtime dependencies minimal; do not import a generic subagent/Todo package. Publish `src/` and public package docs, not `.pi/`, `.trellis/`, `.agents/`, tests, runtime state or user config.

The six source modules are the initial ownership boundaries, not a reason to build a large framework. Small internal types remain near their owners. A future extraction requires real complexity, not speculative provider/runtime adapters.

## Configuration And Model Selection

- Resolve the Pi agent directory using the host helper, honoring its environment override; store Waypoint configuration in the host's user-level agent configuration file.
- Parse JSON structurally. Missing file means Auto with no Strong configured, not an inferred Strong default. Preserve invalid original bytes and show an actionable diagnostic; do not overwrite corrupt config automatically.
- Persist only defaultMode, strongModel `{provider,id}`, and strongThinking. Preserve unrelated future keys when saving. Atomic replacement and in-process write serialization prevent torn writes; no credentials are copied into this file.
- Session mode changes are preferences, not task state. A Pi custom entry containing only the mode can preserve them across reload/resume and active-branch navigation; a new session starts from defaultMode. No phase/progress/task records in custom entries.
- Model selection uses `ctx.modelRegistry.getAvailable()`, optionally presenting `ctx.scopedModels` as a filter, not as a separate catalog. Use host refresh on explicit selector refresh; no independent provider discovery.
- Get selected-model levels from `getSupportedThinkingLevels(model)`, intersect with the actual native dispatch schema/verified forwarding contract. Never maintain a local ranked enum or assume xhigh precedes max.
- Saved unsupported levels remain visible as invalid. Changing models must not silently replace thinking; prompt the user to select a supported value when needed. Cancel leaves persisted config unchanged.
- Never use `pi.setModel`, `pi.setThinkingLevel` or `pi.setActiveTools` to configure Strong.

## Guidance

Use the short candidate in `research/collaboration-design.md`. Policy generation depends only on explicit mode/config, current model identity and verified availability, never on task size, task content, errors or retry history. Name the configured Strong as a default option; applicable explicit user model/thinking instructions take precedence. The main agent interprets their scope and constructs native dispatch arguments. Waypoint does not extract overrides from prose or intercept/rewrite calls.

Applicability:

1. In native Trellis children (`TRELLIS_SUBAGENT_CHILD=1`), do not register main-session guidance/UI.
2. Off yields no policy. Missing/incompatible native integration or invalid/unavailable Strong configuration yields no false offer and an explicit user diagnostic.
3. Auto with identical provider/ID yields no policy; thinking differences do not defeat bypass.
4. Otherwise expose Strong for all three native roles and keep ordinary/native-default behavior as the default.

Use Pi's `context` event for one ephemeral policy block before each main-agent model invocation, including tool continuations. The actual call chain is `agent-loop -> transformContext -> ExtensionRunner.emitContext -> convertToLlm -> streamFunction`. Return a projected messages array, remove only a pre-existing Waypoint block, and add at most one current block; do not append it to session history. Keep text stable when configuration is unchanged and preserve all original user/Trellis messages. Validate placement and prefix-cache effects in provider-bound fixtures rather than promising free caching.

`before_agent_start` is not startup-only: it runs before a user-triggered agent loop, and its system-prompt modifications remain in subsequent requests. It need not execute again for that text to remain visible. We choose `context` to re-evaluate live configuration/mode per invocation, not because system instructions disappear after the first request. Do not mutate provider payloads.

No custom compaction or summary handling. The normal Pi summarizer owns conversation retention; a rebuilt main-agent context gets the current default policy again. No semantic parser or extra model is introduced to preserve oral overrides. The static precedence rule honors explicit user choices available in current conversation/summary without claiming lossless retention.

No PRD, research, Todo state, workflow text or new spec-update/handoff instructions are included. No dynamic "you should upgrade" messages. No native preset feature, status tool, dispatch wrapper, tool metadata replacement or argument mutation is required. A compatibility warning states an unavailable capability, not advice about which model should solve a task.

## Native Compatibility

At session start/reload and before offering routing, check:

- Trusted project root with Trellis workflow/tasks; no global pointer fallback.
- Registered and active `trellis_subagent` from the native integration, using Pi tool metadata/provenance. A same-name tool of unknown origin is not automatically trusted as compatible.
- Agent definitions for the three roles and model/thinking dispatch schema.
- Installed public Pi capability helpers; supported native progress shape when it arrives.

Check compatibility separately for model routing, run activity and task listing. The absence of a final full-scope Check fact is an accepted native observation boundary, not an incompatibility warning or release blocker. Display what Trellis actually exposes. Capability changes never rewrite tools, generated files, agent definitions or task metadata.

No network/model request is made to test readiness automatically. Real native dispatch smoke tests are explicit development verification, not startup behavior. Recheck actual schema and source-version fixtures on updates; version strings alone are insufficient.

## Task Resolution And Observation

- Use native session identity and the actual per-session pointer format. Where possible, resolve through `task.py current --json` with an explicit native context ID via an argument-array process call, on startup/session change rather than every repaint. Then read/watch the resolved native files. Do not execute lifecycle commands.
- Reject unreadable, stale and escaping references; canonicalize paths, validate symlink containment consistently with the supported native contract, and expose unsupported layouts. Never import another session's pointer to "recover" a missing task.
- Read task JSON structurally, retaining unknown native statuses as unknown. Current native hierarchy is `parent/children`; do not equate `subtasks` with children without a supported version contract.
- Resolve known child references in active tasks and archive folders; detect cycles and duplicate references. A missing record stays unresolved, not completed. Do not scan arbitrary repository content or create a child to fill a gap.
- Observe `tool_execution_start/update/end`. Start means dispatched/preflight; a native running run establishes actual activity. End is authoritative only when isError and all native run statuses agree.
- Bind a call to session + canonical task + toolCallId at dispatch. Within a native parallel/chain batch, track each run ID independently. Older completion cannot overwrite a newer active pass.
- Show requested model/thinking until observed data is available, and distinguish those labels. Never claim an effective provider/thinking value that native details do not prove.
- Refresh from native file events and tool completions, with bounded/debounced updates and a lightweight rescan fallback. No timer makes routing decisions. Watchers/timers begin only at session start and are disposed on shutdown/reload/session changes.

In-memory projection is a cache of evidence, not an independent lifecycle controller. It cannot start/finish/retry tasks or dispatch work. No progress is saved to a Waypoint file.

## Phase Projection

| Evidence | Projection |
| --- | --- |
| Native planning | Plan active; later phases pending/unknown. |
| Native in_progress | Plan complete. Do not infer an implement process is running solely from task status. |
| Native implement run active | Implement active; invalidate prior Verify completion for this pass. |
| All runs in the relevant implement batch succeeded | Implementation pass complete. |
| Native check run active | Verify active, with associated run/model details. |
| Successful check batch without full-scope evidence | Current Check pass complete; final full-scope Verify remains unconfirmed. This is accepted native behavior. |
| Failed/cancelled/mixed batch | Relevant pass not complete; preserve actionable result and allow native rerun. |
| Research | Temporary nested activity under the current phase; no fifth phase and no automatic regression/completion. |
| finish clears pointer | No active task; do not tick Finish. Retain at most the last observed task transiently for archive reconciliation. |
| Native completed/archive record | Reflect task completion/archive as native facts, not independent proof that every procedural step was performed. |

Do not invent a final full-scope outcome from prose or run counts. Equally, do not require Trellis to add a new protocol: current-pass completion is sufficient for v1. The UI is an observation of native workflow, not an independent verifier or release gate.

On reload/resume/tree changes, reconstruct only from the active Pi branch and real task files. Match historical tool results to their calls and explicit native task references; do not semantically parse free-form prose. Unmatched/compacted/ambiguous history stays unavailable. A historical start without a terminal result is interrupted/unknown after restart, never a perpetually running process.

Across a brand-new session, task identity comes from Trellis. Without an authoritative past event source, do not promise reconstruction of every historical phase. Archived task status can be displayed without inventing per-phase verification.

## Native UI

- Widget key `waypoint`: native task tree first, mode/routing summary last; at most eight normal rows including spacing/status, two task-then-status rows in short terminals, and at most one status row without a task.
- `/waypoint`: native custom component with read-only status, SettingsList for modes, searchable SelectList for models, and model-derived thinking choices. Return to the panel after selection; Escape cancels the current control.
- Task expansion browses real parent/child data and phase evidence without activating a task. Use keyboard navigation in regular terminal mode; optional fullscreen mouse support does not become required behavior.
- Do not replace Pi's footer/editor or override Trellis's `alt+o` shortcut. No new shortcut is needed for the first release.
- Use Pi theme callbacks, visibleWidth/truncateToWidth/wrapping; test 40/80/120 columns, CJK names and long provider IDs. Rebuild themed output on invalidation.
- Guard custom UI with `ctx.mode === "tui"`, not just hasUI. RPC uses supported dialogs/status when available; headless execution never waits for a selector. Status is user-facing, not a message requesting another LLM turn.
- Proposed Off behavior leaves read-only task visibility available. Auto bypass also leaves it available.

### First-Dogfood UI Refinement

The user resumed the live session with equal current/Strong identities and found
the widget monochrome and `/waypoint` too dense. Refine `src/ui.ts` and only the
necessary command/view wiring in `src/index.ts`: use semantic theme callbacks,
aligned settings rows, a short task/phase summary and a separate diagnostics view.
Keep detailed plain status output available for troubleshooting and non-TUI use.
Expose a truthful active/bypassed/off/unavailable presentation from existing
applicability facts; never infer identity by parsing display strings. Normal Auto
bypass is neutral. Do not change routing policy, configuration, native projection,
phase completion semantics or main-model selection. Native controls remain
keyboard-first, with no animations, extra shortcuts or runtime dependencies.

Validate semantic color roles without requiring color to understand state;
40/80/120-column widths, short terminal heights, theme invalidation, menu return,
selector cancellation and unchanged policy/configuration remain required.

## Task Widget Follow-Up: Approved Layout

The user approved the final layout summary. See
`research/task-widget-layout.md` for the inspected rpiv-todo source/screenshot
and actual Pi 0.85.1 footer API/rendering evidence.

Replace the earlier two-row default: keep the existing `waypoint`
above-editor widget, put the task area first and the mode/routing summary last.
The primary hierarchy is Trellis's actual task/children tree. A task's observed
phase is a status, not a model-managed todo; attach labeled native execution
activity under its owning task/phase, without fabricating a child task.

Stay within `src/ui.ts` plus any strictly necessary height/navigation wiring in
`src/index.ts` and focused tests. Reuse `TaskSnapshot`, `TaskNode.children`, and
`Projection.phases/forTask`; no task store or projection-state changes. Bound the
normal display to eight rows including spacing/status, prioritize current task
and active evidence, and count hidden real rows. On short terminals retain a
two-row task-then-status fallback. Without a task, retain at most one status row.
All detailed phase/run/tree information remains available in `/waypoint`.

There is no independent right-aligned footer status API. Do not call `setFooter`,
move the editor, use cursor escapes, or interfere with other extension statuses.
Only borrow rpiv-todo's visual hierarchy/color/connector ideas, not its runtime,
state, shortcuts or completion/hiding semantics. Require rendered-screen PTY
checks after the height increase, including opening the already-refined panel.

## Task-Family Presentation Revision (Approved)

### Boundary And Ownership

The gap is representational: the current widget roots at the active child, loses
its containing requirement, and uses the same connectors for tasks, phases, and
agents. Historical completed children also consume everyday row capacity.
Change only read-only family loading/selection (`src/trellis.ts`), task rendering
and task-detail filtering (`src/ui.ts`), transient controls/lifecycle wiring
(`src/index.ts`), focused tests, and public documentation. Do not change routing,
model/config semantics, native pass projection, generated integration, task
records, or user keybindings. Existing frontend specs describe shipped behavior;
after approval this revision supersedes conflicting presentation-only clauses,
with spec updates following implementation and Check.

### Family Resolution And Read Bounds

Start from the session's active task, not a project task index. Ascend the loaded
native parent chain to the highest unfinished/unarchived containing task. Verify
parent/child links; stop on missing, cyclic, conflicting, or archived boundaries.
Keep the active task visible with diagnostics when data cannot establish its
family. Never manufacture a connector or import an unrelated root.

Reserve bounded reads for the active node and ancestor chain before expanding
side branches. Prioritize live native references over archived references so
history cannot exhaust the existing read budget first. Preserve containment,
64-node/16-depth safety bounds and archive ambiguity diagnostics; reaching a
bound must be explicit, not an exact count of unseen tasks. Closed-record lookup
serves only known references within this family, not an archive catalogue.

The view excludes completed/archived rows by default. Retain only indispensable
context if native inconsistencies would otherwise hide the actual active task
or a live branch; do not invent reparenting. Default task browsing uses the same
scope and unfinished filter. An explicit Show completed control exposes only
related native completed records in details, resets when leaving that browser,
and never expands the widget's scope or changes native status.

### Rows, Evidence And Trimming

Each connector is a native task edge. Render title first and concise state after
it, reserving width for the active marker and meaningful state. Native planning
can read Planning; in_progress without execution evidence can read Started,
never Running or Implementing. Research is an inline activity, not a phase or
child. Full role/run/model/thinking evidence remains in task details. Successful
Check text still states that final scope is unconfirmed. Preserve concurrent or
adverse evidence instead of overwriting it with a later success.

A parent shows only its own observed state, not its descendants' phase. Mark the
current task with ASCII `>` independent of color, not a redundant Current suffix.
Use ASCII connectors (`|-`, backtick-minus and `|`) and English product-owned
labels such as Planning, Started, Implementing, Checking and Show completed.
Preserve native task titles verbatim after sanitization, including CJK width
handling. An ancestor/container needs no separate phase row. Apply existing
semantic themes without a new palette or localization system.

Keep the eight-row normal maximum. In Focused mode, select the active path before
side branches; then the current task's direct children and nearby sibling roots in
native order. Never expand descendants of side branches in Focused. In Full mode,
traverse the complete loaded family in native preorder and take the first rows
that fit, so overflow truncates only the tail instead of skipping later nodes in
favor of current-context rows. Recompute connectors for the actual visible rows.
Overflow counts only omitted, resolved eligible tasks, not hidden history, phases
or runs. If an active chain is too deep for the row budget, show it as an
abbreviated breadcrumb plus the nearest parent/current subtree; do not falsely
connect distant ancestors. The current title/state must survive truncation when
it is within the selected native sequence. The complete bounded family remains
navigable in the panel.

### Expansion Controls And Lifecycle

Keep the existing expanded presentation as the initial Focused preference. Make
its current priority rule strict: preserve the current lineage, current direct
children and nearby sibling roots, but never expand descendants of side branches.
Add Full as the complete loaded-family traversal in native preorder; when rows run
out it truncates only the tail rather than reusing Focused's context-priority
selection. Collapsed remains the two-row current-path/status view. Alt+W and the
panel Task View action cycle Focused -> Collapsed -> Full -> Focused, so the first
toggle from the default preserves the prior collapse action.
With no task or no additional eligible family rows, suppress the panel action and
make cycling harmless.

Represent the mode with an exhaustive `TaskViewMode` union owned by UI/runtime
state rather than parallel booleans. Keep it across native task switches in the
same running session and reset to Focused on runtime reload/new/fork/resume/project
changes. Dialogs and terminals below 20 rows force visual condensation without
changing the preference. Restore it when the dialog closes or terminal grows.
Neither control sends a model message, modifies the editor, activates a task or
persists a session entry.

Register Alt+T as a direct TUI entry to the complete loaded family tree browser.
Pi 0.85.1 exposes no public API for opening its built-in command palette; use
`ctx.ui.custom()` to provide the equivalent focused native tree component.
Registered extension shortcuts are dispatched by the default editor, while a
custom component receives input directly through `handleInput`, so the browser
must own visible-row `↑/↓`, Page Up/Page Down, Enter/Alt+D details, Alt+C
completed history and Escape locally until it closes. It deliberately does not
install left/right parent/child focus jumps. The direct shortcut shares the same
generation, dialog condensation, task-scope and error boundaries as `/waypoint`
task browsing; it is a no-op during another Waypoint dialog or outside TUI mode.

Alt+W and Alt+T are not Pi defaults or the native Trellis Alt+O binding in
inspected sources. Pi handles registered-shortcut conflicts and reports
diagnostics; its public extension API does not expose a complete other-extension
shortcut registry. Do not promise universal collision detection or edit user
bindings. Panel/browser controls remain fallbacks for terminal Alt delivery.
Native shortcut help supplies discoverability without another widget help row.

### Review And Rollback

Validate this scope through native Implement and Check after approval, then
update the presentation spec. Include real PTY expand/collapse, current-child
switching, hidden completed siblings, overflow/deep ancestry, dialog restoration,
resize, and no-model/file-mutation checks. The verified 106/15 baseline is not
proof of the new behavior. Reverting this presentation increment must leave
native records, user model configuration and prior routing/evidence behavior
unchanged. No commit, publication, demo cleanup or archive is implied by planning.

## Compact Status Prefix Simplification (Verified)

The user approved replacing `Waypoint <mode> |` in the compact widget with
ASCII `@ `. `compactLines` keeps the existing typed routing label and semantic
color, model text, task notices and width/height logic. The marker uses accent
color. Mode remains explicit in the root panel and full status; no other source
module, state, routing policy, native record or control changes. This supersedes
earlier references to including mode in the compact summary. Native Check,
139 unit tests, 17 integration tests and three fresh real PTY scenarios passed;
see `research/implementation-evidence.md` for scope and the pre-existing model
clipping limitation.

## Native Task Status And Activity Separation (Approved)

The user approved this ownership correction with "改", then requested Processing
as the English display label for in_progress. This section supersedes earlier
phase-table, inline-role/result and duplicate-run-detail presentation clauses.
The safety boundary (run success is not semantic acceptance) remains unchanged.

### Boundary

Only `src/ui.ts`, focused tests and README should need product changes. Keep
Projection decoding/replay/phase methods, task loading, routing/model/config,
lifecycle/shortcut wiring and generated native integration unchanged. Remove
UI-only phase helpers if unused, not the underlying evidence machinery or tests.
Do not fix unrelated model-name clipping in this presentation revision.

### Native Status And Details

Task rows always use native status, with one display mapping: planning ->
Planning, in_progress -> Processing, review -> Review, completed -> Completed.
Unknown values must remain non-successful and diagnosable (sanitized raw value
in details). Archive location is distinct from status; necessary closed context
may retain an explicit context/archive qualifier without implying new status.
Current `>` still means session pointer, not execution. Root panel summary is
also title/status, never a derived phase. Normal details/status show raw native
status, archive location, task identity/relationships and read diagnostics, not
Plan/Implement/Verify/Finish, pass-complete text or final-scope caveats.

Rename the existing task evidence submenu to Native details and keep native
metadata/diagnostics. Remove the duplicate list of role batches, requested vs
reported models and outcomes: native `renderProgressCard` and Alt+O own those.
No new tool/card navigation API or automatic native-card expansion is needed.

### Separate Activity Cue

Use existing task-bound `Projection.forTask` calls, not prose, native status or
parent inference. Select the latest connected overlapping group per task/role,
including transitive overlaps. Show dispatched/running and adverse (failed,
cancelled, interrupted, unknown/incomplete history) evidence; no cue for a fully
successful terminal group or a role with no calls. A new non-overlapping group
supersedes that role's old outcome. Other-role successes cannot erase adverse
activity, and active groups retain failed peers. Malformed/terminal unknown
facts must not resurrect stale run data. Existing internal pass-complete values
may help filter terminal success but must not appear as user-facing task status.

Expanded widgets get at most one separate `Activity:` row scoped to eligible
family tasks. Use the existing spacer before the `@` row when activity exists,
so the eight-row limit and tree capacity remain intact. Current-task activity
can use the native role name; non-current activity needs task attribution. For
multiple roles/tasks, choose a compact truthful summary; count observed calls
or tasks explicitly, never completion fractions. Preserve adverse/live meaning
under width pressure without growing more rows or losing the current task.
Task priority can still favor branches with live/adverse evidence, independently
of their displayed native status.

Collapsed/short/dialog widgets keep two rows (current path/status then `@`) and
omit the activity strip; do not smuggle it back into task or routing status.
Panels/task details may show the same concise activity separately, task-scoped
when browsing a task. No-task remains one status row and excludes stale activity.
Native cards remain accessible independently. No timers, persisted acknowledgments,
manual clear controls or new source of truth.

### Verification

Test native status stability through dispatch/running/success/failure, all native
labels including review, missing/custom status, current/ancestor independence,
single/concurrent/adverse/overlapping activity, newer batches, incomplete replay,
non-current attribution and family isolation. Keep tree/width/theme/height and
collapse/dialog/session tests. Replace superseded UI assertions explicitly, but
retain Projection safety tests. Run native Implement/Check and all quality gates,
then fresh real PTYs with task-native details and an isolated no-model native
execution-evidence fixture for activity. No fake success in actual demo records.

## Native Execution UI Ownership Simplification (Approved)

After using the separate Activity cue, the user identified that it duplicates the
native `trellis_subagent` card and turns incomplete session replay into misleading
product state such as `interrupted (4 calls)`. The correction is architectural,
not a wording change: Waypoint no longer observes or reconstructs subagent
execution for presentation.

Remove `Projection`, its replay/event subscriptions and the activity capability
from the Waypoint runtime. Remove Activity from the widget, root panel, plain
status, task browser and native details. Task selection no longer uses hidden
live/adverse evidence; after the active lineage it follows genuine family/native
sibling order. Remove projection-only tests and fixtures while retaining task
loader, family, status, routing and native-integration forwarding coverage.

The task view is reconstructed only from the current session pointer and bounded
native task records. `/reload` may reset intentionally transient UI state such as
expanded/collapsed preference and dialogs, restart file observation and rerender,
but it cannot synthesize interrupted/running execution state because Waypoint no
longer reads tool history. Configuration and routing guidance retain their
existing persistence/reconstruction contracts.

Trellis's native card and `Alt+O` exclusively own dispatch progress, role/run
results, concurrency, models/thinking, usage, tools and errors. Do not modify the
native integration or hide its cards. This revision does not claim that Trellis
has finer task lifecycle states: `Processing` remains the intentionally coarse
native `in_progress` mapping.

Verification must prove no `tool_execution_start/update/end` activity handlers,
Projection/replay dependency, `Activity:` text or execution-derived task ordering
remains in Waypoint production code or normal views. Re-run task/family/status,
reload, width, package and no-model checks. Preserve task/config/native bytes and
do not alter demo records, commit, publish or archive.

## Native Lifecycle Styling Simplification (Approved)

Source inspection corrected an earlier assumption: Trellis 0.6.17 implements only
planning -> in_progress -> completed transitions. `review` appears in generic list
filter help, but no command, workflow breadcrumb or lifecycle transition writes it;
`task.json.status` is an open string. Do not promote `review` into a fourth native
phase. Preserve any custom value raw for diagnosis.

Remove lifecycle suffixes from every compact task row, including the widget, root
panel summary and task browser. Style the sanitized title from record facts only:
planning uses muted regular text; the current in_progress task uses accent plus
bold while other in_progress tasks use regular text; completed or
archived records use muted strikethrough when explicit completed browsing or
necessary structural/current context makes them visible; other/missing values use
warning styling without inventing a label. The current marker occupies a fixed left column before any connector (`> |- title`),
so pointer identity cannot be mistaken for another tree edge. It raises visual
weight only
for a non-closed in_progress title; it does not imply that an agent is running.
Closed styling remains authoritative for inconsistent current/archived records,
and planning/custom values retain their lifecycle colors.

Plain `/waypoint status`, Details and Native details retain the raw status as
`Task status: <raw-or-(missing)>`, without an English translation. Emit `Archive:
<ref>` only when `archived` is true; omit the normal unarchived case instead of
printing `Archive location: not observed`. Keep parent/children and diagnostics.
This is presentation-only: do not mutate task records, change closed filtering,
add a completion action or derive lifecycle from subagent execution.

Validate ANSI styling through semantic theme calls and stripped-text assertions,
including CJK/width clipping, active completed edge cases, closed structural
context, explicit Show completed, custom/missing status and terminals where raw
status remains available through details. Preserve native card ownership and the
no-execution-observation boundary.

## Safety And Rollback

Removal or Off stops Waypoint guidance without affecting Trellis tool availability, configuration, task files or workflow. Config and task-read errors are isolated diagnostics. Do not log credentials, full user session transcripts or native thinking tails. No automatic telemetry.

A release can disable a capability with an explicit diagnostic if an upstream format changes, but must not silently swap runtimes or label partial support as full compliance. Task UI failure must not break native execution.

## Review And Release Gates

- Verify the accepted native projection: successful Check pass, unconfirmed final scope when unavailable, and native completed/archive facts; no extra protocol.
- Validate per-invocation context updates, explicit-user-choice precedence, preservation of original context and no custom summary/spec workflow.
- Confirm requested versus effective model/thinking handling, off forwarding, task binding, prompt projection and cleanup using actual native fixtures.
- Prove package removal leaves native Trellis unchanged.
- Complete one real maintenance task without generic Todo/subagent plugins before recommending their removal.
