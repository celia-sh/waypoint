# Extension Contracts

## 1. Scope / Trigger

Use this spec for changes to configuration, model guidance, native task reads,
or Pi lifecycle wiring. Implementation lives in the six
`src/*.ts` modules; tests are under `tests/unit` and `tests/integration`.
Trellis owns task lifecycle and execution. Waypoint only reads those facts.

## 2. Signatures

- `ConfigStore.load(): Promise<ConfigState>` and `save({strongModel, strongThinking})` in `src/config.ts`.
- `routingPolicy(mode, config, current, usable): string | undefined` and `projectPolicy(messages, policy?)` in `src/routing.ts`.
- `supportedThinking(model, capability)` intersects Pi's public helper and native forwarding capability in `src/models.ts`.
- `compatibility(root, trusted, tools, active)`, `loadTasks(root, key, lastObserved?)`, `taskFamily(snapshot, includeCompleted?)` and `TaskObserver.dispose()` in `src/trellis.ts`.
- `TaskSnapshot.familyRoot` identifies the verified containing requirement, separate
  from `active`. `taskClosed(task)` tests native completed or archive location;
  `taskFamily(snapshot, includeCompleted = false)` filters the resolved family
  without writing task state.
- The factory in `src/index.ts` registers one command, native Alt+W task-view
  cycling, Alt+T direct tree browsing, and configuration/session/task-observation
  handlers, never a model-call, task-write tool or `trellis_subagent`
  execution-lifecycle subscriber.

## 3. Contracts

Config uses the host `getAgentDir()` and honors `PI_CODING_AGENT_DIR`. Persist
only the user's Strong identity/thinking selection while preserving unrelated
JSON keys; mode overrides are `waypoint-mode` custom entries with `{mode}`.
Replay those entries from `getBranch()`, not all session entries. Missing config
means Auto and no selected Strong. Saves are serialized atomic replacements.

The `context` handler reloads current config and returns one ephemeral
`waypoint-routing-policy` custom message. Remove only Waypoint's marker; preserve
all other messages and their relative order. When a policy is applicable, insert
it immediately before the latest real `user` message; append only when no such
message exists. Off, unavailable capabilities and Auto provider/ID equality
produce no policy. Explicit user instructions outrank the default preset. The
policy separates delegation from model strength: simple bounded work may still
be delegated to the normal/current model, while Strong requires an evidence-backed
reasoning bottleneck and is not automatic insurance. Do not parse user prose or
turn native execution outcomes into upgrade advice.

Native compatibility verifies trusted root, registered and active tool,
`sourceInfo.path`, exact tested integration bytes, role files and dispatch schema.
The checked-in source hash is provenance for Trellis 0.6.17, not a claim of
universal version support. Upgrade the hash only with native forwarding and
source-integrity fixtures. In this version explicit `off` is omitted in the native CLI arguments, while
`max` is forwarded. Unsupported saved values remain visible and unchanged.

Task resolution uses the exact native session key, including its truncated hash
when normalization changes identity. Reads are bounded and realpath-contained.
`parent/children` is the hierarchy; verify reciprocal edges rather than inferring
relationships from names, document lists or a project-wide task catalogue. Start
at this session's active node and reserve its valid unfinished/unarchived parent
chain before side branches. Schedule known lineage references from current toward
root, prioritizing nearby live children/siblings before distant or archived reads.
Restore native sibling order after loading; read priority is not display order.

Bound task record attempts to 64, traversal to 16 edges, queued/reference work to
4096, and archive month lookup to 240. Closed history must not consume the live
branch budget first. Missing, malformed, cyclic, asymmetric or ambiguous records
are diagnostics, not synthetic nodes, completion or exact unseen-task counts.
Only known bare references receive bounded archive lookup; unrelated archived
records are not enumerated. Stop at an invalid/closed ancestor boundary and retain
the active task's established context, without a global fallback.

