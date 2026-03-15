import type { FoxClawConfig } from "../config/config.js";
import { loadFoxClawPlugins } from "../plugins/loader.js";
import { resolveUserPath } from "../utils.js";

export function ensureRuntimePluginsLoaded(params: {
  config?: FoxClawConfig;
  workspaceDir?: string | null;
}): void {
  const workspaceDir =
    typeof params.workspaceDir === "string" && params.workspaceDir.trim()
      ? resolveUserPath(params.workspaceDir)
      : undefined;

  loadFoxClawPlugins({
    config: params.config,
    workspaceDir,
  });
}
