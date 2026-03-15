import type { FoxClawPluginApi } from "foxclaw/plugin-sdk/googlechat";
import { emptyPluginConfigSchema } from "foxclaw/plugin-sdk/googlechat";
import { googlechatDock, googlechatPlugin } from "./src/channel.js";
import { setGoogleChatRuntime } from "./src/runtime.js";

const plugin = {
  id: "googlechat",
  name: "Google Chat",
  description: "FoxClaw Google Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: FoxClawPluginApi) {
    setGoogleChatRuntime(api.runtime);
    api.registerChannel({ plugin: googlechatPlugin, dock: googlechatDock });
  },
};

export default plugin;
