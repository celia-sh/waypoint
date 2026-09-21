import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { repository } from "./fixtures.js";

describe("production ownership boundaries", () => {
  it("has no model calls, agent/runtime creation, dispatch wrappers or native file writes", () => {
    const disallowed = new Set([
      "spawn",
      "spawnSync",
      "execSync",
      "fork",
      "createAgentSession",
      "complete",
      "completeSimple",
      "stream",
      "streamSimple",
      "sendMessage",
      "sendUserMessage",
      "registerTool",
      "setModel",
      "setThinkingLevel",
      "setActiveTools",
      "compact",
    ]);
    const fileWrites = new Set([
      "writeFile",
      "writeFileSync",
      "rename",
      "renameSync",
      "unlink",
      "unlinkSync",
      "mkdir",
      "mkdirSync",
      "rm",
      "rmSync",
    ]);
    for (const file of readdirSync(join(repository, "src"))) {
      const source = readFileSync(join(repository, "src", file), "utf8");
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier)
        )
          expect(node.moduleSpecifier.text).not.toMatch(
            /child_process|todo|subagents/,
          );
        if (ts.isCallExpression(node)) {
          const name = ts.isIdentifier(node.expression)
            ? node.expression.text
            : ts.isPropertyAccessExpression(node.expression)
              ? node.expression.name.text
              : undefined;
          if (name) {
            expect(disallowed.has(name), `${file}: forbidden ${name}`).toBe(
              false,
            );
            if (file !== "config.ts")
              expect(
                fileWrites.has(name),
                `${file}: writes outside configuration`,
              ).toBe(false);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
    }
  });
  it("has no subagent execution observer, replay projection, or activity capability", () => {
    const source = readdirSync(join(repository, "src"))
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(join(repository, "src", file), "utf8"))
      .join("\n");
    expect(source).not.toMatch(
      /tool_execution_(?:start|update|end)|\bProjection\b|\.replay\(|\.forTask\(|trellis-subagent-progress|Activity:|pass complete|final scope|incomplete[- ]history|requestedModel|reportedModel/,
    );
  });
  it("publishes only source and public docs, with no runtime dependencies", () => {
    const manifest = JSON.parse(
      readFileSync(join(repository, "package.json"), "utf8"),
    );
    expect(manifest.files).toEqual(["src/", "README.md", "LICENSE"]);
    expect(manifest.license).toBe("AGPL-3.0-or-later");
    expect(manifest.pi.extensions).toEqual(["./src/index.ts"]);
    expect(manifest.dependencies).toBeUndefined();
  });
});
