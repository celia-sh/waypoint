# Waypoint v1 Implementation Plan

Status: the MVP, grouped panel, task-first widget, bounded Full/Focused modes and tree browser are implemented and verified; the native task remains `in_progress`. See [implementation evidence](./research/implementation-evidence.md) for the latest 144 unit tests, 17 integration tests, fresh tree-browser PTY verification and native Check. No commit, push or archive is authorized by implementation approval. Real selected-model dogfooding remains explicit below.

The Task-Family Presentation Revision was approved with "开始", followed by the
English product-text and ASCII-marker clarification. Execute the reviewed plan;
previous completed checklists remain historical evidence, not verification of
this new revision.

## Start Gate

- [x] Review PRD, design, runtime research and collaboration assessment with the user.
- [x] Confirm native Check-pass presentation with the user: final scope stays unconfirmed when absent; no new completion protocol or upstream release dependency.
- [x] Load/trust the generated native Pi integration in an isolated development invocation. The existing chat cannot refresh its tool list; a temporary script invokes the actual generated `trellis_subagent` execute function, with native roles/context and Pi children limited to Trellis/Waypoint. No generic subagent replacement or product dispatch wrapper.
- [x] Run native task context validation and inspect the current planning task.
- [x] After explicit approval of the latest plan, start the product task.

The task remains a single MVP with the passes below. Create genuine child tasks later only if implementation reveals independently deliverable work that benefits from separate planning/verification. This plan is not another task runtime.

## M0. Contract And Test Foundation

Deliverable: a minimal package/test setup and proven native contracts before UI assertions depend on them.

- [x] Create package.json for `@celia-sh/waypoint`, TypeScript ESM configuration, npm lockfile, Vitest and lint/typecheck scripts. Use tested Pi peer/dev versions and an explicit package file allowlist.
- [x] Add native fixture provenance/version notes; do not vendor or modify a production copy of the Trellis runtime in src.
- [x] Verify actual tool metadata/schema provenance, session pointer resolution, parent/children/archive and progress statuses.
- [x] Test thinking capability intersection with max, holes, unsupported values and schema/runtime mismatch. Investigate native explicit-off forwarding using a disposable fake CLI fixture, not a real model request.
- [x] Validate ephemeral Pi `context` projection on every main-agent invocation, including multiple tool continuations, explicit config/mode changes and rebuilt contexts. Check exact current block count, user-choice precedence, intact Trellis context and no persisted policy copies.
- [x] Establish what native model/provider/thinking evidence is requested versus observed and how historical calls are safely task-bound.
- [x] Preserve missing final/full-scope verification as unconfirmed UI evidence, not a compatibility failure. Do not add a completion tool, counter, task field or upstream protocol dependency.

Gate: contract tests pass and native observation boundaries are explicit. The absence of final full-scope metadata is accepted and does not block v1.

## M1. Configuration, Model Selection And Guidance

Deliverable: a configurable advisory extension without Task UI complexity.

- [x] Implement config.ts: missing/corrupt config, validated values, atomic writes, forward-key preservation and session-only mode preferences.
- [x] Implement models.ts using the live Pi registry and public thinking helpers; no credentials, catalogs, model ranking or setModel calls.
- [x] Implement routing.ts pure applicability/policy generation; add all three native roles, the "Strong can implement" rule and explicit-user-choice precedence over the preset. Do not introduce a dispatch wrapper, native preset interface, conversation parser or argument mutation.
- [x] Wire index.ts lifecycle and command handlers for auto/on/off/model/thinking/status; skip main-session features in native children.
- [x] Validate Off/Auto bypass remove guidance before the next model request, and routine progress events never change or add policy text.
- [x] Verify errors/failures/file counts/token counts do not trigger any model recommendation or dispatch.
- [x] Leave Pi summarization and Trellis spec/workflow prompts alone: no compaction hook, custom summary model call or extra artifact/checklist requirements.

Gate: AC01-08, AC16-17 and AC20-22 tests pass for this surface. Strong remains unset until user choice. No actual dispatch is initiated by Waypoint.

## M2. Read-Only Task Projection

Deliverable: deterministic evidence projection that operates independently of UI rendering.

