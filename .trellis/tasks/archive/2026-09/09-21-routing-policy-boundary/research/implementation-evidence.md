# Routing Policy Boundary Implementation Evidence

## Scope

Implemented the approved routing-policy and ephemeral context-ordering refinement in `src/routing.ts`, focused routing tests, the Pi runtime integration fixture, and the backend/boundary specs.

## Changes Verified

- The policy now separates delegation from model strength.
- Bounded simple work may remain delegated while using the normal/current model.
- Routine inspection, evidence gathering, straightforward tracing, obvious checks, routine implementation, and mechanical validation are ordinary-model defaults.
- Strong requires an existing concrete reasoning bottleneck likely to materially change the result; direct Strong remains allowed when that bottleneck is already evident.
- Ambiguity/missing evidence alone, failure alone, and ordinary implementation alone do not trigger automatic Strong selection.
- Strong may still research, implement, or check; model tier does not propagate automatically between dispatches.
- `projectPolicy()` removes only the Waypoint marker and inserts one ephemeral block immediately before the latest `role: "user"` message, with an append fallback when no user exists.
- Original message order and input arrays remain unchanged; disabling or rebuilding removes/replaces the projected block without persistence.

## Verification Commands

- `npx vitest run tests/unit/routing.test.ts` — 6 tests passed.
- `npx vitest run tests/integration/pi-runtime.test.ts` — 4 tests passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — 145 unit tests passed across 7 files.
- `npm run test:integration` — 17 integration tests passed across 4 files.
- `npm pack --dry-run` — passed; package remains 9 files and contains no Trellis task/spec/runtime files.
- `git diff --check` — passed.

## Runtime Note

A Pi process that loaded the pre-change global/published extension continues to show the old policy until it is reloaded or restarted with the local source. The repository tests exercise the changed source and provider-bound context transformer; runtime dogfood must load `.pi/extensions/trellis/index.ts` and `./src/index.ts` explicitly when avoiding the installed package.

## Boundaries Preserved

No model call, subagent spawn, router, classifier, dispatch wrapper, task write, execution observer, system-prompt hook, compaction hook, or configuration field was added. Native Trellis remains the owner of dispatch and execution.
