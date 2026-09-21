# Compact Status Prefix Implementation

## Scope

Implemented only the approved `@` compact-widget prefix for the archived
Waypoint task. No subagents were dispatched.

Files changed:

- `src/ui.ts`: `compactLines` replaces the accent-colored
  `Waypoint ${state.mode} | ` prefix with accent-colored `@` plus a space.
  Routing retains its existing semantic color; model formatting, notices,
  task rows and width/height logic are unchanged.
- `tests/unit/task-widget.test.ts`: update two prefix assertions and add eight
  parameterized cases covering all four routing states, semantic theme roles,
  exact short-model/same-model formatting, explicit full-status modes,
  long/CJK identities at 40/80/120 columns, task/no-task, notices, themed/plain
  output and 16/24-row terminals.
- `tests/unit/extension-ui.test.ts`: update the widget accent assertion only;
  the existing panel title/mode assertions remain unchanged.
- `tests/integration/compact-status.test.ts`: update the status-prefix assertion
  in the existing 40/80/120-column by 16/24/40-row matrix.
- `README.md`: clarify the marker and routing labels, with explicit mode still
  available in the panel and `/waypoint status`.
- This implementation report.

## Verification

Final commands on 2026-09-20:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed, 18 files; no fixes applied |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 139 tests across 7 files |
| `npm run test:integration` | Passed, 17 tests across 4 files |

An initial new-test regex was over-escaped and corrected. Long-model assertions
were narrowed to the existing clipping contract described below; routing labels,
notices and row widths remain asserted in every combination.

Compared against a disposable baseline: the source diff is exactly the two
prefix lines in `src/ui.ts`; tests and README contain only the changes listed
above. All 18 entries in `guard-hashes.json` match, including other source
modules, generated native integration, user config and all guarded demo task
records. `task.py current --source` still reports the original product task.
No pointer/lifecycle command, keybinding change, commit, archive or publication
was performed. No dependencies were added.

No real PTY or live-provider verification is claimed. Native Check, independent
verification, real terminal smoke and frontend spec update remain with the main
session.

## Pre-Existing Clipping Observation

Long model text can expose `[0m` because the existing model path sanitizes the
ANSI reset inserted by `truncateToWidth`. Reproduced by loading the untouched baseline `src/ui.ts` through the tested
host loader:
80-column enabled output began
`Waypoint auto | enabled | now ... [0m / Strong ...`.
The compact prefix change does not modify that model-rendering path.

At 40 columns with task notices and long model identities, existing final-line
clipping can omit some or all Strong text. Tests require bounded output, intact
routing/notices and current-model text there; both model labels/identity prefixes
are checked at wider widths and without notices, and exact short-model formatting
is checked separately. This pre-existing rendering issue is left unchanged to
honor the explicit prefix-only scope and should be assessed separately by the
main session.
