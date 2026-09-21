# Routing Policy Boundary Refinement Implementation Plan

## Change Boundary

### In scope

1. Replace the broad Strong-selection wording in `src/routing.ts` with the approved delegation/model-strength separation, evidence-backed Strong threshold, routine-work negative examples, failure/check guidance, and non-sticky dispatch guidance.
2. Change `projectPolicy()` in `src/routing.ts` to insert one ephemeral Waypoint block immediately before the latest real user-role message, with an append fallback when no user-role message exists.
3. Update focused unit tests in `tests/unit/routing.test.ts`.
4. Update the provider-bound context assertions in `tests/integration/pi-runtime.test.ts` as needed.
5. Update the executable backend contract/spec wording and task evidence after verification; do not change public configuration, native Trellis integration, UI, or package boundaries.

### Explicitly out of scope

- New router models, classifiers, scores, thresholds, budgets, telemetry, or model quotas.
- Automatic delegation, automatic escalation, retries, dispatch argument rewriting, task-content inspection, or execution observation.
- Pi system-prompt, compaction, provider-payload, native Trellis card, or task projection changes.
- Real-model benchmark claims or a required cheap-first workflow.

## Ordered Checklist

1. Re-read the active PRD/design, backend extension contract, Waypoint boundaries, and Pi context-event/custom-message evidence.
2. Implement the policy text and pure message insertion behavior in `src/routing.ts` without changing function signatures.
3. Add unit assertions for the two-axis delegation/model contract, ordinary routine defaults, evidence-backed Strong/direct-dispatch wording, failure/check/non-sticky guidance, explicit precedence, marker deduplication, latest-user insertion, fallback, input immutability, and live replacement.
4. Update the Pi integration fixture to assert provider-bound ordering, one block per request, continuations/reconstructed context, explicit user-content preservation, and no persistence.
5. Update `.trellis/spec/backend/extension-contracts.md` and `.trellis/spec/guides/waypoint-boundaries.md` only for the verified routing and projection contract; keep product text English.
6. Run focused tests:
   - `npx vitest run tests/unit/routing.test.ts`
   - the relevant `tests/integration/pi-runtime.test.ts` test or full integration file
7. Run full quality gates:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run test:integration`
   - `npm pack --dry-run`
8. Inspect the diff for prohibited routing intelligence, duplicate policy, changed native behavior, message mutation, or accidental package contents.
9. Record implementation evidence and request the Trellis Check review before reporting completion.

## Validation And Rollback Points

- After step 2, the old unqualified `A cheaper attempt is not required.` wording must be gone from production policy.
- After step 4, provider-bound context must retain all original messages and place the block before the latest user message without persisting it.
- If integration ordering or Pi message-shape assumptions fail, revert only the insertion logic and keep the policy wording isolated; do not change Pi internals or use a system-prompt workaround.
- If full checks reveal unrelated failures, preserve the focused diff and report the unrelated baseline failure separately.
