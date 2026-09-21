# Task Widget Check Review

## Scope

Reviewed the approved task-first native widget and Waypoint dialog wiring in `src/ui.ts`, `src/index.ts`, and focused unit tests. Core routing, configuration, models, Trellis projection semantics, generated native integration, task records, and shared planning artifacts were left unchanged.

## Findings And Fixes

1. The bounded task tree now keeps the native task hierarchy as the only source of task rows. Real child records are rendered beneath their parent; missing references, duplicate paths, and cycles do not create rows. Phase and native agent evidence remain separate rows, and research is labeled as task-scoped activity with phase unconfirmed.
2. Priority trimming retains all ancestors required to display an active descendant. The hidden-row summary counts only omitted real tasks and native agent rows. The widget stays within six tree rows plus a blank separator and routing row, for a maximum of eight normal rows. Heights below 20 use exactly two task-then-status rows; no active task uses one status row.
3. Connector prefixes are recomputed from the visible rows after trimming, so hidden siblings do not leave dangling rails. Textual phase/status labels remain present independently of semantic color.
4. Adverse implementation evidence (`failed`, `cancelled`, `interrupted`, and `unknown`) remains visible even when a later Check pass succeeds. A completed Check is still shown as pass-complete with final scope unconfirmed. Research does not create or reorder a fifth phase.
5. Widget rendering is guarded because Pi renders widgets outside extension event-handler error boundaries. A render failure returns a bounded diagnostic row and does not escape into native UI execution. Session shutdown widget cleanup and command notification/finally rendering are guarded as well.
6. `dialogOpen` condenses the widget for panel, task browser, detail/diagnostic views, mode, model, thinking, refresh, cancellation, errors, and dependent selectors. Session generation checks prevent a dialog resolving after session replacement from saving state or restoring stale UI.
7. Focused tests were updated to assert tree prefixes, nesting, visible connectors, adverse evidence, task-scoped research, stale dialog handling, notification/render failures, width safety, theme invalidation, and unchanged configuration/policy behavior.

## Verification

Executed from the repository root:

- `npm run lint` - passed; Biome checked 17 files.
- `npm run typecheck` - passed.
- `npm test` - passed: 6 files, 106 tests.
- `npm run test:integration` - passed: 4 files, 15 tests.
- `npm pack --dry-run` - passed; package contains 8 expected public files (`README.md`, `package.json`, and `src/` only).

The integration diagnostics continue to report the verified Trellis 0.6.17 limitation that explicit `thinking=off` is not reliably forwarded. Waypoint exposes that as unavailable rather than silently presenting unsupported behavior as effective.

Fresh real Pi PTY screenshots at 40/80/120 columns and short terminal heights remain the main session's post-check responsibility; this review did not claim new PTY coverage.
