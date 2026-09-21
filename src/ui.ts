import { stripVTControlCharacters } from "node:util";
import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import {
  fuzzyFilter,
  Input,
  Key,
  matchesKey,
  SelectList,
  SettingsList,
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
  type SelectItem,
} from "@earendil-works/pi-tui";
import type { ConfigState, Mode } from "./config.js";
import { identity, type AvailableModel } from "./models.js";
import {
  taskFamily,
  taskClosed,
  type TaskNode,
  type TaskSnapshot,
} from "./trellis.js";

export type TaskViewMode = "focused" | "collapsed" | "full";

export interface ViewState {
  mode: Mode;
  current: string;
  config: ConfigState;
  tasks: TaskSnapshot;
  diagnostics: string[];
  guidance: boolean;
  routing: "enabled" | "bypassed" | "off" | "unavailable";
  taskView?: TaskViewMode;
}
// Task/provider names are untrusted display data, not terminal control sequences.
export const plain = (text: string): string =>
  text.replace(/[\p{Cc}\p{Cf}]/gu, " ");
const clipPlain = (text: string, width: number) =>
  stripVTControlCharacters(
    truncateToWidth(plain(text), Math.max(0, width), "..."),
  );
const fitLines = (lines: string[], width: number) =>
  lines.map((line) => truncateToWidth(line, Math.max(0, width), ""));

type Color = Parameters<Theme["fg"]>[0];
const paint = (theme: Theme | undefined, color: Color, text: string) =>
  theme ? theme.fg(color, plain(text)) : plain(text);
const routingText = (state: ViewState) =>
  state.routing === "bypassed" ? "bypassed (same model)" : state.routing;
const routingColor = (state: ViewState): Color =>
  state.routing === "unavailable"
    ? "warning"
    : state.routing === "enabled"
      ? "accent"
      : "muted";

function taskTitle(
  task: TaskNode,
  text: string,
  theme?: Theme,
  current = false,
): string {
  if (taskClosed(task)) {
    const title = paint(theme, "muted", text);
    return theme ? theme.strikethrough(title) : title;
  }
  if (task.status === "in_progress") {
    const title = paint(theme, current ? "accent" : "text", text);
    return theme && current ? theme.bold(title) : title;
  }
  return paint(theme, task.status === "planning" ? "muted" : "warning", text);
}

function nativeDetails(task: TaskNode): string[] {
  return [
    `Task: ${task.ref}`,
    `Task status: ${task.status || "(missing)"}`,
    ...(task.archived ? [`Archive: ${task.ref}`] : []),
    `Parent: ${task.parent ?? "none"}`,
    `Children: ${task.children.length ? task.children.join(", ") : "none"}`,
    ...task.diagnostics.map((message) => `Diagnostic: ${message}`),
  ].map(plain);
}

function taskRow(
  state: ViewState,
  node: TaskNode,
  width: number,
  prefix = "",
  theme?: Theme,
  breadcrumb = "",
): string {
  const marker = state.tasks.active === node.path ? "> " : "  ";
  const titleRoom = Math.max(0, width - visibleWidth(prefix) - 2);
  const nameRoom =
    breadcrumb && visibleWidth(plain(node.title)) > titleRoom - 4
      ? Math.max(0, titleRoom - 4)
      : titleRoom;
  const title =
    nameRoom <= 6
      ? stripVTControlCharacters(
          truncateToWidth(plain(node.title), nameRoom, ""),
        )
      : clipPlain(node.title, nameRoom);
  const extra = Math.max(0, titleRoom - visibleWidth(title));
  const path = breadcrumb
    ? extra >= 6
      ? `${clipPlain(breadcrumb, extra - 3)} / `
      : extra >= 4
        ? ".../"
        : ""
    : "";
  return (
    paint(theme, "accent", marker) +
    paint(theme, "dim", prefix) +
    paint(theme, "muted", path) +
    taskTitle(node, title, theme, state.tasks.active === node.path)
  );
}

