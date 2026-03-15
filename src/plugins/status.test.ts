import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPluginStatusReport } from "./status.js";

const loadConfigMock = vi.fn();
const loadFoxClawPluginsMock = vi.fn();

vi.mock("../config/config.js", () => ({
  loadConfig: () => loadConfigMock(),
}));

vi.mock("./loader.js", () => ({
  loadFoxClawPlugins: (...args: unknown[]) => loadFoxClawPluginsMock(...args),
}));

vi.mock("../agents/agent-scope.js", () => ({
  resolveAgentWorkspaceDir: () => undefined,
  resolveDefaultAgentId: () => "default",
}));

vi.mock("../agents/workspace.js", () => ({
  resolveDefaultAgentWorkspaceDir: () => "/default-workspace",
}));

describe("buildPluginStatusReport", () => {
  beforeEach(() => {
    loadConfigMock.mockReset();
    loadFoxClawPluginsMock.mockReset();
    loadConfigMock.mockReturnValue({});
    loadFoxClawPluginsMock.mockReturnValue({
      plugins: [],
      diagnostics: [],
      channels: [],
      providers: [],
      tools: [],
      hooks: [],
      gatewayHandlers: {},
      cliRegistrars: [],
      services: [],
      commands: [],
    });
  });

  it("forwards an explicit env to plugin loading", () => {
    const env = { HOME: "/tmp/foxclaw-home" } as NodeJS.ProcessEnv;

    buildPluginStatusReport({
      config: {},
      workspaceDir: "/workspace",
      env,
    });

    expect(loadFoxClawPluginsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {},
        workspaceDir: "/workspace",
        env,
      }),
    );
  });
});
