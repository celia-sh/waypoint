# Native Task Status And Execution UI Ownership

Status: the separate Activity cue described below was implemented and reviewed,
then superseded after live use by the approved Native Execution UI Ownership
Simplification in `design.md`. Current Waypoint production UI shows native task
records only; native Trellis cards and Alt+O exclusively own execution activity.
The earlier section is retained as decision history, not a current contract.

## Verified Local Sources

- `.pi/extensions/trellis/index.ts:118`: native RunStatus is pending, running,
  succeeded, failed, cancelled; it is not task.json.status.
- `:330-380`: native runHeader/renderRunBlock/renderProgressCard already show
  role, batch progress, elapsed time, model/thinking, usage, tool activity and
  expanded errors. Keep this as the detailed execution surface.
- `:1850-1866`: Alt+O toggles the latest native subagent card, not a Waypoint view.
- `.trellis/scripts/common/task_store.py:529`: task creation writes planning;
  `.trellis/scripts/task.py:112` changes planning to in_progress on start;
  archive sets completed. CLI filter help also mentions review; running a check
  does not automatically set review. Archive location is a separate fact.
- Waypoint's former `inlineStates`, `phaseLines` and `phaseSummary` mixed derived
  execution/phase evidence into task lifecycle display. `pass complete` was an
  internal projection label, not native status or independent semantic acceptance.

## Historical Activity-Separation Revision (Superseded)

The user initially requested fitting native Trellis without deleting all
activity visibility, approved the proposed division with "改", then requested
Processing as the English display for in_progress. This records that intermediate
revision; current PRD R5/R7-R9 and the Native Execution UI Ownership
Simplification in `design.md` supersede its Activity requirements.

Keep tasks native and stable; use a separate bounded activity cue for running or
adverse evidence, native cards for detailed runs, and native metadata/diagnostics
in task details. Do not rewrite native integration, model/config/routing, task
loader, evidence decoder or underlying phase/replay safety tests. Prior specs'
phase-table and inline-result presentation clauses are superseded; update them
after verified implementation. Preserve all demo task files and user settings.

Use existing widget spacer for optional Activity row, preserving eight expanded
total rows. Collapsed/short/dialog views stay two rows with no activity merged
into task status. Unknown/incomplete execution is not success; native lifecycle
mapping never asserts running work or completed verification. Clear success cues
by omission, not by mutating run evidence. Tests for that intermediate revision preserved overlapping failure,
rerun/scope safety and attribution to the correct native task.

## Current Approved Ownership

- Waypoint does not subscribe to `tool_execution_start`,
  `tool_execution_update` or `tool_execution_end`, decode/replay subagent runs,
  or retain a Projection/activity capability.
- Widget, panel, status, browser and Native details show no Activity, role/run,
  pass result, model/thinking or incomplete-history presentation.
- Task order follows the verified active lineage and native sibling order only.
  Reload reconstructs the view from this session's pointer and bounded task
  records, with Planning / Processing / Review / Completed / Unknown mapping.
- Native `renderProgressCard` and Alt+O remain untouched and own dispatch,
  concurrency, result, model/thinking, usage, tool and error presentation.
