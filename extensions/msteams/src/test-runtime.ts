import os from "node:os";
import path from "node:path";
import type { PluginRuntime } from "foxclaw/plugin-sdk/msteams";

export const msteamsRuntimeStub = {
  state: {
    resolveStateDir: (env: NodeJS.ProcessEnv = process.env, homedir?: () => string) => {
      const override = env.FOXCLAW_STATE_DIR?.trim() || env.FOXCLAW_STATE_DIR?.trim();
      if (override) {
        return override;
      }
      const resolvedHome = homedir ? homedir() : os.homedir();
      return path.join(resolvedHome, ".foxclaw");
    },
  },
} as unknown as PluginRuntime;
