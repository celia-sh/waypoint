import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const nativePath = join(root, ".pi/extensions/trellis/index.ts");
const requireFromHost = createRequire(
  import.meta.resolve("@earendil-works/pi-coding-agent"),
);
type NativeResult = {
  content: { type: string; text: string }[];
  details: {
    kind: string;
    final: boolean;
    runs: { status: string; model?: string; thinking?: string }[];
  };
};
type NativeTool = {
  name: string;
  parameters: {
    properties: { model: { type: string }; thinking: { enum: string[] } };
  };
  execute: (
    id: string,
    input: { agent: string; prompt: string; model?: string; thinking?: string },
    signal: AbortSignal | undefined,
    update: (result: NativeResult) => void,
    ctx: unknown,
  ) => Promise<NativeResult>;
};

async function loadNative() {
  vi.stubEnv("TRELLIS_SUBAGENT_CHILD", "0");
  const { createJiti } = await import(requireFromHost.resolve("jiti"));
  const jiti = createJiti(import.meta.url, { fsCache: false });
  const extension = await jiti.import(nativePath, { default: true });
  let tool: NativeTool | undefined;
  extension({
    registerTool: (registered: NativeTool) => {
      tool = registered;
    },
    getThinkingLevel: () => "high",
  });
  if (!tool) throw new Error("Native Trellis did not register its tool");
  return tool;
}

const temporaryDirectories: string[] = [];
beforeEach(() => vi.stubEnv("TRELLIS_SUBAGENT_CHILD", "0"));
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("actual generated Trellis 0.6.17 contract", () => {
  it("retains the original integration and exposes model/max dispatch", async () => {
    const hashes = JSON.parse(
      await readFile(join(root, ".trellis/.template-hashes.json"), "utf8"),
    );
    expect(
      createHash("sha256")
        .update(await readFile(nativePath))
        .digest("hex"),
    ).toBe(hashes.hashes[".pi/extensions/trellis/index.ts"]);
    const tool = await loadNative();
    expect(tool.name).toBe("trellis_subagent");
    expect(tool.parameters.properties.model.type).toBe("string");
    expect(tool.parameters.properties.thinking.enum).toContain("max");
  });

  it("probes real native forwarding without models: max is forwarded but explicit off is omitted", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waypoint-native-contract-"));
    temporaryDirectories.push(dir);
    const cli = join(dir, "fake-pi.mjs");
    const captured = join(dir, "captured.json");
    await writeFile(
      cli,
      `
import {writeFileSync} from 'node:fs';
let prompt = '';
for await (const chunk of process.stdin) prompt += chunk;
writeFileSync(process.env.WAYPOINT_CAPTURE, JSON.stringify({args:process.argv.slice(2), prompt, child:process.env.TRELLIS_SUBAGENT_CHILD}));
console.log(JSON.stringify({type:'message_end',message:{role:'assistant',model:'sample',content:[{type:'text',text:'Local fixture completed'}],stopReason:'stop'}}));
`,
    );
    vi.stubEnv("TRELLIS_PI_CLI_JS", cli);
    vi.stubEnv("WAYPOINT_CAPTURE", captured);
    const tool = await loadNative();
    for (const thinking of ["max", "off"]) {
      const updates: NativeResult[] = [];
      const result = await tool.execute(
        `fixture-${thinking}`,
        {
          agent: "trellis-research",
          model: "fixture/sample",
          thinking,
          prompt:
            "Active task: .trellis/tasks/09-20-waypoint-v1\nLocal no-network contract fixture; do not implement anything.",
        },
        undefined,
        (update) => updates.push(structuredClone(update)),
        {
          cwd: root,
          sessionManager: {
            getSessionId: () => "waypoint-contract-no-active-task",
          },
          model: { provider: "fixture", id: "ordinary" },
        },
      );
      const capture = JSON.parse(await readFile(captured, "utf8"));
      expect(capture.child).toBe("1");
      expect(capture.prompt).toContain("Research Agent");
      expect(capture.args).toContain("--no-session");
      expect(capture.args[capture.args.indexOf("--model") + 1]).toBe(
        thinking === "max" ? "fixture/sample:max" : "fixture/sample",
      );
      expect(capture.args).not.toContain("--thinking");
      expect(result.details.kind).toBe("trellis-subagent-progress");
      expect(result.details.final).toBe(true);
      expect(result.details.runs[0]?.status).toBe("succeeded");
      expect(result.details.runs[0]?.thinking).toBe(thinking);
      expect(updates.length).toBeGreaterThan(0);
      expect(
        updates.every(
          (update) => update.details.kind === "trellis-subagent-progress",
        ),
      ).toBe(true);
    }
  });
});
