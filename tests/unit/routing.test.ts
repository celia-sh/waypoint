import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { describe, expect, it } from "vitest";
import {
  checkStrong,
  sameModel,
  supportedThinking,
  type DispatchCapability,
} from "../../src/models.js";
import {
  POLICY_TYPE,
  projectPolicy,
  routingPolicy,
} from "../../src/routing.js";
import { model } from "./fixtures.js";

const capability: DispatchCapability = {
  routing: true,
  thinking: ["minimal", "low", "medium", "high", "xhigh", "max"],
  diagnostics: [],
};
const config = {
  defaultMode: "auto" as const,
  strongModel: { provider: model.provider, id: model.id },
  strongThinking: "max",
};
const ordinary = { provider: "fixture", id: "ordinary" };

describe("registry and advisory policy", () => {
  it("intersects actual Pi noncontiguous levels without an xhigh ceiling", () => {
    expect(supportedThinking(model, capability)).toEqual(["high", "max"]);
    expect(
      supportedThinking({ ...model, reasoning: false }, capability),
    ).toEqual([]);
    expect(
      supportedThinking(model, { ...capability, thinking: ["high"] }),
    ).toEqual(["high"]);
  });
  it("preserves unsupported saved off and future levels as diagnostics", () => {
    for (const strongThinking of ["off", "future"]) {
      const saved = { ...config, strongThinking };
      expect(
        checkStrong(saved, [model], capability).diagnostics.join(),
      ).toContain(strongThinking);
      expect(saved.strongThinking).toBe(strongThinking);
    }
    expect(checkStrong(config, [], capability).diagnostics.join()).toContain(
      "unavailable",
    );
  });
  it("uses provider and id equality, not model name or thinking", () => {
    expect(sameModel(model, config.strongModel)).toBe(true);
    expect(sameModel(model, { ...model, provider: "another" })).toBe(false);
    expect(routingPolicy("auto", config, model, true)).toBeUndefined();
    expect(routingPolicy("on", config, model, true)).toContain(
      "Default Strong",
    );
    expect(routingPolicy("off", config, ordinary, true)).toBeUndefined();
    expect(routingPolicy("auto", config, ordinary, false)).toBeUndefined();
    expect(routingPolicy("auto", config, undefined, true)).toBeUndefined();
  });
  it("offers all native roles, scoped user precedence and no forced cheap-first rule", () => {
    const policy = routingPolicy("auto", config, ordinary, true);
    for (const fragment of [
      "trellis-research",
      "trellis-implement",
      "trellis-check",
      "trellis_subagent",
      "Explicit user model/thinking instructions take precedence",
      "Strong may research, implement, or check",
      "A cheaper attempt is not required",
    ])
      expect(policy).toContain(fragment);
  });
  it("projects exactly one live block and preserves all original context on continuations", () => {
    const original: AgentMessage[] = [
      {
        role: "user",
        content: "Use my-provider/model for this check",
        timestamp: 1,
      },
      {
        role: "custom",
        customType: "trellis",
        content: "native context",
        display: false,
        timestamp: 2,
      },
    ];
    const first = projectPolicy(
      original,
      routingPolicy("auto", config, ordinary, true),
    );
    const next = projectPolicy(
      first,
      routingPolicy(
        "on",
        { ...config, strongThinking: "high" },
        ordinary,
        true,
      ),
    );
    expect(
      next.filter(
        (message) =>
          message.role === "custom" && message.customType === POLICY_TYPE,
      ),
    ).toHaveLength(1);
    expect(next.slice(0, 2)).toEqual(original);
    expect(JSON.stringify(next)).toContain("thinking=high");
    expect(JSON.stringify(next)).not.toContain("thinking=max");
    expect(projectPolicy(next)).toEqual(original);
    expect(original).toHaveLength(2);
    expect(projectPolicy([], "rebuilt")).toHaveLength(1);
  });
});