- [x] Implement trellis.ts task resolver, native compatibility report and bounded read-only snapshot loader.
- [x] Parse actual parent/children and resolve active/archived children with cycle/path checks. Keep PRD-only tasks valid.
- [x] Track native calls/runs by session/task/call/run IDs; model/role/pass information comes from native events.
- [x] Cover implement/check reruns, stale completion, parallel mixed success, cancellation and research nesting.
- [x] Separate successful Check pass from unconfirmed final scope. Never treat tool final=true as an independent correctness certificate; no additional protocol is needed.
- [x] Separate pointer clearing from completed/archive facts; handle archive partial failure and missing files conservatively.
- [x] Reconstruct from the active Pi branch only; reset safely on reload, fork/new/resume/tree/project changes. Unknown history stays unknown.
- [x] Add debounced file refresh and idempotent watcher cleanup. Do not persist projected task state.

Gate: AC09-14 fixtures pass. Source ownership assertions and read-only fixture/terminal byte checks confirm no task/integration writes; no tests depend on generic Todo/subagent packages.

## M3. Native Control Panel And Widget

Deliverable: usable compact Pi interface around the verified configuration/projection.

- [x] Build ui.ts with native components/themes and no footer/editor replacement.
- [x] Default widget remains compact; expanding through `/waypoint` exposes phase evidence, real task tree and active runs.
- [x] Implement searchable model selection, thinking selector, mode control and keyboard task expansion with cancel/back behavior.
- [x] Distinguish requested/observed model data, completed pass/unconfirmed Verify, inactive tools and invalid config.
- [x] Check long/CJK names, 40/80/120-column layouts, theme invalidation fixtures and no-active-task state.
- [x] Handle RPC/headless modes without attempting custom TUI or starting an agent turn to report status.

Gate: AC01, AC04, AC08, AC12-15. UI tests demonstrate width safety and cleanup; runtime state is not duplicated in component-owned task records.

## M3 Follow-Up: First-Dogfood UI Refinement

The user loaded Waypoint and resumed the native session, selected the same Strong
provider/model as the current model, and requested selective color and a less dense
control panel. This is an approved presentation refinement within the active MVP.

- [x] Replace the root diagnostic wall with an aligned, grouped control panel and secondary diagnostics/details views.
- [x] Apply semantic theme colors to the compact widget and panel; explicitly label verified Auto bypass without changing routing behavior.
- [x] Preserve keyboard navigation, cancel/return behavior, full status output and narrow/short-terminal safety; add focused regression tests.
- [x] Run native Implement/Check, all quality commands and real terminal smoke tests; record evidence and update the UI spec. No commit, publication or archive.

The initial Implement passed 70 unit tests and nine integration tests. The final
native Check reviewed this panel together with the task-widget follow-up, fixing
UI failure/cleanup boundaries and verifying 106 unit tests and 15 integration
tests. Fresh main-session PTY checks passed at 40x16, 80x24 and 120x24, including
resize. The UI spec is updated; see `research/task-widget-review.md` and the
post-check section in `research/implementation-evidence.md`. Interrupted earlier
Checks are not counted as successful reviews.

## Task Widget Follow-Up: Approved Implementation

The user requested rpiv-todo visual research, emphasized native Trellis semantics,
and proposed placing the task area above the mode/status row when the desired
right-footer position proved unsupported. Research is recorded in
`research/task-widget-layout.md`. The user approved the final bounded layout
summary; implementation of this presentation change is authorized.

- [x] Inspect the visual reference source and screenshot from a disposable fixture; inspect Pi's actual footer API and renderer.
- [x] Obtain approval of the bounded native task-tree layout with task area above mode/status.
- [x] Update R5/UI spec, implement only widget rendering and necessary height wiring, and add focused native-tree/phase tests.
- [x] Run native Check, lint/typecheck, unit/integration tests and real 40/80/120-column PTY checks, including short-height panel navigation.

Implemented in `src/ui.ts`, transient dialog sizing in `src/index.ts`, and focused
tests. Final verification: 106 unit tests, 15 integration tests, lint/typecheck,
package allowlist and fresh rendered-screen PTY probes all passed. Tests cover
single, nested/archived and overflowing native child records, short/tall resize,
menu coexistence/restoration, selector cancellation and unchanged native files.

Do not replace the native footer, reinstall rpiv-todo, invent task records or
completion scores, add model calls, or change routing/configuration/task semantics.
No commit, publication or archive.

## Task-Family Presentation Revision (Approved)

Planning artifacts: R5/R9 and AC23-25 in PRD, the corresponding revision in design,
and native/shortcut evidence in research/task-widget-layout.md. Frontend/backend
specs now document the verified task-family view; historical earlier layout
sections remain evidence of their own completed passes.

