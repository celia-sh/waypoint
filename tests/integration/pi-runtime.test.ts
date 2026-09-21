import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";
import {
  createAssistantMessageEventStream,
  InMemoryCredentialStore,
  type AssistantMessage,
} from "@earendil-works/pi-ai";
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  InteractiveMode,
  CustomEditor,
  initTheme,
  getMarkdownTheme,
  type ExtensionUIContext,
  type Theme,
  type AgentSession,
} from "@earendil-works/pi-coding-agent";
import { type TUI, Container, type Component } from "@earendil-works/pi-tui";
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { project } from "../unit/fixtures.js";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const policyType = "waypoint-routing-policy";
const directories: string[] = [];
const sessions: AgentSession[] = [];

afterEach(async () => {
  for (const session of sessions.splice(0)) {
    await session.extensionRunner.emit({
      type: "session_shutdown",
      reason: "quit",
    });
    session.dispose();
  }
  vi.unstubAllEnvs();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function isolatedSession(waypoint = true, cwd = root) {
  vi.stubEnv("TRELLIS_SUBAGENT_CHILD", "0");
  const agentDir = await mkdtemp(join(tmpdir(), "waypoint-pi-integration-"));
  directories.push(agentDir);
  vi.stubEnv("PI_CODING_AGENT_DIR", agentDir);
  vi.stubEnv("TRELLIS_SUBAGENT_CHILD", "0");
  vi.stubEnv("PI_OFFLINE", "1");
  const config = {
    defaultMode: "auto",
    strongModel: { provider: "waypoint-fixture", id: "strong" },
    strongThinking: "high",
  };
  await writeFile(join(agentDir, "waypoint.json"), JSON.stringify(config));
  const modelRuntime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(),
    modelsPath: null,
    modelsStorePath: join(agentDir, "models-store.json"),
    refreshOnCreate: false,
  });
  modelRuntime.registerProvider("waypoint-fixture", {
    baseUrl: "http://127.0.0.1:1/no-network",
    api: "openai-responses",
    apiKey: "local-fixture-only",
    models: ["ordinary", "strong"].map((id) => ({
      id,
      name: id,
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 131072,
      maxTokens: 4096,
    })),
  });
  await modelRuntime.refresh({ allowNetwork: false });
  const settingsManager = SettingsManager.inMemory({
    compaction: { enabled: false },
    retry: { enabled: false },
  });
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager,
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    additionalExtensionPaths: [
      join(cwd, ".pi/extensions/trellis/index.ts"),
      ...(waypoint ? [join(root, "src/index.ts")] : []),
    ],
  });
  await loader.reload();
  expect(loader.getExtensions().errors).toEqual([]);
  expect(loader.getExtensions().extensions).toHaveLength(waypoint ? 2 : 1);
  const model = modelRuntime.getModel("waypoint-fixture", "ordinary");
  if (!model) throw new Error("Synthetic registry model missing");
  const { session } = await createAgentSession({
    cwd,
    agentDir,
    resourceLoader: loader,
    settingsManager,
    sessionManager: SessionManager.inMemory(cwd),
    modelRuntime,
    model,
    thinkingLevel: "high",
  });
  sessions.push(session);
  const errors: unknown[] = [];
  await session.bindExtensions({
    mode: "rpc",
    onError: (error) => errors.push(error),
  });
  return { session, agentDir, config, errors, settingsManager };
}

