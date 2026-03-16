import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelOutboundAdapter } from "../../channels/plugins/types.js";
import type { FoxClawConfig } from "../../config/config.js";
import { setActivePluginRegistry } from "../../plugins/runtime.js";
import { createOutboundTestPlugin, createTestRegistry } from "../../test-utils/channel-plugins.js";
import {
  clearDeliverTestRegistry,
  hookMocks,
  internalHookMocks,
  logMocks,
  mocks,
  queueMocks,
  resetDeliverTestMocks,
} from "./deliver.test-helpers.js";

const { deliverOutboundPayloads } = await import("./deliver.js");

function registerTestChannel(
  channelId: string,
  outbound: Partial<ChannelOutboundAdapter> & { sendText: ChannelOutboundAdapter["sendText"] },
) {
  setActivePluginRegistry(
    createTestRegistry([
      {
        pluginId: channelId,
        source: "test",
        plugin: createOutboundTestPlugin({
          id: channelId,
          outbound: { deliveryMode: "direct", ...outbound },
        }),
      },
    ]),
  );
}

function resetState() {
  setActivePluginRegistry(createTestRegistry([]));
  resetDeliverTestMocks({ includeSessionMocks: true });
}

function expectSuccessfulInternalHookPayload(
  channelId: string,
  to: string,
  expected: Partial<{
    content: string;
    messageId: string;
    isGroup: boolean;
    groupId: string;
  }>,
) {
  return expect.objectContaining({
    to,
    success: true,
    channelId,
    conversationId: to,
    ...expected,
  });
}

