import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
  ConfigStore,
  isMode,
  MODE_ENTRY,
  parseConfig,
  restoreMode,
  type ConfigState,
  type Mode,
} from "./config.js";
import {
  checkStrong,
  identity,
  sameModel,
  supportedThinking,
  type DispatchCapability,
} from "./models.js";
import { projectPolicy, routingPolicy } from "./routing.js";
import {
  compatibility,
  findRoot,
  loadTasks,
  nativeSessionKey,
  TaskObserver,
  type TaskNode,
  type TaskSnapshot,
} from "./trellis.js";
import {
  browseTaskPalette,
  browseTasks,
  canCycleTasks,
  chooseMode,
  chooseModel,
  installWidget,
  nextTaskView,
  notifyStatus,
  openPanel,
  plain,
  select,
  showDetails,
  type TaskViewMode,
  type ViewState,
} from "./ui.js";

export default function waypoint(pi: ExtensionAPI): void {
  if (process.env.TRELLIS_SUBAGENT_CHILD === "1") return;
  const store = new ConfigStore();
  let config: ConfigState = parseConfig({});
  let override: Mode | undefined;
  let capability: DispatchCapability = {
    routing: false,
    thinking: [],
    diagnostics: [],
  };
  let tasks: TaskSnapshot = { nodes: new Map(), diagnostics: [] };
  let lastObserved: TaskNode | undefined;
  let currentContext: ExtensionContext | undefined;
  let scope = "";
  let generation = 0;
  let observer = new TaskObserver();
  let runtimeDiagnostic: string | undefined;
  let dialogOpen = false;
  let promptOpen = false;
  let taskView: TaskViewMode = "focused";

  const mode = () => override ?? config.config.defaultMode;
  function inspect(ctx: ExtensionContext): {
    policy?: string;
    routing: ViewState["routing"];
    diagnostics: string[];
  } {
    capability = compatibility(
      tasks.root,
      ctx.isProjectTrusted(),
      pi.getAllTools(),
      pi.getActiveTools(),
    );
    const strong = checkStrong(
      config.config,
      ctx.modelRegistry.getAvailable(),
      capability,
    );
    const diagnostics = [
      ...config.diagnostics,
      ...capability.diagnostics,
      ...strong.diagnostics,
      ...tasks.diagnostics,
    ];
    if (runtimeDiagnostic) diagnostics.push(runtimeDiagnostic);
    if (!ctx.model)
      diagnostics.push(
        "Current Pi model is unavailable; guidance is inactive.",
      );
    const usable =
      config.diagnostics.length === 0 &&
      capability.routing &&
      strong.diagnostics.length === 0;
    const policy = routingPolicy(mode(), config.config, ctx.model, usable);
    return {
      policy,
      routing:
        mode() === "off"
          ? "off"
          : policy
            ? "enabled"
            : usable &&
                mode() === "auto" &&
                sameModel(ctx.model, config.config.strongModel)
              ? "bypassed"
              : "unavailable",
      diagnostics,
    };
  }
  function view(ctx = currentContext): ViewState {
    let report: {
      diagnostics: string[];
      policy?: string;
      routing: ViewState["routing"];
    };
    try {
      report = ctx ? inspect(ctx) : { diagnostics: [], routing: "unavailable" };
    } catch {
      report = {
        routing: mode() === "off" ? "off" : "unavailable",
        diagnostics: [
          "Waypoint state is unavailable; native execution is unchanged.",
        ],
      };
    }
    return {
      mode: mode(),
      current: identity(ctx?.model),
      config,
      tasks,
      diagnostics: report.diagnostics,
      guidance: !!report.policy,
      routing: report.routing,
      taskView,
    };
  }
  function render(ctx: ExtensionContext): void {
    installWidget(
      ctx,
      () => view(currentContext ?? ctx),
      () => dialogOpen || promptOpen,
    );
  }
  function refreshTasks(ctx: ExtensionContext): void {
    const root = ctx.isProjectTrusted() ? findRoot(ctx.cwd) : undefined;
    const key = nativeSessionKey(
      ctx.sessionManager.getSessionId(),
      ctx.sessionManager.getSessionFile(),
    );
    tasks = loadTasks(root, key, lastObserved);
    if (tasks.active) lastObserved = tasks.nodes.get(tasks.active);
  }
  function reset(ctx: ExtensionContext): void {
    observer.dispose();
    observer = new TaskObserver();
    generation++;
    dialogOpen = false;
    promptOpen = false;
    taskView = "focused";
    currentContext = ctx;
    runtimeDiagnostic = undefined;
    lastObserved = undefined;
    refreshTasks(ctx);
    const session = ctx.sessionManager.getSessionId();
    scope = `${session}\0${ctx.cwd}\0${tasks.root ?? ""}`;
    const header = ctx.sessionManager.getHeader();
    const since = header?.parentSession ? header.timestamp : undefined;
    override = restoreMode(ctx.sessionManager.getBranch(), since);
    inspect(ctx);
    const expected = generation;
    if (tasks.root)
      observer.start(tasks.root, () => {
        if (generation !== expected || !currentContext) return;
        try {
          refreshTasks(currentContext);
          render(currentContext);
        } catch {
          runtimeDiagnostic =
            "Task observation failed; native execution is unchanged.";
        }
      });
    render(ctx);
  }
  function ensure(ctx: ExtensionContext): void {
    const root = ctx.isProjectTrusted() ? findRoot(ctx.cwd) : undefined;
    if (
      scope !==
      `${ctx.sessionManager.getSessionId()}\0${ctx.cwd}\0${root ?? ""}`
    )
      reset(ctx);
    currentContext = ctx;
  }
  function failure(ctx: ExtensionContext): void {
    runtimeDiagnostic =
      "Waypoint could not refresh its state; native Pi/Trellis are unchanged. Check /waypoint status.";
    try {
      if (ctx.hasUI) ctx.ui.notify(runtimeDiagnostic, "warning");
    } catch {
      // A failing UI channel must not escape an observation/context handler.
    }
  }
  function setMode(value: Mode, ctx: ExtensionContext): void {
    pi.appendEntry(MODE_ENTRY, { mode: value });
    override = value;
    render(ctx);
  }

  function cycleTasks(ctx: ExtensionContext): void {
    if (ctx.mode !== "tui") return;
    ensure(ctx);
    refreshTasks(ctx);
    if (!canCycleTasks(view(ctx))) return;
    taskView = nextTaskView(taskView);
    render(ctx);
  }
  pi.registerShortcut("alt+w", {
    description: "Cycle Waypoint task view",
    handler: (ctx) => {
      try {
        cycleTasks(ctx);
      } catch {
        failure(ctx);
      }
    },
  });

  async function openTaskPalette(ctx: ExtensionContext): Promise<void> {
    if (ctx.mode !== "tui" || dialogOpen) return;
    ensure(ctx);
    const expected = generation;
    const alive = () => generation === expected;
    refreshTasks(ctx);
    if (!tasks.active && !tasks.recent) return;
    dialogOpen = true;
    render(ctx);
    try {
      await browseTaskPalette(ctx, () => view(ctx), alive);
    } catch {
      if (alive()) failure(ctx);
    } finally {
      if (alive()) {
        dialogOpen = false;
        try {
          render(ctx);
        } catch {
          failure(ctx);
        }
      }
    }
  }
  pi.registerShortcut("alt+t", {
    description: "Open Waypoint task browser",
    handler: async (ctx) => {
      try {
        await openTaskPalette(ctx);
      } catch {
        failure(ctx);
      }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    try {
      reset(ctx);
      const expected = generation;
      const loaded = await store.load();
      if (expected !== generation) return;
      config = loaded;
      render(ctx);
    } catch {
      failure(ctx);
    }
  });
  function promptState(open: boolean, ctx: ExtensionContext): void {
    // Prompt notifications are asynchronous observations, not lifecycle starts.
    if (!currentContext) return;
    try {
      if (
        ctx.mode !== "tui" ||
        scope !==
          `${ctx.sessionManager.getSessionId()}\0${ctx.cwd}\0${tasks.root ?? ""}`
      )
        return;
      promptOpen = open;
      render(ctx);
    } catch {
      failure(ctx);
    }
  }
  pi.on("ui_prompt_start", (_event, ctx) => promptState(true, ctx));
  pi.on("ui_prompt_end", (_event, ctx) => promptState(false, ctx));
  pi.on("session_tree", (_event, ctx) => {
    try {
      reset(ctx);
    } catch {
      failure(ctx);
    }
  });
  pi.on("session_shutdown", (_event, ctx) => {
    generation++;
    observer.dispose();
    currentContext = undefined;
    scope = "";
    tasks = { nodes: new Map(), diagnostics: [] };
    lastObserved = undefined;
    override = undefined;
    dialogOpen = false;
    promptOpen = false;
    taskView = "focused";
    try {
      if (ctx.mode === "tui") ctx.ui.setWidget("waypoint", undefined);
    } catch {
      failure(ctx);
    }
  });
  pi.on("model_select", (_event, ctx) => {
    try {
      ensure(ctx);
      render(ctx);
    } catch {
      failure(ctx);
    }
  });
  pi.on("context", async (event, ctx) => {
    try {
      ensure(ctx);
      const expected = generation;
      const loaded = await store.load();
      if (expected !== generation)
        return { messages: projectPolicy(event.messages) };
      config = loaded;
      return { messages: projectPolicy(event.messages, inspect(ctx).policy) };
    } catch {
      failure(ctx);
      return { messages: projectPolicy(event.messages) };
    }
  });
  async function configure(
    ctx: ExtensionContext,
    thinkingOnly: boolean,
  ): Promise<void> {
    const expected = generation;
    const alive = () => expected === generation;
    inspect(ctx);
    if (!capability.routing) {
      notifyStatus(ctx, view(ctx));
      return;
    }
    let model = checkStrong(
      config.config,
      ctx.modelRegistry.getAvailable(),
      capability,
    ).model;
    if (!thinkingOnly || !model) {
      while (alive()) {
        const selected = await chooseModel(
          ctx,
          ctx.modelRegistry.getAvailable(),
        );
        if (!alive() || !selected) return;
        if (selected === "refresh") {
          await ctx.modelRegistry.refresh({
            signal: AbortSignal.timeout(15000),
          });
          continue;
        }
        model = selected;
        break;
      }
    }
    if (!model || !alive()) return;
    const levels = supportedThinking(model, capability);
    if (!levels.length) {
      ctx.ui.notify(
        "No verified thinking levels are available for this model/native dispatch. Nothing saved.",
        "warning",
      );
      return;
    }
    const thinking = await select(
      ctx,
      `Strong Thinking: ${identity(model)}`,
      levels.map((level) => ({ value: level, label: level })),
    );
    if (!thinking || !alive()) return;
    inspect(ctx);
    const available = ctx.modelRegistry
      .getAvailable()
      .find(
        (candidate) =>
          candidate.provider === model.provider && candidate.id === model.id,
      );
    if (
      !available ||
      !supportedThinking(available, capability).includes(thinking)
    ) {
      ctx.ui.notify(
        "The selected model/thinking is no longer available. Nothing saved.",
        "warning",
      );
      return;
    }
    const saved = await store.save({
      strongModel: { provider: model.provider, id: model.id },
      strongThinking: thinking,
    });
    if (alive()) {
      config = saved;
      render(ctx);
    }
  }

  pi.registerCommand("waypoint", {
    description: "Waypoint model settings and read-only Trellis task status",
    getArgumentCompletions: (prefix) => {
      const values = ["auto", "on", "off", "model", "thinking", "status"]
        .filter((value) => value.startsWith(prefix))
        .map((value) => ({ value, label: value }));
      return values.length ? values : null;
    },
    handler: async (args, ctx) => {
      let dialogGeneration: number | undefined;
      try {
        ensure(ctx);
        const expected = generation;
        const alive = () => generation === expected;
        const loaded = await store.load();
        if (!alive()) return;
        config = loaded;
        refreshTasks(ctx);
        const command = args.trim();
        if (isMode(command)) {
          setMode(command, ctx);
          notifyStatus(ctx, view(ctx));
          return;
        }
        if (command === "status") {
          notifyStatus(ctx, view(ctx));
          return;
        }
        if (ctx.mode !== "tui") {
          notifyStatus(ctx, view(ctx));
          if (ctx.hasUI)
            ctx.ui.notify(
              "Interactive Waypoint controls require Pi TUI mode.",
              "warning",
            );
          return;
        }
        dialogGeneration = generation;
        dialogOpen = true;
        render(ctx);
        if (command === "model" || command === "thinking") {
          await configure(ctx, command === "thinking");
          return;
        }
        if (command) {
          ctx.ui.notify(
            "Unknown Waypoint command. Available: auto, on, off, model, thinking, status.",
            "warning",
          );
          return;
        }
        let selected: string | undefined;
        while (alive()) {
          selected = await openPanel(ctx, () => view(ctx), selected);
          if (!alive() || !selected || selected === "close") return;
          if (selected === "mode") {
            const value = await chooseMode(ctx, mode());
            if (alive() && value) setMode(value, ctx);
          } else if (selected === "model" || selected === "thinking")
            await configure(ctx, selected === "thinking");
          else if (selected === "toggle") cycleTasks(ctx);
          else if (selected === "task")
            await browseTasks(ctx, () => view(ctx), alive);
          else if (selected === "details" || selected === "diagnostics")
            await showDetails(ctx, () => view(ctx), selected);
          else {
            const loaded = await store.load();
            if (!alive()) return;
            config = loaded;
            refreshTasks(ctx);
            render(ctx);
          }
        }
      } catch (error) {
        if (dialogGeneration !== undefined && dialogGeneration !== generation)
          return;
        try {
          if (ctx.hasUI)
            ctx.ui.notify(
              error instanceof Error
                ? plain(error.message)
                : "Waypoint command failed; no native behavior was changed.",
              "error",
            );
          else failure(ctx);
        } catch {
          failure(ctx);
        }
      } finally {
        if (dialogGeneration === generation) {
          dialogOpen = false;
          try {
            render(ctx);
          } catch {
            failure(ctx);
          }
        }
      }
    },
  });
}
