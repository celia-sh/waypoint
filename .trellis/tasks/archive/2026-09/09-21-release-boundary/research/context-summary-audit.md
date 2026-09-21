# Context Summary Audit

## Context Summary

- **Question:** How should the release preserve useful Trellis/Pi investigation
  while keeping the versioned project context reproducible from this repository?
- **Why local evidence was initially insufficient:** Some host behavior and
  historical verification results came from disposable host checks. The release
  needs the resulting facts and test consequences, not local captures,
  installation details, session records, or source locators.
- **Facts used:** Trellis workflow, specs, task records, scripts, project
  instructions, generated project integration, and deliberate workspace journals
  are repository collaboration inputs. npm contents are controlled separately by
  the package allowlist. Host configuration and session behavior remain runtime
  concerns and must be summarized without exposing their storage locations.
- **Constraints:** Task manifests must reference existing repository-relative
  files. Local runtime, developer identity, session, temporary, and Python-cache
  state remains ignored. Historical evidence must stand alone and must not ask a
  future agent to open an outside file.
- **Uncertainty:** A future host version may change behavior and require a new
  investigation. The sanitized records do not claim to preserve every raw
  terminal/session detail or prove model judgment.
- **Consequence:** Git may include reviewed Trellis/Pi/agent project source and
  context, while npm continues to include only the public Waypoint allowlist.

## Audit Result

- The root ignore boundary no longer hides `.trellis/`, `.pi/`, `.agents/`,
  `AGENTS.md`, or `.gitattributes`.
- `.trellis/.gitignore` remains the local-only boundary for developer identity,
  current-task pointers, runtime/session state, temporary updates, backups, and
  Python caches. The existing runtime session files and developer marker remain
  ignored and were not copied into task evidence.
- Candidate directories contain no symlinks escaping the repository. The
  generated Pi/Trellis integration resolves project state from the active project
  context and configured runtime/session inputs; no checked-in machine-specific
  root was found.
- Historical task and research records were rewritten to remove absolute or
  user-home paths, external URLs/source locators, installation and checkout
  details, temporary capture names, session identifiers, provider-specific
  configuration, and raw terminal/session evidence. Behavior, constraints,
  uncertainty, and test consequences were retained as standalone summaries.
- Archived manifests now point to the archived task's existing repository-local
  research files. Active manifests continue to point only to existing local
  specs and research.
- Secret-pattern review found no credentials, tokens, private keys, certificates,
  credentialed URLs, or raw session content in the reviewed versioned candidate
  files. Generic examples in generated Trellis guidance are documentation, not
  captured local values or machine-specific evidence.

## Redaction Check

Reviewed names and contents of `.trellis/`, `.pi/`, `.agents/`, `AGENTS.md`, and
`.gitattributes`; checked symlinks, manifests, generated/runtime boundaries, and
historical records. The retained task context contains repository-relative
references and standalone facts only. No outside path, source locator, machine
identifier, credential, transcript, raw capture, or instruction to open an
external file is needed to reconstruct this release decision.
