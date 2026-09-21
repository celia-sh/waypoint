import { stripVTControlCharacters } from "node:util";
import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth, type TUI } from "@earendil-works/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { parseConfig } from "../../src/config.js";
import type { TaskNode } from "../../src/trellis.js";
import {
  canCycleTasks,
  compactLines,
  installWidget,
  nextTaskView,
  renderStatus,
  statusLines,
  type ViewState,
} from "../../src/ui.js";

const emphasis = {
  bold: (text: string) => text,
  strikethrough: (text: string) => text,
};

function node(name: string, children: string[] = []): TaskNode {
  return {
    path: `/${name}`,
    ref: name,
    title: name,
    status: "in_progress",
    archived: false,
    children: children.map((child) => `/${child}`),
    diagnostics: [],
  };
}

function view(nodes = [node("root")], active = nodes[0]?.path): ViewState {
  for (const parent of nodes)
    for (const child of nodes)
      if (parent.children.includes(child.path)) child.parent = parent.path;
  return {
    mode: "auto",
    current: "fixture/ordinary",
    config: parseConfig({}),
    tasks: {
      active,
      familyRoot: nodes[0]?.path,
      nodes: new Map(nodes.map((task) => [task.path, task])),
      diagnostics: [],
    },
    diagnostics: [],
    guidance: false,
    routing: "unavailable",
  };
}

describe("compact routing prefix", () => {
  it.each([
    { routing: "enabled", color: "accent", mode: "on" },
    { routing: "bypassed", color: "muted", mode: "auto" },
    { routing: "off", color: "muted", mode: "off" },
    { routing: "unavailable", color: "warning", mode: "auto" },
  ] as const)(
    "shows @ $routing with semantic colors and preserves model formatting",
    ({ routing, color, mode }) => {
      const state = view([]);
      state.mode = mode;
      state.routing = routing;
      state.guidance = routing === "enabled";
      state.config = parseConfig({
        strongModel: {
          provider: "fixture",
          id: routing === "bypassed" ? "ordinary" : "strong",
        },
        strongThinking: "max",
      });
      const fg = vi.fn((_color: string, text: string) => text);
      const theme = { ...emphasis, fg } as unknown as Theme;
      const models =
        routing === "bypassed"
          ? "same fixture/ordinary"
          : "now fixture/ordinary / Strong fixture/strong";
      expect(compactLines(state, 120, theme)).toEqual([
        `@ ${routing} | ${models}`,
      ]);
      expect(fg).toHaveBeenCalledWith("accent", "@");
      expect(fg).toHaveBeenCalledWith(color, routing);
      if (routing === "bypassed") {
        expect(
          fg.mock.calls.some(
            ([role]) => role === "warning" || role === "error",
          ),
        ).toBe(false);
        expect(compactLines(state, 120)[0]).not.toMatch(/Strong|->/);
      }
      const detail = `Mode: ${mode} (guidance ${state.guidance ? "available" : "inactive"}; ${routing === "bypassed" ? "bypassed (same model)" : routing})`;
      expect(statusLines(state)[0]).toBe(detail);
      expect(renderStatus(state, 120)[0]).toBe(detail);
      expect(statusLines(state)).toContain("Strong Thinking: max");
    },
  );

  it.each(["enabled", "bypassed", "off", "unavailable"] as const)(
    "keeps %s distinct with long/CJK models, tasks and notices at 40/80/120 columns",
    (routing) => {
      for (const width of [40, 80, 120]) {
        for (const hasTask of [false, true]) {
          for (const notices of [false, true]) {
            const state = view(hasTask ? [node("root")] : []);
            state.mode = routing === "off" ? "off" : "auto";
            state.routing = routing;
            state.current = `界${"current".repeat(30)}/model`;
            state.config = parseConfig({
              strongModel: {
                provider: `界${"provider".repeat(30)}`,
                id: "model",
              },
            });
            if (notices)
              state.tasks.diagnostics = ["Unresolved native reference"];
            const theme = {
              ...emphasis,
              fg: (_color: string, text: string) =>
                `\u001b[36m${text}\u001b[39m`,
            } as Theme;
            for (const height of [16, 24]) {
              for (const themed of [undefined, theme]) {
                const rows = compactLines(state, width, themed, height);
                expect(rows).toHaveLength(
                  hasTask ? (height < 20 ? 2 : notices ? 3 : 2) : 1,
                );
                expect(rows.every((row) => visibleWidth(row) <= width)).toBe(
                  true,
                );
                const summary = stripVTControlCharacters(rows.at(-1) ?? "");
                expect(summary).toMatch(new RegExp(`^@ ${routing} \\| `));
                expect(summary).not.toMatch(/Waypoint|auto \||off \| off/);
                expect(summary.includes("task notices")).toBe(notices);
                if (hasTask)
                  expect(stripVTControlCharacters(rows[0] ?? "")).toBe(
                    "> root",
                  );
              }
            }
          }
        }
      }
    },
  );
});

