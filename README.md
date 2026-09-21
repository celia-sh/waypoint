# Waypoint

A Pi package for Strong Model presets and a read-only Trellis task tree.

Trellis owns the workflow and native execution. The main agent chooses each
`trellis_subagent` dispatch. Waypoint supplies configuration, routing guidance,
and a task projection.

## Requirements

- Pi 0.85.1 or a compatible release
- Node.js 22.19 or newer
- A trusted project with native Trellis enabled

## Install

After release:

```bash
pi install npm:@celia-sh/waypoint@<version>
```

For a project-local installation:

```bash
pi install -l npm:@celia-sh/waypoint@<version>
```

Install a GitHub tag or commit for unreleased builds:

```bash
pi install git:github.com/celia-sh/waypoint@<tag-or-commit>
```

Run the local source during development:

```bash
npm ci
pi --approve -e ./src/index.ts
```

## Routing

Waypoint projects a short policy before each main-agent request. The main agent
may choose the configured Strong Model for Trellis research, implementation, or
checking and supplies the native `model` and `thinking` arguments. Explicit user
instructions take precedence.

| Mode | Behavior |
| --- | --- |
| `auto` | Guidance when the current and Strong provider/ID differ. |
| `on` | Guidance whenever the Strong configuration is usable. |
| `off` | Routing guidance disabled; task visibility remains available. |

Model choices come from Pi's registry. Thinking choices come from the selected
model and the native dispatch capability.

## Configuration

The default file is `~/.pi/agent/waypoint.json`; `PI_CODING_AGENT_DIR` is
supported.

```json
{
  "defaultMode": "auto",
  "strongModel": {
    "provider": "provider-id",
    "id": "model-id"
  },
  "strongThinking": "high"
}
```

The initial configuration has no Strong Model. Unsupported saved values remain
visible as diagnostics. Session mode changes leave `defaultMode` unchanged.

## Commands

| Command | Action |
| --- | --- |
| `/waypoint` | Open the control panel. |
| `/waypoint auto` | Use Auto mode for this session. |
| `/waypoint on` | Use On mode for this session. |
| `/waypoint off` | Use Off mode for this session. |
| `/waypoint model` | Select a Strong Model from Pi's registry. |
| `/waypoint thinking` | Select a supported thinking level. |
| `/waypoint status` | Show configuration and compatibility diagnostics. |

Cancelled selectors leave saved settings unchanged.

## Task view

The widget reads the current session's native Trellis pointer and bounded task
family. Task records are read-only.

- `Focused` keeps the current lineage, direct children, and nearby sibling roots.
- `Collapsed` shows the current path and routing summary.
- `Full` walks the loaded family in native preorder and trims only the tail at
  the row limit.
- `Alt+W` cycles `Focused -> Collapsed -> Full -> Focused`.
- `Alt+T` opens the loaded family tree.

Inside the tree browser, `↑/↓` and Page Up/Page Down move the selection.
`Enter` and `Alt+D` open native details, `Alt+C` toggles related completed
records, and `Esc` closes the browser. The `>` marker identifies the current
session pointer; it is separate from execution state.

Native Trellis cards and `Alt+O` present dispatch progress, results, models,
thinking, usage, tools, and errors.

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:integration
npm pack --dry-run
```

The npm package contains `src/`, `README.md`, `LICENSE`, and package metadata.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).
