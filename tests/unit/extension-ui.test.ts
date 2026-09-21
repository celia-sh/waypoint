import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  RegisteredCommand,
  Theme,
} from "@earendil-works/pi-coding-agent";
import {
  Input,
  SelectList,
  visibleWidth,
  type Component,
  type TUI,
} from "@earendil-works/pi-tui";
import { stripVTControlCharacters } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseConfig } from "../../src/config.js";
import waypoint from "../../src/index.js";
import {
  compactLines,
  browseTasks,
  openPanel,
  plain,
  renderStatus,
  showDetails,
  select,
  type ViewState,
} from "../../src/ui.js";
import type { TaskNode } from "../../src/trellis.js";
import { model, project, write } from "./fixtures.js";

const directories: string[] = [];
const theme = {
  fg: (_color: string, text: string) => text,
  bold: (text: string) => text,
  strikethrough: (text: string) => text,
} as Theme;
type Handler = (
  event: Record<string, unknown>,
  context: ExtensionContext,
) => unknown;
function harness(mode: ExtensionContext["mode"] = "tui") {
  vi.stubEnv("TRELLIS_SUBAGENT_CHILD", "0");
  const fixture = project();
  directories.push(fixture.root);
  const agentDir = join(fixture.root, "agent");
  vi.stubEnv("PI_CODING_AGENT_DIR", agentDir);
  write(join(agentDir, "waypoint.json"), {
    defaultMode: "auto",
    strongModel: { provider: model.provider, id: model.id },
    strongThinking: "max",
  });
  const handlers = new Map<string, Handler>();
  const shortcuts = new Map<
    string,
    { handler: (ctx: ExtensionContext) => unknown }
  >();
  let command: RegisteredCommand | undefined;
  const branch: unknown[] = [];
  const calls: string[] = [];
  let sessionId = "session";
  const api = {
    on: (name: string, handler: Handler) => {
      handlers.set(name, handler);
    },
    registerCommand: (_name: string, value: RegisteredCommand) => {
      command = value;
    },
    registerShortcut: (
      _key: string,
      value: { handler: (ctx: ExtensionContext) => unknown },
    ) => {
      shortcuts.set(_key, value);
    },
    getAllTools: () => [fixture.tool],
    getActiveTools: () => [fixture.tool.name],
    appendEntry: (customType: string, data: unknown) => {
      branch.push({ type: "custom", customType, data });
    },
  } as unknown as ExtensionAPI;
  const custom = vi.fn();
  const ctx = {
    cwd: fixture.root,
    mode,
    hasUI: mode === "tui" || mode === "rpc",
    isProjectTrusted: () => true,
    model: { ...model, id: "ordinary" },
    modelRegistry: { getAvailable: () => [model], refresh: vi.fn() },
    sessionManager: {
      getSessionId: () => sessionId,
      getSessionFile: () => undefined,
      getBranch: () => branch,
      getHeader: () => null,
    },
    ui: {
      theme,
      setWidget: vi.fn(),
      setFooter: vi.fn(),
      setEditorComponent: vi.fn(),
      custom,
      notify: vi.fn((message: string) => {
        calls.push(message);
      }),
    },
  } as unknown as ExtensionCommandContext;
  waypoint(api);
  return {
    ...fixture,
    ctx,
    handlers,
    shortcuts,
    calls,
    branch,
    custom,
    agentDir,
    session: (id: string) => {
      sessionId = id;
    },
    emit: async (name: string, event: Record<string, unknown> = {}) =>
      handlers.get(name)?.(event, ctx),
    command: async (args: string) => {
      if (!command) throw new Error("Command missing");
      await command.handler(args, ctx);
    },
    completions: (prefix: string) => command?.getArgumentCompletions?.(prefix),
  };
}
afterEach(() => {
  vi.unstubAllEnvs();
  for (const path of directories.splice(0))
    rmSync(path, { recursive: true, force: true });
});

