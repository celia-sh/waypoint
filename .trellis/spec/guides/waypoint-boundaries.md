# Waypoint Boundaries

These constraints come from the product brief and user clarification. The first implementation now lives in `src/`; executable contracts and validation commands are documented in [Extension Contracts](../backend/extension-contracts.md) and [Native Pi UI](../frontend/native-ui.md).

## Ownership

- Trellis owns task records, context artifacts, role definitions, workflow and subagent execution.
- The main agent owns problem interpretation, evidence collection, task decomposition, dispatch and model choice.
- Waypoint owns user configuration, short advisory routing guidance and a read-only native task projection.
- A stronger model does not change a Trellis role's permissions.

## Required Boundaries

- Guidance, never event-triggered advice to use Strong. Delegation and model strength are separate decisions: bounded simple work may be delegated to the normal/current model, while Strong requires an evidence-backed reasoning bottleneck. No semantic classifier, retry threshold, token/file threshold, or cost scheduler.
- No model completion/streaming calls, agent spawning, extra sessions, generic subagent dependencies or fallback runtime in Waypoint production code.
- No task writes, manual Todo tools, persisted phase state, generated Trellis patches or Todo synchronization.
- Current development Todo/subagent tools are temporary and excluded from the production design and verification baseline.
- Use Pi's current registry and thinking capability helpers. Model identities are provider + ID; never guess capabilities from a model name.
- The normal/current model is the model-tier default for each native dispatch; Strong is an available option, not insurance. Routine inspection, evidence gathering, straightforward tracing, obvious checks, routine implementation, and mechanical validation normally use the normal/current model, whether delegated or not. Explicit user model/thinking instructions take precedence within their scope; the main agent, not an extension parser, interprets them and supplies native dispatch arguments.
- Use Pi's per-invocation context projection for one current policy block. Remove only Waypoint's marker, preserve all other messages and their order, and place the block immediately before the latest real user message when one exists. Do not persist repeated policy messages, add summary hooks, wrap native dispatch, introduce preset APIs or rewrite tool arguments.
- Trellis already owns spec updates, artifact curation and workflow guidance. Do not add competing spec/handoff/checklist instructions to Waypoint's policy.
- Preserve unknown/missing/error task evidence. A successful native run is not independent proof of correctness and does not change Waypoint task status; clearing an active pointer is not completion. Native Trellis cards own execution outcomes and any unavailable final-scope fact does not justify a second protocol.
- Use session-scoped native task identity. Do not borrow another session's active task or replay execution history.
- Keep the default widget compact; respect Pi themes, Unicode display width and non-TUI mode limits.
- Configuration changes must not switch the main model or modify active tool sets.
- Disabling/removing Waypoint must leave Trellis fully usable.

## Review Gates

- Pure routing tests cover modes, identity equality, minimal stable policy and no event-triggered recommendations.
- Contract tests cover actual native dispatch schemas, unchanged native progress-card forwarding, model capability holes and invalid config.
- Task-loader tests cover bounded family reads, archive reconciliation, corrupt files and session isolation; production code has no execution replay/projection.
- Native UI tests cover stable native task status, long model/task names, narrow terminals, cancellation, reload and cleanup without duplicating native run details.
- Final integration must run without the temporary generic Todo/subagent plugins.
- Record actual commands and examples in layer specs as implementation establishes them. Do not mark the generated bootstrap-guidelines task complete while it still contains placeholders.
