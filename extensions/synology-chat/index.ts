import type { FoxClawPluginApi } from "foxclaw/plugin-sdk/synology-chat";
import { emptyPluginConfigSchema } from "foxclaw/plugin-sdk/synology-chat";
import { createSynologyChatPlugin } from "./src/channel.js";
import { setSynologyRuntime } from "./src/runtime.js";

const plugin = {
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for FoxClaw",
  configSchema: emptyPluginConfigSchema(),
  register(api: FoxClawPluginApi) {
    setSynologyRuntime(api.runtime);
    api.registerChannel({ plugin: createSynologyChatPlugin() });
  },
};

export default plugin;
