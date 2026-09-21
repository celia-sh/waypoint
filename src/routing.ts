import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { Config, Mode, ModelIdentity } from "./config.js";
import { identity, sameModel } from "./models.js";

export const POLICY_TYPE = "waypoint-routing-policy";
export function routingPolicy(
  mode: Mode,
  config: Config,
  current: ModelIdentity | undefined,
  usable: boolean,
): string | undefined {
  if (
    mode === "off" ||
    !usable ||
    !config.strongModel ||
    !config.strongThinking ||
    !current
  )
    return undefined;
  if (mode === "auto" && sameModel(current, config.strongModel))
    return undefined;
  return `Waypoint (${mode})
Default Strong model: ${identity(config.strongModel)}, thinking=${config.strongThinking}.
Explicit user model/thinking instructions take precedence within their stated scope; this preset does not override them.
Follow the normal Trellis workflow. For trellis-research, trellis-implement and trellis-check, dispatch through trellis_subagent and use the normal/current model by default, retaining native role defaults.
Choose Strong when you judge that this specific subtask materially benefits from stronger reasoning: ambiguous requirements, difficult root causes or implementation, an insufficient cheaper attempt, or semantic/architectural/lifecycle verification. Strong may research, implement, or check; do not reserve it for analysis or review. A cheaper attempt is not required.
Use the preset model/thinking arguments when choosing the default Strong option; use the user's explicit choice when applicable. The next dispatch may return to the ordinary model.
Task size or token volume alone is not a reason to select Strong. Missing evidence may instead require reproduction, logs, or a user question.`;
}

export function projectPolicy(
  messages: readonly AgentMessage[],
  policy?: string,
): AgentMessage[] {
  const projected = messages.filter(
    (message) =>
      !(message.role === "custom" && message.customType === POLICY_TYPE),
  );
  if (policy)
    projected.push({
      role: "custom",
      customType: POLICY_TYPE,
      content: policy,
      display: false,
      timestamp: 0,
    });
  return projected;
}
