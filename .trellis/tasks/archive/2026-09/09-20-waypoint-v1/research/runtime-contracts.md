# Runtime Contract Research

## Context Summary

- **Question:** Which native Pi and Trellis contracts does Waypoint rely on, and
  which compatibility limits must remain explicit?
- **Why local evidence was initially insufficient:** Some host behavior had to
  be checked against the tested host release rather than inferred from the
  product brief. This record keeps the resulting facts without retaining the
  host's installation, checkout, session, or capture locations.
- **Facts used:** The generated integration and repository scripts are the local
  baseline; task identity is session-scoped; native dispatch owns execution and
  model selection; host capability helpers are authoritative; Waypoint only
  projects guidance and reads bounded task data.
- **Constraints:** Do not add a second workflow, dispatch wrapper, model call,
  task database, completion protocol, or fallback runtime. Preserve native
  task status, role permissions, tool sets, and user choices.
- **Uncertainty:** Host behavior can change across releases. Native progress
  does not prove semantic correctness or final full-scope verification, and a
  requested model/thinking value is not always an observed effective value.
- **Consequence:** Revalidate schemas, capability forwarding, generated
  integration integrity, and session isolation when host versions change. Keep
  unknown evidence visible instead of manufacturing continuity or completion.
- **Redaction check:** Removed absolute and user-home paths, external URLs and
  source locators, installation roots, temporary harness names, session IDs,
  machine/user identifiers, provider-specific configuration, and raw captures.
  Repository-relative file references and behavior/test consequences remain.

## Tested Baseline

The investigation covered the tested Trellis, Pi coding-agent, Pi AI, and Node
releases used by the project. These versions are evidence for that compatibility
window, not a claim about all supported releases. Generic development Todo and
subagent plugins were excluded from the product architecture and acceptance
baseline. No real model or network request was required for the contract checks.

## Confirmed Native Contracts

| Area | Repository-local evidence | Consequence |
| --- | --- | --- |
| Task planning | `.trellis/workflow.md`, `.agents/skills/trellis-brainstorm/SKILL.md` | Creation enters planning; review precedes start. Complex work keeps PRD, design, implementation, and curated context artifacts. |
| Task identity | `.pi/extensions/trellis/index.ts`, `.trellis/scripts/common/active_task.py` | The session context maps to `.trellis/.runtime/sessions/<key>.json`; the session's `current_task` resolves the task. Do not borrow another session's task or use a global fallback. |
| Structured CLI | `.trellis/scripts/task.py` | Use structured current-task fields such as task, source, stale, and error rather than parsing colored human output. |
| Task status | `.trellis/scripts/task.py`, `.trellis/scripts/common/task_store.py` | Start, finish, and archive have distinct effects. Clearing a pointer is not proof of completion, and an intermediate archive failure must remain visible. |
| Hierarchy | `.trellis/scripts/common/task_store.py`, `.trellis/scripts/common/tasks.py` | Native parent/children relations are authoritative. Resolve missing children against bounded archives; never invent records or infer relationships from titles. |
| Dispatch schema | `.pi/extensions/trellis/index.ts` | Native dispatch supports role, prompt, single/parallel/chain mode, model, and thinking. Its thinking values include off, minimal, low, medium, high, xhigh, and max in the tested release. |
| Native defaults | `.pi/extensions/trellis/index.ts` | Explicit dispatch values take precedence over role values and current-model defaults. Waypoint must not replace that precedence. |
| Role boundaries | `.pi/agents/trellis-research.md`, `trellis-implement.md`, `trellis-check.md` | Research records findings, Implement changes code, and Check reviews/fixes. Model strength does not change role permissions. |
| Child isolation | `.pi/extensions/trellis/index.ts` | Native children identify themselves as children and do not receive main-session extension behavior. Waypoint must also avoid registering main-session routing/UI there. |
| Progress details | `.pi/extensions/trellis/index.ts` | Native progress carries run identity, status, mode, model observations, thinking, timestamps, and traces. This supports bounded activity reporting, not semantic proof. |
| Error signaling | `.pi/extensions/trellis/index.ts` | Native terminal tool results mark failed or cancelled runs. Waypoint must use final native details and not depend on middleware ordering. |
| Tool introspection | Pi's public extension helpers | Active-tool metadata includes parameters and provenance. Registration alone is not evidence that a tool is available to the current child. |
| Model registry | Pi's public model-registry helpers | Use the host registry for availability and configured-auth checks; do not maintain a provider catalog or inspect credentials. |
| Thinking capability | Pi's public model helpers | Derive supported levels from the selected model and compare provider plus ID exactly. Capability maps may have holes such as high/max without xhigh. |
| Prompt projection | Pi context and before-agent-start hooks | Project one current policy block without persisting copies. Explicit user instructions retain precedence. |
| Lifecycle observation | Pi tool lifecycle events | Start is preflight, not proof of launch; parallel completions may arrive out of order. Waypoint should not turn these events into a second execution UI. |
| Session reconstruction | Pi session branch helpers | The active branch is narrower than all stored entries. Do not replay unrelated branches to manufacture task history. |
| Native UI | Pi widget, selector, theme, and width helpers | Use the host UI and width APIs. TUI-only components must not be assumed to work in RPC/headless mode. |
| Package format | `package.json` and Pi package conventions | `pi.extensions` points at `src/index.ts`; host packages remain peers. Repository-local Trellis assets are not npm runtime contents. |

