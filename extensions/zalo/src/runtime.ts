import { createPluginRuntimeStore } from "foxclaw/plugin-sdk/compat";
import type { PluginRuntime } from "foxclaw/plugin-sdk/zalo";

const { setRuntime: setZaloRuntime, getRuntime: getZaloRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Zalo runtime not initialized");
export { getZaloRuntime, setZaloRuntime };
