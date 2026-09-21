# Correct Git Release Boundary — Technical Design

## Boundary Model

Waypoint has two intentional distribution boundaries:

```text
Git repository
├── Waypoint source, tests, docs and build metadata
├── Trellis project workflow/spec/task records/scripts
├── project-scoped Pi/Trellis integration
└── project-scoped Trellis skills and instructions

npm tarball
└── package.json files allowlist: src/, README.md, LICENSE
```

The npm allowlist is the package boundary. Git is the collaboration and
workflow boundary. One must not be inferred from the other.

## Versioned Project Files

The reviewed Git tree should contain:

- `.trellis/` workflow, specs, scripts, task records, archived evidence and
  deliberate workspace journals, subject to its nested ignore rules;
- `.pi/` project-scoped Pi settings, Trellis agents/prompts and the generated
  native integration required by this project;
- `.agents/` project-scoped Trellis skills;
- `AGENTS.md` project instructions;
- `.gitattributes` merge behavior for append-only journals;
- existing Waypoint source, tests, package metadata, documentation and tooling.

These are source/configuration files for a reproducible Trellis-managed project,
not npm runtime dependencies.

## Local-Only Boundary

The nested `.trellis/.gitignore` remains authoritative for:

- `.trellis/.developer`;
- `.trellis/.current-task`;
- `.trellis/.runtime/`, including session pointers;
- temporary update files, backups and Python caches;
- Trellis runtime logs and other generated local state.

The root `.gitignore` must not hide the `.trellis` directory itself or the
project adapters that contain the reproducible integration.

## Repository-Local Summary Policy

The shared guide `repository-context-summaries.md` is the contract for outside
information. It allows an investigation to inform the work, but the final
Trellis context contains only a standalone summary of the bounded question,
facts used, constraints, uncertainty, consequence, and redaction result.

The summary must not contain an outside path, URL, source locator, user or
machine identifier, temporary location, installation location, transcript
location, or instruction to open another file. Task manifests may point only to
repository-relative files that exist in the current tree.

## Historical Record Redaction

Redaction is text-only and limited to archived planning/research evidence. It
must not alter product source, Trellis scripts, task relationships, acceptance
criteria, or test behavior. Replace outside-location details with neutral facts
or omit them when the fact cannot be safely summarized. Preserve the useful
behavior, constraint, uncertainty, and test consequence rather than a citation
or raw excerpt.

## Commit History

There is no remote, so local history can be safely corrected. Preserve a local
backup ref before rewriting. The final review series should have these logical
boundaries:

1. `chore: prepare Waypoint package` — package metadata, public docs/license,
   tooling and the corrected root `.gitignore`;
2. `feat: add Waypoint Pi extension` — `src/`;
3. `test: add Waypoint coverage` — `tests/`;
4. `chore: add Trellis project context` — reviewed `.trellis/`, `.pi/`,
   `.agents/`, `AGENTS.md`, `.gitattributes` and redacted records.

The implementation may use a root rebase or an equivalent local rebuild, but
must preserve these final file-group boundaries and must not push the backup
ref or any commit.

## Compatibility And Rollback

No Waypoint runtime or generated Trellis integration code is changed. The only
behavioral repository change is that a clone now contains the project files
that Trellis expects. If the audit finds a file that is private, machine-bound,
or not reproducible, leave it ignored or remove only that record from the
versioned set and document the reason. Reverting the final Trellis-context
commit restores the prior package/source/test history without changing npm
contents.
