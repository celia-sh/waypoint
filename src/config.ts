import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  getAgentDir,
  withFileMutationQueue,
} from "@earendil-works/pi-coding-agent";

export type Mode = "auto" | "on" | "off";
export interface ModelIdentity {
  provider: string;
  id: string;
}
export interface Config {
  defaultMode: Mode;
  strongModel?: ModelIdentity;
  strongThinking?: string;
}
export interface ConfigState {
  config: Config;
  raw: Record<string, unknown>;
  diagnostics: string[];
  writable: boolean;
}
export const MODE_ENTRY = "waypoint-mode";
export const isMode = (value: unknown): value is Mode =>
  value === "auto" || value === "on" || value === "off";
export const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function parseConfig(raw: unknown): ConfigState {
  const config: Config = { defaultMode: "auto" };
  if (!object(raw))
    return {
      config,
      raw: {},
      diagnostics: [
        "waypoint.json must contain an object; repair the file before saving.",
      ],
      writable: false,
    };
  const diagnostics: string[] = [];
  if (raw.defaultMode !== undefined) {
    if (isMode(raw.defaultMode)) config.defaultMode = raw.defaultMode;
    else
      diagnostics.push(
        "Invalid defaultMode in waypoint.json; use auto, on or off.",
      );
  }
  if (raw.strongModel !== undefined) {
    if (
      object(raw.strongModel) &&
      nonempty(raw.strongModel.provider) &&
      nonempty(raw.strongModel.id)
    ) {
      config.strongModel = {
        provider: raw.strongModel.provider,
        id: raw.strongModel.id,
      };
    } else
      diagnostics.push(
        "Invalid strongModel in waypoint.json; select a provider/model identity.",
      );
  }
  if (raw.strongThinking !== undefined) {
    if (nonempty(raw.strongThinking))
      config.strongThinking = raw.strongThinking;
    else
      diagnostics.push(
        "Invalid strongThinking in waypoint.json; select a supported level.",
      );
  }
  return { config, raw, diagnostics, writable: true };
}

export class ConfigStore {
  readonly path: string;
  constructor(agentDir = getAgentDir()) {
    this.path = join(agentDir, "waypoint.json");
  }

  async load(): Promise<ConfigState> {
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    try {
      handle = await open(this.path, constants.O_RDONLY | constants.O_NONBLOCK);
      const stat = await handle.stat();
      const maximum = 128 * 1024;
      if (!stat.isFile() || stat.size > maximum)
        throw new Error("Unsupported configuration file");
      const bytes = Buffer.alloc(maximum + 1);
      let length = 0;
      while (length < bytes.length) {
        const { bytesRead } = await handle.read(
          bytes,
          length,
          bytes.length - length,
          null,
        );
        if (!bytesRead) break;
        length += bytesRead;
      }
      if (length > maximum) throw new Error("Configuration exceeds size bound");
      return parseConfig(
        JSON.parse(bytes.subarray(0, length).toString("utf8")),
      );
    } catch (error) {
      if (object(error) && error.code === "ENOENT") return parseConfig({});
      return {
        ...parseConfig({}),
        writable: false,
        diagnostics: [
          `Cannot read ${this.path}; repair the configuration before saving.`,
        ],
      };
    } finally {
      await handle?.close();
    }
  }

  save(selection: {
    strongModel: ModelIdentity;
    strongThinking: string;
  }): Promise<ConfigState> {
    return withFileMutationQueue(this.path, async () => {
      const previous = await this.load();
      if (!previous.writable) throw new Error(previous.diagnostics.join(" "));
      const next = parseConfig({ ...previous.raw, ...selection });
      if (next.diagnostics.length) throw new Error(next.diagnostics.join(" "));
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.${randomUUID()}.tmp`;
      try {
        const handle = await open(temporary, "wx", 0o600);
        try {
          await handle.writeFile(`${JSON.stringify(next.raw, null, 2)}\n`);
          await handle.sync();
        } finally {
          await handle.close();
        }
        await rename(temporary, this.path);
      } finally {
        await unlink(temporary).catch(() => undefined);
      }
      return next;
    });
  }
}

export function restoreMode(
  entries: readonly unknown[],
  since?: string,
): Mode | undefined {
  let mode: Mode | undefined;
  for (const entry of entries) {
    if (
      since &&
      (!object(entry) ||
        typeof entry.timestamp !== "string" ||
        !(Date.parse(entry.timestamp) >= Date.parse(since)))
    )
      continue;
    if (
      object(entry) &&
      entry.type === "custom" &&
      entry.customType === MODE_ENTRY &&
      object(entry.data) &&
      isMode(entry.data.mode)
    )
      mode = entry.data.mode;
  }
  return mode;
}
