import { createPluginRuntimeStore } from "foxclaw/plugin-sdk/compat";
import type { PluginRuntime } from "foxclaw/plugin-sdk/imessage";

const { setRuntime: setIMessageRuntime, getRuntime: getIMessageRuntime } =
  createPluginRuntimeStore<PluginRuntime>("iMessage runtime not initialized");
export { getIMessageRuntime, setIMessageRuntime };