function activeLineage(state: ViewState, family: TaskNode[]): TaskNode[] {
  const path: TaskNode[] = [];
  let node = family.find((node) => node.path === state.tasks.active);
  const seen = new Set<string>();
  while (node && !seen.has(node.path)) {
    path.unshift(node);
    seen.add(node.path);
    node = family.find((candidate) =>
      candidate.children.includes(node?.path ?? ""),
    );
  }
  return path;
}

export const canCycleTasks = (state: ViewState): boolean =>
  !!state.tasks.active && taskFamily(state.tasks).length > 1;

export function nextTaskView(mode: TaskViewMode): TaskViewMode {
  switch (mode) {
    case "focused":
      return "collapsed";
    case "collapsed":
      return "full";
    case "full":
      return "focused";
  }
}

const taskViewLabel = (mode: TaskViewMode) =>
  `${mode[0]?.toUpperCase()}${mode.slice(1)}`;

// Select task rows only. Abbreviated ancestry is a breadcrumb, never a fake edge.
function taskTreeLines(
  state: ViewState,
  width: number,
  theme: Theme | undefined,
  includeSideDescendants: boolean,
): string[] {
  const family = taskFamily(state.tasks);
  const lineage = activeLineage(state, family);
  const abbreviated = lineage.length > 4;
  const path = abbreviated ? lineage.slice(-3) : lineage;
  const fullRoot = family.find(
    (node) => node.path === (state.tasks.familyRoot ?? family[0]?.path),
  );
  const subtreeRoot = includeSideDescendants ? fullRoot : path[0];
  if (!subtreeRoot) return [];
  const candidates: TaskNode[] = [];
  const candidatePaths = new Set<string>();
  const familyByPath = new Map(family.map((node) => [node.path, node]));
  const parents = new Map<string, string>();
  const childrenOf = (node: TaskNode): TaskNode[] =>
    node.children
      .map((child) => familyByPath.get(child))
      .filter((child): child is TaskNode => !!child);
  const visit = (node: TaskNode) => {
    if (candidatePaths.has(node.path)) return;
    candidatePaths.add(node.path);
    candidates.push(node);
    for (const child of childrenOf(node)) {
      parents.set(child.path, node.path);
      visit(child);
    }
  };
  visit(subtreeRoot);
  const breadcrumb = !includeSideDescendants && abbreviated
    ? [
        paint(
          theme,
          "muted",
          clipPlain(
            `Path: ${lineage
              .slice(0, -3)
              .map((node) => plain(node.title))
              .join(" / ")} / ...`,
            width,
          ),
        ),
      ]
    : [];
  const notice = state.tasks.diagnostics.length > 0;
  const allFit = family.length + breadcrumb.length + (notice ? 1 : 0) <= 6;
  const budget = includeSideDescendants
    ? Math.max(0, 6 - breadcrumb.length)
    : Math.max(
        0,
        (allFit ? 6 - (notice ? 1 : 0) : 5) - breadcrumb.length,
      );
  const selected = includeSideDescendants
    ? new Set(candidates.slice(0, budget).map((node) => node.path))
    : new Set(path.map((node) => node.path));
  const addWithAncestors = (node: TaskNode) => {
    const required: TaskNode[] = [];
    let entry: TaskNode | undefined = node;
    while (entry && !selected.has(entry.path)) {
      required.push(entry);
      entry = familyByPath.get(parents.get(entry.path) ?? "");
    }
    if (selected.size + required.length > budget) return;
    for (const item of required.reverse()) selected.add(item.path);
  };

  if (!includeSideDescendants) {
    // Spend Focused rows on the active context: active children, nearest
    // siblings, then stop. Full deliberately does not use this priority rule.
    const active = lineage.at(-1);
    if (active) for (const child of childrenOf(active)) addWithAncestors(child);
    for (let index = path.length - 1; index > 0; index--) {
      const parent = path[index - 1];
      const branch = path[index];
      if (!parent || !branch) continue;
      for (const sibling of childrenOf(parent))
        if (sibling.path !== branch.path) addWithAncestors(sibling);
    }
  }
  const lines: string[] = [...breadcrumb];
  const render = (node: TaskNode, prefix: string, connector: string) => {
    lines.push(taskRow(state, node, width, prefix + connector, theme));
    const children = childrenOf(node).filter((child) =>
      selected.has(child.path),
    );
    children.forEach((child, index) => {
      render(
        child,
        prefix + (connector ? (connector === "`- " ? "   " : "|  ") : ""),
        index === children.length - 1 ? "`- " : "|- ",
      );
    });
  };
  render(subtreeRoot, "", "");
  const hidden = family.length - selected.size;
  if (hidden || notice)
    lines.push(
      paint(
        theme,
        notice ? "warning" : "muted",
        [
          hidden ? `+ ${hidden} task rows hidden` : "",
          notice ? "Family evidence incomplete" : "",
        ]
          .filter(Boolean)
          .join("; "),
      ),
    );
  return lines;
}

