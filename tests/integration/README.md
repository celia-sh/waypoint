# Integration Fixtures

These tests exercise the actual pinned Pi 0.85.1 runtime and the repository's
unmodified Trellis 0.6.17 integration. They are development-only and excluded
from the npm package.

- `native-contracts.test.ts` checks the initialization hash and invokes the native
  tool with a disposable fake Pi CLI. It captures arguments and child markers,
  proving `max` forwarding and the native omission of explicit `off`. No model
  or network request occurs; successful process completion is not a correctness
  certificate.
- `pi-runtime.test.ts` creates an isolated Pi resource loader with only Trellis
  and Waypoint, an in-memory session and synthetic model registry. The real agent
  loop, extension runner, context transformer and message conversion run; only
  model streaming and the local tool are fixtures. Credentials and user
  `waypoint.json` are neither read nor changed.

The repo-local `.pi/` integration is the test input, not a vendored runtime in
`src/`. Revisit contract expectations on Trellis upgrades; do not update hashes
merely to silence failures. Live maintenance and terminal checks are recorded
separately in the native task's implementation evidence. Offline fixtures do not
prove model judgment, provider caching, actual compaction or end-to-end Strong
selection.
