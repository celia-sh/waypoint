# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

Waypoint uses native Pi TUI components, not a browser frontend. The implemented UI contract is documented below; generic bootstrap guides remain placeholders.

## Pre-Development Checklist

1. Read [Native Pi UI](./native-ui.md).
2. Read [Extension Contracts](../backend/extension-contracts.md) before changing events or projected task state.
3. Consult the installed Pi `docs/tui.md` and API types before introducing a host component or lifecycle hook.

## Quality Check

Run all lint, typecheck, unit and integration commands in `package.json`. UI changes require width tests and terminal smoke checks, including non-TUI behavior and cancelled selectors.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Native Pi UI](./native-ui.md) | Commands, selectors, widget, rendering and lifecycle | Established |
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | To fill |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

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