export function compactLines(
  state: ViewState,
  width: number,
  theme?: Theme,
  height = 24,
): string[] {
  const task = state.tasks.active
    ? state.tasks.nodes.get(state.tasks.active)
    : undefined;
  const prefix =
    paint(theme, "accent", "@") +
    " " +
    paint(theme, routingColor(state), state.routing) +
    (state.tasks.diagnostics.length
      ? paint(theme, "warning", " | task notices")
      : "");
  const room = Math.max(0, width - visibleWidth(prefix) - 3);
  const currentLabel = width < 60 ? "C:" : "now ";
  const strongLabel = width < 60 ? " S:" : " / Strong ";
  const modelRoom = Math.max(
    0,
    room - currentLabel.length - strongLabel.length,
  );
  const models =
    state.routing === "bypassed"
      ? paint(theme, "muted", "same ") +
        paint(
          theme,
          "text",
          truncateToWidth(plain(state.current), Math.max(0, room - 5), ""),
        )
      : paint(theme, "muted", currentLabel) +
        paint(
          theme,
          "text",
          truncateToWidth(plain(state.current), Math.floor(modelRoom / 2), ""),
        ) +
        paint(theme, "muted", strongLabel) +
        paint(
          theme,
          "text",
          truncateToWidth(
            plain(identity(state.config.config.strongModel)),
            Math.ceil(modelRoom / 2),
            "",
          ),
        );
  const summary =
    prefix + (room > 6 ? paint(theme, "muted", " | ") + models : "");
  const taskView = state.taskView ?? "focused";
  return fitLines(
    task
      ? height < 20 || taskView === "collapsed"
        ? [
            taskRow(
              state,
              task,
              width,
              "",
              theme,
              activeLineage(state, taskFamily(state.tasks))
                .slice(0, -1)
                .map((node) => node.title)
                .join(" / "),
            ),
            summary,
          ]
        : [
            ...taskTreeLines(
              state,
              width,
              theme,
              taskView === "full",
            ),
            summary,
          ]
      : [summary],
    width,
  );
}

export function statusLines(state: ViewState): string[] {
  const task = state.tasks.active
    ? state.tasks.nodes.get(state.tasks.active)
    : undefined;
  const recent = state.tasks.recent
    ? state.tasks.nodes.get(state.tasks.recent)
    : undefined;
  return [
    `Mode: ${state.mode} (guidance ${state.guidance ? "available" : "inactive"}; ${routingText(state)})`,
    `Current Model: ${state.current}`,
    `Strong Model: ${identity(state.config.config.strongModel)}`,
    `Strong Thinking: ${state.config.config.strongThinking ?? "not set"}`,
    `Trellis Task: ${task?.title ?? "none"}`,
    ...(task ? nativeDetails(task) : []),
    ...(recent
      ? [
          `Last Observed Task: ${recent.title} (not active)`,
          ...nativeDetails(recent),
        ]
      : []),
    ...state.diagnostics.map((message) => `Diagnostic: ${message}`),
  ].map(plain);
}

