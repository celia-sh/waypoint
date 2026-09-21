# Implementation Evidence

## Context Summary

- **Question:** What behavior and verification evidence supports the archived
  Waypoint implementation without making the task record depend on a local
  machine, session, or temporary harness?
- **Why local evidence was initially insufficient:** Native Pi/Trellis behavior
  and rendered terminal behavior required host integration checks in addition to
  unit fixtures. The durable record needs their results, not their raw captures
  or execution locations.
- **Facts used:** The implementation keeps Trellis as workflow/execution owner,
  Waypoint as guidance plus read-only task projection, and the npm package
  allowlist separate from repository project files.
- **Constraints:** No Waypoint model calls, dispatch wrapper, task writes,
  alternate workflow, generic subagent runtime, generated integration edit, or
  user configuration mutation. Unknown native evidence remains unknown.
- **Uncertainty:** Simulated and rendered terminal fixtures do not certify model
  judgment, provider caching, all terminal keymaps, or a full-scope Check. A
  future host release requires contract revalidation.
- **Consequence:** The recorded checks support compatibility and UI boundaries,
  not autonomous routing quality, cost savings, or product-task completion.
- **Redaction check:** Removed absolute paths, external URLs/source locators,
  installation and checkout details, temporary capture names, session IDs,
  user/machine identifiers, provider-specific configuration, and raw session or
  terminal data. Repository-relative files, commands, results, constraints,
  and known limitations remain.

## Scope And Native Implementation

The approved Waypoint MVP was implemented and reviewed through native Trellis
roles. The source owns configuration, model identity comparison, short routing
guidance, bounded task loading, and a read-only native task widget. Trellis owns
workflow, task records, role execution, progress cards, and task lifecycle.

The implementation and focused tests covered:

- validated configuration, atomic saves, forward-key preservation, session-only
  mode overrides, missing/corrupt configuration, and cancellation;
- exact provider-plus-ID model identity, registry-derived thinking capabilities,
  sparse thinking levels, unavailable models, and invalid saved values;
- one current policy projection before each main-agent request, including tool
  continuations, with explicit user model/thinking choices taking precedence and
  no policy copies persisted in history;
- session-scoped native task identity, bounded family loading, parent/child and
  archive reconciliation, cyclic/malformed/missing records, current-lineage
  priority, deep ancestry, unrelated-root exclusion, and unknown evidence;
- native status labels, compact routing output, ASCII markers/connectors, CJK and
  long-name width handling, focused/collapsed/full views, completed-family
  browsing, panel/shortcut lifecycle, dialog and resize condensation, cancellation,
  reload, cleanup, and non-TUI behavior;
- package-boundary assertions that exclude model calls, network calls, task
  writes, generated integration edits, generic Todo/subagent dependencies, and
  native footer/editor replacement.

No generated Trellis integration, native task record, user configuration,
keybinding file, package metadata, or unrelated source module was changed by the
implementation passes except where the approved product revision explicitly
listed the Waypoint source, focused tests, README, or layer documentation.

## Verification Results

The final archived verification series included:

| Check | Result |
| --- | --- |
| Biome lint | Passed across source and test files |
| TypeScript typecheck | Passed |
| Unit tests | Passed; the final presentation series reported 144 tests across seven files |
| Integration tests | Passed; the final series reported 17 tests across four files |
| npm package dry run | Passed; the historical allowlist contained README, package metadata, and six source modules |
| Native integration integrity | Passed against the recorded project-local initialization baseline |
| Manifest validation | Passed for the curated task manifests, with only the expected unborn-main warning at the time |
| Native child maintenance | Completed a real native Implement/Check loop without parent extension errors |

The unit and integration fixtures used synthetic registries, in-memory sessions,
fake streams, deterministic native progress, and disposable task projects. They
verified model-request counts, context projection, task/config byte preservation,
shortcut registration, native schema forwarding, and Waypoint removal leaving
Trellis usable. No real model request was required by these tests.

## Rendered Terminal Evidence

Disposable native Pi profiles exercised 40-column, 80-column, and 120-column
layouts, including short heights. They covered panel and task-browser navigation,
model and thinking selector cancellation, mode/status changes, reload, resize,
dialog restoration, family navigation, completed filtering, deep ancestry,
overflow, current markers, native footer visibility, unsent editor content, and
zero model requests. The saved task/config/native bytes matched their fixtures and
all test processes exited cleanly.

The checks prove Pi's received-key and rendering behavior in the tested profiles;
they do not prove a user's terminal maps every physical Option/Alt key sequence in
the same way. The panel remains the fallback when shortcut delivery is uncertain.

A pre-existing narrow-layout model clipping artifact was reproduced in both the
baseline and current renderer. The compact `@` prefix did not introduce it; no
unrelated renderer fix was made. Existing tests continue to assert bounded output,
routing labels, notices, and current-model visibility without claiming pristine
long-model rendering.

## Native Ownership Findings

- Native Trellis cards and its execution shortcut remain the sole detailed
  presentation of dispatched/running/result information.
- Waypoint does not subscribe to or replay native execution history for its task
  rows. Task status comes from native records; Activity/pass/final-scope claims
  are not synthesized by the archived final design.
- A successful native run is not independent proof of correctness. Clearing an
  active pointer is not completion, and absent final-scope metadata remains
  explicitly unconfirmed.
- Generic development plugins were excluded from the final maintenance baseline;
  their temporary removal did not alter Waypoint source or native Trellis.
- The known native limitation around explicit thinking `off` forwarding remains a
  diagnostic. Waypoint does not patch the generated integration or silently claim
  unsupported behavior.

## Remaining Limits

The archived evidence does not claim a live-provider Strong-routing exercise,
semantic model judgment, comparative token/cost savings, guaranteed provider
caching, complete transcript reconstruction, or release/publish approval. Native
host upgrades require fresh schema, capability, session, progress, rendering, and
integration checks.