describe("bounded native task family", () => {
  it("cycles Focused -> Collapsed -> Full -> Focused", () => {
    expect(nextTaskView("focused")).toBe("collapsed");
    expect(nextTaskView("collapsed")).toBe("full");
    expect(nextTaskView("full")).toBe("focused");
  });

  it("uses native title styling and ASCII markers without lifecycle suffixes or execution rows", () => {
    const state = view();
    expect(compactLines(state, 80)).toEqual([
      "> root",
      expect.stringContaining("@ unavailable"),
    ]);
    expect(canCycleTasks(state)).toBe(false);
    const root = state.tasks.nodes.get("/root") as TaskNode;
    root.status = "planning";
    expect(compactLines(state, 80)[0]).toBe("> root");
    root.status = "future-status";
    expect(compactLines(state, 80)[0]).toBe("> root");
    expect(compactLines(state, 80).join()).not.toMatch(
      /Activity:|agent:|Plan complete|Running|Implementing|Checking|pass complete|2\/4/,
    );
  });

  it("retains the family across parent/child/grandchild switches and excludes closed and unrelated records", () => {
    const state = view([
      node("root", ["child", "sibling", "closed"]),
      node("child", ["grandchild"]),
      node("grandchild"),
      node("sibling"),
      { ...node("closed"), status: "completed", archived: true },
      node("unrelated"),
    ]);
    for (const active of ["/root", "/child", "/grandchild"]) {
      state.tasks.active = active;
      const rows = compactLines(state, 80);
      expect(rows).toHaveLength(5);
      expect(rows.join()).toContain("root");
      expect(rows.join()).toContain("sibling");
      expect(
        rows.some(
          (row) =>
            row.startsWith("> ") && row.includes(active.slice(1)),
        ),
      ).toBe(true);
      expect(rows.join().match(/> /g)).toHaveLength(1);
      expect(rows.join()).not.toMatch(/closed|unrelated|[\u2500-\u257f]/);
      expect(rows.slice(0, -1).some((row) => /\|- |`- /.test(row))).toBe(
        true,
      );
      state.taskView = "collapsed";
      const collapsed = compactLines(state, 80);
      expect(collapsed).toHaveLength(2);
      expect(collapsed[0]).toContain(active.slice(1));
      expect(collapsed.join()).not.toMatch(/closed|unrelated/);
      if (active === "/grandchild")
        expect(collapsed[0]).toContain("root / child / grandchild");
      state.taskView = "focused";
    }
  });

  it("selects the active lineage first, then native sibling order only", () => {
    const state = view(
      [
        node("root", ["idle1", "idle2", "idle3", "idle4", "parent", "closed"]),
        node("idle1"),
        node("idle2"),
        node("idle3"),
        node("idle4"),
        node("parent", ["busy"]),
        node("busy"),
        { ...node("closed"), status: "completed" },
      ],
      "/busy",
    );
    const before = compactLines(state, 120);
    Object.assign(state, {
      legacyExecutionHistory: {
        "/idle4": "failed",
        "/busy": "running",
      },
    });
    expect(compactLines(state, 120)).toEqual(before);
    expect(before).toHaveLength(7);
    expect(before.slice(0, 5)).toEqual([
      "  root",
      "  |- idle1",
      "  |- idle2",
      "  `- parent",
      ">    `- busy",
    ]);
    expect(before[5]).toBe("+ 2 task rows hidden");
    expect(before.join()).not.toMatch(/idle3|idle4|closed|Activity:/);
  });

  it("shows active children and sibling roots before side-branch descendants", () => {
    const state = view(
      [
        node("root", ["active", "side", "review"]),
        node("active", ["direct"]),
        node("direct"),
        node("side", ["side-child", "side-other"]),
        node("side-child"),
        node("side-other"),
        node("review"),
      ],
      "/active",
    );
    expect(compactLines(state, 120).slice(0, 5)).toEqual([
      "  root",
      "> |- active",
      "  |  `- direct",
      "  |- side",
      "  `- review",
    ]);
    expect(compactLines(state, 120).at(-2)).toBe("+ 2 task rows hidden");
    expect(compactLines(state, 120).join()).not.toMatch(/side-child|side-other/);
  });

  it("keeps Focused strict and lets Full spend remaining rows on side-branch descendants", () => {
    const state = view(
      [
        node("root", ["active", "side"]),
        node("active", ["direct"]),
        node("direct"),
        node("side", ["side-child"]),
        node("side-child"),
      ],
      "/active",
    );
    expect(compactLines(state, 120).slice(0, -1)).toEqual([
      "  root",
      "> |- active",
      "  |  `- direct",
      "  `- side",
      "+ 1 task rows hidden",
    ]);
    expect(compactLines(state, 120).join()).not.toContain("side-child");
    state.taskView = "full";
    expect(compactLines(state, 120).slice(0, -1)).toEqual([
      "  root",
      "> |- active",
      "  |  `- direct",
      "  `- side",
      "     `- side-child",
    ]);
    state.taskView = "collapsed";
    expect(compactLines(state, 120)).toHaveLength(2);
    expect(compactLines(state, 120)[0]).toContain("root / active");
  });

  it("makes Full a native preorder traversal and truncates only its tail", () => {
    const state = view(
      [
        node("root", ["active", "side", "review"]),
        node("active", ["direct"]),
        node("direct"),
        node("side", ["side-child", "side-other"]),
        node("side-child"),
        node("side-other"),
        node("review"),
      ],
      "/active",
    );
    state.taskView = "full";
    expect(compactLines(state, 120).slice(0, -1)).toEqual([
      "  root",
      "> |- active",
      "  |  `- direct",
      "  `- side",
      "     |- side-child",
      "     `- side-other",
      "+ 1 task rows hidden",
    ]);
    expect(compactLines(state, 120).join()).not.toContain("review");
  });

  it("starts Full at the family root even when the active lineage is abbreviated", () => {
    const nodes = [
      node("root", ["branch", "tail"]),
      node("branch", ["level1"]),
      node("level1", ["level2"]),
      node("level2", ["level3"]),
      node("level3", ["level4"]),
      node("level4"),
      node("tail"),
    ];
    const state = view(nodes, "/level4");
    state.taskView = "full";
    const rows = compactLines(state, 120);
    expect(rows.slice(0, -1)).toEqual([
      "  root",
      "  `- branch",
      "     `- level1",
      "        `- level2",
      "           `- level3",
      ">             `- level4",
      "+ 1 task rows hidden",
    ]);
    expect(rows.join()).not.toContain("Path:");
    expect(rows.join()).not.toContain("tail");
  });

  it("keeps a deep active lineage visible as breadcrumb plus nearest native subtree", () => {
    const nodes = Array.from({ length: 12 }, (_, i) =>
      node(`level${i}`, i < 11 ? [`level${i + 1}`] : []),
    );
    const state = view(nodes, "/level11");
    for (const width of [40, 80, 120]) {
      const rows = compactLines(state, width);
      expect(rows.length).toBeLessThanOrEqual(8);
      expect(rows[0]).toMatch(/^Path: /);
      expect(rows[1]).toBe("  level9");
      expect(rows[2]).toBe("  `- level10");
      expect(rows[3]).toBe(">    `- level11");
      expect(rows.at(-2)).toBe("+ 9 task rows hidden");
      expect(rows.at(-1)).toContain("@ unavailable");
      expect(rows.join().match(/> /g)).toHaveLength(1);
      expect(rows.join()).toContain("+ 9 task rows hidden");
    }
  });

  it("retains closed structural context only for a live descendant or current task", () => {
    const state = view(
      [
        node("root", ["closed", "history"]),
        { ...node("closed", ["live"]), status: "completed" },
        node("live"),
        { ...node("history"), archived: true },
      ],
      "/live",
    );
    expect(compactLines(state, 80).join()).toContain("closed");
    expect(compactLines(state, 80).join()).not.toContain("history");
    state.tasks.active = "/closed";
    expect(compactLines(state, 80).join()).toContain("> `- closed");
  });

  it.each([
    "planning",
    "in_progress",
    "review",
    "completed",
    "future-status",
    "",
  ])("retains raw native %s without inferring child progress", (status) => {
    const state = view([node("root", ["child"]), node("child")], "/child");
    const root = state.tasks.nodes.get("/root") as TaskNode;
    root.status = status;
    expect(compactLines(state, 80)[0]).toBe("  root");
    expect(compactLines(state, 80)[1]).toContain("> `- child");
    state.tasks.active = "/root";
    expect(statusLines(state)).toContain(
      `Task status: ${status || "(missing)"}`,
    );
    expect(statusLines(state).join()).not.toMatch(
      /Archive:|Archive location:|Activity:|Plan:|Implement:|Verify:|Finish:|pass complete|final scope/,
    );
  });

  it("sanitizes unknown native values and keeps archive location separate", () => {
    const state = view();
    const root = state.tasks.nodes.get("/root") as TaskNode;
    root.status = "custom\u001b[2J\nvalue";
    root.archived = true;
    expect(compactLines(state, 80)[0]).toBe("> root");
    const details = statusLines(state).join("\n");
    expect(details).toContain("Task status: custom [2J value");
    expect(details).toContain("Archive: root");
    expect(details).not.toContain("\u001b");
    expect(details).not.toContain("Completed");
  });

  it.each([
    ["planning", false, "muted", false, false],
    ["in_progress", false, "text", false, false],
    ["review", false, "warning", false, false],
    ["completed", false, "muted", false, true],
    ["in_progress", true, "muted", false, true],
    ["custom", true, "muted", false, true],
    ["custom", false, "warning", false, false],
    ["", false, "warning", false, false],
  ] as const)(
    "styles %s (archived=%s) with current emphasis separate from lifecycle",
    (status, archived, color, bold, struck) => {
      const root = { ...node("root", ["child"]), status, archived };
      const state = view([root, node("child")]);
      const fg = vi.fn((_color: string, text: string) => text);
      const theme = {
        fg,
        bold: vi.fn((text: string) => `\u001b[1m${text}\u001b[22m`),
        strikethrough: vi.fn((text: string) => `\u001b[9m${text}\u001b[29m`),
      } as unknown as Theme;
      for (const active of ["/root", "/child"]) {
        state.tasks.active = active;
        vi.clearAllMocks();
        const title = compactLines(state, 80, theme)[0] ?? "";
        expect(stripVTControlCharacters(title)).toBe(
          active === "/root" ? "> root" : "  root",
        );
        const current = active === "/root";
        const expectedColor =
          status === "in_progress" && !archived
            ? current
              ? "accent"
              : "text"
            : color;
        const expectedBold =
          status === "in_progress" && !archived ? current : bold;
        expect(fg).toHaveBeenCalledWith(expectedColor, "root");
        expect(title.includes("\u001b[1m")).toBe(expectedBold);
        expect(title.includes("\u001b[9m")).toBe(struck);
        expect(title).not.toMatch(
          /Planning|Processing|Review|Completed|Unknown|context/,
        );
      }
    },
  );

  it.each(
    [40, 80, 120].flatMap((width) =>
      [16, 24, 40].map((height) => ({ width, height })),
    ),
  )(
    "fits sanitized themed CJK titles at $width x $height without losing current task/state",
    ({ width, height }) => {
      const state = view([node("root", ["child"]), node("child")], "/child");
      const child = state.tasks.nodes.get("/child") as TaskNode;
      child.title = `${"界".repeat(80)}\u001b[2J\n`;
      const theme = {
        bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
        strikethrough: (text: string) => `\u001b[9m${text}\u001b[29m`,
        fg: (_color: string, text: string) => `\u001b[36m${text}\u001b[39m`,
      } as Theme;
      const rows = compactLines(state, width, theme, height);
      expect(rows.length).toBeLessThanOrEqual(height < 20 ? 2 : 8);
      for (const row of rows) {
        expect(visibleWidth(row)).toBeLessThanOrEqual(width);
        expect(row).not.toContain("\u001b[2J");
        expect(row).not.toContain("\n");
      }
      const current = rows
        .map(stripVTControlCharacters)
        .find((row) => row.includes("> "));
      expect(current).toContain("界");
      expect(current).not.toContain(" | ");
      expect(stripVTControlCharacters(rows.at(-1) ?? "")).toContain(
        "@ unavailable",
      );
    },
  );

  it("distinguishes read/relationship notices from exact task overflow", () => {
    const state = view([node("root", ["child"]), node("child")]);
    state.tasks.diagnostics = [
      "Task read bound exceeded; remaining relations are unresolved.",
    ];
    const rows = compactLines(state, 80);
    expect(rows.join()).toContain("Family evidence incomplete");
    expect(rows.join()).not.toContain("rows hidden");
    expect(rows.at(-1)).toContain("task notices");
    state.taskView = "collapsed";
    expect(compactLines(state, 80)).toHaveLength(2);
    expect(compactLines(state, 80).at(-1)).toContain("task notices");
  });

  it("has one status row without an active task", () => {
    const state = view();
    state.tasks.recent = state.tasks.active;
    state.tasks.active = undefined;
    expect(compactLines(state, 80)).toHaveLength(1);
    expect(canCycleTasks(state)).toBe(false);
  });

  it("contains widget errors and uses fresh terminal/theme/preference data after invalidation", () => {
    let state = view();
    let color = 36;
    const theme = {
      ...emphasis,
      fg: (_color: string, text: string) => `\u001b[${color}m${text}\u001b[39m`,
    } as Theme;
    const setWidget = vi.fn();
    const getState = vi.fn(() => state);
    installWidget(
      { mode: "tui", ui: { setWidget } } as unknown as ExtensionContext,
      getState,
    );
    const terminal = { rows: 24 };
    const widget = setWidget.mock.calls[0]?.[1]({ terminal } as TUI, theme);
    getState.mockImplementationOnce(() => {
      throw new Error("failed");
    });
    expect(widget.render(80)).toEqual([
      "Waypoint view unavailable; /waypoint status",
    ]);
    expect(widget.render(80)).toHaveLength(2);
    terminal.rows = 16;
    expect(widget.render(40)).toHaveLength(2);
    terminal.rows = 40;
    state = view([node("fresh", ["child"]), node("child")]);
    color = 35;
    widget.invalidate();
    expect(widget.render(120)).toHaveLength(3);
    expect(widget.render(120).join()).toContain("\u001b[35mfresh");
    state.taskView = "collapsed";
    expect(widget.render(120)).toHaveLength(2);
    vi.spyOn(theme, "fg").mockImplementationOnce(() => {
      throw new Error("theme failed");
    });
    expect(widget.render(80)).toEqual([
      "Waypoint view unavailable; /waypoint status",
    ]);
  });
});