export function renderStatus(
  state: ViewState,
  width: number,
  theme?: Theme,
): string[] {
  const lines = statusLines(state).flatMap((line) =>
    wrapTextWithAnsi(
      theme
        ? theme.fg(line.startsWith("Diagnostic:") ? "warning" : "text", line)
        : line,
      Math.max(1, width),
    ),
  );
  return fitLines(lines, width);
}

export function installWidget(
  ctx: ExtensionContext,
  getState: () => ViewState,
  condensed: () => boolean = () => false,
): void {
  if (ctx.mode !== "tui") return;
  ctx.ui.setWidget("waypoint", (tui, theme) => ({
    render: (width) => {
      try {
        return compactLines(
          getState(),
          width,
          theme,
          condensed() ? 16 : tui.terminal.rows,
        );
      } catch {
        // Pi renders widgets outside the extension event handler's error boundary.
        return fitLines(["Waypoint view unavailable; /waypoint status"], width);
      }
    },
    invalidate() {},
  }));
}

export function notifyStatus(ctx: ExtensionContext, state: ViewState): void {
  const text = statusLines(state).join("\n");
  if (ctx.hasUI) ctx.ui.notify(text, "info");
  else process.stderr.write(`${text}\n`);
}

export async function select(
  ctx: ExtensionContext,
  title: string,
  items: SelectItem[] | (() => SelectItem[]),
  search = false,
  header?: (theme: Theme, width: number) => string[],
  options: {
    inlineValues?: boolean;
    selected?: string;
    searchPlaceholder?: string;
    shortcut?: (data: string, selected?: string) => string | undefined;
    styleLabel?: (item: SelectItem, text: string, theme: Theme) => string;
  } = {},
): Promise<string | undefined> {
  if (ctx.mode !== "tui") return undefined;
  return ctx.ui.custom<string | undefined>((tui, theme, _keys, done) => {
    const input = new Input({
      placeholder: options.searchPlaceholder ?? "Search",
    });
    let scroll = 0;
    let scrollLimit = 0;
    let visible = 8;
    let choices: SelectItem[] = [];
    const getItems = () => (typeof items === "function" ? items() : items);
    const makeList = (entries: SelectItem[]) => {
      const list = new SelectList(
        entries.map((item) => ({
          ...item,
          label: plain(item.label),
          description:
            !options.inlineValues && item.description
              ? plain(item.description)
              : undefined,
        })),
        visible,
        {
          selectedPrefix: (text) => theme.fg("accent", text),
          selectedText: (text) => theme.fg("accent", text),
          description: (text) => theme.fg("muted", text),
          scrollInfo: (text) => theme.fg("dim", text),
          noMatch: (text) => theme.fg("warning", text),
        },
        options.inlineValues
          ? {
              truncatePrimary: ({ item, maxWidth, isSelected }) => {
                const label = plain(item.label);
                const padded =
                  label + " ".repeat(Math.max(1, 17 - visibleWidth(label)));
                return truncateToWidth(
                  paint(theme, isSelected ? "accent" : "muted", padded) +
                    paint(
                      theme,
                      "text",
                      entries.find((entry) => entry.value === item.value)
                        ?.description ?? "",
                    ),
                  maxWidth,
                  "",
                );
              },
            }
          : options.styleLabel
            ? {
                truncatePrimary: ({ item, maxWidth }) =>
                  options.styleLabel?.(
                    item,
                    clipPlain(item.label, maxWidth),
                    theme,
                  ) ?? "",
              }
            : undefined,
      );
      list.onSelect = (item) => done(item.value);
      list.onCancel = () => done(undefined);
      return list;
    };
    let list = makeList(getItems());
    list.setSelectedIndex(
      Math.max(
        0,
        getItems().findIndex((item) => item.value === options.selected),
      ),
    );
    function updateList(nextVisible: number) {
      const next = search
        ? fuzzyFilter(
            getItems(),
            input.getValue(),
            (item) => `${item.label} ${item.description ?? ""}`,
          )
        : getItems();
      if (
        nextVisible === visible &&
        JSON.stringify(next) === JSON.stringify(choices)
      )
        return;
      const selected = list.getSelectedItem()?.value;
      visible = nextVisible;
      choices = next;
      list = makeList(choices);
      list.setSelectedIndex(
        Math.max(
          0,
          choices.findIndex((item) => item.value === selected),
        ),
      );
    }
    return {
      get focused() {
        return input.focused;
      },
      set focused(value: boolean) {
        input.focused = value;
      },
      render(width: number) {
        // Reserve space for Pi's surrounding widget/footer and the list's scroll row.
        const budget = Math.max(4, tui.terminal.rows - 5);
        const inputLines = search ? input.render(width) : [];
        const heading = (header?.(theme, width) ?? []).flatMap((line) =>
          wrapTextWithAnsi(line, Math.max(1, width)),
        );
        const headerBudget = Math.max(
          0,
          budget -
            2 -
            inputLines.length -
            Math.min(4, Math.max(1, getItems().length)),
        );
        const visibleHeader = Math.min(heading.length, headerBudget);
        scrollLimit = Math.max(0, heading.length - visibleHeader);
        scroll = Math.min(scroll, scrollLimit);
        const more =
          scrollLimit > 0
            ? [
                paint(
                  theme,
                  "dim",
                  `${scroll + 1}-${Math.min(heading.length, scroll + visibleHeader)}/${heading.length}`,
                ),
              ]
            : [];
        updateList(
          Math.max(
            1,
            budget - 2 - inputLines.length - visibleHeader - more.length,
          ),
        );
        return fitLines(
          [
            theme.fg("accent", plain(title)),
            ...heading.slice(scroll, scroll + visibleHeader),
            ...more,
            ...inputLines,
            ...list.render(width),
          ],
          width,
        );
      },
      invalidate() {
        input.invalidate();
        list.invalidate();
      },
      handleInput(data: string) {
        const shortcut = options.shortcut?.(
          data,
          list.getSelectedItem()?.value,
        );
        if (shortcut !== undefined) {
          done(shortcut);
          return;
        }
        if (header && matchesKey(data, Key.pageDown))
          scroll = Math.min(scrollLimit, scroll + 5);
        else if (header && matchesKey(data, Key.pageUp))
          scroll = Math.max(0, scroll - 5);
        else if (
          !search ||
          [
            Key.up,
            Key.down,
            Key.enter,
            Key.escape,
            Key.pageUp,
            Key.pageDown,
          ].some((key) => matchesKey(data, key))
        )
          list.handleInput(data);
        else {
          input.handleInput(data);
          updateList(visible);
        }
        tui.requestRender();
      },
    };
  });
}

