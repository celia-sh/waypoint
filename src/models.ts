import {
  type Api,
  getSupportedThinkingLevels,
  type Model,
} from "@earendil-works/pi-ai";
import type { Config, ModelIdentity } from "./config.js";

export type AvailableModel = Model<Api>;
export const identity = (model?: ModelIdentity): string =>
  model ? `${model.provider}/${model.id}` : "not set";
export const sameModel = (a?: ModelIdentity, b?: ModelIdentity): boolean =>
  !!a && !!b && a.provider === b.provider && a.id === b.id;

export interface DispatchCapability {
  routing: boolean;
  thinking: string[];
  diagnostics: string[];
}

export function supportedThinking(
  model: AvailableModel,
  capability: DispatchCapability,
): string[] {
  if (!capability.routing) return [];
  return getSupportedThinkingLevels(model).filter((level) =>
    capability.thinking.includes(level),
  );
}

export function checkStrong(
  config: Config,
  models: readonly AvailableModel[],
  capability: DispatchCapability,
): { model?: AvailableModel; levels: string[]; diagnostics: string[] } {
  const diagnostics: string[] = [];
  if (!config.strongModel)
    return {
      levels: [],
      diagnostics: ["Strong Model is not set; use /waypoint model."],
    };
  const model = models.find((candidate) =>
    sameModel(candidate, config.strongModel),
  );
  if (!model)
    return {
      levels: [],
      diagnostics: [
        `Strong Model ${identity(config.strongModel)} is unavailable in Pi; check provider configuration or select another model.`,
      ],
    };
  const levels = supportedThinking(model, capability);
  if (!config.strongThinking)
    diagnostics.push("Strong Thinking is not set; use /waypoint thinking.");
  else if (!levels.includes(config.strongThinking))
    diagnostics.push(
      `Saved Strong Thinking '${config.strongThinking}' is unsupported by this model/native dispatch; use /waypoint thinking. Saved value is unchanged.`,
    );
  return { model, levels, diagnostics };
}
