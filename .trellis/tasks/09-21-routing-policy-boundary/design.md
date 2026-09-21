# Routing Policy Boundary Refinement Design

## Status

Planning artifact for the approved routing-policy and context-projection refinement. This design preserves Waypoint's existing native Trellis architecture.

## Problem Boundary

The behavior gap is in two pure functions in `src/routing.ts`:

1. `routingPolicy()` currently describes broad positive reasons to choose Strong without clearly separating delegation from model strength or naming routine negative cases.
2. `projectPolicy()` removes the old Waypoint block but appends the new custom block. Pi 0.85.1 converts custom messages to user-role messages before provider conversion, so the block currently has the newest message position.

No task loader, model registry, configuration, native integration, UI, execution observer, dispatch wrapper, or provider payload code is involved.

## Data Flow

```text
mode/config/current model/capability
              |
              v
       routingPolicy()
              |
              v
context event -> projectPolicy(event.messages, policy)
              |
              v
Pi agent context transformer -> Pi custom-to-user conversion -> provider
```

`routingPolicy()` remains pure and depends only on its existing arguments. It must not inspect task content, tool history, retry counts, token counts, file counts, or model confidence.

`projectPolicy()` remains an ephemeral projection. It filters only `customType === POLICY_TYPE`, preserves every other message, and returns a fresh array. When a policy exists, it inserts one custom message immediately before the last message whose role is `user`. If no user-role message exists, it appends the block as a safe fallback. The function does not move or rewrite any original message.

## Policy Contract

The policy will present two independent decisions:

- Delegation: use native Trellis subagents when bounded work, repository exploration, tool output, or execution detail should stay out of the main session. Simple work may still be delegated.
- Model tier: use the normal/current model by default for each dispatch. Select Strong only for an evidence-backed reasoning bottleneck likely to materially change the result.

The policy will retain direct Strong selection when the bottleneck is already evident, without requiring a prior cheaper attempt. It will explicitly reject insurance-driven Strong selection, ambiguity/missing-evidence-only escalation, automatic failure escalation, automatic Strong checking, and tier propagation between phases.

Examples are intentionally concise and advisory. They do not implement a classifier or a hard quota. The policy says that routine read-only inspection, evidence gathering, straightforward tracing, obvious checks, routine implementation, and mechanical validation normally use the ordinary/current model while remaining delegable.

## Message Placement Trade-off

A system-prompt API is not appropriate because the product contract gives applicable explicit user model/thinking instructions precedence. `pi.sendMessage()` and session custom entries are not appropriate because they persist or participate as user-visible session content.

The supported `context` event API accepts a modified message array. Manual insertion before the latest real user-role message is therefore the smallest compatible change. It keeps the block ephemeral and gives a current user instruction a later position without changing the order of prior user, assistant, tool, or native custom messages. Tests will cover the no-user fallback and repeated projection.

## Compatibility And Rollback

- The custom marker and message shape remain unchanged.
- The native `context` event remains the only injection path.
- No provider payload mutation, system-prompt replacement, compaction hook, or native dispatch change is introduced.
- Reverting `src/routing.ts` and its focused tests restores the previous policy and append placement without touching configuration, Trellis files, or user model state.
- The placement change can affect provider prompt-cache keys because message order changes. This is intentional and must be verified through the existing provider-bound integration fixture; no cache-savings claim is made.

## Verification Design

Unit coverage will assert exact policy concepts, absence of the old unqualified wording, marker deduplication, insertion before the latest user message, original-message preservation, no-user fallback, live replacement, and no mutation of input arrays.

Integration coverage will exercise the installed Pi context transformer over an initial request, multiple tool continuations, a policy change, Off, and reconstructed context. It will assert one projected block per request, explicit user content preservation, block ordering in the provider-bound message list, no transcript/session persistence, and unchanged native behavior.
