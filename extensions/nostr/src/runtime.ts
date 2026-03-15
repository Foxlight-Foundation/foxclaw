import { createPluginRuntimeStore } from "foxclaw/plugin-sdk/compat";
import type { PluginRuntime } from "foxclaw/plugin-sdk/nostr";

const { setRuntime: setNostrRuntime, getRuntime: getNostrRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Nostr runtime not initialized");
export { getNostrRuntime, setNostrRuntime };
