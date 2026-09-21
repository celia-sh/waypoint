import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ConfigStore,
  MODE_ENTRY,
  parseConfig,
  restoreMode,
} from "../../src/config.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});
async function store() {
  const path = await mkdtemp(join(tmpdir(), "waypoint-config-"));
  directories.push(path);
  return new ConfigStore(path);
}

describe("configuration", () => {
  it("starts Auto without choosing Strong", async () => {
    expect((await (await store()).load()).config).toEqual({
      defaultMode: "auto",
    });
  });
  it.skipIf(process.platform === "win32")(
    "rejects a named pipe without blocking or overwriting it",
    async () => {
      const config = await store();
      execFileSync("mkfifo", [config.path]);
      expect((await config.load()).writable).toBe(false);
    },
  );
  it("preserves corrupt original bytes and refuses destructive recovery", async () => {
    const config = await store();
    await writeFile(config.path, "{broken");
    expect((await config.load()).writable).toBe(false);
    await expect(
      config.save({
        strongModel: { provider: "p", id: "m" },
        strongThinking: "max",
      }),
    ).rejects.toThrow("repair");
    expect(await readFile(config.path, "utf8")).toBe("{broken");
  });
  it("preserves future keys and serializes atomic selections", async () => {
    const config = await store();
    await writeFile(
      config.path,
      JSON.stringify({
        defaultMode: "on",
        future: { preserved: true },
        strongThinking: "future-level",
      }),
    );
    expect((await config.load()).config.strongThinking).toBe("future-level");
    await Promise.all(
      ["a", "b"].map((id) =>
        config.save({
          strongModel: { provider: "p", id },
          strongThinking: "max",
        }),
      ),
    );
    expect(JSON.parse(await readFile(config.path, "utf8"))).toEqual({
      defaultMode: "on",
      future: { preserved: true },
      strongModel: { provider: "p", id: "b" },
      strongThinking: "max",
    });
  });
  it("diagnoses invalid values without rewriting or pretending they are usable", () => {
    const invalid = parseConfig({
      defaultMode: "sometimes",
      strongModel: "guess",
      strongThinking: 5,
    });
    expect(invalid.diagnostics).toHaveLength(3);
    expect(invalid.raw.strongThinking).toBe(5);
    expect(parseConfig(null).writable).toBe(false);
  });
  it("replays only mode entries supplied from the active branch", () => {
    expect(
      restoreMode([
        { type: "custom", customType: MODE_ENTRY, data: { mode: "on" } },
        { type: "custom", customType: "other", data: { mode: "off" } },
      ]),
    ).toBe("on");
    expect(restoreMode([])).toBeUndefined();
    expect(
      restoreMode(
        [
          {
            type: "custom",
            customType: MODE_ENTRY,
            data: { mode: "on" },
            timestamp: "2026-09-19T00:00:00Z",
          },
        ],
        "2026-09-20T00:00:00Z",
      ),
    ).toBeUndefined();
    expect(
      restoreMode([
        { type: "custom", customType: MODE_ENTRY, data: { mode: "invalid" } },
      ]),
    ).toBeUndefined();
  });
});
