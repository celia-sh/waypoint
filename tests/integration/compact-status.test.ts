import { describe, expect, it } from "vitest";
import { visibleWidth } from "@earendil-works/pi-tui";
import { parseConfig } from "../../src/config.js";
import { compactLines, type ViewState } from "../../src/ui.js";
import type { TaskNode } from "../../src/trellis.js";

const task: TaskNode = {
  path: "/project/.trellis/tasks/demo",
  ref: ".trellis/tasks/demo",
  title: "\u754c".repeat(80),
  status: "in_progress",
  archived: false,
  children: [],
  diagnostics: [],
};
const state: ViewState = {
  mode: "auto",
  current: "provider/ordinary",
  config: parseConfig({}),
  tasks: {
    root: "/project",
    active: task.path,
    nodes: new Map([[task.path, task]]),
    diagnostics: [],
  },
  diagnostics: [],
  guidance: false,
  routing: "unavailable",
};

describe("compact task status", () => {
  it.each(
    [40, 80, 120].flatMap((width) =>
      [16, 24, 40].map((height) => ({ width, height })),
    ),
  )(
    "keeps the current title visible without lifecycle suffixes at $width columns / $height rows",
    ({ width, height }) => {
      const rows = compactLines(state, width, undefined, height);
      expect(rows).toHaveLength(2);
      expect(rows).not.toContain("");
      expect(rows.every((row) => visibleWidth(row) <= width)).toBe(true);
      expect(rows[0]).not.toMatch(/Processing| \| /);
      expect(rows[0]).toContain("> ");
      expect(rows[0]).toContain("\u754c");
      expect(rows.at(-1)).toContain("@ unavailable");
    },
  );
});