export async function openPanel(
  ctx: ExtensionContext,
  getState: () => ViewState,
  selected?: string,
): Promise<string | undefined> {
  return select(
    ctx,
    "Waypoint",
    () => {
      const state = getState();
      return [
        {
          value: "mode",
          label: "Mode",
          description: `${state.mode} (session)`,
        },
        {
          value: "model",
          label: "Strong Model",
          description: identity(state.config.config.strongModel),
        },
        {
          value: "thinking",
          label: "Strong Thinking",
          description: state.config.config.strongThinking ?? "not set",
        },
        {
          value: "task",
          label: "Trellis Task",
          description: state.tasks.active
            ? "Native status and relations"
            : state.tasks.recent
              ? "Last observed (not active)"
              : "none",
        },
        ...(canCycleTasks(state)
          ? [
              {
                value: "toggle",
                label: "Task View",
                description: `${taskViewLabel(state.taskView ?? "focused")} -> ${taskViewLabel(nextTaskView(state.taskView ?? "focused"))}`,
              },
            ]
          : []),
        { value: "details", label: "Details" },
        {
          value: "diagnostics",
          label: "Diagnostics",
          description: state.diagnostics.length
            ? `${state.diagnostics.length} notices`
            : "none",
        },
        { value: "refresh", label: "Refresh" },
        { value: "close", label: "Close" },
      ];
    },
    false,
    (theme, width) => {
      const state = getState();
      const task = state.tasks.active
        ? state.tasks.nodes.get(state.tasks.active)
        : undefined;
      return fitLines(
        [
          paint(theme, "muted", "  Guidance  ") +
            paint(theme, routingColor(state), routingText(state)),
          paint(theme, "muted", "  Current   ") +
            paint(theme, "text", state.current),
          "",
          task
            ? taskRow(state, task, width, "  ", theme)
            : paint(theme, "muted", "  No active Trellis task"),
        ],
        width,
      );
    },
    { inlineValues: true, selected },
  );
}

