# Native Status Implementation Handoff

Implemented the latest approved Native Task Status And Activity Separation only.
The user's `Processing` label for native `in_progress` takes precedence over the
historical Started/phase presentation. Main-session native Check, spec updates,
fresh real PTY verification and demo-pointer restoration remain separate.

## Files Changed

- `src/ui.ts`: native status mapping for task rows and root/browser summaries;
  removed UI-only phase helpers and duplicate run/model history; Native details
  now exposes identity, raw status, archive location, relations and read diagnostics.
- `tests/unit/task-widget.test.ts`: replaced superseded inline phase assertions,
  retained family/width/theme/height coverage, and added status/activity regressions.
- `tests/unit/extension-ui.test.ts`: revised panel/browser/status assertions and
  added scoped activity, native metadata and raw-status diagnostic coverage.
- `tests/integration/compact-status.test.ts`: native Processing assertion and
  updated test description in the existing width/height integration matrix.
- `README.md`: describes native status, separate activity and native card ownership.
- This implementation handoff.

No changes to `src/trellis.ts`, `src/index.ts`, model/config/routing modules,
Projection decoder/replay/phases or their safety tests, generated integration,
package manifests, user settings, native task records or demonstration records.
No dispatch, lifecycle, commit, archive or publication commands were run.

## Presentation And Evidence

- Planning, Processing, Review and Completed come only from native task status.
  Missing/custom status displays Unknown, with sanitized raw value in details.
  Archive context remains a distinct qualifier, never a replacement status.
- Expanded widgets reuse the blank spacer for at most one Activity row. Existing
  task capacity and eight-row maximum remain; collapsed/short/dialog views omit
  activity and keep two rows. No active widget task means one routing row.
- Activity uses task-bound `Projection.forTask` data and the latest connected
  overlapping group per role, including transitive overlaps. New nonoverlapping
  same-role groups supersede old outcomes. Success emits no persistent cue.
- Terminal/unknown call state overrides retained run data; active calls retain
  failed/cancelled peers and bounded-history unknown evidence. Other-role success
  cannot erase adverse evidence. Branch prioritization remains independent of
  native status.
- Narrow aggregation counts calls or tasks explicitly and retains adverse/live
  meaning. One non-current task retains its title attribution even when several
  roles contribute; multiple tasks may aggregate to a task count. Dense cues may
  use `adverse`, `active` or `adverse/active`, without suggesting completion.
- Panel and task-detail activity is scoped to the displayed task. Native Trellis
  cards and Alt+O remain unchanged and own detailed execution information.

## Actual Verification

Final commands all passed:

- `npm run lint`: 18 files, no errors.
- `npm run typecheck`: passed.
- `npm test`: 154 tests in seven files passed.
- `npm run test:integration`: 17 tests in four files passed.
- `npm pack --dry-run --json`: eight allowlisted files (six source modules,
  README and package.json), no private/native task/runtime content.
- SHA-256 verification of the disposable guard manifest: all 29 entries
  unchanged.
- Byte comparison of the baseline's 22 source/test/README/package files: only
  the five implementation/test/README paths above differ. Underlying native
  projection and family tests remain byte-identical.

Tests cover native status stability for all three roles through dispatch,
running, success, failure and rerun; all native labels and missing/custom values;
parent/child independence; failed/cancelled/interrupted/unknown evidence;
parallel peers, transitive overlaps, same-role supersession, concurrent roles,
actual dangling replay and the 256-call history bound; sibling attribution,
closed/unrelated family exclusion and projection/session replacement; deep
ancestry, overflow, CJK/control bytes, 40/80/120 widths, 16/24/40 heights, semantic
colors, collapse/dialog restoration, panel reachability and native detail menus.

During test development, a replay fixture initially used a nonexistent task path,
which native realpath containment correctly rejected. It now uses a disposable
real task directory and cleans it up. A fixture Map inference and a lint-invalid
control-character regex were also corrected. These were test fixture issues;
all final commands above were rerun after the corrections.

## Remaining Verification And Limits

No new real PTY or provider/model exercise was run by this Implement child.
The main session owns independent native Check and fresh rendered-screen PTYs,
including the isolated no-model native activity fixture. Unit/simulated-terminal
results are not a substitute for those checks. Existing long-model clipping was
intentionally left unchanged. The native task remains in progress; this handoff
makes no semantic acceptance, final task completion or release claim.