- [x] Inspect native parent/child and archive rules, current loader/renderer, Pi keybindings/shortcut registration and terminal constraints.
- [x] Confirm that a child remains in its containing requirement's tree, including parent and unfinished sibling context; exclude independent roots/history.
- [x] Persist revised requirements, design boundaries, proposed expanded default and whole-view Alt+W/panel toggle, acceptance cases and validation gates.
- [x] Obtain fresh approval of the complete final plan, including expanded default, Alt+W/panel controls and returning the pointer to the product task. User said "开始" and clarified English UI / ASCII `>` and connectors. Preserve demo records; do not dispatch under the demo task.
- [x] Validate the archived task manifests and start the product task. Both six-entry manifests passed; the current pointer confirmed the original product task. Temporary demo records remain unchanged; no archive.
- [x] Dispatch native trellis-implement with the current task protocol line. Implement bounded active-lineage-first family resolution, unfinished filtering, task-only connectors, inline state/current marker, deep-path fallback and explicit scoped completed-record browsing. Preserve native evidence semantics.
- [x] Add Alt+W and the panel action with transient expansion preference, no-task/single-task behavior, dialog/resize restoration, child/non-TUI guards and no model/editor/config/task mutation. Keep Trellis Alt+O intact.
- [x] Test parent -> child -> grandchild switching, independent-root exclusion, completed/archived filtering, inconsistent/cyclic/broken links, read budgets with many archived siblings, deep active ancestry, width/state/current-marker priority, concurrent/adverse evidence and final-scope uncertainty.
- [x] Test shortcut help and registration, toggle while working, unchanged editor contents, panel toggle, no-task/single-task no-op, resize/dialog/reload/session lifecycle, and unsupported terminal fallback. Exercise actual host shortcut dispatch, not only an isolated callback.
- [x] Run native trellis-check over the whole revision, then npm run lint, npm run typecheck, npm test, npm run test:integration, npm pack --dry-run --json, and both context-manifest validations. Review old task-widget assertions deliberately; do not weaken evidence/session/path tests to fit the new layout.
- [x] Run rendered-screen PTY probes at 40x16, 80x24 and 120x24, including a selected grandchild, scoped completed records, a large unrelated archive, deep ancestry and tree overflow. Resize and open/close the panel. Assert bounded rows, correct visible ancestry/current marker, unchanged native footer/editor/task/config bytes, zero chat/model requests and cleaned-up test processes.
- [x] Record fresh results and update README and frontend/backend specs for verified behavior. No commit, publication, archive or completion claim for the separate real-provider exercises.

Implementation handoff: `research/task-family-implementation.md` records the
initial 118/16 result. Native Check fixed five findings and passed 131 unit /
17 integration tests; main independently reran all package quality commands and
four actual rendered-screen PTY scenarios. Specs and README are updated. Final
evidence and disposable capture details are summarized in `research/implementation-evidence.md`.
Original product pointer remains active; demo records, user settings and native
integration are preserved. This completes the presentation revision, not release
or remaining real-provider dogfooding.

Rollback boundary: product changes should remain in src/trellis.ts, src/ui.ts,
src/index.ts, focused tests and docs. Do not touch generated native integration,
model/routing semantics, user config/keybindings or demo task state to implement
the feature. Revert only revision-owned edits if a review gate fails; preserve
all pre-existing work and native artifacts.

## Compact Status Prefix Simplification (Approved)

The user selected the `@` preview after reviewing the widget-only scope. This
lightweight follow-up replaces the `Waypoint <mode> |` prefix with `@ ` in
`src/ui.ts:compactLines`; all other widget state/model/notice formatting stays.
Panel controls and full status remain explicit about mode. No new API or state.

- [x] Inspect renderer and affected assertions; approve ASCII `@` and scope.
- [x] Switch to the product task and dispatch native Implement for the prefix,
  focused width/theme/four-routing-state tests, existing assertion updates and
  a small README clarification. No demo-record changes.
- [x] Native Check, independent lint/typecheck/unit/integration, and focused
  terminal rendering smoke checks; verify panel/status and routing are unchanged.
- [x] Update the frontend spec and implementation evidence. Restore the existing
  demo-registry pointer for user inspection after verification; do not archive,
  commit, publish or change any demo task record.

Native Implement/Check and main verification passed: 144 unit tests, 17 integration
 tests, lint/typecheck, package allowlist and fresh real PTY runs including the
native-preorder Full overflow and tree-browser arrows. See
`research/implementation-evidence.md` for captures and the pre-existing clipping
limitation. The demonstration pointer was restored through native start; demo
records and other source/config/native guard hashes remain unchanged.

## Native Task Status And Activity Separation (Approved)