export async function showDetails(
  ctx: ExtensionContext,
  getState: () => ViewState,
  view: "details" | "diagnostics",
): Promise<void> {
  await select(
    ctx,
    view === "details" ? "Waypoint Details" : "Waypoint Diagnostics",
    [{ value: "", label: "Back" }],
    false,
    (theme, width) => {
      const state = getState();
      if (view === "details") return renderStatus(state, width, theme);
      return state.diagnostics.length
        ? state.diagnostics.map((message) =>
            paint(theme, "warning", `Diagnostic: ${message}`),
          )
        : [
            paint(
              theme,
              "muted",
              "No configuration or compatibility diagnostics.",
            ),
          ];
    },
  );
}

export async function chooseMode(
  ctx: ExtensionContext,
  mode: Mode,
): Promise<Mode | undefined> {
  if (ctx.mode !== "tui") return undefined;
  return ctx.ui.custom<Mode | undefined>((tui, theme, _keys, done) => {
    const list = new SettingsList(
      [
        {
          id: "mode",
          label: "Mode",
          currentValue: mode,
          values: ["auto", "on", "off"],
        },
      ],
      3,
      {
        label: (text, selected) => theme.fg(selected ? "accent" : "text", text),
        value: (text, selected) =>
          theme.fg(selected ? "accent" : "muted", text),
        description: (text) => theme.fg("muted", text),
        cursor: "> ",
        hint: (text) => theme.fg("dim", text),
      },
      (_id, value) => done(value as Mode),
      () => done(undefined),
    );
    return {
      render: (width) => fitLines(list.render(width), width),
      invalidate: () => list.invalidate(),
      handleInput: (data) => {
        list.handleInput(data);
        tui.requestRender();
      },
    };
  });
}

export async function chooseModel(
  ctx: ExtensionContext,
  models: readonly AvailableModel[],
): Promise<AvailableModel | "refresh" | undefined> {
  const picked = await select(
    ctx,
    "Strong Model",
    [
      { value: "refresh", label: "Refresh registry" },
      ...models.map((model, index) => ({
        value: String(index),
        label: identity(model),
        description: model.name,
      })),
    ],
    true,
    undefined,
    { searchPlaceholder: "Search models" },
  );
  return picked === "refresh"
    ? "refresh"
    : picked === undefined
      ? undefined
      : models[Number(picked)];
}

function relatedCompleted(state: ViewState): TaskNode[] {
  return state.tasks.active
    ? taskFamily(state.tasks, true).filter(taskClosed)
    : [];
}

function browserTasks(state: ViewState, showCompleted: boolean): TaskNode[] {
  return state.tasks.active
    ? taskFamily(state.tasks, showCompleted)
    : state.tasks.recent
      ? [state.tasks.nodes.get(state.tasks.recent)].filter(
          (node): node is TaskNode => !!node,
        )
      : [];
}

