import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const allowedExternalImports = new Set([
  "node:crypto",
  "node:fs",
  "node:fs/promises",
  "node:path",
  "node:util", // ANSI stripping after host truncation; no I/O or execution.
  "@earendil-works/pi-agent-core",
  "@earendil-works/pi-ai",
  "@earendil-works/pi-coding-agent",
  "@earendil-works/pi-tui",
]);

describe("production ownership boundaries", () => {
  it("has no process/network imports, task tools or model switching calls", async () => {
    const forbiddenCalls = new Set([
      "registerTool",
      "setModel",
      "setThinkingLevel",
      "setActiveTools",
      "sendMessage",
      "sendUserMessage",
      "spawn",
      "fork",
      "exec",
      "complete",
      "streamSimple",
      "fetch",
    ]);
    const failures: string[] = [];
    for (const filename of await readdir(join(root, "src"))) {
      if (!filename.endsWith(".ts")) continue;
      const source = ts.createSourceFile(
        filename,
        await readFile(join(root, "src", filename), "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      function visit(node: ts.Node) {
        if (
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier)
        ) {
          const name = node.moduleSpecifier.text;
          if (!name.startsWith("./") && !allowedExternalImports.has(name))
            failures.push(`${filename}: unexpected import ${name}`);
        }
        if (ts.isCallExpression(node)) {
          const expression = node.expression;
          const name = ts.isPropertyAccessExpression(expression)
            ? expression.name.text
            : ts.isIdentifier(expression)
              ? expression.text
              : undefined;
          const regexExec =
            ts.isPropertyAccessExpression(expression) &&
            expression.expression.kind ===
              ts.SyntaxKind.RegularExpressionLiteral &&
            name === "exec";
          if (name && forbiddenCalls.has(name) && !regexExec)
            failures.push(`${filename}: forbidden call ${name}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    expect(failures).toEqual([]);
  });

  it("only publishes Waypoint source and public documents", async () => {
    const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    expect(pkg.pi.extensions).toEqual(["./src/index.ts"]);
    expect(pkg.files).toContain("src/");
    expect(
      pkg.files.every((file: string) => ["src/", "README.md", "LICENSE"].includes(file)),
    ).toBe(true);
    expect(
      Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }).every(
        (name) => name.startsWith("@earendil-works/pi-"),
      ),
    ).toBe(true);
    expect(pkg.dependencies ?? {}).toEqual({});
  });
});
