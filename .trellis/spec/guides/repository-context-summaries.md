# Repository Context Summaries

## Purpose

Trellis task context must be usable from the repository alone. A future agent
should not need an untracked file, a private transcript, a local installation,
or a developer's machine to understand a requirement or continue a task.

This applies to task artifacts, research notes, specs, prompts, context
manifests, generated project context, and release candidates.

## Core Rule

Prefer repository-relative files and checked-in project contracts.

Do not put an outside-file location in a Trellis manifest or task artifact as a
substitute for its contents. Do not leave an instruction such as "read the
external file" or "use the local checkout".

Every `file` value in `implement.jsonl` and `check.jsonl` must be a
repository-relative file that exists inside the current repository. A symlink
that resolves outside the repository does not satisfy this rule.

## When Outside Information Is Unavoidable

External information may be needed to understand a host API or behavior that
the repository does not own. In that case, write only a repository-local
summary under the active task's `research/` directory:

1. State the bounded question and why repository evidence was insufficient.
2. Record the facts used, constraints, uncertainty, and practical consequence.
3. Do not record the outside source's path, URL, user directory, machine name,
   temporary directory, installation directory, transcript location, or line
   reference.
4. Do not copy raw external text, private data, credentials, or machine dumps.
5. Run the redaction check before the summary becomes task context or staged
   content.

The summary must stand alone. Future work may repeat the investigation for a
new host version, but it must not need an outside location to recover the
reasoning from this task.

### Repository-Local Summary Template

```markdown
## Context summary

- Question: <bounded question>
- Why local evidence was insufficient: <short explanation>
- Facts used: <sanitized facts>
- Constraints: <what must remain true>
- Uncertainty: <what was not established>
- Consequence: <how the task uses the facts>
- Redaction check: <what was checked and the result>
```

Do not add a source, URL, external path, or machine identifier field to this
template.

## Redaction Contract

Before committing task context or project configuration, inspect names and
contents for:

- absolute filesystem locations or paths outside the repository;
- temporary captures, local backups, installed-tool checkouts, and host cache
  locations;
- session transcripts, runtime pointers, user identifiers, and credentials;
- API keys, bearer tokens, passwords, private keys, certificates, and
  credentialed URLs;
- symlinks or path fields that resolve outside the repository.

Replace the affected material with a neutral fact summary while preserving its
meaning, or exclude it when it cannot be made safe. Do not preserve an outside
location merely as a citation: the useful fact belongs in the summary, not the
locator.

## Validation Checklist

- [ ] Every task-manifest file value is repository-relative and exists.
- [ ] Candidate directories contain no symlink escaping the repository.
- [ ] Any outside investigation has a repository-local summary.
- [ ] The summary is sufficient without opening another file or following a
      source locator.
- [ ] No outside filesystem path, source locator, machine name, or local
      session detail remains in the task context.
- [ ] Secrets, raw sessions, runtime pointers, and private local state are not
      copied.
- [ ] Tracked content and staged content receive the same audit.
- [ ] The package/release allowlist is checked separately from the Git tree.

Use the repository's path, secret, symlink, manifest, and staged-content audits;
classify every match before accepting it.

## Good / Base / Bad

- **Good:** A research note states the host behavior needed by the task,
  explains its constraint and uncertainty, and includes the redaction result.
- **Base:** A task keeps a repository-relative reference to a checked-in spec
  and does not require any additional context.
- **Bad:** A manifest points to an outside file or tells the next agent to open
  a local checkout. Even a visible citation is not a substitute for the
  repository-local summary.

## Wrong vs Correct

### Wrong

```json
{"file":"<outside-file>","reason":"Read this for the behavior"}
```

This is not reproducible and leaks a location that a fresh clone cannot
resolve.

### Correct

```json
{"file":"research/context-summary.md","reason":"Contains the sanitized facts, constraints, uncertainty, and redaction result needed by this task"}
```

The repository-local note carries the usable knowledge without exposing an
outside locator or requiring another file.
