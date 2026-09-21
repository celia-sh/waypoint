# Backend Development Guidelines

> Best practices for backend development in this project.

---

## Overview

This repository is a TypeScript Pi extension, not a server. The implemented runtime contract is documented below; remaining bootstrap documents are placeholders until their conventions are established.

## Pre-Development Checklist

1. Read [Extension Contracts](./extension-contracts.md) for configuration, native evidence and lifecycle boundaries.
2. Read [Waypoint Boundaries](../guides/waypoint-boundaries.md) and the active task's curated research.
3. Use the existing six-module ownership in `src/`; keep external data decoding in its owning module.

## Quality Check

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration` and `npm pack --dry-run`. Do not include generated Trellis assets or private state in the package.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Extension Contracts](./extension-contracts.md) | Implemented config/routing/native projection contracts and tests | Established |
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Database Guidelines](./database-guidelines.md) | ORM patterns, queries, migrations | To fill |
| [Error Handling](./error-handling.md) | Error types, handling strategies | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Logging Guidelines](./logging-guidelines.md) | Structured logging, log levels | To fill |

---

## How to Fill These Guidelines

For each guideline file:

1. Document your project's **actual conventions** (not ideals)
2. Include **code examples** from your codebase
3. List **forbidden patterns** and why
4. Add **common mistakes** your team has made

The goal is to help AI assistants and new team members understand how YOUR project works.

---

**Language**: All documentation should be written in **English**.
