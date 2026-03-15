import { createPluginRuntimeStore } from "foxclaw/plugin-sdk/compat";
import type { PluginRuntime } from "foxclaw/plugin-sdk/twitch";

const { setRuntime: setTwitchRuntime, getRuntime: getTwitchRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Twitch runtime not initialized");
export { getTwitchRuntime, setTwitchRuntime };
