import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChannelPlugin: vi.fn(),
  loadFoxClawPlugins: vi.fn(),
}));

const TEST_WORKSPACE_ROOT = "/tmp/foxclaw-test-workspace";

function normalizeChannel(value?: string) {
  return value?.trim().toLowerCase() ?? undefined;
}

function applyPluginAutoEnableForTests(config: unknown) {
  return { config, changes: [] as unknown[] };
}

function createTestPlugin() {
  return {
    id: "matrix",
    meta: { label: "Matrix" },
    config: {
      listAccountIds: () => [],
      resolveAccount: () => ({}),
    },
  };
}

vi.mock("../../channels/plugins/index.js", () => ({
  getChannelPlugin: mocks.getChannelPlugin,
  normalizeChannelId: normalizeChannel,
}));

vi.mock("../../agents/agent-scope.js", () => ({
  resolveDefaultAgentId: () => "main",
  resolveAgentWorkspaceDir: () => TEST_WORKSPACE_ROOT,
}));

vi.mock("../../plugins/loader.js", () => ({
  loadFoxClawPlugins: mocks.loadFoxClawPlugins,
}));

vi.mock("../../config/plugin-auto-enable.js", () => ({
  applyPluginAutoEnable(args: { config: unknown }) {
    return applyPluginAutoEnableForTests(args.config);
  },
}));

vi.mock("../../utils/message-channel.js", async () => {
  const actual = await vi.importActual<typeof import("../../utils/message-channel.js")>(
    "../../utils/message-channel.js",
  );
  return {
    ...actual,
    normalizeMessageChannel: (value?: string | null) =>
      typeof value === "string" ? value.trim().toLowerCase() || undefined : undefined,
    isDeliverableMessageChannel: () => true,
    listDeliverableMessageChannels: () => ["slack", "matrix"],
  };
});

import { setActivePluginRegistry } from "../../plugins/runtime.js";
import { createTestRegistry } from "../../test-utils/channel-plugins.js";
import { resolveOutboundTarget } from "./targets.js";

describe("resolveOutboundTarget channel resolution", () => {
  let registrySeq = 0;
  const resolveTestTarget = () =>
    resolveOutboundTarget({
      channel: "matrix",
      to: "!room:example.com",
      cfg: { channels: { matrix: { homeserver: "https://example.com" } } },
      mode: "explicit",
    });

  beforeEach(() => {
    registrySeq += 1;
    setActivePluginRegistry(createTestRegistry([]), `targets-test-${registrySeq}`);
    mocks.getChannelPlugin.mockReset();
    mocks.loadFoxClawPlugins.mockReset();
  });

  it("recovers plugin resolution so announce delivery does not fail with Unsupported channel", () => {
    const testPlugin = createTestPlugin();
    mocks.getChannelPlugin
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(testPlugin)
      .mockReturnValue(testPlugin);

    const result = resolveTestTarget();

    expect(result).toEqual({ ok: true, to: "!room:example.com" });
    expect(mocks.loadFoxClawPlugins).toHaveBeenCalledTimes(1);
  });

  it("retries bootstrap on subsequent resolve when the first bootstrap attempt fails", () => {
    const testPlugin = createTestPlugin();
    mocks.getChannelPlugin
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(testPlugin)
      .mockReturnValue(testPlugin);
    mocks.loadFoxClawPlugins
      .mockImplementationOnce(() => {
        throw new Error("bootstrap failed");
      })
      .mockImplementation(() => undefined);

    const first = resolveTestTarget();
    const second = resolveTestTarget();

    expect(first.ok).toBe(false);
    expect(second).toEqual({ ok: true, to: "!room:example.com" });
    expect(mocks.loadFoxClawPlugins).toHaveBeenCalledTimes(2);
  });
});