describe("extension wiring", () => {
  it("registers nothing in native children", () => {
    vi.stubEnv("TRELLIS_SUBAGENT_CHILD", "1");
    const on = vi.fn();
    const registerCommand = vi.fn();
    waypoint({ on, registerCommand } as unknown as ExtensionAPI);
    expect(on).not.toHaveBeenCalled();
    expect(registerCommand).not.toHaveBeenCalled();
  });
  it("refreshes ephemeral guidance and session-only modes without tool/model mutations", async () => {
    const host = harness();
    await host.emit("session_start");
    const first = await host.emit("context", { messages: [] });
    expect(JSON.stringify(first)).toContain("thinking=max");
    await host.command("off");
    expect(await host.emit("context", { messages: [] })).toEqual({
      messages: [],
    });
    await host.command("on");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("Waypoint (on)");
    expect(host.branch).toEqual([
      { type: "custom", customType: "waypoint-mode", data: { mode: "off" } },
      { type: "custom", customType: "waypoint-mode", data: { mode: "on" } },
    ]);
    expect(host.handlers.has("tool_call")).toBe(false);
    expect(host.handlers.has("session_before_compact")).toBe(false);
    expect(host.completions("")).toHaveLength(6);
    expect(host.completions("th")).toEqual([
      { value: "thinking", label: "thinking" },
    ]);
    await host.emit("session_shutdown");
  });
  it("replays branch mode and starts a new empty session from the default", async () => {
    const host = harness();
    await host.emit("session_start");
    await host.command("on");
    await host.emit("session_tree");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("Waypoint (on)");
    host.branch.splice(0);
    await host.emit("session_tree");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("Waypoint (auto)");
    await host.emit("session_shutdown");
    host.session("new-session");
    await host.emit("session_start");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("Waypoint (auto)");
    await host.emit("session_shutdown");
  });
  it("does not subscribe to or replay execution lifecycle history", async () => {
    const host = harness();
    host.task();
    host.pointer("task");
    host.branch.push(
      {
        type: "message",
        message: {
          role: "assistant",
          content: [
            {
              type: "toolCall",
              id: "old-call",
              name: "trellis_subagent",
              arguments: { agent: "implement", prompt: "Work" },
            },
          ],
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "trellis_subagent",
          toolCallId: "old-call",
          isError: true,
        },
      },
    );
    await host.emit("session_start", { reason: "reload" });
    for (const event of [
      "tool_execution_start",
      "tool_execution_update",
      "tool_execution_end",
    ])
      expect(host.handlers.has(event)).toBe(false);
    const before = await host.emit("context", { messages: [] });
    await host.command("status");
    expect(host.calls.at(-1)).toContain("Task status: in_progress");
    expect(host.calls.at(-1)).not.toMatch(
      /Activity:|interrupted|old-call|trellis-implement|pass complete/,
    );
    await host.emit("session_start", { reason: "reload" });
    await host.command("status");
    expect(host.calls.at(-1)).not.toMatch(
      /Activity:|interrupted|old-call|trellis-implement|pass complete/,
    );
    expect(await host.emit("context", { messages: [] })).toEqual(before);
    write(join(host.agentDir, "waypoint.json"), {
      defaultMode: "auto",
      strongModel: { provider: model.provider, id: model.id },
      strongThinking: "high",
    });
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("thinking=high");
    await host.emit("session_shutdown");
  });
  it("cancelled selectors never save; selecting model and thinking saves one transaction", async () => {
    const host = harness();
    await host.emit("session_start");
    host.custom.mockResolvedValueOnce(undefined);
    await host.command("model");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("thinking=max");
    host.custom.mockResolvedValueOnce("0").mockResolvedValueOnce(undefined);
    await host.command("model");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("thinking=max");
    host.custom.mockResolvedValueOnce("0").mockResolvedValueOnce("high");
    await host.command("model");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("thinking=high");
    host.custom.mockResolvedValueOnce("off");
    await host.command("thinking");
    expect(host.calls.join()).toContain("no longer available");
    expect(
      JSON.stringify(await host.emit("context", { messages: [] })),
    ).toContain("thinking=high");
    await host.emit("session_shutdown");
  });
  it.each(["session_tree", "session_start"])(
    "drops last-task reconciliation on %s",
    async (event) => {
      const host = harness();
      const path = host.task();
      host.pointer("task");
      await host.emit("session_start");
      unlinkSync(join(host.root, ".trellis/.runtime/sessions/pi_session.json"));
      await host.command("status");
      expect(host.calls.at(-1)).toContain("Trellis Task: none");
      expect(host.calls.at(-1)).not.toContain("Last Observed Task");
      host.task("task", { status: "completed" });
      await host.command("status");
      expect(host.calls.at(-1)).toContain(
        "Last Observed Task: task (not active)",
      );
      expect(host.calls.at(-1)).not.toMatch(/Archive:|Archive location:/);
      const archive = join(host.root, ".trellis/tasks/archive/2026-09/task");
      mkdirSync(join(archive, ".."), { recursive: true });
      renameSync(path, archive);
      await host.command("status");
      expect(host.calls.at(-1)).toContain("archive/2026-09/task");
      expect(host.calls.at(-1)).toContain("Task status: completed");
      expect(host.calls.at(-1)).not.toMatch(/Finish:|Activity:|final scope/);
      await host.emit(event);
      await host.command("status");
      expect(host.calls.at(-1)).not.toContain("Last Observed Task");
      await host.emit("session_shutdown");
    },
  );
  it("reconciles archive after observing the transient stale native pointer", async () => {
    const host = harness();
    const path = host.task();
    host.pointer("task");
    await host.emit("session_start");
    host.task("task", { status: "completed" });
    const archive = join(host.root, ".trellis/tasks/archive/2026-09/task");
    mkdirSync(join(archive, ".."), { recursive: true });
    renameSync(path, archive);
    await host.command("status");
    expect(host.calls.at(-1)).toContain("pointer is stale");
    expect(host.calls.at(-1)).not.toContain("Last Observed Task");
    unlinkSync(join(host.root, ".trellis/.runtime/sessions/pi_session.json"));
    await host.command("status");
    expect(host.calls.at(-1)).toContain(
      "Last Observed Task: task (not active)",
    );
    expect(host.calls.at(-1)).toContain("archive/2026-09/task");
    await host.emit("session_shutdown");
  });
  it("does not import the last task into another session or task", async () => {
    const host = harness();
    host.task("first");
    host.pointer("first");
    await host.emit("session_start");
    host.task("other");
    host.pointer("other");
    await host.command("status");
    host.task("first", { status: "completed" });
    unlinkSync(join(host.root, ".trellis/.runtime/sessions/pi_session.json"));
    await host.command("status");
    expect(host.calls.at(-1)).not.toContain("Last Observed Task");
    host.task("other", { status: "completed" });
    host.session("new");
    await host.command("status");
    expect(host.calls.at(-1)).not.toContain("Last Observed Task");
    await host.emit("session_shutdown");
  });
  it("ignores a pending selector after a session change and rechecks registry availability", async () => {
    const host = harness();
    await host.emit("session_start");
    const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
    let finish: ((value: string) => void) | undefined;
    host.custom.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = host.command("thinking");
    await vi.waitFor(() => expect(finish).toBeDefined());
    await host.emit("session_tree");
    finish?.("high");
    await pending;
    expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
      before,
    );
    host.custom.mockImplementationOnce(async () => {
      vi.spyOn(host.ctx.modelRegistry, "getAvailable").mockReturnValue([]);
      return "high";
    });
    await host.command("thinking");
    expect(host.calls.join()).toContain("no longer available");
    expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
      before,
    );
    await host.emit("session_shutdown");
  });
  it("does not throw into the context hook when both registry and notification channels fail", async () => {
    const host = harness();
    await host.emit("session_start");
    vi.spyOn(host.ctx.modelRegistry, "getAvailable").mockImplementation(() => {
      throw new Error("registry failed");
    });
    vi.mocked(host.ctx.ui.notify).mockImplementation(() => {
      throw new Error("UI failed");
    });
    await expect(host.emit("context", { messages: [] })).resolves.toEqual({
      messages: [],
    });
    await host.emit("session_shutdown");
  });
  it("presents equal-identity Auto bypass neutrally and keeps policy unchanged", async () => {
    const host = harness();
    Object.defineProperty(host.ctx, "model", {
      value: { ...model, name: "Different display label" },
      configurable: true,
    });
    await host.emit("session_start");
    const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
    await host.command("status");
    expect(host.calls.at(-1)).toContain("bypassed (same model)");
    expect(
      host.calls
        .at(-1)
        ?.split("\n")
        .filter((line) => line.startsWith("Diagnostic:"))
        .join(),
    ).not.toContain("bypass");
    expect(await host.emit("context", { messages: [] })).toEqual({
      messages: [],
    });
    const widgetFactory = vi
      .mocked(host.ctx.ui.setWidget)
      .mock.calls.at(-1)?.[1];
    expect(typeof widgetFactory).toBe("function");
    if (typeof widgetFactory === "function") {
      const widget = widgetFactory({ terminal: { rows: 24 } } as TUI, theme);
      const line = widget.render(120).join();
      expect(line).toContain("bypassed");
      expect(line).toContain("same fixture/strong");
      expect(line.split("fixture/strong")).toHaveLength(2);
      expect(line).not.toContain(" > ");
    }
    await host.command("on");
    expect(host.calls.at(-1)).toContain("; enabled)");
    await host.command("off");
    expect(host.calls.at(-1)).toContain("; off)");
    expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
      before,
    );
    await host.emit("session_shutdown");
  });
  it("does not guess equality from ambiguous display strings or bypass unusable configuration", async () => {
    const host = harness();
    const strong = { ...model, provider: "a/b", id: "c" };
    Object.defineProperty(host.ctx, "model", {
      value: { ...model, provider: "a", id: "b/c" },
      configurable: true,
    });
    vi.spyOn(host.ctx.modelRegistry, "getAvailable").mockReturnValue([strong]);
    write(join(host.agentDir, "waypoint.json"), {
      strongModel: strong,
      strongThinking: "max",
    });
    await host.emit("session_start");
    await host.command("status");
    expect(host.calls.at(-1)).toContain("; enabled)");
    expect(host.calls.at(-1)).not.toContain("bypassed");
    Object.defineProperty(host.ctx, "model", { value: strong });
    vi.mocked(host.ctx.modelRegistry.getAvailable).mockReturnValue([]);
    await host.command("status");
    expect(host.calls.at(-1)).toContain("; unavailable)");
    expect(host.calls.at(-1)).not.toContain("bypassed");
    await host.emit("session_shutdown");
  });
  it("returns from secondary views and cancelled selectors to the panel without saving", async () => {
    const host = harness();
    host.task();
    host.pointer("task");
    await host.emit("session_start");
    const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
    const policy = await host.emit("context", { messages: [] });
    const titles: string[] = [];
    for (const value of [
      "details",
      undefined,
      "diagnostics",
      undefined,
      "task",
      "evidence",
      undefined,
      undefined,
      "mode",
      undefined,
      "model",
      undefined,
      "thinking",
      undefined,
      "close",
    ]) {
      host.custom.mockImplementationOnce(async (factory) => {
        const widgetFactory = vi
          .mocked(host.ctx.ui.setWidget)
          .mock.calls.at(-1)?.[1];
        if (typeof widgetFactory !== "function")
          throw new Error("Widget missing");
        expect(
          widgetFactory({ terminal: { rows: 24 } } as TUI, theme).render(80),
        ).toHaveLength(2);
        const component = factory(
          { requestRender: vi.fn(), terminal: { rows: 24 } },
          theme,
          {},
          vi.fn(),
        );
        titles.push(component.render(80)[0]);
        return value;
      });
    }
    await host.command("");
    expect(titles.filter((title) => title === "Waypoint")).toHaveLength(7);
    expect(titles).toContain("Waypoint Details");
    expect(titles).toContain("Waypoint Diagnostics");
    expect(titles).toContain("Trellis Task Tree");
    expect(titles).toContain("Native Task Details");
    expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
      before,
    );
    expect(host.branch).toEqual([]);
    expect(await host.emit("context", { messages: [] })).toEqual(policy);
    await host.emit("session_shutdown");
  });
  it("condenses the widget throughout dialogs and restores it on cancel or error without footer changes", async () => {
    const host = harness();
    host.task();
    host.pointer("task");
    await host.emit("session_start");
    const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
    const policy = await host.emit("context", { messages: [] });
    const widgetLines = () => {
      const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
      if (typeof factory !== "function") throw new Error("Widget missing");
      return factory({ terminal: { rows: 24 } } as TUI, theme).render(80);
    };
    expect(widgetLines()).toHaveLength(2);
    host.custom.mockImplementationOnce(async (factory) => {
      expect(widgetLines()).toHaveLength(2);
      await host.emit("model_select");
      expect(widgetLines()).toHaveLength(2);
      const terminal = { rows: 24 };
      const done = vi.fn();
      const component = factory(
        { terminal, requestRender: vi.fn() },
        theme,
        {},
        done,
      );
      component.render(80);
      for (let index = 0; index < 6; index++) component.handleInput("\u001b[B");
      for (const rows of [16, 24, 40, 16]) {
        terminal.rows = rows;
        component.invalidate();
        const lines = component.render(40);
        expect(lines.length + widgetLines().length + 3).toBeLessThanOrEqual(
          rows,
        );
        expect(lines.find((line: string) => line.startsWith("→"))).toContain(
          "Refresh",
        );
      }
      component.handleInput("\r");
      expect(done).toHaveBeenCalledWith("refresh");
      component.handleInput("\u001b");
      expect(done).toHaveBeenCalledWith(undefined);
      return undefined;
    });
    await host.command("");
    expect(widgetLines()).toHaveLength(2);
    host.custom.mockRejectedValueOnce(new Error("Dialog failed"));
    await host.command("model");
    expect(widgetLines()).toHaveLength(2);
    expect(host.ctx.ui.setFooter).not.toHaveBeenCalled();
    expect(host.ctx.ui.setEditorComponent).not.toHaveBeenCalled();
    expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
      before,
    );
    expect(await host.emit("context", { messages: [] })).toEqual(policy);
    await host.emit("session_shutdown");
  });
  it.each(["model", "thinking"])(
    "condenses direct %s controls including registry refresh and dependent thinking selection",
    async (command) => {
      const host = harness();
      host.task();
      host.pointer("task");
      await host.emit("session_start");
      const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
      const widgetLines = () => {
        const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
        if (typeof factory !== "function") throw new Error("Widget missing");
        return factory({ terminal: { rows: 24 } } as TUI, theme).render(80);
      };
      for (const result of command === "model"
        ? ["refresh", "0", undefined]
        : [undefined]) {
        host.custom.mockImplementationOnce(async () => {
          expect(widgetLines()).toHaveLength(2);
          return result;
        });
      }
      await host.command(command);
      expect(host.custom).toHaveBeenCalledTimes(command === "model" ? 3 : 1);
      expect(widgetLines()).toHaveLength(2);
      expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
        before,
      );
      await host.emit("session_shutdown");
    },
  );

  it.each(["cancel", "reject"])(
    "does not restore or notify an obsolete dialog after session replacement (%s)",
    async (outcome) => {
      const host = harness();
      host.task();
      host.pointer("task");
      await host.emit("session_start");
      const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
      let settle: (() => void) | undefined;
      host.custom.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            settle = () =>
              outcome === "cancel"
                ? resolve(undefined)
                : reject(new Error("obsolete dialog"));
          }),
      );
      const pending = host.command("thinking");
      await vi.waitFor(() => expect(settle).toBeDefined());
      await host.emit("session_shutdown");
      host.session("new-session");
      await host.emit("session_start");
      const installs = vi.mocked(host.ctx.ui.setWidget).mock.calls.length;
      const notices = host.calls.length;
      settle?.();
      await expect(pending).resolves.toBeUndefined();
      expect(host.ctx.ui.setWidget).toHaveBeenCalledTimes(installs);
      expect(host.calls).toHaveLength(notices);
      const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
      if (typeof factory !== "function") throw new Error("Widget missing");
      const rows = factory({ terminal: { rows: 24 } } as TUI, theme).render(80);
      expect(rows).toHaveLength(1);
      expect(rows.join()).not.toContain("Task:");
      expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
        before,
      );
      await host.emit("session_shutdown");
    },
  );

  it("contains notification and cleanup failures without leaving dialog condensation enabled", async () => {
    const host = harness();
    host.task();
    host.pointer("task");
    await host.emit("session_start");
    const before = readFileSync(join(host.agentDir, "waypoint.json"), "utf8");
    const policy = await host.emit("context", { messages: [] });
    host.custom.mockImplementationOnce(async () => {
      vi.mocked(host.ctx.ui.notify).mockImplementation(() => {
        throw new Error("notify failed");
      });
      vi.mocked(host.ctx.ui.setWidget).mockImplementation(() => {
        throw new Error("cleanup failed");
      });
      throw new Error("dialog failed");
    });
    await expect(host.command("model")).resolves.toBeUndefined();
    await expect(host.command("status")).resolves.toBeUndefined();
    vi.mocked(host.ctx.ui.setWidget).mockReset();
    await host.emit("model_select");
    const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
    if (typeof factory !== "function") throw new Error("Widget missing");
    expect(
      factory({ terminal: { rows: 24 } } as TUI, theme).render(80),
    ).toHaveLength(2);
    expect(readFileSync(join(host.agentDir, "waypoint.json"), "utf8")).toBe(
      before,
    );
    expect(await host.emit("context", { messages: [] })).toEqual(policy);
    vi.mocked(host.ctx.ui.setWidget).mockImplementation(() => {
      throw new Error("remove failed");
    });
    await expect(host.emit("session_shutdown")).resolves.toBeUndefined();
  });

  it("cycles one transient task-view preference across task changes, dialogs and resize without persistent side effects", async () => {
    const host = harness();
    const parent = host.task("parent", { children: ["child", "sibling"] });
    const child = host.task("child", { parent: "parent" });
    host.task("sibling", { parent: "parent" });
    host.pointer("parent");
    await host.emit("session_start");
    const files = [
      join(host.agentDir, "waypoint.json"),
      join(parent, "task.json"),
      join(child, "task.json"),
    ];
    const before = files.map((file) => readFileSync(file, "utf8"));
    const policy = await host.emit("context", { messages: [] });
    const render = (rows = 24) => {
      const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
      if (typeof factory !== "function") throw new Error("Widget missing");
      return factory({ terminal: { rows } } as TUI, theme).render(80);
    };
    const toggle = () => host.shortcuts.get("alt+w")?.handler(host.ctx);
    expect([...host.shortcuts.keys()]).toEqual(["alt+w", "alt+t"]);
    expect(render()).toHaveLength(4);
    toggle();
    expect(render()).toHaveLength(2);
    host.pointer("child");
    await host.command("status");
    expect(render()).toHaveLength(2);
    expect(render()[0]).toContain("parent / child");
    toggle();
    expect(render()).toHaveLength(4);
    expect(render().join()).toContain("> |- child");
    expect(render(16)).toHaveLength(2);
    expect(render()).toHaveLength(4);
    await host.emit("ui_prompt_start");
    expect(render()).toHaveLength(2);
    await host.emit("ui_prompt_end");
    expect(render()).toHaveLength(4);
    host.custom
      .mockImplementationOnce(async (factory) => {
        expect(render()).toHaveLength(2);
        const component = factory(
          { terminal: { rows: 40 }, requestRender: vi.fn() },
          theme,
          {},
          vi.fn(),
        );
        expect(component.render(80).join()).toContain("Full -> Focused");
        return "toggle";
      })
      .mockResolvedValueOnce("close");
    await host.command("");
    expect(render()).toHaveLength(4);
    host.custom.mockImplementationOnce(async () => {
      expect(render()).toHaveLength(2);
      return undefined;
    });
    await host.command("thinking");
    expect(render()).toHaveLength(4);
    await host.emit("session_tree");
    expect(render()).toHaveLength(4);
    toggle();
    await host.emit("session_start", { reason: "reload" });
    expect(render()).toHaveLength(4);
    expect(host.branch).toEqual([]);
    expect(files.map((file) => readFileSync(file, "utf8"))).toEqual(before);
    expect(await host.emit("context", { messages: [] })).toEqual(policy);
    expect(host.ctx.ui.setFooter).not.toHaveBeenCalled();
    expect(host.ctx.ui.setEditorComponent).not.toHaveBeenCalled();
    await host.emit("session_shutdown");
  });

  it("opens the complete task tree directly and gives its focused component local shortcuts", async () => {
    const host = harness();
    const parent = host.task("parent", {
      children: ["child", "sibling", "old"],
    });
    const child = host.task("child", { parent: "parent" });
    host.task("sibling", { parent: "parent" });
    host.task("old", { parent: "parent", status: "completed" });
    host.pointer("child");
    await host.emit("session_start");
    const files = [
      join(host.agentDir, "waypoint.json"),
      join(parent, "task.json"),
      join(child, "task.json"),
    ];
    const before = files.map((file) => readFileSync(file, "utf8"));
    const render = () => {
      const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
      if (typeof factory !== "function") throw new Error("Widget missing");
      return factory({ terminal: { rows: 24 } } as TUI, theme).render(80);
    };
    expect(render().length).toBeGreaterThan(2);
    host.custom.mockImplementationOnce(async (factory) => {
      expect(render()).toHaveLength(2);
      const done = vi.fn();
      const component = factory(
        { terminal: { rows: 24 }, requestRender: vi.fn() },
        theme,
        {},
        done,
      );
      const screen = component.render(80).join("\n");
      expect(screen).toContain("Trellis Task Tree");
      expect(screen).toContain("Root");
      expect(screen).toContain("> |- Child");
      expect(screen).toContain("`- Sibling");
      expect(screen).toContain("Alt+C show completed (1)");
      expect(screen).toContain("Enter/Alt+D details");
      component.handleInput("\u001bd");
      expect(done).toHaveBeenCalledWith(`details:${child}`);
      return undefined;
    });
    await host.shortcuts.get("alt+t")?.handler(host.ctx);
    expect(host.custom).toHaveBeenCalled();
    expect(render().length).toBeGreaterThan(2);
    expect(files.map((file) => readFileSync(file, "utf8"))).toEqual(before);
    expect(host.branch).toEqual([]);
    await host.emit("session_shutdown");
  });

  it("ignores late prompt notifications after shutdown instead of restarting task observation", async () => {
    const host = harness();
    host.task("parent", { children: ["child"] });
    host.task("child", { parent: "parent" });
    host.pointer("child");
    await host.emit("session_start");
    await host.emit("ui_prompt_start");
    await host.emit("session_shutdown");
    const installs = vi.mocked(host.ctx.ui.setWidget).mock.calls.length;
    await host.emit("ui_prompt_end");
    await host.emit("ui_prompt_start");
    expect(host.ctx.ui.setWidget).toHaveBeenCalledTimes(installs);
    const stale = {
      ...host.ctx,
      sessionManager: {
        ...host.ctx.sessionManager,
        getSessionId: () => "session",
      },
    } as ExtensionContext;
    host.session("replacement");
    host.pointer("child", "replacement");
    await host.emit("session_start");
    await host.emit("ui_prompt_start");
    const freshInstalls = vi.mocked(host.ctx.ui.setWidget).mock.calls.length;
    await host.handlers.get("ui_prompt_end")?.({}, stale);
    expect(host.ctx.ui.setWidget).toHaveBeenCalledTimes(freshInstalls);
    await host.emit("session_shutdown");
  });

  it.each(["none", "single", "closed relatives"])(
    "makes the shortcut harmless and hides its panel action for %s",
    async (kind) => {
      const host = harness();
      if (kind !== "none") {
        host.task("task", {
          children: kind === "closed relatives" ? ["old"] : [],
        });
        host.task("old", { parent: "task", status: "completed" });
        host.pointer("task");
      }
      await host.emit("session_start");
      const count = vi.mocked(host.ctx.ui.setWidget).mock.calls.length;
      host.shortcuts.get("alt+w")?.handler(host.ctx);
      expect(host.ctx.ui.setWidget).toHaveBeenCalledTimes(count);
      host.custom.mockImplementationOnce(async (factory) => {
        const component = factory(
          { terminal: { rows: 40 }, requestRender: vi.fn() },
          theme,
          {},
          vi.fn(),
        );
        expect(component.render(80).join()).not.toContain("Task View");
        return undefined;
      });
      await host.command("");
      expect(host.branch).toEqual([]);
      await host.emit("session_shutdown");
    },
  );

  it("isolates shortcut failures and resets preference on project/session replacement", async () => {
    const host = harness();
    host.task("parent", { children: ["child"] });
    host.task("child", { parent: "parent" });
    host.pointer("child");
    await host.emit("session_start");
    host.shortcuts.get("alt+w")?.handler(host.ctx);
    host.session("replacement");
    host.pointer("child", "replacement");
    await host.emit("model_select");
    const factory = vi.mocked(host.ctx.ui.setWidget).mock.calls.at(-1)?.[1];
    if (typeof factory !== "function") throw new Error("Widget missing");
    expect(
      factory({ terminal: { rows: 24 } } as TUI, theme).render(80),
    ).toHaveLength(3);
    vi.mocked(host.ctx.ui.setWidget).mockImplementationOnce(() => {
      throw new Error("render failed");
    });
    vi.mocked(host.ctx.ui.notify).mockImplementationOnce(() => {
      throw new Error("notify failed");
    });
    expect(() => host.shortcuts.get("alt+w")?.handler(host.ctx)).not.toThrow();
    await host.emit("session_shutdown");
  });

  it("never opens custom UI in RPC or headless mode", async () => {
    for (const mode of ["rpc", "print"] as const) {
      const host = harness(mode);
      const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
      await host.emit("session_start");
      await host.command("");
      await host.command("thinking");
      await host.command("status");
      host.shortcuts.get("alt+w")?.handler(host.ctx);
      await host.shortcuts.get("alt+t")?.handler(host.ctx);
      expect(host.custom).not.toHaveBeenCalled();
      expect(host.ctx.ui.setWidget).not.toHaveBeenCalled();
      await host.emit("session_shutdown");
      stderr.mockRestore();
    }
  });
});

