import { describe, expect, it } from "vitest";
import type { FoxClawConfig } from "../config/config.js";
import { getChannelDock } from "./dock.js";

describe("channels dock", () => {
  it("slack dock config readers stay read-only when tokens are unresolved SecretRefs", () => {
    const slackDock = getChannelDock("slack");
    const cfg = {
      channels: {
        slack: {
          botToken: {
            source: "env",
            provider: "default",
            id: "SLACK_BOT_TOKEN",
          },
          appToken: {
            source: "env",
            provider: "default",
            id: "SLACK_APP_TOKEN",
          },
          defaultTo: "channel:C111",
          dm: { allowFrom: ["U123"] },
          channels: {
            C111: { requireMention: false },
          },
          replyToMode: "all",
        },
      },
    } as unknown as FoxClawConfig;

    expect(slackDock?.config?.resolveAllowFrom?.({ cfg, accountId: "default" })).toEqual(["U123"]);
    expect(slackDock?.config?.resolveDefaultTo?.({ cfg, accountId: "default" })).toBe(
      "channel:C111",
    );
    expect(
      slackDock?.threading?.resolveReplyToMode?.({
        cfg,
        accountId: "default",
        chatType: "channel",
      }),
    ).toBe("all");
    expect(
      slackDock?.groups?.resolveRequireMention?.({
        cfg,
        accountId: "default",
        groupId: "C111",
      }),
    ).toBe(false);
  });
});