- [x] Inspect native `.pi` card, Alt+O behavior and Waypoint overlap; user approved
  the proposal with "改" and requested Processing for native in_progress.
- [x] Persist corrected R5/R8/R9 and AC10-12/24, design boundaries and this plan.
  Snapshot a disposable baseline; preserve demos/settings.
- [x] Activate original product task, validate curated contexts, dispatch native
  Implement with latest revision taking precedence over historical UI specs.
- [x] Implement stable native status, separate one-line activity and native task
  details; remove phase-table/run-history UI only. Add focused regression tests
  without weakening decoder/replay safety or changing lifecycle/routing behavior.
- [x] Native Check, then independent lint/typecheck, unit/integration, package
  allowlist and real PTY task/activity/panel checks at 40/80/120 columns.
- [x] Update executable specs and evidence, restore demo-registry pointer,
  verify unchanged guard bytes. No commit/archive/publish or demo cleanup.

## Native Execution UI Ownership Simplification (Approved)

- [x] Review the observed `interrupted (4 calls)` case and native card ownership;
  user approved removing duplicate subagent execution presentation from Waypoint.
- [x] Persist superseding R5/R7-R9 and AC10-12/24 plus design boundaries. Keep
  native status, family tree, routing, task/config files and Trellis cards intact.
- [x] Remove Projection/replay/tool-lifecycle observation and activity capability
  from production. Remove Activity from widget, panel, status, browser/details and
  remove execution-derived task ordering. Delete only now-obsolete focused tests.
- [x] Native Check and independent lint/typecheck/unit/integration/package checks;
  verify `/reload` reconstructs task facts without execution history and no
  `Activity:` or hidden evidence ordering remains.
- [x] Update executable specs/evidence and run fresh bounded PTY checks. Restore
  demo-registry pointer without changing demo bytes. No commit/archive/publish.

Fresh no-model PTYs passed at 40x16, 80x24 and 120x24 after the ownership and
spacer removal. Final demo-pointer restoration remains part of task wrap-up.

## Native Lifecycle Styling Simplification (Approved)

- [x] Verify from native sources that Trellis implements planning -> in_progress ->
  completed; `review` is only an open-string filter example, not a written phase.
- [x] Persist the corrected lifecycle/styling and raw-detail requirements.
- [ ] Remove task-row lifecycle suffixes. Theme planning as muted, the current
  in_progress task as accent/bold, other in_progress tasks as regular text,
  completed/archived as muted/struck when visible, and custom/missing
  values as warning without inventing a phase label.
- [ ] Replace depth-first row filling with active-lineage, current-child and
  sibling-root priority; keep `>` in a fixed left column before genuine connectors.
- [x] Replace translated detail output with raw `Task status`; emit Archive only
  for a real archived path. Update README and focused width/theme/browser tests.
- [ ] Native Check, full quality/package validation and fresh PTY verification;
  update specs/evidence, then commit/archive and restore demo-registry as approved.

## Three-State Task View And Direct Browser (Approved)

The user clarified that the current expanded presentation is the desired Focused
state and approved adding Full rather than replacing that interaction. Existing
Collapsed behavior remains unchanged.

- [x] Inspect Pi 0.85.1 shortcut dispatch, `ctx.ui.custom()` focus/input routing,
  conflict diagnostics and Trellis `Alt+O`; confirm the built-in command palette
  has no public open API and custom components exclusively receive focused input.
- [x] Record Focused -> Collapsed -> Full semantics, `Alt+T` direct browser,
  transient/reset boundaries and no-write/no-model acceptance in PRD/design.
- [x] Replace the expansion boolean with an exhaustive transient task-view mode;
  keep Focused as default and first-toggle-to-Collapsed behavior.
- [x] Make Focused strictly omit side-branch descendants while Full traverses the
  loaded family in native preorder and truncates only its tail when bounded rows
  run out. Preserve row limits, marker/connectors, widths, short/dialog
  condensation and no-task/single-task no-op behavior.
- [x] Add `Alt+T` direct tree-browser entry with generation/re-entry/non-TUI
  guards and focused local arrow navigation/detail/completed-history keys. Do not alter
  the editor draft, native pointer, task/config files, native cards or `Alt+O`.
- [x] Add focused unit/integration coverage, full quality/package checks, fresh
  rendered-screen PTYs and byte guards; update README/spec/evidence. Preserve all
  demo records; restore the pre-change `waypoint-demo-config` pointer after
  verification for user inspection.

## M4. Native Integration And Dogfooding

Deliverable: evidence that the product works in its intended minimal environment.