describe("deliverOutboundPayloads lifecycle", () => {
  beforeEach(() => {
    resetState();
  });

  afterEach(() => {
    clearDeliverTestRegistry();
  });

  it("continues on errors when bestEffort is enabled", async () => {
    const sendText = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ channel: "testchan", messageId: "m2" });
    registerTestChannel("testchan", { sendText });
    const onError = vi.fn();
    const results = await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "a" }, { text: "b" }],
      bestEffort: true,
      onError,
    });

    expect(sendText).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(results).toEqual([{ channel: "testchan", messageId: "m2" }]);
  });

  it("calls failDelivery instead of ackDelivery on bestEffort partial failure", async () => {
    const sendText = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ channel: "testchan", messageId: "m2" });
    registerTestChannel("testchan", { sendText });
    const onError = vi.fn();
    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "a" }, { text: "b" }],
      bestEffort: true,
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(queueMocks.ackDelivery).not.toHaveBeenCalled();
    expect(queueMocks.failDelivery).toHaveBeenCalledWith(
      "mock-queue-id",
      "partial delivery failure (bestEffort)",
    );
  });

  it("passes normalized payload to onError", async () => {
    const sendText = vi.fn().mockRejectedValue(new Error("boom"));
    registerTestChannel("testchan", { sendText });
    const onError = vi.fn();

    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "hi", mediaUrl: "https://x.test/a.jpg" }],
      bestEffort: true,
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ text: "hi", mediaUrls: ["https://x.test/a.jpg"] }),
    );
  });

  it("acks the queue entry when delivery is aborted", async () => {
    const sendText = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    registerTestChannel("testchan", { sendText });
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      deliverOutboundPayloads({
        cfg: {},
        channel: "testchan",
        to: "target1",
        payloads: [{ text: "a" }],
        abortSignal: abortController.signal,
      }),
    ).rejects.toThrow("Operation aborted");

    expect(queueMocks.ackDelivery).toHaveBeenCalledWith("mock-queue-id");
    expect(queueMocks.failDelivery).not.toHaveBeenCalled();
    expect(sendText).not.toHaveBeenCalled();
  });

  it("emits internal message:sent hook with success=true for chunked payload delivery", async () => {
    const sendText = vi
      .fn()
      .mockResolvedValueOnce({ channel: "testchan", messageId: "m1" })
      .mockResolvedValueOnce({ channel: "testchan", messageId: "m2" });
    registerTestChannel("testchan", {
      sendText,
      chunker: (text: string, limit: number) => {
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += limit) {
          chunks.push(text.slice(i, i + limit));
        }
        return chunks;
      },
      textChunkLimit: 2,
    });

    await deliverOutboundPayloads({
      cfg: { channels: { testchan: { textChunkLimit: 2 } } },
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "abcd" }],
      mirror: {
        sessionKey: "agent:main:main",
        isGroup: true,
        groupId: "testchan:group:123",
      },
    });

    expect(sendText).toHaveBeenCalledTimes(2);
    expect(internalHookMocks.createInternalHookEvent).toHaveBeenCalledTimes(1);
    expect(internalHookMocks.createInternalHookEvent).toHaveBeenCalledWith(
      "message",
      "sent",
      "agent:main:main",
      expectSuccessfulInternalHookPayload("testchan", "target1", {
        content: "abcd",
        messageId: "m2",
        isGroup: true,
        groupId: "testchan:group:123",
      }),
    );
    expect(internalHookMocks.triggerInternalHook).toHaveBeenCalledTimes(1);
  });

  it("does not emit internal message:sent hook when neither mirror nor sessionKey is provided", async () => {
    const sendText = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    registerTestChannel("testchan", { sendText });

    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "hello" }],
    });

    expect(internalHookMocks.createInternalHookEvent).not.toHaveBeenCalled();
    expect(internalHookMocks.triggerInternalHook).not.toHaveBeenCalled();
  });

  it("emits internal message:sent hook when sessionKey is provided without mirror", async () => {
    const sendText = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    registerTestChannel("testchan", { sendText });

    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "hello" }],
      session: { key: "agent:main:main" },
    });

    expect(internalHookMocks.createInternalHookEvent).toHaveBeenCalledTimes(1);
    expect(internalHookMocks.createInternalHookEvent).toHaveBeenCalledWith(
      "message",
      "sent",
      "agent:main:main",
      expectSuccessfulInternalHookPayload("testchan", "target1", {
        content: "hello",
        messageId: "m1",
      }),
    );
    expect(internalHookMocks.triggerInternalHook).toHaveBeenCalledTimes(1);
  });

  it("warns when session.agentId is set without a session key", async () => {
    const sendText = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    registerTestChannel("testchan", { sendText });
    hookMocks.runner.hasHooks.mockReturnValue(true);

    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "hello" }],
      session: { agentId: "agent-main" },
    });

    expect(logMocks.warn).toHaveBeenCalledWith(
      "deliverOutboundPayloads: session.agentId present without session key; internal message:sent hook will be skipped",
      expect.objectContaining({ channel: "testchan", to: "target1", agentId: "agent-main" }),
    );
  });

  it("mirrors delivered output when mirror options are provided", async () => {
    const sendText = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    const sendMedia = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    registerTestChannel("testchan", { sendText, sendMedia });

    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "caption", mediaUrl: "https://example.com/files/report.pdf?sig=1" }],
      mirror: {
        sessionKey: "agent:main:main",
        text: "caption",
        mediaUrls: ["https://example.com/files/report.pdf?sig=1"],
        idempotencyKey: "idem-deliver-1",
      },
    });

    expect(mocks.appendAssistantMessageToSessionTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "report.pdf",
        idempotencyKey: "idem-deliver-1",
      }),
    );
  });

  it("emits message_sent success for text-only deliveries", async () => {
    hookMocks.runner.hasHooks.mockReturnValue(true);
    const sendText = vi.fn().mockResolvedValue({ channel: "testchan", messageId: "m1" });
    registerTestChannel("testchan", { sendText });

    await deliverOutboundPayloads({
      cfg: {},
      channel: "testchan",
      to: "target1",
      payloads: [{ text: "hello" }],
    });

    expect(hookMocks.runner.runMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({ to: "target1", content: "hello", success: true }),
      expect.objectContaining({ channelId: "testchan" }),
    );
  });

  it("emits message_sent success for sendPayload deliveries", async () => {
    hookMocks.runner.hasHooks.mockReturnValue(true);
    const sendPayload = vi.fn().mockResolvedValue({ channel: "matrix", messageId: "mx-1" });
    const sendText = vi.fn();
    const sendMedia = vi.fn();
    setActivePluginRegistry(
      createTestRegistry([
        {
          pluginId: "matrix",
          source: "test",
          plugin: createOutboundTestPlugin({
            id: "matrix",
            outbound: { deliveryMode: "direct", sendPayload, sendText, sendMedia },
          }),
        },
      ]),
    );

    await deliverOutboundPayloads({
      cfg: {},
      channel: "matrix",
      to: "!room:1",
      payloads: [{ text: "payload text", channelData: { mode: "custom" } }],
    });

    expect(hookMocks.runner.runMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({ to: "!room:1", content: "payload text", success: true }),
      expect.objectContaining({ channelId: "matrix" }),
    );
  });

  it("emits message_sent failure when delivery errors", async () => {
    hookMocks.runner.hasHooks.mockReturnValue(true);
    const sendText = vi.fn().mockRejectedValue(new Error("downstream failed"));
    registerTestChannel("testchan", { sendText });

    await expect(
      deliverOutboundPayloads({
        cfg: {},
        channel: "testchan",
        to: "target1",
        payloads: [{ text: "hi" }],
      }),
    ).rejects.toThrow("downstream failed");

    expect(hookMocks.runner.runMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "target1",
        content: "hi",
        success: false,
        error: "downstream failed",
      }),
      expect.objectContaining({ channelId: "testchan" }),
    );
  });
});
