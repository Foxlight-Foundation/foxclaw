// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to symbols used under extensions/diffs.

export type { FoxClawConfig } from "../config/config.js";
export { resolvePreferredFoxClawTmpDir } from "../infra/tmp-foxclaw-dir.js";
export type {
  AnyAgentTool,
  FoxClawPluginApi,
  FoxClawPluginConfigSchema,
  PluginLogger,
} from "../plugins/types.js";