The real maintenance Check used only Pi + Trellis + Waypoint, with a deterministic parent dispatch fixture and a real native child. It does not claim autonomous model selection. During initial implementation Strong was unset; the user has since selected the same provider/model as the main session and reported the expected Auto bypass. The two unchecked live-provider items below still require explicit real selected-model exercises. Offline role/schema/mode tests and native integrity checks already pass.

- [x] Run isolated integration tests with only Pi + native Trellis + Waypoint. Temporarily exclude development Todo/subagent plugins only in the test profile; do not uninstall the user's global tools.
- [ ] Exercise native default dispatch, selected Strong research/implement/check, ordinary-model continuation, failure/cancellation/rerun and task archive.
- [x] Cover Auto equality, On with a Strong main model, Off during use, unavailable model and unsupported thinking.
- [ ] Verify Strong role permissions and native context injection remain unchanged. Check can fix; Research stays within research/.
- [x] Do one real Waypoint maintenance task under that same minimal baseline; no manual Todo bookkeeping or generic spawn entrypoint is needed.
- [x] Record actual outcome, rework, user corrections, latency and available usage/cost as development evidence. No benchmark service, telemetry or routing threshold is added.
- [x] Remove Waypoint in the isolated profile and confirm native Trellis still runs. Inspect npm pack file listing for generated assets/private state.

Gate: every accepted AC has evidence, including AC18-19. Do not claim cost savings from a mock test or a single cheaper invocation. Live Strong calls occur only through user-approved native Trellis work, never through Waypoint APIs.

## M5. Native Review And Finish

- [x] Main agent requests a full-scope native `trellis-check` over the entire accepted MVP and relevant specs, not just the last pass. It chooses the model itself.
- [x] Run all project quality commands and review lifecycle/session/UI failure paths.
- [x] Update layer specs from actual implemented code and tests; generated bootstrap templates are not established conventions.
- [ ] Complete native spec review and present a commit plan for approval. No automatic push.
- [ ] Follow native finish/archive/journal workflow only after approval and verified completion.
- [x] At the user's subsequent explicit request, uninstall the temporary `@narumitw/pi-subagents` and `@juicesharp/rpiv-todo` packages. Both removals and nine post-removal integration tests passed; real selected-model dogfooding remains separate.

## Validation Commands

Available now (native task checks):

```bash
python3 .trellis/scripts/task.py current --json using the active session context
python3 .trellis/scripts/task.py validate 09-20-waypoint-v1
python3 .trellis/scripts/task.py list-context 09-20-waypoint-v1
```

Available now (package quality and packaging checks):

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:integration
npm pack --dry-run
```

Manual native Pi exercise: `/waypoint`, each subcommand, empty/invalid config, mode equality/bypass, real task expansion, reload, session switch, cancellation and archive. A no-model harness can test events/fixtures, but cannot certify end-to-end Strong dispatch or semantic correctness.

## Coverage Matrix

| Area | Required cases |
| --- | --- |
| Routing | All modes, same ID/different provider, same identity/different thinking, Strong unset/unavailable, task/error events have no policy influence, explicit user choices outrank defaults without argument rewriting. |
| Context | Multiple tool continuations, config changes, Off removal, rebuilt contexts, exactly one projected policy, original user/Trellis content preserved, no persistent copies or summary hooks. |
| Config | Missing file, invalid JSON, unsupported fields/values, save failure, cancellation, session override isolation. |
| Thinking | max, no xhigh, off, non-reasoning model, newer runtime levels, invalid saved value, no silent clamp. |
| Native events | Preflight vs running, unknown details, failure without isError, mixed batch, cancellation, out-of-order end, rerun. |
| Task identity | Multiple sessions, stale pointer, malformed JSON, path traversal/symlinks, task switch during execution, archived/missing/cyclic children. |
| History | Reload, new/fork/resume/tree, compacted/missing history, unmatched old results, no cross-task carry-over. |
| Completion | Successful pass is not full-scope Verify; finish clears pointer only; archive partial failure stays explicit. |
| UI | Narrow/wide, long/CJK labels, theme invalidation, active multiple agents, RPC/headless, close/cancel/cleanup. |
| Boundaries | No model API/spawn/task writes, no generic plugins, no task-derived upgrade hints, uninstall leaves native behavior intact. |

## Rollback Boundaries

Each pass should leave native Trellis untouched. On a regression, disable the affected Waypoint capability with a visible diagnostic, or disable/remove Waypoint entirely. Never repair compatibility by editing `.pi/extensions/trellis/index.ts`, adding a substitute runtime, or changing native task records. Keep user config recoverable.