Native Trellis retains an archived child's name in its parent's children list.
Archiving a parent clears its children's parent fields; detached children may be
relinked elsewhere. Do not reconstruct these edges through historical children
lists, import their new family, or diagnose ordinary archive detachment as corrupt.
Still-reciprocal archive relationships remain available for explicit scoped detail.
`taskFamily` excludes completed/archived rows unless requested, except structural
context necessary for an active/unfinished descendant; such inconsistent context
is labeled and diagnosed. Native status and archive location remain distinct facts.

Waypoint does not own run evidence. Production code must not subscribe to
`tool_execution_start`, `tool_execution_update` or `tool_execution_end`, decode
`trellis-subagent-progress`, replay subagent calls from the session branch, or
order tasks from hidden execution facts. Native Trellis progress cards and Alt+O
exclusively own dispatch state, role/run outcomes, models/thinking, usage, tools
and errors. Reload reconstructs the Waypoint task view only from the current
session pointer and bounded native task records; session-branch reads are limited
to restoring the explicit Waypoint mode override.

## 4. Validation & Error Matrix

| Input / transition | Required result |
| --- | --- |
| Invalid JSON / oversized config | Diagnose; preserve original bytes and refuse save |
| Unavailable model / unsupported effort | No policy; do not substitute a model or clamp effort |
| Unknown native source / inactive tool | No routing offer or execution claim; native tool unchanged |
| Escaping pointer, symlink or malformed task | Unknown/diagnostic, no other-session fallback |
| Native subagent dispatch/update/result | Native card only; Waypoint task status and ordering remain record-derived |
| Reload with historical/dangling calls | Ignore execution history; reload current pointer and bounded task records only |
| `task.py finish` | No active task; no completion inferred from pointer removal. The last directory may be reconciled transiently by native device/inode identity, never merely by a reused name. |
| Native completed / archived record | Report native status and location separately; a reconciled recent task stays explicitly not active. No procedural certification. |
| Active child / grandchild | Same verified containing family, retained lineage/nearby live context; no independent roots |
| Large related history or branch fan-out | Enforce read/reference/depth bounds; prioritize current lineage and nearby live references; explicit partial-evidence diagnostic |
| Archived parent with detached/relinked child | Do not restore the historical edge or import its new requirement; normal native detachment is not corruption |
| Session shutdown/tree/runtime replacement | Dispose observers; reset transient task view to Focused; isolate state and async generations |
| Alt+W / Alt+T | Cycle only in-memory view or open read-only family tree UI; tree navigation and details/history are transient; never write task/config/session state, activate a task or request a model |

## 5. Good / Base / Bad Cases

- Good: `providerA/modelX` differs from `providerB/modelX`; Auto can offer the configured model.
- Base: identical provider/ID and different thinking still bypasses Auto.
- Bad: counting retries, task size or errors to change policy; reading another session's pointer to fill missing state.

## 6. Tests Required

Run `npm run lint`, `npm run typecheck`, `npm test`, and
`npm run test:integration`. Pure tests must assert no config clamping, no duplicate
policy, no task writes, no execution observer/replay surface, stable native status,
bounded unsafe inputs and observer cleanup. Integration uses real pinned Pi and
the original native extension with a fake stream/CLI, not copied production
runtime logic. Preserve the native initialization hash assertion and native
Alt+O/progress-card ownership. `tests/unit/task-family.test.ts` must
cover reciprocal/invalid links, active lineage, current-near read priority under
large live/history lists, archive detach/relink behavior and unrelated archive
exclusion. Real model judgment/caching is not established by offline fixtures.

## 7. Wrong vs Correct

Wrong: subscribe to `trellis_subagent` tool events, replay old calls and expose
an `Activity:` or pass-result row beside the native card.

Correct: style titles only from native planning/in_progress/completed or archive
location, preserve raw/custom status in details, and leave dispatch/run/model/tool/
error presentation to native Trellis cards and Alt+O. Trellis 0.6.17 has no native
review transition; do not promote generic string/filter values into new phases.
