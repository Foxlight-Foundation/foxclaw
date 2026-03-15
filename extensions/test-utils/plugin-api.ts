import type { FoxClawPluginApi } from "../../src/plugins/types.js";

type TestPluginApiInput = Partial<FoxClawPluginApi> &
  Pick<FoxClawPluginApi, "id" | "name" | "source" | "config" | "runtime">;

export function createTestPluginApi(api: TestPluginApiInput): FoxClawPluginApi {
  return {
    logger: { info() {}, warn() {}, error() {}, debug() {} },
    registerTool() {},
    registerHook() {},
    registerHttpRoute() {},
    registerChannel() {},
    registerGatewayMethod() {},
    registerCli() {},
    registerService() {},
    registerProvider() {},
    registerCommand() {},
    registerContextEngine() {},
    resolvePath(input: string) {
      return input;
    },
    on() {},
    ...api,
  };
}
