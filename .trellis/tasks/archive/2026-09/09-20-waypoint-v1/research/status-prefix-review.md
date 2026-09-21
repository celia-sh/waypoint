# Compact Status Prefix Review

## Verdict And Scope

Completed native Check of only the approved Compact Status Prefix Simplification.
No in-scope findings remain; no code or test fixes were needed. This is not a
new full-product review or a live-provider/real-terminal verification claim.

Loaded check.jsonl, all six curated entries, PRD, design, implementation plan,
implementation handoff, and the native UI host documentation. The active-task
read reported `.trellis/tasks/09-20-waypoint-v1`. No task lifecycle command or
subagent dispatch was performed.

The repository was unborn during this historical review: the working tree
contained untracked project files, the diff was empty, and HEAD did not exist.
Therefore review used a provided disposable baseline, not an invented Git
revision.

## Changes Reviewed

- `src/ui.ts:499`: the complete source-tree diff consists of exactly two changed
  prefix lines in `compactLines`. Accent-colored `Waypoint ${state.mode}` and
  the muted ` | ` separator become accent-colored `@` and one plain space.
  A separate executable assertion confirmed the current file equals the baseline
  with precisely that replacement.
- `tests/unit/task-widget.test.ts`: eight additional parameterized cases cover
  all four routing states, semantic colors, neutral same-model bypass, exact
  short-model output, explicit mode/thinking in full details, long/CJK models,
  task/no-task and notices, plain/themed output, 40/80/120-column widths and
  16/24-row heights. Two existing widget-prefix assertions are updated.
- `tests/unit/extension-ui.test.ts`: only the widget accent assertion changes.
  Existing panel title/mode, sanitization, theme invalidation and lifecycle
  assertions remain intact.
- `tests/integration/compact-status.test.ts`: only the expected compact prefix
  changes in the existing width/height matrix. Evidence, width, current marker,
  CJK and spacing assertions remain intact.
- `README.md:96`: narrowly documents the ASCII marker and four routing labels,
  retaining explicit mode in the panel and `/waypoint status`.

No pre-existing safety/evidence assertion was removed or weakened. Other source
modules are byte-identical to the baseline. Panel/full-status implementation,
model formatting logic, routing/configuration, native task projection/lifecycle,
footer, shortcuts and persisted state are unchanged.

## Independent Verification

Commands executed on 2026-09-20:

| Check | Actual Result |
| --- | --- |
| `npm run lint` | Passed; 18 files, no fixes applied |
| `npm run typecheck` | Passed |
| `npm test` | Passed; 139 tests in 7 files |
| `npm run test:integration` | Passed; 17 tests in 4 files |
| Baseline/current renderer probe through host jiti | Passed; 96 combinations |
| SHA-256 verification of guard-hashes.json | Passed; all 18 entries |

The independent renderer probe loaded both untouched baseline and current UI
modules with host package aliases. Across four routing states, short/long CJK
models, notices on/off, 40/80/120 columns, and plain/themed output it verified:

- Full `statusLines` and `renderStatus` results remain identical to baseline.
- New compact output starts with the intact `@ <routing>` label and fits width.
- At 120 columns, unclipped short-model output differs only in the prefix.
- The reported long-model clipping issue is reproducible in both versions.

The guards cover all five other source modules, generated native Trellis
integration, user Waypoint configuration, and all eleven guarded demo task
records. All were unchanged. Package manifests and lockfile were also compared
against the saved baseline and remain unchanged.

## Pre-Existing Residual

The literal `[0m` artifact is real but predates this request. `truncateToWidth`
can insert an ANSI reset in a clipped model label; `paint` then calls `plain`,
which replaces the escape control character with a space while leaving `[0m`.
The model path at `src/ui.ts:517` onward and `paint`/`plain` are unchanged.

Independent 80-column enabled/no-notice reproduction (plain output):

```text
Baseline: Waypoint auto | enabled | now 界currentcurrentcurr [0m / Strong 界providerprovid
Current:  @ enabled | now 界currentcurrentcurrentcurr [0m / Strong 界providerproviderprovi
```

The shorter prefix changes clipping positions and makes more model text visible;
it does not introduce the reset/sanitization defect. At 40 columns with notices,
the baseline can omit all models, while current output can include current text
and a clipped Strong label:

```text
Baseline: Waypoint auto | enabled | task notices
Current:  @ enabled | task notices | C:界cu [0m S:
```

Do not treat passing width assertions as proof of pristine long-model rendering.
Both artifacts remain an explicitly documented, pre-existing clipping limitation,
left untouched per the prefix-only delegation. No existing test was relaxed to
accept this limitation.

## Handoff And Files Changed By Check

This Check created only `research/status-prefix-review.md`. No product source,
tests, task records, global settings, generated integration or demo pointer was
changed. No commit, archive, publication or new dependency was introduced.

Main retains real terminal smoke testing, frontend spec/plan/evidence updates,
and the authorized demo-pointer restoration. This review does not claim those
steps have already occurred.
