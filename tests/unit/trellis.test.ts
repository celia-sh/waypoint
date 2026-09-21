import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compatibility,
  findRoot,
  loadTasks,
  nativeSessionKey,
  resolveTaskPath,
  TaskObserver,
} from "../../src/trellis.js";
import { project, write } from "./fixtures.js";

const directories: string[] = [];
function fixture() {
  const value = project();
  directories.push(value.root);
  return value;
}
afterEach(() => {
  vi.useRealTimers();
  for (const path of directories.splice(0))
    rmSync(path, { recursive: true, force: true });
});

describe("native compatibility and read-only files", () => {
  it("requires exact provenance, active tools, source bytes and role files", () => {
    const { root, tool } = fixture();
    const ready = compatibility(root, true, [tool], [tool.name]);
    expect(ready.routing).toBe(true);
    expect(ready.thinking).toContain("max");
    expect(ready.thinking).not.toContain("off");
    expect(ready.diagnostics.join()).toContain("off");
    expect(compatibility(root, false, [tool], [tool.name]).routing).toBe(false);
    expect(compatibility(root, true, [tool], []).routing).toBe(false);
    expect(compatibility(root, true, [], []).routing).toBe(false);
    expect(
      compatibility(
        root,
        true,
        [{ ...tool, sourceInfo: { ...tool.sourceInfo, source: "sdk" } }],
        [tool.name],
      ).routing,
    ).toBe(false);
    write(tool.sourceInfo.path, "modified source");
    expect(compatibility(root, true, [tool], [tool.name]).routing).toBe(false);
  });
  it("normalizes native session identity with the native hash on changed bytes", () => {
    const id = "a/b c";
    const suffix = createHash("sha256").update(id).digest("hex").slice(0, 24);
    expect(nativeSessionKey(id)).toBe(`pi_a_b_c_${suffix}`);
    expect(nativeSessionKey("uuid")).toBe("pi_uuid");
    expect(nativeSessionKey(undefined, "/session")).toMatch(
      /^pi_transcript_[a-f0-9]{24}$/,
    );
    expect(nativeSessionKey()).toBeUndefined();
  });
  it("loads PRD-only tasks, native children, archived children and a parent without other-session fallback", () => {
    const { root, task, pointer } = fixture();
    const active = task("active", {
      parent: "parent",
      children: ["archive-child", "missing", "archive-child"],
      subtasks: ["invented"],
    });
    task("parent", { children: ["active"] });
    const child = task("archive/2026-09/archive-child", {
      status: "completed",
      parent: "active",
    });
    pointer("active");
    const snapshot = loadTasks(root, nativeSessionKey("session"));
    expect(snapshot.active).toBe(active);
    expect(snapshot.nodes.get(active)?.children).toEqual([child]);
    expect(snapshot.nodes.get(active)?.diagnostics.join()).toContain(
      "Unresolved child: missing",
    );
    expect(snapshot.nodes.get(active)?.diagnostics.join()).toContain(
      "Duplicate child",
    );
    expect(snapshot.nodes.get(child)?.archived).toBe(true);
    expect(snapshot.nodes.size).toBe(3);
    expect(
      loadTasks(root, nativeSessionKey("another-session")).active,
    ).toBeUndefined();
    expect(findRoot(join(active, "nested"))).toBe(root);
  });
  it("rejects escapes, stale pointers, corrupt records, and escaping symlinks", () => {
    const { root, task, pointer } = fixture();
    const outside = fixture();
    const external = outside.task();
    task();
    pointer("../../../../outside");
    expect(loadTasks(root, nativeSessionKey("session")).active).toBeUndefined();
    symlinkSync(external, join(root, ".trellis/tasks/escape"));
    expect(resolveTaskPath(root, "escape")).toBeUndefined();
    pointer("task");
    write(join(root, ".trellis/tasks/task/task.json"), "broken");
    expect(
      loadTasks(root, nativeSessionKey("session")).diagnostics.join(),
    ).toContain("Unreadable task");
    unlinkSync(join(root, ".trellis/tasks/task/task.json"));
    symlinkSync(
      join(external, "task.json"),
      join(root, ".trellis/tasks/task/task.json"),
    );
    expect(loadTasks(root, nativeSessionKey("session")).active).toBeUndefined();
  });
  it.skipIf(process.platform === "win32")(
    "rejects special task files without blocking",
    () => {
      const { root, task, pointer } = fixture();
      const path = task();
      pointer("task");
      unlinkSync(join(path, "task.json"));
      execFileSync("mkfifo", [join(path, "task.json")]);
      expect(
        loadTasks(root, nativeSessionKey("session")).active,
      ).toBeUndefined();
    },
  );
  it("reports child cycles and native unknown status without fabricating completion", () => {
    const { root, task, pointer } = fixture();
    const path = task("a", {
      status: "future-status",
      children: ["b"],
      parent: "b",
    });
    task("b", { children: ["a"], parent: "a" });
    pointer("a");
    const snapshot = loadTasks(root, nativeSessionKey("session"));
    expect(snapshot.diagnostics.join()).toContain("Cyclic");
    expect(snapshot.nodes.get(path)?.status).toBe("future-status");
    unlinkSync(
      join(
        root,
        `.trellis/.runtime/sessions/${nativeSessionKey("session")}.json`,
      ),
    );
    expect(loadTasks(root, nativeSessionKey("session")).active).toBeUndefined();
  });
  it("reconciles only the last observed directory after finish/archive without restoring an active task", () => {
    const { root, task, pointer } = fixture();
    const path = task();
    pointer("task");
    const key = nativeSessionKey("session");
    const last = loadTasks(root, key).nodes.get(path);
    expect(last?.directoryIdentity).toBeDefined();
    unlinkSync(join(root, `.trellis/.runtime/sessions/${key}.json`));
    const finished = loadTasks(root, key, last);
    expect(finished.active).toBeUndefined();
    expect(finished.recent).toBeUndefined();
    expect(finished.nodes.size).toBe(0);
    task("task", { status: "completed" });
    const completed = loadTasks(root, key, last);
    expect(completed.active).toBeUndefined();
    expect(completed.recent).toBe(path);
    expect(completed.nodes.get(path)?.archived).toBe(false);
    const archive = join(root, ".trellis/tasks/archive/2026-09/task");
    mkdirSync(join(archive, ".."), { recursive: true });
    renameSync(path, archive);
    const archived = loadTasks(root, key, last);
    expect(archived.active).toBeUndefined();
    expect(archived.recent).toBe(archive);
    expect(archived.nodes.get(archive)?.archived).toBe(true);
    expect(loadTasks(root, key).nodes.size).toBe(0);
    task("task", { status: "completed", title: "Same-name replacement" });
    expect(loadTasks(root, key, last).recent).toBeUndefined();
    const other = task("other");
    pointer("other");
    const switched = loadTasks(root, key, last);
    expect(switched.active).toBe(other);
    expect(switched.recent).toBeUndefined();
    expect(switched.nodes.has(archive)).toBe(false);
  });
  it("does not reconcile corrupt/stale pointers or ambiguous archived names", () => {
    const { root, task, pointer } = fixture();
    const path = task();
    pointer("task");
    const key = nativeSessionKey("session");
    const last = loadTasks(root, key).nodes.get(path);
    task("task", { status: "completed" });
    pointer("missing");
    expect(loadTasks(root, key, last).recent).toBeUndefined();
    write(join(root, `.trellis/.runtime/sessions/${key}.json`), "{broken");
    expect(loadTasks(root, key, last).recent).toBeUndefined();
    unlinkSync(join(root, `.trellis/.runtime/sessions/${key}.json`));
    const archive = join(root, ".trellis/tasks/archive/2026-09/task");
    mkdirSync(join(archive, ".."), { recursive: true });
    renameSync(path, archive);
    task("archive/2026-08/task", { status: "completed" });
    expect(loadTasks(root, key, last).recent).toBeUndefined();
  });
  it("disposes polling/debounce idempotently", () => {
    vi.useFakeTimers();
    const { root } = fixture();
    mkdirSync(join(root, ".trellis/.runtime"), { recursive: true });
    const observer = new TaskObserver();
    const refresh = vi.fn();
    observer.start(root, refresh);
    vi.advanceTimersByTime(3100);
    expect(refresh).toHaveBeenCalledTimes(1);
    observer.dispose();
    observer.dispose();
    vi.advanceTimersByTime(10000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