async function showNativeTaskDetails(
  ctx: ExtensionContext,
  getState: () => ViewState,
  path: string,
): Promise<void> {
  await select(
    ctx,
    "Native Task Details",
    [{ value: "", label: "Back" }],
    false,
    (theme, _width) => {
      const live = getState();
      const node = live.tasks.nodes.get(path);
      if (!node)
        return [
          paint(
            theme,
            "muted",
            "Task is no longer in the current native view.",
          ),
        ];
      return [
        taskTitle(node, node.title, theme, live.tasks.active === path),
        paint(
          theme,
          "muted",
          live.tasks.active === path ? "Active task" : "Not active",
        ),
        ...nativeDetails(node).map((line) =>
          paint(
            theme,
            line.startsWith("Diagnostic:") ? "warning" : "text",
            line,
          ),
        ),
        ...live.tasks.diagnostics
          .filter((message) => !node.diagnostics.includes(message))
          .map((message) =>
            paint(theme, "warning", `Diagnostic: ${message}`),
          ),
      ];
    },
  );
}

interface TaskTreeEntry {
  node: TaskNode;
  prefix: string;
}

function browserTreeEntries(
  state: ViewState,
  showCompleted: boolean,
): TaskTreeEntry[] {
  const family = browserTasks(state, showCompleted);
  const byPath = new Map(family.map((node) => [node.path, node]));
  const seen = new Set<string>();
  const entries: TaskTreeEntry[] = [];
  const childrenOf = (node: TaskNode) =>
    node.children
      .map((child) => byPath.get(child))
      .filter((child): child is TaskNode => !!child);
  const visit = (node: TaskNode, ancestorPrefix: string, connector: string) => {
    if (seen.has(node.path)) return;
    seen.add(node.path);
    entries.push({ node, prefix: ancestorPrefix + connector });
    const children = childrenOf(node);
    const childPrefix =
      ancestorPrefix +
      (connector ? (connector === "`- " ? "   " : "|  ") : "");
    children.forEach((child, index) => {
      visit(
        child,
        childPrefix,
        index === children.length - 1 ? "`- " : "|- ",
      );
    });
  };
  family
    .filter((node) => !node.parent || !byPath.has(node.parent))
    .forEach((root) => {
      visit(root, "", "");
    });
  return entries;
}

async function taskTreeDialog(
  ctx: ExtensionContext,
  getState: () => ViewState,
  showCompleted: boolean,
  initialPath: string | undefined,
): Promise<string | undefined> {
  if (ctx.mode !== "tui") return undefined;
  return ctx.ui.custom<string | undefined>((tui, theme, _keys, done) => {
    let selectedPath = initialPath;
    let focused = true;
    const entries = () => browserTreeEntries(getState(), showCompleted);
    const completedCount = () => relatedCompleted(getState()).length;
    const currentEntries = () => {
      const live = entries();
      if (live.some(({ node }) => node.path === selectedPath)) return live;
      const fallback = getState().tasks.active ?? getState().tasks.recent;
      selectedPath =
        live.find(({ node }) => node.path === fallback)?.node.path ??
        live[0]?.node.path;
      return live;
    };
    const selectedIndex = (rows: TaskTreeEntry[]) =>
      Math.max(
        0,
        rows.findIndex(({ node }) => node.path === selectedPath),
      );
    const move = (delta: number) => {
      const rows = currentEntries();
      if (!rows.length) return;
      const index = selectedIndex(rows);
      selectedPath = rows[
        Math.max(0, Math.min(rows.length - 1, index + delta))
      ]?.node.path;
    };
    return {
      get focused() {
        return focused;
      },
      set focused(value: boolean) {
        focused = value;
      },
      render(width: number) {
        const rows = currentEntries();
        const index = selectedIndex(rows);
        const chrome = 4;
        const rowBudget = Math.max(1, tui.terminal.rows - chrome);
        const start = Math.max(
          0,
          Math.min(
            Math.max(0, rows.length - rowBudget),
            index - Math.floor(rowBudget / 2),
          ),
        );
        const visible = rows.slice(start, start + rowBudget);
        const scroll =
          rows.length > rowBudget
            ? paint(
                theme,
                "dim",
                `${start + 1}-${Math.min(rows.length, start + rowBudget)}/${rows.length}`,
              )
            : undefined;
        const lines = [
          paint(theme, "accent", "Trellis Task Tree"),
          paint(
            theme,
            "dim",
            "↑/↓ move; Enter/Alt+D details; Esc close",
          ),
          paint(
            theme,
            "dim",
            completedCount()
              ? `Alt+C ${showCompleted ? "hide" : "show"} completed (${completedCount()})`
              : "No related completed records",
          ),
          ...(scroll ? [scroll] : []),
          ...(visible.length
            ? visible.map(({ node, prefix }) => {
                const selected = node.path === selectedPath;
                const marker = selected ? paint(theme, "accent", "→ ") : "  ";
                return (
                  marker +
                  taskRow(
                    getState(),
                    node,
                    Math.max(0, width - visibleWidth(marker)),
                    prefix,
                    theme,
                  )
                );
              })
            : [
                paint(
                  theme,
                  "muted",
                  "Task is no longer in the current native view.",
                ),
              ]),
        ];
        return fitLines(lines, width);
      },
      invalidate() {},
      handleInput(data: string) {
        if (matchesKey(data, Key.escape)) return done(undefined);
        if (matchesKey(data, "alt+c") && completedCount())
          return done("toggle-completed");
        if (matchesKey(data, "alt+d") || matchesKey(data, Key.enter))
          return selectedPath
            ? done(`details:${selectedPath}`)
            : done(undefined);
        if (matchesKey(data, Key.up)) move(-1);
        else if (matchesKey(data, Key.down)) move(1);
        else if (matchesKey(data, Key.pageUp)) move(-5);
        else if (matchesKey(data, Key.pageDown)) move(5);
        tui.requestRender();
      },
    };
  });
}

