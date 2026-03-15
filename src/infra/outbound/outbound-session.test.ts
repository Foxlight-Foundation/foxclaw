import { describe, expect, it } from "vitest";
import type { FoxClawConfig } from "../../config/config.js";
import { resolveOutboundSessionRoute } from "./outbound-session.js";

describe("resolveOutboundSessionRoute", () => {
  const baseConfig = {} as FoxClawConfig;

  it("resolves provider-specific session routes", async () => {
    const slackMpimCfg = {
      channels: {
        slack: {
          dm: {
            groupChannels: ["G123"],
          },
        },
      },
    } as FoxClawConfig;
    const cases: Array<{
      name: string;
      cfg: FoxClawConfig;
      channel: string;
      target: string;
      replyToId?: string;
      threadId?: string;
      expected: {
        sessionKey: string;
        from?: string;
        to?: string;
        threadId?: string | number;
        chatType?: "direct" | "group";
      };
    }> = [
      {
        name: "Slack thread",
        cfg: baseConfig,
        channel: "slack",
        target: "channel:C123",
        replyToId: "456",
        expected: {
          sessionKey: "agent:main:slack:channel:c123:thread:456",
          from: "slack:channel:C123",
          to: "channel:C123",
          threadId: "456",
        },
      },
      {
        name: "Slack mpim allowlist -> group key",
        cfg: slackMpimCfg,
        channel: "slack",
        target: "channel:G123",
        expected: {
          sessionKey: "agent:main:slack:group:g123",
          from: "slack:group:G123",
        },
      },
    ];

    for (const testCase of cases) {
      const route = await resolveOutboundSessionRoute({
        cfg: testCase.cfg,
        channel: testCase.channel,
        agentId: "main",
        target: testCase.target,
        replyToId: testCase.replyToId,
        threadId: testCase.threadId,
      });
      expect(route?.sessionKey, testCase.name).toBe(testCase.expected.sessionKey);
      if (testCase.expected.from !== undefined) {
        expect(route?.from, testCase.name).toBe(testCase.expected.from);
      }
      if (testCase.expected.to !== undefined) {
        expect(route?.to, testCase.name).toBe(testCase.expected.to);
      }
      if (testCase.expected.threadId !== undefined) {
        expect(route?.threadId, testCase.name).toBe(testCase.expected.threadId);
      }
      if (testCase.expected.chatType !== undefined) {
        expect(route?.chatType, testCase.name).toBe(testCase.expected.chatType);
      }
    }
  });
});