describe("native terminal rendering", () => {
  const state: ViewState = {
    mode: "off",
    current: `provider/${"current".repeat(30)}`,
    config: parseConfig({
      strongModel: { provider: "custom".repeat(30), id: "model" },
      strongThinking: "max",
    }),
    tasks: { nodes: new Map(), diagnostics: [] },
    diagnostics: ["A long compatibility diagnostic ".repeat(10)],
    guidance: false,
    routing: "off",
  };
  it.each([40, 80, 120])(
    "fits width %i including CJK and long identities",
    (width) => {
      const task = {
        path: "/task",
        ref: "task",
        title: "中文任务名称".repeat(30),
        status: "in_progress",
        archived: false,
        children: [],
        diagnostics: [],
      };
      const populated = {
        ...state,
        tasks: {
          active: task.path,
          nodes: new Map([[task.path, task]]),
          diagnostics: [],
        },
      };
      expect(compactLines(populated, width)).toHaveLength(2);
      expect(compactLines(populated, width, undefined, 16)).toHaveLength(2);
      expect(compactLines(state, width)).toHaveLength(1);
      for (const line of [
        ...compactLines(populated, width),
        ...renderStatus(populated, width),
      ])
        expect(visibleWidth(line)).toBeLessThanOrEqual(width);
    },
  );
  it.each(
    [40, 80, 120].flatMap((width) => [16, 24].map((rows) => ({ width, rows }))),
  )(
    "keeps root values and every action reachable at $width columns / $rows rows",
    async ({ width, rows }) => {
      const host = harness();
      const task = {
        path: "/task",
        ref: "task",
        title: "中文任务".repeat(50),
        status: "in_progress",
        archived: false,
        children: [],
        diagnostics: [],
      };
      const live: ViewState = {
        ...state,
        tasks: {
          active: task.path,
          nodes: new Map([[task.path, task]]),
          diagnostics: [],
        },
      };
      host.custom.mockImplementationOnce(async (factory) => {
        const done = vi.fn();
        const component = factory(
          { requestRender: vi.fn(), terminal: { rows } },
          theme,
          {},
          done,
        );
        const initial = component.render(width);
        expect(initial.length).toBeLessThanOrEqual(rows - 5);
        expect(initial.join("\n")).toContain("中文任务");
        expect(initial.join("\n")).not.toContain("Processing");
        expect(initial.join("\n")).not.toContain("Implement running");
        expect(initial.join("\n")).not.toContain("compatibility diagnostic");
        expect(initial.join("\n")).not.toContain("final scope");
        expect(initial.join("\n")).toContain("Mode");
        expect(initial.join("\n")).toContain("Strong Thinking");
        const reachable = new Set<string>();
        for (let index = 0; index < 8; index++) {
          const lines = component.render(width);
          for (const line of lines)
            expect(visibleWidth(line)).toBeLessThanOrEqual(width);
          expect(lines.length).toBeLessThanOrEqual(rows - 5);
          reachable.add(
            stripVTControlCharacters(
              lines.find((line: string) => line.startsWith("→")) ?? "",
            ),
          );
          component.handleInput("\r");
          component.handleInput("\u001b[B");
        }
        expect(reachable.size).toBe(8);
        expect(done.mock.calls.map(([value]) => value)).toEqual([
          "mode",
          "model",
          "thinking",
          "task",
          "details",
          "diagnostics",
          "refresh",
          "close",
        ]);
        return undefined;
      });
      await openPanel(host.ctx, () => live);
    },
  );
  it("uses semantic ANSI colors after sanitizing names and refreshes open controls on invalidation", async () => {
    const host = harness();
    let accent = 36;
    const colors: Record<string, number> = {
      muted: 90,
      text: 37,
      success: 32,
      warning: 33,
      error: 31,
      dim: 90,
    };
    const fg = vi.fn(
      (color: string, text: string) =>
        `\u001b[${color === "accent" ? accent : colors[color]}m${text}\u001b[39m`,
    );
    const colored = { ...theme, fg } as unknown as Theme;
    let live: ViewState = {
      ...state,
      mode: "auto",
      routing: "bypassed",
      current: "custom/中文\u001b[2Jmodel",
      diagnostics: [],
    };
    const widget = compactLines(live, 120, colored).join();
    expect(widget).toContain("\u001b[36m@");
    expect(widget).toContain("\u001b[90mbypassed");
    expect(widget).toContain("\u001b[37mcustom/中文");
    expect(widget).not.toContain("\u001b[2J");
    expect(
      fg.mock.calls.some(([color]) => color === "warning" || color === "error"),
    ).toBe(false);
    const task = {
      path: "/task",
      ref: "task",
      title: "Task",
      status: "in_progress",
      archived: false,
      children: [],
      diagnostics: [],
    };
    expect(
      compactLines(
        {
          ...live,
          tasks: {
            active: task.path,
            nodes: new Map([[task.path, task]]),
            diagnostics: [],
          },
        },
        80,
        colored,
      )[0],
    ).toContain("\u001b[36mTask");
    const inputInvalidation = vi.spyOn(Input.prototype, "invalidate");
    const listInvalidation = vi.spyOn(SelectList.prototype, "invalidate");
    host.custom.mockImplementationOnce(async (factory) => {
      const component = factory(
        { requestRender: vi.fn(), terminal: { rows: 24 } },
        colored,
        {},
        vi.fn(),
      );
      const before = component.render(80).join();
      expect(before).toContain("bypassed (same model)");
      live = {
        ...live,
        mode: "on",
        routing: "enabled",
        current: "fresh/model",
      };
      accent = 35;
      component.invalidate();
      const after = component.render(80).join();
      expect(after).toContain("\u001b[35mWaypoint");
      expect(after).toContain("fresh/model");
      expect(after).toContain("on (session)");
      expect(after).not.toContain("bypassed");
      expect(inputInvalidation).toHaveBeenCalled();
      expect(listInvalidation).toHaveBeenCalled();
      for (const width of [40, 80, 120]) {
        for (const line of component.render(width))
          expect(visibleWidth(line)).toBeLessThanOrEqual(width);
      }
      return undefined;
    });
    await openPanel(host.ctx, () => live);
    inputInvalidation.mockRestore();
    listInvalidation.mockRestore();
  });
  it.each([16, 24])(
    "scrolls complete secondary evidence at %i rows and returns with Escape",
    async (rows) => {
      const host = harness();
      for (const view of ["details", "diagnostics"] as const) {
        host.custom.mockImplementationOnce(async (factory) => {
          const done = vi.fn();
          const terminal = { rows };
          const component = factory(
            { requestRender: vi.fn(), terminal },
            theme,
            {},
            done,
          );
          const seen = new Set<string>();
          for (let page = 0; page < 30; page++) {
            const lines = component.render(40);
            expect(lines.length).toBeLessThanOrEqual(rows - 5);
            for (const line of lines) {
              expect(visibleWidth(line)).toBeLessThanOrEqual(40);
              seen.add(line);
            }
            component.handleInput("\u001b[6~");
          }
          expect([...seen].join(" ")).toContain("compatibility");
          expect([...seen].join(" ")).toContain("diagnostic");
          expect([...seen].join()).toContain("Back");
          if (view === "details")
            expect([...seen].join()).toContain("Strong Thinking: max");
          terminal.rows = 16;
          expect(component.render(40).length).toBeLessThanOrEqual(11);
          component.handleInput("\u001b");
          expect(done).toHaveBeenCalledWith(undefined);
          return undefined;
        });
        await showDetails(host.ctx, () => state, view);
      }
    },
  );
  it("browses native task status and relationships without duplicate execution history", async () => {
    const host = harness();
    const parent = {
      path: "/task",
      ref: "task",
      title: "Parent",
      status: "in_progress",
      archived: false,
      children: ["/child"],
      diagnostics: [],
    };
    const child = {
      ...parent,
      path: "/child",
      ref: "archive/child",
      title: "Child",
      status: "completed",
      archived: true,
      children: [],
      parent: parent.path,
    };
    const live = {
      ...state,
      tasks: {
        active: parent.path,
        nodes: new Map([
          [parent.path, parent],
          [child.path, child],
        ]),
        diagnostics: [],
      },
    };
    const screens: string[] = [];
    for (const value of [
      "details:/task",
      undefined,
      "toggle-completed",
      child.path,
      "details:/child",
      undefined,
      undefined,
    ]) {
      host.custom.mockImplementationOnce(async (factory) => {
        const component = factory(
          { requestRender: vi.fn(), terminal: { rows: 40 } },
          theme,
          {},
          vi.fn(),
        );
        screens.push(component.render(120).join("\n"));
        return value;
      });
    }
    await browseTasks(
      host.ctx,
      () => live,
      () => true,
    );
    expect(screens[0]).toContain("Trellis Task Tree");
    expect(screens[0]).toContain("Alt+C show completed");
    expect(screens[1]).toContain("Task status: in_progress");
    expect(screens[1]).toContain("Task: task");
    expect(screens[1]).toContain("Children: /child");
    expect(screens.join()).not.toMatch(
      /Requested:|native model=|reported-model|requested\/model|thinking=|effective identity|Plan:|Implement:|Verify:|Finish:|final scope|pass complete|Activity:/,
    );
    expect(screens[2]).toContain("Alt+C show completed");
    expect(screens[2]).not.toContain("Child");
    expect(screens[3]).toContain("Alt+C hide completed");
    expect(screens[3]).toContain("Child");
    expect(screens[4]).toContain("→");
    expect(screens[4]).toContain("Child");
    expect(screens[5]).toContain("Archive: archive/child");
    expect(screens[5]).toContain("Task status: completed");
    expect(screens[5]).toContain("Parent: /task");
    expect(screens[6]).toContain("Child");
  });
  it("keeps tree navigation local and read-only while moving to parents, children and details", async () => {
    const host = harness();
    const root: TaskNode = {
      path: "/root",
      ref: "root",
      title: "Root",
      status: "in_progress",
      archived: false,
      children: ["/child", "/sibling"],
      diagnostics: [],
    };
    const child: TaskNode = {
      ...root,
      path: "/child",
      ref: "child",
      title: "Child",
      parent: root.path,
      children: ["/grandchild"],
    };
    const grandchild: TaskNode = {
      ...child,
      path: "/grandchild",
      ref: "grandchild",
      title: "Grandchild",
      parent: child.path,
      children: [],
    };
    const sibling: TaskNode = {
      ...root,
      path: "/sibling",
      ref: "sibling",
      title: "Sibling",
      parent: root.path,
      children: [],
    };
    const live: ViewState = {
      ...state,
      tasks: {
        active: child.path,
        familyRoot: root.path,
        nodes: new Map(
          [root, child, grandchild, sibling].map((node) => [
            node.path,
            node,
          ]),
        ),
        diagnostics: [],
      },
    };
    const before = JSON.stringify({ active: live.tasks.active, nodes: [...live.tasks.nodes] });
    const screens: string[] = [];
    host.custom.mockImplementationOnce(async (factory) => {
      const done = vi.fn();
      const component = factory(
        { requestRender: vi.fn(), terminal: { rows: 40 } },
        theme,
        {},
        done,
      );
      screens.push(component.render(40).join("\n"));
      component.handleInput("\u001b[B");
      screens.push(component.render(40).join("\n"));
      expect(screens.at(-1)).toContain("→   |  `- Grandchild");
      component.handleInput("\u001b[D");
      expect(component.render(40).join("\n")).toContain(
        "→   |  `- Grandchild",
      );
      component.handleInput("\u001b[C");
      expect(component.render(40).join("\n")).toContain(
        "→   |  `- Grandchild",
      );
      component.handleInput("\u001bd");
      expect(done).toHaveBeenCalledWith("details:/grandchild");
      return "details:/grandchild";
    });
    host.custom.mockImplementationOnce(async (factory) => {
      const component = factory(
        { requestRender: vi.fn(), terminal: { rows: 40 } },
        theme,
        {},
        vi.fn(),
      );
      const screen = component.render(40).join("\n");
      expect(screen).toContain("Task status: in_progress");
      expect(screen).toContain("Task: grandchild");
      return undefined;
    });
    host.custom.mockImplementationOnce(async (factory) => {
      const done = vi.fn();
      const component = factory(
        { requestRender: vi.fn(), terminal: { rows: 40 } },
        theme,
        {},
        done,
      );
      expect(component.render(40).join("\n")).toContain(
        "→   |  `- Grandchild",
      );
      component.handleInput("\u001b");
      expect(done).toHaveBeenCalledWith(undefined);
      return undefined;
    });
    await browseTasks(host.ctx, () => live, () => true, child.path);
    expect(screens[0]).toContain("Trellis Task Tree");
    expect(screens[0]).toContain("Root");
    expect(screens[0]).toContain("Sibling");
    expect(JSON.stringify({ active: live.tasks.active, nodes: [...live.tasks.nodes] })).toBe(before);
    expect(host.branch).toEqual([]);
  });

  it("opens an initially selected closed palette task with completed context enabled", async () => {
    const host = harness();
    const parent: TaskNode = {
      path: "/parent",
      ref: "parent",
      title: "Parent",
      status: "in_progress",
      archived: false,
      children: ["/old"],
      diagnostics: [],
    };
    const old: TaskNode = {
      ...parent,
      path: "/old",
      ref: "old",
      title: "Old family record",
      status: "completed",
      parent: parent.path,
      children: [],
    };
    const live: ViewState = {
      ...state,
      tasks: {
        active: parent.path,
        familyRoot: parent.path,
        nodes: new Map([
          [parent.path, parent],
          [old.path, old],
        ]),
        diagnostics: [],
      },
    };
    host.custom.mockImplementationOnce(async (factory) => {
      const component = factory(
        { terminal: { rows: 24 }, requestRender: vi.fn() },
        theme,
        {},
        vi.fn(),
      );
      const screen = component.render(80).join("\n");
      expect(screen).toContain("Old family record");
      expect(screen).toContain("→");
      expect(screen).toContain("Alt+C hide completed (1)");
      return undefined;
    });
    await browseTasks(
      host.ctx,
      () => live,
      () => true,
      old.path,
    );
  });

  it("keeps the root panel limited to native task status", async () => {
    const host = harness();
    const task = {
      path: "/task",
      ref: "task",
      title: "Task",
      status: "review",
      archived: false,
      children: [],
      diagnostics: [],
    };
    const live: ViewState = {
      ...state,
      tasks: {
        active: task.path,
        nodes: new Map([[task.path, task]]),
        diagnostics: [],
      },
    };
    for (const rows of [16, 24]) {
      host.custom.mockImplementationOnce(async (factory) => {
        const component = factory(
          { terminal: { rows }, requestRender: vi.fn() },
          theme,
          {},
          vi.fn(),
        );
        for (const width of [40, 80, 120]) {
          const lines = component.render(width);
          const screen = lines.join("\n");
          expect(screen).toContain("Task");
          expect(screen).not.toMatch(
            /Activity:|Plan:|Implement:|Verify:|Finish:|pass complete|final scope|requested model|reported model|trellis-(research|implement|check)/,
          );
          expect(lines.length).toBeLessThanOrEqual(rows - 5);
          expect(
            lines.every((line: string) => visibleWidth(line) <= width),
          ).toBe(true);
        }
        return undefined;
      });
      await openPanel(host.ctx, () => live);
    }
  });

  it.each([
    "planning",
    "in_progress",
    "review",
    "completed",
    "",
    "running",
    "custom-status",
  ])(
    "retains raw native %s in details without compact suffixes",
    async (status) => {
      const host = harness();
      const task: TaskNode = {
        path: "/task",
        ref: "task",
        title: "Task",
        status,
        archived: false,
        children: [],
        diagnostics: [],
      };
      const live: ViewState = {
        ...state,
        tasks: {
          active: task.path,
          nodes: new Map([[task.path, task]]),
          diagnostics: [],
        },
      };
      for (const view of ["panel", "browser", "details"]) {
        const screens: string[] = [];
        const selections =
          view === "browser" ? ["evidence", undefined, undefined] : [undefined];
        for (const selected of selections)
          host.custom.mockImplementationOnce(async (factory) => {
            const component = factory(
              { terminal: { rows: 40 }, requestRender: vi.fn() },
              theme,
              {},
              vi.fn(),
            );
            for (const width of [40, 80, 120]) {
              const lines = component.render(width);
              expect(
                lines.every((line: string) => visibleWidth(line) <= width),
              ).toBe(true);
              screens.push(lines.join("\n"));
            }
            return selected;
          });
        if (view === "panel") await openPanel(host.ctx, () => live);
        else if (view === "browser")
          await browseTasks(
            host.ctx,
            () => live,
            () => true,
          );
        else await showDetails(host.ctx, () => live, "details");
        const text = screens.join("\n");
        if (view !== "details")
          expect(text).toMatch(/^(?:> +Task|→ > Task)$/m);
        if (view !== "panel")
          expect(text).toContain(`Task status: ${status || "(missing)"}`);
        expect(text).not.toMatch(
          /Task \||\(Processing\)|\(Unknown\)|Archive:|Archive location:/,
        );
        expect(text).not.toMatch(
          /Activity:|Plan:|Implement:|Verify:|Finish:|pass complete|final scope|reported-model|Requested:|trellis-(research|implement|check)/,
        );
      }
    },
  );

  it("scopes the browser to native task records and retains raw read diagnostics", async () => {
    const host = harness();
    const parent: TaskNode = {
      path: "/parent",
      ref: "parent",
      title: "Parent",
      status: "planning",
      archived: false,
      children: ["/child"],
      diagnostics: [],
    };
    const child = {
      ...parent,
      path: "/child",
      ref: "child",
      title: "Child",
      status: "custom\u001b[2J\nstatus",
      parent: parent.path,
      children: [],
      diagnostics: ["Child read diagnostic"],
    };
    const live: ViewState = {
      ...state,
      tasks: {
        active: parent.path,
        familyRoot: parent.path,
        nodes: new Map([
          [parent.path, parent],
          [child.path, child],
        ]),
        diagnostics: ["Family read bound reached"],
      },
    };
    const screens: string[] = [];
    for (const selected of [child.path, "evidence", undefined, undefined]) {
      host.custom.mockImplementationOnce(async (factory) => {
        const component = factory(
          { terminal: { rows: 40 }, requestRender: vi.fn() },
          theme,
          {},
          vi.fn(),
        );
        screens.push(component.render(120).join("\n"));
        return selected;
      });
    }
    await browseTasks(
      host.ctx,
      () => live,
      () => true,
    );
    expect(screens[0]).toContain("Parent");
    expect(screens[1]).toContain("Child");
    expect(screens[2]).toContain("Task status: custom [2J status");
    expect(screens[2]).toContain("Child read diagnostic");
    expect(screens[2]).toContain("Family read bound reached");
    expect(screens[2]).toContain("Parent: /parent");
    expect(screens.join()).not.toContain("Show completed");
    expect(screens.join()).not.toContain("\u001b");
    expect(screens.join()).not.toMatch(
      /Activity:|Plan:|Implement:|Verify:|Finish:|Requested:|run-0|thinking=|trellis-(research|implement|check)/,
    );
  });

  it("resets Show completed on browser exit and does not expose unrelated records", async () => {
    const host = harness();
    const parent = {
      path: "/parent",
      ref: "parent",
      title: "Parent",
      status: "in_progress",
      archived: false,
      children: ["/old"],
      diagnostics: [],
    };
    const old = {
      ...parent,
      path: "/old",
      ref: "old",
      title: "Old family record",
      status: "completed",
      parent: parent.path,
      children: [],
    };
    const unrelated = { ...old, path: "/other", title: "Unrelated history" };
    const live: ViewState = {
      ...state,
      tasks: {
        active: parent.path,
        familyRoot: parent.path,
        nodes: new Map(
          [parent, old, unrelated].map((node) => [node.path, node]),
        ),
        diagnostics: [],
      },
    };
    const screens: string[] = [];
    for (const value of ["completed", undefined, undefined])
      host.custom.mockImplementationOnce(async (factory) => {
        const component = factory(
          { terminal: { rows: 40 }, requestRender: vi.fn() },
          theme,
          {},
          vi.fn(),
        );
        screens.push(component.render(120).join("\n"));
        return value;
      });
    await browseTasks(
      host.ctx,
      () => live,
      () => true,
    );
    await browseTasks(
      host.ctx,
      () => live,
      () => true,
    );
    expect(screens[0]).toContain("Alt+C show completed");
    expect(screens[0]).not.toContain("Old family record");
    expect(screens[1]).toContain("Alt+C hide completed");
    expect(screens[1]).toContain("Old family record");
    expect(screens[2]).toContain("Alt+C show completed");
    expect(screens[2]).not.toContain("Old family record");
    expect(screens.join()).not.toContain("Unrelated history");
    expect(host.branch).toEqual([]);
  });

  it.each([
    ["planning", false, "muted", false, false],
    ["in_progress", false, "text", false, false],
    ["completed", false, "muted", false, true],
    ["in_progress", true, "muted", false, true],
    ["review", false, "warning", false, false],
    ["", false, "warning", false, false],
  ] as const)(
    "styles selected browser titles from %s (archived=%s), not list focus",
    async (status, archived, color, bold, struck) => {
      const host = harness();
      const child: TaskNode = {
        path: "/child",
        ref: "child",
        title: "Child",
        status,
        archived,
        parent: "/parent",
        children: [],
        diagnostics: [],
      };
      const parent: TaskNode = {
        ...child,
        path: "/parent",
        ref: "parent",
        title: "Parent",
        status: "planning",
        archived: false,
        parent: undefined,
        children: [child.path],
      };
      const live: ViewState = {
        ...state,
        tasks: {
          active: parent.path,
          familyRoot: parent.path,
          nodes: new Map([
            [parent.path, parent],
            [child.path, child],
          ]),
          diagnostics: [],
        },
      };
      const colors: Record<string, number> = {
        text: 37,
        muted: 90,
        accent: 36,
        warning: 33,
      };
      const colored = {
        fg: (role: string, text: string) =>
          `\u001b[${colors[role] ?? 37}m${text}\u001b[39m`,
        bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
        strikethrough: (text: string) => `\u001b[9m${text}\u001b[29m`,
      } as Theme;
      host.custom.mockImplementationOnce(async (factory) => {
        const done = vi.fn();
        const component = factory(
          { terminal: { rows: 40 }, requestRender: vi.fn() },
          colored,
          {},
          done,
        );
        for (const width of [40, 80, 120]) {
          const lines: string[] = component.render(width);
          const selected =
            lines.find((line) =>
              stripVTControlCharacters(line).startsWith("→ "),
            ) ?? "";
          expect(stripVTControlCharacters(selected)).toBe("→   `- Child");
          expect(selected).toContain(`\u001b[${colors[color]}mChild`);
          expect(selected.includes("\u001b[1m")).toBe(bold);
          expect(selected.includes("\u001b[9m")).toBe(struck);
          expect(lines.every((line) => visibleWidth(line) <= width)).toBe(true);
          expect(lines.map(stripVTControlCharacters).join()).not.toMatch(
            /Planning|Processing|Review|Completed|Unknown| \| /,
          );
        }
        child.status = "in_progress";
        child.archived = false;
        component.invalidate();
        expect(component.render(80).join()).toContain("\u001b[37mChild");
        expect(component.render(80).join()).not.toContain("\u001b[1m");
        component.handleInput("\r");
        expect(done).toHaveBeenCalledWith(`details:${child.path}`);
        return undefined;
      });
      await browseTasks(
        host.ctx,
        () => live,
        () => true,
        child.path,
      );
    },
  );

  it("does not show a stale task in an already open browser", async () => {
    const host = harness();
    const task = {
      path: "/task",
      ref: "task",
      title: "Task",
      status: "in_progress",
      archived: false,
      children: [],
      diagnostics: [],
    };
    let live: ViewState = {
      ...state,
      tasks: {
        active: task.path,
        nodes: new Map([[task.path, task]]),
        diagnostics: [],
      },
    };
    host.custom.mockImplementationOnce(async (factory) => {
      const component = factory(
        { requestRender: vi.fn(), terminal: { rows: 24 } },
        theme,
        {},
        vi.fn(),
      );
      expect(component.render(80).join()).toContain("Task");
      live = { ...state, tasks: { nodes: new Map(), diagnostics: [] } };
      expect(component.render(80).join()).toContain(
        "no longer in the current native view",
      );
      expect(component.render(80).join()).not.toContain("Implement:");
      expect(component.render(80).join()).not.toContain("Native details");
      return undefined;
    });
    await browseTasks(
      host.ctx,
      () => live,
      () => true,
    );
  });
  it("removes terminal controls in external names", () => {
    const text = plain("one\n\u001b[31m\u202etwo");
    for (const control of ["\n", "\u001b", "\u202e"])
      expect(text).not.toContain(control);
  });
  it("uses searchable native SelectList with keyboard selection, cancellation and invalidation", async () => {
    let component: Component | undefined;
    let finish: ((value: string | undefined) => void) | undefined;
    const ctx = {
      mode: "tui",
      ui: {
        custom: (
          factory: (
            tui: unknown,
            theme: Theme,
            keys: unknown,
            done: (value: string | undefined) => void,
          ) => Component,
        ) =>
          new Promise<string | undefined>((resolve) => {
            finish = resolve;
            component = factory(
              { requestRender: vi.fn(), terminal: { rows: 24 } },
              theme,
              {},
              resolve,
            );
          }),
      },
    } as unknown as ExtensionContext;
    const picked = select(
      ctx,
      "Strong",
      [
        { value: "one", label: "alpha" },
        { value: "two", label: "beta" },
      ],
      true,
    );
    for (const character of "beta") component?.handleInput?.(character);
    component?.invalidate();
    for (const line of component?.render(40) ?? [])
      expect(visibleWidth(line)).toBeLessThanOrEqual(40);
    component?.handleInput?.("\r");
    expect(await picked).toBe("two");
    const cancelled = select(
      ctx,
      "Strong",
      [{ value: "one", label: "alpha" }],
      true,
    );
    component?.handleInput?.("\u001b");
    expect(await cancelled).toBeUndefined();
    expect(finish).toBeDefined();
  });
});