describe("Pi + native Trellis + Waypoint only", () => {
  it("loads real host extensions and refreshes policy across a tool loop without persistent copies", async () => {
    const { session, agentDir, config, errors } = await isolatedSession();
    expect(
      session.getAllTools().filter((tool) => tool.name === "trellis_subagent"),
    ).toHaveLength(1);
    expect(
      session
        .getAllTools()
        .some((tool) => /todo|waypoint|subagent_spawn/.test(tool.name)),
    ).toBe(false);
    const command = session.extensionRunner.getCommand("waypoint");
    expect(command).toBeDefined();
    expect(
      (await session.extensionRunner.emitContext([])).filter(
        (message) =>
          message.role === "custom" && message.customType === policyType,
      ),
    ).toHaveLength(1);
    const requests: string[] = [];
    let steps = 0;
    session.agent.state.tools = [
      ...session.agent.state.tools,
      {
        name: "fixture_step",
        label: "Local step",
        description: "No-network fixture",
        parameters: { type: "object", properties: {} },
        execute: async () => {
          steps++;
          if (steps === 1)
            await writeFile(
              join(agentDir, "waypoint.json"),
              JSON.stringify({ ...config, strongThinking: "medium" }),
            );
          if (steps === 2)
            await command?.handler(
              "off",
              session.extensionRunner.createCommandContext(),
            );
          if (steps === 3)
            await command?.handler(
              "on",
              session.extensionRunner.createCommandContext(),
            );
          return {
            content: [{ type: "text", text: "Local step complete" }],
            details: {},
          };
        },
      },
    ];
    session.agent.streamFunction = (_model, context) => {
      requests.push(JSON.stringify(context.messages));
      const call = requests.length;
      const message: AssistantMessage = {
        role: "assistant",
        api: "openai-responses",
        provider: "waypoint-fixture",
        model: "ordinary",
        timestamp: Date.now(),
        usage: {
          input: 1,
          output: 1,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 2,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        content:
          call < 4
            ? [
                {
                  type: "toolCall",
                  id: `fixture-${call}`,
                  name: "fixture_step",
                  arguments: {},
                },
              ]
            : [{ type: "text", text: "done" }],
        stopReason: call < 4 ? "toolUse" : "stop",
      };
      const stream = createAssistantMessageEventStream();
      queueMicrotask(() =>
        stream.push({
          type: "done",
          reason: message.stopReason as "toolUse" | "stop",
          message,
        }),
      );
      return stream;
    };
    // Go through the host agent loop, preserving the real context transformer and extension runner.
    await session.agent.prompt(
      "For this check use explicit-provider/user-choice; keep the preset unchanged.",
    );
    expect(steps).toBe(3);
    expect(requests).toHaveLength(4);
    expect(
      requests.map(
        (request) => request.split("Default Strong model:").length - 1,
      ),
    ).toEqual([1, 1, 0, 1]);
    for (const request of requests.filter((request) =>
      request.includes("Default Strong model:"),
    )) {
      expect(request.indexOf("Default Strong model:")).toBeLessThan(
        request.indexOf("For this check use explicit-provider/user-choice"),
      );
    }
    const rebuiltInput: AgentMessage[] = [
      {
        role: "custom",
        customType: "native",
        content: "Reconstructed context",
        display: false,
        timestamp: 1,
      },
      {
        role: "user",
        content: "Reconstructed user request",
        timestamp: 2,
      },
    ];
    const rebuilt = await session.extensionRunner.emitContext(rebuiltInput);
    const rebuiltPolicyIndex = rebuilt.findIndex(
      (message) =>
        message.role === "custom" && message.customType === policyType,
    );
    expect(rebuilt.filter((message) =>
      message.role === "custom" && message.customType === policyType,
    )).toHaveLength(1);
    expect(rebuiltPolicyIndex).toBe(1);
    expect(rebuilt[rebuiltPolicyIndex + 1]).toEqual(rebuiltInput[1]);
    expect(JSON.stringify(rebuilt)).toContain("thinking=medium");
    expect(requests[0]).toContain("thinking=high");
    expect(requests[1]).toContain("thinking=medium");
    expect(requests[1]).not.toContain("thinking=high");
    expect(
      requests.every((request) =>
        request.includes("explicit-provider/user-choice"),
      ),
    ).toBe(true);
    expect(JSON.stringify(session.sessionManager.getBranch())).not.toContain(
      policyType,
    );
    expect(JSON.stringify(session.agent.state.messages)).not.toContain(
      policyType,
    );
    expect(
      JSON.parse(await readFile(join(agentDir, "waypoint.json"), "utf8"))
        .defaultMode,
    ).toBe("auto");
    expect(errors).toEqual([]);
  });

  it("dispatches three-state Alt+W through Pi's real editor/shortcut path without changing the draft or making requests", async () => {
    const f = project();
    directories.push(f.root);
    const parent = f.task("parent", { children: ["child", "sibling"] });
    const child = f.task("child", { parent: "parent" });
    f.task("sibling", { parent: "parent" });
    const { session, settingsManager, agentDir, errors } =
      await isolatedSession(true, f.root);
    f.pointer("child", session.sessionManager.getSessionId());
    const files = [
      join(parent, "task.json"),
      join(child, "task.json"),
      join(agentDir, "waypoint.json"),
    ];
    const before = await Promise.all(
      files.map((file) => readFile(file, "utf8")),
    );
    const request = vi.fn(() => {
      throw new Error("No model request allowed");
    });
    session.agent.streamFunction = request;
    const terminal = { rows: 24, columns: 80 };
    const tui = { terminal, requestRender: vi.fn() } as unknown as TUI;
    const theme = {
      fg: (_color: string, text: string) => text,
      bold: (text: string) => text,
      strikethrough: (text: string) => text,
    } as Theme;
    let widget: Component | undefined;
    let paletteScreen = "";
    const custom = vi.fn(async (factory) => {
      expect(widget?.render(80)).toHaveLength(2);
      const done = vi.fn();
      const component = factory(tui, theme, {}, done);
      paletteScreen = component.render(80).join("\n");
      component.handleInput("\u001bd");
      expect(done).toHaveBeenCalledWith(`evidence:${child}`);
      return undefined;
    });
    const ui = {
      setWidget: (_key: string, factory: unknown) => {
        if (typeof factory === "function") widget = factory(tui, theme);
      },
      custom,
      notify: vi.fn(),
      setFooter: vi.fn(),
      setEditorComponent: vi.fn(),
    } as unknown as ExtensionUIContext;
    session.extensionRunner.setUIContext(ui, "tui");
    await session.extensionRunner.emit({
      type: "session_start",
      reason: "reload",
    });
    expect(widget?.render(80)).toHaveLength(4);
    // Pinned host internals are exercised in this fixture, not copied into product code.
    const keybindingsModule = await import(
      new URL(
        "../../node_modules/@earendil-works/pi-coding-agent/dist/core/keybindings.js",
        import.meta.url,
      ).href
    );
    const keybindings = new keybindingsModule.KeybindingsManager();
    const editor = new CustomEditor(
      tui,
      {
        borderColor: (s) => s,
        selectList: {
          selectedPrefix: (s) => s,
          selectedText: (s) => s,
          description: (s) => s,
          scrollInfo: (s) => s,
          noMatch: (s) => s,
        },
      },
      keybindings,
    );
    editor.setText("Unsent draft remains intact");
    const host = {
      keybindings,
      defaultEditor: editor,
      session,
      sessionManager: session.sessionManager,
      settingsManager,
      createExtensionUIContext: () => ui,
      showError: vi.fn(),
    };
    const prototype = InteractiveMode.prototype as unknown as {
      setupExtensionShortcuts: (runner: typeof session.extensionRunner) => void;
      handleHotkeysCommand: () => void;
    };
    prototype.setupExtensionShortcuts.call(host, session.extensionRunner);
    const shortcuts = session.extensionRunner.getShortcuts(
      keybindings.getEffectiveConfig(),
    );
    expect(shortcuts.get("alt+w")?.description).toBe(
      "Cycle Waypoint task view",
    );
    expect(shortcuts.get("alt+t")?.description).toBe(
      "Open Waypoint task browser",
    );
    expect(shortcuts.has("alt+o")).toBe(true);
    const history = JSON.stringify(session.sessionManager.getBranch());
    editor.handleInput("\u001bw");
    expect(widget?.render(80)).toHaveLength(2);
    expect(widget?.render(80)[0]).toContain("parent / child");
    editor.handleInput("\u001bw");
    expect(widget?.render(80)).toHaveLength(4);
    editor.handleInput("\u001bw");
    expect(widget?.render(80)).toHaveLength(4);
    terminal.rows = 16;
    expect(widget?.render(40)).toHaveLength(2);
    terminal.rows = 24;
    expect(widget?.render(80)).toHaveLength(4);
    initTheme("dark");
    const chatContainer = new Container();
    prototype.handleHotkeysCommand.call({
      ...host,
      chatContainer,
      ui: tui,
      getMarkdownThemeWithSettings: getMarkdownTheme,
      getEditorKeyDisplay: () => "fixture",
      getAppKeyDisplay: () => "fixture",
    });
    expect(chatContainer.render(120).join()).toContain(
      "Cycle Waypoint task view",
    );
    expect(chatContainer.render(120).join()).toContain(
      "Open Waypoint task browser",
    );
    editor.handleInput("\u001bt");
    await vi.waitFor(() => expect(custom).toHaveBeenCalledOnce());
    const plainPalette = stripVTControlCharacters(paletteScreen);
    expect(plainPalette).toContain("Trellis Task Tree");
    expect(plainPalette).toContain("↑/↓ move; Enter/Alt+D details; Esc close");
    expect(plainPalette).toContain("> |- child");
    expect(plainPalette).not.toContain("← parent");
    expect(plainPalette).not.toContain("→ child");
    await vi.waitFor(() => expect(widget?.render(80)).toHaveLength(4));
    expect(editor.getText()).toBe("Unsent draft remains intact");
    expect(request).not.toHaveBeenCalled();
    expect(ui.setFooter).not.toHaveBeenCalled();
    expect(ui.setEditorComponent).not.toHaveBeenCalled();
    expect(JSON.stringify(session.sessionManager.getBranch())).toBe(history);
    expect(
      await Promise.all(files.map((file) => readFile(file, "utf8"))),
    ).toEqual(before);
    expect(errors).toEqual([]);
    expect(host.showError).not.toHaveBeenCalled();
  });

  it("condenses for real Pi prompt notifications, coalesces overlaps and ignores late shutdown notifications", async () => {
    const f = project();
    directories.push(f.root);
    f.task("parent", { children: ["child", "sibling"] });
    f.task("child", { parent: "parent" });
    f.task("sibling", { parent: "parent" });
    const { session, errors } = await isolatedSession(true, f.root);
    f.pointer("child", session.sessionManager.getSessionId());
    const request = vi.fn(() => {
      throw new Error("No model request allowed");
    });
    session.agent.streamFunction = request;
    const tui = {
      terminal: { rows: 24 },
      requestRender: vi.fn(),
    } as unknown as TUI;
    const theme = {
      fg: (_color: string, text: string) => text,
      bold: (text: string) => text,
      strikethrough: (text: string) => text,
    } as Theme;
    let widget: Component | undefined;
    const finishes: (() => void)[] = [];
    const prompt = () =>
      new Promise<undefined>((resolve) =>
        finishes.push(() => resolve(undefined)),
      );
    const ui = {
      setWidget: vi.fn((_key: string, factory: unknown) => {
        widget =
          typeof factory === "function" ? factory(tui, theme) : undefined;
      }),
      select: prompt,
      input: prompt,
      custom: prompt,
      notify: vi.fn(),
    } as unknown as ExtensionUIContext;
    session.extensionRunner.setUIContext(ui, "tui");
    await session.extensionRunner.emit({
      type: "session_start",
      reason: "reload",
    });
    const context = session.extensionRunner.createContext();
    const first = context.ui.select("Outer prompt", ["one"]);
    const second = context.ui.input("Overlapping prompt");
    // The real runner schedules notifications in microtasks, not before UI opens.
    await vi.waitFor(() => expect(widget?.render(80)).toHaveLength(2));
    finishes.shift()?.();
    await first;
    expect(widget?.render(80)).toHaveLength(2);
    finishes.shift()?.();
    await second;
    await vi.waitFor(() => expect(widget?.render(80)).toHaveLength(4));
    const late = context.ui.select("Close during shutdown", ["one"]);
    await vi.waitFor(() => expect(widget?.render(80)).toHaveLength(2));
    await session.extensionRunner.emit({
      type: "session_shutdown",
      reason: "quit",
    });
    const installs = vi.mocked(ui.setWidget).mock.calls.length;
    finishes.shift()?.();
    await late;
    await new Promise((resolve) => setImmediate(resolve));
    expect(ui.setWidget).toHaveBeenCalledTimes(installs);
    expect(widget).toBeUndefined();
    expect(request).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
  });

  it("leaves native Trellis available when Waypoint is removed", async () => {
    const { session, errors } = await isolatedSession(false);
    expect(session.getActiveToolNames()).toContain("trellis_subagent");
    expect(session.extensionRunner.getCommand("waypoint")).toBeUndefined();
    expect(await session.extensionRunner.emitContext([])).toEqual([]);
    expect(errors).toEqual([]);
  });
});
