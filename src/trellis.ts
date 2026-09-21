import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  openSync,
  opendirSync,
  readSync,
  realpathSync,
  statSync,
  watch,
  type FSWatcher,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import type { ToolInfo } from "@earendil-works/pi-coding-agent";
import { nonempty, object } from "./config.js";
import type { DispatchCapability } from "./models.js";

// Generated Trellis 0.6.17, inspected with Pi 0.85.1. Unknown bytes fail closed.
export const NATIVE_SOURCE_SHA256 =
  "b53f1b5ac66f4ed15a46e1f5b013e0074e23695e86a55a724d4c273032d9fb41";
const ROLES = [
  "trellis-research",
  "trellis-implement",
  "trellis-check",
] as const;
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const within = (root: string, path: string) => {
  const rel = relative(root, path);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
};

export function readBounded(
  root: string,
  path: string,
  maximum = 128 * 1024,
): string {
  const canonical = realpathSync(path);
  if (!within(realpathSync(root), canonical))
    throw new Error("Path escapes project root");
  const fd = openSync(canonical, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > maximum)
      throw new Error("Unsupported file size or type");
    const bytes = Buffer.alloc(maximum + 1);
    let length = 0;
    while (length < bytes.length) {
      const count = readSync(fd, bytes, length, bytes.length - length, null);
      if (!count) break;
      length += count;
    }
    if (length > maximum) throw new Error("File exceeds size bound");
    return bytes.subarray(0, length).toString("utf8");
  } finally {
    closeSync(fd);
  }
}

