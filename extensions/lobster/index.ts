import type {
  AnyAgentTool,
  FoxClawPluginApi,
  FoxClawPluginToolFactory,
} from "foxclaw/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: FoxClawPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as FoxClawPluginToolFactory,
    { optional: true },
  );
}
