# Routing Policy Boundary Refinement

## Goal

Reduce routine over-selection of the Strong Model without discouraging the main agent from delegating bounded work to native Trellis subagents. Waypoint should separate the decision to delegate from the decision of which model tier performs the dispatch, while remaining advisory and free of a second router.

## Background

The current policy presents Strong as an option whenever a subtask may materially benefit from stronger reasoning. Its broad examples include ambiguity and semantic/architectural/lifecycle verification, and its unqualified statement that a cheaper attempt is not required. This gives a failure-averse ordinary model a low-risk justification for selecting Strong on routine read-only work and on every later check.

The current policy also says that native Trellis roles should be dispatched through `trellis_subagent`, but it does not explicitly say that simple delegated work may remain on the ordinary/current model. Delegation is valuable for keeping repository exploration, tool output, and implementation detail out of the main context, independently of model strength.

`projectPolicy()` currently removes an older Waypoint block and appends the new custom message. Pi's installed runtime converts custom messages to user-role messages before provider conversion. The ephemeral block must remain non-persistent and preserve every original message, but the current placement gives it the newest message position.

## Requirements

### R1. Preserve native ownership and advisory boundaries

- Keep Plan -> Implement -> Verify -> Finish and all native Trellis role definitions and dispatch behavior unchanged.
- Waypoint still makes no model calls, does not spawn agents, does not classify task difficulty, does not inspect execution outcomes, and does not rewrite native dispatch arguments.
- The main agent remains the sole decision-maker for delegation and model/thinking arguments.

### R2. Separate delegation from model strength

- State that delegation and model strength are separate decisions.
- Make clear that bounded research, implementation, or checking may be delegated when keeping repository exploration, tool output, or execution detail out of the main session is useful, even when the work is simple.
- Make clear that simple delegated work normally uses the ordinary/current model.
- Do not imply that simple work must remain in the main session.

### R3. Raise the Strong decision threshold without banning direct Strong dispatch

- The ordinary/current model is the model-tier default for each dispatch.
- Strong is appropriate only when available evidence identifies a concrete reasoning bottleneck and stronger reasoning is likely to materially change the result.
- Routine repository inspection, evidence gathering, straightforward call-path tracing, obvious checks, routine implementation, and mechanical validation normally use the ordinary/current model.
- Ambiguity or missing evidence alone is not a Strong reason; ordinary delegated research, reproduction, logs, or a user question may be more appropriate.
- A cheaper attempt is not required when a Strong bottleneck is already evident from existing evidence.
- Do not present Strong as insurance merely because it might be safer or slightly better.

### R4. Treat failures and phases as evidence, not automatic routing rules

- A failed ordinary attempt is evidence, not an automatic escalation.
- Local/actionable feedback may justify ordinary recovery; failure that reveals deeper complexity, competing hypotheses, or inadequate progress may justify Strong.
- Strong may be used for research, implementation, or checking; it is not reserved for analysis or review.
- A model choice in one dispatch does not automatically carry into a later research, implementation, or checking dispatch.
- Later choices use the existing evidence for that subtask without an extra ritual investigation merely to justify a tier.
- Do not automatically pair ordinary implementation with Strong checking.
- Strong checking is appropriate when meaningful semantic risk remains beyond routine tests and ordinary scoped review, or when the check itself has a difficult semantic scope already evident.

### R5. Preserve explicit user precedence and live applicability

- Explicit user model/thinking instructions retain precedence within their stated scope.
- Mode, current/Strong identity comparison, capability validation, and no-policy behavior for Off, unavailable, or Auto bypass remain unchanged.
- Policy text remains stable for unchanged configuration and contains no task-content, retry, size, token, or execution-derived recommendation.

### R6. Project one correctly ordered ephemeral policy block

- `projectPolicy()` removes only the existing Waypoint marker and preserves all non-Waypoint messages and their relative order.
- When a policy is applicable and an actual user-role message exists, insert the Waypoint custom block immediately before the latest actual user-role message rather than appending it after that message.
- If no user-role message exists, append the block without dropping or reordering existing messages.
- Repeated context projection produces exactly one current block and updates its content.
- The block is not persisted in session history or the agent transcript.
- The behavior works for first requests, tool continuations, and reconstructed contexts.

## Acceptance Criteria

| ID | Observable acceptance |
| --- | --- |
| AC01 | The projected policy explicitly separates delegation from model strength and says that simple delegated work may use the ordinary/current model. |
| AC02 | Routine read-only inspection, evidence gathering, straightforward tracing, obvious checks, routine implementation, and mechanical validation are described as ordinary defaults without forbidding delegation. |
| AC03 | Strong is framed as requiring a concrete evidence-backed reasoning bottleneck, not possible benefit, insurance, ambiguity alone, or missing evidence alone. |
| AC04 | Direct Strong dispatch remains allowed when the bottleneck is already evident; no mandatory cheap-first attempt or automatic escalation rule is introduced. |
| AC05 | Failure, check, and phase guidance does not automatically escalate or propagate Strong to later dispatches. |
| AC06 | Explicit user model/thinking precedence, native Trellis workflow, role coverage, and no-model-call/no-router boundaries remain present. |
| AC07 | With an applicable policy and a latest real user message, the custom Waypoint block is projected before that user message; all original messages remain present and ordered. |
| AC08 | Repeated projection and tool-continuation projection contain exactly one current block, update live policy text, and do not persist the block. |
| AC09 | Off, unavailable capability, missing configuration, and Auto same-model bypass still produce no policy, with existing behavior unchanged. |
| AC10 | Unit and integration coverage plus lint, typecheck, all tests, and package dry-run pass; no new router, model call, execution observer, dispatch wrapper, or configuration field is added. |

## Out of Scope

- Adding a router model, heuristic difficulty classifier, score, threshold configuration, budget, quota, telemetry, or Strong-rate KPI.
- Enforcing delegation, model choice, cheap-first execution, retries, or phase-specific model assignments.
- Parsing user prose or rewriting `trellis_subagent` arguments.
- Changing Pi's system prompt, compaction, native Trellis cards, task projection, model registry, configuration schema, or dispatch capability checks.
- Benchmarking real model judgment as a release requirement. Fixed policy/placement fixtures may verify the projection contract, but they do not claim to measure model quality.