## Checks And Consequences

- Native extension registration succeeded. The `trellis_subagent` schema exposed a
  string model parameter and the tested thinking range, with no tool execution or
  model request.
- A synthetic model with sparse thinking support produced only its supported
  levels. This confirmed that Waypoint must use the host helper rather than a
  contiguous local enum.
- Task context validation passed for the curated manifests and artifacts. The
  generated native integration matched the recorded local integrity baseline;
  no generated integration edit was made.
- A registration-only direct import was not a valid harness because the host
  source uses TypeScript features unsupported by that loader. The host's normal
  loader succeeded; this was a harness limitation, not a product failure.
- The checks were source, registration, capability, and manifest checks. They did
  not certify Strong model judgment, real-provider behavior, compaction, caching,
  or a completed product task.

## Compatibility Gaps

### Final full-scope verification is not a native field

The native progress `final` flag means that a tool batch ended. It does not say
that the task's final full-scope Check ran. Do not infer scope from prompt words,
result prose, or retry counts. The accepted v1 behavior is to display the native
evidence and leave final scope unconfirmed.

### Requested and effective model values can differ

Run configuration may contain a fully qualified model request while an observed
assistant event reports only a model string. Thinking is seeded from requested
configuration, but the child does not necessarily acknowledge a clamp as a
separate effective value. Display requested versus observed data honestly and do
not fill an unknown provider from the Strong setting.

### Explicit thinking off needs a compatibility diagnostic

The tested native dispatch understands `off`, but its child argument construction
does not reliably forward an explicit off override. Keep the diagnostic and test
max forwarding separately; do not patch the generated integration from Waypoint.

### Progress lacks task binding

Progress details do not include task identity, iteration identity, check scope,
or provider-separated effective model. Bind live observations to the session and
task at dispatch, validate the native active-task protocol, and report ambiguous
history as unavailable rather than assigning it to the current task.

### Finish is weaker than completion

Finish removes a pointer; archive writes a completed status but can have later
steps fail. The UI may display native status and archive location separately, but
must never claim that every spec, commit, or check step completed.

### Context overhead belongs to native Trellis

Native context injection includes curated manifests, task artifacts, role
instructions, and delegated prompts. This can duplicate reading depending on
provider caching. Waypoint keeps its policy short and does not patch Trellis or
make savings claims from architecture alone.

## Per-Invocation Projection Findings

The tested host call chain runs context transformation before each assistant
request, including tool continuations. Context handlers return projected messages
without writing them to the session. The system guidance hook runs once for the
user-triggered loop, while its prompt remains available to subsequent requests.
A custom projected message is provider user-role content in the tested release,
not a new system instruction. The verified fixture preserved original Trellis
content and explicit user model requests, projected at most one current policy
block, removed it when Off was active, and made no real model or network request.

The product decision is to keep normal host summarization. No compaction hook,
summary model call, conversation parser, or append-only policy history is added.
The next request reconstructs the current default guidance; preservation of every
oral instruction through host summarization is not claimed.

## Revalidation Rule

On a host update, recheck actual tool schemas, public capability helpers,
progress/session formats, thinking forwarding, and generated-integration
integrity. A more permissive schema alone does not prove that values are
forwarded or supported by the selected child model.
