import { vi } from "vitest";
import { loadModelCatalog } from "../agents/model-catalog.js";
import { runEmbeddedPiAgent } from "../agents/pi-embedded.js";
import { runSubagentAnnounceFlow } from "../agents/subagent-announce.js";
import { callGateway } from "../gateway/call.js";
import { setActivePluginRegistry } from "../plugins/runtime.js";
import {
  createOutboundTestPlugin,
  createTestRegistry,
} from "../test-utils/channel-plugins.js";

export function setupIsolatedAgentTurnMocks(params?: { fast?: boolean }): void {
  if (params?.fast) {
    vi.stubEnv("FOXCLAW_TEST_FAST", "1");
  }
  vi.mocked(runEmbeddedPiAgent).mockReset();
  vi.mocked(loadModelCatalog).mockResolvedValue([]);
  vi.mocked(runSubagentAnnounceFlow).mockReset().mockResolvedValue(true);
  vi.mocked(callGateway).mockReset().mockResolvedValue({ ok: true, deleted: true });
  setActivePluginRegistry(
    createTestRegistry([
      {
        pluginId: "slack",
        source: "test",
        plugin: createOutboundTestPlugin({
          id: "slack",
          label: "Slack",
          outbound: {
            deliveryMode: "direct",
            sendText: async (ctx) => {
              const sendFn =
                (ctx.deps as Record<string, unknown>)?.sendSlack ??
                (ctx.deps as Record<string, unknown>)?.slack ??
                (ctx.deps as Record<string, unknown>)?.sendMessageSlack;
              if (typeof sendFn === "function") {
                await (sendFn as Function)(ctx.to, ctx.text, {
                  messageThreadId: ctx.threadId,
                  accountId: ctx.accountId,
                  cfg: ctx.cfg,
                });
              }
              return {
                channel: "slack" as const,
                messageId: `slack-${Date.now()}`,
                chatId: ctx.to,
              };
            },
          },
        }),
      },
    ]),
  );
}
