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
Follow the normal Trellis workflow. For trellis-research, trellis-implement and trellis-check, dispatch through trellis_subagent and retain native role defaults.
Delegation and model strength are separate decisions. Delegate bounded research, implementation, or checking when keeping repository exploration, tool output, or execution detail out of the main session is useful, even when the work is simple. Simple delegated work normally uses the ordinary/current model; simple work need not remain in the main session.
The ordinary/current model is the model-tier default for each dispatch. Routine repository inspection, evidence gathering, straightforward call-path tracing, obvious checks, routine implementation, and mechanical validation normally use it, whether or not that work is delegated.
Choose Strong only when existing evidence identifies a concrete reasoning bottleneck and stronger reasoning is likely to materially change the result. Strong may research, implement, or check; it is not reserved for analysis or review. Direct Strong dispatch is allowed when the bottleneck is already evident. A cheaper attempt is not required when that bottleneck is already evident.
Ambiguity or missing evidence alone is not a Strong reason; ordinary delegated research, reproduction, logs, or a user question may be more appropriate. A failed ordinary attempt is evidence, not automatic escalation: local/actionable feedback may justify ordinary recovery, while deeper complexity, competing hypotheses, or inadequate progress may justify Strong.
Model choice does not automatically carry into a later research, implementation, or checking dispatch. Do not automatically pair ordinary implementation with Strong checking. Later choices use the existing evidence for that subtask without a ritual investigation merely to justify a tier. Strong checking fits meaningful semantic risk beyond routine tests and ordinary scoped review, or a difficult semantic scope already evident.
Use the preset model/thinking arguments when choosing the default Strong option; use the user's explicit choice when applicable. Task size or token volume alone is not a reason to select Strong.`;
}

export function projectPolicy(
  messages: readonly AgentMessage[],
  policy?: string,
): AgentMessage[] {
  const projected = messages.filter(
    (message) =>
      !(message.role === "custom" && message.customType === POLICY_TYPE),
  );
  if (!policy) return projected;

  const policyMessage: AgentMessage = {
    role: "custom",
    customType: POLICY_TYPE,
    content: policy,
    display: false,
    timestamp: 0,
  };
  let latestUser = -1;
  for (let index = projected.length - 1; index >= 0; index--) {
    if (projected[index]?.role === "user") {
      latestUser = index;
      break;
    }
  }
  if (latestUser < 0) projected.push(policyMessage);
  else projected.splice(latestUser, 0, policyMessage);
  return projected;
}
