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
  it("separates delegation from model strength and keeps Strong evidence-backed", () => {
    const policy = routingPolicy("auto", config, ordinary, true);
    for (const fragment of [
      "trellis-research",
      "trellis-implement",
      "trellis-check",
      "trellis_subagent",
      "Delegation and model strength are separate decisions",
      "even when the work is simple",
      "Simple delegated work normally uses the ordinary/current model",
      "Routine repository inspection",
      "concrete reasoning bottleneck",
      "Direct Strong dispatch is allowed",
      "A cheaper attempt is not required",
      "Ambiguity or missing evidence alone is not a Strong reason",
      "failed ordinary attempt is evidence, not automatic escalation",
      "Model choice does not automatically carry",
      "Do not automatically pair ordinary implementation with Strong checking",
      "Explicit user model/thinking instructions take precedence",
      "Strong may research, implement, or check",
    ])
      expect(policy).toContain(fragment);
    expect(policy).not.toContain("Choose Strong when you judge");
    expect(policy).not.toContain("ambiguous requirements");
    expect(policy).not.toContain("semantic/architectural/lifecycle verification");
    expect(policy).not.toContain("A cheaper attempt is not required.\n");
  });
  it("projects one live block before the latest user and preserves original context", () => {
    const original: AgentMessage[] = [
      {
        role: "custom",
        customType: "native",
        content: "Earlier native context",
        display: false,
        timestamp: 0,
      },
      {
        role: "user",
        content: "Earlier request",
        timestamp: 1,
      },
      {
        role: "custom",
        customType: "trellis",
        content: "native context",
        display: false,
        timestamp: 2,
      },
      {
        role: "user",
        content: "Use my-provider/model for this check",
        timestamp: 3,
      },
    ];
    const policy = routingPolicy("auto", config, ordinary, true);
    const first = projectPolicy(original, policy);
    const policyIndex = first.findIndex(
      (message) =>
        message.role === "custom" && message.customType === POLICY_TYPE,
    );
    expect(policyIndex).toBe(3);
    expect(first[policyIndex + 1]).toEqual(original[3]);
    expect(first.filter((message) => message.role === "user")).toEqual(
      original.filter((message) => message.role === "user"),
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
    const nextPolicyIndex = next.findIndex(
      (message) =>
        message.role === "custom" && message.customType === POLICY_TYPE,
    );
    expect(nextPolicyIndex).toBe(3);
    expect(next[nextPolicyIndex + 1]).toEqual(original[3]);
    expect(JSON.stringify(next)).toContain("thinking=high");
    expect(JSON.stringify(next)).not.toContain("thinking=max");
    expect(projectPolicy(next)).toEqual(original);
    expect(original).toHaveLength(4);
  });
  it("appends when there is no user and removes the ephemeral block when disabled", () => {
    const original: AgentMessage[] = [
      {
        role: "custom",
        customType: "native",
        content: "No user yet",
        display: false,
        timestamp: 1,
      },
    ];
    const projected = projectPolicy(original, "rebuilt");
    expect(projected).toHaveLength(2);
    expect(projected[0]).toEqual(original[0]);
    expect(projected[1]).toMatchObject({
      role: "custom",
      customType: POLICY_TYPE,
      content: "rebuilt",
    });
    expect(projectPolicy(projected)).toEqual(original);
  });
});
