# Native Execution UI Ownership Simplification: Final Check

## Result

Full-scope independent Check passed. No product-source defect remains identified.
Waypoint now observes only the current native session pointer and bounded task
records for task presentation; native Trellis cards and Alt+O remain the sole
execution UI. No commit, publication, archive, demo cleanup or pointer restoration
was performed.

## Findings Fixed During Check

- Updated stale executable layer specs and curated-context wording that still
  required Projection/replay, activity-derived ordering, phase/pass UI and
  requested/reported run details. They now match the approved ownership boundary.
- Marked the separate-Activity research as historical/superseded while preserving
  its decision record.
- Strengthened `tests/unit/boundaries.test.ts` so production scans also reject
  Projection/forTask replay, native progress decoding, Activity/pass/final-scope
  strings, incomplete-history state and requested/reported model fields.

No `src/` correction was needed.

## Source And Behavior Review

- `src/index.ts` has no `tool_execution_start`, `tool_execution_update` or
  `tool_execution_end` subscription. Session-branch reads restore only the
  explicit Waypoint mode override.
- `src/trellis.ts` has no Projection, replay, call/run evidence, progress decoder
  or execution-derived ordering. Family resolution remains active-lineage first,
  bounded and native-sibling ordered.
- `src/ui.ts` contains no Activity, phase table, role/run/pass result,
  incomplete-history warning or requested/reported execution model display.
  Status maps only as planning -> Planning, in_progress -> Processing, review ->
  Review, completed -> Completed, otherwise Unknown with raw details.
- Expanded task rows directly precede the final `@` routing row. There is no
  Waypoint-owned blank spacer; short/dialog/collapsed behavior and row bounds are
  unchanged.
- Routing/config guidance, exact provider/model identity, family scoping, Alt+W,
  TUI guards, non-TUI status and package allowlist remain intact.
- `.pi/extensions/trellis/index.ts` still matches its recorded SHA-256
  `b53f1b5ac66f4ed15a46e1f5b013e0074e23695e86a55a724d4c273032d9fb41`.
  `renderProgressCard`, its Alt+O help, and native Alt+O registration remain present.

## Verification

- `npm run lint`: passed (18 files).
- `npm run typecheck`: passed.
- `npm test`: 123/123 passed across seven unit files.
- `npm run test:integration`: 17/17 passed across four integration files.
- `npm pack --dry-run --json`: exactly eight public files (README, package.json
  and six `src/*.ts` modules); no Trellis runtime/task/test/private state.
- `task.py validate 09-20-waypoint-v1`: both seven-entry manifests passed. The
  expected unborn-branch warning remains.
- Production scans found no execution lifecycle event, Projection/replay,
  progress-decoder, Activity/pass/final-scope, model-call/runtime-spawn, generic
  Todo/subagent dependency, footer replacement or task-write surface.

## Integrity Notes

Against the disposable guard manifest, the native integration and all 22 demo
task/PRD records are unchanged. `src/config.ts` and
`src/routing.ts` are byte-identical to that baseline; package manifests are also
unchanged. The expected source differences are removal of activity capability,
Projection/replay and tool-lifecycle wiring plus the task-only UI.

The user-level Waypoint configuration already differed from an earlier baseline
before this ownership implementation. It retained the same current hash
throughout this Check and was not rewritten or restored. The active pointer
remained on the product task; demo records and pointer files were not modified.

No fresh real-provider request or PTY run was needed for this source/test Check;
prior PTY evidence remains separate. The known native Trellis 0.6.17 explicit
thinking=off forwarding diagnostic is unchanged.
