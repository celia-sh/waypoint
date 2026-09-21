# Native Task Status And Activity Separation: Check Review

## Result And Scope

Completed the native Check review directly, without recursive agents. No in-scope
product defect remains identified. No production source fix was needed; Check
strengthened focused regression coverage with 13 additional parameterized cases.
Fresh real PTY verification remains with the main session and is not claimed here.

Loaded `check.jsonl` and all seven curated spec/research entries, then the current
PRD, design and implementation plan. The latest approved Native Task Status And
Activity Separation section, including Processing for native in_progress,
supersedes historical phase/inline-result presentation requirements.

The project files were untracked and the diff was empty during this historical
review. Therefore the review used a supplied disposable byte snapshot, not an
empty git diff as proof of no changes.
Compared all 22 snapshotted source/test/README/package files. Only the five
expected implementation files differ:

- `src/ui.ts`
- `tests/unit/task-widget.test.ts`
- `tests/unit/extension-ui.test.ts`
- `tests/integration/compact-status.test.ts`
- `README.md`

## Findings And Coverage Added

No product correction was required. Check edited only the two existing focused
unit test files above and this report.

- Fixed a coverage gap in terminal ordering: all six completion permutations of
  three overlapping failed/cancelled/successful calls, with fixed dispatch order,
  now run for implement, check and research. Assertions cover live/adverse meaning
  at 40/80/120 columns, newer nonoverlapping activity, ignored late malformed/error
  events for ended calls, and removal of the cue after the fresh group succeeds.
- Added mixed current/non-current role coverage at 40/80/120 columns, 16/24/40
  terminal rows and both expansion preferences. Assertions cover a single
  Activity row, two-task aggregation, CJK sibling attribution after current work
  succeeds, excluded closed/unrelated activity, sanitization, native current
  status/marker retention and bounded themed rendering.
- Added seven native/custom status cases across root panel, task browser, Native
  details and full details while implementation runs and after success. These
  cover planning, in_progress, review, completed, missing, a misleading `running`
  native value and another custom value. Unknown values retain raw diagnostics;
  no phase table, pass-complete cue, final-scope disclaimer or requested/reported
  run-model dump reappears.

The first new mixed-width test incorrectly rejected harmless textual remnants of
sanitized escape sequences and included the explicitly excluded existing compact
model-clipping limitation in its assertion. Corrected the test to reject actual
injected terminal escapes, check generated reset artifacts only in task/activity
rows, and preserve the existing sanitizer contract. No sanitizer or model-label
product change was made. All final gates were rerun after test correction and
formatting.

## Reviewed Behavior

- Native status mapping is independent of Projection phase results, including
  parent/child independence. Archive location and current pointer are separate
  facts; clearing the pointer does not complete a task.
- Activity uses task-bound calls and the latest connected overlap group per role,
  including transitive overlaps. Unknown/terminal call facts take precedence over
  retained run data. Running groups preserve failed/cancelled peers, and bounded
  missing history remains unknown. Same-role fresh groups supersede old outcomes;
  other-role success does not erase relevant adverse evidence.
- Expanded widgets reuse the spacer for at most one Activity row, preserving the
  eight-row maximum and task-row priority. Collapsed, short and dialog-condensed
  widgets omit Activity and retain two rows. No active task means at most one
  compact routing row without stale activity.
- Widget activity excludes closed/unrelated family records. Panel/browser cues
  are scoped to the task being displayed. Full Native details retain identity,
  raw status, archive location, relationships and read diagnostics.
- Success leaves no persistent success cue. Detailed native run/model evidence
  and Alt+O remain owned by the unchanged Trellis integration.
- Existing deep ancestry, overflow, family isolation, semantic color, lifecycle,
  dialog restoration, shortcut and underlying decoder/replay safety tests remain.

## Actual Final Verification

- `npm run lint`: passed, 18 files checked.
- `npm run typecheck`: passed.
- `npm test`: passed, 167 tests across seven files.
- `npm run test:integration`: passed, 17 tests across four files.
- `npm pack --dry-run --json`: eight allowlisted files, six source modules plus
  README and package.json; no native tasks, runtime, tests or private config.
- SHA-256 comparison against `guard-hashes.json`: all 29 entries unchanged.
  This includes all five protected source modules, generated native integration,
  user Waypoint configuration and all 22 demo task/PRD files.
- Native integration hash still matches the recorded initialization hash.
- Baseline comparison confirms Projection/family safety tests, source wiring,
  config/routing/models and package manifests remain byte-identical.

Integration output retains the known Trellis explicit-thinking-off forwarding
compatibility diagnostic; it is not introduced by this presentation revision.

## Remaining Main-Session Work

Run the planned fresh real PTYs with isolated native-shaped execution evidence,
update the superseded executable presentation specs/evidence, and restore the
existing demo-registry pointer through the native lifecycle. No real PTY or model
request was performed by this Check. No actual task/demo/user-setting changes,
commit, archive, publication or pointer lifecycle commands were made. Existing
long-model clipping remains intentionally out of scope.
