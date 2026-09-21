import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadTasks, nativeSessionKey, taskFamily } from "../../src/trellis.js";
import { project, write } from "./fixtures.js";

const directories: string[] = [];
function fixture() {
  const f = project();
  directories.push(f.root);
  return f;
}
afterEach(() => {
  for (const dir of directories.splice(0))
    rmSync(dir, { recursive: true, force: true });
});
const key = nativeSessionKey("session");

describe("read-only native task family resolution", () => {
  it("retains verified ancestors and siblings across parent/child/grandchild switches, not other roots/history", () => {
    const f = fixture();
    const root = f.task("root", { children: ["child", "sibling", "old"] });
    const child = f.task("child", { parent: "root", children: ["grand"] });
    const grand = f.task("grand", { parent: "child" });
    const sibling = f.task("sibling", { parent: "root", status: "planning" });
    const old = f.task("archive/2026-09/old", {
      parent: "root",
      status: "completed",
    });
    f.task("independent");
    f.task("archive/2025-01/unrelated");
    const before = [root, child, grand, sibling, old].map((path) =>
      readFileSync(join(path, "task.json"), "utf8"),
    );
    for (const ref of ["root", "child", "grand"]) {
      f.pointer(ref);
      const tasks = loadTasks(f.root, key);
      expect(tasks.familyRoot).toBe(root);
      expect(taskFamily(tasks).map((node) => node.path)).toEqual([
        root,
        child,
        grand,
        sibling,
      ]);
      expect(taskFamily(tasks, true).map((node) => node.path)).toEqual([
        root,
        child,
        grand,
        sibling,
        old,
      ]);
      expect(tasks.nodes.size).toBe(5);
      expect(tasks.diagnostics).toEqual([]);
    }
    expect(
      [root, child, grand, sibling, old].map((path) =>
        readFileSync(join(path, "task.json"), "utf8"),
      ),
    ).toEqual(before);
  });

  it("reserves reads for lineage and live branches ahead of hundreds of archived references", () => {
    const f = fixture();
    const archived = Array.from({ length: 90 }, (_, i) => `old${i}`);
    const root = f.task("root", {
      children: [...archived, "sibling", "child"],
    });
    const child = f.task("child", { parent: "root", children: ["grand"] });
    const grand = f.task("grand", { parent: "child" });
    const sibling = f.task("sibling", { parent: "root" });
    for (const ref of archived)
      f.task(`archive/2026-09/${ref}`, { parent: "root", status: "completed" });
    f.pointer("grand");
    const tasks = loadTasks(f.root, key);
    expect(tasks.active).toBe(grand);
    expect(tasks.familyRoot).toBe(root);
    expect(taskFamily(tasks).map((node) => node.path)).toEqual([
      root,
      sibling,
      child,
      grand,
    ]);
    expect(tasks.nodes.size).toBeLessThanOrEqual(64);
    expect(tasks.diagnostics.join()).toContain("read bound");
    expect(tasks.diagnostics.join()).not.toContain("90 tasks");
  });

  it.each(["missing", "asymmetric", "closed", "malformed"])(
    "stops at a %s parent boundary and never invents an edge",
    (boundary) => {
      const f = fixture();
      const child = f.task("child", { parent: "parent" });
      if (boundary !== "missing") {
        const parent = f.task("parent", {
          children: boundary === "asymmetric" ? [] : ["child"],
          status: boundary === "closed" ? "completed" : "in_progress",
        });
        if (boundary === "malformed")
          write(join(parent, "task.json"), "{broken");
      }
      f.pointer("child");
      const tasks = loadTasks(f.root, key);
      expect(tasks.familyRoot).toBe(child);
      expect(tasks.active).toBe(child);
      expect(tasks.nodes.get(child)?.parent).toBeUndefined();
      expect(taskFamily(tasks, true).map((node) => node.path)).toEqual([child]);
      expect(tasks.diagnostics.length).toBeGreaterThan(0);
    },
  );

  it("rejects asymmetric/conflicting children, duplicate aliases, malformed parent fields and cycles", () => {
    const f = fixture();
    const root = f.task("root", {
      children: ["child", "child", "wrong", "bad", "missing"],
    });
    const child = f.task("child", { parent: "root", children: ["root"] });
    f.task("wrong", { parent: "unrelated" });
    f.task("bad", { parent: 42 });
    f.task("unrelated");
    f.pointer("root");
    const tasks = loadTasks(f.root, key);
    expect(taskFamily(tasks, true).map((node) => node.path)).toEqual([
      root,
      child,
    ]);
    expect(tasks.diagnostics.join()).toMatch(/Duplicate child/);
    expect(tasks.diagnostics.join()).toMatch(/Conflicting child\/parent/);
    expect(tasks.diagnostics.join()).toMatch(/Cyclic/);
    expect(tasks.diagnostics.join()).toMatch(/Unresolved child/);
  });

  it("reports archive ambiguity without importing either candidate or unrelated history", () => {
    const f = fixture();
    f.task("root", { children: ["old"] });
    f.task("archive/2026-08/old", { parent: "root" });
    f.task("archive/2026-09/old", { parent: "root" });
    f.pointer("root");
    const tasks = loadTasks(f.root, key);
    expect(tasks.nodes.size).toBe(1);
    expect(tasks.diagnostics.join()).toContain("Ambiguous archived relation");
  });

  it("retains necessary closed context and explicitly diagnoses inconsistent active/unfinished records", () => {
    const f = fixture();
    const root = f.task("root", { children: ["closed", "history"] });
    const closed = f.task("closed", {
      parent: "root",
      status: "completed",
      children: ["live"],
    });
    const live = f.task("live", { parent: "closed" });
    f.task("history", { parent: "root", status: "completed" });
    f.pointer("root");
    const tasks = loadTasks(f.root, key);
    expect(taskFamily(tasks).map((node) => node.path)).toEqual([
      root,
      closed,
      live,
    ]);
    expect(tasks.diagnostics.join()).toContain("Closed native record retained");
    f.pointer("closed");
    expect(taskFamily(loadTasks(f.root, key)).map((node) => node.path)).toEqual(
      [root, closed, live],
    );
  });

  it("never enumerates unrelated archived task records", () => {
    const f = fixture();
    const root = f.task("root", { children: ["child", "old"] });
    const child = f.task("child", { parent: "root" });
    const old = f.task("archive/2026-09/old", {
      parent: "root",
      status: "completed",
    });
    for (let i = 0; i < 250; i++) {
      const unrelated = f.task(`archive/2026-09/unrelated${i}`);
      write(join(unrelated, "task.json"), "{corrupt unrelated record");
    }
    f.pointer("child");
    const tasks = loadTasks(f.root, key);
    expect(taskFamily(tasks, true).map((node) => node.path)).toEqual([
      root,
      child,
      old,
    ]);
    expect(tasks.nodes.size).toBe(3);
    expect(tasks.diagnostics).toEqual([]);
  });

  it("does not treat natively detached children of an archived parent as corrupt or related", () => {
    const f = fixture();
    const root = f.task("root", { children: ["archived-parent"] });
    const archived = f.task("archive/2026-09/archived-parent", {
      parent: "root",
      status: "completed",
      children: ["detached", "relinked", "old-child"],
    });
    f.task("detached", { parent: null });
    f.task("relinked", { parent: "independent" });
    f.task("independent", { children: ["relinked"] });
    const oldChild = f.task("archive/2026-08/old-child", {
      parent: "archived-parent",
      status: "completed",
    });
    f.pointer("root");
    const tasks = loadTasks(f.root, key);
    expect(taskFamily(tasks).map((node) => node.path)).toEqual([root]);
    expect(taskFamily(tasks, true).map((node) => node.path)).toEqual([
      root, archived, oldChild,
    ]);
    expect(tasks.diagnostics).toEqual([]);
    f.pointer("detached");
    expect(taskFamily(loadTasks(f.root, key), true)).toHaveLength(1);
  });

  it.each([80, 4096])("reserves nearby active-lineage branches before %i distant references", (count) => {
    const f = fixture();
    const refs = Array.from({ length: count }, (_, i) => `other${i}`);
    const root = f.task("root", { children: ["child", ...refs] });
    const child = f.task("child", { parent: "root", children: ["grand", "nearby"] });
    const grand = f.task("grand", { parent: "child", children: ["next"] });
    const nearby = f.task("nearby", { parent: "child" });
    const next = f.task("next", { parent: "grand" });
    for (const ref of refs.slice(0, 80)) f.task(ref, { parent: "root" });
    f.pointer("grand");
    const tasks = loadTasks(f.root, key);
    expect(tasks.familyRoot).toBe(root);
    expect(taskFamily(tasks).map((node) => node.path)).toEqual(
      expect.arrayContaining([root, child, grand, nearby, next]),
    );
    expect(tasks.nodes.size).toBeLessThanOrEqual(64);
    expect(tasks.diagnostics.join()).toContain("bound exceeded");
  });

  it("keeps the active task and nearest verified ancestry when depth is bounded", () => {
    const f = fixture();
    for (let i = 0; i < 30; i++)
      f.task(`n${i}`, {
        parent: i ? `n${i - 1}` : null,
        children: i < 29 ? [`n${i + 1}`] : [],
      });
    f.pointer("n29");
    const tasks = loadTasks(f.root, key);
    expect(tasks.active).toBe(join(f.root, ".trellis/tasks/n29"));
    expect(taskFamily(tasks)).toHaveLength(17);
    expect(tasks.diagnostics.join()).toContain("depth bound");
    expect(tasks.nodes.size).toBeLessThanOrEqual(64);
  });
});
