import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChannelPlugin: vi.fn(),
  resolveOutboundTarget: vi.fn(),
  deliverOutboundPayloads: vi.fn(),
  loadFoxClawPlugins: vi.fn(),
}));

vi.mock("../../channels/plugins/index.js", () => ({
  normalizeChannelId: (channel?: string) => channel?.trim().toLowerCase() ?? undefined,
  getChannelPlugin: mocks.getChannelPlugin,
  listChannelPlugins: () => [],
}));

vi.mock("../../agents/agent-scope.js", () => ({
  resolveDefaultAgentId: () => "main",
  resolveSessionAgentId: ({
    sessionKey,
  }: {
    sessionKey?: string;
    config?: unknown;
    agentId?: string;
  }) => {
    const match = sessionKey?.match(/^agent:([^:]+)/i);
    return match?.[1] ?? "main";
  },
  resolveAgentWorkspaceDir: () => "/tmp/foxclaw-test-workspace",
}));

vi.mock("../../config/plugin-auto-enable.js", () => ({
  applyPluginAutoEnable: ({ config }: { config: unknown }) => ({ config, changes: [] }),
}));

vi.mock("../../plugins/loader.js", () => ({
  loadFoxClawPlugins: mocks.loadFoxClawPlugins,
}));

vi.mock("./channel-selection.js", () => ({
  resolveMessageChannelSelection: async ({ channel }: { channel?: string }) => ({
    channel: channel?.trim().toLowerCase() ?? "slack",
    configured: [],
    source: "explicit",
  }),
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

vi.mock("./targets.js", () => ({
  resolveOutboundTarget: mocks.resolveOutboundTarget,
}));

vi.mock("./deliver.js", () => ({
  deliverOutboundPayloads: mocks.deliverOutboundPayloads,
}));

import { setActivePluginRegistry } from "../../plugins/runtime.js";
import { createTestRegistry } from "../../test-utils/channel-plugins.js";
import { sendMessage } from "./message.js";

describe("sendMessage", () => {
  beforeEach(() => {
    setActivePluginRegistry(createTestRegistry([]));
    mocks.getChannelPlugin.mockClear();
    mocks.resolveOutboundTarget.mockClear();
    mocks.deliverOutboundPayloads.mockClear();
    mocks.loadFoxClawPlugins.mockClear();

    mocks.getChannelPlugin.mockReturnValue({
      outbound: { deliveryMode: "direct" },
    });
    mocks.resolveOutboundTarget.mockImplementation(({ to }: { to: string }) => ({ ok: true, to }));
    mocks.deliverOutboundPayloads.mockResolvedValue([{ channel: "slack", messageId: "m1" }]);
  });

  it("passes explicit agentId to outbound delivery for scoped media roots", async () => {
    await sendMessage({
      cfg: {},
      channel: "slack",
      to: "C123",
      content: "hi",
      agentId: "work",
    });

    expect(mocks.deliverOutboundPayloads).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({ agentId: "work" }),
        channel: "slack",
        to: "C123",
      }),
    );
  });

  it("propagates the send idempotency key into mirrored transcript delivery", async () => {
    await sendMessage({
      cfg: {},
      channel: "slack",
      to: "C123",
      content: "hi",
      idempotencyKey: "idem-send-1",
      mirror: {
        sessionKey: "agent:main:slack:channel:C123",
      },
    });

    expect(mocks.deliverOutboundPayloads).toHaveBeenCalledWith(
      expect.objectContaining({
        mirror: expect.objectContaining({
          sessionKey: "agent:main:slack:channel:C123",
          text: "hi",
          idempotencyKey: "idem-send-1",
        }),
      }),
    );
  });

  it("recovers plugin resolution so message/send does not fail with Unknown channel", async () => {
    const matrixPlugin = {
      outbound: { deliveryMode: "direct" },
    };
    mocks.getChannelPlugin
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(matrixPlugin)
      .mockReturnValue(matrixPlugin);

    await expect(
      sendMessage({
        cfg: { channels: { matrix: { homeserver: "https://example.com" } } },
        channel: "matrix",
        to: "!room:example.com",
        content: "hi",
      }),
    ).resolves.toMatchObject({
      channel: "matrix",
      to: "!room:example.com",
      via: "direct",
    });

    expect(mocks.loadFoxClawPlugins).toHaveBeenCalledTimes(1);
  });
});