export function findRoot(cwd: string): string | undefined {
  let current = resolve(cwd);
  while (true) {
    try {
      if (statSync(join(current, ".trellis")).isDirectory()) {
        const root = realpathSync(current);
        readBounded(root, join(root, ".trellis", "workflow.md"));
        if (!within(root, realpathSync(join(root, ".trellis", "tasks"))))
          return undefined;
        if (!statSync(join(root, ".trellis", "tasks")).isDirectory())
          return undefined;
        return root;
      }
    } catch {
      /* The nearest malformed/escaping project is not a parent-project fallback. */
      if (existsSync(join(current, ".trellis"))) return undefined;
    }
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export function nativeSessionKey(
  sessionId?: string,
  sessionFile?: string,
): string | undefined {
  const id = sessionId?.trim();
  if (id) {
    const normalized = id.replace(/[^A-Za-z0-9._-]+/g, "_");
    return `pi_${normalized}${normalized === id ? "" : `_${hash(id).slice(0, 24)}`}`;
  }
  return sessionFile?.trim()
    ? `pi_transcript_${hash(sessionFile.trim()).slice(0, 24)}`
    : undefined;
}

export function compatibility(
  root: string | undefined,
  trusted: boolean,
  tools: readonly ToolInfo[],
  active: readonly string[],
): DispatchCapability {
  const result: DispatchCapability = {
    routing: false,
    thinking: [],
    diagnostics: [],
  };
  const fail = (message: string) => {
    result.diagnostics.push(message);
    return result;
  };
  if (!trusted)
    return fail(
      "Project is not trusted by Pi; native integration and task reads are disabled.",
    );
  if (!root)
    return fail(
      "No supported Trellis project found; check workflow.md/tasks and symlink containment.",
    );
  const tool = tools.find((item) => item.name === "trellis_subagent");
  if (!tool)
    return fail(
      "Native trellis_subagent is not registered; load the generated Trellis Pi extension and reload Pi.",
    );
  if (!active.includes(tool.name))
    return fail(
      "Native trellis_subagent is inactive; enable it in Pi to offer Strong dispatch.",
    );
  try {
    const path = join(root, ".pi", "extensions", "trellis", "index.ts");
    if (
      !tool.sourceInfo ||
      ["builtin", "sdk"].includes(tool.sourceInfo.source) ||
      realpathSync(tool.sourceInfo.path) !== realpathSync(path)
    )
      return fail(
        "trellis_subagent provenance is not the native project integration; routing is unavailable.",
      );
    if (hash(readBounded(root, path, 256 * 1024)) !== NATIVE_SOURCE_SHA256)
      return fail(
        "Trellis integration differs from the verified 0.6.17 contract; revalidate native forwarding before enabling routing.",
      );
    for (const role of ROLES) {
      if (!readBounded(root, join(root, ".pi", "agents", `${role}.md`)).trim())
        return fail(
          `Missing native ${role} definition; regenerate the native integration.`,
        );
    }
    const schema: unknown = tool.parameters;
    if (!object(schema) || !object(schema.properties))
      return fail("Native dispatch schema cannot be verified.");
    const { model, thinking } = schema.properties;
    if (
      !object(model) ||
      model.type !== "string" ||
      !object(thinking) ||
      thinking.type !== "string" ||
      !Array.isArray(thinking.enum)
    )
      return fail("Native dispatch lacks verifiable model/thinking arguments.");
    const forwarded = ["minimal", "low", "medium", "high", "xhigh", "max"];
    result.thinking = thinking.enum.filter(
      (value): value is string =>
        typeof value === "string" && forwarded.includes(value),
    );
    result.routing = result.thinking.length > 0;
    result.diagnostics.push(
      "Trellis 0.6.17 does not reliably forward explicit thinking=off; off is unavailable as a Strong dispatch guarantee.",
    );
    if (!result.routing)
      result.diagnostics.push(
        "No verified thinking levels intersect the registered native schema.",
      );
    return result;
  } catch {
    return fail(
      "Native integration or role definitions are unreadable/escaping; check project installation and trust.",
    );
  }
}

export interface TaskNode {
  path: string;
  ref: string;
  title: string;
  status: string;
  archived: boolean;
  directoryIdentity?: string;
  parent?: string;
  children: string[];
  diagnostics: string[];
}
export interface TaskSnapshot {
  root?: string;
  active?: string;
  familyRoot?: string;
  recent?: string;
  nodes: Map<string, TaskNode>;
  diagnostics: string[];
}

export function resolveTaskPath(
  root: string,
  reference: string,
): string | undefined {
  let ref = reference.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (ref.startsWith("tasks/")) ref = `.trellis/${ref}`;
  const path = isAbsolute(ref)
    ? ref
    : ref.startsWith(".trellis/")
      ? resolve(root, ref)
      : resolve(root, ".trellis", "tasks", ref);
  try {
    const canonical = realpathSync(path);
    if (
      !within(realpathSync(root), canonical) ||
      !within(realpathSync(join(root, ".trellis", "tasks")), canonical)
    )
      return undefined;
    return statSync(canonical).isDirectory() ? canonical : undefined;
  } catch {
    return undefined;
  }
}

export function loadTasks(
  root: string | undefined,
  key: string | undefined,
  lastObserved?: TaskNode,
): TaskSnapshot {
  const snapshot: TaskSnapshot = { root, nodes: new Map(), diagnostics: [] };
  if (!root || !key) return snapshot;
  let reference: string | undefined;
  try {
    const pointer: unknown = JSON.parse(
      readBounded(
        root,
        join(root, ".trellis", ".runtime", "sessions", `${key}.json`),
        16 * 1024,
      ),
    );
    if (!object(pointer) || !nonempty(pointer.current_task)) {
      snapshot.diagnostics.push(
        "Native session pointer has no valid current_task.",
      );
      return snapshot;
    }
    reference = pointer.current_task;
  } catch (error) {
    if (!(object(error) && error.code === "ENOENT")) {
      snapshot.diagnostics.push(
        "Native session pointer is unreadable or corrupt; task unknown.",
      );
      return snapshot;
    }
  }
  const active = reference ? resolveTaskPath(root, reference) : undefined;
  if (reference && !active) {
    snapshot.diagnostics.push(
      "Native session pointer is stale or escapes the supported task layout.",
    );
    return snapshot;
  }
  const tasksDir = join(root, ".trellis", "tasks");
  let archiveMonths: string[] | undefined;
  const relationCache = new Map<string, string | undefined>();
  const resolveRelation = (ref: string): string | undefined => {
    const direct = resolveTaskPath(root, ref);
    if (direct) return direct;
    // Only bare native child directory names have an archive lookup. Escapes never recover by basename.
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(ref)) return undefined;
    if (!archiveMonths) {
      try {
        const archive = realpathSync(join(tasksDir, "archive"));
        if (!within(root, archive)) return undefined;
        const names: string[] = [];
        const directory = opendirSync(archive);
        try {
          for (
            let entry = directory.readSync();
            entry && names.length <= 240;
            entry = directory.readSync()
          )
            names.push(entry.name);
        } finally {
          directory.closeSync();
        }
        if (names.length > 240) {
          snapshot.diagnostics.push(
            "Archive month scan bound exceeded; some relations are unresolved.",
          );
          archiveMonths = [];
        } else
          archiveMonths = names.filter((name) => /^\d{4}-\d{2}$/.test(name));
      } catch {
        archiveMonths = [];
      }
    }
    const matches = archiveMonths
      .map((month) =>
        resolveTaskPath(root, join(tasksDir, "archive", month, ref)),
      )
      .filter((path): path is string => !!path);
    if (matches.length > 1)
      snapshot.diagnostics.push(`Ambiguous archived relation: ${ref}`);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const findRelation = (ref: string): string | undefined => {
    if (!relationCache.has(ref)) relationCache.set(ref, resolveRelation(ref));
    return relationCache.get(ref);
  };
  const records = new Map<
    string,
    { parent?: string; detached: boolean; children: string[] }
  >();
  const attempted = new Set<string>();
  const diagnose = (message: string) => {
    if (!snapshot.diagnostics.includes(message))
      snapshot.diagnostics.push(message);
  };
  const load = (path: string): TaskNode | undefined => {
    if (snapshot.nodes.has(path)) return snapshot.nodes.get(path);
    if (attempted.has(path)) return undefined;
    if (attempted.size >= 64) {
      diagnose("Task read bound exceeded; remaining relations are unresolved.");
      return undefined;
    }
    attempted.add(path);
    try {
      const data: unknown = JSON.parse(
        readBounded(root, join(path, "task.json")),
      );
      if (!object(data)) throw new Error("Invalid task record");
      const stat = statSync(path, { bigint: true });
      const node: TaskNode = {
        path,
        directoryIdentity: `${stat.dev}:${stat.ino}`,
        ref: relative(root, path),
        title: nonempty(data.title)
          ? data.title
          : nonempty(data.name)
            ? data.name
            : basename(path),
        status: nonempty(data.status) ? data.status : "unknown",
        archived: within(join(tasksDir, "archive"), path),
        children: [],
        diagnostics: [],
      };
      snapshot.nodes.set(path, node);
      if (!nonempty(data.status))
        node.diagnostics.push("Missing native status.");
      const children: string[] = [];
      if (Array.isArray(data.children)) {
        // Bound reference work separately from record reads; archived names cannot
        // consume the record budget before later live siblings are considered.
        if (data.children.length > 4096)
          node.diagnostics.push(
            "Child reference bound exceeded; relations unresolved.",
          );
        for (const child of data.children.slice(0, 4096)) {
          if (nonempty(child)) children.push(child);
          else node.diagnostics.push("Invalid child reference.");
        }
      } else if (data.children !== undefined)
        node.diagnostics.push("Invalid children field.");
      if (data.parent != null && data.parent !== "" && !nonempty(data.parent))
        node.diagnostics.push("Invalid parent reference.");
      records.set(path, {
        parent: nonempty(data.parent) ? data.parent : undefined,
        detached: data.parent === null,
        children,
      });
      return node;
    } catch {
      diagnose(`Unreadable task record: ${relative(root, path)}`);
      return undefined;
    }
  };
  if (active) {
    const current = load(active);
    if (!current) return snapshot;
    snapshot.active = active;
    let top = current;
    const lineage = new Set([active]);
    // Reserve reads for the active path before expanding any side branches.
    while (records.get(top.path)?.parent) {
      if (lineage.size > 16) {
        diagnose(
          "Task ancestry depth bound exceeded; remaining parents are unresolved.",
        );
        break;
      }
      const parentRef = records.get(top.path)?.parent;
      const parentPath = parentRef ? findRelation(parentRef) : undefined;
      if (!parentPath) {
        top.diagnostics.push(`Unresolved parent: ${parentRef}`);
        break;
      }
      if (lineage.has(parentPath)) {
        diagnose("Cyclic native parent relation; family traversal stopped.");
        break;
      }
      const parent = load(parentPath);
      if (!parent) break;
      if (taskClosed(parent)) {
        top.diagnostics.push(
          "Closed parent boundary; active family retained separately.",
        );
        break;
      }
      if (
        !records
          .get(parentPath)
          ?.children.some(
            (ref) =>
              resolveTaskPath(root, ref) === top.path ||
              (top.archived && findRelation(ref) === top.path),
          )
      ) {
        top.diagnostics.push(
          "Conflicting parent/children relation; family traversal stopped.",
        );
        break;
      }
      top.parent = parentPath;
      parent.children.push(top.path);
      lineage.add(parentPath);
      top = parent;
    }
    snapshot.familyRoot = top.path;
    const reachable = new Set(lineage);
    type Pending = {
      parent: TaskNode;
      ref: string;
      path?: string;
      depth: number;
      ancestors: Set<string>;
    };
    const live: Pending[] = [];
    const archived: Pending[] = [];
    const scheduled = new Set<string>();
    let referenceWork = 0;
    const enqueue = (
      parent: TaskNode,
      depth: number,
      ancestors: Set<string>,
    ) => {
      if (scheduled.has(parent.path)) return;
      scheduled.add(parent.path);
      const refs = records.get(parent.path)?.children ?? [];
      if (depth >= 16 && refs.length) {
        diagnose(
          "Task tree depth bound exceeded; remaining relations are unresolved.",
        );
        return;
      }
      const seen = new Set<string>();
      for (const ref of refs) {
        if (++referenceWork > 4096) {
          diagnose(
            "Task relation read bound exceeded; remaining relations are unresolved.",
          );
          break;
        }
        const path = resolveTaskPath(root, ref);
        if (path) relationCache.set(ref, path);
        const identity = path ?? ref;
        if (seen.has(identity)) {
          parent.diagnostics.push(`Duplicate child: ${ref}`);
          continue;
        }
        seen.add(identity);
        const pending = { parent, ref, path, depth: depth + 1, ancestors };
        if (path && !within(join(tasksDir, "archive"), path))
          live.push(pending);
        else archived.push(pending);
      }
    };
    const examined = new Map<string, Set<string>>();
    // Schedule the already verified path from current to root before distant
    // branches can consume either the reference budget or the record budget.
    const activePath = [...lineage];
    activePath.forEach((path, index) => {
      const node = snapshot.nodes.get(path);
      if (node)
        enqueue(
          node,
          activePath.length - index - 1,
          new Set(activePath.slice(index)),
        );
    });
    while (live.length || archived.length) {
      const pending = live.shift() ?? archived.shift();
      if (!pending) break;
      const { parent, ref, depth, ancestors } = pending;
      const path = pending.path ?? findRelation(ref);
      if (!path) {
        parent.diagnostics.push(`Unresolved child: ${ref}`);
        continue;
      }
      const seen = examined.get(parent.path) ?? new Set<string>();
      examined.set(parent.path, seen);
      if (seen.has(path)) {
        parent.diagnostics.push(`Duplicate child: ${ref}`);
        continue;
      }
      seen.add(path);
      if (ancestors.has(path)) {
        diagnose(`Cyclic native task relation: ${basename(path)}`);
        continue;
      }
      const child = load(path);
      if (!child) continue;
      const parentRef = records.get(path)?.parent;
      const declaredParent = parentRef ? findRelation(parentRef) : undefined;
      // Native archive keeps historical child names but clears live children's
      // parent fields. They may subsequently be linked to another requirement.
      if (
        parent.archived &&
        (records.get(path)?.detached ||
          (declaredParent && declaredParent !== parent.path))
      )
        continue;
      if (
        !parentRef ||
        declaredParent !== parent.path ||
        (child.parent && child.parent !== parent.path)
      ) {
        parent.diagnostics.push(`Conflicting child/parent relation: ${ref}`);
        continue;
      }
      child.parent = parent.path;
      if (!parent.children.includes(path)) parent.children.push(path);
      reachable.add(path);
      enqueue(child, depth, new Set(ancestors).add(path));
    }
    // The lineage was linked first; restore native sibling order after loading.
    for (const node of snapshot.nodes.values()) {
      const refs = records.get(node.path)?.children ?? [];
      const order = new Map<string, number>();
      refs.forEach((ref, index) => {
        const path = relationCache.get(ref);
        if (path && !order.has(path)) order.set(path, index);
      });
      node.children.sort(
        (a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity),
      );
      if (!reachable.has(node.path)) snapshot.nodes.delete(node.path);
    }
    for (const node of taskFamily(snapshot)) {
      if (taskClosed(node))
        node.diagnostics.push(
          "Closed native record retained as required live-task context.",
        );
    }
  } else if (
    lastObserved?.directoryIdentity &&
    within(root, lastObserved.path)
  ) {
    // Only reconcile this session's last directory, never a same-name replacement.
    const path =
      resolveTaskPath(root, lastObserved.path) ??
      (dirname(lastObserved.path) === tasksDir
        ? findRelation(basename(lastObserved.path))
        : undefined);
    const node = path ? load(path) : undefined;
    if (
      node &&
      node.directoryIdentity === lastObserved.directoryIdentity &&
      taskClosed(node)
    )
      snapshot.recent = node.path;
    else snapshot.nodes.clear();
  }
  for (const node of snapshot.nodes.values())
    for (const message of node.diagnostics)
      diagnose(`${node.title}: ${message}`);
  return snapshot;
}

export const taskClosed = (task: TaskNode): boolean =>
  task.archived || task.status === "completed";

// A presentation filter, not a task store. Keep closed structural ancestors only
// when removing them would hide an unfinished descendant or the active pointer.
export function taskFamily(
  snapshot: TaskSnapshot,
  includeCompleted = false,
): TaskNode[] {
  const rows: TaskNode[] = [];
  const seen = new Set<string>();
  const visit = (path: string): TaskNode[] => {
    const node = snapshot.nodes.get(path);
    if (!node || seen.has(path)) return [];
    seen.add(path);
    const children = node.children.flatMap(visit);
    return includeCompleted ||
      !taskClosed(node) ||
      path === snapshot.active ||
      children.length
      ? [node, ...children]
      : [];
  };
  const root = snapshot.familyRoot ?? snapshot.active;
  if (root) rows.push(...visit(root));
  return rows;
}

export class TaskObserver {
  private watchers: FSWatcher[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private debounce?: ReturnType<typeof setTimeout>;
  private stopped = true;
  start(root: string, refresh: () => void): void {
    this.dispose();
    this.stopped = false;
    const schedule = () => {
      if (this.stopped || this.debounce) return;
      this.debounce = setTimeout(() => {
        this.debounce = undefined;
        if (!this.stopped) refresh();
      }, 100);
      this.debounce.unref();
    };
    for (const path of [
      join(root, ".trellis", "tasks"),
      join(root, ".trellis", ".runtime"),
      join(root, ".trellis", ".runtime", "sessions"),
    ]) {
      try {
        if (!within(realpathSync(root), realpathSync(path))) continue;
        const watcher = watch(path, schedule);
        watcher.on("error", () => watcher.close());
        watcher.unref();
        this.watchers.push(watcher);
      } catch {
        /* Bounded polling also covers nested task edits, missing directories and unsupported watches. */
      }
    }
    this.timer = setInterval(schedule, 3000);
    this.timer.unref();
  }
  dispose(): void {
    this.stopped = true;
    for (const watcher of this.watchers) watcher.close();
    this.watchers = [];
    clearInterval(this.timer);
    clearTimeout(this.debounce);
    this.timer = undefined;
    this.debounce = undefined;
  }
}