async function browseTaskTree(
  ctx: ExtensionContext,
  getState: () => ViewState,
  alive: () => boolean,
  initialPath?: string,
): Promise<void> {
  const initial = getState();
  let path = initialPath ?? initial.tasks.active ?? initial.tasks.recent;
  const familyRoot = initial.tasks.familyRoot ?? path;
  const initialTask = path ? initial.tasks.nodes.get(path) : undefined;
  let showCompleted = !!initialTask && taskClosed(initialTask);
  while (alive() && path) {
    const state = getState();
    if (
      (state.tasks.familyRoot ?? state.tasks.active ?? state.tasks.recent) !==
      familyRoot
    )
      return;
    if (!browserTasks(state, showCompleted).some((node) => node.path === path))
      path = state.tasks.active ?? state.tasks.recent;
    if (!path || !browserTasks(getState(), showCompleted).length) return;
    const selected = await taskTreeDialog(
      ctx,
      getState,
      showCompleted,
      path,
    );
    if (!alive() || !selected) return;
    if (selected === "toggle-completed" || selected === "completed") {
      showCompleted = !showCompleted;
      if (
        !browserTasks(getState(), showCompleted).some(
          (node) => node.path === path,
        )
      )
        path = getState().tasks.active ?? getState().tasks.recent;
    } else if (selected === "evidence") {
      await showNativeTaskDetails(ctx, getState, path);
    } else if (selected.startsWith("evidence:")) {
      await showNativeTaskDetails(ctx, getState, selected.slice(9));
    } else if (selected.startsWith("details:")) {
      path = selected.slice(8);
      await showNativeTaskDetails(ctx, getState, path);
    } else if (
      browserTasks(getState(), showCompleted).some(
        (node) => node.path === selected,
      )
    ) {
      path = selected;
    } else return;
  }
}

export async function browseTasks(
  ctx: ExtensionContext,
  getState: () => ViewState,
  alive: () => boolean,
  initialPath?: string,
): Promise<void> {
  return browseTaskTree(ctx, getState, alive, initialPath);
}

export async function browseTaskPalette(
  ctx: ExtensionContext,
  getState: () => ViewState,
  alive: () => boolean,
): Promise<void> {
  return browseTaskTree(ctx, getState, alive);
}
