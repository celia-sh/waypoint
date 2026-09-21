import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ToolInfo } from "@earendil-works/pi-coding-agent";
import type { AvailableModel } from "../../src/models.js";
import { nativeSessionKey } from "../../src/trellis.js";

export const repository = resolve(import.meta.dirname, "../..");
export const model: AvailableModel = {
  provider: "fixture",
  id: "strong",
  name: "Fixture Strong",
  api: "openai-responses",
  baseUrl: "http://127.0.0.1:1",
  reasoning: true,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 10000,
  maxTokens: 2000,
  thinkingLevelMap: {
    minimal: null,
    low: null,
    medium: null,
    high: "high",
    xhigh: null,
    max: "max",
  },
};
export const write = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    typeof value === "string" ? value : JSON.stringify(value),
  );
};
export function project() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "waypoint-unit-")));
  write(join(root, ".trellis/workflow.md"), "Native fixture workflow");
  mkdirSync(join(root, ".trellis/tasks"), { recursive: true });
  // Actual generated 0.6.17 source; not a vendored or modified production runtime.
  const native = join(root, ".pi/extensions/trellis/index.ts");
  write(
    native,
    readFileSync(join(repository, ".pi/extensions/trellis/index.ts"), "utf8"),
  );
  for (const role of ["research", "implement", "check"])
    write(
      join(root, `.pi/agents/trellis-${role}.md`),
      `Native ${role} definition`,
    );
  const tool = {
    name: "trellis_subagent",
    description: "Native fixture metadata",
    sourceInfo: {
      path: native,
      source: "local",
      scope: "project",
      origin: "top-level",
    },
    parameters: {
      type: "object",
      properties: {
        model: { type: "string" },
        thinking: {
          type: "string",
          enum: ["off", "minimal", "low", "medium", "high", "xhigh", "max"],
        },
      },
    },
  } as ToolInfo;
  const task = (name = "task", data: Record<string, unknown> = {}) => {
    const path = join(root, ".trellis/tasks", name);
    write(join(path, "task.json"), {
      title: name,
      status: "in_progress",
      children: [],
      ...data,
    });
    write(join(path, "prd.md"), "PRD-only task");
    return path;
  };
  const pointer = (ref: string, session = "session") =>
    write(
      join(
        root,
        `.trellis/.runtime/sessions/${nativeSessionKey(session)}.json`,
      ),
      { current_task: ref },
    );
  return { root, tool, task, pointer };
}
